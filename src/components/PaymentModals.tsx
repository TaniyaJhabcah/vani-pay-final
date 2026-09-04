import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, ArrowDownLeft, Zap, Check, AlertCircle } from 'lucide-react';
import { Contact, BankAccount } from '../types';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  accounts: BankAccount[];
  onSend: (contact: Contact, amount: number) => void;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  contacts,
  accounts,
  onSend,
}) => {
  const [selectedContact, setSelectedContact] = useState<Contact>(contacts[0]);
  const [amount, setAmount] = useState('500');
  const [customUpi, setCustomUpi] = useState('');
  const [mode, setMode] = useState<'contact' | 'upi'>('contact');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    if (mode === 'contact') {
      onSend(selectedContact, val);
    } else {
      if (!customUpi) return;
      const customContact: Contact = {
        id: `custom_${Date.now()}`,
        name: customUpi.split('@')[0],
        upiId: customUpi,
        phone: 'Direct UPI',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        verified: true,
      };
      onSend(customContact, val);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#0D1424] border border-indigo-500/25 rounded-3xl p-6 shadow-2xl text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Send size={18} className="text-indigo-400" />
              <span>Send Money</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl mb-4 text-xs font-medium">
            <button
              onClick={() => setMode('contact')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'contact' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setMode('upi')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'upi' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              UPI ID / Number
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'contact' ? (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Choose Contact</label>
                <div className="grid grid-cols-3 gap-2">
                  {contacts.slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedContact(c)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        selectedContact.id === c.id
                          ? 'bg-indigo-900/40 border-indigo-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-[11px] font-medium truncate w-full text-center">
                        {c.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. rahul@okaxis"
                  value={customUpi}
                  onChange={(e) => setCustomUpi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xl font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 2000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="flex-1 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-xs font-semibold text-indigo-300"
                  >
                    +₹{v}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 mt-2"
            >
              Continue to Voice Pay
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const RequestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const upiId = 'ananya@okhdfcbank';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0D1424] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <ArrowDownLeft size={18} className="text-cyan-400" />
            <span>Request Money via UPI</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-white rounded-2xl inline-block my-3 shadow-lg">
          {/* Simulated QR Code */}
          <div className="w-40 h-40 bg-slate-900 flex flex-col items-center justify-center rounded-xl text-xs text-white p-2">
            <span className="font-mono text-[11px] mb-1">SCAN TO PAY</span>
            <span className="text-[10px] text-cyan-400">ananya@okhdfcbank</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-2">Share your UPI ID</p>
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono mb-4">
          <span>{upiId}</span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(upiId);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-cyan-400 font-semibold"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const BillModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPayBill: (billTitle: string, amount: number) => void;
}> = ({ isOpen, onClose, onPayBill }) => {
  if (!isOpen) return null;

  const bills = [
    { name: 'Tata Power Electricity', amount: 1450, category: 'Electricity', icon: 'Zap' },
    { name: 'Airtel Broadband Fiber', amount: 999, category: 'Internet', icon: 'Wifi' },
    { name: 'Indane Gas Cylinder', amount: 860, category: 'Gas', icon: 'Flame' },
    { name: 'Jio 5G Unlimited Recharge', amount: 349, category: 'Mobile', icon: 'Smartphone' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0D1424] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <span>Pay Utility Bills</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Due bills linked to your phone or say "Pay electricity bill"
        </p>

        <div className="space-y-2.5">
          {bills.map((b, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800"
            >
              <div>
                <h4 className="text-xs font-semibold text-white">{b.name}</h4>
                <span className="text-[10px] text-slate-400">{b.category} • Due in 3 days</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-amber-300">₹{b.amount}</span>
                <button
                  onClick={() => onPayBill(b.name, b.amount)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
