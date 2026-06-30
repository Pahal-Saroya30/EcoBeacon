/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Leaf, Coins, Flame, MapPin, Award, Star, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Streak } from '../types';
import { getLevelForPoints, getLevelProgress } from '../utils';

interface EnvironmentalBannerProps {
  user: User;
  streak: Streak;
}

export default function EnvironmentalBanner({ user, streak }: EnvironmentalBannerProps) {
  const level = getLevelForPoints(user.points);
  const levelProgress = getLevelProgress(user.points);
  const progressPercent = Math.round(levelProgress * 100);

  // Time-of-day dynamic greeting generator
  const getGreetingData = () => {
    const hour = new Date().getHours();
    let timeOfDayGreeting = 'Welcome back';
    if (hour >= 5 && hour < 12) {
      timeOfDayGreeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDayGreeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeOfDayGreeting = 'Good evening';
    } else {
      timeOfDayGreeting = 'Hope you have a peaceful night';
    }

    // Dynamic encouraging message based on active metrics
    let encouragement = '';
    if (streak.count >= 7) {
      encouragement = `Incredible ${streak.count}-day streak! You are an absolute champion of civic action. Let's keep it burning!`;
    } else if (streak.count >= 3) {
      encouragement = `Fantastic job maintaining a ${streak.count}-day streak! Keep up the dynamic momentum.`;
    } else if (streak.count > 0) {
      encouragement = `${streak.count}-day active streak! Complete or verify a report today to keep the fire lit.`;
    } else if (user.points > 1000) {
      encouragement = `With ${user.points} green points, you are a prominent civic leader. Let's make today count!`;
    } else {
      encouragement = `Start a continuous daily action streak by resolving an open issue or logging green recycling entries!`;
    }

    return {
      greeting: `${timeOfDayGreeting}, ${user.name}`,
      encouragement,
    };
  };

  const { greeting, encouragement } = getGreetingData();
  const textWords = greeting.split(' ');

  // Stagger configurations for typography entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 18,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950 via-[#0a0f0d] to-zinc-950 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/15 group"
      id="environmental-champion-hero-banner"
    >
      {/* Cinematic Glowing Background Lights */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(16,185,129,0.18),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_80%,rgba(20,184,166,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-white/[0.015] pointer-events-none" />

      {/* Floating Sparkle/Light Particles inside Hero Section */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-400/15"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${15 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.7, 0.1],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 4 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        
        {/* Left Section: Welcomer & Avatar with Cinematic Staggered Entrance */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full xl:w-auto">
          {/* Avatar Pin with Glow Ring */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.1, rotate: 6 }}
            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/40 border border-emerald-400/40 flex items-center justify-center text-4xl shadow-lg shadow-emerald-900/30 shrink-0 cursor-help"
            title="Your Current Rank Prestige Badge!"
          >
            {/* Pulsing ring behind badge */}
            <span className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-pulse blur-md -z-10" />
            <span>{level.icon}</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-400 text-black border border-zinc-950 flex items-center justify-center font-black text-[11px] shadow-sm">
              ★
            </div>
          </motion.div>

          {/* Dynamic Typography Section */}
          <div className="space-y-2 text-center sm:text-left">
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400 shrink-0" /> Civic Leader Rank
              </span>
              <span className="text-[10px] font-black text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-500 shrink-0" /> {user.city}
              </span>
            </motion.div>

            {/* Cinematic Dynamic Welcome Typography */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex flex-wrap justify-center sm:justify-start gap-x-2 leading-none font-sans uppercase">
              {textWords.map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="inline-block bg-gradient-to-b from-white to-zinc-200 bg-clip-text text-transparent"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Dynamic Level subtitle description & Context-Aware Encouragement */}
            <motion.div variants={itemVariants} className="flex flex-col gap-1.5 items-center sm:items-start mt-1">
              <p className="text-xs text-emerald-400/95 font-bold flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Rank Status: {level.title}</span>
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-md font-medium text-center sm:text-left">
                {encouragement}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Section: Arresting Cinematic Live Metrics Pods */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 items-stretch shrink-0">
          
          {/* POD 1: Visually Arresting Eco Points Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.03, borderColor: 'rgba(16, 185, 129, 0.4)' }}
            className="relative flex-1 sm:w-48 bg-emerald-950/20 backdrop-blur-md border border-emerald-500/15 rounded-2xl p-4.5 flex flex-col justify-between overflow-hidden shadow-sm"
          >
            {/* Decorative background pulse glow */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Total Green Credits</span>
              <Coins className="w-4.5 h-4.5 text-emerald-400" />
            </div>

            <div className="mt-1">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none flex items-baseline gap-1"
              >
                {user.points} <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">pts</span>
              </motion.div>
              <span className="text-[10px] text-zinc-400 font-bold block mt-1.5 flex items-center gap-1">
                Redeemable in store <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              </span>
            </div>
          </motion.div>

          {/* POD 2: Visually Arresting Streak Gauge with Cinematic Pulse */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.03, borderColor: 'rgba(245, 158, 11, 0.4)' }}
            className="relative flex-1 sm:w-48 bg-orange-950/20 backdrop-blur-md border border-orange-500/15 rounded-2xl p-4.5 flex flex-col justify-between overflow-hidden shadow-sm"
          >
            {/* Glowing amber backplane */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">Active Streak Gauge</span>
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-orange-500/40 blur-xs animate-ping" />
                <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500 animate-pulse relative" />
              </div>
            </div>

            <div className="mt-1">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none flex items-baseline gap-1">
                {streak.count} <span className="text-xs font-black text-orange-500 uppercase tracking-widest">days</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold block mt-1.5">
                {streak.lastEntry ? 'Verified continuous action' : 'Log recycling to start!'}
              </span>
            </div>
          </motion.div>

          {/* POD 3: Progress Tracker */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.03, borderColor: 'rgba(20, 184, 166, 0.4)' }}
            className="relative flex-1 sm:w-56 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-2xl p-4.5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Prestige Tier progress</span>
              <span className="text-[10px] text-emerald-400 font-black px-1.5 py-0.5 rounded bg-emerald-500/10">
                {progressPercent}%
              </span>
            </div>

            {/* Premium Progress Bar */}
            <div className="space-y-1.5 mt-2">
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                <span>{level.title}</span>
                <span>Next Prestige</span>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
