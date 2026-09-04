import React from 'react';
import { Home, CreditCard, PieChart, Settings, Mic, Terminal } from 'lucide-react';
import { NavTab, UserProfile } from '../types';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenVoice: () => void;
  onToggleDebug: () => void;
  user: UserProfile;
}

export const TopBar: React.FC<{
  user: UserProfile;
  onToggleDebug: () => void;
}> = ({ user, onToggleDebug }) => {
  return (
    <header className="sticky top-0 z-20 w-full px-4 py-3 bg-[#040711]/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Brand mark with neon green & electric violet */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00ff87] via-teal-500 to-violet-600 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-[#00ff87]/20">
          V
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
              Vani Pay
            </h1>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30">
              Voice AI
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono leading-none">
            {user.upiId}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live Debug Toggle button */}
        <button
          onClick={onToggleDebug}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
          title="Toggle Voice Debug Panel"
        >
          <Terminal size={14} className="text-[#00ff87]" />
          <span className="hidden sm:inline font-mono text-[11px]">Debug</span>
        </button>

        {/* User avatar */}
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-xl object-cover border border-[#00ff87]/40 shadow-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00ff87] border border-[#040711] rounded-full" />
        </div>
      </div>
    </header>
  );
};

export const BottomNav: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenVoice,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#040711]/90 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-around max-w-lg mx-auto">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          currentTab === 'home'
            ? 'text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home size={20} />
        <span className="text-[11px] font-medium">Home</span>
      </button>

      <button
        onClick={() => onTabChange('wallet')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          currentTab === 'wallet'
            ? 'text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CreditCard size={20} />
        <span className="text-[11px] font-medium">Wallet</span>
      </button>

      {/* Center Voice Trigger Button */}
      <div className="relative -top-4">
        <button
          onClick={onOpenVoice}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#00ff87] via-teal-400 to-violet-600 flex items-center justify-center text-black shadow-[0_0_22px_rgba(0,255,136,0.45)] hover:scale-105 active:scale-95 transition-transform border-4 border-[#040711]"
          aria-label="Speak with Vani"
        >
          <Mic size={22} className="text-black stroke-[2.5]" />
        </button>
      </div>

      <button
        onClick={() => onTabChange('insights')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          currentTab === 'insights'
            ? 'text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <PieChart size={20} />
        <span className="text-[11px] font-medium">Insights</span>
      </button>

      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
          currentTab === 'settings'
            ? 'text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Settings size={20} />
        <span className="text-[11px] font-medium">Settings</span>
      </button>
    </nav>
  );
};
