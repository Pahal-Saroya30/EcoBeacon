/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Gift, ShieldCheck, Ticket, HelpCircle, Flame, Check, AlertTriangle, Trophy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { REWARD_ITEMS } from '../utils';

interface RedeemReceipt {
  id: number;
  itemTitle: string;
  pointsCost: number;
  timestamp: number;
  code: string;
}

interface RewardsProps {
  userPoints: number;
  onRedeemPoints: (cost: number) => void;
  onAddPoints: (amount: number) => void;
}

const WASTE_POOL = [
  { id: 1, name: 'Plastic Beverage Bottle', category: 'Plastic', emoji: '🥤', description: 'Standard beverage PET bottle, highly recyclable.' },
  { id: 2, name: 'Crinkled Newspaper', category: 'Paper', emoji: '📰', description: 'Can be re-pulped into raw print sheets.' },
  { id: 3, name: 'Banana Peel', category: 'Organic', emoji: '🍌', description: 'Decomposes naturally into organic garden compost.' },
  { id: 4, name: 'Empty Soda Can', category: 'Metal', emoji: '🥫', description: 'Aluminium is infinitely meltable and reusable!' },
  { id: 5, name: 'Glass Jam Jar', category: 'Glass', emoji: '🍾', description: 'Glass is 100% recyclable into new jars.' },
  { id: 6, name: 'Broken Keyboard', category: 'E-Waste', emoji: '🔌', description: 'Electronics contains metals that must be extracted.' },
  { id: 7, name: 'Cardboard Box', category: 'Paper', emoji: '📦', description: 'Corrugated paper board, easily recycled.' },
  { id: 8, name: 'Decayed Apple Core', category: 'Organic', emoji: '🍎', description: 'Wet food waste suitable for green compost.' },
  { id: 9, name: 'Old Smartphone', category: 'E-Waste', emoji: '📱', description: 'Contains hazardous lithium and gold traces.' },
  { id: 10, name: 'Aluminium Foil Wrap', category: 'Metal', emoji: '🪙', description: 'Clean foil wrap can be smelted down.' },
  { id: 11, name: 'Empty Shampoo Bottle', category: 'Plastic', emoji: '🧴', description: 'HDPE plastic, widely collected and reused.' },
  { id: 12, name: 'Glass Juice Bottle', category: 'Glass', emoji: '🍷', description: 'Crushed and remolded into high-quality glass.' },
  { id: 13, name: 'Used Coffee Grounds', category: 'Organic', emoji: '☕', description: 'Nitrogen-rich plant fertilizer soil additive.' },
  { id: 14, name: 'Discarded Notebook', category: 'Paper', emoji: '📓', description: 'Standard writing paper, fully recyclable.' },
  { id: 15, name: 'Corroded AA Batteries', category: 'E-Waste', emoji: '🔋', description: 'Hazardous electronic waste, needs special treatment.' },
  { id: 16, name: 'Metal Soup Can', category: 'Metal', emoji: '🥫', description: 'Tin-plated steel, infinitely recyclable.' },
];

const BINS = [
  { category: 'Plastic', label: 'Plastic 🥤', bg: 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80', hoverBg: 'hover:bg-amber-500/20 hover:border-amber-400', text: 'text-amber-700 dark:text-amber-400', emoji: '🥤' },
  { category: 'Paper', label: 'Paper 📰', bg: 'bg-blue-500/10 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80', hoverBg: 'hover:bg-blue-500/20 hover:border-blue-400', text: 'text-blue-700 dark:text-blue-400', emoji: '📰' },
  { category: 'Organic', label: 'Organic 🍌', bg: 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80', hoverBg: 'hover:bg-emerald-500/20 hover:border-emerald-400', text: 'text-emerald-700 dark:text-emerald-400', emoji: '🍌' },
  { category: 'Metal', label: 'Metal 🥫', bg: 'bg-purple-500/10 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/80', hoverBg: 'hover:bg-purple-500/20 hover:border-purple-400', text: 'text-purple-700 dark:text-purple-400', emoji: '🥫' },
  { category: 'Glass', label: 'Glass 🍾', bg: 'bg-orange-500/10 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/80', hoverBg: 'hover:bg-orange-500/20 hover:border-orange-400', text: 'text-orange-700 dark:text-orange-400', emoji: '🍾' },
  { category: 'E-Waste', label: 'E-Waste 🔌', bg: 'bg-red-500/10 dark:bg-red-950/30 border-red-300 dark:border-red-800/80', hoverBg: 'hover:bg-red-500/20 hover:border-red-400', text: 'text-red-700 dark:text-red-400', emoji: '🔌' },
];

const playTone = (isSuccess: boolean) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (isSuccess) {
      // Success chime: high-frequency cute two-tone beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Failure buzz: low frequency buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Ignore audio failures if blocked
  }
};

export default function Rewards({ userPoints, onRedeemPoints, onAddPoints }: RewardsProps) {
  const [redeemedLogs, setRedeemedLogs] = useState<RedeemReceipt[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<RedeemReceipt | null>(null);

  // Mini-Game State
  const [pool, setPool] = useState<typeof WASTE_POOL>(() => [...WASTE_POOL].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [consecutiveStreak, setConsecutiveStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [lastSelectedCategory, setLastSelectedCategory] = useState<string | null>(null);
  const [claimedToday, setClaimedToday] = useState(() => {
    return localStorage.getItem('ecobeacon_sort_game_last_completed') === new Date().toDateString();
  });
  const [showHelperGuide, setShowHelperGuide] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);

  const currentItem = pool[currentIndex] || WASTE_POOL[0];

  const handleRedeemItem = (item: typeof REWARD_ITEMS[number]) => {
    if (userPoints < item.pointsCost) return;

    // Deduct user points
    onRedeemPoints(item.pointsCost);

    // Create unique code
    const generatedCode = 'ECO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create voucher log
    const receipt: RedeemReceipt = {
      id: Date.now(),
      itemTitle: item.title,
      pointsCost: item.pointsCost,
      timestamp: Date.now(),
      code: generatedCode
    };

    setRedeemedLogs(prev => [receipt, ...prev]);
    setActiveReceipt(receipt);
  };

  const handleSortCategory = (category: string) => {
    if (feedback) return; // Prevent double clicks during active slide transition delay

    setLastSelectedCategory(category);
    const isCorrect = currentItem.category === category;

    if (isCorrect) {
      playTone(true);
      setFeedback('success');
      setConsecutiveStreak(prev => {
        const next = prev + 1;
        if (next > bestStreak) {
          setBestStreak(next);
        }
        return next;
      });
      setCorrectCount(prev => prev + 1);

      // Slide to next item after small delay
      setTimeout(() => {
        setFeedback(null);
        setLastSelectedCategory(null);
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= pool.length) {
            setPool([...WASTE_POOL].sort(() => Math.random() - 0.5));
            return 0;
          }
          return next;
        });
      }, 700);
    } else {
      playTone(false);
      setFeedback('error');
      setShakeActive(true);
      setConsecutiveStreak(0);

      // Slide to next item after error feedback delay
      setTimeout(() => {
        setFeedback(null);
        setLastSelectedCategory(null);
        setShakeActive(false);
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= pool.length) {
            setPool([...WASTE_POOL].sort(() => Math.random() - 0.5));
            return 0;
          }
          return next;
        });
      }, 1400);
    }
  };

  const handleClaimBonus = () => {
    if (correctCount >= 5 && !claimedToday) {
      onAddPoints(15);
      localStorage.setItem('ecobeacon_sort_game_last_completed', new Date().toDateString());
      setClaimedToday(true);
    }
  };

  const handleResetGame = () => {
    setPool([...WASTE_POOL].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setCorrectCount(0);
    setConsecutiveStreak(0);
    setFeedback(null);
    setLastSelectedCategory(null);
  };

  // Shake animation setup
  const shakeVariants = {
    idle: { x: 0, scale: 1 },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      rotate: [0, -1.5, 1.5, -1.5, 1.5, -0.8, 0.8, 0],
      transition: { duration: 0.45 }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="rewards-tab">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Eco Rewards Store 🎁</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Incentivizing neighborhood heroic acts. Trade your Eco Points for organic merchandise and tree adoption plans.</p>
      </div>

      {/* Header pts tracker */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-3xl text-white flex justify-between items-center shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8"></div>
        <div>
          <p className="text-xs uppercase font-extrabold text-green-100 tracking-wider">Your Redeemable Balance</p>
          <div className="text-3xl font-black mt-1" id="rewards-pts-bal">{userPoints} pts</div>
          <p className="text-[10px] text-emerald-100 mt-1 font-semibold">Spend points to unlock green certificates or organic tools.</p>
        </div>
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl border border-white/20 select-none">
          ⭐
        </div>
      </div>

      {/* 'Sort-it-Right' Arcade Mini-Game Section */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5" id="sort-it-right-game">
        <div className="flex justify-between items-start border-b border-gray-50 dark:border-zinc-855 pb-4">
          <div>
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>🎮 Sort-it-Right Arcade</span>
              <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold">Mini-Game</span>
            </h3>
            <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 mt-1">Sort Waste & Earn Points Boost</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold leading-normal mt-0.5">
              Drag digital waste items or tap the correct recycling bin. Sort 5 items correctly to win +15 pts!
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHelperGuide(!showHelperGuide)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 hover:bg-emerald-500/5 hover:text-emerald-500 hover:border-emerald-500/20 rounded-xl text-zinc-400 border border-transparent dark:border-zinc-800 transition-all cursor-pointer outline-none flex items-center gap-1 text-[11px] font-extrabold"
            title="Show helper guide"
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" /> Guide
          </motion.button>
        </div>

        {/* Educational Helper Guide Accordion */}
        {showHelperGuide && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl p-4 border border-emerald-500/10 text-xs text-gray-600 dark:text-zinc-300 space-y-2 leading-relaxed"
          >
            <p className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs">♻️ Sorting Cheat Sheet Guide:</p>
            <ul className="grid grid-cols-2 gap-2 text-[11px]">
              <li>🥤 <strong>Plastic</strong>: Bottles, Shampoo Containers</li>
              <li>📰 <strong>Paper</strong>: Newsprint, Cardboard Boxes, Notebooks</li>
              <li>🍌 <strong>Organic</strong>: Fruits, Apple Core, Coffee grounds</li>
              <li>🥫 <strong>Metal</strong>: Soda cans, Soup tins, Foil</li>
              <li>🍾 <strong>Glass</strong>: Jars, Glass bottles</li>
              <li>🔌 <strong>E-Waste</strong>: Keyboards, Phones, Batteries</li>
            </ul>
          </motion.div>
        )}

        {/* Arcade stat bars */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider block">Daily Bonus</span>
            {claimedToday ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black mt-1 inline-flex items-center gap-0.5">
                Claimed <Check className="w-3.5 h-3.5 inline text-emerald-500" />
              </span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-black mt-1 inline-flex items-center gap-0.5 animate-pulse">
                Pending (+15)
              </span>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider block">Score Progress</span>
            <span className="text-xs text-gray-800 dark:text-zinc-200 font-black mt-1 block">
              {correctCount} / 5
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider block">Best Streak</span>
            <span className="text-xs text-amber-550 dark:text-amber-450 font-black mt-1 inline-flex items-center gap-1 justify-center">
              <Flame className="w-3.5 h-3.5 text-amber-550" /> {consecutiveStreak} <span className="text-[9px] text-gray-400 font-semibold">(Max: {bestStreak})</span>
            </span>
          </div>
        </div>

        {/* Interactive Active Card Area */}
        <div className="relative flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-zinc-950/40 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden min-h-[190px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              variants={shakeVariants}
              animate={shakeActive ? 'shake' : 'idle'}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.4}
              className={`w-[250px] bg-white dark:bg-zinc-900 border ${
                feedback === 'success'
                  ? 'border-emerald-500 dark:border-emerald-500/80 shadow-md shadow-emerald-500/10'
                  : feedback === 'error'
                  ? 'border-red-500 dark:border-red-500/80 shadow-md shadow-red-500/10'
                  : 'border-gray-150 dark:border-zinc-800 shadow-sm'
              } rounded-2xl p-4 text-center cursor-grab active:cursor-grabbing select-none relative z-10`}
            >
              <div className="text-4xl my-2 select-none filter drop-shadow-sm transition-transform hover:scale-110 duration-200">
                {currentItem.emoji}
              </div>
              <h4 className="text-xs font-black text-gray-850 dark:text-zinc-150 uppercase tracking-wide">
                {currentItem.name}
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mt-1.5 leading-normal italic px-2">
                "{currentItem.description}"
              </p>

              {/* Feedback Overlay Banners */}
              {feedback === 'success' && (
                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest">
                  <Check className="w-8 h-8 stroke-[3.5] mb-1 animate-bounce" /> Correct!
                </div>
              )}
              {feedback === 'error' && (
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest">
                  <AlertTriangle className="w-8 h-8 stroke-[2.5] mb-1" /> Correct: {currentItem.category}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Active bonus point release reward triggers */}
          {correctCount >= 5 && !claimedToday && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-green-600/95 to-emerald-700/95 z-20 flex flex-col items-center justify-center p-4 text-center text-white"
            >
              <Trophy className="w-10 h-10 text-amber-300 animate-pulse mb-1" />
              <h4 className="text-sm font-black uppercase tracking-wider">Milestone Reached!</h4>
              <p className="text-[10px] text-emerald-100 mt-1 max-w-[200px] font-bold">You successfully sorted 5 digital waste materials!</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClaimBonus}
                className="mt-3.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-none outline-none"
              >
                🎁 Claim +15 Eco Points
              </motion.button>
            </motion.div>
          )}

          {/* Practice finished celebratory loop */}
          {claimedToday && correctCount >= 5 && (
            <div className="absolute bottom-1 right-2.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-0.5">
              Practice Endless Mode active 🏆
            </div>
          )}
        </div>

        {/* Dropping bins selection block */}
        <div className="space-y-2">
          <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest text-center">
            Tap the correct sorting bin below to recycle:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BINS.map((bin) => {
              const isTargetBin = lastSelectedCategory === bin.category;
              const isFeedbackCorrect = feedback === 'success';
              const isFeedbackWrong = feedback === 'error' && lastSelectedCategory === bin.category;
              const showAsCorrectHelper = feedback === 'error' && currentItem.category === bin.category;

              let customBorder = 'border-gray-150 dark:border-zinc-800';
              let customBg = bin.bg;

              if (isTargetBin && isFeedbackCorrect) {
                customBorder = 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20';
                customBg = 'bg-emerald-500/20 dark:bg-emerald-950/40';
              } else if (isFeedbackWrong) {
                customBorder = 'border-red-500 dark:border-red-400 ring-2 ring-red-500/20';
                customBg = 'bg-red-500/20 dark:bg-red-950/40';
              } else if (showAsCorrectHelper) {
                customBorder = 'border-emerald-400 dark:border-emerald-600 animate-pulse';
                customBg = 'bg-emerald-400/10 dark:bg-emerald-950/20';
              }

              return (
                <motion.button
                  key={bin.category}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSortCategory(bin.category)}
                  disabled={!!feedback}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border ${customBorder} ${customBg} ${bin.hoverBg} transition-all cursor-pointer outline-none select-none`}
                >
                  <span className="text-xl mb-1 filter drop-shadow-xs">{bin.emoji}</span>
                  <span className={`text-[11px] font-extrabold ${bin.text}`}>
                    {bin.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Reset / Reshuffle game helper */}
        <div className="flex justify-between items-center text-[10px] border-t border-gray-50 dark:border-zinc-855 pt-3">
          <span className="text-gray-450 dark:text-zinc-500 font-bold leading-normal">
            Play endless mode to keep practicing!
          </span>
          <button
            onClick={handleResetGame}
            className="flex items-center gap-1 font-black uppercase text-[10px] tracking-wider text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer outline-none border-none bg-transparent"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restart Game
          </button>
        </div>
      </div>

      {/* Receipt popup alert */}
      {activeReceipt && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-3 relative" id="reward-success-voucher">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveReceipt(null)}
            className="absolute top-3 right-4 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-255 cursor-pointer outline-none"
          >
            Dismiss
          </motion.button>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-sm">
            <ShieldCheck className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950/40" /> Redemption Successful!
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed font-semibold">
            You successfully redeemed <span className="font-extrabold">{activeReceipt.itemTitle}</span> of <span className="font-extrabold">{activeReceipt.pointsCost} points</span>.
            <div className="mt-2 bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/40 py-2.5 px-4 rounded-xl text-center font-mono text-gray-800 dark:text-zinc-200 tracking-widest text-sm font-extrabold">
              Coupon Code: {activeReceipt.code}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Reward Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REWARD_ITEMS.map((item) => {
          const canRedeem = userPoints >= item.pointsCost;
          const progressPercent = Math.min(100, Math.floor((userPoints / item.pointsCost) * 100));
          return (
            <motion.div 
              key={item.id} 
              whileHover={{ y: -6, scale: 1.025, boxShadow: "0 12px 24px -10px rgba(16, 185, 129, 0.15)" }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-2xl border border-gray-150 dark:border-zinc-800 shadow-inner select-none">
                    {item.icon}
                  </div>
                  <span className="text-xs bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-lg">
                    {item.pointsCost} pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1">{item.title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">{item.description}</p>
              </div>

              <div className="mt-5 border-t border-gray-50 dark:border-zinc-800/80 pt-4 space-y-3.5">
                {/* Gamified progress meter for locked rewards */}
                {!canRedeem && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase">
                      <span>Progression</span>
                      <span>{progressPercent}% ({userPoints}/{item.pointsCost})</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <motion.button
                  disabled={!canRedeem}
                  whileTap={canRedeem ? { scale: 0.95 } : {}}
                  onClick={() => handleRedeemItem(item)}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
                    canRedeem 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98]' 
                      : 'bg-gray-50 dark:bg-zinc-950 text-gray-400 dark:text-zinc-650 border border-gray-150 dark:border-zinc-855 cursor-not-allowed'
                  }`}
                >
                  {canRedeem ? 'Claim Voucher 🎁' : `${item.pointsCost - userPoints} points left`}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Redemption history log bottom rail */}
      {redeemedLogs.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-105 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
            <Ticket className="w-4 h-4 text-emerald-600" /> Your Claimed Vouchers ({redeemedLogs.length})
          </h3>
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {redeemedLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-3 border border-gray-50 dark:border-zinc-800 hover:border-gray-100 dark:hover:border-zinc-700 rounded-xl transition-all">
                <div>
                  <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200">{log.itemTitle}</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-550 font-bold mt-0.5 font-mono">CODE: {log.code}</p>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">
                  {new Date(log.timestamp).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
