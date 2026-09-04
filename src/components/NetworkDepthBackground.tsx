import React from 'react';
import { motion } from 'motion/react';

// Pre-calculated deterministic floating particle positions for GPU-friendly smooth rendering
const PARTICLES = [
  { id: 1, x: '12%', y: '18%', size: 2.5, color: '#10b981', dur: 18, delay: 0 },
  { id: 2, x: '28%', y: '45%', size: 2.0, color: '#8b5cf6', dur: 22, delay: 2 },
  { id: 3, x: '42%', y: '12%', size: 3.0, color: '#06b6d4', dur: 19, delay: 4 },
  { id: 4, x: '58%', y: '32%', size: 2.0, color: '#10b981', dur: 24, delay: 1 },
  { id: 5, x: '74%', y: '62%', size: 2.5, color: '#8b5cf6', dur: 20, delay: 5 },
  { id: 6, x: '88%', y: '25%', size: 1.8, color: '#00ff87', dur: 26, delay: 3 },
  { id: 7, x: '15%', y: '78%', size: 2.2, color: '#a855f7', dur: 21, delay: 6 },
  { id: 8, x: '35%', y: '85%', size: 2.8, color: '#10b981', dur: 23, delay: 2 },
  { id: 9, x: '65%', y: '80%', size: 2.0, color: '#38bdf8', dur: 25, delay: 4 },
  { id: 10, x: '82%', y: '90%', size: 2.4, color: '#10b981', dur: 19, delay: 7 },
  { id: 11, x: '48%', y: '55%', size: 2.0, color: '#8b5cf6', dur: 27, delay: 3 },
  { id: 12, x: '92%', y: '50%', size: 1.5, color: '#00ff87', dur: 22, delay: 5 },
];

export const NetworkDepthBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#040711]">
      {/* 1. Moving Atmospheric Glow 1: Electric Violet Light */}
      <motion.div
        className="absolute -top-32 -left-32 w-[620px] h-[620px] rounded-full bg-violet-600/18 blur-[140px] will-change-transform"
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 2. Moving Atmospheric Glow 2: Neon Emerald / Green Vani Light */}
      <motion.div
        className="absolute top-1/4 -right-40 w-[650px] h-[650px] rounded-full bg-emerald-500/14 blur-[150px] will-change-transform"
        animate={{
          x: [0, -60, 20, 0],
          y: [0, 50, -40, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 3. Moving Atmospheric Glow 3: Deep Cyan / Electric Pulse */}
      <motion.div
        className="absolute -bottom-40 left-1/4 w-[580px] h-[580px] rounded-full bg-indigo-600/15 blur-[140px] will-change-transform"
        animate={{
          x: [0, 40, -50, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.12, 0.98, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 4. Center Ambient Breathing Bloom */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-emerald-500/6 blur-[160px] will-change-transform"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 5. Floating AI Particles / Light Fragments */}
      <div className="absolute inset-0">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full will-change-transform"
            style={{
              left: p.x,
              top: p.y,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
            animate={{
              y: [0, -45, -90, -45, 0],
              x: [0, 15, -15, 10, 0],
              opacity: [0.2, 0.8, 0.4, 0.9, 0.2],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 6. Subtle Cybernetic Neural Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 7. Vignette to keep foreground UI pristine and readable */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#040711]/40 to-[#040711]" />
    </div>
  );
};
