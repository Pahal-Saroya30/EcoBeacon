/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Star, Sparkles, ArrowRight, Share2, Check } from 'lucide-react';
import { Badge } from './Achievements';

interface ToastItem {
  id: string;
  badge: Badge;
}

interface AchievementToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  onViewAchievements: () => void;
}

export default function AchievementToast({ toasts, onRemove, onViewAchievements }: AchievementToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" id="achievement-toasts-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onRemove={() => onRemove(toast.id)}
            onViewAchievements={onViewAchievements}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string | number;
  toast: ToastItem;
  onRemove: () => void;
  onViewAchievements: () => void;
}

function ToastCard({ toast, onRemove, onViewAchievements }: ToastCardProps) {
  const { badge } = toast;
  const [copied, setCopied] = useState(false);

  // Auto-remove after 6 seconds unless user is copying
  useEffect(() => {
    if (copied) return;
    const timer = setTimeout(() => {
      onRemove();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onRemove, copied]);

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `🏆 Achievement Unlocked on EcoBeacon! I just earned the "${badge.icon} ${badge.title}" EcoBadge: "${badge.description}". Join me in making our neighborhood cleaner and greener! 🌍🌱`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getTierColors = (tier: Badge['tier']) => {
    switch (tier) {
      case 'Gold':
        return {
          border: 'border-amber-400 dark:border-amber-500',
          bg: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 dark:from-amber-950/40 dark:to-yellow-950/30',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
          glow: 'shadow-amber-500/15 dark:shadow-amber-500/5',
          progress: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        };
      case 'Silver':
        return {
          border: 'border-slate-350 dark:border-zinc-700',
          bg: 'bg-gradient-to-r from-slate-500/10 to-zinc-500/10 dark:from-zinc-900/40 dark:to-zinc-850/30',
          badgeBg: 'bg-slate-150 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300',
          glow: 'shadow-slate-500/15 dark:shadow-zinc-500/5',
          progress: 'bg-gradient-to-r from-slate-400 to-zinc-400',
        };
      case 'Bronze':
      default:
        return {
          border: 'border-orange-300 dark:border-orange-900/40',
          bg: 'bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-950/40 dark:to-red-950/30',
          badgeBg: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
          glow: 'shadow-orange-500/15 dark:shadow-orange-500/5',
          progress: 'bg-gradient-to-r from-orange-400 to-red-400',
        };
    }
  };

  const colors = getTierColors(badge.tier);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9, rotate: -1 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02, rotate: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`pointer-events-auto relative w-full bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border-2 ${colors.border} rounded-2xl p-4.5 shadow-xl ${colors.glow} flex flex-col overflow-hidden group/toast`}
      id={`achievement-toast-${badge.id}`}
    >
      {/* Decorative organic light source background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] rounded-full blur-xl pointer-events-none" />

      {/* Main Toast Row */}
      <div className="flex gap-3.5 items-start">
        {/* Unlocked Animated Badge Icon Badge with Glow */}
        <div className="relative shrink-0">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-3.5xl border border-white/10 ${colors.badgeBg} shadow-inner select-none`}
          >
            {badge.icon}
          </motion.div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border border-white dark:border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold shadow-xs animate-bounce">
            ★
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              ACHIEVEMENT UNLOCKED
            </span>
            <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded border ${colors.badgeBg} border-current/25`}>
              {badge.tier}
            </span>
          </div>

          <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-150 tracking-tight mt-1 truncate">
            {badge.title}
          </h4>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal line-clamp-2">
            {badge.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewAchievements();
                onRemove();
              }}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-extrabold tracking-wide uppercase flex items-center gap-1 cursor-pointer select-none transition-all duration-200"
            >
              <span>View Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 text-current shrink-0" />
            </button>

            <button
              id={`share-achievement-toast-btn-${badge.id}`}
              type="button"
              onClick={handleShareClick}
              className="text-[11px] text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 font-extrabold tracking-wide uppercase flex items-center gap-1 cursor-pointer select-none transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-500 font-black">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-current shrink-0" />
                  <span>Share Achievement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 -mr-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg shrink-0 cursor-pointer transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar Lifespan Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className={`h-full ${colors.progress}`}
        />
      </div>
    </motion.div>
  );
}
