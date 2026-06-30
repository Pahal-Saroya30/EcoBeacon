/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number; // initial x
  y: number; // initial y
  destX: number; // random destination x offset
  destY: number; // random destination y offset
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'leaf';
  rotation: number;
}

interface ConfettiOverlayProps {
  active: boolean;
  onComplete: () => void;
}

const PARTICLE_COLORS = [
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#84cc16', // lime-500
];

const SHAPES: ('circle' | 'square' | 'triangle' | 'leaf')[] = ['circle', 'square', 'triangle', 'leaf'];

export default function ConfettiOverlay({ active, onComplete }: ConfettiOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate burst of particles
    const generated: Particle[] = [];
    const count = 100; // substantial, gamified burst

    for (let i = 0; i < count; i++) {
      // Half from left bottom, half from right bottom
      const startFromLeft = i % 2 === 0;
      const initialX = startFromLeft ? -50 : window.innerWidth + 50;
      const initialY = window.innerHeight * 0.85;

      // Calculate trajectories
      const angleDeg = startFromLeft 
        ? 30 + Math.random() * 50  // shoot right-up
        : 100 + Math.random() * 50; // shoot left-up

      const angleRad = (angleDeg * Math.PI) / 180;
      const velocity = 300 + Math.random() * 500; // velocity in px
      
      const destX = Math.cos(angleRad) * velocity + (startFromLeft ? 50 : -50);
      const destY = -Math.sin(angleRad) * velocity * 0.8; // negative goes up

      generated.push({
        id: i,
        x: initialX,
        y: initialY,
        destX,
        destY,
        size: 8 + Math.random() * 16,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        rotation: Math.random() * 360,
      });
    }

    setParticles(generated);

    // Auto terminate active state after animation duration
    const timeout = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => clearTimeout(timeout);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden" id="gamified-confetti-stage">
      <AnimatePresence>
        {particles.map((p) => {
          // Custom SVG shapes for organic gamified touch (e.g. Leaf shape)
          return (
            <motion.div
              key={p.id}
              initial={{
                opacity: 1,
                x: p.x,
                y: p.y,
                scale: 0.1,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0.8, 0],
                x: [p.x, p.x + p.destX * 0.5, p.x + p.destX, p.x + p.destX * 1.1],
                y: [p.y, p.y + p.destY, p.y + p.destY + 120, p.y + p.destY + 450], // gravity fall path
                scale: [1, 1.2, 0.9, 0.4],
                rotate: [0, p.rotation, p.rotation * 2.5, p.rotation * 4],
              }}
              transition={{
                duration: 3 + Math.random() * 1.5,
                ease: [0.1, 0.8, 0.25, 1],
              }}
              className="absolute"
              style={{
                width: p.size,
                height: p.size,
              }}
            >
              {p.shape === 'circle' && (
                <div
                  className="w-full h-full rounded-full shadow-xs"
                  style={{ backgroundColor: p.color }}
                />
              )}
              {p.shape === 'square' && (
                <div
                  className="w-full h-full shadow-xs rounded-xs"
                  style={{ backgroundColor: p.color }}
                />
              )}
              {p.shape === 'triangle' && (
                <div
                  className="w-0 h-0 border-l-transparent border-r-transparent border-b-current shadow-xs"
                  style={{
                    borderLeftWidth: p.size / 2,
                    borderRightWidth: p.size / 2,
                    borderBottomWidth: p.size,
                    borderBottomColor: p.color,
                    color: p.color,
                  }}
                />
              )}
              {p.shape === 'leaf' && (
                <svg
                  viewBox="0 0 24 24"
                  fill={p.color}
                  className="w-full h-full drop-shadow-sm opacity-90"
                >
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.58,20C12,19.5 18,17 21,11C22,9 20.96,4.96 21,3C19.04,3.04 15,2 13,3C7,6 4.5,12 4,17.42L2,18.29L2.66,20.18C7.83,18.1 14,16 16,7C14.5,8.5 12,10 8,11C10,7 13.5,4.5 17,3C17,3 18.5,4.5 17,8Z" />
                </svg>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Center Congratulations Card Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.05, 1, 0.9], y: [50, 0, 0, -20] }}
        transition={{
          times: [0, 0.15, 0.85, 1],
          duration: 3.5,
          ease: 'easeInOut'
        }}
        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-2 border-green-500/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center gap-3 max-w-[340px] z-[99999]"
      >
        <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 text-green-650 flex items-center justify-center font-bold text-3xl animate-bounce select-none">
          🌱
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-950 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-1.5 justify-center">
            ✨ Mission Accomplished! ✨
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-extrabold mt-1">
            Amazing action saved to local ledger. Eco points and daily streak updated successfully!
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xs shadow-md uppercase tracking-wider">
          Double Impact Unlocked
        </div>
      </motion.div>
    </div>
  );
}
