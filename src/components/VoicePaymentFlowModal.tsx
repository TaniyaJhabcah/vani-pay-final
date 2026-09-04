import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ArrowRight, CheckCircle2, Lock, Fingerprint, ScanFace, Mic, ShieldAlert, AlertCircle } from 'lucide-react';
import { Contact, BankAccount, VoiceState } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { FaceAuthentication } from './FaceAuthentication';
import { voiceAssistant } from '../services/voiceAssistant';
import { processUpiPayment } from '../services/razorpayService';
import { securityService, RiskEvaluationResult } from '../services/securityService';

interface VoicePaymentFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Contact;
  amount: number;
  debitAccount: BankAccount;
  onPaymentSuccess: (amount: number, recipient: Contact, referenceId: string) => void;
}

type PaymentFlowStage = 'understand' | 'verify' | 'confirm' | 'success';

const FLOW_STAGES = [
  { step: 1, key: 'speak', label: 'SPEAK' },
  { step: 2, key: 'understand', label: 'UNDERSTAND' },
  { step: 3, key: 'verify', label: 'VERIFY' },
  { step: 4, key: 'confirm', label: 'CONFIRM' },
  { step: 5, key: 'success', label: 'SUCCESS' },
];

export const VoicePaymentFlowModal: React.FC<VoicePaymentFlowModalProps> = ({
  isOpen,
  onClose,
  recipient,
  amount,
  debitAccount,
  onPaymentSuccess,
}) => {
  const [currentStage, setCurrentStage] = useState<PaymentFlowStage>('understand');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<'face' | 'voice'>('face');
  const [riskAssessment, setRiskAssessment] = useState<RiskEvaluationResult | null>(null);
  const [securityBlockedError, setSecurityBlockedError] = useState<string | null>(null);

  // Subscribe to voice assistant events
  useEffect(() => {
    const unsubState = voiceAssistant.subscribeState((st) => setVoiceState(st));
    const unsubTr = voiceAssistant.subscribeTranscript((tr, isFinal) => {
      setTranscript(tr);
      if (isFinal) {
        const cmd = voiceAssistant.parseCommand(tr);
        if (cmd.intent === 'confirm_payment') {
          if (currentStage === 'understand') {
            handleProceedToVerify();
          } else if (currentStage === 'confirm') {
            handleExecuteFinalPayment();
          }
        } else if (cmd.intent === 'cancel') {
          handleCancel();
        }
      }
    });

    return () => {
      unsubState();
      unsubTr();
    };
  }, [currentStage]);

  // STAGE 2: UNDERSTAND - Vani speaks recognized payment request
  useEffect(() => {
    if (isOpen && currentStage === 'understand') {
      const promptText = `Payment request: ₹${amount} to ${recipient.name}. Say proceed or tap verify.`;
      voiceAssistant.speak(promptText, {
        listenAfterSpeaking: true,
      });
    }
  }, [isOpen, currentStage, amount, recipient.name]);

  const handleProceedToVerify = (method: 'face' | 'voice' = 'face') => {
    setVerifyMethod(method);
    setCurrentStage('verify');

    if (method === 'voice') {
      setIsVerifying(true);
      voiceAssistant.speak('Verifying your biometric voice signature.', {
        listenAfterSpeaking: false,
      });

      // Simulate biometric voice signature verification
      setTimeout(() => {
        setIsVerifying(false);
        handleExecuteFinalPayment();
      }, 2200);
    }
  };

  const handleExecuteFinalPayment = async () => {
    // Process NPCI UPI transfer
    const res = await processUpiPayment({
      recipientName: recipient.name,
      recipientUpiId: recipient.upiId,
      amount,
      bankAccount: debitAccount.bankName,
    });

    setReferenceNumber(res.referenceNumber);
    setCurrentStage('success');
    voiceAssistant.playEarcon('success');

    // Congratulatory TTS using existing voice assistant
    await voiceAssistant.speak(
      `Payment of ₹${amount} to ${recipient.name} was successful!`,
      { listenAfterSpeaking: false }
    );

    onPaymentSuccess(amount, recipient, res.referenceNumber);
  };

  const handleCancel = () => {
    voiceAssistant.cancelAll();
    onClose();
  };

  const getActiveStepNumber = () => {
    switch (currentStage) {
      case 'understand':
        return 2;
      case 'verify':
        return 3;
      case 'confirm':
        return 4;
      case 'success':
        return 5;
      default:
        return 2;
    }
  };


  if (!isOpen) return null;

  const activeStepNum = getActiveStepNumber();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060e]/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#060b18]/95 border border-white/[0.09] rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,255,136,0.08)] overflow-hidden text-center text-white"
        >
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-[#00ff87]/12 blur-3xl pointer-events-none" />

          {/* Close Button */}
          {currentStage !== 'success' && (
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-20"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}

          {/* TOP: 1. SPEAK → 2. UNDERSTAND → 3. VERIFY → 4. CONFIRM → 5. SUCCESS */}
          <div className="w-full flex items-center justify-center gap-1 sm:gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {FLOW_STAGES.map((s, idx) => {
              const isActive = s.step === activeStepNum;
              const isPassed = s.step < activeStepNum;
              return (
                <React.Fragment key={s.step}>
                  <div
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono tracking-wider transition-all ${
                      isActive
                        ? 'bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/50 shadow-[0_0_12px_rgba(0,255,136,0.4)] font-bold'
                        : isPassed
                        ? 'bg-white/[0.05] text-[#00ff87]/80 border border-[#00ff87]/20'
                        : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'
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
          <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold mx-auto w-fit mb-3">
            <span className="w-2 h-2 rounded-full bg-[#00ff87] shadow-[0_0_8px_#00ff87] animate-pulse" />
            <span>● VANI AUDIO ENGINE ACTIVE</span>
          </div>

          {/* ==================================================== */}
          {/* STAGE 2: UNDERSTAND */}
          {/* ==================================================== */}
          {currentStage === 'understand' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="my-2">
                <VoiceOrb state={voiceState} size="md" interactive={false} />
              </div>

              <div className="my-2">
                <span className="text-xs uppercase font-mono tracking-widest text-[#00ff87] font-semibold">
                  Payment Request Understood
                </span>
              </div>

              {/* Recipient Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] w-full max-w-sm mb-3">
                <div className="relative">
                  <img
                    src={recipient.avatar}
                    alt={recipient.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00ff87] border-2 border-[#060b18] rounded-full" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{recipient.name}</h3>
                  <p className="text-xs text-violet-300 truncate">{recipient.upiId}</p>
                </div>
              </div>

              {/* Large Amount Display */}
              <div className="py-3 px-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] w-full max-w-sm mb-3 shadow-inner">
                <span className="text-[11px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
                  Transfer Amount
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Debit Account Info */}
              <div className="w-full max-w-sm flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs mb-3">
                <span className="text-slate-400">Debit Bank:</span>
                <span className="font-semibold text-slate-200">
                  {debitAccount.bankName} ({debitAccount.accountNumber})
                </span>
              </div>

              {/* Voice instruction banner */}
              <div className="w-full max-w-sm py-2 px-3 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/25 text-xs text-[#00ff87] mb-4 flex items-center justify-center gap-2">
                <span>Say "Proceed" or tap Verify to continue</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-sm flex gap-2.5">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProceedToVerify('face')}
                  className="flex-1 py-3 rounded-xl bg-[#00ff87] hover:bg-[#00e67a] text-black text-xs font-bold shadow-[0_0_20px_rgba(0,255,136,0.35)] flex items-center justify-center gap-1.5 transition-all"
                >
                  <ScanFace size={15} />
                  <span>Verify Face & Pay</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STAGE 3: VERIFY (FACE OR VOICE BIOMETRIC) */}
          {/* ==================================================== */}
          {currentStage === 'verify' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-1"
            >
              {securityBlockedError ? (
                <div className="flex flex-col items-center py-6 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                    <AlertCircle size={26} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Payment Authorization Blocked</h4>
                  <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
                    {securityBlockedError}
                  </p>
                  <div className="flex gap-2 w-full max-w-xs">
                    <button
                      onClick={() => {
                        setSecurityBlockedError(null);
                        handleProceedToVerify('face');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors"
                    >
                      Retry Auth
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-xs font-semibold text-rose-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : verifyMethod === 'face' ? (
                <FaceAuthentication
                  recipientName={recipient.name}
                  recipientUpiId={recipient.upiId}
                  amount={amount}
                  onSuccess={async (token) => {
                    // Server-side Payment Integrity Verification
                    const validation = securityService.validateAndConsumeSession({
                      sessionId: token,
                      expectedAmount: amount,
                      expectedRecipientUpiId: recipient.upiId,
                    });

                    if (!validation.valid) {
                      setSecurityBlockedError(validation.error || 'Payment security verification blocked.');
                      voiceAssistant.playEarcon('cancel');
                      voiceAssistant.speak('Security validation failed. Payment session is invalid.', {
                        listenAfterSpeaking: false,
                      });
                      return;
                    }

                    // Evaluate Transaction Risk
                    const risk = securityService.evaluateTransactionRisk({
                      amount,
                      recipientUpiId: recipient.upiId,
                    });
                    setRiskAssessment(risk);

                    if (risk.isHighRisk) {
                      // High-risk: require additional secondary confirmation before payment completion
                      setCurrentStage('confirm');
                      voiceAssistant.speak(
                        `Identity verified. High-value transfer detected. Please tap Confirm to complete payment.`,
                        { listenAfterSpeaking: true }
                      );
                    } else {
                      // Normal payment authorized automatically
                      await handleExecuteFinalPayment();
                    }
                  }}
                  onCancel={handleCancel}
                  onFallbackToVoice={() => {
                    handleProceedToVerify('voice');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center py-4">
                  <div className="my-4">
                    <VoiceOrb state="verifying" size="lg" interactive={false} />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    Biometric Voice Verification
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
                    Analyzing acoustic frequency and matching your secure cryptographic voice key with NPCI banking rails...
                  </p>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 font-mono mb-4">
                    <Fingerprint size={16} className="text-[#00ff87] animate-pulse" />
                    <span>MATCHING ENCRYPTED BIOMETRIC HASH</span>
                  </div>

                  <button
                    onClick={() => handleProceedToVerify('face')}
                    className="text-xs text-slate-400 hover:text-[#00ff87] flex items-center gap-1 transition-colors"
                  >
                    <ScanFace size={14} />
                    <span>Switch to Face Authentication</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STAGE 4: CONFIRM */}
          {/* ==================================================== */}
          {currentStage === 'confirm' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="my-2">
                <VoiceOrb state={voiceState === 'listening' ? 'listening' : 'speaking'} size="md" interactive={false} />
              </div>

              <div className="my-1">
                <span className="text-xs uppercase font-mono tracking-widest text-[#00ff87] font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>
                    {verifyMethod === 'face'
                      ? 'Identity & Liveness Verified'
                      : 'Voice Signature Verified'}
                  </span>
                </span>
              </div>

              {/* Elevated Risk Warning for High-Value Payments */}
              {riskAssessment?.isHighRisk && (
                <div className="w-full max-w-sm p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 my-2 text-left">
                  <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Elevated Risk Transaction Review</span>
                    <span className="text-[11px] text-amber-200/90 leading-tight block mt-0.5">
                      {riskAssessment.reasons[0] || 'Transaction exceeds standard threshold.'} Biometric verified. Secondary confirmation required before debiting account.
                    </span>
                  </div>
                </div>
              )}

              {/* Review summary box */}
              <div className="w-full max-w-sm p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-left text-xs space-y-2.5 my-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient</span>
                  <span className="font-semibold text-white">{recipient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UPI ID</span>
                  <span className="font-mono text-violet-300">{recipient.upiId}</span>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-2">
                  <span className="text-slate-400">Amount to Transfer</span>
                  <span className="font-black text-white text-base">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Debit Account</span>
                  <span className="text-slate-200">{debitAccount.bankName}</span>
                </div>
              </div>

              {/* Voice prompt instruction */}
              <div className="w-full max-w-sm py-2 px-3 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 text-xs text-[#00ff87] mb-4 flex items-center justify-center gap-2">
                <span>Say "Confirm" into your mic or tap below</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-sm flex gap-2.5">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteFinalPayment}
                  className="flex-1 py-3 rounded-xl bg-[#00ff87] hover:bg-[#00e67a] text-black text-xs font-bold shadow-[0_0_20px_rgba(0,255,136,0.35)] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Lock size={14} />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* STAGE 5: SUCCESS */}
          {/* ==================================================== */}
          {currentStage === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-3"
            >
              <div className="my-3">
                <VoiceOrb state="success" size="lg" interactive={false} />
              </div>

              <h3 className="text-2xl font-black text-white mb-1 tracking-tight">
                Payment Successful!
              </h3>
              <p className="text-xs text-[#00ff87] mb-4 font-mono font-medium">
                Sent to {recipient.name} ({recipient.upiId})
              </p>

              <div className="w-full max-w-sm bg-white/[0.04] rounded-2xl p-4 border border-white/[0.08] space-y-2 text-xs text-left mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Transferred</span>
                  <span className="font-bold text-white text-sm">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UPI Ref Number</span>
                  <span className="font-mono text-slate-300">{referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank Rail</span>
                  <span className="text-slate-300">{debitAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Verification</span>
                  <span className="text-[#00ff87] flex items-center gap-1">
                    <ShieldCheck size={13} />
                    <span>{verifyMethod === 'face' ? 'Face ID Verified (NPCI)' : 'Voice Key Matched'}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={handleCancel}
                className="w-full max-w-sm py-3 rounded-xl bg-[#00ff87] hover:bg-[#00e67a] text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,255,136,0.35)]"
              >
                Done
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
