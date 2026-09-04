import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Terminal, ChevronDown, ChevronUp, Send, Sparkles, RefreshCw } from 'lucide-react';
import { VoiceOrb } from './VoiceOrb';
import { voiceAssistant } from '../services/voiceAssistant';
import { VoiceDebugLog, VoiceState } from '../types';

interface VoiceListeningOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandParsed: (commandText: string) => void;
  initialPrompt?: string;
}

const FLOW_STAGES = [
  { step: 1, label: 'SPEAK' },
  { step: 2, label: 'UNDERSTAND' },
  { step: 3, label: 'VERIFY' },
  { step: 4, label: 'CONFIRM' },
  { step: 5, label: 'SUCCESS' },
];

const SUGGESTION_CHIPS = [
  'Vani, pay ₹500 to Taniya',
  'Vani, pay ₹500 to Rahul',
  'Pay ₹50 to Sarah Miller',
  'Transfer ₹2000 for dinner',
  'Send ₹300 to Priya Sen',
  'Pay ₹150 for Starbucks Coffee',
];

export const VoiceListeningOverlay: React.FC<VoiceListeningOverlayProps> = ({
  isOpen,
  onClose,
  onCommandParsed,
  initialPrompt = "I'm listening to your voice.",
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isFinalTranscript, setIsFinalTranscript] = useState(false);
  const [debugLogs, setDebugLogs] = useState<VoiceDebugLog[]>([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const lastProcessedTextRef = useRef<string>('');

  // Subscribe to voice assistant state, transcript, and debug updates
  useEffect(() => {
    const unsubState = voiceAssistant.subscribeState((st) => {
      setVoiceState(st);
    });

    const unsubTranscript = voiceAssistant.subscribeTranscript((tr, isFinal) => {
      setLiveTranscript(tr);
      setIsFinalTranscript(isFinal);

      const cleaned = tr.trim();
      if (isFinal && cleaned.length > 2 && cleaned !== lastProcessedTextRef.current) {
        lastProcessedTextRef.current = cleaned;
        setTimeout(() => {
          onCommandParsed(cleaned);
        }, 300);
      }
    });

    const unsubDebug = voiceAssistant.subscribeDebug((logs) => {
      setDebugLogs([...logs]);
    });

    return () => {
      unsubState();
      unsubTranscript();
      unsubDebug();
    };
  }, [onCommandParsed]);

  // When overlay opens: Speak initial prompt and then automatically start mic listening
  useEffect(() => {
    if (isOpen) {
      setLiveTranscript('');
      setIsFinalTranscript(false);
      lastProcessedTextRef.current = '';

      // Standard Vani voice sequence:
      // [TTS_STARTED] -> Vani speaks -> [TTS_ENDED] -> 250ms echo guard -> [MIC_REQUESTED] -> [MIC_STARTED]
      voiceAssistant.speak(initialPrompt, {
        listenAfterSpeaking: true,
      });
    } else {
      voiceAssistant.stopListening();
    }
  }, [isOpen, initialPrompt]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput.trim();
    setManualInput('');
    voiceAssistant.stopListening();
    onCommandParsed(text);
  };

  const handleSuggestionClick = (cmd: string) => {
    setLiveTranscript(cmd);
    setIsFinalTranscript(true);
    voiceAssistant.stopListening();
    onCommandParsed(cmd);
  };

  const handleOrbClick = () => {
    if (voiceState === 'listening') {
      voiceAssistant.stopListening();
    } else {
      voiceAssistant.startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060e]/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-[#060b18]/90 border border-white/[0.09] rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,255,136,0.08)] overflow-hidden flex flex-col items-center text-center"
        >
          {/* Subtle Ambient Radial Lighting Inside Dialog */}
          <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-[#00ff87]/12 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => {
              voiceAssistant.cancelAll();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-20"
            aria-label="Close Voice Assistant"
          >
            <X size={20} />
          </button>

          {/* TOP: 1. SPEAK → 2. UNDERSTAND → 3. VERIFY → 4. CONFIRM → 5. SUCCESS */}
          <div className="w-full flex items-center justify-center gap-1 sm:gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {FLOW_STAGES.map((s, idx) => {
              const isActive = s.step === 1; // Stage 1 SPEAK is active in this view
              return (
                <React.Fragment key={s.step}>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono tracking-wider transition-all ${
                      isActive
                        ? 'bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/60 shadow-[0_0_15px_rgba(0,255,136,0.4)] font-bold'
                        : 'bg-white/[0.03] text-slate-400 border border-white/[0.05]'
                    }`}
                  >
                    <span>{s.step}.</span>
                    <span>{s.label}</span>
                  </div>
                  {idx < FLOW_STAGES.length - 1 && (
                    <span className="text-slate-600 text-xs select-none">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* STATUS: ● VANI AUDIO ENGINE ACTIVE */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87] shadow-[0_0_8px_#00ff87] animate-pulse" />
            <span>● VANI AUDIO ENGINE ACTIVE</span>
          </div>

          {/* TITLE: Listening to your voice... */}
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
            {voiceState === 'speaking'
              ? "I'm listening to your voice."
              : voiceState === 'listening'
              ? 'Listening to your voice...'
              : voiceState === 'processing'
              ? 'Interpreting voice command...'
              : voiceState === 'error'
              ? 'Audio Hardware Required'
              : 'Listening to your voice...'}
          </h2>

          {/* DARK GLASS TRANSCRIPT CONTAINER: LIVE SPEECH TRANSCRIPT */}
          <div className="w-full max-w-md px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] min-h-[56px] flex items-center justify-center text-center mb-3">
            {liveTranscript ? (
              <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5"
              >
                <span
                  className={`text-sm sm:text-base font-semibold tracking-wide ${
                    isFinalTranscript
                      ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                      : 'text-[#00ff87]'
                  }`}
                >
                  "{liveTranscript}"
                </span>
                {!isFinalTranscript && (
                  <span className="inline-block w-1.5 h-4 bg-[#00ff87] animate-pulse shadow-[0_0_8px_#00ff87]" />
                )}
              </motion.div>
            ) : (
              <span className="text-slate-300 text-sm sm:text-base font-medium">
                "{initialPrompt === "I'm listening to your voice." ? 'Vani pay RS 5000 to Pihu' : initialPrompt}"
              </span>
            )}
          </div>

          {/* THE VOICE ORB: Signature organic green energy form */}
          <div className="my-1 sm:my-2 cursor-pointer" onClick={handleOrbClick}>
            <VoiceOrb state={voiceState} size="hero" onClick={handleOrbClick} />
          </div>

          {/* LABEL BELOW THE ORB: Tap orb or select a suggestion */}
          <p className="text-xs text-slate-400 font-medium tracking-wide my-2">
            Tap orb or select a suggestion
          </p>

          {/* QUICK COMMAND CHIPS: Exact commands as reference */}
          <div className="w-full max-w-md flex flex-wrap gap-2 justify-center mb-3">
            {SUGGESTION_CHIPS.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(cmd)}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#00ff87]/15 border border-white/[0.08] hover:border-[#00ff87]/50 text-xs text-slate-200 hover:text-white transition-all text-center shadow-sm"
              >
                <span>"{cmd}"</span>
              </button>
            ))}
          </div>

          {/* MANUAL INPUT FALLBACK */}
          <form onSubmit={handleManualSubmit} className="w-full max-w-md flex gap-2 mt-2 mb-1">
            <input
              type="text"
              placeholder="Or type voice command (e.g. Pay 500 to Rahul)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-100 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-[#00ff87]/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold text-xs transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Send size={15} />
            </button>
          </form>

          {/* LIVE DEBUG TELEMETRY ACCORDION */}
          <div className="w-full max-w-md border-t border-white/[0.06] pt-2.5 mt-2">
            <button
              onClick={() => setShowDebugConsole(!showDebugConsole)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1"
            >
              <div className="flex items-center gap-1.5 font-mono">
                <Terminal size={13} className="text-violet-400" />
                <span>Voice Engine Telemetry ({debugLogs.length} events)</span>
              </div>
              {showDebugConsole ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDebugConsole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 w-full max-h-40 overflow-y-auto rounded-xl bg-black/80 border border-white/[0.08] p-2.5 text-left font-mono text-[10px] space-y-1"
              >
                {debugLogs.length === 0 ? (
                  <p className="text-slate-600 italic">No voice events recorded yet.</p>
                ) : (
                  debugLogs.map((log) => {
                    const eventColor = log.isError
                      ? 'text-rose-400'
                      : log.event === 'MIC_STARTED'
                      ? 'text-[#00ff87] font-bold'
                      : log.event === 'TTS_STARTED'
                      ? 'text-cyan-300 font-bold'
                      : log.event === 'MIC_RESULT'
                      ? 'text-amber-300 font-bold'
                      : 'text-slate-300';

                    return (
                      <div key={log.id} className="flex gap-2 leading-tight">
                        <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                        <span className={`shrink-0 ${eventColor}`}>[{log.event}]</span>
                        <span className="text-slate-300 break-all">{log.details}</span>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
