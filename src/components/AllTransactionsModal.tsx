import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Filter, ArrowUpRight, ArrowDownLeft, Zap, Utensils, Coffee } from 'lucide-react';
import { Transaction } from '../types';

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export const AllTransactionsModal: React.FC<AllTransactionsModalProps> = ({
  isOpen,
  onClose,
  transactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'send' | 'receive' | 'bill'>('all');

  if (!isOpen) return null;

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientOrSender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.upiId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-[#0D1424] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">All Transactions</h3>
              <p className="text-xs text-slate-400">Statement history & UPI receipts</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, UPI ID, or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(['all', 'send', 'receive', 'bill'] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  filterType === ft
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {ft === 'all' ? 'All Activity' : ft}
              </button>
            ))}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No transactions found.
              </div>
            ) : (
              filtered.map((txn) => {
                const isReceive = txn.type === 'receive';
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        {txn.iconName === 'Utensils' && <Utensils size={18} className="text-amber-400" />}
                        {txn.iconName === 'Coffee' && <Coffee size={18} className="text-orange-400" />}
                        {txn.iconName === 'Zap' && <Zap size={18} className="text-yellow-400" />}
                        {txn.iconName === 'ArrowDownLeft' && (
                          <ArrowDownLeft size={18} className="text-emerald-400" />
                        )}
                        {txn.iconName === 'ArrowUpRight' && (
                          <ArrowUpRight size={18} className="text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{txn.title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>{txn.date}, {txn.time}</span>
                          <span>•</span>
                          <span className="font-mono">{txn.referenceId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold block ${
                          isReceive ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {isReceive ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400/80 capitalize">
                        {txn.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
