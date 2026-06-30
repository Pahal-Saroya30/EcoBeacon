/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Trophy, Flame, Shield, Trash2, CheckCircle, Lock, Unlock, Sparkles, AlertCircle, Eye, Star, MapPin, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { User, LogEntry, Streak, IssueReport } from '../types';

interface AchievementsProps {
  user: User;
  logs: LogEntry[];
  streak: Streak;
  issues: IssueReport[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'recycling' | 'streak' | 'points' | 'community';
  requirementText: string;
  targetValue: number;
  currentValue: number;
  icon: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export const isBadgeUnlocked = (badge: Badge) => {
  return badge.currentValue >= badge.targetValue;
};

export function getBadgesList(user: User, logs: LogEntry[], streak: Streak): Badge[] {
  const totalWeight = logs
    .filter((l) => l.weight > 0)
    .reduce((sum, l) => sum + l.weight, 0);

  const reportedCount = logs.filter((l) => l.category.startsWith('Reported:')).length;
  const verifiedCount = logs.filter((l) => l.category.startsWith('Verified Pin:')).length;
  const resolvedCount = logs.filter((l) => l.category.startsWith('Cleaned hazard:')).length;
  const communityActionsCount = reportedCount + verifiedCount + resolvedCount;

  return [
    // --- RECYCLING ---
    {
      id: 'recycle-5',
      title: 'First Sort',
      description: 'Diverted your first pile of recyclable waste away from local landfills.',
      category: 'recycling',
      requirementText: 'Log 5kg of recyclables',
      targetValue: 5,
      currentValue: totalWeight,
      icon: '🌱',
      tier: 'Bronze',
    },
    {
      id: 'recycle-50',
      title: 'Eco Recycler',
      description: 'Actively sorting waste components like plastic, glass, and metals.',
      category: 'recycling',
      requirementText: 'Log 50kg of recyclables',
      targetValue: 50,
      currentValue: totalWeight,
      icon: '🌿',
      tier: 'Silver',
    },
    {
      id: 'recycle-100',
      title: '100kg Recycled',
      description: 'Achieved an outstanding three-digit milestone of recycled waste material.',
      category: 'recycling',
      requirementText: 'Log 100kg of recyclables',
      targetValue: 100,
      currentValue: totalWeight,
      icon: '♻️',
      tier: 'Gold',
    },

    // --- STREAKS ---
    {
      id: 'streak-3',
      title: 'Warm-up Streak',
      description: 'Established basic consistency in reporting and sorting.',
      category: 'streak',
      requirementText: 'Maintain a 3-Day Streak',
      targetValue: 3,
      currentValue: streak.count,
      icon: '🔥',
      tier: 'Bronze',
    },
    {
      id: 'streak-7',
      title: 'Habitual Hero',
      description: 'A full week of active dedication to preserving neighborhood cleanliness.',
      category: 'streak',
      requirementText: 'Maintain a 7-Day Streak',
      targetValue: 7,
      currentValue: streak.count,
      icon: '⚡',
      tier: 'Silver',
    },
    {
      id: 'streak-10',
      title: '10-Day Streak',
      description: 'Unstoppable consistency. Setting an inspiring benchmark for fellow residents.',
      category: 'streak',
      requirementText: 'Maintain a 10-Day Streak',
      targetValue: 10,
      currentValue: streak.count,
      icon: '👑',
      tier: 'Gold',
    },

    // --- POINTS ---
    {
      id: 'points-100',
      title: 'Green Recruit',
      description: 'Earned basic recognition points for initial environmental contributions.',
      category: 'points',
      requirementText: 'Earn 100 total Eco points',
      targetValue: 100,
      currentValue: user.points,
      icon: '🪙',
      tier: 'Bronze',
    },
    {
      id: 'points-1000',
      title: 'Planet Guardian',
      description: 'Earned significant eco prestige credits by sorting and upvoting heavily.',
      category: 'points',
      requirementText: 'Earn 1,000 total Eco points',
      targetValue: 1000,
      currentValue: user.points,
      icon: '🌟',
      tier: 'Silver',
    },
    {
      id: 'points-5000',
      title: 'Eco Champion',
      description: 'Reached elite rank status with thousands of lifetime contribution points.',
      category: 'points',
      requirementText: 'Earn 5,000 total Eco points',
      targetValue: 5000,
      currentValue: user.points,
      icon: '🏆',
      tier: 'Gold',
    },

    // --- COMMUNITY / HAZARDS ---
    {
      id: 'community-scout',
      title: 'Neighborhood Scout',
      description: 'Pinpointed your first community safety hazard on the map.',
      category: 'community',
      requirementText: 'Submit 1 hazard report',
      targetValue: 1,
      currentValue: reportedCount,
      icon: '🚨',
      tier: 'Bronze',
    },
    {
      id: 'community-verifier',
      title: 'Vigilant Verifier',
      description: 'Checked and upvoted community pins to help municipal operators prioritize repairs.',
      category: 'community',
      requirementText: 'Verify or upvote 3 alerts',
      targetValue: 3,
      currentValue: verifiedCount,
      icon: '🔍',
      tier: 'Bronze',
    },
    {
      id: 'community-hero',
      title: 'Community Hero',
      description: 'Demonstrated complete environmental civic mastery by reporting, resolving, or verifying 10 times.',
      category: 'community',
      requirementText: 'Participate in 10 community actions',
      targetValue: 10,
      currentValue: communityActionsCount,
      icon: '🛡️',
      tier: 'Gold',
    },
  ];
}

export default function Achievements({ user, logs, streak, issues }: AchievementsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'recycling' | 'community'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [latestShareSuccess, setLatestShareSuccess] = useState(false);

  const totalWeight = logs
    .filter((l) => l.weight > 0)
    .reduce((sum, l) => sum + l.weight, 0);

  const reportedCount = logs.filter((l) => l.category.startsWith('Reported:')).length;
  const verifiedCount = logs.filter((l) => l.category.startsWith('Verified Pin:')).length;
  const resolvedCount = logs.filter((l) => l.category.startsWith('Cleaned hazard:')).length;
  const communityActionsCount = reportedCount + verifiedCount + resolvedCount;

  const handleShareBadge = async (badge: Badge, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid triggering open card on click
    }

    const shareTitle = `EcoBeacon Achievement Unlocked! 🏆`;
    const shareText = `I just unlocked the "${badge.icon} ${badge.title}" EcoBadge on EcoBeacon! I've recycled ${totalWeight.toFixed(1)}kg of waste and earned ${user.points} Eco Points in my neighborhood! 🌍🌱`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareSuccess(badge.id);
        setTimeout(() => setShareSuccess(null), 3000);
      } catch (err: any) {
        console.warn('Web Share failed or was cancelled:', err);
        fallbackCopyToClipboard(badge, shareText);
      }
    } else {
      fallbackCopyToClipboard(badge, shareText);
    }
  };

  const fallbackCopyToClipboard = (badge: Badge, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setShareSuccess(badge.id);
      setTimeout(() => setShareSuccess(null), 3000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const badgesList = getBadgesList(user, logs, streak);

  const unlockedBadges = badgesList.filter(isBadgeUnlocked);
  const lockedBadges = badgesList.filter((b) => !isBadgeUnlocked(b));

  const handleShareLatestAccomplishment = () => {
    const latestBadge = unlockedBadges[unlockedBadges.length - 1];
    const rankTitle = getLevelForRankPoints(user.points);
    let shareText = '';
    if (latestBadge) {
      shareText = `🏆 Achievement Unlocked on EcoBeacon! I am officially a "${rankTitle}" with my latest unlocked badge: "${latestBadge.icon} ${latestBadge.title}" (${latestBadge.description})! I've recycled ${totalWeight.toFixed(1)}kg of waste, completed ${communityActionsCount} community actions, and earned ${user.points} Eco Points! Join me in protecting our community! 🌍🌱`;
    } else {
      shareText = `🌍 I just started my eco-journey on EcoBeacon! I'm currently a "${rankTitle}" with ${user.points} Eco Points in my local area. Join me in reporting community hazards and recycling to earn reward points! 🌱🏆`;
    }

    try {
      navigator.clipboard.writeText(shareText);
      setLatestShareSuccess(true);
      setTimeout(() => setLatestShareSuccess(false), 3000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const filteredBadges = badgesList.filter((badge) => {
    const unlocked = isBadgeUnlocked(badge);
    if (activeFilter === 'unlocked') return unlocked;
    if (activeFilter === 'locked') return !unlocked;
    if (activeFilter === 'recycling') return badge.category === 'recycling';
    if (activeFilter === 'community') return badge.category === 'community';
    return true;
  });

  const getTierBadgeStyle = (tier: Badge['tier'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        bg: 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-550 border-gray-200 dark:border-zinc-700/60',
        label: 'text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-900',
      };
    }
    switch (tier) {
      case 'Gold':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/25 text-amber-650 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
          label: 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
        };
      case 'Silver':
        return {
          bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700',
          label: 'text-slate-700 dark:text-zinc-300 bg-slate-200/70 dark:bg-zinc-800 border-slate-350 dark:border-zinc-700',
        };
      case 'Bronze':
      default:
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/25 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/40',
          label: 'text-orange-700 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/40',
        };
    }
  };

  return (
    <div className="space-y-6" id="achievements-tab">
      
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="achievements-summary-grid">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4" id="stat-total-unlocked">
          <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold border border-green-100 dark:border-green-900/40">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Unlocked Badges</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-zinc-100">{unlockedBadges.length} <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">/ {badgesList.length}</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4" id="stat-total-weight">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-900/40">
            <Trash2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Total Recycled</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-zinc-100">{totalWeight.toFixed(1)} <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">kg</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4" id="stat-total-streak">
          <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-100 dark:border-orange-900/40">
            <Flame className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Active Streak</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-zinc-100">{streak.count} <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">Days</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4" id="stat-total-civic">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-100 dark:border-purple-900/40">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Civic Actions</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-zinc-100">{communityActionsCount} <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">reports</span></h3>
          </div>
        </div>
      </div>

      {/* LATEST ACCOMPLISHMENT SHARE BANNER */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden" id="latest-accomplishment-banner">
        {/* Decorative ambient lights */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl shadow-sm relative shrink-0">
            {unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1].icon : '🌱'}
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs text-white font-extrabold shadow-sm animate-pulse">
              🏆
            </div>
          </div>
          
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {unlockedBadges.length > 0 ? 'LATEST MILESTONE UNLOCKED' : 'ECO JOURNEY STARTED'}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                {getLevelForRankPoints(user.points)}
              </span>
            </div>
            <h3 className="text-base font-black text-gray-800 dark:text-zinc-150 leading-tight">
              {unlockedBadges.length > 0 
                ? `You unlocked "${unlockedBadges[unlockedBadges.length - 1].title}"!` 
                : 'Welcome to EcoBeacon! Log your first recyclable waste to earn points.'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
              {unlockedBadges.length > 0 
                ? unlockedBadges[unlockedBadges.length - 1].description 
                : 'Help clean up local communities, upvote neighborhood safety pins, and climb the Leaderboard ranks.'}
            </p>
          </div>
        </div>

        <motion.button
          id="share-latest-accomplishment-btn"
          type="button"
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShareLatestAccomplishment}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shrink-0 border border-emerald-400 dark:border-emerald-800"
        >
          {latestShareSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-white shrink-0 animate-bounce" />
              <span>ACCOMPLISHMENT COPIED! 🎉</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-white shrink-0" />
              <span>SHARE ACHIEVEMENT</span>
            </>
          )}
        </motion.button>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-150 dark:border-zinc-800 pb-4" id="achievements-filters-row">
        <div className="flex flex-wrap gap-2">
          <button
            id="filter-achievements-all"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-gray-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            All Milestones ({badgesList.length})
          </button>
          <button
            id="filter-achievements-unlocked"
            onClick={() => setActiveFilter('unlocked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'unlocked'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            Unlocked ({unlockedBadges.length})
          </button>
          <button
            id="filter-achievements-locked"
            onClick={() => setActiveFilter('locked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'locked'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            In Progress ({lockedBadges.length})
          </button>
          <button
            id="filter-achievements-recycling"
            onClick={() => setActiveFilter('recycling')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'recycling'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            Recycling Sorts
          </button>
          <button
            id="filter-achievements-community"
            onClick={() => setActiveFilter('community')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'community'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            Civic Alert Duty
          </button>
        </div>

        <span className="text-[11px] text-gray-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
          Level Threshold Rank: {getLevelForRankPoints(user.points)}
        </span>
      </div>

      {/* BADGES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="badges-catalog-grid">
        {filteredBadges.map((badge) => {
          const unlocked = isBadgeUnlocked(badge);
          const style = getTierBadgeStyle(badge.tier, unlocked);
          const ratio = Math.min(1, badge.currentValue / badge.targetValue);

          return (
            <motion.div
              key={badge.id}
              id={`badge-card-${badge.id}`}
              onClick={() => setSelectedBadge(badge)}
              whileHover={{ y: -6, scale: 1.025, boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.08)" }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className={`border rounded-2xl p-5 shadow-sm transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                unlocked 
                  ? 'bg-amber-50/5 dark:bg-amber-950/5 border-amber-300 dark:border-amber-900/60 unlocked-badge-pulse hover:border-amber-400 dark:hover:border-amber-500' 
                  : 'bg-gray-50/40 dark:bg-zinc-950/20 border-gray-200/80 dark:border-zinc-800 hover:border-gray-350 dark:hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Upper Tier Tag & Status Indicator */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${style.label}`}>
                    {badge.tier}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {unlocked && (
                      <button
                        id={`share-badge-card-btn-${badge.id}`}
                        type="button"
                        onClick={(e) => handleShareBadge(badge, e)}
                        className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 border border-gray-200/65 dark:border-zinc-800 rounded-lg transition-all cursor-pointer flex items-center justify-center relative"
                        title="Share Achievement Badge"
                      >
                        {shareSuccess === badge.id ? (
                          <span className="text-[8px] font-black text-green-600 dark:text-green-400 px-1 animate-pulse">Copied!</span>
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    {unlocked ? (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-extrabold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-50 dark:fill-amber-950/40" /> Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 font-extrabold bg-gray-100/80 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-gray-400 dark:text-zinc-500" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                {/* Main badge display & title */}
                <div className="flex gap-4 items-start">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border select-none shrink-0 ${
                      unlocked ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-inner' : 'bg-gray-100 dark:bg-zinc-800 border-gray-250 dark:border-zinc-700 grayscale opacity-60'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                      {badge.title}
                      {unlocked && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-100 dark:fill-amber-950/20" />
                      )}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 leading-normal line-clamp-2 font-medium">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Status text */}
              <div className="mt-5 pt-4 border-t border-gray-100/85 dark:border-zinc-800/80">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-zinc-500 mb-1">
                  <span>Requirement: {badge.requirementText}</span>
                  <span className={unlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-zinc-400'}>
                    {badge.currentValue.toFixed ? badge.currentValue.toFixed(1) : badge.currentValue} / {badge.targetValue}
                  </span>
                </div>
                
                {/* Horizontal Progress bar */}
                <div className="w-full h-2 bg-gray-150 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      unlocked ? 'bg-green-500 dark:bg-green-600' : 'bg-orange-400'
                    }`}
                    style={{ width: `${ratio * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredBadges.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 dark:text-zinc-550" id="no-filtered-badges">
            <AlertCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-650 mb-2" />
            <p className="text-sm font-semibold">No milestones found in this category filter.</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Try toggling different filters to see other milestones.</p>
          </div>
        )}
      </div>

      {/* INTERACTIVE DETAIL VIEW POPUP DIALOG MODAL */}
      {selectedBadge && (
        <div
          id="badge-modal-overlay"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            id="badge-modal-content"
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-gray-100 dark:border-zinc-800 shadow-2xl relative animate-scale-up text-gray-800 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 font-bold p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              id="close-badge-modal"
            >
              ✕
            </button>

            <div className="text-center pt-4">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border inline-block mb-3 ${
                getTierBadgeStyle(selectedBadge.tier, isBadgeUnlocked(selectedBadge)).label
              }`}>
                {selectedBadge.tier.toUpperCase()} RANK
              </span>

              <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-6xl shadow-md border mb-4 select-none ${
                isBadgeUnlocked(selectedBadge) ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40' : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 grayscale opacity-65'
              }`}>
                {selectedBadge.icon}
              </div>

              <h3 className="text-lg font-black text-gray-800 dark:text-zinc-100 flex items-center justify-center gap-1.5">
                {selectedBadge.title}
                {isBadgeUnlocked(selectedBadge) && (
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                )}
              </h3>

              <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">
                Category: {selectedBadge.category}
              </p>

              <p className="text-xs text-gray-650 dark:text-zinc-350 mt-4 px-2 leading-relaxed font-medium">
                {selectedBadge.description}
              </p>

              <div className="mt-6 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-4 text-left">
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest">Progress status</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Requirement</span>
                  <span className="text-xs text-gray-500 dark:text-zinc-455 font-bold">{selectedBadge.requirementText}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Your Activity</span>
                  <span className="text-xs text-green-600 dark:text-green-450 font-bold">
                    {selectedBadge.currentValue.toFixed ? selectedBadge.currentValue.toFixed(1) : selectedBadge.currentValue}
                  </span>
                </div>

                <div className="mt-3 w-full h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isBadgeUnlocked(selectedBadge) ? 'bg-green-500 dark:bg-green-600' : 'bg-orange-400'
                    }`}
                    style={{ width: `${Math.min(100, (selectedBadge.currentValue / selectedBadge.targetValue) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {isBadgeUnlocked(selectedBadge) ? (
                <div className="mt-6 space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 rounded-xl text-green-750 dark:text-green-300 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Unlock className="w-4 h-4" /> This EcoBadge is Unlocked!
                  </div>
                  <button
                    id="share-badge-modal-btn"
                    type="button"
                    onClick={(e) => handleShareBadge(selectedBadge, e)}
                    className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-md font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 border border-green-400 dark:border-green-800"
                  >
                    <Share2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      {shareSuccess === selectedBadge.id ? 'Badge Shared / Copied! 🎉' : 'Share Unlocked Badge'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" /> Locked – Continue community sorting!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple level title mapper helper matching LEVEL_THRESHOLDS from utils
function getLevelForRankPoints(totalPoints: number): string {
  if (totalPoints >= 15000) return '🏆 Eco Master';
  if (totalPoints >= 7000) return '👑 Eco Champion';
  if (totalPoints >= 3500) return '🌍 Planet Guardian';
  if (totalPoints >= 1500) return '🌳 Eco Ranger';
  if (totalPoints >= 500) return '🌿 Green Scout';
  return '🌱 Waste Warrior';
}
