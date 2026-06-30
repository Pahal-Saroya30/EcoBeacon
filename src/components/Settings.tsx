/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, LogOut, RefreshCw, Smartphone, HelpCircle, Cloud, Check, Database, Wifi, Terminal, Volume2, VolumeX, Wind, CloudRain, Trees } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { soundscape } from '../utils/audio';

interface SettingsProps {
  user: User;
  onUpdateCity: (newCity: string) => void;
  onUpdateProfile: (name: string, email: string) => void;
  onClearAll: () => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  colorTheme: 'emerald' | 'cyberpunk' | 'sunset' | 'ocean';
  onChangeColorTheme: (theme: 'emerald' | 'cyberpunk' | 'sunset' | 'ocean') => void;
}

export default function Settings({
  user,
  onUpdateCity,
  onUpdateProfile,
  onClearAll,
  onLogout,
  darkMode,
  onToggleDarkMode,
  colorTheme,
  onChangeColorTheme
}: SettingsProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [city, setCity] = useState(user.city);
  const [successMsg, setSuccessMsg] = useState('');

  const [isPlayingSound, setIsPlayingSound] = useState(soundscape.isSoundscapeActive());
  const [activeSound, setActiveSound] = useState<'forest' | 'rain' | 'birds'>(soundscape.getActiveSound());
  const [soundVolume, setSoundVolume] = useState(soundscape.getVolume());

  const handleToggleSound = () => {
    if (isPlayingSound) {
      soundscape.stopAll();
      setIsPlayingSound(false);
    } else {
      soundscape.start(activeSound);
      setIsPlayingSound(true);
    }
  };

  const handleChangeSoundType = (type: 'forest' | 'rain' | 'birds') => {
    setActiveSound(type);
    if (isPlayingSound) {
      soundscape.start(type);
    }
  };

  const handleSoundVolumeChange = (newVol: number) => {
    setSoundVolume(newVol);
    soundscape.setVolume(newVol);
  };

  const [showProTips, setShowProTips] = useState(localStorage.getItem('ecobeacon_hide_protip') !== 'true');

  useEffect(() => {
    const handleStatusChange = () => {
      setShowProTips(localStorage.getItem('ecobeacon_hide_protip') !== 'true');
    };
    window.addEventListener('ecobeacon_protip_status_changed', handleStatusChange);
    return () => window.removeEventListener('ecobeacon_protip_status_changed', handleStatusChange);
  }, []);

  const handleToggleProTips = () => {
    const nextVal = !showProTips;
    setShowProTips(nextVal);
    if (nextVal) {
      localStorage.removeItem('ecobeacon_hide_protip');
    } else {
      localStorage.setItem('ecobeacon_hide_protip', 'true');
    }
    window.dispatchEvent(new Event('ecobeacon_protip_status_changed'));
  };

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [lastSynced, setLastSynced] = useState<string>(() => {
    return localStorage.getItem('ecobeacon_last_sync_time') || 'Never synced';
  });

  const handleManualSync = () => {
    if (syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setProgress(5);
    setSyncLogs([]);

    const logsCount = JSON.parse(localStorage.getItem('ecobeacon_logs') || '[]').length;
    const issuesCount = JSON.parse(localStorage.getItem('ecobeacon_issues') || '[]').length;

    const steps = [
      { msg: '🌐 [CONNECT] Initiating secure TLS 1.3 handshake with remote cloud ledger...', delay: 0, progress: 15 },
      { msg: `📥 [QUERY] Fetching remote transaction logs for user "${user.email}"...`, delay: 600, progress: 35 },
      { msg: `📂 [SCAN] Analyzing local sandbox storage: Found ${logsCount} logged contributions & ${issuesCount} map markers.`, delay: 1300, progress: 55 },
      { msg: `📤 [PUSH] Sending delta changes to secure cloud database (Points balance: ${user.points} pts)...`, delay: 2000, progress: 75 },
      { msg: '⚖️ [RECONCILE] Resolving logical conflict vectors and checking schemas...', delay: 2700, progress: 90 },
      { msg: '💾 [SAVE] Updating local confirmation tokens and cache registry keys...', delay: 3300, progress: 100 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setSyncLogs((prev) => [...prev, step.msg]);
        setProgress(step.progress);
      }, step.delay);
    });

    setTimeout(() => {
      setSyncStatus('completed');
      const now = new Date();
      const timeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('ecobeacon_last_sync_time', timeString);
      setLastSynced(timeString);
      setSyncLogs((prev) => [...prev, '✓ SUCCESS: 100% remote registry parity achieved. Connection safely closed.']);
    }, 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onUpdateProfile(name.trim(), email.trim().toLowerCase());
    onUpdateCity(city);
    setSuccessMsg('Profile settings synced successfully ✓');
    
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto" id="settings-tab">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">App Settings ⚙️</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Configure profile details, manage location coordinates, and reset your local sandbox storage data.</p>
      </div>

      {/* App Preferences (Theme & Eco Tips) */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-zinc-850">
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <span>🌒 App Theme Preferences</span>
            </h3>
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">Toggle Dark Mode Scheme</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold leading-normal mt-0.5">Adjust the color interface of the entire EcoBeacon workspace.</p>
          </div>
          <motion.button
            id="theme-toggle-btn"
            whileTap={{ scale: 0.96 }}
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-750 transition-all cursor-pointer shadow-sm outline-none"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </motion.button>
        </div>

        {/* Dynamic Color Theme Selector */}
        <div className="py-3.5 border-b border-gray-100 dark:border-zinc-850 space-y-3">
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨 Active Color Accent Theme</span>
            </h3>
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">Select Custom Accent Color</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold leading-normal mt-0.5">Choose a stylish personality style for buttons, stats, charts, and maps.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {[
              { id: 'emerald', name: 'Emerald Forest', bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-500' },
              { id: 'cyberpunk', name: 'Cyberpunk Oasis', bg: 'from-fuchsia-500 to-cyan-400', text: 'text-fuchsia-500' },
              { id: 'sunset', name: 'Sunset Warmth', bg: 'from-orange-500 to-rose-500', text: 'text-orange-500' },
              { id: 'ocean', name: 'Ocean Breeze', bg: 'from-blue-500 to-indigo-500', text: 'text-blue-500' }
            ].map((theme) => {
              const isActive = colorTheme === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onChangeColorTheme(theme.id as any)}
                  className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-3xs outline-none select-none ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/3 font-extrabold ring-1 ring-emerald-500/30'
                      : 'border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Color dots preview */}
                  <div className="flex gap-1">
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.bg} shadow-sm`} />
                  </div>
                  
                  <div>
                    <span className="text-[11px] font-bold block leading-none text-gray-800 dark:text-zinc-200">
                      {theme.name}
                    </span>
                    {isActive && (
                      <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-wider block mt-1">
                        Active ✓
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <span>💡 Floating Eco Pro Tips</span>
            </h3>
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">Show Eco Tips Toaster</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold leading-normal mt-0.5">Toggle the automatic bottom-right floating helper facts popup.</p>
          </div>
          <motion.button
            id="protip-toggle-btn"
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleToggleProTips}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-sm outline-none select-none ${
              showProTips
                ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-750'
            }`}
          >
            {showProTips ? 'Enabled' : 'Disabled'}
          </motion.button>
        </div>
      </div>

      {/* Nature Soundscape Background Audio Feature */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4" id="nature-soundscape-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 animate-pulse" />
              <span>Nature Ambient Soundscape</span>
            </h3>
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">Background Audio Environment</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold leading-normal mt-0.5">
              Play soft, relaxing synthesized natural sounds to create an immersive focus atmosphere.
            </p>
          </div>
          
          <motion.button
            id="soundscape-toggle-btn"
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm outline-none border select-none ${
              isPlayingSound
                ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 hover:border-emerald-800 text-white'
                : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-755'
            }`}
          >
            {isPlayingSound ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Sound Off</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Ambient Settings Controls */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Sound preset selectors */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider block">
              Sound Preset Type
            </span>
            <div className="flex gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChangeSoundType('forest')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSound === 'forest'
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'bg-white/40 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Forest Breeze</span>
              </motion.button>
              
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChangeSoundType('rain')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSound === 'rain'
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'bg-white/40 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Summer Rain</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleChangeSoundType('birds')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSound === 'birds'
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'bg-white/40 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400'
                }`}
              >
                <span>🐦 Birds</span>
              </motion.button>
            </div>
          </div>

          {/* Volume input slider */}
          <div className="space-y-1.5 bg-gray-50/50 dark:bg-zinc-950/25 p-3 rounded-xl border border-gray-150/70 dark:border-zinc-850">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 dark:text-zinc-550 uppercase tracking-wider">
                Soundscape Volume
              </span>
              <span className="text-[10.5px] font-mono font-bold text-gray-700 dark:text-zinc-300">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              {soundVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-gray-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              )}
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={soundVolume}
                onChange={(e) => handleSoundVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Account Reconciliation & Cloud Sync Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4" id="manual-sync-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-green-500" />
              <span>Cloud Synchronization & Reconciliation Ledger</span>
            </h3>
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">Force Push/Pull Reconciliation</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold leading-normal">
              Audit your local contribution history, points balance, and active map pins against our secure simulated server-side storage registry to ensure 100% database parity.
            </p>
          </div>
          
          <motion.button
            id="sync-now-trigger-btn"
            whileTap={syncStatus === 'syncing' ? {} : { scale: 0.96 }}
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer shadow-xs outline-none select-none ${
              syncStatus === 'syncing'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white border-green-700 hover:border-green-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
          </motion.button>
        </div>

        {/* Sync Progress Bar */}
        {syncStatus === 'syncing' && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-green-500 animate-pulse" /> Reconciling ledger delta logs...
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Terminal/Console Log Output for Sync Handshake */}
        {(syncLogs.length > 0) && (
          <div className="bg-zinc-950 text-[10.5px] font-mono p-4 rounded-xl text-emerald-400 border border-zinc-850 dark:border-zinc-800 space-y-1.5 max-h-48 overflow-y-auto shadow-inner select-all leading-normal" id="sync-terminal-output">
            <div className="flex items-center justify-between border-b border-zinc-850 dark:border-zinc-800 pb-1.5 mb-1 text-gray-500">
              <span className="flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                <Terminal className="w-3 h-3 text-zinc-500" /> Sync Console Output
              </span>
              <span className="text-[8px] font-bold text-zinc-650">TLS 1.3 SECURE SESSION</span>
            </div>
            {syncLogs.map((log, idx) => (
              <div key={idx} className="animate-fade-in flex items-start gap-1">
                <span className="text-zinc-650 select-none">&gt;</span>
                <span className={log.startsWith('✓') ? 'text-green-400 font-bold' : ''}>{log}</span>
              </div>
            ))}
          </div>
        )}

        {/* Last Sync Timestamp Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-gray-400 dark:text-zinc-550 border-t border-gray-50 dark:border-zinc-850 pt-3">
          <span className="font-semibold">Local Storage Reconciliation Strategy: Strict LIFO Conflict Resolution</span>
          <span className="font-black text-gray-500 dark:text-zinc-400">
            Last Reconciled: <span className="text-green-600 dark:text-green-400 uppercase tracking-wider">{lastSynced}</span>
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {successMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/60 text-xs text-green-800 dark:text-green-300 font-extrabold rounded-xl text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">User name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 rounded-xl focus:ring-1 focus:ring-green-500 outline-none text-gray-850 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 rounded-xl focus:ring-1 focus:ring-green-500 outline-none text-gray-850 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Primary Location City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 rounded-xl focus:ring-1 focus:ring-green-500 outline-none text-gray-850 dark:text-zinc-200"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Ahmedabad">Ahmedabad</option>
            </select>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer outline-none"
          >
            Save Configuration Changes
          </motion.button>
        </form>

        {/* Info Box */}
        <div className="border border-indigo-50 dark:border-indigo-950/40 bg-indigo-50/15 dark:bg-indigo-950/10 p-4 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> How does EcoBeacon work?
          </h4>
          <p className="text-[11px] text-gray-650 dark:text-zinc-300 leading-relaxed font-semibold">
            EcoBeacon provides real-time community assistance for neighborhood clean-up drives. Users register Sorted recycling logs or raise Alert map markers specifying deep pothole pits or waste piles. The application utilizes Gemini Vision AI models server-side to inspect the reported hazard, verify category alignment, assess the visual extent of the issue, and recommend actionable remediation steps!
          </p>
        </div>

        {/* Safety Reset Blocks */}
        <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 space-y-3">
          <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div>
              <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200">Clear Storage Cache</h4>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500">Remove local logs, streak details, and points balance settings.</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (confirm('Are you absolutely sure you want to completely erase your EcoBeacon tracking history? This is irreversible.')) {
                  onClearAll();
                }
              }}
              className="px-3 py-1.5 border border-red-250 text-red-650 dark:text-red-400 dark:border-red-950 text-[10px] font-extrabold hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-400 rounded-lg transition-all cursor-pointer outline-none"
            >
              Reset Session Data
            </motion.button>
          </div>

          <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div>
              <h4 className="text-xs font-bold text-gray-800 dark:text-zinc-200">Switch / Log Out</h4>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500">Safely log out of the current profile session room.</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onLogout}
              className="px-3 py-1.5 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer outline-none"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
}
