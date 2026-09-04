import React from 'react';
import { motion } from 'motion/react';
import { PieChart, TrendingDown, Sparkles, Mic, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';

export const InsightsView: React.FC = () => {
  const categories = [
    { name: 'Food & Dining', amount: 8420, percent: 38, color: 'bg-amber-500' },
    { name: 'Rent & Utilities', amount: 6200, percent: 28, color: 'bg-indigo-500' },
    { name: 'Shopping & Groceries', amount: 4150, percent: 19, color: 'bg-cyan-500' },
    { name: 'Travel & Cab', amount: 2100, percent: 10, color: 'bg-violet-500' },
    { name: 'Entertainment', amount: 1120, percent: 5, color: 'bg-rose-500' },
  ];

  const handleVoiceSummary = () => {
    voiceAssistant.speak(
      'Here is your monthly spend summary. You have spent ₹21,990 this month. Your highest spending was ₹8,420 on food and dining, which is 12% lower than last month. Great job saving!',
      { listenAfterSpeaking: true }
    );
  };

  return (
    <div className="space-y-6 pb-28 text-white">
      <div>
        <h2 className="text-xl font-bold">Financial Insights</h2>
        <p className="text-xs text-slate-400">AI-driven voice analytics of your UPI payments</p>
      </div>

      {/* Voice Summary Card */}
      <div className="rounded-3xl p-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 shadow-xl flex items-center justify-between">
        <div className="space-y-1 max-w-[70%]">
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
            <Sparkles size={14} className="text-cyan-300" />
            <span>Vani Voice Intelligence</span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            Listen to an audio brief of your weekly and monthly budget trends.
          </p>
        </div>

        <button
          onClick={handleVoiceSummary}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
        >
          <Mic size={15} />
          <span>Listen</span>
        </button>
      </div>

      {/* Monthly Total */}
      <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">September Total Spend</span>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <TrendingDown size={14} />
            <span>12% less than August</span>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight mb-4">
          ₹21,990.00
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden gap-0.5">
          {categories.map((c, i) => (
            <div
              key={i}
              className={`${c.color}`}
              style={{ width: `${c.percent}%` }}
              title={`${c.name}: ${c.percent}%`}
            />
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-slate-200">Spending by Category</h3>
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80"
          >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${cat.color}`} />
              <span className="text-xs font-medium text-white">{cat.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-white block">
                ₹{cat.amount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">{cat.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
