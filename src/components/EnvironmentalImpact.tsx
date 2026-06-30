/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Leaf, 
  Trash2, 
  Droplet, 
  Zap, 
  Sparkles, 
  Globe, 
  Building2, 
  Users, 
  ShieldAlert, 
  Calendar,
  CheckCircle,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { User, LogEntry, IssueReport } from '../types';
import { getCategoryEmoji } from '../utils';

interface EnvironmentalImpactProps {
  user: User;
  logs: LogEntry[];
  issues: IssueReport[];
}

// Factor constants for waste-to-impact calculations
const IMPACT_FACTORS = {
  // 1 kg recycled waste translates to:
  co2: 2.85, // kg CO2 prevented
  water: 15.4, // Liters of water saved
  energy: 5.6, // kWh of energy saved
  landfillVolume: 0.0024, // m³ of landfill space saved
};

export default function EnvironmentalImpact({ user, logs, issues }: EnvironmentalImpactProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [chartType, setChartType] = useState<'personal' | 'community' | 'composition'>('personal');
  const [estimateWeeks, setEstimateWeeks] = useState<number>(12);
  const [estimateWeeklyWeight, setEstimateWeeklyWeight] = useState<number>(5.5);

  // Filter logs based on date range
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return logs.filter(log => {
      if (log.weight <= 0) return false; // Only count recycling logs
      const diffDays = (now - log.timestamp) / dayMs;
      if (timeRange === '7d') return diffDays <= 7;
      if (timeRange === '30d') return diffDays <= 30;
      return true;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, timeRange]);

  // Overall calculations (Personal)
  const totalWeight = useMemo(() => {
    return logs
      .filter(l => l.weight > 0)
      .reduce((sum, log) => sum + log.weight, 0);
  }, [logs]);

  const personalMetrics = useMemo(() => {
    return {
      co2: totalWeight * IMPACT_FACTORS.co2,
      water: totalWeight * IMPACT_FACTORS.water,
      energy: totalWeight * IMPACT_FACTORS.energy,
      landfill: totalWeight * IMPACT_FACTORS.landfillVolume,
    };
  }, [totalWeight]);

  // Community Calculations (City specific)
  const cityIssues = useMemo(() => {
    return issues;
  }, [issues]);

  const activeIssuesCount = useMemo(() => {
    return cityIssues.filter(i => i.status !== 'Resolved').length;
  }, [cityIssues]);

  const resolvedIssuesCount = useMemo(() => {
    return cityIssues.filter(i => i.status === 'Resolved').length;
  }, [cityIssues]);

  const verifiedIssuesCount = useMemo(() => {
    return cityIssues.filter(i => i.status === 'Verified').length;
  }, [cityIssues]);

  const totalCommunityIssues = cityIssues.length;

  const cleanlinessScore = useMemo(() => {
    if (totalCommunityIssues === 0) return 100;
    const resolvedWeight = resolvedIssuesCount * 1.0;
    const verifiedWeight = verifiedIssuesCount * 0.5;
    const rawScore = ((resolvedWeight + verifiedWeight) / totalCommunityIssues) * 100;
    return Math.min(100, Math.max(30, Math.round(rawScore)));
  }, [totalCommunityIssues, resolvedIssuesCount, verifiedIssuesCount]);

  // Personal Cumulative Timeline Data
  const personalTimelineData = useMemo(() => {
    if (filteredLogs.length === 0) {
      return [
        { name: 'No Data', 'Waste Diverted (kg)': 0, 'CO₂ Prevented (kg)': 0 }
      ];
    }

    let runningWeight = 0;
    const dataMap: Record<string, { weight: number; co2: number }> = {};

    filteredLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      runningWeight += log.weight;
      dataMap[dateStr] = {
        weight: Number(runningWeight.toFixed(2)),
        co2: Number((runningWeight * IMPACT_FACTORS.co2).toFixed(2))
      };
    });

    return Object.entries(dataMap).map(([key, value]) => ({
      name: key,
      'Waste Diverted (kg)': value.weight,
      'CO₂ Prevented (kg)': value.co2
    }));
  }, [filteredLogs]);

  // Materials breakdown composition
  const materialsComposition = useMemo(() => {
    const counts: Record<string, number> = {
      'Plastic': 0,
      'Paper': 0,
      'Organic': 0,
      'Metal': 0,
      'Glass': 0,
      'E-Waste': 0,
    };

    logs.forEach(log => {
      if (log.weight > 0 && counts[log.category] !== undefined) {
        counts[log.category] += log.weight;
      }
    });

    const colorsMap: Record<string, string> = {
      'Plastic': '#3b82f6', // blue
      'Paper': '#a855f7', // purple
      'Organic': '#10b981', // green
      'Metal': '#f59e0b', // amber
      'Glass': '#06b6d4', // cyan
      'E-Waste': '#ef4444', // red
    };

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(1)),
        color: colorsMap[name] || '#6b7280'
      }))
      .filter(item => item.value > 0);
  }, [logs]);

  // Local Issues breakdown for charting
  const communityCategoryData = useMemo(() => {
    const categories: Record<string, { Reported: number; Verified: number; Resolved: number }> = {};
    
    cityIssues.forEach(issue => {
      const cat = issue.category;
      if (!categories[cat]) {
        categories[cat] = { Reported: 0, Verified: 0, Resolved: 0 };
      }
      categories[cat][issue.status]++;
    });

    return Object.entries(categories).map(([name, stats]) => ({
      name,
      'Reported': stats.Reported,
      'Verified': stats.Verified,
      'Resolved': stats.Resolved,
    }));
  }, [cityIssues]);

  // Projection values
  const projectedWeight = estimateWeeks * estimateWeeklyWeight;
  const projectedCo2 = projectedWeight * IMPACT_FACTORS.co2;
  const projectedWater = projectedWeight * IMPACT_FACTORS.water;
  const projectedEnergy = projectedWeight * IMPACT_FACTORS.energy;

  return (
    <div className="space-y-6" id="environmental-impact-tab-root">
      
      {/* Dynamic Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="impact-statistics-grid">
        
        {/* Landfill card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-450 flex items-center justify-center shrink-0 border border-green-100 dark:border-green-900/30">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              Diverted Waste
            </span>
            <p className="text-2xl font-black tracking-tight text-gray-950 dark:text-zinc-50 mt-0.5">
              {totalWeight.toFixed(1)} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">kg</span>
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Saved from landfill dumps
            </p>
          </div>
        </div>

        {/* CO2 Emissions card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/30">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              CO₂ Offset
            </span>
            <p className="text-2xl font-black tracking-tight text-gray-950 dark:text-zinc-50 mt-0.5">
              {personalMetrics.co2.toFixed(1)} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">kg</span>
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1 font-medium">
              Equivalent to planting {Math.max(1, Math.round(personalMetrics.co2 / 21))} saplings
            </p>
          </div>
        </div>

        {/* Water Conserved card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              Water Conserved
            </span>
            <p className="text-2xl font-black tracking-tight text-gray-950 dark:text-zinc-50 mt-0.5">
              {Math.round(personalMetrics.water)} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">Liters</span>
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1 font-medium">
              Preserved in industry manufacturing
            </p>
          </div>
        </div>

        {/* Energy Saved card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-450 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              Energy Saved
            </span>
            <p className="text-2xl font-black tracking-tight text-gray-950 dark:text-zinc-50 mt-0.5">
              {personalMetrics.energy.toFixed(1)} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">kWh</span>
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1 font-medium">
              Powers a typical LED bulb for {Math.round(personalMetrics.energy * 100)} hours
            </p>
          </div>
        </div>

      </div>

      {/* Main Analytics Section: Chart and Local Community stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-impact-analytics-workspace">
        
        {/* Graph Controller / Viewer Card (8 columns wide on desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col gap-5" id="interactive-chart-viewport-card">
          
          {/* Header row with chart switches and filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-4">
            <div>
              <h3 className="text-sm font-black text-gray-950 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-450" />
                Environmental Impact Charts
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                {chartType === 'personal' && 'Cumulative personal recycling volume'}
                {chartType === 'community' && `Neighborhood hazards logged in ${user.city}`}
                {chartType === 'composition' && 'Log weight breakdown by recycle category'}
              </p>
            </div>

            {/* Controls panel */}
            <div className="flex flex-wrap items-center gap-2" id="charts-config-buttons">
              {/* Chart Selector */}
              <div className="flex bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl border border-gray-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setChartType('personal')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${chartType === 'personal' ? 'bg-white dark:bg-zinc-900 text-green-700 dark:text-green-400 shadow-xs' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'}`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('community')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${chartType === 'community' ? 'bg-white dark:bg-zinc-900 text-green-700 dark:text-green-400 shadow-xs' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'}`}
                >
                  Local Hazards
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('composition')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${chartType === 'composition' ? 'bg-white dark:bg-zinc-900 text-green-700 dark:text-green-400 shadow-xs' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'}`}
                >
                  Composition
                </button>
              </div>

              {/* Date Filter (only relevant for personal logs timeline) */}
              {chartType === 'personal' && (
                <div className="flex bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl border border-gray-150 dark:border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setTimeRange('7d')}
                    className={`px-2 py-1 text-[9px] font-extrabold rounded-md transition-all cursor-pointer ${timeRange === '7d' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-xxs' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange('30d')}
                    className={`px-2 py-1 text-[9px] font-extrabold rounded-md transition-all cursor-pointer ${timeRange === '30d' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-xxs' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange('all')}
                    className={`px-2 py-1 text-[9px] font-extrabold rounded-md transition-all cursor-pointer ${timeRange === 'all' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-xxs' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    All-Time
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chart Wrapper Container */}
          <div className="h-72 w-full flex items-center justify-center relative" id="recharts-visualizer-outer">
            {chartType === 'personal' && (
              personalTimelineData.length <= 1 && personalTimelineData[0].name === 'No Data' ? (
                <div className="text-center p-6 space-y-3">
                  <span className="text-3xl select-none">🍃</span>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">No Recycling Actions Logged Yet</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Head over to the <strong className="text-green-600 dark:text-green-450">Log/Report</strong> page to record your first materials sorted to start tracking your reduction of carbon footprints over time.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={personalTimelineData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPersonalWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorPersonalCO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" className="hidden dark:block" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        border: '1px solid #e4e4e7',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#18181b',
                      }}
                      labelStyle={{ color: '#71717a', fontSize: '9px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Waste Diverted (kg)" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorPersonalWeight)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="CO₂ Prevented (kg)" 
                      stroke="#0ea5e9" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#colorPersonalCO2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            )}

            {chartType === 'community' && (
              communityCategoryData.length === 0 ? (
                <div className="text-center p-6 space-y-3">
                  <span className="text-3xl select-none">🗺️</span>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">No Local Community Hazards Yet</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Check back after citizens report environmental issues or open hazardous bins in your city to populate live neighborhood analytics.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={communityCategoryData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" className="hidden dark:block" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 8, fontWeight: 700, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        border: '1px solid #e4e4e7',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#18181b',
                      }}
                      labelStyle={{ color: '#71717a', fontSize: '9px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar dataKey="Reported" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Verified" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Resolved" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}

            {chartType === 'composition' && (
              materialsComposition.length === 0 ? (
                <div className="text-center p-6 space-y-3">
                  <span className="text-3xl select-none">📊</span>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Composition Chart Empty</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Once you record logs for materials like plastic, metal, organic compost, or paper, this composition wheel will auto-update.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-around w-full gap-4">
                  <div className="w-52 h-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={materialsComposition}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {materialsComposition.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.96)',
                            border: '1px solid #e4e4e7',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#18181b',
                          }}
                          formatter={(value) => [`${value} kg`, 'Logged Weight']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                    {materialsComposition.map((item) => (
                      <div 
                        key={item.name} 
                        className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20"
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-800 dark:text-zinc-200 uppercase truncate">
                            {getCategoryEmoji(item.name)} {item.name}
                          </p>
                          <p className="text-[11px] font-black text-gray-900 dark:text-zinc-50">
                            {item.value} kg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Eco Tips Section footer */}
          <div className="p-3.5 bg-green-50/30 dark:bg-green-950/10 border border-green-500/10 dark:border-green-500/20 rounded-2xl flex items-start gap-3 mt-1 text-xs">
            <span className="text-sm select-none">💡</span>
            <div>
              <p className="font-extrabold text-green-800 dark:text-green-450">Continuous Impact Tip</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Recycling metals (like aluminum cans) saves up to <strong className="text-gray-900 dark:text-zinc-100">95% of the raw energy</strong> needed for manufacture, while organic compost waste reduces high-impact methane discharge in heavy communal landfill reservoirs.
              </p>
            </div>
          </div>

        </div>

        {/* Local Community Index & Info Board (4 columns wide on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-6" id="community-index-infoboard">
          
          {/* Civic Health Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-4 relative overflow-hidden" id="city-civic-health-meter">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-3">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  City Cleanliness Index
                </h4>
                <p className="text-sm font-black text-gray-950 dark:text-zinc-100 uppercase tracking-tight mt-0.5">
                  📍 {user.city} Civic Grade
                </p>
              </div>
              <span className="text-2xl select-none">🗺️</span>
            </div>

            {/* Circular dial simulation using raw CSS or clean SVG */}
            <div className="flex flex-col items-center justify-center py-2" id="radial-score-indicator">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG circular progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-gray-100 dark:stroke-zinc-800 fill-none"
                    strokeWidth="10"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-green-600 dark:stroke-green-400 fill-none transition-all duration-1000"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - cleanlinessScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Absolute center score */}
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-gray-950 dark:text-zinc-50 leading-none">
                    {cleanlinessScore}
                  </span>
                  <span className="block text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                    INDEX PTS
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-items list */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 bg-gray-55 dark:bg-zinc-950/40 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-1.5 font-bold text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span>Resolved Hazards</span>
                </div>
                <span className="font-extrabold text-gray-900 dark:text-zinc-100">{resolvedIssuesCount} pins</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-55 dark:bg-zinc-950/40 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-1.5 font-bold text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Verified Audits</span>
                </div>
                <span className="font-extrabold text-gray-900 dark:text-zinc-100">{verifiedIssuesCount} pins</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-55 dark:bg-zinc-950/40 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-1.5 font-bold text-gray-500">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pending Hazards</span>
                </div>
                <span className="font-extrabold text-gray-900 dark:text-zinc-100">{activeIssuesCount} pins</span>
              </div>
            </div>

            <p className="text-[9px] text-gray-400 dark:text-zinc-500 text-center leading-normal">
              Civic health correlates reported waste issues against resolved status. Help upvote and resolve hazardous waste to restore your city index.
            </p>
          </div>

          {/* Interactive Impact Estimator Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-4" id="eco-future-projection-calculator">
            <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-3">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Impact Projection
              </h4>
              <p className="text-sm font-black text-gray-950 dark:text-zinc-100 uppercase tracking-tight mt-0.5">
                🌱 Future Impact Estimator
              </p>
            </div>

            {/* Slider 1: Average Weekly weight */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-500">Weekly Recycling Goal:</span>
                <span className="text-green-600 dark:text-green-400 font-extrabold">{estimateWeeklyWeight} kg</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={estimateWeeklyWeight}
                onChange={(e) => setEstimateWeeklyWeight(parseFloat(e.target.value))}
                className="w-full accent-green-600 cursor-pointer h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg appearance-none"
              />
            </div>

            {/* Slider 2: Average Weeks duration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-500">Simulation Period:</span>
                <span className="text-green-600 dark:text-green-400 font-extrabold">{estimateWeeks} Weeks</span>
              </div>
              <input
                type="range"
                min="4"
                max="52"
                step="4"
                value={estimateWeeks}
                onChange={(e) => setEstimateWeeks(parseInt(e.target.value))}
                className="w-full accent-green-600 cursor-pointer h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg appearance-none"
              />
            </div>

            {/* Simulated Output Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <div className="bg-gray-55 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <span className="block text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  Waste Diverted
                </span>
                <p className="text-sm font-black text-gray-950 dark:text-zinc-50 mt-0.5">
                  {projectedWeight.toFixed(1)} kg
                </p>
              </div>

              <div className="bg-gray-55 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <span className="block text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  CO₂ Saved
                </span>
                <p className="text-sm font-black text-gray-950 dark:text-zinc-50 mt-0.5">
                  {projectedCo2.toFixed(1)} kg
                </p>
              </div>

              <div className="bg-gray-55 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <span className="block text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  Water Saved
                </span>
                <p className="text-sm font-black text-gray-950 dark:text-zinc-50 mt-0.5">
                  {Math.round(projectedWater)} L
                </p>
              </div>

              <div className="bg-gray-55 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <span className="block text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  Energy Saved
                </span>
                <p className="text-sm font-black text-gray-950 dark:text-zinc-50 mt-0.5">
                  {projectedEnergy.toFixed(1)} kWh
                </p>
              </div>
            </div>

            <div className="text-[9px] text-gray-400 dark:text-zinc-500 flex items-start gap-1 p-1">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Simulated metrics scale linearly using standard environmental offset parameters (EPA).</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
