import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, ShieldCheck, Lock } from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';

interface VoiceKeySecurityProps {
  passphrase?: string;
  onAuthorized: () => void;
}

export const VoiceKeySecurity: React.FC<VoiceKeySecurityProps> = ({
  passphrase = 'Authorize Vani',
  onAuthorized,
}) => {
  const [matched, setMatched] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const unsubTr = voiceAssistant.subscribeTranscript((tr, isFinal) => {
      setTranscript(tr);
      if (tr.toLowerCase().includes('authorize') || tr.toLowerCase().includes('vani')) {
        setMatched(true);
        setTimeout(onAuthorized, 400);
      }
    });

    return () => unsubTr();
  }, [onAuthorized]);

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
        <Mic size={22} className="animate-pulse" />
      </div>
      <h4 className="text-xs font-bold text-white mb-1">Voice Passphrase Security</h4>
      <p className="text-[11px] text-slate-400 mb-2">
        Say <span className="text-indigo-300 font-semibold">"{passphrase}"</span> to verify
      </p>

      {transcript && (
        <p className="text-xs text-emerald-300 italic">
          "{transcript}"
        </p>
      )}
    </div>
  );
};
