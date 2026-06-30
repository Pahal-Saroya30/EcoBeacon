/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy, Medal, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface LeaderboardProps {
  user: User;
}

export default function Leaderboard({ user }: LeaderboardProps) {
  // Combine our active user with other mock residents for an in-neighborhood community narrative
  const mockResidents = [
    { name: 'Sneha Patil', points: 2850, city: 'Mumbai', level: 'Eco Ranger', medal: '🥇' },
    { name: 'Rohan Verma', points: 1940, city: 'New Delhi', level: 'Eco Ranger', medal: '🥈' },
    { name: 'Ananya Iyer', points: 1420, city: 'Mumbai', level: 'Green Scout', medal: '🥉' },
    { name: 'Siddharth Roy', points: 980, city: 'Bangalore', level: 'Green Scout', medal: '' },
    { name: 'Priya Sharma', points: 640, city: 'Hyderabad', level: 'Green Scout', medal: '' },
    { name: 'Kabir Das', points: 420, city: 'Pune', level: 'Waste Warrior', medal: '' }
  ];

  // Insert our active user and sort
  const activeHero = {
    name: user.name + ' (You)',
    points: user.points,
    city: user.city,
    level: user.points >= 15000 ? 'Eco Master' : user.points >= 7000 ? 'Eco Champion' : user.points >= 3500 ? 'Planet Guardian' : user.points >= 1500 ? 'Eco Ranger' : user.points >= 500 ? 'Green Scout' : 'Waste Warrior',
    medal: ''
  };

  const fullList = [...mockResidents, activeHero].sort((a, b) => b.points - a.points);
  
  // Assign medals dynamically to top 3
  const rankedList = fullList.map((hero, idx) => ({
    ...hero,
    rank: idx + 1,
    medal: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
  }));

  const podium = rankedList.slice(0, 3);
  const rest = rankedList.slice(3);

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="leaderboard-tab">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Neighborhood Leaderboard 🏆</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Top weekly recyclers and community clean-up leaders.</p>
      </div>

      {/* Podium Cards */}
      <div className="grid grid-cols-3 gap-4 items-end pb-4 pt-10 px-2">
        {/* SECOND PLACE */}
        {podium[1] && (
          <motion.div
            whileHover={{ y: -6, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)" }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="flex flex-col items-center bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 text-center relative cursor-pointer shadow-sm"
          >
            <div className="absolute -top-7 text-2xl">🥈</div>
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 flex items-center justify-center font-bold text-gray-700 dark:text-zinc-300 text-sm mb-2 shadow">
              {podium[1].name.charAt(0)}
            </div>
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200 line-clamp-1">{podium[1].name}</h4>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase">{podium[1].level}</p>
            <div className="mt-2 text-xs font-black text-slate-700 dark:text-zinc-300">{podium[1].points} pts</div>
          </motion.div>
        )}

        {/* FIRST PLACE */}
        {podium[0] && (
          <motion.div
            whileHover={{ y: -10, scale: 1.04, boxShadow: "0 20px 30px -10px rgba(245, 158, 11, 0.25)" }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
            className="flex flex-col items-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 text-center relative z-10 shadow-md cursor-pointer"
          >
            <div className="absolute -top-11 text-4xl animate-bounce">👑</div>
            <div className="w-16 h-16 rounded-full bg-amber-200 dark:bg-amber-950 border-4 border-white dark:border-zinc-800 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-lg mb-2 shadow-lg">
              {podium[0].name.charAt(0)}
            </div>
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-100 line-clamp-1">{podium[0].name}</h4>
            <p className="text-[10px] text-amber-600 dark:text-amber-450 font-bold uppercase tracking-wider">{podium[0].level}</p>
            <div className="mt-3 text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-300 dark:fill-amber-950" /> {podium[0].points} pts
            </div>
          </motion.div>
        )}

        {/* THIRD PLACE */}
        {podium[2] && (
          <motion.div
            whileHover={{ y: -6, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)" }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="flex flex-col items-center bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 text-center relative cursor-pointer shadow-sm"
          >
            <div className="absolute -top-7 text-2xl">🥉</div>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 border-2 border-white dark:border-zinc-700 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-sm mb-2 shadow">
              {podium[2].name.charAt(0)}
            </div>
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-200 line-clamp-1">{podium[2].name}</h4>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase">{podium[2].level}</p>
            <div className="mt-2 text-xs font-black text-yellow-800 dark:text-yellow-500">{podium[2].points} pts</div>
          </motion.div>
        )}
      </div>

      {/* Rest of the List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm divide-y divide-gray-50 dark:divide-zinc-800/60 overflow-hidden">
        {rest.map((member) => {
          const isCurrentUser = member.name.includes('(You)');
          return (
            <motion.div
              layout
              key={member.name}
              whileHover={{ x: 8, scale: 1.008, boxShadow: "0 4px 15px -3px rgba(0,0,0,0.04)" }}
              transition={{
                layout: { type: "spring", stiffness: 220, damping: 28 },
                default: { type: "spring", stiffness: 350, damping: 22 }
              }}
              className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                isCurrentUser 
                  ? 'bg-green-50/25 dark:bg-green-950/15 hover:bg-green-50/40 dark:hover:bg-green-950/25 font-bold border-l-4 border-green-500' 
                  : 'hover:bg-gray-50/60 dark:hover:bg-zinc-850/40 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-black text-gray-400 dark:text-zinc-500">
                  #{member.rank}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isCurrentUser 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-zinc-200">{member.name}</h4>
                  <p className="text-[10px] text-gray-450 dark:text-zinc-500 uppercase tracking-widest">{member.level} • {member.city}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm font-black text-green-600 dark:text-green-450">
                <Star className="w-3.5 h-3.5 fill-green-50 dark:fill-green-950/20 animate-pulse text-green-500" />
                <span>{member.points} pts</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
