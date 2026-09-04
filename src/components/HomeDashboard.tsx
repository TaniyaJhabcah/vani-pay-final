import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Zap,
  ChevronRight,
  Shield,
  Clock,
  Utensils,
  Coffee,
  KeyRound,
  Lock,
} from 'lucide-react';
import { BankAccount, Contact, Transaction, UserProfile, VoiceState } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { voiceAssistant } from '../services/voiceAssistant';

interface HomeDashboardProps {
  user: UserProfile;
  accounts: BankAccount[];
  contacts: Contact[];
  transactions: Transaction[];
  onOpenVoice: () => void;
  onInitiatePayment: (contact: Contact, amount?: number) => void;
  onOpenAllTransactions: () => void;
  onOpenSendModal: () => void;
  onOpenRequestModal: () => void;
  onOpenBillModal: () => void;
  onSelectCommand?: (cmd: string) => void;
}

const DASHBOARD_SUGGESTIONS = [
  'Vani, pay ₹500 to Taniya',
  'Vani, pay ₹500 to Rahul',
  'Pay ₹50 to Sarah Miller',
  'Transfer ₹2000 for dinner',
  'Send ₹300 to Priya Sen',
  'Pay ₹150 for Starbucks Coffee',
];

const FLOW_STAGES = [
  { step: 1, label: 'SPEAK' },
  { step: 2, label: 'UNDERSTAND' },
  { step: 3, label: 'VERIFY' },
  { step: 4, label: 'CONFIRM' },
  { step: 5, label: 'SUCCESS' },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  accounts,
  contacts,
  transactions,
  onOpenVoice,
  onInitiatePayment,
  onOpenAllTransactions,
  onOpenSendModal,
  onOpenRequestModal,
  onOpenBillModal,
  onSelectCommand,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const primaryAccount = accounts.find((a) => a.isPrimary) || accounts[0];

  useEffect(() => {
    const unsubState = voiceAssistant.subscribeState((st) => setVoiceState(st));
    const unsubTr = voiceAssistant.subscribeTranscript((tr) => setLiveTranscript(tr));
    return () => {
      unsubState();
      unsubTr();
    };
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils size={17} className="text-amber-400" />;
      case 'Coffee':
        return <Coffee size={17} className="text-orange-400" />;
      case 'Zap':
        return <Zap size={17} className="text-yellow-400" />;
      case 'ArrowDownLeft':
        return <ArrowDownLeft size={17} className="text-[#00ff87]" />;
      default:
        return <ArrowUpRight size={17} className="text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* ==================================================== */}
      {/* 1. HERO VANI VOICE ASSISTANT CARD */}
      {/* ==================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-[#060b18]/85 border border-white/[0.09] shadow-[0_0_60px_rgba(0,255,136,0.07)] overflow-hidden text-center flex flex-col items-center">
        {/* Subtle glowing ambient lights */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-violet-600/18 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-[#00ff87]/14 blur-3xl pointer-events-none" />

        {/* TOP: 1. SPEAK → 2. UNDERSTAND → 3. VERIFY → 4. CONFIRM → 5. SUCCESS */}
        <div className="w-full flex items-center justify-center gap-1 sm:gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          {FLOW_STAGES.map((s, idx) => {
            const isActive = s.step === 1;
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
            : 'Listening to your voice...'}
        </h2>

        {/* DARK GLASS TRANSCRIPT CONTAINER: LIVE SPEECH TRANSCRIPT */}
        <div
          onClick={onOpenVoice}
          className="w-full max-w-md px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] min-h-[56px] flex items-center justify-center text-center mb-3 cursor-pointer hover:border-white/[0.18] transition-colors"
        >
          {liveTranscript ? (
            <motion.div
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-sm sm:text-base font-semibold tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                "{liveTranscript}"
              </span>
            </motion.div>
          ) : (
            <span className="text-slate-300 text-sm sm:text-base font-medium">
              "Vani pay RS 5000 to Pihu"
            </span>
          )}
        </div>

        {/* THE VOICE ORB: Signature organic green energy form */}
        <div className="my-1 sm:my-2 cursor-pointer" onClick={onOpenVoice}>
          <VoiceOrb state={voiceState} size="hero" interactive={true} onClick={onOpenVoice} />
        </div>

        {/* LABEL BELOW THE ORB: Tap orb or select a suggestion */}
        <p className="text-xs text-slate-400 font-medium tracking-wide my-2">
          Tap orb or select a suggestion
        </p>

        {/* QUICK COMMAND CHIPS: Exact commands as reference */}
        <div className="w-full max-w-md flex flex-wrap gap-2 justify-center mt-1">
          {DASHBOARD_SUGGESTIONS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onSelectCommand) {
                  onSelectCommand(cmd);
                } else {
                  onOpenVoice();
                }
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#00ff87]/15 border border-white/[0.08] hover:border-[#00ff87]/50 text-xs text-slate-200 hover:text-white transition-all text-center shadow-sm"
            >
              <span>"{cmd}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. PRIMARY BALANCE CARD */}
      {/* ==================================================== */}
      <div className="relative rounded-3xl p-6 bg-[#060b18]/80 border border-white/[0.09] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs text-violet-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87]" />
            <span className="font-semibold text-slate-200">{primaryAccount.bankName}</span>
            <span className="text-slate-400 font-mono">({primaryAccount.accountNumber})</span>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            <span>{showBalance ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        <div className="mb-4">
          <span className="text-[11px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
            Total Available Balance
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
            {showBalance ? (
              `₹${user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ) : (
              '••••••••'
            )}
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/[0.06]">
          <button
            onClick={onOpenSendModal}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-violet-500/20 group-hover:bg-violet-500/30 border border-violet-500/30 flex items-center justify-center text-violet-300 transition-colors">
              <ArrowUpRight size={19} />
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Send</span>
          </button>

          <button
            onClick={onOpenRequestModal}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 group-hover:bg-cyan-500/30 border border-cyan-500/30 flex items-center justify-center text-cyan-300 transition-colors">
              <ArrowDownLeft size={19} />
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Request</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#00ff87]/15 group-hover:bg-[#00ff87]/25 border border-[#00ff87]/30 flex items-center justify-center text-[#00ff87] transition-colors">
              <QrCode size={19} />
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Scan QR</span>
          </button>

          <button
            onClick={onOpenBillModal}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center text-amber-300 transition-colors">
              <Zap size={19} />
            </div>
            <span className="text-[11px] font-semibold text-slate-300">Bills</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. QUICK PAY BENEFICIARIES */}
      {/* ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-white tracking-wide">Quick Pay Beneficiaries</h3>
          <span className="text-xs text-[#00ff87] font-mono">Say name to pay</span>
        </div>

        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none">
          {contacts.map((contact) => (
            <motion.button
              key={contact.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onInitiatePayment(contact, contact.recentAmount || 500)}
              className="flex flex-col items-center gap-1.5 shrink-0 group p-1"
            >
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/[0.1] group-hover:border-[#00ff87]/80 transition-colors shadow-lg"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00ff87] rounded-full border-2 border-[#040711] flex items-center justify-center text-[10px] text-black font-bold">
                  ₹
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white max-w-[70px] truncate">
                {contact.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ₹{contact.recentAmount || 500}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. SECURITY & VOICE KEY STATUS */}
      {/* ==================================================== */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 flex items-center justify-center text-[#00ff87]">
            <KeyRound size={20} />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-white leading-tight">Biometric Voice Key Active</h4>
            <p className="text-[11px] text-slate-400">Cryptographic NPCI UPI 2.0 voice authorization</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#00ff87]/15 text-[#00ff87] text-[10px] font-mono font-bold border border-[#00ff87]/30 flex items-center gap-1">
          <Lock size={10} />
          <span>SECURED</span>
        </span>
      </div>

      {/* ==================================================== */}
      {/* 5. RECENT ACTIVITY LIST */}
      {/* ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-violet-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Recent Transactions</h3>
          </div>
          <button
            onClick={onOpenAllTransactions}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2.5">
          {transactions.slice(0, 5).map((txn) => {
            const isReceive = txn.type === 'receive';
            return (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#060b18]/60 hover:bg-[#060b18]/90 border border-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    {getCategoryIcon(txn.iconName)}
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-semibold text-white leading-snug">
                      {txn.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{txn.date}, {txn.time}</span>
                      <span>•</span>
                      <span>{txn.method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold block font-mono ${
                      isReceive ? 'text-[#00ff87]' : 'text-white'
                    }`}
                  >
                    {isReceive ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#00ff87]/80 capitalize font-mono">
                    {txn.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
