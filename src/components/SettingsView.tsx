import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mic,
  Lock,
  Bell,
  Terminal,
  Trash2,
  Check,
  Smartphone,
  User,
  Mail,
  Phone,
  QrCode,
  ScanFace,
  X,
  History,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';
import { FaceAuthentication } from './FaceAuthentication';
import { securityService, SecurityEventLog } from '../services/securityService';
import { UserProfile } from '../types';

interface SettingsViewProps {
  user?: UserProfile;
  showDebugConsole: boolean;
  onToggleDebug: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  showDebugConsole,
  onToggleDebug,
}) => {
  const [autoListen, setAutoListen] = useState(true);
  const [voiceBiometric, setVoiceBiometric] = useState(true);
  const [faceAuth, setFaceAuth] = useState(securityService.isFaceAuthEnabled());
  const [accent, setAccent] = useState('English (India)');
  const [showFaceTestModal, setShowFaceTestModal] = useState(false);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityEventLog[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'enrolled' | 'deleted'>(
    securityService.isFaceEnrolled() ? 'enrolled' : 'deleted'
  );

  useEffect(() => {
    setFaceAuth(securityService.isFaceAuthEnabled());
    setEnrollmentStatus(securityService.isFaceEnrolled() ? 'enrolled' : 'deleted');
  }, []);

  const handleToggleFaceAuth = (enabled: boolean) => {
    setFaceAuth(enabled);
    securityService.setFaceAuthEnabled(enabled);
  };

  const handleDeleteFaceData = () => {
    securityService.deleteEnrolledFaceData();
    setEnrollmentStatus('deleted');
    setFaceAuth(false);
    setDeleteConfirmation(false);
    voiceAssistant.speak('Biometric face enrollment data has been deleted.', {
      listenAfterSpeaking: false,
    });
  };

  const handleOpenAuditLogs = () => {
    setAuditLogs(securityService.getSecurityLogs());
    setShowAuditLogsModal(true);
  };

  const handleTestVoice = () => {
    voiceAssistant.speak(
      "Hello! I am Vani, your voice payment companion. You can tell me who to pay and how much anytime.",
      { listenAfterSpeaking: true }
    );
  };

  return (
    <div className="space-y-6 pb-28 text-white">
      <div>
        <h2 className="text-xl font-bold">Preferences & Security</h2>
        <p className="text-xs text-slate-400">Configure speech engine, biometrics, and telemetry</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="p-5 rounded-3xl bg-[#060b18]/85 border border-white/[0.09] shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00ff87]/60 shadow-[0_0_15px_rgba(0,255,136,0.3)]"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00ff87] border-2 border-[#040711] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#00ff87]/15 text-[#00ff87] font-semibold border border-[#00ff87]/30">
                  Verified UPI User
                </span>
              </h3>
              <p className="text-xs text-violet-300 font-mono mt-0.5">{user.upiId}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {user.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Assistant Engine Settings */}
      <div className="p-5 rounded-3xl bg-[#060b18]/85 border border-white/[0.09] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Mic size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Voice Companion</h3>
              <p className="text-[11px] text-slate-400">Speech recognition and natural TTS</p>
            </div>
          </div>
          <button
            onClick={handleTestVoice}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 transition-colors"
          >
            Test Vani Voice
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="font-medium text-white block">Auto-Listen After Prompt</span>
            <span className="text-slate-400 text-[11px]">Keep microphone open for conversational turn-taking</span>
          </div>
          <input
            type="checkbox"
            checked={autoListen}
            onChange={(e) => setAutoListen(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="font-medium text-white block">Acoustic Voice Print</span>
            <span className="text-slate-400 text-[11px]">Match voice harmonics as secondary signature</span>
          </div>
          <input
            type="checkbox"
            checked={voiceBiometric}
            onChange={(e) => setVoiceBiometric(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Biometric Security & Face Authentication Settings */}
      <div className="p-5 rounded-3xl bg-[#060b18]/85 border border-white/[0.09] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[#00ff87]">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Biometrics & Cybersecurity</h3>
              <p className="text-[11px] text-slate-400">NPCI-grade liveness, face templates, and audit logs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAuditLogs}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History size={13} className="text-cyan-400" />
            <span>Auth History</span>
          </button>
        </div>

        {/* Face Authentication Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="font-medium text-white block">Face Authentication</span>
            <span className="text-slate-400 text-[11px]">
              {enrollmentStatus === 'enrolled'
                ? 'Active biometric authentication for payment transfers'
                : 'No face data enrolled on this device'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowFaceTestModal(true)}
              className="px-2.5 py-1 rounded-lg bg-[#00ff87]/10 hover:bg-[#00ff87]/20 border border-[#00ff87]/30 text-[11px] text-[#00ff87] font-semibold flex items-center gap-1 transition-colors"
            >
              <ScanFace size={12} />
              <span>Test Face ID</span>
            </button>
            <input
              type="checkbox"
              checked={faceAuth}
              onChange={(e) => handleToggleFaceAuth(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Delete Face Data */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="font-medium text-white block">Delete Face Data</span>
            <span className="text-slate-400 text-[11px]">
              Remove enrolled facial template from local secure hardware storage
            </span>
          </div>
          <div>
            {deleteConfirmation ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDeleteFaceData}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-[11px] text-white font-bold transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(false)}
                  className="px-2 py-1 rounded-lg bg-white/[0.08] text-[11px] text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirmation(true)}
                disabled={enrollmentStatus === 'deleted'}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] text-rose-400 font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} />
                <span>{enrollmentStatus === 'enrolled' ? 'Delete Biometrics' : 'Deleted'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Face ID Test Dialog */}
      {showFaceTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060e]/85 backdrop-blur-2xl">
          <div className="relative w-full max-w-md bg-[#060b18]/95 border border-white/[0.09] rounded-3xl p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowFaceTestModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-20"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <ScanFace size={18} className="text-[#00ff87]" />
                <span>Face ID Biometric Test</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Testing hardware camera feed and facial identity verification
              </p>
            </div>

            <FaceAuthentication
              recipientName="Test Recipient"
              amount={100}
              onSuccess={() => {
                setTimeout(() => setShowFaceTestModal(false), 1200);
              }}
              onCancel={() => setShowFaceTestModal(false)}
            />
          </div>
        </div>
      )}

      {/* Security Audit Logs Modal */}
      {showAuditLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060e]/85 backdrop-blur-2xl">
          <div className="relative w-full max-w-lg bg-[#060b18]/95 border border-white/[0.09] rounded-3xl p-6 shadow-2xl text-left max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowAuditLogsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-20"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-[#00ff87]" />
                <span>Biometric Security Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tamper-evident logs of authentication events and cryptographic tokens (no raw biometrics stored)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No security events recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#00ff87] text-[11px]">{log.action}</span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans">{log.details}</p>
                    {log.metadata && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span>NPCI ISO/IEC 30107-3 Liveness Compliant</span>
              <button
                onClick={() => setShowAuditLogsModal(false)}
                className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer & Debug Telemetry */}
      <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold">Developer Debug Telemetry</h3>
          </div>
          <button
            onClick={onToggleDebug}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              showDebugConsole
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
            }`}
          >
            {showDebugConsole ? 'Console Active' : 'Enable Console'}
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Displays real-time voice recognition events, biometrics template scoring, speech synthesis timings, and NPCI payment gateway payloads.
        </p>
      </div>
    </div>
  );
};
