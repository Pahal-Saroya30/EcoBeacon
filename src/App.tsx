/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User, LogEntry, IssueReport, Streak } from './types';
import { seedMockIssues, POINTS_REPORT_ISSUE, POINTS_VERIFY_ISSUE, POINTS_RESOLVE_ISSUE } from './utils';

// Import subcomponents
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import AlertMap from './components/AlertMap';
import Leaderboard from './components/Leaderboard';
import Rewards from './components/Rewards';
import Settings from './components/Settings';
import Achievements, { getBadgesList, isBadgeUnlocked, Badge } from './components/Achievements';
import EnvironmentalImpact from './components/EnvironmentalImpact';
import ConfettiOverlay from './components/ConfettiOverlay';
import CommunityChat from './components/CommunityChat';
import NetworkStatusDetector from './components/NetworkStatusDetector';
import AchievementToast from './components/AchievementToast';
import { savePendingLog, savePendingIssue } from './utils/indexedDB';
import { playUnlockChime } from './utils/audio';

// Import Icons
import { LayoutDashboard, PlusCircle, MapPin, Trophy, Gift, Settings as SettingsIcon, Leaf, Coins, Flame, Award, BarChart3, MessageSquare, Menu, X } from 'lucide-react';

const FLOATING_PARTICLES = [
  { id: 1, size: 8, left: '12%', top: '15%', delay: 0, duration: 18, color: 'bg-emerald-400/20 dark:bg-emerald-500/10' },
  { id: 2, size: 16, left: '85%', top: '25%', delay: 2, duration: 22, color: 'bg-teal-400/15 dark:bg-teal-500/10' },
  { id: 3, size: 10, left: '45%', top: '40%', delay: 4, duration: 20, color: 'bg-green-400/20 dark:bg-green-500/10' },
  { id: 4, size: 6, left: '70%', top: '65%', delay: 1, duration: 16, color: 'bg-emerald-500/15 dark:bg-emerald-600/10' },
  { id: 5, size: 20, left: '25%', top: '80%', delay: 5, duration: 26, color: 'bg-teal-500/10 dark:bg-teal-600/5' },
  { id: 6, size: 12, left: '60%', top: '10%', delay: 3, duration: 19, color: 'bg-green-500/15 dark:bg-green-400/10' },
  { id: 7, size: 14, left: '90%', top: '75%', delay: 7, duration: 24, color: 'bg-emerald-400/15 dark:bg-emerald-500/10' },
  { id: 8, size: 8, left: '35%', top: '55%', delay: 2.5, duration: 17, color: 'bg-teal-400/20 dark:bg-teal-500/10' },
  { id: 9, size: 18, left: '75%', top: '45%', delay: 4.5, duration: 25, color: 'bg-green-400/10 dark:bg-green-500/5' },
  { id: 10, size: 10, left: '15%', top: '60%', delay: 6, duration: 21, color: 'bg-emerald-500/20 dark:bg-emerald-400/10' },
  { id: 11, size: 12, left: '50%', top: '85%', delay: 1.5, duration: 20, color: 'bg-teal-500/15 dark:bg-teal-400/10' },
  { id: 12, size: 7, left: '80%', top: '88%', delay: 3.5, duration: 15, color: 'bg-green-500/20 dark:bg-green-400/10' },
  { id: 13, size: 15, left: '5%', top: '35%', delay: 5.5, duration: 23, color: 'bg-emerald-400/15 dark:bg-emerald-500/10' },
  { id: 14, size: 9, left: '55%', top: '30%', delay: 0.5, duration: 18, color: 'bg-teal-400/20 dark:bg-teal-500/10' },
  { id: 15, size: 11, left: '65%', top: '92%', delay: 8, duration: 22, color: 'bg-green-400/15 dark:bg-green-500/10' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [streak, setStreak] = useState<Streak>({ count: 1, lastEntry: null });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'map' | 'leaderboard' | 'rewards' | 'settings' | 'achievements' | 'impact' | 'chat'>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ecobeacon_dark_mode') === 'true';
  });
  const [colorTheme, setColorTheme] = useState<'emerald' | 'cyberpunk' | 'sunset' | 'ocean'>(() => {
    return (localStorage.getItem('ecobeacon_color_theme') as any) || 'emerald';
  });

  const handleUpdateColorTheme = (theme: 'emerald' | 'cyberpunk' | 'sunset' | 'ocean') => {
    setColorTheme(theme);
    localStorage.setItem('ecobeacon_color_theme', theme);
  };
  const [showConfetti, setShowConfetti] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; badge: Badge }>>([]);
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ecobeacon_dark_mode', String(darkMode));
  }, [darkMode]);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('ecobeacon_user');
    const savedLogs = localStorage.getItem('ecobeacon_logs');
    const savedIssues = localStorage.getItem('ecobeacon_issues');
    const savedStreak = localStorage.getItem('ecobeacon_streak');

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      const parsedLogs = savedLogs ? JSON.parse(savedLogs) : [];
      setLogs(parsedLogs);

      const parsedStreak = savedStreak ? JSON.parse(savedStreak) : { count: 1, lastEntry: null };
      setStreak(parsedStreak);

      if (savedIssues) {
        setIssues(JSON.parse(savedIssues));
      } else {
        // Seed default local issues for user city
        const seeded = seedMockIssues(parsedUser.city);
        setIssues(seeded);
        localStorage.setItem('ecobeacon_issues', JSON.stringify(seeded));
      }

      // Populate pre-existing unlocked achievements
      const initialBadges = getBadgesList(parsedUser, parsedLogs, parsedStreak);
      prevUnlockedRef.current = new Set(
        initialBadges.filter(isBadgeUnlocked).map((b) => b.id)
      );
    }
  }, []);

  // Track newly unlocked badges
  useEffect(() => {
    if (!user) {
      prevUnlockedRef.current = new Set();
      return;
    }

    // Calculate list of currently unlocked badges
    const badges = getBadgesList(user, logs, streak);
    const currentUnlocked = new Set(
      badges.filter(isBadgeUnlocked).map((b) => b.id)
    );

    // If prevUnlockedRef is empty and we have user/logs/streak, populate it first
    // to prevent showing toasts for historical achievements on initial load
    if (prevUnlockedRef.current.size === 0 && currentUnlocked.size > 0) {
      prevUnlockedRef.current = currentUnlocked;
      return;
    }

    // Find newly unlocked badges
    const newlyUnlockedIds = [...currentUnlocked].filter(
      (id) => !prevUnlockedRef.current.has(id)
    );

    if (newlyUnlockedIds.length > 0) {
      // Play high-fidelity, rewarding arpeggiated sparkle chime sweep using Web Audio API
      playUnlockChime();

      newlyUnlockedIds.forEach((id) => {
        const badge = badges.find((b) => b.id === id);
        if (badge) {
          // Trigger Toast!
          setToasts((prev) => [...prev, { id: `${id}-${Date.now()}`, badge }]);
          // Also trigger celebratory confetti!
          setShowConfetti(true);
        }
      });
    }

    prevUnlockedRef.current = currentUnlocked;
  }, [user, logs, streak]);

  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. LocalStorage Persistence Sync
  const syncState = (updatedUser: User, updatedLogs: LogEntry[], updatedIssues: IssueReport[], updatedStreak: Streak) => {
    localStorage.setItem('ecobeacon_user', JSON.stringify(updatedUser));
    localStorage.setItem('ecobeacon_logs', JSON.stringify(updatedLogs));
    localStorage.setItem('ecobeacon_issues', JSON.stringify(updatedIssues));
    localStorage.setItem('ecobeacon_streak', JSON.stringify(updatedStreak));
  };

  // Login handler
  const handleLoginSuccess = (newUser: User) => {
    // Check if streak exists or is new
    const initialStreak: Streak = { count: 1, lastEntry: new Date().toDateString() };
    const seededIssues = seedMockIssues(newUser.city);

    setUser(newUser);
    setStreak(initialStreak);
    setIssues(seededIssues);
    setLogs([]);

    // Initialize the prevUnlocked ref to empty first, or pre-populate
    const initialBadges = getBadgesList(newUser, [], initialStreak);
    prevUnlockedRef.current = new Set(
      initialBadges.filter(isBadgeUnlocked).map((b) => b.id)
    );

    localStorage.setItem('ecobeacon_user', JSON.stringify(newUser));
    localStorage.setItem('ecobeacon_streak', JSON.stringify(initialStreak));
    localStorage.setItem('ecobeacon_issues', JSON.stringify(seededIssues));
    localStorage.setItem('ecobeacon_logs', JSON.stringify([]));
  };

  // Streak update engine rules
  const updateStreakAndSave = (currentStreak: Streak): Streak => {
    const todayStr = new Date().toDateString();
    if (currentStreak.lastEntry === todayStr) {
      return currentStreak; // Already contribution logged today, streak stays
    }

    let newCount = currentStreak.count;
    if (currentStreak.lastEntry) {
      const lastDate = new Date(currentStreak.lastEntry);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newCount += 1; // Consecutive day, increment
      } else if (diffDays > 1) {
        newCount = 1; // Expired streak, reset
      }
    } else {
      newCount = 1; // First log
    }

    return {
      count: newCount,
      lastEntry: todayStr
    };
  };

  // Recycyling entry logger
  const handleAddLog = (newLog: LogEntry) => {
    if (!user) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      savePendingLog(newLog).then(() => {
        console.log('Log cached offline in IndexedDB:', newLog);
      });
      return;
    }

    const nextLogs = [newLog, ...logs];
    const nextStreak = updateStreakAndSave(streak);
    const nextUser: User = {
      ...user,
      points: user.points + newLog.points
    };

    setUser(nextUser);
    setLogs(nextLogs);
    setStreak(nextStreak);
    syncState(nextUser, nextLogs, issues, nextStreak);
    
    // Trigger celebratory confetti/particle overlay
    setShowConfetti(true);
  };

  // Issue reporting submission logger
  const handleAddIssue = (newIssue: IssueReport) => {
    if (!user) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      savePendingIssue(newIssue).then(() => {
        console.log('Issue cached offline in IndexedDB:', newIssue);
      });
      return;
    }

    // Award Points
    const addedPoints = POINTS_REPORT_ISSUE;
    const nextIssues = [newIssue, ...issues];
    const nextUser: User = {
      ...user,
      points: user.points + addedPoints
    };

    // Append standard log transaction
    const transLog: LogEntry = {
      id: Date.now(),
      category: `Reported: ${newIssue.category}`,
      icon: '🚨',
      weight: 0,
      points: addedPoints,
      timestamp: Date.now()
    };

    const nextLogs = [transLog, ...logs];
    const nextStreak = updateStreakAndSave(streak);

    setUser(nextUser);
    setIssues(nextIssues);
    setLogs(nextLogs);
    setStreak(nextStreak);
    syncState(nextUser, nextLogs, nextIssues, nextStreak);
  };

  // Verified upvote trigger
  const handleVerifyIssue = (issueId: number) => {
    if (!user) return;

    const target = issues.find(i => i.id === issueId);
    if (!target) return;

    // Upvote logic
    const nextIssues = issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          upvotes: issue.upvotes + 1,
          voters: [...issue.voters, user.email]
        };
      }
      return issue;
    });

    const addedPoints = POINTS_VERIFY_ISSUE;
    const nextUser: User = {
      ...user,
      points: user.points + addedPoints
    };

    // Logging trace
    const transLog: LogEntry = {
      id: Date.now() + 1,
      category: `Verified Pin: ${target.category}`,
      icon: '✓',
      weight: 0,
      points: addedPoints,
      timestamp: Date.now()
    };

    const nextLogs = [transLog, ...logs];
    const nextStreak = updateStreakAndSave(streak);

    setUser(nextUser);
    setIssues(nextIssues);
    setLogs(nextLogs);
    setStreak(nextStreak);
    syncState(nextUser, nextLogs, nextIssues, nextStreak);
  };

  // Resolve / Fix issue handler
  const handleResolveIssue = (issueId: number, resolvedImg: string) => {
    if (!user) return;

    const target = issues.find(i => i.id === issueId);
    if (!target) return;

    const nextIssues = issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: 'Resolved' as const,
          resolvedImageUrl: resolvedImg
        };
      }
      return issue;
    });

    const addedPoints = POINTS_RESOLVE_ISSUE;
    const nextUser: User = {
      ...user,
      points: user.points + addedPoints
    };

    // Logging trace
    const transLog: LogEntry = {
      id: Date.now() + 2,
      category: `Cleaned hazard: ${target.category}`,
      icon: '🌳',
      weight: 0,
      points: addedPoints,
      timestamp: Date.now()
    };

    const nextLogs = [transLog, ...logs];
    const nextStreak = updateStreakAndSave(streak);

    setUser(nextUser);
    setIssues(nextIssues);
    setLogs(nextLogs);
    setStreak(nextStreak);
    syncState(nextUser, nextLogs, nextIssues, nextStreak);

    // Trigger celebratory confetti/particle overlay
    setShowConfetti(true);
  };

  // Add Comment to Issue handler
  const handleCommentIssue = (issueId: number, text: string) => {
    if (!user) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      author: user.name,
      text: text.trim(),
      timestamp: Date.now()
    };

    const nextIssues = issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          comments: [...(issue.comments || []), newComment]
        };
      }
      return issue;
    });

    setIssues(nextIssues);
    syncState(user, logs, nextIssues, streak);
  };

  // Spend points handler
  const handleRedeemPoints = (cost: number) => {
    if (!user) return;
    const nextUser = {
      ...user,
      points: Math.max(0, user.points - cost)
    };
    setUser(nextUser);
    localStorage.setItem('ecobeacon_user', JSON.stringify(nextUser));
  };

  // Add points handler for rewards game
  const handleRewardsAddPoints = (amount: number) => {
    if (!user) return;
    const nextUser = {
      ...user,
      points: user.points + amount
    };
    setUser(nextUser);
    localStorage.setItem('ecobeacon_user', JSON.stringify(nextUser));
  };

  // Update profile
  const handleUpdateProfile = (name: string, email: string) => {
    if (!user) return;
    const nextUser = {
      ...user,
      name,
      email
    };
    setUser(nextUser);
    localStorage.setItem('ecobeacon_user', JSON.stringify(nextUser));
  };

  // Update primary city (seeds city Issues if they relocation move)
  const handleUpdateCity = (newCity: string) => {
    if (!user) return;
    const nextUser = {
      ...user,
      city: newCity
    };
    const nextIssues = seedMockIssues(newCity);

    setUser(nextUser);
    setIssues(nextIssues);
    syncState(nextUser, logs, nextIssues, streak);
  };

  // Sync offline data from IndexedDB cache
  const handleSyncOfflineData = (pendingLogs: LogEntry[], pendingIssues: IssueReport[]) => {
    if (!user) return;

    let updatedUser = { ...user };
    let updatedLogs = [...logs];
    let updatedIssues = [...issues];
    let updatedStreak = { ...streak };

    if (pendingLogs.length > 0) {
      pendingLogs.forEach(log => {
        if (!updatedLogs.some(l => l.id === log.id)) {
          updatedLogs = [log, ...updatedLogs];
          updatedUser.points += log.points;
          updatedStreak = updateStreakAndSave(updatedStreak);
        }
      });
    }

    if (pendingIssues.length > 0) {
      pendingIssues.forEach(issue => {
        if (!updatedIssues.some(i => i.id === issue.id)) {
          updatedIssues = [issue, ...updatedIssues];
          updatedUser.points += POINTS_REPORT_ISSUE;

          const transLog: LogEntry = {
            id: Date.now() + Math.random(),
            category: `Reported: ${issue.category}`,
            icon: '🚨',
            weight: 0,
            points: POINTS_REPORT_ISSUE,
            timestamp: Date.now()
          };
          updatedLogs = [transLog, ...updatedLogs];
          updatedStreak = updateStreakAndSave(updatedStreak);
        }
      });
    }

    setUser(updatedUser);
    setLogs(updatedLogs);
    setIssues(updatedIssues);
    setStreak(updatedStreak);
    syncState(updatedUser, updatedLogs, updatedIssues, updatedStreak);

    // Trigger celebratory confetti/particle overlay
    setShowConfetti(true);
  };

  // Clear data reset
  const handleClearAll = () => {
    localStorage.clear();
    setLogs([]);
    setStreak({ count: 1, lastEntry: null });
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Authentication Guard
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Active Count Calculations
  const activeIssuesCount = issues.filter(i => i.status !== 'Resolved').length;
  const resolvedIssuesCount = issues.filter(i => i.status === 'Resolved').length;

  return (
    <div className={`min-h-screen bg-gray-50/50 dark:bg-[#09090b] flex flex-col md:flex-row text-gray-900 dark:text-zinc-100 relative overflow-hidden theme-${colorTheme}`} id="main-app-container">
      
      {/* Living Organic Breathing Background Glow Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Glowing Top-Left Green Lung Blob */}
        <motion.div
          className="absolute -top-[15%] -left-[10%] w-[50%] h-[60%] rounded-full bg-gradient-to-tr from-emerald-500/8 via-teal-500/3 to-transparent blur-3xl opacity-70"
          animate={{
            scale: [1, 1.08, 0.96, 1],
            x: [0, 15, -10, 0],
            y: [0, -10, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Glowing Bottom-Right Emerald Lung Blob */}
        <motion.div
          className="absolute -bottom-[15%] -right-[10%] w-[55%] h-[65%] rounded-full bg-gradient-to-bl from-green-500/8 via-emerald-500/3 to-transparent blur-3xl opacity-60"
          animate={{
            scale: [1, 1.12, 0.92, 1],
            x: [0, -20, 15, 0],
            y: [0, 15, -10, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Slow organic core pulse in workspace background */}
        <motion.div
          className="absolute top-[25%] left-[30%] w-[450px] h-[450px] rounded-full bg-emerald-500/[0.03] dark:bg-emerald-500/[0.015] blur-3xl"
          animate={{
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.6, 0.9, 0.5, 0.6],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* SIDEBAR NAVIGATION PANEL (Desktop Only) */}
      <aside className="hidden md:flex md:w-64 bg-white/85 dark:bg-zinc-900/90 border-b md:border-b-0 md:border-r border-gray-150 dark:border-zinc-800/80 flex-col justify-between flex-shrink-0 z-20 shadow-xs backdrop-blur-md" id="main-sidebar">
        <div>
          {/* Brand header with premium gradient and display font */}
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/10">
                <Leaf className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-350 bg-clip-text text-transparent leading-none">EcoBeacon</h1>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mt-0.5 block">TrashTrek Hub</span>
              </div>
            </div>
          </div>

          {/* Nav List with high fidelity active glow and text styling */}
          <nav className="p-4 space-y-1.5">
            <motion.button
              id="tab-dashboard"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <LayoutDashboard className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'dashboard' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Dashboard Hub</span>
            </motion.button>

            <motion.button
              id="tab-report"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('report')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'report' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <PlusCircle className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'report' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Log / Report Action</span>
            </motion.button>

            <motion.button
              id="tab-map"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'map' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <MapPin className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'map' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Alert Map pins</span>
            </motion.button>

            <motion.button
              id="tab-leaderboard"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'leaderboard' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Trophy className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'leaderboard' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Leaderboard Weekly</span>
            </motion.button>

            <motion.button
              id="tab-chat"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'chat' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <MessageSquare className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'chat' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Community Chat</span>
            </motion.button>

            <motion.button
              id="tab-achievements"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('achievements')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'achievements' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Award className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'achievements' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Eco Achievements</span>
            </motion.button>

            <motion.button
              id="tab-impact"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('impact')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'impact' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <BarChart3 className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'impact' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Environmental Impact</span>
            </motion.button>

            <motion.button
              id="tab-rewards"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('rewards')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'rewards' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Gift className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'rewards' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Rewards Store</span>
            </motion.button>

            <motion.button
              id="tab-settings"
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black rounded-2xl transition-all outline-none cursor-pointer group ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs shadow-emerald-500/5' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <SettingsIcon className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${activeTab === 'settings' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
              <span>Settings & Sync</span>
            </motion.button>
          </nav>
        </div>

        {/* User Foot block */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black flex items-center justify-center text-xs shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-gray-850 dark:text-zinc-200 truncate max-w-[110px]">{user.name}</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider truncate max-w-[110px]">📍 {user.city}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER NAVIGATION MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex" id="mobile-drawer-wrapper">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu sliding panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#09090b] shadow-2xl border-r border-gray-150 dark:border-zinc-850 flex flex-col justify-between z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Leaf className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-gray-900 dark:text-zinc-100">EcoBeacon</h2>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest leading-none block mt-0.5">TrashTrek Hub</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation buttons */}
              <nav className="p-4 space-y-1.5 overflow-y-auto flex-1">
                {[
                  { id: 'dashboard', name: 'Dashboard Hub', icon: LayoutDashboard },
                  { id: 'report', name: 'Log / Report Action', icon: PlusCircle },
                  { id: 'map', name: 'Alert Map pins', icon: MapPin },
                  { id: 'leaderboard', name: 'Leaderboard Weekly', icon: Trophy },
                  { id: 'chat', name: 'Community Chat', icon: MessageSquare },
                  { id: 'achievements', name: 'Eco Achievements', icon: Award },
                  { id: 'impact', name: 'Environmental Impact', icon: BarChart3 },
                  { id: 'rewards', name: 'Rewards Store', icon: Gift },
                  { id: 'settings', name: 'Settings & Sync', icon: SettingsIcon },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setMobileMenuOpen(false); // Dismiss drawer on navigate
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 text-xs font-black rounded-xl transition-all outline-none cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Drawer User profile Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-zinc-805 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black flex items-center justify-center text-xs shadow-3xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-855 dark:text-zinc-200 truncate max-w-[130px]">{user.name}</p>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider mt-0.5">📍 {user.city}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRIMARY WORKSPACE CONTAINER */}
      <motion.main
        className="flex-1 flex flex-col overflow-y-auto relative z-10"
        id="workspace-viewport"
        animate={{
          scale: [1, 1.003, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        
        {/* Subtle animated floating background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {FLOATING_PARTICLES.map((particle) => (
            <motion.div
              key={particle.id}
              className={`absolute rounded-full blur-[1.5px] ${particle.color}`}
              style={{
                width: particle.size,
                height: particle.size,
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [0, -70, 50, 0],
                x: [0, 25, -25, 0],
                scale: [1, 1.2, 0.85, 1],
                opacity: [0.12, 0.38, 0.22, 0.12]
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* MOBILE TOP BAR STICKY HEADER */}
        <header className="md:hidden sticky top-0 bg-white/95 dark:bg-[#09090b]/95 border-b border-gray-150 dark:border-zinc-850 px-4 py-3 flex items-center justify-between z-30 backdrop-blur-md shadow-xs" id="mobile-top-bar">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shadow-emerald-500/10">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-sm font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-350 bg-clip-text text-transparent">EcoBeacon</h1>
            </div>
          </div>

          {/* Quick stats in mobile top header */}
          <div className="flex gap-1.5 items-center">
            <div className="flex items-center gap-1 bg-green-500/10 dark:bg-green-500/5 px-2 py-0.5 border border-green-500/15 rounded-lg text-[10px] font-black text-green-600 dark:text-green-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{user.points}</span>
            </div>
            <div className="flex items-center gap-1 bg-orange-500/10 dark:bg-orange-500/5 px-1.5 py-0.5 border border-orange-500/15 rounded-lg text-[10px] font-black text-orange-600 dark:text-orange-400">
              <Flame className="w-3.5 h-3.5" />
              <span>{streak.count}d</span>
            </div>
          </div>
        </header>

        {/* UPPER STATUS BAR HEADER (Desktop Only) */}
        <header className="hidden md:flex bg-white dark:bg-zinc-900 border-b border-gray-150 dark:border-zinc-800 px-6 py-4 flex-col sm:flex-row justify-between sm:items-center gap-3 z-10 shadow-xs">
          <div>
            <span className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest">TrashTrek Champion Area</span>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 uppercase">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'report' && 'Record Contribution'}
              {activeTab === 'map' && 'Interactive Map Alerts'}
              {activeTab === 'leaderboard' && 'Weekly Standings'}
              {activeTab === 'achievements' && 'Eco Achievements'}
              {activeTab === 'impact' && 'Environmental Impact Analytics'}
              {activeTab === 'chat' && 'Neighborhood Community Chat'}
              {activeTab === 'rewards' && 'Claim Green Rewards'}
              {activeTab === 'settings' && 'Profile Settings'}
            </h2>
          </div>

          {/* Quick Metrics Header block */}
          <div className="flex gap-4 items-center">
            {/* Quick Points info */}
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 px-3.5 py-1.5 border border-green-150 dark:border-green-900/60 rounded-xl" id="hdr-pts-badge">
              <Coins className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-black text-green-700 dark:text-green-350">{user.points} pts</span>
            </div>

            {/* Quick Streak info */}
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 border border-orange-150 dark:border-orange-900/60 rounded-xl" id="hdr-streak-badge">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-50 dark:fill-orange-950/10 animate-pulse" />
              <span className="text-xs font-black text-orange-700 dark:text-orange-350">{streak.count} dy</span>
            </div>
          </div>
        </header>

        {/* TAB WORKSPACE */}
        <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  user={user}
                  logs={logs}
                  streak={streak}
                  activeIssuesCount={activeIssuesCount}
                  resolvedIssuesCount={resolvedIssuesCount}
                  onNavigateToLog={() => setActiveTab('report')}
                  onNavigateToAchievements={() => setActiveTab('achievements')}
                  onRefreshStats={() => {}}
                  issues={issues}
                />
              )}

              {activeTab === 'achievements' && (
                <Achievements
                  user={user}
                  logs={logs}
                  streak={streak}
                  issues={issues}
                />
              )}

              {activeTab === 'impact' && (
                <EnvironmentalImpact
                  user={user}
                  logs={logs}
                  issues={issues}
                />
              )}

              {activeTab === 'chat' && (
                <CommunityChat
                  user={user}
                />
              )}

              {activeTab === 'report' && (
                <ReportForm
                  userCity={user.city}
                  onAddLog={handleAddLog}
                  onAddIssue={handleAddIssue}
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'map' && (
                <AlertMap
                  userCity={user.city}
                  userEmail={user.email}
                  userName={user?.name || 'Anonymous'}
                  issues={issues}
                  onVerifyIssue={handleVerifyIssue}
                  onResolveIssue={handleResolveIssue}
                  onAddComment={handleCommentIssue}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'leaderboard' && (
                <Leaderboard user={user} />
              )}

              {activeTab === 'rewards' && (
                <Rewards userPoints={user.points} onRedeemPoints={handleRedeemPoints} onAddPoints={handleRewardsAddPoints} />
              )}

              {activeTab === 'settings' && (
                <Settings
                  user={user}
                  onUpdateCity={handleUpdateCity}
                  onUpdateProfile={handleUpdateProfile}
                  onClearAll={handleClearAll}
                  onLogout={handleLogout}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  colorTheme={colorTheme}
                  onChangeColorTheme={handleUpdateColorTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Network Status Detector and Offline Syncer */}
      <NetworkStatusDetector onSyncOfflineData={handleSyncOfflineData} />

      {/* Celebratory Confetti and Particle Overlay */}
      <ConfettiOverlay active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Toast Notification for Unlocked Achievements */}
      <AchievementToast
        toasts={toasts}
        onRemove={handleRemoveToast}
        onViewAchievements={() => setActiveTab('achievements')}
      />
    </div>
  );
}
