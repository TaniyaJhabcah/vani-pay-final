import { ParsedVoiceCommand, VoiceDebugEvent, VoiceDebugLog, VoiceState } from '../types';

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

type DebugListener = (logs: VoiceDebugLog[]) => void;
type StateListener = (state: VoiceState) => void;
type TranscriptListener = (transcript: string, isFinal: boolean) => void;

class VoiceAssistantService {
  private recognition: any = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isListening = false;
  private isStartingMic = false;
  private shouldKeepListening = false;
  private currentState: VoiceState = 'idle';
  private debugLogs: VoiceDebugLog[] = [];
  private debugListeners: Set<DebugListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private transcriptListeners: Set<TranscriptListener> = new Set();
  private lastTtsSpokenText = '';
  private micEchoGuardTimer: any = null;
  private silenceTimer: any = null;
  private hasMicPermission = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Warm up synthesis voices
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          // Voices loaded in browser
        };
      }
    }
  }

  // --- Observability & Debugging ---
  public logDebug(event: VoiceDebugEvent, details?: string, isError = false) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });

    const entry: VoiceDebugLog = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      event,
      details,
      isError,
    };

    this.debugLogs = [entry, ...this.debugLogs].slice(0, 50);

    // Console logging with high visibility styling
    const badgeColor = isError ? '#EF4444' : '#10B981';
    console.log(
      `%c[VANI PAY] %c${event}%c ${details ? '— ' + details : ''}`,
      'color: #6366F1; font-weight: bold',
      `background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px`,
      'color: inherit'
    );

    this.notifyDebugListeners();
  }

  public getLogs(): VoiceDebugLog[] {
    return this.debugLogs;
  }

  public clearLogs() {
    this.debugLogs = [];
    this.notifyDebugListeners();
  }

  public subscribeDebug(listener: DebugListener): () => void {
    this.debugListeners.add(listener);
    listener(this.debugLogs);
    return () => this.debugListeners.delete(listener);
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => this.stateListeners.delete(listener);
  }

  public subscribeTranscript(listener: TranscriptListener): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  private setState(state: VoiceState) {
    this.currentState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  private notifyDebugListeners() {
    this.debugListeners.forEach((l) => l([...this.debugLogs]));
  }

  private notifyTranscript(transcript: string, isFinal: boolean) {
    this.transcriptListeners.forEach((l) => l(transcript, isFinal));
  }

  // --- Sound Earcons (Web Audio API Synthesizer) ---
  public playEarcon(type: 'prompt' | 'listening' | 'success' | 'cancel') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'listening') {
        // Double soft ascending beep (440Hz -> 880Hz) to signal mic is now live
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        // Pleasant chime (C6 - G6)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio context might be restricted before first gesture; safe to ignore
    }
  }

  // --- Step 1 & 2: Speech Synthesis (TTS) with Robust Lifecycle ---
  public speak(
    text: string,
    options: {
      onComplete?: () => void;
      listenAfterSpeaking?: boolean;
    } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.logDebug('MIC_ERROR', 'speechSynthesis not supported in browser', true);
        if (options.listenAfterSpeaking) {
          this.startListening();
        }
        resolve();
        return;
      }

      // CRITICAL: Stop microphone immediately before speaking so mic never hears TTS prompt
      this.stopListeningInternal(false);

      // Cancel any ongoing or stuck utterances and resume audio context
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }

      if (this.micEchoGuardTimer) {
        clearTimeout(this.micEchoGuardTimer);
        this.micEchoGuardTimer = null;
      }

      this.isSpeaking = true;
      this.lastTtsSpokenText = text.toLowerCase().trim();
      this.setState('speaking');
      this.logDebug('TTS_STARTED', `Prompt: "${text}"`);

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;

      // Retain utterance in global window Set to prevent Chromium garbage-collection bug!
      if (typeof window !== 'undefined') {
        const win = window as any;
        win.__vaniUtterances = win.__vaniUtterances || new Set();
        win.__vaniUtterances.add(utterance);
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Friendly, clear pitch for Vani

      // Try to select an English Indian voice if available, else standard English
      const voices = window.speechSynthesis.getVoices();
      const inVoice =
        voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India')) ||
        voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google')) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (inVoice) {
        utterance.voice = inVoice;
      }

      const finishTTS = () => {
        if (!this.isSpeaking) return;
        this.isSpeaking = false;
        this.activeUtterance = null;

        // Clean up global GC set
        if (typeof window !== 'undefined') {
          const win = window as any;
          if (win.__vaniUtterances) {
            win.__vaniUtterances.delete(utterance);
          }
        }

        this.logDebug('TTS_ENDED', `Finished speaking prompt`);

        if (options.onComplete) {
          options.onComplete();
        }

        if (options.listenAfterSpeaking) {
          // CRITICAL: Wait approximately 250ms after TTS ends to prevent the tail of Vani's audio from being captured
          this.micEchoGuardTimer = setTimeout(() => {
            this.micEchoGuardTimer = null;
            this.startListening();
          }, 250);
        } else {
          this.setState('idle');
        }
        resolve();
      };

      utterance.onend = () => {
        finishTTS();
      };

      utterance.onerror = (e) => {
        // If canceled intentionally, do not mark as hard error
        if (e.error === 'interrupted' || e.error === 'canceled') {
          this.logDebug('TTS_ENDED', `Utterance canceled`);
        } else {
          this.logDebug('TTS_ENDED', `TTS error: ${e.error}`, true);
        }
        finishTTS();
      };

      // Speak in browser
      window.speechSynthesis.speak(utterance);

      // Failsafe timeout for Chrome speech synthesis getting stuck without firing onend
      // (Approximate word count / 2 words per sec + 4s buffer)
      const wordCount = text.split(' ').length;
      const maxDurationMs = Math.max(3000, (wordCount / 2.5) * 1000 + 3500);
      setTimeout(() => {
        if (this.isSpeaking && this.activeUtterance === utterance) {
          window.speechSynthesis.cancel();
          finishTTS();
        }
      }, maxDurationMs);
    });
  }

  // --- Step 3, 4, 5: Speech Recognition (Microphone) with Safe Lifecycle ---
  public async startListening(): Promise<boolean> {
    const customWindow = window as unknown as IWindow;
    const SpeechRecognitionAPI =
      customWindow.SpeechRecognition || customWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.logDebug(
        'MIC_ERROR',
        'Web Speech API SpeechRecognition is not supported in this browser. Try Google Chrome.',
        true
      );
      this.setState('error');
      return false;
    }

    // Do NOT start microphone while Vani is still actively speaking
    if (this.isSpeaking) {
      this.logDebug('MIC_REQUESTED', 'Blocked: Vani is currently speaking. Waiting for TTS_ENDED.');
      return false;
    }

    // Prevent duplicate instances
    if (this.isListening || this.isStartingMic) {
      this.logDebug('MIC_REQUESTED', 'Microphone is already active or initializing.');
      return true;
    }

    this.isStartingMic = true;
    this.shouldKeepListening = true;
    this.logDebug('MIC_REQUESTED', 'Checking microphone permission and initiating SpeechRecognition...');

    // Clean up previous instance if any
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }

    if (typeof navigator !== 'undefined' && navigator.permissions && (navigator.permissions as any).query) {
      try {
        const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (perm.state === 'denied') {
          this.isStartingMic = false;
          this.shouldKeepListening = false;
          this.logDebug('MIC_ERROR', 'Microphone permission was denied by browser settings. Please allow microphone access.', true);
          this.setState('error');
          return false;
        }
      } catch {
        // Permissions query may not be supported for microphone in some browsers
      }
    }

    try {
      const rec = new SpeechRecognitionAPI();
      this.recognition = rec;

      // Settings tuned for natural conversational voice commands
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      // en-IN allows recognition of Indian names, currency terms like "rupees" and "lakh", and Indian accents
      rec.lang = 'en-IN';

      rec.onstart = () => {
        this.isStartingMic = false;
        this.isListening = true;
        this.setState('listening');
        this.playEarcon('listening');
        this.logDebug('MIC_STARTED', 'Microphone is active and listening for user commands.');
        this.notifyTranscript('', false);
      };

      rec.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptPart = res[0]?.transcript || '';
          if (res.isFinal) {
            finalText += transcriptPart;
          } else {
            interimText += transcriptPart;
          }
        }

        const candidateText = (finalText || interimText).trim();

        // STEP 4 & 5: Self-Echo Filtering Check
        // If the captured text matches Vani's own previous prompt, discard it!
        if (
          this.lastTtsSpokenText &&
          candidateText.length > 3 &&
          (this.lastTtsSpokenText.includes(candidateText.toLowerCase()) ||
            candidateText.toLowerCase().includes(this.lastTtsSpokenText))
        ) {
          console.warn('[Vani] Filtered out self-echoed TTS phrase:', candidateText);
          return;
        }

        if (candidateText) {
          this.notifyTranscript(candidateText, !!finalText);
        }

        if (finalText) {
          const conf = event.results[event.resultIndex]?.[0]?.confidence;
          const confStr = conf !== undefined ? ` (confidence: ${(conf * 100).toFixed(0)}%)` : '';
          this.logDebug('MIC_RESULT', `User said: "${finalText}"${confStr}`);
          this.resetSilenceTimer();
        }
      };

      rec.onerror = (event: any) => {
        const errorType = event.error;

        // 'no-speech' is normal when user is thinking or pauses; do not break system
        if (errorType === 'no-speech') {
          this.logDebug('MIC_ERROR', 'no-speech detected (waiting for user voice)');
          return;
        }

        if (errorType === 'aborted') {
          this.logDebug('MIC_ERROR', 'Recognition aborted or superseded');
          return;
        }

        let errMsg = `SpeechRecognition error: ${errorType}`;
        if (errorType === 'not-allowed') {
          errMsg = 'Microphone access denied. Please click the camera/mic icon in the browser address bar to allow microphone access.';
          this.shouldKeepListening = false;
          this.setState('error');
        } else if (errorType === 'audio-capture') {
          errMsg = 'Microphone hardware capture failed. Please check that your microphone is plugged in and not in use by another app.';
          this.shouldKeepListening = false;
          this.setState('error');
        } else if (errorType === 'network') {
          errMsg = 'Speech recognition network error. Please check your internet connection.';
          this.setState('error');
        } else {
          this.setState('error');
        }

        this.logDebug('MIC_ERROR', errMsg, true);
      };

      rec.onend = () => {
        this.isListening = false;
        this.isStartingMic = false;
        this.recognition = null;
        this.logDebug('MIC_ENDED', 'Microphone session ended');

        // Automatic seamless recovery: if still intended to listen, and Vani is not speaking
        if (this.shouldKeepListening && !this.isSpeaking && (this.currentState === 'listening' || this.currentState === 'idle')) {
          setTimeout(() => {
            if (this.shouldKeepListening && !this.isSpeaking && !this.isListening) {
              this.startListening();
            }
          }, 350);
        } else if (!this.isSpeaking && this.currentState === 'listening') {
          this.setState('idle');
        }
      };

      rec.start();
      return true;
    } catch (err: any) {
      this.isStartingMic = false;
      this.recognition = null;
      this.logDebug('MIC_ERROR', `Failed to start recognition: ${err?.message || err}`, true);
      this.setState('error');
      return false;
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      // Optional: keep listening or process
    }, 4000);
  }

  // --- Step 8: Natural Language Command Parsing ---
  public parseCommand(raw: string): ParsedVoiceCommand {
    const text = raw.toLowerCase().trim();

    // 1. Check for cancel / stop
    if (text.includes('cancel') || text.includes('stop') || text.includes('dismiss') || text.includes('close')) {
      return {
        intent: 'cancel',
        confidence: 0.98,
        rawText: raw,
      };
    }

    // 2. Check for payment confirmation
    if (
      text.includes('confirm') ||
      text.includes('proceed') ||
      text.includes('yes') ||
      text.includes('pay now') ||
      text.includes('authorize') ||
      text.includes('approve') ||
      text === 'ok' ||
      text === 'okay'
    ) {
      return {
        intent: 'confirm_payment',
        confidence: 0.95,
        rawText: raw,
      };
    }

    // 3. Check for balance inquiry
    if (
      text.includes('balance') ||
      text.includes('how much money') ||
      text.includes('account balance') ||
      text.includes('check balance')
    ) {
      return {
        intent: 'check_balance',
        confidence: 0.95,
        rawText: raw,
      };
    }

    // 4. Check for transactions / history
    if (
      text.includes('transaction') ||
      text.includes('history') ||
      text.includes('recent payment') ||
      text.includes('statement') ||
      text.includes('passbook')
    ) {
      return {
        intent: 'show_transactions',
        confidence: 0.92,
        rawText: raw,
      };
    }

    // 5. Check for bill payment
    if (
      text.includes('bill') ||
      text.includes('electricity') ||
      text.includes('water') ||
      text.includes('wifi') ||
      text.includes('broadband')
    ) {
      let billType = 'Electricity';
      if (text.includes('wifi') || text.includes('broadband') || text.includes('internet')) billType = 'Broadband';
      if (text.includes('water')) billType = 'Water';
      if (text.includes('mobile') || text.includes('recharge')) billType = 'Mobile Recharge';

      return {
        intent: 'pay_bill',
        billType,
        confidence: 0.9,
        rawText: raw,
      };
    }

    // 6. Navigation commands
    if (text.includes('wallet') || text.includes('bank account') || text.includes('cards')) {
      return {
        intent: 'navigate',
        targetView: 'wallet',
        confidence: 0.9,
        rawText: raw,
      };
    }

    if (text.includes('insight') || text.includes('analytics') || text.includes('spend')) {
      return {
        intent: 'navigate',
        targetView: 'insights',
        confidence: 0.9,
        rawText: raw,
      };
    }

    if (text.includes('setting') || text.includes('security') || text.includes('profile')) {
      return {
        intent: 'navigate',
        targetView: 'settings',
        confidence: 0.9,
        rawText: raw,
      };
    }

    if (text.includes('home') || text.includes('dashboard')) {
      return {
        intent: 'navigate',
        targetView: 'home',
        confidence: 0.9,
        rawText: raw,
      };
    }

    // 7. Check for Send / Pay money
    // Regex matches patterns like:
    // "pay 500 to priya"
    // "vani pay rs 5000 to pihu"
    // "send 1200 rupees to rohit"
    // "transfer 2000 for dinner"
    // "pay 150 for starbucks coffee"
    const amountRegex = /(?:rs\.?|inr|rupees?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:rs\.?|inr|rupees?)?/i;
    const sendKeywords = ['pay', 'send', 'transfer', 'give'];
    const hasSendKeyword = sendKeywords.some((kw) => text.includes(kw));

    if (hasSendKeyword) {
      // Try to extract amount
      let amount: number | undefined;
      const amountMatch = text.match(amountRegex);
      if (amountMatch && amountMatch[1]) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }

      // Try to extract recipient name
      let recipientName: string | undefined;
      // Check pattern: "to <name>" or "for <name>" (e.g., "to rahul", "to priya sen", "to pihu", "for starbucks coffee", "for dinner")
      const toMatch = text.match(/(?:to|for)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
      if (toMatch && toMatch[1]) {
        // Strip common non-name words like 'rupees', 'rs', 'my', 'his', 'her'
        const candidate = toMatch[1].replace(/\b(rupees?|rs|inr|account|bank)\b/gi, '').trim();
        if (candidate) {
          recipientName = candidate;
        }
      }

      if (!recipientName) {
        // Pattern: "pay <name> <amount>" or "send <name> <amount>"
        const payNameMatch = text.match(/(?:pay|send|transfer|give)\s+([a-zA-Z]+)/i);
        if (payNameMatch && payNameMatch[1] && isNaN(Number(payNameMatch[1]))) {
          const candidate = payNameMatch[1].trim();
          if (!['rs', 'rupee', 'rupees', 'inr', 'money', 'to', 'vani'].includes(candidate.toLowerCase())) {
            recipientName = candidate;
          }
        }
      }

      if (amount || recipientName) {
        return {
          intent: 'send_money',
          amount,
          recipientName,
          confidence: 0.88,
          rawText: raw,
        };
      }
    }

    return {
      intent: 'unknown',
      confidence: 0.3,
      rawText: raw,
    };
  }

  // --- Stop and Teardown ---
  private stopListeningInternal(resetState = true) {
    this.shouldKeepListening = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.isStartingMic = false;
    if (resetState) {
      this.setState('idle');
    }
  }

  public stopListening() {
    this.stopListeningInternal(true);
    this.logDebug('MIC_ENDED', 'Microphone stopped by user or flow completion');
  }

  public cancelAll() {
    if (this.micEchoGuardTimer) clearTimeout(this.micEchoGuardTimer);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.activeUtterance = null;
    this.stopListeningInternal(true);
    this.setState('idle');
    this.playEarcon('cancel');
  }
}

// Export singleton instance
export const voiceAssistant = new VoiceAssistantService();
