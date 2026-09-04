import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Trash2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
  INITIAL_USER,
  INITIAL_CONTACTS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
} from './data/mockData';
import {
  BankAccount,
  Contact,
  NavTab,
  Transaction,
  UserProfile,
  VoiceDebugLog,
} from './types';
import { voiceAssistant } from './services/voiceAssistant';
import { NetworkDepthBackground } from './components/NetworkDepthBackground';
import { TopBar, BottomNav } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { WalletView } from './components/WalletView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { VoiceListeningOverlay } from './components/VoiceListeningOverlay';
import { PersistentVoiceBar } from './components/PersistentVoiceBar';
import { VoicePaymentFlowModal } from './components/VoicePaymentFlowModal';
import { SendModal, RequestModal, BillModal } from './components/PaymentModals';
import { AllTransactionsModal } from './components/AllTransactionsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Modals & Overlays
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState("I'm listening to your voice.");
  const [paymentDraft, setPaymentDraft] = useState<{
    recipient: Contact;
    amount: number;
    debitAccount: BankAccount;
  } | null>(null);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isAllTransactionsOpen, setIsAllTransactionsOpen] = useState(false);

  // Debug HUD state
  const [showDebugHUD, setShowDebugHUD] = useState(true);
  const [debugLogs, setDebugLogs] = useState<VoiceDebugLog[]>([]);

  // Feedback toast
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Subscribe to debug logs
  useEffect(() => {
    const unsub = voiceAssistant.subscribeDebug((logs) => {
      setDebugLogs([...logs]);
    });
    return () => unsub();
  }, []);

  // Handle voice commands from speech recognition
  const handleCommandParsed = useCallback((commandText: string) => {
    const cmd = voiceAssistant.parseCommand(commandText);

    if (cmd.intent === 'send_money') {
      const amount = cmd.amount || 500;
      let targetContact = contacts[0];

      if (cmd.recipientName) {
        const found = contacts.find((c) =>
          c.name.toLowerCase().includes(cmd.recipientName!.toLowerCase())
        );
        if (found) {
          targetContact = found;
        } else {
          // Create temporary contact
          targetContact = {
            id: `temp_${Date.now()}`,
            name: cmd.recipientName.charAt(0).toUpperCase() + cmd.recipientName.slice(1),
            upiId: `${cmd.recipientName.toLowerCase()}@upi`,
            phone: '+91 99000 11223',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            verified: true,
          };
        }
      }

      const primaryAcc = accounts.find((a) => a.isPrimary) || accounts[0];

      // Close voice overlay and launch payment confirmation
      setIsVoiceOverlayOpen(false);
      setPaymentDraft({
        recipient: targetContact,
        amount,
        debitAccount: primaryAcc,
      });
      return;
    }

    if (cmd.intent === 'check_balance') {
      const balanceStr = `₹${user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      showToast(`Total Balance: ${balanceStr}`, 'info');
      voiceAssistant.speak(`Your total available balance is ${balanceStr}.`, {
        listenAfterSpeaking: true,
      });
      return;
    }

    if (cmd.intent === 'show_transactions') {
      setIsVoiceOverlayOpen(false);
      setIsAllTransactionsOpen(true);
      voiceAssistant.speak('Showing your recent transactions.', {
        listenAfterSpeaking: false,
      });
      return;
    }

    if (cmd.intent === 'pay_bill') {
      setIsVoiceOverlayOpen(false);
      setIsBillModalOpen(true);
      voiceAssistant.speak(`Opening ${cmd.billType || 'utility'} bills payment.`, {
        listenAfterSpeaking: false,
      });
      return;
    }

    if (cmd.intent === 'navigate') {
      if (cmd.targetView) {
        setCurrentTab(cmd.targetView);
        voiceAssistant.speak(`Switched to ${cmd.targetView}.`, {
          listenAfterSpeaking: true,
        });
      }
      return;
    }

    if (cmd.intent === 'cancel') {
      setIsVoiceOverlayOpen(false);
      setPaymentDraft(null);
      setIsSendModalOpen(false);
      setIsBillModalOpen(false);
      setIsRequestModalOpen(false);
      voiceAssistant.cancelAll();
      showToast('Cancelled', 'info');
      return;
    }

    // Fallback if not understood
    voiceAssistant.speak(
      "I didn't quite catch that. You can say: Pay 500 to Priya, or check balance.",
      { listenAfterSpeaking: true }
    );
  }, [accounts, contacts, showToast, user.balance]);

  // Start payment from UI
  const handleInitiatePayment = (contact: Contact, amount = 500) => {
    const primaryAcc = accounts.find((a) => a.isPrimary) || accounts[0];
    setPaymentDraft({
      recipient: contact,
      amount,
      debitAccount: primaryAcc,
    });
  };

  // Payment completed successfully
  const handlePaymentSuccess = (amount: number, recipient: Contact, referenceId: string) => {
    // 1. Deduct balance from user
    setUser((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance - amount),
    }));

    // 2. Deduct from primary bank account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.isPrimary ? { ...acc, balance: Math.max(0, acc.balance - amount) } : acc
      )
    );

    // 3. Add to transactions list
    const newTxn: Transaction = {
      id: `txn_${Date.now()}`,
      title: recipient.name,
      recipientOrSender: recipient.name,
      upiId: recipient.upiId,
      amount,
      type: 'send',
      status: 'completed',
      date: 'Today',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      category: 'Transfer',
      iconName: 'ArrowUpRight',
      method: `${accounts[0].bankName} UPI`,
      referenceId,
    };

    setTransactions((prev) => [newTxn, ...prev]);
    showToast(`Payment of ₹${amount} sent to ${recipient.name}`, 'success');
  };

  const handleSetPrimaryAccount = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isPrimary: acc.id === id,
      }))
    );
    showToast('Primary bank account updated', 'info');
  };

  const handleTopupLite = (amount: number) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.accountType === 'UPI Lite') {
          return { ...acc, balance: acc.balance + amount };
        }
        if (acc.isPrimary) {
          return { ...acc, balance: Math.max(0, acc.balance - amount) };
        }
        return acc;
      })
    );
    showToast(`Added ₹${amount} to UPI Lite wallet`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background */}
      <NetworkDepthBackground />

      {/* Top Header */}
      <TopBar
        user={user}
        onToggleDebug={() => setShowDebugHUD((prev) => !prev)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4">
        {currentTab === 'home' && (
          <HomeDashboard
            user={user}
            accounts={accounts}
            contacts={contacts}
            transactions={transactions}
            onOpenVoice={() => {
              setVoicePrompt("I'm listening to your voice.");
              setIsVoiceOverlayOpen(true);
            }}
            onSelectCommand={(cmd) => {
              setVoicePrompt(cmd);
              setIsVoiceOverlayOpen(true);
            }}
            onInitiatePayment={handleInitiatePayment}
            onOpenAllTransactions={() => setIsAllTransactionsOpen(true)}
            onOpenSendModal={() => setIsSendModalOpen(true)}
            onOpenRequestModal={() => setIsRequestModalOpen(true)}
            onOpenBillModal={() => setIsBillModalOpen(true)}
          />
        )}

        {currentTab === 'wallet' && (
          <WalletView
            accounts={accounts}
            onSetPrimary={handleSetPrimaryAccount}
            onTopupLite={handleTopupLite}
          />
        )}

        {currentTab === 'insights' && <InsightsView />}

        {currentTab === 'settings' && (
          <SettingsView
            user={user}
            showDebugConsole={showDebugHUD}
            onToggleDebug={() => setShowDebugHUD((prev) => !prev)}
          />
        )}
      </main>

      {/* Persistent Voice Bar (Sticky bottom voice assistant trigger) */}
      {!isVoiceOverlayOpen && !paymentDraft && (
        <PersistentVoiceBar
          onOpenOverlay={() => {
            setVoicePrompt("I'm listening to your voice.");
            setIsVoiceOverlayOpen(true);
          }}
        />
      )}

      {/* Full Voice Listening Overlay */}
      <VoiceListeningOverlay
        isOpen={isVoiceOverlayOpen}
        onClose={() => setIsVoiceOverlayOpen(false)}
        onCommandParsed={handleCommandParsed}
        initialPrompt={voicePrompt}
      />

      {/* Voice Payment Review & Authorization Modal */}
      {paymentDraft && (
        <VoicePaymentFlowModal
          isOpen={true}
          onClose={() => setPaymentDraft(null)}
          recipient={paymentDraft.recipient}
          amount={paymentDraft.amount}
          debitAccount={paymentDraft.debitAccount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Manual Modals */}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        contacts={contacts}
        accounts={accounts}
        onSend={(c, amt) => {
          setIsSendModalOpen(false);
          handleInitiatePayment(c, amt);
        }}
      />

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onPayBill={(title, amt) => {
          setIsBillModalOpen(false);
          const billContact: Contact = {
            id: `bill_${Date.now()}`,
            name: title,
            upiId: `${title.toLowerCase().replace(/\s+/g, '')}@billdesk`,
            phone: 'Biller',
            avatar: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=150&auto=format&fit=crop&q=80',
            verified: true,
          };
          handleInitiatePayment(billContact, amt);
        }}
      />

      <AllTransactionsModal
        isOpen={isAllTransactionsOpen}
        onClose={() => setIsAllTransactionsOpen(false)}
        transactions={transactions}
      />

      {/* Persistent Live Voice State Debug HUD (Floating Telemetry Drawer) */}
      <AnimatePresence>
        {showDebugHUD && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 z-40 max-w-sm w-full bg-[#060913]/95 border border-indigo-500/40 rounded-2xl shadow-2xl p-3 font-mono text-[11px] backdrop-blur-xl pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Terminal size={14} className="text-cyan-400" />
                <span className="font-bold text-slate-200 text-[11px]">
                  Vani Voice State HUD
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => voiceAssistant.clearLogs()}
                  className="text-slate-400 hover:text-rose-400"
                  title="Clear debug logs"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  onClick={() => setShowDebugHUD(false)}
                  className="text-slate-400 hover:text-white"
                  title="Hide HUD"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-none">
              {debugLogs.length === 0 ? (
                <p className="text-slate-500 text-[10px] italic py-1">
                  Ready. Press Speak to trace TTS and Mic events.
                </p>
              ) : (
                debugLogs.slice(0, 8).map((log) => {
                  let badgeStyle = 'text-slate-400';
                  if (log.event === 'TTS_STARTED') badgeStyle = 'text-cyan-400 font-bold';
                  if (log.event === 'TTS_ENDED') badgeStyle = 'text-blue-400';
                  if (log.event === 'MIC_REQUESTED') badgeStyle = 'text-purple-400';
                  if (log.event === 'MIC_STARTED') badgeStyle = 'text-emerald-400 font-bold';
                  if (log.event === 'MIC_RESULT') badgeStyle = 'text-amber-300 font-bold';
                  if (log.event === 'MIC_ERROR') badgeStyle = 'text-rose-400 font-bold';
                  if (log.event === 'MIC_ENDED') badgeStyle = 'text-slate-400';

                  return (
                    <div key={log.id} className="flex gap-1.5 leading-tight items-start">
                      <span className="text-slate-500 text-[9px] shrink-0 pt-0.5">
                        {log.timestamp.split('.')[0]}
                      </span>
                      <span className={`text-[10px] shrink-0 ${badgeStyle}`}>
                        [{log.event}]
                      </span>
                      <span className="text-slate-300 text-[10px] truncate">
                        {log.details || ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl text-xs font-medium text-white flex items-center gap-2 backdrop-blur-md"
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
            {toast.type === 'info' && <Info size={16} className="text-cyan-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenVoice={() => {
          setVoicePrompt("I'm listening to your voice.");
          setIsVoiceOverlayOpen(true);
        }}
        onToggleDebug={() => setShowDebugHUD((prev) => !prev)}
        user={user}
      />
    </div>
  );
}
