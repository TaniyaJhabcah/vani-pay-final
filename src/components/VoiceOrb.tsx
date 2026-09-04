import React from 'react';
import { motion } from 'motion/react';
import { VoiceState } from '../types';

interface VoiceOrbProps {
  state: VoiceState;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  interactive?: boolean;
  onClick?: () => void;
}

// Deterministic floating orb particles for organic energy feeling
const ORB_PARTICLES = [
  { id: 1, angle: 30, radius: 1.18, size: 3, color: '#00ff87', dur: 7, delay: 0 },
  { id: 2, angle: 110, radius: 1.25, size: 2.5, color: '#8b5cf6', dur: 9, delay: 1.2 },
  { id: 3, angle: 195, radius: 1.15, size: 3.5, color: '#00ff87', dur: 8, delay: 2.5 },
  { id: 4, angle: 260, radius: 1.3, size: 2, color: '#34d399', dur: 10, delay: 0.8 },
  { id: 5, angle: 330, radius: 1.22, size: 3, color: '#a855f7', dur: 7.5, delay: 3 },
];

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  size = 'md',
  interactive = true,
  onClick,
}) => {
  // Dimensions map
  const containerSizeMap = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48 sm:w-52 sm:h-52',
    hero: 'w-64 h-64 sm:w-72 sm:h-72',
  };

  const corePixelSize = {
    sm: 58,
    md: 92,
    lg: 140,
    hero: 185,
  }[size];

  // State-specific palette configuration
  const getThemeConfig = () => {
    switch (state) {
      case 'listening':
        return {
          coreGlow: 'rgba(0, 255, 136, 0.6)',
          ambientGlow: 'rgba(0, 255, 136, 0.45)',
          violetGlow: 'rgba(139, 92, 246, 0.5)',
          outerRing: 'rgba(0, 255, 136, 0.8)',
          statusLabel: 'LISTENING',
        };
      case 'speaking':
        return {
          coreGlow: 'rgba(6, 182, 212, 0.55)',
          ambientGlow: 'rgba(0, 255, 136, 0.35)',
          violetGlow: 'rgba(139, 92, 246, 0.45)',
          outerRing: 'rgba(6, 182, 212, 0.7)',
          statusLabel: 'SPEAKING',
        };
      case 'processing':
        return {
          coreGlow: 'rgba(245, 158, 11, 0.55)',
          ambientGlow: 'rgba(168, 85, 247, 0.5)',
          violetGlow: 'rgba(168, 85, 247, 0.6)',
          outerRing: 'rgba(245, 158, 11, 0.7)',
          statusLabel: 'PROCESSING',
        };
      case 'verifying':
      case 'authorizing':
        return {
          coreGlow: 'rgba(139, 92, 246, 0.65)',
          ambientGlow: 'rgba(0, 255, 136, 0.45)',
          violetGlow: 'rgba(168, 85, 247, 0.75)',
          outerRing: 'rgba(168, 85, 247, 0.8)',
          statusLabel: 'VERIFYING',
        };
      case 'success':
        return {
          coreGlow: 'rgba(0, 255, 136, 0.8)',
          ambientGlow: 'rgba(16, 185, 129, 0.6)',
          violetGlow: 'rgba(5, 150, 105, 0.5)',
          outerRing: 'rgba(0, 255, 136, 0.9)',
          statusLabel: 'SUCCESS',
        };
      case 'error':
        return {
          coreGlow: 'rgba(239, 68, 68, 0.55)',
          ambientGlow: 'rgba(244, 63, 94, 0.45)',
          violetGlow: 'rgba(139, 92, 246, 0.3)',
          outerRing: 'rgba(244, 63, 94, 0.7)',
          statusLabel: 'ERROR',
        };
      default: // idle
        return {
          coreGlow: 'rgba(0, 255, 136, 0.35)',
          ambientGlow: 'rgba(0, 255, 136, 0.25)',
          violetGlow: 'rgba(139, 92, 246, 0.35)',
          outerRing: 'rgba(139, 92, 246, 0.4)',
          statusLabel: 'IDLE',
        };
    }
  };

  const theme = getThemeConfig();

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';
  const isVerifying = state === 'verifying' || state === 'authorizing';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  // Morphing speed multiplier based on voice activity
  const morphSpeed = isListening ? 0.6 : isSpeaking ? 0.8 : 1.0;

  return (
    <div
      className={`relative flex items-center justify-center ${containerSizeMap[size]} select-none cursor-${
        interactive ? 'pointer' : 'default'
      }`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      aria-label={`Vani Voice Engine: ${theme.statusLabel}`}
    >
      {/* 1. ATMOSPHERIC BLOOM: Deep Multi-Color Environmental Aura */}
      <motion.div
        className="absolute rounded-full pointer-events-none -z-20"
        style={{
          width: '160%',
          height: '160%',
          background: `radial-gradient(circle, ${theme.coreGlow} 0%, ${theme.ambientGlow} 35%, ${theme.violetGlow} 58%, transparent 75%)`,
          filter: 'blur(36px)',
        }}
        animate={
          isListening
            ? { scale: [1, 1.25, 1], opacity: [0.75, 1, 0.75] }
            : isSpeaking
            ? { scale: [1, 1.15, 1], opacity: [0.65, 0.9, 0.65] }
            : isProcessing
            ? { rotate: 360, scale: [0.95, 1.1, 0.95] }
            : { scale: [1, 1.08, 1], opacity: [0.45, 0.65, 0.45] }
        }
        transition={{
          duration: isListening ? 1.5 : isProcessing ? 3.2 : 3.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 2. EXPANDING SONAR SHOCKWAVES (Active Listening State) */}
      {isListening && (
        <>
          <motion.div
            className="absolute rounded-full border border-[#00ff87]/60 pointer-events-none -z-10"
            style={{ width: '100%', height: '100%' }}
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: [0.9, 1.75, 2.3], opacity: [0.9, 0.3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full border border-violet-400/50 pointer-events-none -z-10"
            style={{ width: '100%', height: '100%' }}
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: [0.9, 1.5, 2.0], opacity: [0.7, 0.2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
          />
        </>
      )}

      {/* 3. MULTIPLE SURROUNDING CIRCULAR LAYERS */}
      {/* 3a. Fine Dashed Outer Ring with Clockwise Orbital Particles */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '132%',
          height: '132%',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: isListening ? 14 : isProcessing ? 6 : 28,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Orbital Node: Neon Green */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#00ff87] shadow-[0_0_12px_#00ff87]"
        />
        {/* Orbital Node: Electric Violet */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_10px_#a855f7]"
        />
      </motion.div>

      {/* 3b. Violet Orbital Ring Element (Tilted Gyroscopic Plane) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '122%',
          height: '122%',
          transform: 'rotate(-22deg)',
        }}
      >
        <motion.div
          className="w-full h-full rounded-full border border-violet-500/40"
          style={{
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.25)',
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: isListening ? 18 : 34,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Traveling Violet Orbital Satellite */}
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_8px_#c084fc]" />
        </motion.div>
      </div>

      {/* 3c. Concentric Thin Neon Boundary Ring */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '112%',
          height: '112%',
          border: `1px solid ${theme.outerRing}`,
          opacity: isListening ? 0.65 : 0.35,
        }}
        animate={{
          scale: isListening ? [1, 1.04, 1] : [1, 1.01, 1],
          opacity: isListening ? [0.65, 0.9, 0.65] : [0.3, 0.45, 0.3],
        }}
        transition={{
          duration: isListening ? 1.6 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 4. FLOATING ORBITAL LIGHT PARTICLES */}
      <div className="absolute inset-0 pointer-events-none">
        {ORB_PARTICLES.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * (p.radius * 40);
          const y = 50 + Math.sin(rad) * (p.radius * 40);

          return (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              }}
              animate={{
                scale: [0.8, 1.4, 0.8],
                opacity: [0.3, 0.9, 0.3],
                y: [0, -6, 0],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 5. ORGANIC GREEN ENERGY FORM (Multiple Irregular Flowing Layers) */}
      {/* ========================================================= */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${corePixelSize}px`, height: `${corePixelSize}px` }}
      >
        {/* 5a. LAYER 1: Outermost Irregular Flowing Organic Blob with Neon-Green Edges */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(0, 255, 136, 0.35) 0%, rgba(16, 185, 129, 0.25) 45%, rgba(5, 150, 105, 0.1) 80%)',
            border: '2px solid rgba(0, 255, 136, 0.85)',
            boxShadow:
              '0 0 30px rgba(0, 255, 136, 0.55), inset 0 0 20px rgba(0, 255, 136, 0.35)',
            filter: 'drop-shadow(0 0 10px #00ff87)',
          }}
          animate={{
            borderRadius: [
              '46% 54% 62% 38% / 52% 42% 58% 48%',
              '58% 42% 38% 62% / 40% 64% 36% 60%',
              '36% 64% 54% 46% / 60% 36% 64% 40%',
              '46% 54% 62% 38% / 52% 42% 58% 48%',
            ],
            rotate: [0, 120, 240, 360],
            scale: isListening ? [1, 1.08, 0.98, 1] : [1, 1.03, 1],
          }}
          transition={{
            borderRadius: {
              duration: 9 * morphSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              duration: 16 * morphSpeed,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: isListening ? 1.5 : 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />

        {/* 5b. LAYER 2: Middle Translucent Green Interior Energy Flow */}
        <motion.div
          className="absolute inset-1 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 255, 136, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(16, 185, 129, 0.35) 100%)',
            border: '1.5px solid rgba(52, 211, 153, 0.65)',
            boxShadow:
              '0 0 20px rgba(0, 255, 136, 0.4), inset 0 0 15px rgba(139, 92, 246, 0.25)',
          }}
          animate={{
            borderRadius: [
              '60% 40% 30% 70% / 60% 30% 70% 40%',
              '30% 70% 70% 30% / 50% 60% 40% 50%',
              '55% 45% 40% 60% / 35% 65% 35% 65%',
              '60% 40% 30% 70% / 60% 30% 70% 40%',
            ],
            rotate: [360, 240, 120, 0],
            scale: isListening ? [1.02, 0.98, 1.04, 1.02] : [1, 1.02, 1],
          }}
          transition={{
            borderRadius: {
              duration: 12 * morphSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              duration: 20 * morphSpeed,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: isListening ? 1.8 : 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />

        {/* 5c. LAYER 3: Dynamic Waveform-like Ripple Layer */}
        <motion.div
          className="absolute inset-2 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 255, 136, 0.25) 0%, rgba(6, 182, 212, 0.15) 55%, transparent 80%)',
            border: '1px solid rgba(0, 255, 136, 0.4)',
          }}
          animate={{
            borderRadius: [
              '50% 50% 40% 60% / 60% 40% 60% 40%',
              '45% 55% 60% 40% / 40% 60% 40% 60%',
              '50% 50% 40% 60% / 60% 40% 60% 40%',
            ],
            scale: isListening ? [0.94, 1.06, 0.94] : [0.97, 1.02, 0.97],
            opacity: isListening ? [0.6, 0.95, 0.6] : [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: isListening ? 1.2 : 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* ========================================================= */}
        {/* 6. CENTRAL CIRCULAR CONTROL (Obsidian Glass Disc & Audio Core) */}
        {/* ========================================================= */}
        <motion.div
          className="relative rounded-full flex items-center justify-center z-10 overflow-hidden shadow-2xl"
          style={{
            width: '64%',
            height: '64%',
            background: 'radial-gradient(circle at 40% 40%, #0c1527 0%, #050a14 70%, #03060d 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow:
              '0 0 35px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0, 255, 136, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
          }}
          animate={
            isListening
              ? { scale: [1, 1.05, 1], filter: 'brightness(1.2)' }
              : isSpeaking
              ? { scale: [1, 1.03, 1], filter: 'brightness(1.12)' }
              : isProcessing
              ? { scale: [0.97, 1.03, 0.97] }
              : isVerifying
              ? { scale: [1, 1.04, 1] }
              : { scale: [1, 1.02, 1] }
          }
          transition={{
            duration: isListening ? 1.2 : 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Concentric Neon Halo Rim inside the control */}
          <div className="absolute inset-1 rounded-full border border-[#00ff87]/30 pointer-events-none" />

          {/* ========================================================= */}
          {/* 7. VERTICAL WHITE/GREEN AUDIO WAVEFORM BARS IN THE CENTER */}
          {/* ========================================================= */}
          <div className="relative z-20 flex items-center justify-center w-full h-full p-2">
            {/* STATE A: LISTENING / SPEAKING / IDLE -> Reactive White/Green Bars */}
            {(isListening || isSpeaking || state === 'idle') && (
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-3/5 w-4/5">
                {[
                  { factor: 0.35, isWhite: false },
                  { factor: 0.7, isWhite: true },
                  { factor: 0.95, isWhite: false },
                  { factor: 0.65, isWhite: true },
                  { factor: 1.0, isWhite: true }, // Center bar: crisp white
                  { factor: 0.65, isWhite: true },
                  { factor: 0.95, isWhite: false },
                  { factor: 0.7, isWhite: true },
                  { factor: 0.35, isWhite: false },
                ].map((bar, idx) => {
                  const barHeightMax = isListening
                    ? bar.factor * 100
                    : isSpeaking
                    ? bar.factor * 85
                    : bar.factor * 45;

                  const barHeightMin = isListening ? 22 : isSpeaking ? 16 : 14;

                  const barBg = bar.isWhite ? 'bg-white' : 'bg-[#00ff87]';
                  const barShadow = bar.isWhite
                    ? '0 0 8px rgba(255, 255, 255, 0.9), 0 0 14px rgba(255, 255, 255, 0.5)'
                    : '0 0 10px #00ff87, 0 0 16px rgba(0, 255, 136, 0.6)';

                  return (
                    <motion.div
                      key={idx}
                      className={`w-1 sm:w-1.5 rounded-full ${barBg}`}
                      style={{
                        boxShadow: barShadow,
                      }}
                      animate={{
                        height: [`${barHeightMin}%`, `${barHeightMax}%`, `${barHeightMin}%`],
                        opacity: isListening ? [0.85, 1, 0.85] : [0.55, 0.85, 0.55],
                      }}
                      transition={{
                        duration: isListening
                          ? 0.5 + (idx % 4) * 0.08
                          : isSpeaking
                          ? 1.0 + (idx % 3) * 0.1
                          : 1.8 + idx * 0.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: idx * 0.06,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* STATE B: PROCESSING -> Quantum Vortex */}
            {isProcessing && (
              <div className="relative w-3/4 h-3/4 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent border-r-transparent shadow-[0_0_12px_#f59e0b]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-violet-400 border-b-transparent border-l-transparent shadow-[0_0_10px_#8b5cf6]"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-300 shadow-[0_0_14px_#f59e0b] animate-ping" />
              </div>
            )}

            {/* STATE C: VERIFYING / AUTHORIZING -> Biometric Voice Signature Reticle */}
            {isVerifying && (
              <div className="relative w-4/5 h-4/5 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border border-violet-400/70"
                  animate={{ scale: [0.85, 1.12, 0.85], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[#00ff87] to-transparent shadow-[0_0_10px_#00ff87]"
                  animate={{ y: [-20, 20, -20] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="w-6 h-6 rounded-full border-2 border-[#00ff87] flex items-center justify-center shadow-[0_0_12px_#00ff87]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00ff87] animate-ping" />
                </div>
              </div>
            )}

            {/* STATE D: SUCCESS -> Radiant Emerald Triumph */}
            {isSuccess && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 140 }}
                className="flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-[#00ff87] drop-shadow-[0_0_14px_#00ff87]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}

            {/* STATE E: ERROR -> Diagnostic Pulse */}
            {isError && (
              <motion.div
                animate={{ scale: [0.92, 1.08, 0.92] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center justify-center text-rose-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-9 h-9 text-rose-400 drop-shadow-[0_0_12px_#f43f5e]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

