/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudLightning, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPendingLogs, getPendingIssues, clearPendingLogs, clearPendingIssues } from '../utils/indexedDB';
import { LogEntry, IssueReport } from '../types';

interface NetworkStatusDetectorProps {
  onSyncOfflineData: (pendingLogs: LogEntry[], pendingIssues: IssueReport[]) => void;
}

export default function NetworkStatusDetector({ onSyncOfflineData }: NetworkStatusDetectorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showStatusToast, setShowStatusToast] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  // Load and count pending items from IndexedDB
  const refreshPendingCount = async () => {
    try {
      const logs = await getPendingLogs();
      const issues = await getPendingIssues();
      setPendingCount(logs.length + issues.length);
    } catch (e) {
      console.error('Error counting pending reports:', e);
    }
  };

  useEffect(() => {
    refreshPendingCount();

    // Set interval to periodically poll IndexedDB in case of background updates
    const pollInterval = setInterval(refreshPendingCount, 3000);

    const handleOnline = async () => {
      setIsOnline(true);
      setShowStatusToast(true);
      setSyncing(true);

      // Fetch pending offline cached items
      try {
        const logs = await getPendingLogs();
        const issues = await getPendingIssues();
        const total = logs.length + issues.length;

        if (total > 0) {
          // Send to parent state manager for merging
          onSyncOfflineData(logs, issues);
          
          // Clear IndexedDB
          await clearPendingLogs();
          await clearPendingIssues();
          
          setPendingCount(0);
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 6000);
        }
      } catch (err) {
        console.error('Error synchronizing IndexedDB cached items:', err);
      } finally {
        setSyncing(false);
        // Hide online toast after short delay
        setTimeout(() => setShowStatusToast(false), 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatusToast(true);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSyncOfflineData]);

  return (
    <div id="network-detector-toaster">
      <AnimatePresence>
        {/* Toast Notification */}
        {showStatusToast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            className={`fixed bottom-6 left-6 z-[99999] max-w-[340px] w-[calc(100vw-48px)] rounded-2xl shadow-xl overflow-hidden border p-4 flex flex-col gap-2.5 transition-all ${
              isOnline
                ? 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
                : 'bg-zinc-900/95 dark:bg-zinc-950/95 border-amber-500/40 dark:border-amber-600/30 text-white'
            }`}
            id="network-status-toast-notification"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-base shadow-xs ${
                  isOnline 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-amber-500 text-black'
                }`}>
                  {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">
                    Network Quality Monitor
                  </h4>
                  <h5 className="text-xs font-black">
                    {isOnline ? 'Internet connection restored' : 'You are currently offline'}
                  </h5>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStatusToast(false)}
                className="opacity-60 hover:opacity-100 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-[10px] font-bold leading-relaxed opacity-90">
              {isOnline
                ? syncing
                  ? 'Re-establishing neighborhood telemetry and uploading cached reports...'
                  : 'Your live environmental connection is fully functional. Feel free to report issues.'
                : 'EcoBeacon is running in offline mode. Any new recycling material logs or community issue reports will be securely cached in your browser’s IndexedDB sandbox and auto-submitted when you connect back.'}
            </p>

            {/* Action/Count Indicator */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                <span>
                  {pendingCount} report{pendingCount !== 1 ? 's' : ''} cached locally waiting to sync
                </span>
              </div>
            )}

            {justSynced && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>All local reports synchronized successfully!</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Mini Status indicator when offline */}
      {!isOnline && (
        <div 
          className="fixed bottom-6 left-6 z-[99998] px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-full shadow-lg flex items-center gap-2 text-xs cursor-pointer select-none border border-amber-600 transition-transform active:scale-95"
          onClick={() => setShowStatusToast(true)}
          id="offline-floating-badge"
          title="Click to view network details"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline Mode</span>
          {pendingCount > 0 && (
            <span className="bg-black text-white text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
