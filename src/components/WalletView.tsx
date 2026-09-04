import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Plus, CheckCircle2, Shield, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { BankAccount } from '../types';

interface WalletViewProps {
  accounts: BankAccount[];
  onSetPrimary: (accountId: string) => void;
  onTopupLite: (amount: number) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  accounts,
  onSetPrimary,
  onTopupLite,
}) => {
  const [topupAmount, setTopupAmount] = useState('500');
  const [showLiteModal, setShowLiteModal] = useState(false);

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Wallet & Accounts</h2>
          <p className="text-xs text-slate-400">Linked UPI Banks & Instant PIN-less Wallets</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition-colors">
          <Plus size={14} />
          <span>Add Bank</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.map((acc) => (
          <motion.div
            key={acc.id}
            whileHover={{ y: -2 }}
            className={`relative rounded-3xl p-5 border transition-all ${
              acc.isPrimary
                ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-blue-950/80 border-indigo-500/50 shadow-xl'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                  {acc.logoInitial}
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>{acc.bankName}</span>
                    {acc.isPrimary && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                        Primary
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {acc.accountType} • {acc.accountNumber}
                  </span>
                </div>
              </div>

              {!acc.isPrimary && acc.accountType !== 'UPI Lite' && (
                <button
                  onClick={() => onSetPrimary(acc.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Make Primary
                </button>
              )}
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Available Balance</span>
                <span className="text-2xl font-extrabold text-white">
                  ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {acc.accountType === 'UPI Lite' && (
                <button
                  onClick={() => setShowLiteModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-colors"
                >
                  Top Up Lite
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Security note */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
        <Shield size={18} className="text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white block mb-0.5">NPCI UPI 2.0 Security</span>
          All bank accounts linked with Vani Pay are secured via 256-bit encryption. Voice authorizations require your unique voice biometric imprint.
        </div>
      </div>

      {/* Topup Lite Modal */}
      {showLiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0D1424] border border-emerald-500/30 rounded-3xl p-6 text-white text-center">
            <Zap className="mx-auto text-emerald-400 mb-2" size={32} />
            <h3 className="text-base font-bold mb-1">Add Money to UPI Lite</h3>
            <p className="text-xs text-slate-400 mb-4">
              UPI Lite allows instant 1-second transactions up to ₹500 without entering a PIN.
            </p>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xl font-bold text-center focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLiteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(topupAmount);
                  if (val > 0) {
                    onTopupLite(val);
                    setShowLiteModal(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
              >
                Add ₹{topupAmount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
