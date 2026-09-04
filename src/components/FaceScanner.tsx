import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ScanFace,
  Check,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Camera,
  Mic,
  Lock,
  Eye,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { FaceAuthState, FaceDetectionResult } from '../services/faceAuthentication';
import { BlinkDebugInfo } from '../services/blinkDetector';

export interface FaceScannerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  authState: FaceAuthState;
  detectionInfo: FaceDetectionResult | null;
  guidanceText: string;
  errorMessage?: string;
  onRetry: () => void;
  onCancel?: () => void;
  onFallbackToVoice?: () => void;
  recipientName?: string;
  amount?: number;
  livenessStatus?: {
    active: boolean;
    passed: boolean;
    challengeText: string;
    progress: number;
  };
  isLockedOut?: boolean;
  lockoutSeconds?: number;
  attemptsRemaining?: number;
  debugInfo?: BlinkDebugInfo | null;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({
  videoRef,
  authState,
  detectionInfo,
  guidanceText,
  errorMessage,
  onRetry,
  onCancel,
  onFallbackToVoice,
  recipientName,
  amount,
  livenessStatus,
  isLockedOut = false,
  lockoutSeconds = 0,
  attemptsRemaining,
  debugInfo,
}) => {
  const [showDebug, setShowDebug] = React.useState(false);

  const isScanning =
    !isLockedOut &&
    (authState === 'position_face' ||
      authState === 'face_detected' ||
      authState === 'verifying');

  const isVerified = authState === 'verified';
  const isFailed = authState === 'failed';
  const isPermissionDenied = authState === 'permission_denied';
  const isWaitingCamera = authState === 'waiting_for_camera';

  // Dynamic tracking coordinates of the face box inside the viewfinder
  const frameBox = useMemo(() => {
    if (detectionInfo?.detected && detectionInfo.box) {
      const b = detectionInfo.box;
      return {
        left: `${Math.max(6, Math.min(60, b.x * 100))}%`,
        top: `${Math.max(6, Math.min(55, b.y * 100))}%`,
        width: `${Math.max(48, Math.min(84, b.width * 100))}%`,
        height: `${Math.max(52, Math.min(86, b.height * 100))}%`,
      };
    }
    return {
      left: '14%',
      top: '12%',
      width: '72%',
      height: '76%',
    };
  }, [detectionInfo]);

  // Determine current pipeline stage for clear architectural separation:
  // Stage 1: Face Detection
  // Stage 2: Liveness Detection
  // Stage 3: Identity Verification
  const currentPipelineStage = useMemo<'detection' | 'liveness' | 'verification' | 'complete'>(() => {
    if (isVerified) return 'complete';
    if (authState === 'verifying') return 'verification';
    if (livenessStatus?.active || livenessStatus?.passed) return 'liveness';
    return 'detection';
  }, [isVerified, authState, livenessStatus]);

  // Status stage badge text and color
  const statusBadge = useMemo(() => {
    if (isLockedOut) {
      return {
        label: `SECURITY LOCKOUT (${lockoutSeconds}s)`,
        color: 'text-rose-400 border-rose-500/40 bg-rose-500/15',
        dot: 'bg-rose-500 animate-pulse',
      };
    }
    if (isVerified) {
      return {
        label: '✓ IDENTITY VERIFIED',
        color: 'text-[#00ff87] border-[#00ff87]/30 bg-[#00ff87]/10',
        dot: 'bg-[#00ff87]',
      };
    }
    if (authState === 'verifying') {
      return {
        label: 'VERIFYING IDENTITY',
        color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
        dot: 'bg-cyan-400 animate-ping',
      };
    }
    if (livenessStatus?.active) {
      return {
        label: 'ANTI-SPOOFING CHECK',
        color: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
        dot: 'bg-amber-400 animate-pulse',
      };
    }
    if (authState === 'face_detected') {
      return {
        label: 'FACE DETECTED',
        color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
        dot: 'bg-emerald-400 animate-pulse',
      };
    }
    if (isFailed) {
      return {
        label: 'VERIFICATION FAILED',
        color: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
        dot: 'bg-rose-400',
      };
    }
    if (isPermissionDenied) {
      return {
        label: 'CAMERA BLOCKED',
        color: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
        dot: 'bg-amber-400',
      };
    }
    return {
      label: 'SCANNER READY',
      color: 'text-slate-300 border-white/10 bg-white/5',
      dot: 'bg-slate-400',
    };
  }, [isLockedOut, lockoutSeconds, isVerified, authState, livenessStatus, isFailed, isPermissionDenied]);

  return (
    <div className="w-full flex flex-col items-center text-center">
      {/* Transaction Target Subtitle */}
      {amount && recipientName && (
        <div className="flex items-center justify-between w-full max-w-xs px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-2.5 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Lock size={12} className="text-[#00ff87]" />
            <span>Biometric Payment:</span>
          </span>
          <span className="font-bold text-white">
            ₹{amount.toLocaleString('en-IN')} to {recipientName}
          </span>
        </div>
      )}

      {/* 3-Tier Architecture Breadcrumb (Separation of Detection, Liveness, and Verification) */}
      <div className="w-full max-w-xs flex items-center justify-between px-2 mb-2 text-[10px] font-mono">
        {/* Tier 1: Detection */}
        <div
          className={`flex items-center gap-1 transition-colors ${
            currentPipelineStage === 'detection'
              ? 'text-[#00ff87] font-bold'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentPipelineStage === 'detection' ? 'bg-[#00ff87]' : 'bg-slate-500'
            }`}
          />
          <span>1. Detection</span>
        </div>

        <span className="text-slate-600">→</span>

        {/* Tier 2: Liveness */}
        <div
          className={`flex items-center gap-1 transition-colors ${
            currentPipelineStage === 'liveness'
              ? 'text-amber-300 font-bold'
              : livenessStatus?.passed || currentPipelineStage === 'verification' || isVerified
              ? 'text-[#00ff87]'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentPipelineStage === 'liveness'
                ? 'bg-amber-400'
                : livenessStatus?.passed || isVerified
                ? 'bg-[#00ff87]'
                : 'bg-slate-500'
            }`}
          />
          <span>2. Liveness</span>
        </div>

        <span className="text-slate-600">→</span>

        {/* Tier 3: Verification */}
        <div
          className={`flex items-center gap-1 transition-colors ${
            currentPipelineStage === 'verification'
              ? 'text-cyan-400 font-bold'
              : isVerified
              ? 'text-[#00ff87] font-bold'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isVerified
                ? 'bg-[#00ff87]'
                : currentPipelineStage === 'verification'
                ? 'bg-cyan-400'
                : 'bg-slate-500'
            }`}
          />
          <span>3. Identity</span>
        </div>
      </div>

      {/* Status Stage Indicator */}
      <div className="mb-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider border transition-all duration-300 ${statusBadge.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
          <span>{statusBadge.label}</span>
        </span>
      </div>

      {/* ==================================================== */}
      {/* CAMERA VIEWPORT WITH DYNAMIC SCANNER FRAME */}
      {/* ==================================================== */}
      <div className="relative my-2">
        {/* Subtle Ambient Glow behind viewport */}
        <div
          className={`absolute -inset-3 rounded-[36px] blur-xl transition-all duration-500 pointer-events-none ${
            isLockedOut
              ? 'bg-rose-600/30'
              : isVerified
              ? 'bg-[#00ff87]/30'
              : isFailed
              ? 'bg-rose-500/25'
              : livenessStatus?.active
              ? 'bg-amber-400/25'
              : authState === 'verifying'
              ? 'bg-cyan-500/25'
              : 'bg-[#00ff87]/15'
          }`}
        />

        {/* Viewport Frame */}
        <div
          className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-[28px] overflow-hidden bg-[#060b18] border transition-all duration-500 shadow-2xl flex items-center justify-center ${
            isLockedOut
              ? 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.4)]'
              : isVerified
              ? 'border-[#00ff87] shadow-[0_0_35px_rgba(0,255,136,0.35)]'
              : isFailed
              ? 'border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
              : livenessStatus?.active
              ? 'border-amber-400/70 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
              : authState === 'verifying'
              ? 'border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
              : 'border-white/[0.12]'
          }`}
        >
          {/* Live Camera Video (mirrored for natural selfie alignment) */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${
              isWaitingCamera || isPermissionDenied || isLockedOut
                ? 'opacity-0'
                : 'opacity-100'
            }`}
          />

          {/* Security Lockout Screen */}
          {isLockedOut && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#060b18]/95 z-30">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2 shadow-[0_0_25px_rgba(244,63,94,0.4)]">
                <ShieldAlert size={26} />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">Authentication Cooldown</h4>
              <p className="text-[11px] text-slate-300 mb-3 max-w-[190px] leading-tight">
                Too many failed attempts. Security rate-limit activated.
              </p>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold mb-3">
                <Clock size={13} className="animate-spin" />
                <span>Retry in {lockoutSeconds}s</span>
              </div>
            </div>
          )}

          {/* Camera Loading Spinner State */}
          {!isLockedOut && isWaitingCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#060b18]/90 z-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-2 border-[#00ff87]/30 border-t-[#00ff87] mb-3"
              />
              <p className="text-xs text-slate-300 font-medium">Starting secure camera...</p>
              <p className="text-[10px] text-slate-500 mt-1">Requesting video permissions</p>
            </div>
          )}

          {/* Camera Permission Denied Screen */}
          {!isLockedOut && isPermissionDenied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#060b18]/95 z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Camera size={24} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Camera Access Required</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {errorMessage || 'Enable your camera to verify your identity.'}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} />
                <span>Grant Permission</span>
              </button>
            </div>
          )}

          {/* ==================================================== */}
          {/* DYNAMIC FACE SCANNING FRAME (Aligns with detected face) */}
          {/* ==================================================== */}
          {!isLockedOut && !isPermissionDenied && !isWaitingCamera && (
            <motion.div
              className="absolute pointer-events-none z-10"
              initial={false}
              animate={{
                left: frameBox.left,
                top: frameBox.top,
                width: frameBox.width,
                height: frameBox.height,
              }}
              transition={{
                type: 'spring',
                stiffness: 110,
                damping: 22,
                mass: 0.8,
              }}
            >
              {/* Dynamic Animated Corners */}
              {/* Top-Left Corner */}
              <motion.div
                animate={
                  isScanning
                    ? { opacity: [0.75, 1, 0.75], scale: [1, 1.02, 1] }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl transition-colors duration-300 ${
                  isVerified
                    ? 'border-[#00ff87] shadow-[0_0_12px_#00ff87]'
                    : isFailed
                    ? 'border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : livenessStatus?.active
                    ? 'border-amber-400 shadow-[0_0_12px_#fbbf24]'
                    : authState === 'verifying'
                    ? 'border-cyan-400 shadow-[0_0_12px_#06b6d4]'
                    : 'border-[#00ff87] shadow-[0_0_10px_rgba(0,255,136,0.5)]'
                }`}
              />

              {/* Top-Right Corner */}
              <motion.div
                animate={
                  isScanning
                    ? { opacity: [0.75, 1, 0.75], scale: [1, 1.02, 1] }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl transition-colors duration-300 ${
                  isVerified
                    ? 'border-[#00ff87] shadow-[0_0_12px_#00ff87]'
                    : isFailed
                    ? 'border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : livenessStatus?.active
                    ? 'border-amber-400 shadow-[0_0_12px_#fbbf24]'
                    : authState === 'verifying'
                    ? 'border-cyan-400 shadow-[0_0_12px_#06b6d4]'
                    : 'border-[#00ff87] shadow-[0_0_10px_rgba(0,255,136,0.5)]'
                }`}
              />

              {/* Bottom-Left Corner */}
              <motion.div
                animate={
                  isScanning
                    ? { opacity: [0.75, 1, 0.75], scale: [1, 1.02, 1] }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl transition-colors duration-300 ${
                  isVerified
                    ? 'border-[#00ff87] shadow-[0_0_12px_#00ff87]'
                    : isFailed
                    ? 'border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : livenessStatus?.active
                    ? 'border-amber-400 shadow-[0_0_12px_#fbbf24]'
                    : authState === 'verifying'
                    ? 'border-cyan-400 shadow-[0_0_12px_#06b6d4]'
                    : 'border-[#00ff87] shadow-[0_0_10px_rgba(0,255,136,0.5)]'
                }`}
              />

              {/* Bottom-Right Corner */}
              <motion.div
                animate={
                  isScanning
                    ? { opacity: [0.75, 1, 0.75], scale: [1, 1.02, 1] }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-xl transition-colors duration-300 ${
                  isVerified
                    ? 'border-[#00ff87] shadow-[0_0_12px_#00ff87]'
                    : isFailed
                    ? 'border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : livenessStatus?.active
                    ? 'border-amber-400 shadow-[0_0_12px_#fbbf24]'
                    : authState === 'verifying'
                    ? 'border-cyan-400 shadow-[0_0_12px_#06b6d4]'
                    : 'border-[#00ff87] shadow-[0_0_10px_rgba(0,255,136,0.5)]'
                }`}
              />

              {/* ==================================================== */}
              {/* ANIMATED SCAN LINE (Horizontal sweep over face area) */}
              {/* ==================================================== */}
              {isScanning && (
                <motion.div
                  className="absolute left-1 right-1 pointer-events-none"
                  animate={{
                    top: ['6%', '92%', '6%'],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Glowing Laser Line */}
                  <div
                    className={`h-[2px] w-full rounded-full transition-colors duration-300 ${
                      isVerified
                        ? 'bg-gradient-to-r from-transparent via-[#00ff87] to-transparent shadow-[0_0_12px_#00ff87]'
                        : livenessStatus?.active
                        ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24]'
                        : authState === 'verifying'
                        ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4]'
                        : 'bg-gradient-to-r from-transparent via-[#00ff87] to-transparent shadow-[0_0_12px_#00ff87]'
                    }`}
                  />
                  {/* Soft trailing atmospheric glow */}
                  <div
                    className={`w-full h-8 -mt-4 bg-gradient-to-b opacity-25 pointer-events-none ${
                      livenessStatus?.active
                        ? 'from-amber-400 to-transparent'
                        : authState === 'verifying'
                        ? 'from-cyan-400 to-transparent'
                        : 'from-[#00ff87] to-transparent'
                    }`}
                  />
                </motion.div>
              )}

              {/* Faint Face Guide Silhouette when searching */}
              {authState === 'position_face' && !detectionInfo?.detected && (
                <div className="absolute inset-2 rounded-full border border-dashed border-white/20 opacity-40 pointer-events-none animate-pulse" />
              )}
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* SUCCESS ANIMATION OVERLAY */}
          {/* ==================================================== */}
          <AnimatePresence>
            {isVerified && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#060b18]/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                  className="w-16 h-16 rounded-full bg-[#00ff87]/20 border-2 border-[#00ff87] flex items-center justify-center shadow-[0_0_35px_rgba(0,255,136,0.6)] mb-2"
                >
                  <Check className="w-9 h-9 text-[#00ff87] stroke-[3]" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xs uppercase font-mono font-bold text-[#00ff87] tracking-wider"
                >
                  IDENTITY VERIFIED
                </motion.span>
                <span className="text-[10px] text-slate-300 font-mono mt-1">
                  Cryptographic Session Bound
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================== */}
          {/* FAILURE ANIMATION OVERLAY */}
          {/* ==================================================== */}
          <AnimatePresence>
            {!isLockedOut && isFailed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#060b18]/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                >
                  <AlertCircle size={24} />
                </motion.div>
                <p className="text-xs font-bold text-white mb-0.5">Verification Failed</p>
                <p className="text-[11px] text-slate-400 mb-2 max-w-[170px] leading-tight">
                  {errorMessage || 'Please align face in good lighting.'}
                </p>
                {typeof attemptsRemaining === 'number' && (
                  <p className="text-[10px] font-mono text-amber-400 mb-3">
                    Attempts left: {attemptsRemaining} / 3
                  </p>
                )}
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-xl bg-[#00ff87] hover:bg-[#00e67a] text-black font-bold text-xs flex items-center gap-1 shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
                >
                  <RefreshCw size={12} />
                  <span>Try Again</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. FACE POSITIONING / LIVENESS GUIDANCE BADGE */}
      {/* ==================================================== */}
      <div className="mt-2 mb-3 w-full max-w-xs flex flex-col items-center">
        <motion.div
          key={guidanceText}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
            isLockedOut
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : isVerified
              ? 'bg-[#00ff87]/15 border-[#00ff87]/30 text-[#00ff87]'
              : isFailed
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              : livenessStatus?.active
              ? 'bg-amber-400/10 border-amber-400/30 text-amber-300'
              : authState === 'verifying'
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : authState === 'face_detected'
              ? 'bg-[#00ff87]/10 border-[#00ff87]/25 text-[#00ff87]'
              : 'bg-white/[0.04] border-white/[0.08] text-slate-300'
          }`}
        >
          {isLockedOut ? (
            <ShieldAlert size={15} className="text-rose-400" />
          ) : isVerified ? (
            <ShieldCheck size={15} className="text-[#00ff87]" />
          ) : isFailed ? (
            <AlertCircle size={15} className="text-rose-400" />
          ) : livenessStatus?.active ? (
            <Eye size={15} className="text-amber-400 animate-pulse" />
          ) : (
            <ScanFace
              size={15}
              className={
                authState === 'verifying'
                  ? 'text-cyan-400 animate-spin'
                  : 'text-[#00ff87]'
              }
            />
          )}
          <span className="font-semibold">{guidanceText}</span>
        </motion.div>

        {/* Liveness Progress Bar (when challenge is active) */}
        {livenessStatus?.active && (
          <div className="w-full mt-2 space-y-1">
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400"
                initial={{ width: '0%' }}
                animate={{ width: `${livenessStatus.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-amber-300/80 font-mono">
              Anti-Spoofing: Verifying natural micro-movement...
            </p>
          </div>
        )}

        {/* Security Subtext & Debug Toggle */}
        <div className="w-full mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#00ff87]" />
            <span>NPCI 256-bit Client Liveness & Secure Enclave</span>
          </span>
          <button
            type="button"
            onClick={() => setShowDebug((prev) => !prev)}
            className="text-[10px] text-slate-500 hover:text-emerald-400 font-mono transition-colors"
          >
            {showDebug ? '[Hide Debug]' : '[EAR Debug]'}
          </button>
        </div>

        {/* Developer / Telemetry EAR Debug HUD */}
        {showDebug && debugInfo && (
          <div className="w-full mt-2.5 p-3 rounded-2xl bg-[#030712]/90 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] space-y-1.5 shadow-xl text-left">
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-emerald-500/20 pb-1">
              <span>LIVENESS / EAR TELEMETRY</span>
              <span className="text-cyan-400">{debugInfo.detectorType.toUpperCase()} ({debugInfo.fps} FPS)</span>
            </div>
            <div className="flex justify-between">
              <span>Left EAR: <strong className="text-white">{debugInfo.leftEAR.toFixed(2)}</strong></span>
              <span>Right EAR: <strong className="text-white">{debugInfo.rightEAR.toFixed(2)}</strong></span>
            </div>
            <div className="flex justify-between">
              <span>Avg EAR: <strong className="text-white">{debugInfo.avgEAR.toFixed(2)}</strong> (Base: {debugInfo.baselineOpenEAR.toFixed(2)})</span>
              <span
                className={`font-bold ${
                  debugInfo.eyeState === 'CLOSED'
                    ? 'text-amber-400 animate-pulse'
                    : debugInfo.eyeState === 'BLINK_DETECTED'
                    ? 'text-[#00ff87]'
                    : 'text-slate-300'
                }`}
              >
                Eye State: {debugInfo.eyeState}
              </span>
            </div>
            <div className="flex justify-between pt-0.5 text-[10px]">
              <span>
                Blink:{' '}
                {debugInfo.eyeState === 'CLOSED'
                  ? 'detecting...'
                  : debugInfo.blinkCount > 0
                  ? '✓ BLINK DETECTED'
                  : '0'}
              </span>
              {debugInfo.lastBlinkDurationMs > 0 && (
                <span className="text-cyan-300">{debugInfo.lastBlinkDurationMs}ms closure</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* ACCESSIBLE ACTIONS / FALLBACK CONTROLS */}
      {/* ==================================================== */}
      <div className="w-full max-w-xs flex flex-col gap-2 pt-1">
        {onFallbackToVoice && (
          <button
            type="button"
            onClick={onFallbackToVoice}
            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <Mic size={14} className="text-[#00ff87]" />
            <span>Switch to Voice Key fallback</span>
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel Payment
          </button>
        )}
      </div>
    </div>
  );
};
