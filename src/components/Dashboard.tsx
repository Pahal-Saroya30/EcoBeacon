/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Flame, Medal, Calendar, Award, RefreshCw, Layers, Search, Sparkles, Trophy, ArrowRight, Share2, Star, TrendingUp, Users, Target, Bell, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { User, LogEntry, Streak, IssueReport, LevelThreshold } from '../types';
import { getLevelForPoints, getLevelProgress, DAILY_POINTS_GOAL, LEVEL_THRESHOLDS } from '../utils';
import ProTip from './ProTip';
import EnvironmentalBanner from './EnvironmentalBanner';
import EcoTipCard from './EcoTipCard';

interface DashboardProps {
  user: User;
  logs: LogEntry[];
  streak: Streak;
  activeIssuesCount: number;
  resolvedIssuesCount: number;
  onNavigateToLog: () => void;
  onNavigateToAchievements: () => void;
  onRefreshStats: () => void;
  issues: IssueReport[];
}

const confettiColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
const confettiElements = Array.from({ length: 45 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100 - 50,
  y: Math.random() * -150 - 50,
  size: Math.random() * 8 + 5,
  color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  delay: Math.random() * 0.4,
  duration: Math.random() * 1.6 + 1.4,
  rotation: Math.random() * 360,
}));

const getLevelDescription = (title: string) => {
  switch (title) {
    case 'Green Scout':
      return "You've unlocked verified neighborhood map voting! Help audit local hazards to earn quick points.";
    case 'Eco Ranger':
      return "Your alerts are now fast-tracked! You have also unlocked the premium Cotton Tote and Bamboo Brush rewards in the rewards store.";
    case 'Planet Guardian':
      return "Guardian Tier! You can now sponsor a physical mahogany or teak sapling planted in your community's name with GPS tracking.";
    case 'Eco Champion':
      return "Champion Rank! Your profile is highlighted with a premium gold glow on the weekly leaderboards.";
    case 'Eco Master':
      return "Eco Legend! You've unlocked ultimate prestige and maximum discount privileges at sustainable apparel partners.";
    default:
      return "Welcome to the trek! Keep lodging reports and recycling to climb the community civic ranks.";
  }
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const Custom30DayTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-zinc-950 border border-gray-150 dark:border-zinc-800 rounded-xl p-3 shadow-lg text-xs max-w-[220px]">
        <p className="font-extrabold text-zinc-400 dark:text-zinc-500 mb-1.5 text-[10px] uppercase tracking-wider">{data.fullDate}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-6">
            <span className="text-zinc-550 dark:text-zinc-400 font-bold">Contributions:</span>
            <span className="font-black text-zinc-900 dark:text-zinc-150">{data.Contributions} logged</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-zinc-550 dark:text-zinc-400 font-bold">Points Earned:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">+{data.Points} pts</span>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-850 mt-2 flex items-center gap-1.5">
            {data.hasActivity ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/10">
                🔥 Streak Kept
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-gray-100 dark:bg-zinc-850 text-gray-400 dark:text-zinc-500 border border-gray-200 dark:border-zinc-800/60">
                ❄️ No Activity
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 240,
      damping: 24,
    },
  },
};

export default function Dashboard({
  user,
  logs,
  streak,
  activeIssuesCount,
  resolvedIssuesCount,
  onNavigateToLog,
  onNavigateToAchievements,
  onRefreshStats,
  issues
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('ecobeacon_weekly_goal');
    return saved ? parseFloat(saved) : 5; // Default goal: 5 items
  });

  const [weeklyGoalType, setWeeklyGoalType] = useState<'count' | 'weight'>(() => {
    const saved = localStorage.getItem('ecobeacon_weekly_goal_type');
    return saved === 'weight' ? 'weight' : 'count';
  });

  // Calculate start of current week (Monday 00:00:00)
  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfWeek = getStartOfWeek();
  const weeklyLogs = logs.filter(l => l.timestamp >= startOfWeek.getTime());
  
  const weeklyCount = weeklyLogs.length;
  const weeklyWeight = weeklyLogs.reduce((acc, l) => acc + (l.weight || 0), 0);

  const currentWeeklyProgress = weeklyGoalType === 'count' ? weeklyCount : weeklyWeight;
  const weeklyGoalRatio = weeklyGoal > 0 ? Math.min(1, currentWeeklyProgress / weeklyGoal) : 0;

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ecobeacon_weekly_goal', String(weeklyGoal));
  }, [weeklyGoal]);

  useEffect(() => {
    localStorage.setItem('ecobeacon_weekly_goal_type', weeklyGoalType);
    if (weeklyGoalType === 'weight') {
      const savedWeight = localStorage.getItem('ecobeacon_weekly_goal_weight_val');
      setWeeklyGoal(savedWeight ? parseFloat(savedWeight) : 10); // default 10 kg
    } else {
      const savedCount = localStorage.getItem('ecobeacon_weekly_goal_count_val');
      setWeeklyGoal(savedCount ? parseInt(savedCount, 10) : 5); // default 5 items
    }
  }, [weeklyGoalType]);

  useEffect(() => {
    if (weeklyGoalType === 'weight') {
      localStorage.setItem('ecobeacon_weekly_goal_weight_val', String(weeklyGoal));
    } else {
      localStorage.setItem('ecobeacon_weekly_goal_count_val', String(weeklyGoal));
    }
  }, [weeklyGoal, weeklyGoalType]);

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    const lastDismissedDate = localStorage.getItem('ecobeacon_daily_banner_dismissed_date');
    const todayStr = new Date().toDateString();
    return lastDismissedDate === todayStr;
  });

  const handleDismissBanner = () => {
    const todayStr = new Date().toDateString();
    localStorage.setItem('ecobeacon_daily_banner_dismissed_date', todayStr);
    setIsBannerDismissed(true);
  };

  const getDailyNotificationMessage = () => {
    const todayStr = new Date().toDateString();
    const loggedToday = streak.lastEntry === todayStr;
    const unitLabel = weeklyGoalType === 'count' ? (weeklyGoal === 1 ? 'item' : 'items') : 'kg';
    const leftAmount = Math.max(0, weeklyGoal - currentWeeklyProgress);

    let title = "Daily Green Progress Update";
    let desc = "";
    let statusTheme: 'emerald' | 'amber' | 'blue' = 'emerald';

    if (streak.count === 0) {
      statusTheme = 'amber';
      title = "Ignite Your Green Streak! ⚡";
      desc = `You don't have an active streak yet. Log your first recycling activity today to start earning bonus points and build consistent eco-habits! Your weekly goal is set to ${weeklyGoal} ${unitLabel}.`;
    } else if (!loggedToday) {
      statusTheme = 'amber';
      title = `Keep the ${streak.count}-Day Fire Burning! 🔥`;
      if (currentWeeklyProgress >= weeklyGoal) {
        desc = `Your stellar ${streak.count}-day streak is in danger of resetting today! Log an action now to protect it. Fantastic job already crushing your weekly goal of ${weeklyGoal} ${unitLabel}!`;
      } else {
        desc = `Your ${streak.count}-day recycling streak is active! Add an entry today to keep it alive and get closer to your weekly goal of ${weeklyGoal} ${unitLabel} (you need ${leftAmount.toFixed(weeklyGoalType === 'weight' ? 1 : 0)} more!).`;
      }
    } else {
      // Logged today! Streak is safe.
      if (currentWeeklyProgress >= weeklyGoal) {
        statusTheme = 'emerald';
        title = "Weekly Goal Smashed! 🏆";
        desc = `Your streak is secured at ${streak.count} days, and you have crushed your weekly target of ${weeklyGoal} ${unitLabel} with ${currentWeeklyProgress.toFixed(weeklyGoalType === 'weight' ? 1 : 0)} ${unitLabel} logged! You are an inspiration to the community.`;
      } else {
        statusTheme = 'blue';
        title = `Streak Secured at ${streak.count} Days! 🤝`;
        desc = `Amazing! Your streak is safe for today. You are making great progress towards your weekly target. Just ${leftAmount.toFixed(weeklyGoalType === 'weight' ? 1 : 0)} more ${unitLabel} to reach your ${weeklyGoal} ${unitLabel} goal!`;
      }
    }

    return { title, desc, statusTheme };
  };

  const notification = getDailyNotificationMessage();

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [prevLevel, setPrevLevel] = useState<LevelThreshold | null>(null);
  const [newLevel, setNewLevel] = useState<LevelThreshold | null>(null);

  const currentLevel = getLevelForPoints(user.points);
  const nextLevelIndex = getLevelForPoints(user.points).min === 15000 ? -1 : 1; // standard level length check
  const progressRatio = getLevelProgress(user.points);

  // Auto-detect and trigger Level Up milestone celebrations
  useEffect(() => {
    const lastSeenMinStr = localStorage.getItem('ecobeacon_last_seen_level_min');
    const currentMin = currentLevel.min;

    if (lastSeenMinStr !== null) {
      const lastSeenMin = parseFloat(lastSeenMinStr);
      if (currentMin > lastSeenMin) {
        const prev = LEVEL_THRESHOLDS.find(t => t.min === lastSeenMin) || LEVEL_THRESHOLDS[0];
        setPrevLevel(prev);
        setNewLevel(currentLevel);
        setShowLevelUpModal(true);
      }
    }
    // Sync current level threshold
    localStorage.setItem('ecobeacon_last_seen_level_min', String(currentMin));
  }, [user.points, currentLevel]);

  const handleTestLevelUp = () => {
    // Cycles test rank representation based on current level or defaults
    const currentIndex = LEVEL_THRESHOLDS.findIndex(t => t.title === currentLevel.title);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    const testNewIndex = currentIndex < LEVEL_THRESHOLDS.length - 1 ? currentIndex + 1 : LEVEL_THRESHOLDS.length - 1;

    setPrevLevel(LEVEL_THRESHOLDS[prevIndex]);
    setNewLevel(LEVEL_THRESHOLDS[testNewIndex]);
    setShowLevelUpModal(true);
  };

  // Search filter logic
  const filteredLogs = searchQuery.trim()
    ? logs.filter((log) =>
        log.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredIssues = searchQuery.trim()
    ? (issues || []).filter((issue) =>
        issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Filter logs for today to sum today's points
  const todayStr = new Date().toDateString();
  const todayPoints = logs
    .filter((l) => new Date(l.timestamp).toDateString() === todayStr)
    .reduce((sum, l) => sum + l.points, 0);

  const goalRatio = Math.min(1, todayPoints / DAILY_POINTS_GOAL);

  // Generate last 7 days of activity data
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    
    // Filter logs matching this day
    const dayLogs = logs.filter((l) => new Date(l.timestamp).toDateString() === dateStr);
    
    // Calculate total points earned on this day
    const pointsEarned = dayLogs.reduce((sum, l) => sum + l.points, 0);
    
    // Calculate total recycling weight logged on this day
    const weightLogged = dayLogs
      .filter((l) => l.weight > 0)
      .reduce((sum, l) => sum + l.weight, 0);
      
    // Format label (e.g., "Jun 21")
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    return {
      name: label,
      "Points": pointsEarned,
      "Recycled": parseFloat(weightLogged.toFixed(1)),
    };
  });

  // Generate last 7 days of personal recycling vs. community averages
  const personalInsightsData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    
    // Filter logs matching this day
    const dayLogs = logs.filter((l) => new Date(l.timestamp).toDateString() === dateStr);
    
    // Calculate total recycling weight logged on this day
    const weightLogged = dayLogs
      .filter((l) => l.weight > 0)
      .reduce((sum, l) => sum + l.weight, 0);
      
    // Format day label (e.g., "Mon")
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    
    // Community Average values with standard daily distribution + weekend spikes
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const communityAvg = dayOfWeek === 0 || dayOfWeek === 6 ? 2.5 : 1.6;
    
    return {
      name: label,
      "Your Weight": parseFloat(weightLogged.toFixed(1)),
      "Community Average": communityAvg,
    };
  });

  // Generate last 30 days of contribution activity data
  const last30DaysData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toDateString();
    
    // Filter logs matching this day
    const dayLogs = logs.filter((l) => new Date(l.timestamp).toDateString() === dateStr);
    
    // Calculate stats
    const pointsEarned = dayLogs.reduce((sum, l) => sum + l.points, 0);
    const logsCount = dayLogs.length;
    const hasActivity = logsCount > 0;
    
    // Format label (e.g., "Jun 10")
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const fullDateLabel = d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    return {
      name: label,
      fullDate: fullDateLabel,
      Contributions: logsCount,
      Points: pointsEarned,
      hasActivity,
    };
  });

  const activeDaysCount = last30DaysData.filter(d => d.hasActivity).length;
  const activeConsistency = Math.round((activeDaysCount / 30) * 100);
  const total30DayPoints = last30DaysData.reduce((sum, d) => sum + d.Points, 0);

  const userTotalWeight = personalInsightsData.reduce((sum, item) => sum + item["Your Weight"], 0);
  const communityTotalAvg = personalInsightsData.reduce((sum, item) => sum + item["Community Average"], 0);
  const percentageDiff = communityTotalAvg > 0 ? ((userTotalWeight - communityTotalAvg) / communityTotalAvg) * 100 : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      id="dashboard-tab"
    >
      {/* Environmental Champion Profile Header Banner */}
      <motion.div variants={cardVariants}>
        <EnvironmentalBanner user={user} streak={streak} />
      </motion.div>

      {/* Daily Personalized Progress & Goal Notification Banner */}
      <AnimatePresence>
        {!isBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, y: -15, margin: 0, transition: { duration: 0.25 } }}
            className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-300 shadow-sm ${
              notification.statusTheme === 'amber'
                ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/35'
                : notification.statusTheme === 'blue'
                ? 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/35'
                : 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/35'
            }`}
            id="daily-goal-notification-banner"
          >
            {/* Soft decorative background circles */}
            <div className={`absolute -right-10 -bottom-10 w-36 h-36 rounded-full opacity-10 dark:opacity-5 pointer-events-none blur-xl ${
              notification.statusTheme === 'amber'
                ? 'bg-amber-400'
                : notification.statusTheme === 'blue'
                ? 'bg-blue-400'
                : 'bg-emerald-400'
            }`} />

            <div className="flex items-start gap-4 pr-8">
              {/* Animated Icon container */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative ${
                notification.statusTheme === 'amber'
                  ? 'bg-amber-100/70 dark:bg-amber-950/30 border-amber-200/65 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'
                  : notification.statusTheme === 'blue'
                  ? 'bg-blue-100/70 dark:bg-blue-950/30 border-blue-200/65 dark:border-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-100/70 dark:bg-emerald-950/30 border-emerald-200/65 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
              }`}>
                {/* Subtle outer pulse effect */}
                <span className={`absolute inset-0 rounded-xl animate-pulse opacity-40 ${
                  notification.statusTheme === 'amber'
                    ? 'bg-amber-300'
                    : notification.statusTheme === 'blue'
                    ? 'bg-blue-300'
                    : 'bg-emerald-300'
                }`} />
                <Bell className="w-5 h-5 relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-sm font-black uppercase tracking-wider ${
                    notification.statusTheme === 'amber'
                      ? 'text-amber-800 dark:text-amber-350'
                      : notification.statusTheme === 'blue'
                      ? 'text-blue-800 dark:text-blue-350'
                      : 'text-emerald-800 dark:text-emerald-350'
                  }`}>
                    {notification.title}
                  </h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    notification.statusTheme === 'amber'
                      ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-450'
                      : notification.statusTheme === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-450'
                      : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-450'
                  }`}>
                    Daily Alert
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 leading-relaxed max-w-4xl">
                  {notification.desc}
                </p>
                
                {/* Quick Interactive Metric Mini-Bar inside notification for extra delight */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="w-24 bg-gray-200/70 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        notification.statusTheme === 'amber'
                          ? 'bg-amber-500'
                          : notification.statusTheme === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${weeklyGoalRatio * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                    Goal Progress: {Math.round(weeklyGoalRatio * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismissBanner}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-650 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100/50 dark:hover:bg-zinc-800/40 transition-all cursor-pointer"
              title="Dismiss for today"
              id="dismiss-daily-notification-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Eco-Tip / Sustainability Trivia Card */}
      <motion.div variants={cardVariants}>
        <EcoTipCard />
      </motion.div>

      {/* Upper Welcomer Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User Card */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -6, scale: 1.025, boxShadow: "0 15px 30px -10px rgba(16, 185, 129, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800/85 rounded-3xl p-6 shadow-sm hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group cursor-pointer" 
          id="user-stats-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-full -mr-10 -mt-10 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 flex items-center justify-center text-2xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-inner group-hover:rotate-6 transition-transform duration-300">
              {currentLevel.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active Eco Hero</p>
              <h2 className="text-xl font-black text-gray-950 dark:text-zinc-100 font-display uppercase tracking-tight" id="user-display-name">{user.name}</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1 mt-0.5">📍 {user.city}</p>
            </div>
          </div>

          <div className="mt-6 pt-4.5 border-t border-gray-100 dark:border-zinc-800/60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rank Level: {currentLevel.title}</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-500/10">{user.points} pts</span>
            </div>
            {/* PROGRESS BAR */}
            <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800/80 rounded-full overflow-hidden shadow-inner p-0.5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressRatio * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 rounded-full shadow-sm"
              ></motion.div>
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <motion.button
                id="preview-levelup-trigger-btn"
                whileTap={{ scale: 0.95 }}
                onClick={handleTestLevelUp}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black hover:underline cursor-pointer flex items-center gap-1 select-none uppercase tracking-wider outline-none"
                title="Preview milestone level up celebration"
              >
                <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" /> Preview celebration
              </motion.button>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold text-right">
                {progressRatio === 1 ? 'Max level achieved 🎉' : 'Progressing to next Rank'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -6, scale: 1.025, boxShadow: "0 15px 30px -10px rgba(245, 158, 11, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800/85 rounded-3xl p-6 shadow-sm hover:border-orange-500/20 dark:hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden group cursor-pointer" 
          id="streak-stats-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/30 dark:bg-orange-950/10 rounded-full -mr-10 -mt-10 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 dark:from-orange-950/40 dark:to-amber-950/20 flex items-center justify-center border border-orange-500/20 dark:border-orange-500/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Flame className="w-7 h-7 fill-orange-500 text-orange-600 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-600 dark:text-orange-450 uppercase tracking-widest">Cleanliness Streak</p>
              <h2 className="text-2xl font-black text-gray-950 dark:text-zinc-100 font-display uppercase tracking-tight" id="streak-counter">{streak.count} Days</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">Keep sorting & logging daily!</p>
            </div>
          </div>

          <div className="mt-6 pt-4.5 border-t border-gray-100 dark:border-zinc-800/60 flex justify-between items-center text-xs">
            <span className="text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
              <Calendar className="w-4 h-4 text-orange-500" /> Last contribution:
            </span>
            <span className="font-extrabold text-zinc-850 dark:text-zinc-200 bg-orange-500/5 dark:bg-orange-950/20 px-2.5 py-1 rounded-xl border border-orange-500/10">{streak.lastEntry || 'Start Trek Today!'}</span>
          </div>
        </motion.div>

        {/* Goal Indicator Progress Circle */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -6, scale: 1.025, boxShadow: "0 15px 30px -10px rgba(20, 184, 166, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800/85 rounded-3xl p-6 shadow-sm hover:border-teal-500/20 dark:hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group cursor-pointer" 
          id="goal-stats-card"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Eco points today</p>
              <h2 className="text-2xl font-black text-gray-950 dark:text-zinc-100 font-display uppercase tracking-tight" id="today-points-balance">{todayPoints} <span className="text-xs font-bold text-zinc-450 dark:text-zinc-500">/ {DAILY_POINTS_GOAL} pts</span></h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-555 font-bold">Daily Ward contribution target</p>
            </div>
            <div className="relative w-16 h-16 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100 dark:text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-emerald-500"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: Math.min(1, goalRatio) }}
                  transition={{ type: "spring", stiffness: 50, damping: 14 }}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                {Math.round(goalRatio * 100)}%
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-zinc-800/60 text-center">
            <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-350 font-black px-3.5 py-1.5 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20 inline-block uppercase tracking-wider">
              {todayPoints >= DAILY_POINTS_GOAL ? '🏆 Daily goal achieved!' : `${DAILY_POINTS_GOAL - todayPoints} more points to reach goal`}
            </span>
          </div>
        </motion.div>

        {/* Weekly Goal Progress Card */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -6, scale: 1.025, boxShadow: "0 15px 30px -10px rgba(16, 185, 129, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800/85 rounded-3xl p-6 shadow-sm hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between" 
          id="weekly-goal-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-full -mr-10 -mt-10 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Weekly Goal
              </p>
              
              {/* Type Switcher */}
              <div className="flex bg-gray-100/80 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-gray-100 dark:border-zinc-700/30">
                <button
                  onClick={() => setWeeklyGoalType('count')}
                  className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider transition-all cursor-pointer ${
                    weeklyGoalType === 'count'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-655'
                  }`}
                  title="Measure by count of items logged"
                >
                  Count
                </button>
                <button
                  onClick={() => setWeeklyGoalType('weight')}
                  className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider transition-all cursor-pointer ${
                    weeklyGoalType === 'weight'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-655'
                  }`}
                  title="Measure by total weight logged in kilograms"
                >
                  Weight
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <h2 className="text-2xl font-black text-gray-950 dark:text-zinc-100 font-display uppercase tracking-tight" id="weekly-goal-progress">
                {weeklyGoalType === 'count' ? weeklyCount : weeklyWeight.toFixed(1)}{' '}
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                  / {weeklyGoalType === 'count' ? weeklyGoal : `${weeklyGoal} kg`}
                </span>
              </h2>

              {/* Interactive Target Adjuster */}
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800/40 px-1.5 py-0.5 rounded-lg border border-gray-100 dark:border-zinc-800/60">
                <button
                  onClick={() => {
                    const step = 1;
                    setWeeklyGoal(prev => Math.max(step, prev - step));
                  }}
                  className="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs text-gray-400 hover:text-emerald-600 dark:text-zinc-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-800 transition-all select-none cursor-pointer border border-transparent hover:border-gray-200/50 dark:hover:border-zinc-700"
                  title="Decrease goal"
                >
                  -
                </button>
                <span className="text-[9px] font-extrabold text-zinc-700 dark:text-zinc-300 min-w-[16px] text-center">
                  {weeklyGoal}
                </span>
                <button
                  onClick={() => {
                    const step = 1;
                    const max = weeklyGoalType === 'weight' ? 200 : 50;
                    setWeeklyGoal(prev => Math.min(max, prev + step));
                  }}
                  className="w-4 h-4 rounded-sm flex items-center justify-center font-bold text-xs text-gray-400 hover:text-emerald-600 dark:text-zinc-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-800 transition-all select-none cursor-pointer border border-transparent hover:border-gray-200/50 dark:hover:border-zinc-700"
                  title="Increase goal"
                >
                  +
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold leading-normal">
              Weekly target of recycling logs
            </p>
          </div>

          {/* Progress Bar & Info */}
          <div className="mt-4 space-y-2">
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden relative p-0.5 shadow-inner">
              <motion.div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${weeklyGoalRatio * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
              <span>{Math.round(weeklyGoalRatio * 100)}% Done</span>
              <span>
                {currentWeeklyProgress >= weeklyGoal 
                  ? 'Goal Achieved!' 
                  : `${Math.max(0, weeklyGoal - currentWeeklyProgress).toFixed(weeklyGoalType === 'weight' ? 1 : 0)} left`}
              </span>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-zinc-800/60 text-center">
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-2xl border uppercase tracking-wider inline-block ${
              currentWeeklyProgress >= weeklyGoal 
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-350 border-emerald-500/10 dark:border-emerald-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-850'
            }`}>
              {currentWeeklyProgress >= weeklyGoal ? '🏆 Weekly Goal Met!' : '🎯 Target Pending'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Search Hub */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 space-y-4" 
        id="dashboard-search-hub"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-gray-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔍 Search Activity & Issues</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Quickly locate your past recycling logs or active neighborhood hazard reports</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 dark:text-zinc-550 absolute left-3.5 top-2.5" />
            <input
              id="dashboard-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by material, issue category, description..."
              className="w-full pl-10 pr-8 py-2 text-xs font-medium border border-gray-100 dark:border-zinc-850 rounded-xl bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-650"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-350 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results Display (only if searchQuery is not empty) */}
        {searchQuery && (
          <div className="border-t border-gray-100 dark:border-zinc-850 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6" id="search-results-box">
            {/* Logged Recycling Materials & Activity */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider">♻️ Logged Materials & Activity ({filteredLogs.length})</h4>
              {filteredLogs.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 italic">No matching logs found.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-center border border-gray-50 dark:border-zinc-800/60 hover:border-gray-100 dark:hover:border-zinc-700 p-2.5 rounded-xl bg-gray-50/50 dark:bg-zinc-950/20 transition-all text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg select-none shrink-0">{log.icon || '📦'}</span>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-gray-800 dark:text-zinc-200 truncate">{log.category}</h5>
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold">
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {log.notes && (
                            <p className="text-[9px] text-gray-500 dark:text-zinc-450 italic truncate max-w-[180px] sm:max-w-xs mt-0.5" title={log.notes}>
                              💬 "{log.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-green-600 dark:text-green-450">+{log.points} pts</div>
                        {log.weight > 0 && (
                          <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold">{log.weight} kg</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reported Community Issues */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider">🚨 Reported Community Issues ({filteredIssues.length})</h4>
              {filteredIssues.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 italic">No matching community issues found.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredIssues.map((issue) => (
                    <div key={issue.id} className="border border-gray-50 dark:border-zinc-800/60 hover:border-gray-100 dark:hover:border-zinc-700 p-2.5 rounded-xl bg-gray-50/50 dark:bg-zinc-950/20 transition-all text-xs space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg select-none shrink-0">🚨</span>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-gray-800 dark:text-zinc-200 truncate">{issue.category}</h5>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              issue.status === 'Resolved' 
                                ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400' 
                                : issue.severity === 'High' 
                                  ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400' 
                                  : 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400'
                            }`}>
                              {issue.status === 'Resolved' ? 'Resolved' : `${issue.severity} Severity`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold">
                            {new Date(issue.timestamp).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-[9px] text-gray-400 dark:text-zinc-550 font-semibold">{issue.upvotes} upvotes</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-2 italic font-medium">"{issue.description}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* AI Predictive Insights & Community Hazards Forecast */}
      <motion.div 
        variants={cardVariants}
        className="bg-gradient-to-br from-emerald-50/40 to-green-50/10 dark:from-zinc-900/40 dark:to-zinc-900/10 border border-green-100/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 space-y-4" 
        id="predictive-insights-panel"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg select-none">
              🤖
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <span>Predictive Civic AI Insights</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 uppercase tracking-widest animate-pulse">Live</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Predictive modeling of public hazard hotspots, waste patterns, and preventative actions</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-gray-400 dark:text-zinc-550 uppercase tracking-wider shrink-0">Updated hourly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Insight 1 */}
          <div className="bg-white/80 dark:bg-zinc-950/30 border border-gray-100 dark:border-zinc-850 p-4 rounded-xl space-y-3 shadow-xs hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100/60 dark:border-red-900/30 px-2 py-0.5 rounded-md uppercase tracking-wide">
                ⚠️ Pothole Risk
              </span>
              <span className="text-xs font-black text-gray-700 dark:text-zinc-300">84% Confidence</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200">Precipitation Wear Warning</h4>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">Heavy runoff projected near the Central Transit Corridor. Local tarmac is highly susceptible to wear and pothole development over the next 48 hours.</p>
            </div>
            <div className="pt-2 border-t border-gray-50 dark:border-zinc-850/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-400 dark:text-zinc-500">Action:</span>
              <span className="text-emerald-600 dark:text-emerald-400">Deploy proactive street sealing</span>
            </div>
          </div>

          {/* Insight 2 */}
          <div className="bg-white/80 dark:bg-zinc-950/30 border border-gray-100 dark:border-zinc-850 p-4 rounded-xl space-y-3 shadow-xs hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-100/60 dark:border-amber-900/30 px-2 py-0.5 rounded-md uppercase tracking-wide">
                ♻️ Waste Accumulation
              </span>
              <span className="text-xs font-black text-gray-700 dark:text-zinc-300">72% Confidence</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200">Weekend Park Volume Peak</h4>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">Citizen traffic is forecasted to spike around Sector-2 Main Playground. High probability of sorting bin overflows if secondary bins are not positioned by Saturday.</p>
            </div>
            <div className="pt-2 border-t border-gray-50 dark:border-zinc-850/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-400 dark:text-zinc-550">Action:</span>
              <span className="text-emerald-600 dark:text-emerald-400">Deploy secondary sorting bins</span>
            </div>
          </div>

          {/* Insight 3 */}
          <div className="bg-white/80 dark:bg-zinc-950/30 border border-gray-100 dark:border-zinc-850 p-4 rounded-xl space-y-3 shadow-xs hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/30 px-2 py-0.5 rounded-md uppercase tracking-wide">
                💡 Infrastructure Aging
              </span>
              <span className="text-xs font-black text-gray-700 dark:text-zinc-300">65% Confidence</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200">Streetlight Failure Forecast</h4>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">Bulbs along Park Avenue North have crossed 12,000 continuous hours. High likelihood of flicker failures starting around the West sector within 10-14 days.</p>
            </div>
            <div className="pt-2 border-t border-gray-50 dark:border-zinc-850/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-400 dark:text-zinc-550">Action:</span>
              <span className="text-emerald-600 dark:text-emerald-400">Schedule preventive LED check</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 7-Day Activity Analytics Chart */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300" 
        id="analytics-chart-container"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-base font-black text-gray-800 dark:text-zinc-100">Weekly Cleanliness & Points Tracker</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Your recycling volume (kg) and eco-points earned over the last 7 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-gray-600 dark:text-zinc-350">Recycled (kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-gray-600 dark:text-zinc-350">Eco Points</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full" id="recharts-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last7DaysData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#27272a' : '#f3f4f6'} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#10b981', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#f59e0b', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
                  border: document.documentElement.classList.contains('dark') ? '1px solid #27272a' : '1px solid #f3f4f6',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#18181b'
                }}
                labelStyle={{ color: document.documentElement.classList.contains('dark') ? '#a1a1aa' : '#6b7280' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Recycled"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Points"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 30-Day Daily Contribution Tracker */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300" 
        id="contribution-30day-chart-container"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-gray-800 dark:text-zinc-100 flex items-center gap-2">
              <span>📅 30-Day Daily Contribution Tracker</span>
              <span className="text-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-400 font-extrabold px-2 py-0.5 rounded-full border border-orange-500/10">Streak Tracker</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium font-sans">Visualization of your civic logging consistency and streak preserves over the last 30 days</p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              <span className="text-gray-600 dark:text-zinc-350">Active Streak Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-zinc-800 inline-block"></span>
              <span className="text-gray-600 dark:text-zinc-350">No Logged Activity</span>
            </div>
          </div>
        </div>

        {/* 30-Day Stats Board Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 border-b border-gray-50 dark:border-zinc-850/60 pb-5">
          <div className="bg-gray-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-800/40 text-center sm:text-left">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-wider">Active Days</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeDaysCount} <span className="text-xs text-gray-400 font-bold">/ 30</span></p>
          </div>
          <div className="bg-gray-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-800/40 text-center sm:text-left">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-wider">Consistency</p>
            <p className="text-xl font-black text-orange-500 mt-0.5">{activeConsistency}%</p>
          </div>
          <div className="bg-gray-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-800/40 text-center sm:text-left">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-wider">Total Points</p>
            <p className="text-xl font-black text-amber-500 mt-0.5">+{total30DayPoints} pts</p>
          </div>
          <div className="bg-gray-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-800/40 text-center sm:text-left">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-wider">Current Streak</p>
            <p className="text-xl font-black text-red-500 mt-0.5">🔥 {streak.count} Days</p>
          </div>
        </div>

        {/* BarChart representing 30 Days */}
        <div className="h-60 w-full animate-fade-in" id="recharts-30day-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last30DaysData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#27272a' : '#f3f4f6'} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                interval={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                allowDecimals={false}
              />
              <Tooltip content={<Custom30DayTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
              <Bar dataKey="Contributions" radius={[4, 4, 0, 0]} maxBarSize={30}>
                {last30DaysData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hasActivity ? '#f59e0b' : (document.documentElement.classList.contains('dark') ? '#27272a' : '#e4e4e7')}
                    className="transition-all duration-300 hover:opacity-85"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Personal Insights Section with Weekly weight comparison vs Community average */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-zinc-900 border border-gray-150/70 dark:border-zinc-800/85 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300" 
        id="personal-insights-container"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              📈
            </div>
            <div>
              <h3 className="text-base font-black text-gray-800 dark:text-zinc-100">Personal Insights</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Your recycling weight compared with your neighborhood's active averages</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-gray-600 dark:text-zinc-350">Your Weight (kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
              <span className="text-gray-600 dark:text-zinc-350">Community Average (kg)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Recharts Mini Line Chart */}
          <div className="lg:col-span-8 h-48 w-full" id="insights-recharts-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={personalInsightsData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#27272a' : '#f3f4f6'} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
                    border: document.documentElement.classList.contains('dark') ? '1px solid #27272a' : '1px solid #f3f4f6',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#18181b'
                  }}
                  labelStyle={{ color: document.documentElement.classList.contains('dark') ? '#a1a1aa' : '#6b7280' }}
                />
                <Line
                  type="monotone"
                  dataKey="Your Weight"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Community Average"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#6366f1', strokeWidth: 1, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Textual Insights & Quick Metric Feedback Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-xl space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Weekly Balance</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                  percentageDiff > 0 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'
                }`}>
                  {percentageDiff > 0 ? `+${percentageDiff.toFixed(0)}% Ahead` : `${percentageDiff.toFixed(0)}% Off`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-extrabold block uppercase">You Logged</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{userTotalWeight.toFixed(1)} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-extrabold block uppercase">Comm. Avg</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{communityTotalAvg.toFixed(1)} kg</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-zinc-850/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-zinc-200">
                  <TrendingUp className={`w-4 h-4 ${percentageDiff > 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span>Performance Status</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">
                  {percentageDiff > 0 
                    ? `Fantastic job! You recycled ${userTotalWeight.toFixed(1)} kg this week, placing you ahead of the community target. Your contribution is helping keep the ward extremely clean.`
                    : `You are currently ${Math.abs(userTotalWeight - communityTotalAvg).toFixed(1)} kg below the local community average. Try logging your household dry waste to boost your weekly stats!`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid: Cleanliness Impact, Achievements Teaser & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cleanliness Impact */}
        <motion.div 
          variants={cardVariants}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between" 
          id="impact-card"
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <span>🌍 Neighborhood Impact</span>
              </h3>
              <motion.button 
                whileTap={{ scale: 0.90 }}
                onClick={onRefreshStats} 
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-355 transition-all cursor-pointer outline-none"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/80 rounded-xl p-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300" id="metric-unresolved">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    🚨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200">Active Issues</h4>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">Unresolved pins</p>
                  </div>
                </div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{activeIssuesCount}</div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/80 rounded-xl p-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300" id="metric-fixed">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                    ✅
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200">Verified & Resolved</h4>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">Fixed community pins</p>
                  </div>
                </div>
                <div className="text-base font-black text-green-600 dark:text-green-400">{resolvedIssuesCount}</div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/80 rounded-xl p-3 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300" id="metric-recycled">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    ♻️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200">Total Recycled</h4>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">Diverted waste</p>
                  </div>
                </div>
                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                  {logs.filter(l => l.weight > 0).reduce((sum, l) => sum + l.weight, 0).toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <motion.button
              id="dash-take-action-btn"
              whileTap={{ scale: 0.97 }}
              onClick={onNavigateToLog}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer outline-none"
            >
              🚀 Take Action (Log / Report)
            </motion.button>
          </div>
        </motion.div>

        {/* Milestone Achievements Teaser */}
        <motion.div 
          variants={cardVariants}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between" 
          id="achievements-teaser-card"
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span>🏆 Achievements Status</span>
              </h3>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-2 py-0.5 rounded-full">
                {(() => {
                  const totalWeight = logs.filter(l => l.weight > 0).reduce((sum, l) => sum + l.weight, 0);
                  const reportedCount = logs.filter(l => l.category.startsWith('Reported:')).length;
                  const verifiedCount = logs.filter(l => l.category.startsWith('Verified Pin:')).length;
                  const resolvedCount = logs.filter(l => l.category.startsWith('Cleaned hazard:')).length;
                  const civicActions = reportedCount + verifiedCount + resolvedCount;

                  const milestones = [
                    { t: 5, c: totalWeight },
                    { t: 50, c: totalWeight },
                    { t: 100, c: totalWeight },
                    { t: 3, c: streak.count },
                    { t: 7, c: streak.count },
                    { t: 10, c: streak.count },
                    { t: 100, c: user.points },
                    { t: 1000, c: user.points },
                    { t: 5000, c: user.points },
                    { t: 1, c: reportedCount },
                    { t: 3, c: verifiedCount },
                    { t: 10, c: civicActions }
                  ];
                  const unlocked = milestones.filter(m => m.c >= m.t).length;
                  return `${unlocked} / 12 Unlocked`;
                })()}
              </span>
            </div>

            {/* Quick Preview of 3 Core Achievements */}
            <div className="space-y-3.5">
              {(() => {
                const totalWeight = logs.filter(l => l.weight > 0).reduce((sum, l) => sum + l.weight, 0);
                const reportedCount = logs.filter(l => l.category.startsWith('Reported:')).length;
                
                const previewBadges = [
                  { title: 'First Sort', desc: 'Log 5kg of materials', isDone: totalWeight >= 5, icon: '🌱' },
                  { title: 'Warm-up Streak', desc: 'Maintain 3-day active streak', isDone: streak.count >= 3, icon: '🔥' },
                  { title: 'Neighborhood Scout', desc: 'File your first hazard report', isDone: reportedCount >= 1, icon: '🚨' }
                ];

                return previewBadges.map((badge, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 border rounded-xl transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${
                      badge.isDone ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 unlocked-badge-pulse' : 'border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg border select-none ${
                        badge.isDone ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60' : 'bg-gray-100 dark:bg-zinc-800 border-gray-150 dark:border-zinc-700 grayscale opacity-60'
                      }`}>
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-250">{badge.title}</h4>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-none">{badge.desc}</p>
                      </div>
                    </div>
                    <div>
                      {badge.isDone ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold flex items-center bg-amber-100/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-1.5 py-0.5 rounded-md">✓</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 dark:text-zinc-550 font-bold bg-gray-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded-md">In Progress</span>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <motion.button
              id="dash-explore-badges-btn"
              whileTap={{ scale: 0.97 }}
              onClick={onNavigateToAchievements}
              className="w-full py-2.5 bg-amber-550 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 cursor-pointer outline-none"
            >
              ⭐ Explore Milestone Badges
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Contributions feed */}
        <motion.div 
          variants={cardVariants}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.015] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between" 
          id="recent-logs-card"
        >
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4">♻️ Recent Cleanliness Activity</h3>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
                <p className="text-xs font-bold">No activity logs recorded yet.</p>
                <p className="text-[10px] text-gray-450 dark:text-zinc-600 mt-1">Start by recycling material or lodging reports!</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[175px] overflow-y-auto pr-1">
                {logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex justify-between items-center border border-gray-50 dark:border-zinc-800/80 hover:border-gray-100 dark:hover:border-zinc-700 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xs p-2 rounded-lg transition-all text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-base shadow-xs select-none shrink-0">
                        {log.icon || '📦'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 truncate max-w-[110px]">{log.category}</h4>
                        <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold">
                          {new Date(log.timestamp).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-green-600 dark:text-green-450">+{log.points} pts</div>
                      {log.weight > 0 && (
                        <div className="text-[9px] text-gray-450 dark:text-zinc-450 font-bold">{log.weight} kg</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {logs.length > 3 ? (
            <div className="border-t border-gray-150 dark:border-zinc-800 pt-2 text-center text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
              And {logs.length - 3} other items logged
            </div>
          ) : (
            <div className="h-4"></div>
          )}
        </motion.div>
      </div>

      {/* LEVEL UP CELEBRATORY MODAL */}
      <AnimatePresence>
        {showLevelUpModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLevelUpModal(false)}
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md"
              id="lvl-up-backdrop"
            />

            {/* Burst Confetti Containers */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" id="lvl-up-confetti-stage">
              {confettiElements.map((c) => (
                <motion.div
                  key={c.id}
                  className="absolute rounded-xs shadow-xs"
                  style={{
                    backgroundColor: c.color,
                    width: c.size,
                    height: c.size,
                    left: '50%',
                    top: '40%', // Burst from just above center of the modal card
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: c.x * 8,
                    y: c.y * 3 + 180,
                    opacity: 0,
                    rotate: c.rotation + 720,
                  }}
                  transition={{
                    delay: c.delay,
                    duration: c.duration,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0, rotate: -1.5 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden text-center z-10 space-y-6"
              id="lvl-up-card"
            >
              {/* Glow Effects in Card */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Floating Sparkles */}
              <div className="absolute top-6 left-6 text-emerald-500 animate-bounce">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="absolute top-6 right-6 text-amber-500 animate-bounce [animation-delay:0.3s]">
                <Sparkles className="w-5 h-5" />
              </div>

              {/* Header */}
              <div className="space-y-1.5 pt-4">
                <motion.div
                  initial={{ scale: 0.5, rotate: -20 }}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -5, 0] }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="w-20 h-20 mx-auto bg-gradient-to-tr from-yellow-400 to-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-800 relative"
                >
                  <Trophy className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-1 border-2 border-amber-300 rounded-2xl pointer-events-none"
                  />
                </motion.div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight pt-3">
                  RANK UP ACHIEVED!
                </h2>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/60 dark:border-emerald-900/40 px-3 py-1 rounded-full inline-block">
                  Milestone Completed 🎉
                </p>
              </div>

              {/* Transition Comparison Layout */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-850 p-4 rounded-2xl flex items-center justify-center gap-6 relative">
                {/* Previous Rank */}
                <div className="text-center flex-1">
                  <div className="text-3xl select-none filter grayscale opacity-60 mb-1">
                    {prevLevel?.icon || '🌱'}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Previous</p>
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 truncate">
                    {prevLevel?.title || 'Waste Warrior'}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-emerald-500 shrink-0">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>

                {/* New Rank */}
                <div className="text-center flex-1">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="text-4xl select-none mb-1 drop-shadow-md"
                  >
                    {newLevel?.icon || '🌿'}
                  </motion.div>
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">New Rank</p>
                  <p className="text-sm font-black text-gray-900 dark:text-zinc-100 truncate">
                    {newLevel?.title || 'Green Scout'}
                  </p>
                </div>
              </div>

              {/* Level Perks Info Box */}
              <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl p-4.5 text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Star className="w-4 h-4 fill-emerald-500 text-emerald-600 dark:text-emerald-400" />
                  <span>Milestone Perk Unlocked</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-300 font-medium leading-relaxed">
                  {newLevel ? getLevelDescription(newLevel.title) : getLevelDescription('Green Scout')}
                </p>
              </div>

              {/* Share/Action block */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'EcoBeacon Level Up!',
                        text: `I just leveled up to ${newLevel?.title} on EcoBeacon! Join me in cleaning our community.`,
                        url: window.location.href,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`I just leveled up to ${newLevel?.title} on EcoBeacon! Points balance: ${user.points} pts.`);
                      alert("Copied certification to clipboard! Share it with your neighbors.");
                    }
                  }}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-gray-750 dark:text-zinc-200 border border-gray-150 dark:border-zinc-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Badge</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLevelUpModal(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md cursor-pointer outline-none"
                >
                  Let's Keep Trekking!
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Pro Tip Notification Toaster */}
      <ProTip />
    </motion.div>
  );
}
