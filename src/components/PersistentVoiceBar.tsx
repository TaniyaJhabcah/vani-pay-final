import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { voiceAssistant } from '../services/voiceAssistant';
import { VoiceState } from '../types';
import { VoiceOrb } from './VoiceOrb';

interface PersistentVoiceBarProps {
  onOpenOverlay: () => void;
}

export const PersistentVoiceBar: React.FC<PersistentVoiceBarProps> = ({ onOpenOverlay }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcriptPreview, setTranscriptPreview] = useState('');

  useEffect(() => {
    const unsubState = voiceAssistant.subscribeState((st) => setVoiceState(st));
    const unsubTr = voiceAssistant.subscribeTranscript((tr) => setTranscriptPreview(tr));
    return () => {
      unsubState();
      unsubTr();
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenOverlay}
        className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#060b18]/90 hover:bg-[#081022]/95 border border-white/[0.12] hover:border-[#00ff87]/50 shadow-[0_0_25px_rgba(0,255,136,0.12)] backdrop-blur-2xl text-slate-100 transition-all max-w-md w-full justify-between group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Mini Animated Voice Orb */}
          <div className="shrink-0 flex items-center justify-center">
            <VoiceOrb state={voiceState} size="sm" interactive={false} />
          </div>

          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-white truncate group-hover:text-[#00ff87] transition-colors">
              {voiceState === 'listening'
                ? transcriptPreview || 'Listening to your voice...'
                : voiceState === 'speaking'
                ? 'Vani is speaking...'
                : voiceState === 'processing'
                ? 'Interpreting speech...'
                : 'Tap to Speak with Vani'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate">
              {voiceState === 'listening'
                ? 'Say "Pay ₹500 to Rahul"'
                : '● VANI AUDIO ENGINE READY'}
            </span>
          </div>
        </div>

        <span className="shrink-0 px-3 py-1 rounded-full bg-[#00ff87]/15 text-[#00ff87] text-[11px] font-mono font-bold border border-[#00ff87]/30 group-hover:shadow-[0_0_10px_rgba(0,255,136,0.3)] transition-all">
          SPEAK
        </span>
      </motion.button>
    </div>
  );
};
