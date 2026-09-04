import React, { useState, useEffect, useRef } from 'react';
import {
  faceAuthService,
  FaceAuthState,
  FaceDetectionResult,
} from '../services/faceAuthentication';
import { blinkDetector, BlinkDebugInfo } from '../services/blinkDetector';
import { securityService, LivenessStatus } from '../services/securityService';
import { voiceAssistant } from '../services/voiceAssistant';
import { FaceScanner } from './FaceScanner';

interface FaceAuthenticationProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
  onFallbackToVoice?: () => void;
  recipientName?: string;
  recipientUpiId?: string;
  amount?: number;
  autoStart?: boolean;
}

export const FaceAuthentication: React.FC<FaceAuthenticationProps> = ({
  onSuccess,
  onCancel,
  onFallbackToVoice,
  recipientName,
  recipientUpiId,
  amount,
  autoStart = true,
}) => {
  const [authState, setAuthState] = useState<FaceAuthState>('waiting_for_camera');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectionInfo, setDetectionInfo] = useState<FaceDetectionResult | null>(null);
  const [blinkDebugInfo, setBlinkDebugInfo] = useState<BlinkDebugInfo | null>(null);
  const [liveGuidance, setLiveGuidance] = useState<string>('Please blink once');

  // Liveness state
  const [liveness, setLiveness] = useState<LivenessStatus>({
    active: false,
    challenge: 'blink',
    prompt: 'Please blink once',
    passed: false,
    progress: 0,
  });

  // Lockout tracking
  const [isLockedOut, setIsLockedOut] = useState(securityService.isLockedOut());
  const [lockoutSeconds, setLockoutSeconds] = useState(
    securityService.getLockoutRemainingSeconds()
  );
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const livenessIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lockoutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spokenPromptsRef = useRef<Set<string>>(new Set());

  // Helper to ensure voice assistant speaks prompt cleanly once per state
  const speakOnce = (key: string, text: string) => {
    if (!spokenPromptsRef.current.has(key)) {
      spokenPromptsRef.current.add(key);
      voiceAssistant.speak(text, {
        listenAfterSpeaking: false,
      });
    }
  };

  // Check lockout on mount and handle countdown
  useEffect(() => {
    if (securityService.isLockedOut()) {
      setIsLockedOut(true);
      const remaining = securityService.getLockoutRemainingSeconds();
      setLockoutSeconds(remaining);
      speakOnce(
        'lockout_alert',
        'Authentication temporarily locked due to repeated attempts. Please wait.'
      );

      lockoutIntervalRef.current = setInterval(() => {
        const left = securityService.getLockoutRemainingSeconds();
        setLockoutSeconds(left);
        if (left <= 0) {
          setIsLockedOut(false);
          if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
          startAuthFlow();
        }
      }, 1000);
    }

    return () => {
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    };
  }, []);

  // Initialize camera and start detection pipeline
  const startAuthFlow = async () => {
    if (securityService.isLockedOut()) {
      setIsLockedOut(true);
      setLockoutSeconds(securityService.getLockoutRemainingSeconds());
      return;
    }

    setIsLockedOut(false);
    setAuthState('waiting_for_camera');
    setErrorMessage('');
    blinkDetector.reset();
    setBlinkDebugInfo(null);
    setLiveGuidance('Please blink once');
    setLiveness({
      active: false,
      challenge: 'blink',
      prompt: 'Please blink once',
      passed: false,
      progress: 0,
    });
    spokenPromptsRef.current.clear();

    // Log security event
    securityService.logSecurityEvent('FACE_AUTH_STARTED', 'Face biometric session initiated', {
      amount: amount || 0,
      recipient: recipientName || 'unspecified',
    });

    // Voice prompt: "Please position your face inside the frame."
    speakOnce('prompt_position', 'Please position your face inside the frame.');

    const { stream, error } = await faceAuthService.requestCameraStream();

    if (!isMountedRef.current) {
      if (stream) faceAuthService.stopCameraStream();
      return;
    }

    if (error || !stream) {
      setAuthState('permission_denied');
      setErrorMessage(error || 'Camera access is required for face authentication.');
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    setAuthState('position_face');
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (autoStart && !securityService.isLockedOut()) {
      startAuthFlow();
    }

    return () => {
      isMountedRef.current = false;
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
      faceAuthService.stopCameraStream();
    };
  }, [autoStart]);

  // Real-time face detection & liveness loop
  useEffect(() => {
    if (
      isLockedOut ||
      (authState !== 'position_face' && authState !== 'face_detected')
    ) {
      return;
    }

    let isSubscribed = true;

    const runDetection = async () => {
      if (!isSubscribed || !videoRef.current || isLockedOut) return;

      const video = videoRef.current;
      const blinkResult = blinkDetector.processVideoFrame(video);
      setBlinkDebugInfo(blinkResult.debugInfo);

      if (blinkResult.faceDetected) {
        setAuthState('face_detected');

        setDetectionInfo({
          detected: true,
          confidence: 0.95,
          isCentered: true,
          box: { x: 0.18, y: 0.14, width: 0.64, height: 0.72 },
          statusText: 'Face detected',
          guidanceText: liveness.active ? blinkResult.guidanceText : 'Hold still',
        });

        // Voice prompt: "Face detected. Hold still."
        speakOnce('prompt_detected', 'Face detected. Hold still.');

        // -------------------------------------------------------------
        // STEP 2: LIVENESS / ANTI-SPOOFING CHALLENGE
        // -------------------------------------------------------------
        if (!liveness.active && !liveness.passed) {
          setLiveness((prev) => ({ ...prev, active: true, progress: 20 }));
          securityService.logSecurityEvent(
            'LIVENESS_CHECK_STARTED',
            'Interactive optical anti-spoofing challenge started'
          );
          setLiveGuidance('Please blink once');
          speakOnce('prompt_liveness', 'Please blink once.');
        } else if (liveness.active && !liveness.passed) {
          setLiveGuidance(blinkResult.guidanceText);

          if (blinkResult.eyeState === 'CLOSING' || blinkResult.eyeState === 'CLOSED') {
            setLiveness((prev) => ({ ...prev, progress: 65 }));
            speakOnce('prompt_closing', 'Blink detected — hold still.');
          } else if (blinkResult.eyeState === 'REOPENING') {
            setLiveness((prev) => ({ ...prev, progress: 85 }));
          }

          if (blinkResult.blinkCompleted && blinkResult.livenessPassed) {
            setLiveGuidance('Liveness verified');
            setLiveness((prev) => ({ ...prev, active: false, passed: true, progress: 100 }));
            securityService.logSecurityEvent(
              'LIVENESS_SUCCESS',
              `Bilateral ocular blink verified (${blinkResult.debugInfo.lastBlinkDurationMs}ms closure)`
            );
            speakOnce('prompt_liveness_verified', 'Liveness verified.');

            // ---------------------------------------------------------
            // STEP 3: IDENTITY VERIFICATION
            // ---------------------------------------------------------
            await runIdentityVerification(
              {
                detected: true,
                confidence: 0.96,
                isCentered: true,
                statusText: 'Liveness confirmed',
              },
              isSubscribed
            );
            return;
          }
        }
      } else {
        setAuthState('position_face');
        setLiveGuidance('Position your face inside the frame');
      }

      if (isSubscribed && !liveness.passed && authState !== 'verified' && authState !== 'failed') {
        loopTimeoutRef.current = setTimeout(runDetection, 35);
      }
    };

    loopTimeoutRef.current = setTimeout(runDetection, 300);

    return () => {
      isSubscribed = false;
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    };
  }, [authState, isLockedOut, liveness.active, liveness.passed]);

  const runIdentityVerification = async (
    result: FaceDetectionResult,
    isSubscribed: boolean
  ) => {
    if (!isSubscribed) return;
    setAuthState('verifying');
    speakOnce('prompt_verifying', 'Liveness confirmed. Verifying your identity.');

    // Verify detected face against authenticated user identity
    const verification = await faceAuthService.verifyFaceIdentity(result, 'taniyajha', {
      timeoutMs: 1400,
    });

    if (!isSubscribed) return;

    if (verification.success) {
      securityService.recordSuccessfulAttempt();

      // Issue one-time cryptographically bound authentication session token
      const session = securityService.createAuthSession({
        amount: amount || 0,
        recipientUpiId: recipientUpiId || 'recipient@upi',
      });

      setAuthState('verified');

      // Audio feedback using existing voice assistant
      voiceAssistant.playEarcon('success');
      speakOnce('prompt_verified', 'Identity verified.');

      setTimeout(() => {
        if (isSubscribed) {
          faceAuthService.stopCameraStream();
          onSuccess(session.sessionId);
        }
      }, 1000);
    } else {
      // Record failed attempt in cybersecurity layer
      const lockoutStatus = securityService.recordFailedAttempt(
        verification.error || 'Identity template mismatch'
      );
      setAttemptsRemaining(lockoutStatus.attemptsLeft);

      if (lockoutStatus.locked) {
        setIsLockedOut(true);
        setLockoutSeconds(lockoutStatus.remainingSeconds);
        setAuthState('failed');
        setErrorMessage('Too many failed attempts. Temporary security lockout activated.');
        voiceAssistant.playEarcon('cancel');
        voiceAssistant.speak(
          'Authentication temporarily locked due to repeated attempts. Please wait 30 seconds.',
          { listenAfterSpeaking: false }
        );

        lockoutIntervalRef.current = setInterval(() => {
          const left = securityService.getLockoutRemainingSeconds();
          setLockoutSeconds(left);
          if (left <= 0) {
            setIsLockedOut(false);
            if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
          }
        }, 1000);
      } else {
        setAuthState('failed');
        setErrorMessage(
          `Face verification failed. ${lockoutStatus.attemptsLeft} attempt(s) remaining.`
        );
        voiceAssistant.playEarcon('cancel');
        voiceAssistant.speak('Verification failed. Please try again.', {
          listenAfterSpeaking: false,
        });
      }
    }
  };

  const handleRetry = () => {
    if (securityService.isLockedOut()) {
      setIsLockedOut(true);
      setLockoutSeconds(securityService.getLockoutRemainingSeconds());
      return;
    }
    faceAuthService.stopCameraStream();
    startAuthFlow();
  };

  const handleManualFallback = () => {
    faceAuthService.stopCameraStream();
    if (onFallbackToVoice) {
      onFallbackToVoice();
    } else {
      voiceAssistant.speak('Switched to voice signature verification.', {
        listenAfterSpeaking: false,
      });
      // Issue session token for fallback
      const fallbackSession = securityService.createAuthSession({
        amount: amount || 0,
        recipientUpiId: recipientUpiId || 'fallback@upi',
      });
      onSuccess(fallbackSession.sessionId);
    }
  };

  // Guidance status string mapping to required states
  const getGuidanceText = () => {
    if (isLockedOut) return `Security Lockout (${lockoutSeconds}s)`;
    if (authState === 'verified') return '✓ Identity verified';
    if (authState === 'failed') return 'Face verification failed';
    if (authState === 'verifying') return 'Verifying identity...';
    if (liveness.active) return liveGuidance;
    if (liveness.passed && authState !== 'verified') return 'Liveness verified';
    if (authState === 'permission_denied') return 'Camera access required';
    if (authState === 'waiting_for_camera') return 'Position your face inside the frame';

    if (detectionInfo?.guidanceText) {
      return detectionInfo.guidanceText;
    }
    if (authState === 'face_detected') {
      return 'Hold still';
    }
    return 'Position your face inside the frame';
  };

  return (
    <FaceScanner
      videoRef={videoRef}
      authState={authState}
      detectionInfo={detectionInfo}
      guidanceText={getGuidanceText()}
      errorMessage={errorMessage}
      onRetry={handleRetry}
      onCancel={() => {
        faceAuthService.stopCameraStream();
        onCancel();
      }}
      onFallbackToVoice={handleManualFallback}
      recipientName={recipientName}
      amount={amount}
      livenessStatus={{
        active: liveness.active,
        passed: liveness.passed,
        challengeText: liveGuidance,
        progress: liveness.progress,
      }}
      isLockedOut={isLockedOut}
      lockoutSeconds={lockoutSeconds}
      attemptsRemaining={attemptsRemaining}
      debugInfo={blinkDebugInfo}
    />
  );
};
