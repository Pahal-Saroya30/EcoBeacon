/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ECO_TIPS = [
  {
    id: 1,
    category: 'Energy',
    title: 'Aluminum Savings',
    content: 'Recycling one aluminum can saves enough energy to run a TV for up to three hours!',
    emoji: '🔌'
  },
  {
    id: 2,
    category: 'Rinse Rule',
    title: 'Clean Containers',
    content: 'Always rinse plastic jars and bottles before recycling. Leftover food residues can contaminate entire batches!',
    emoji: '🧼'
  },
  {
    id: 3,
    category: 'Plastic',
    title: 'Energy Comparison',
    content: 'Producing new plastic from scratch requires nearly twice as much energy as recycling existing plastics.',
    emoji: '♻️'
  },
  {
    id: 4,
    category: 'Glass',
    title: 'Endless Lifecycle',
    content: 'Glass bottles are 100% recyclable and can be processed endlessly without any loss in purity or quality.',
    emoji: '🍾'
  },
  {
    id: 5,
    category: 'Compost',
    title: 'Organic Power',
    content: 'Organic kitchen waste accounts for more than 30% of total municipal household garbage. Composting it prevents methane!',
    emoji: '🍂'
  },
  {
    id: 6,
    category: 'Space Saver',
    title: 'Cardboard Prep',
    content: 'Always flatten cardboard boxes before placing them in bins to preserve volume for clean paper sorting.',
    emoji: '📦'
  },
  {
    id: 7,
    category: 'Paper',
    title: 'Forest Conservation',
    content: 'Producing recycled paper uses up to 40% less energy than making paper from raw wood virgin fibers.',
    emoji: '🌲'
  },
  {
    id: 8,
    category: 'Contaminant',
    title: 'Grease Guard',
    content: 'Wet paper or grease-stained cardboard (like pizza box bottoms) cannot be recycled because the oil ruins the pulp.',
    emoji: '🍕'
  },
  {
    id: 9,
    category: 'Glass',
    title: 'Lightbulb Equivalency',
    content: 'Energy saved from recycling a single glass bottle can light a 100-watt bulb for up to four hours.',
    emoji: '💡'
  },
  {
    id: 10,
    category: 'Plastics #1 & #2',
    title: 'High-Value Sorting',
    content: 'Rigid water bottles (#1 PET) and milk jugs (#2 HDPE) have the highest recycling demand worldwide.',
    emoji: '🥤'
  }
];

export default function ProTip() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnabled, setIsEnabled] = useState(localStorage.getItem('ecobeacon_hide_protip') !== 'true');

  // Synchronize with external changes (e.g. from Settings panel)
  useEffect(() => {
    const handleStatusChange = () => {
      const allowed = localStorage.getItem('ecobeacon_hide_protip') !== 'true';
      setIsEnabled(allowed);
      if (!allowed) {
        setIsVisible(false);
      }
    };
    window.addEventListener('ecobeacon_protip_status_changed', handleStatusChange);
    return () => window.removeEventListener('ecobeacon_protip_status_changed', handleStatusChange);
  }, []);

  // Trigger a new tip periodically
  useEffect(() => {
    if (!isEnabled) return;

    // Initial display delay to let the dashboard render
    const initialTimer = setTimeout(() => {
      if (localStorage.getItem('ecobeacon_hide_protip') === 'true') return;
      // Pick a random tip to start
      setCurrentIndex(Math.floor(Math.random() * ECO_TIPS.length));
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, [isEnabled]);

  // Set interval to periodically cycle tips
  useEffect(() => {
    if (isPaused || !isEnabled) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      // Cycle to a random tip after the fade-out animation completes
      setTimeout(() => {
        if (localStorage.getItem('ecobeacon_hide_protip') === 'true') return;
        setCurrentIndex((prev) => {
          let next = Math.floor(Math.random() * ECO_TIPS.length);
          // Try to avoid showing the exact same tip twice in a row
          while (next === prev && ECO_TIPS.length > 1) {
            next = Math.floor(Math.random() * ECO_TIPS.length);
          }
          return next;
        });
        setIsVisible(true);
      }, 500); // Wait for fade-out

    }, 28000); // Cycle every 28 seconds

    return () => clearInterval(interval);
  }, [isPaused, isEnabled]);

  const handleNextTip = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        let next = Math.floor(Math.random() * ECO_TIPS.length);
        while (next === prev && ECO_TIPS.length > 1) {
          next = Math.floor(Math.random() * ECO_TIPS.length);
        }
        return next;
      });
      setIsVisible(true);
    }, 400);
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('ecobeacon_hide_protip', 'true');
    window.dispatchEvent(new Event('ecobeacon_protip_status_changed'));
  };

  const activeTip = ECO_TIPS[currentIndex];

  if (!isEnabled) return null;

  return (
    <div id="protip-toaster-hook">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-[9999] max-w-[340px] w-[calc(100vw-48px)] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-green-200/80 dark:border-green-900/60 rounded-2xl shadow-xl overflow-hidden p-4 flex flex-col gap-2.5 hover:border-green-400 dark:hover:border-green-700 transition-colors"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            id="protip-notification-toast"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-zinc-800/65 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-405 flex items-center justify-center font-bold text-xs select-none">
                  💡
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[10px] font-black text-gray-800 dark:text-zinc-150 uppercase tracking-widest">
                      Eco Pro Tip
                    </h4>
                    <span className="text-[8px] font-black px-1 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 uppercase tracking-wide">
                      {activeTip.category}
                    </span>
                  </div>
                  <h5 className="text-[11px] font-bold text-gray-900 dark:text-zinc-200">
                    {activeTip.title}
                  </h5>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                title="Dismiss tip"
                id="dismiss-protip-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content paragraph */}
            <div className="flex gap-2.5 items-start">
              <span className="text-2xl shrink-0 select-none pt-0.5" role="img" aria-label="emoji">
                {activeTip.emoji}
              </span>
              <p className="text-[11px] text-gray-600 dark:text-zinc-350 leading-relaxed font-semibold">
                {activeTip.content}
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-zinc-800/40 text-[9px] text-gray-400 dark:text-zinc-500 font-bold">
              <span>Auto-cycling (Pause on hover)</span>
              
              <button
                type="button"
                onClick={handleNextTip}
                className="flex items-center gap-1 text-green-650 hover:text-green-750 dark:text-green-400 dark:hover:text-green-300 transition-colors font-extrabold cursor-pointer"
                id="next-protip-btn"
                title="View next tip"
              >
                <span>Next Fact</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
