/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Check, Info, Share2, Compass, Bookmark, ExternalLink } from 'lucide-react';
import { ECO_TIPS, EcoTip } from '../data/ecoTips';

export default function EcoTipCard() {
  // Get index for daily tip based on day of year
  const getDailyIndex = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return day % ECO_TIPS.length;
  };

  const dailyIndex = getDailyIndex();
  const todayTip = ECO_TIPS[dailyIndex];

  const [currentTip, setCurrentTip] = useState<EcoTip>(todayTip);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  const [readTips, setReadTips] = useState<Set<string>>(new Set());
  const [completedToday, setCompletedToday] = useState<boolean>(false);
  const [showShareSuccess, setShowShareSuccess] = useState<boolean>(false);
  const [tipsReadStreak, setTipsReadStreak] = useState<number>(0);

  // Load from local storage
  useEffect(() => {
    try {
      const savedRead = localStorage.getItem('ecobeacon_read_tips');
      const savedStreak = localStorage.getItem('ecobeacon_tips_streak');
      const savedLastReadDate = localStorage.getItem('ecobeacon_tips_last_read_date');
      
      if (savedRead) {
        setReadTips(new Set(JSON.parse(savedRead)));
      }
      
      if (savedStreak) {
        setTipsReadStreak(parseInt(savedStreak, 10));
      }

      const todayStr = new Date().toDateString();
      if (savedLastReadDate === todayStr) {
        setCompletedToday(true);
      }
    } catch (e) {
      console.warn('Could not load tip statistics from localStorage:', e);
    }
  }, []);

  // Sync back to todayTip if it changes
  useEffect(() => {
    if (isDaily) {
      setCurrentTip(todayTip);
    }
  }, [dailyIndex, isDaily, todayTip]);

  const handleShuffle = () => {
    let nextIndex = Math.floor(Math.random() * ECO_TIPS.length);
    // Ensure we don't pick the same tip
    while (ECO_TIPS.length > 1 && ECO_TIPS[nextIndex].id === currentTip.id) {
      nextIndex = Math.floor(Math.random() * ECO_TIPS.length);
    }
    setCurrentTip(ECO_TIPS[nextIndex]);
    setIsDaily(nextIndex === dailyIndex);
  };

  const handleResetToDaily = () => {
    setCurrentTip(todayTip);
    setIsDaily(true);
  };

  const handleMarkAsRead = () => {
    if (readTips.has(currentTip.id)) return;

    const newReadTips = new Set(readTips).add(currentTip.id);
    setReadTips(newReadTips);
    localStorage.setItem('ecobeacon_read_tips', JSON.stringify(Array.from(newReadTips)));

    // Handle streak and completed today
    if (isDaily && !completedToday) {
      setCompletedToday(true);
      const newStreak = tipsReadStreak + 1;
      setTipsReadStreak(newStreak);
      localStorage.setItem('ecobeacon_tips_streak', newStreak.toString());
      localStorage.setItem('ecobeacon_tips_last_read_date', new Date().toDateString());
    }
  };

  const handleShareTip = async () => {
    const text = `🌱 Eco-Tip of the Day from EcoBeacon: "${currentTip.title}" - ${currentTip.content} ${currentTip.icon} Let's protect our neighborhood together!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `EcoBeacon Tip: ${currentTip.title}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        fallbackCopy(text);
      }
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2500);
    } catch (e) {
      console.error('Could not copy tip:', e);
    }
  };

  const getCategoryStyles = (category: EcoTip['category']) => {
    switch (category) {
      case 'Waste Reduction':
        return {
          bg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 border-orange-500/20',
          indicator: 'bg-orange-500',
          gradient: 'from-orange-500/5 to-amber-500/0',
        };
      case 'Recycling Trivia':
        return {
          bg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border-indigo-500/20',
          indicator: 'bg-indigo-500',
          gradient: 'from-indigo-500/5 to-blue-500/0',
        };
      case 'Energy Saving':
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/20',
          indicator: 'bg-amber-500',
          gradient: 'from-amber-500/5 to-yellow-500/0',
        };
      case 'Water Conservation':
        return {
          bg: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 border-sky-500/20',
          indicator: 'bg-sky-500',
          gradient: 'from-sky-500/5 to-cyan-500/0',
        };
      case 'Civic Duty':
      default:
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20',
          indicator: 'bg-emerald-500',
          gradient: 'from-emerald-500/5 to-teal-500/0',
        };
    }
  };

  const styles = getCategoryStyles(currentTip.category);
  const isRead = readTips.has(currentTip.id);

  return (
    <div 
      className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between p-5 md:p-6"
      id={`eco-tip-card-${currentTip.id}`}
    >
      {/* Decorative colored visual backdrop gradient */}
      <div className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl ${styles.gradient} rounded-bl-full pointer-events-none opacity-60`} />

      <div className="space-y-4 relative z-10">
        {/* Header Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isDaily ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/10">
                📅 Today's Pick
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-750">
                🔀 Shuffled Advice
              </span>
            )}

            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border px-2.5 py-1 rounded-full ${styles.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${styles.indicator}`} />
              {currentTip.category}
            </span>
          </div>

          {/* Action Row right: Reset to Daily, Tip Streak */}
          <div className="flex items-center gap-2">
            {tipsReadStreak > 0 && (
              <span 
                className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1"
                title={`${tipsReadStreak} days of reading Eco-Tips`}
              >
                📚 {tipsReadStreak}d Streak
              </span>
            )}
            {!isDaily && (
              <button
                type="button"
                onClick={handleResetToDaily}
                className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline outline-none cursor-pointer flex items-center gap-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Core Content Area with smooth transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-start gap-3">
              {/* Giant Category Icon */}
              <div className="text-3.5xl select-none leading-none pt-0.5 shrink-0">
                {currentTip.icon}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-950 dark:text-zinc-100 tracking-tight font-display">
                  {currentTip.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-zinc-350 leading-relaxed font-medium">
                  {currentTip.content}
                </p>
              </div>
            </div>

            {/* Expanded Impact Card / Fun Fact Box */}
            <div className="bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-100/60 dark:border-zinc-850 rounded-xl p-3 mt-3 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Estimated Impact</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-extrabold leading-tight">
                  {currentTip.impact}
                </p>
                {currentTip.funFact && (
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium italic mt-1 pt-1 border-t border-gray-100/50 dark:border-zinc-850/40">
                    💡 Fact: {currentTip.funFact}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls Row */}
      <div className="flex items-center justify-between gap-4 mt-5 pt-3.5 border-t border-gray-100 dark:border-zinc-850/60 relative z-10">
        <div className="flex items-center gap-2">
          {/* Got It Button */}
          {isRead ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Learned
            </span>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkAsRead}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer select-none"
            >
              <Bookmark className="w-3 h-3 shrink-0" /> Got It
            </motion.button>
          )}

          {/* Share Advice Button */}
          <button
            onClick={handleShareTip}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-350 hover:bg-gray-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
            title="Share this sustainability advice"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {showShareSuccess && (
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black animate-pulse">
              Copied tip!
            </span>
          )}
        </div>

        {/* Shuffle Button to Explore Advice Catalog */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleShuffle}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 px-3.5 py-1.5 rounded-xl border border-gray-150/50 dark:border-zinc-800/80 cursor-pointer select-none transition-colors"
          title="See another sustainability tip"
        >
          <RefreshCw className="w-3 h-3 animate-spin-slow shrink-0" />
          <span>Next Tip</span>
        </motion.button>
      </div>
    </div>
  );
}
