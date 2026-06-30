/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Leaf, User, ShieldAlert, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType } from '../types';

interface AuthProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Mumbai');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const user: UserType = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      city,
      points: 0,
    };
    onLoginSuccess(user);
  };

  const setDemoPreset = () => {
    setName('Arjun Mehta');
    setEmail('arjun@ecobeacon.org');
    setCity('Mumbai');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] relative overflow-hidden" id="auth-container">
      {/* Decorative neon light spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800/80 shadow-2xl rounded-3xl overflow-hidden p-8 relative backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-400 mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <Leaf className="w-8 h-8 animate-pulse text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent" id="auth-title">EcoBeacon</h1>
          <p className="text-xs text-zinc-400 mt-2 font-medium">TrashTrek — Clean your community, report issues, and earn rewards with neighbors.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Username / Nickname</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User className="w-5 h-5" />
              </span>
              <input
                id="username-input"
                type="text"
                required
                placeholder="e.g. Arjun Mehta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800/80 focus:border-emerald-500/80 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/30 text-zinc-200 placeholder-zinc-600 rounded-2xl transition-all outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <input
                id="email-input"
                type="email"
                required
                placeholder="e.g. arjun@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800/80 focus:border-emerald-500/80 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/30 text-zinc-200 placeholder-zinc-600 rounded-2xl transition-all outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Select Your Location (City)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Globe className="w-5 h-5" />
              </span>
              <select
                id="city-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800/80 focus:border-emerald-500/80 focus:bg-zinc-950 focus:ring-1 focus:ring-emerald-500/30 text-zinc-200 rounded-2xl transition-all outline-none appearance-none text-sm font-semibold cursor-pointer"
              >
                <option value="Mumbai" className="bg-zinc-900 text-zinc-200">Mumbai</option>
                <option value="Delhi" className="bg-zinc-900 text-zinc-200">Delhi</option>
                <option value="Bangalore" className="bg-zinc-900 text-zinc-200">Bangalore</option>
                <option value="Hyderabad" className="bg-zinc-900 text-zinc-200">Hyderabad</option>
                <option value="Chennai" className="bg-zinc-900 text-zinc-200">Chennai</option>
                <option value="Pune" className="bg-zinc-900 text-zinc-200">Pune</option>
                <option value="Kolkata" className="bg-zinc-900 text-zinc-200">Kolkata</option>
                <option value="Ahmedabad" className="bg-zinc-900 text-zinc-200">Ahmedabad</option>
              </select>
            </div>
          </div>

          <motion.button
            id="register-btn"
            type="submit"
            whileTap={{ scale: 0.96 }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all cursor-pointer outline-none"
          >
            Create Account & Join Trek
          </motion.button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/80"></div>
          </div>
          <span className="relative bg-zinc-900 px-3 text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">DEMO UTILITIES</span>
        </div>

        <motion.button
          id="demo-preset-btn"
          whileTap={{ scale: 0.96 }}
          onClick={setDemoPreset}
          className="w-full py-3.5 bg-zinc-950/40 border border-dashed border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-xs text-zinc-400 hover:text-emerald-400 font-bold rounded-2xl transition-all cursor-pointer outline-none"
        >
          ⚡ Use Demo Preset (Arjun Mehta, Mumbai)
        </motion.button>
      </div>
    </div>
  );
}
