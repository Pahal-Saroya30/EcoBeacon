/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Shield, ThumbsUp, Camera, Image, Plus, Minus, Locate, Loader2, Search, X, Trash2, MapPin, Sparkles, MessageSquare, Send, Clock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport } from '../types';
import { getCityCoordinates, getCategoryEmoji, POINTS_VERIFY_ISSUE, POINTS_RESOLVE_ISSUE } from '../utils';

// Framer Motion marker animations
const SingleMarkerPulse = ({ color, category, isResolved }: { color: string; category: string; isResolved: boolean }) => {
  return (
    <div className="relative flex items-center justify-center w-9 h-9">
      {!isResolved && (
        <motion.div
          className="absolute inset-0 rounded-full opacity-40 pointer-events-none"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <motion.div
        className="relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-md cursor-pointer text-white select-none"
        style={{ backgroundColor: color }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {getCategoryEmoji(category)}
      </motion.div>
    </div>
  );
};

const ClusterMarkerPulse = ({ count, color, hasUnresolved }: { count: number; color: string; hasUnresolved: boolean }) => {
  return (
    <div className="relative flex items-center justify-center w-11 h-11 select-none">
      {hasUnresolved && (
        <motion.div
          className="absolute inset-0 rounded-full opacity-45 pointer-events-none"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.7, 1],
            opacity: [0.55, 0, 0.55],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <motion.div
        className="relative w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800 flex flex-col items-center justify-center text-xs shadow-xl font-black text-white cursor-pointer"
        style={{ backgroundColor: color }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <span className="leading-none text-[13px] font-black">{count}</span>
        <span className="text-[7px] font-black uppercase tracking-widest leading-none">pins</span>
      </motion.div>
    </div>
  );
};

// Haversine formula to calculate distance in meters between two lat/lng coordinates
const getDistanceInMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

interface AlertMapProps {
  userCity: string;
  userEmail: string;
  userName: string;
  issues: IssueReport[];
  onVerifyIssue: (issueId: number) => void;
  onResolveIssue: (issueId: number, resolvedImg: string) => void;
  onAddComment?: (issueId: number, text: string) => void;
  darkMode: boolean;
}

export default function AlertMap({
  userCity,
  userEmail,
  userName,
  issues,
  onVerifyIssue,
  onResolveIssue,
  onAddComment,
  darkMode
}: AlertMapProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Reset draft comment text when changing active selected pins
  useEffect(() => {
    setNewCommentText('');
  }, [selectedIssue]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [proximityAlerts, setProximityAlerts] = useState<{
    issue: IssueReport;
    distance: number;
  }[]>([]);

  const checkProximityToIssues = (lat: number, lng: number) => {
    const unresolved = issues.filter((issue) => issue.status !== 'Resolved');
    const alerts = unresolved
      .map((issue) => {
        const distance = getDistanceInMeters(lat, lng, issue.lat, issue.lng);
        return { issue, distance };
      })
      .filter((item) => item.distance <= 500)
      .sort((a, b) => a.distance - b.distance);

    setProximityAlerts(alerts);
  };

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pathLayerRef = useRef<any>(null);
  const activeRootsRef = useRef<any[]>([]);
  const [mapLibraryReady, setMapLibraryReady] = useState<boolean>(typeof L !== 'undefined');

  // Cleanup active roots on unmount
  useEffect(() => {
    return () => {
      const rootsToUnmount = [...activeRootsRef.current];
      activeRootsRef.current = [];
      setTimeout(() => {
        rootsToUnmount.forEach((root) => {
          try {
            root.unmount();
          } catch (e) {
            // ignore
          }
        });
      }, 0);
    };
  }, []);

  const [sessionResolutions, setSessionResolutions] = useState<{
    id: number;
    lat: number;
    lng: number;
    category: string;
    timestamp: number;
  }[]>([]);
  const [showPathInsideCard, setShowPathInsideCard] = useState<boolean>(false);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleShowMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocatingUser(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingUser(false);
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          
          // Add a modern user location circle to indicate GPS accuracy center
          const userCircle = L.circle([latitude, longitude], {
            radius: 80,
            color: '#3b82f6', // blue color for GPS accuracy
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(mapRef.current);

          userCircle.bindTooltip("You are here", {
            direction: 'top',
            offset: [0, -5],
            className: 'custom-leaflet-tooltip font-bold text-blue-600 dark:text-blue-400'
          });
        }
        // Check proximity to all unresolved issues
        checkProximityToIssues(latitude, longitude);
      },
      (error) => {
        setLocatingUser(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permission denied. Enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position unavailable. Try again.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("Unable to fetch location.");
            break;
        }
        // Auto-dismiss error alert after 3 seconds
        setTimeout(() => setLocationError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSimulateProximityLocation = () => {
    // Find first unresolved issue in the current city
    const unresolved = issues.filter(i => i.status !== 'Resolved');
    if (unresolved.length === 0) {
      setLocationError("No unresolved environmental issues found to simulate proximity to.");
      setTimeout(() => setLocationError(null), 4000);
      return;
    }

    // Get the first unresolved issue
    const targetIssue = unresolved[0];
    
    // Position simulated user roughly 320 meters away
    // Offset of 0.0018 is ideal for a high-accuracy test
    const simulatedLat = targetIssue.lat + 0.0018;
    const simulatedLng = targetIssue.lng + 0.0018;

    if (mapRef.current) {
      mapRef.current.setView([simulatedLat, simulatedLng], 15);
      
      // Add a simulated user location circle
      const userCircle = L.circle([simulatedLat, simulatedLng], {
        radius: 80,
        color: '#f59e0b', // Amber color for simulated GPS
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        weight: 2
      }).addTo(mapRef.current);

      userCircle.bindTooltip("Simulated User (Proximity Test)", {
        direction: 'top',
        offset: [0, -5],
        className: 'custom-leaflet-tooltip font-bold text-amber-600 dark:text-amber-400'
      });
    }

    // Trigger proximity toast alert checks
    checkProximityToIssues(simulatedLat, simulatedLng);
  };

  const renderCleanupPath = () => {
    if (typeof L === 'undefined' || !mapRef.current || !pathLayerRef.current) return;

    pathLayerRef.current.clearLayers();

    if (sessionResolutions.length === 0) return;

    if (sessionResolutions.length === 1) {
      // Draw a single start marker
      const pt = sessionResolutions[0];
      const startMarkerHtml = `
        <div class="relative flex items-center justify-center w-7 h-7">
          <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <div class="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg bg-emerald-500 text-[10px] font-black text-white">
            1
          </div>
        </div>
      `;
      const divIcon = L.divIcon({
        html: startMarkerHtml,
        className: 'custom-path-start-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: divIcon }).addTo(pathLayerRef.current);
      marker.bindTooltip(`Cleanup Path Start: ${getCategoryEmoji(pt.category)} ${pt.category}`, {
        direction: 'top',
        offset: [0, -5]
      });
      return;
    }

    const latLngs = sessionResolutions.map(r => [r.lat, r.lng] as [number, number]);

    // Draw the polyline trail
    L.polyline(latLngs, {
      color: '#10B981', // green line for cleanup path
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 12', // dashed to look like a trail path!
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(pathLayerRef.current);

    // Draw standard/custom markers for each stop
    sessionResolutions.forEach((pt, index) => {
      const isStart = index === 0;
      const isEnd = index === sessionResolutions.length - 1;
      
      const markerColor = isEnd ? '#10B981' : (isStart ? '#3b82f6' : '#6b7280');
      const label = isEnd ? `Latest Stop #${index + 1}` : (isStart ? 'Start Stop #1' : `Stop #${index + 1}`);

      const pulseHtml = isEnd ? `<span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>` : '';

      const markerHtml = `
        <div class="relative flex items-center justify-center w-7 h-7">
          ${pulseHtml}
          <div class="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg text-[10px] font-black text-white" style="background-color: ${markerColor}">
            ${index + 1}
          </div>
        </div>
      `;

      const divIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-path-node-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const nodeMarker = L.marker([pt.lat, pt.lng], { icon: divIcon }).addTo(pathLayerRef.current);
      nodeMarker.bindTooltip(`${label}: ${getCategoryEmoji(pt.category)} ${pt.category}`, {
        direction: 'top',
        offset: [0, -5]
      });
    });
  };

  const getPathDistance = () => {
    let totalDist = 0;
    for (let i = 0; i < sessionResolutions.length - 1; i++) {
      const p1 = sessionResolutions[i];
      const p2 = sessionResolutions[i + 1];
      totalDist += getDistanceInMeters(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    return totalDist;
  };

  const handleFitTrailBounds = () => {
    if (!mapRef.current || sessionResolutions.length === 0) return;
    try {
      const bounds = L.latLngBounds(sessionResolutions.map(r => [r.lat, r.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } catch (e) {}
  };

  const handleClearTrail = () => {
    setSessionResolutions([]);
  };

  const handleSimulateCleanup = () => {
    const coords = getCityCoordinates(userCity);
    const unresolved = issues.filter(i => i.status !== 'Resolved' && !sessionResolutions.some(sr => sr.id === i.id));
    
    let simulatedId = Date.now();
    let simulatedLat = coords.lat + (Math.random() - 0.5) * 0.015;
    let simulatedLng = coords.lng + (Math.random() - 0.5) * 0.015;
    let category = ['Plastic', 'Paper', 'Organic', 'Metal', 'Glass', 'E-Waste'][Math.floor(Math.random() * 6)];
    
    if (unresolved.length > 0) {
      const randomIssue = unresolved[Math.floor(Math.random() * unresolved.length)];
      simulatedId = randomIssue.id;
      simulatedLat = randomIssue.lat;
      simulatedLng = randomIssue.lng;
      category = randomIssue.category;
      
      onResolveIssue(randomIssue.id, "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80");
    }

    setSessionResolutions(prev => {
      if (prev.some(p => p.id === simulatedId)) {
        simulatedId = Date.now();
      }
      const newPath = [
        ...prev,
        {
          id: simulatedId,
          lat: simulatedLat,
          lng: simulatedLng,
          category,
          timestamp: Date.now()
        }
      ];
      
      if (mapRef.current) {
        mapRef.current.panTo([simulatedLat, simulatedLng]);
      }
      
      return newPath;
    });
  };

  const renderCleanupPathManager = () => {
    const distanceMeters = getPathDistance();
    const distanceFormatted = distanceMeters >= 1000 
      ? `${(distanceMeters / 1000).toFixed(2)} km` 
      : `${Math.round(distanceMeters)} meters`;

    return (
      <div className="bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-150 dark:border-zinc-800 rounded-xl p-4.5 space-y-3.5" id="cleanup-path-manager">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">🥾</span>
            <div>
              <h4 className="text-xs font-black text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                My Cleanup Path
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-zinc-550 font-semibold">Current Session Progress Trail</p>
            </div>
          </div>
          {sessionResolutions.length > 0 && (
            <button
              onClick={handleClearTrail}
              className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-extrabold flex items-center gap-1 bg-red-500/10 dark:bg-red-950/30 px-2 py-1 rounded-lg transition-all cursor-pointer"
              title="Clear Session Trail"
            >
              <Trash2 className="w-3 h-3" /> Clear Path
            </button>
          )}
        </div>

        {/* Trail stats summary */}
        <div className="grid grid-cols-2 gap-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 p-3 rounded-xl shadow-2xs">
          <div>
            <span className="text-[9px] text-gray-400 dark:text-zinc-550 font-extrabold block uppercase tracking-wider">Resolved Stops</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 mt-0.5">
              📍 {sessionResolutions.length} {sessionResolutions.length === 1 ? 'Stop' : 'Stops'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 dark:text-zinc-550 font-extrabold block uppercase tracking-wider">Total Trail Span</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 mt-0.5 font-mono">
              🏁 {distanceFormatted}
            </span>
          </div>
        </div>

        {/* Sequential steps of the trail */}
        {sessionResolutions.length > 0 ? (
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {sessionResolutions.map((pt, index) => {
              const isStart = index === 0;
              const isEnd = index === sessionResolutions.length - 1;
              return (
                <div 
                  key={`${pt.id}-${index}`} 
                  className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-lg shadow-3xs hover:border-emerald-500/20 dark:hover:border-emerald-500/10 cursor-pointer"
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView([pt.lat, pt.lng], 16);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center shrink-0 ${isEnd ? 'bg-emerald-500' : (isStart ? 'bg-blue-500' : 'bg-gray-400')}`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold text-gray-800 dark:text-zinc-200 truncate">
                        {getCategoryEmoji(pt.category)} {pt.category} Spot
                      </p>
                      <p className="text-[8px] text-gray-400 dark:text-zinc-550 font-semibold font-mono">
                        {new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 shrink-0">
                    {isEnd ? 'Latest' : (isStart ? 'Start' : `Stop`)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4.5 bg-white dark:bg-zinc-900 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">No active path history</p>
            <p className="text-[9px] text-gray-400 dark:text-zinc-550 font-medium mt-0.5 px-3 leading-normal">Your path will draw sequentially as you resolve issues during this session!</p>
          </div>
        )}

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulateCleanup}
            className="py-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-650 hover:to-teal-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer outline-none"
          >
            <Sparkles className="w-3 h-3 animate-pulse" /> Simulate Stop
          </button>
          <button
            onClick={handleFitTrailBounds}
            disabled={sessionResolutions.length === 0}
            className="py-2 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 border border-gray-200 dark:border-zinc-850 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer outline-none"
          >
            🗺️ Fit Bounds
          </button>
        </div>
      </div>
    );
  };

  // Trigger repaint of cleanup path whenever sessionResolutions updates
  useEffect(() => {
    renderCleanupPath();
  }, [sessionResolutions, mapLibraryReady]);

  // Verify Leaflet script is fully evaluated and ready
  useEffect(() => {
    if (mapLibraryReady) return;

    const checkInterval = setInterval(() => {
      if (typeof L !== 'undefined') {
        setMapLibraryReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [mapLibraryReady]);

  // Re-load map whenever city configuration changes or dark mode toggles
  useEffect(() => {
    if (!mapLibraryReady || !mapContainerRef.current) return;

    // Destroy existing Leaflet map object safely
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {}
      mapRef.current = null;
    }

    const coords = getCityCoordinates(userCity);

    // Initial map initialization
    const mapObj = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([coords.lat, coords.lng], 14);

    // Dynamic night theme tile layer choice
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 20
    }).addTo(mapObj);

    markersLayerRef.current = L.layerGroup().addTo(mapObj);
    pathLayerRef.current = L.layerGroup().addTo(mapObj);
    mapRef.current = mapObj;

    // Map click hides standard popup cards
    mapObj.on('click', () => {
      setSelectedIssue(null);
    });

    renderIssueMarkers();
    renderCleanupPath();

    // Map auto resize invalidation
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [userCity, mapLibraryReady, darkMode]);

  const filteredIssues = issues.filter((issue) => {
    // 1. Status Filter
    if (statusFilter !== 'All') {
      const isActive = issue.status !== 'Resolved';
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Resolved' && isActive) return false;
    }

    // 2. Category Filter
    if (categoryFilter !== 'All' && issue.category !== categoryFilter) {
      return false;
    }

    // 3. Text Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCategory = issue.category.toLowerCase().includes(q);
      const matchDesc = issue.description.toLowerCase().includes(q);
      const matchReporter = issue.reporter.toLowerCase().includes(q);
      const matchStatus = issue.status.toLowerCase().includes(q);
      if (!matchCategory && !matchDesc && !matchReporter && !matchStatus) {
        return false;
      }
    }

    return true;
  });

  // Sync / Repaint markers whenever issues modify or filter changes
  useEffect(() => {
    renderIssueMarkers();

    // If the selected issue is no longer visible under the current filter, clear selection
    if (selectedIssue) {
      const isStillVisible = filteredIssues.some((i) => i.id === selectedIssue.id);
      if (!isStillVisible) {
        setSelectedIssue(null);
      }
    }
  }, [issues, selectedIssue, statusFilter, searchQuery, categoryFilter]);

  // Handle automatic re-clustering on map zoom changes
  useEffect(() => {
    if (!mapRef.current) return;

    const handleZoomEnd = () => {
      renderIssueMarkers();
    };

    mapRef.current.on('zoomend', handleZoomEnd);
    return () => {
      if (mapRef.current) {
        mapRef.current.off('zoomend', handleZoomEnd);
      }
    };
  }, [filteredIssues, statusFilter]);

  const renderIssueMarkers = () => {
    if (typeof L === 'undefined' || !mapRef.current || !markersLayerRef.current) return;

    // Unmount active React roots to prevent memory leaks
    const rootsToUnmount = [...activeRootsRef.current];
    activeRootsRef.current = [];
    setTimeout(() => {
      rootsToUnmount.forEach((root) => {
        try {
          root.unmount();
        } catch (e) {
          // ignore
        }
      });
    }, 0);

    markersLayerRef.current.clearLayers();

    // Clustering configuration
    const clusterRadiusPixels = 60;
    const clusters: {
      center: [number, number];
      issues: IssueReport[];
    }[] = [];

    // Helper to safely fetch container pixel coordinates with absolute projection fallback
    const getContainerPoint = (lat: number, lng: number) => {
      try {
        return mapRef.current.latLngToContainerPoint([lat, lng]);
      } catch (e) {
        return { x: lat * 10000, y: lng * 10000 };
      }
    };

    // Distribute issues into visual clusters
    filteredIssues.forEach((issue) => {
      const issuePoint = getContainerPoint(issue.lat, issue.lng);
      let joinedCluster = false;

      for (const cluster of clusters) {
        const clusterPoint = getContainerPoint(cluster.center[0], cluster.center[1]);
        const dx = issuePoint.x - clusterPoint.x;
        const dy = issuePoint.y - clusterPoint.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        if (pixelDistance < clusterRadiusPixels) {
          cluster.issues.push(issue);
          
          // Recalculate average coordinates of the cluster center
          const total = cluster.issues.length;
          const sumLat = cluster.issues.reduce((sum, i) => sum + i.lat, 0);
          const sumLng = cluster.issues.reduce((sum, i) => sum + i.lng, 0);
          cluster.center = [sumLat / total, sumLng / total];
          
          joinedCluster = true;
          break;
        }
      }

      if (!joinedCluster) {
        clusters.push({
          center: [issue.lat, issue.lng],
          issues: [issue]
        });
      }
    });

    // Render each cluster/single marker on map
    clusters.forEach((cluster) => {
      if (cluster.issues.length === 1) {
        // CASE A: Single issue marker representation
        const issue = cluster.issues[0];
        let color = '#10B981'; // Green (Resolved)
        if (issue.status !== 'Resolved') {
          if (issue.severity === 'High') color = '#EF4444'; // Red
          else if (issue.severity === 'Medium') color = '#F59E0B'; // Amber
          else color = '#FBBF24'; // Yellow
        }

        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(
          <SingleMarkerPulse
            color={color}
            category={issue.category}
            isResolved={issue.status === 'Resolved'}
          />
        );
        activeRootsRef.current.push(root);

        const divIcon = L.divIcon({
          html: el,
          className: 'custom-leaflet-pin',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([issue.lat, issue.lng], { icon: divIcon }).addTo(markersLayerRef.current);

        // Bind dynamic tooltip to marker on hover
        const tooltipContent = `
          <div class="flex flex-col gap-1 min-w-[130px] font-sans">
            <div class="flex items-center gap-1.5 font-extrabold text-gray-800 dark:text-zinc-100">
              <span class="text-sm shrink-0 select-none">${getCategoryEmoji(issue.category)}</span>
              <span class="text-[11px] truncate">${issue.category}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${color}"></span>
              <span class="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                ${issue.status}
              </span>
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10],
          className: 'custom-leaflet-tooltip',
          opacity: 0.98
        });

        // Handle active click triggers
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSelectedIssue(issue);
          mapRef.current.panTo([issue.lat, issue.lng]);
        });
      } else {
        // CASE B: Clustered issue marker representation
        const unresolved = cluster.issues.filter(i => i.status !== 'Resolved');
        const hasHigh = unresolved.some(i => i.severity === 'High');
        const hasMedium = unresolved.some(i => i.severity === 'Medium');
        const allResolved = unresolved.length === 0;

        let clusterColor = '#10B981'; // Green
        if (!allResolved) {
          if (hasHigh) clusterColor = '#EF4444'; // Red
          else if (hasMedium) clusterColor = '#F59E0B'; // Amber
          else clusterColor = '#FBBF24'; // Yellow
        }

        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(
          <ClusterMarkerPulse
            count={cluster.issues.length}
            color={clusterColor}
            hasUnresolved={!allResolved}
          />
        );
        activeRootsRef.current.push(root);

        const divIcon = L.divIcon({
          html: el,
          className: 'custom-leaflet-cluster',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker(cluster.center, { icon: divIcon }).addTo(markersLayerRef.current);

        // Render detailed multi-issue breakdown tooltip on hover
        const tooltipItemsHtml = cluster.issues.slice(0, 4).map(issue => {
          let statusDot = issue.status === 'Resolved' ? '#10B981' : (issue.severity === 'High' ? '#EF4444' : '#F59E0B');
          return `
            <div class="flex items-center justify-between gap-3 text-[10px] font-semibold text-gray-600 dark:text-zinc-350">
              <div class="flex items-center gap-1 truncate max-w-[125px]">
                <span class="shrink-0 select-none">${getCategoryEmoji(issue.category)}</span>
                <span class="truncate">${issue.category}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${statusDot}"></span>
                <span class="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-zinc-500">${issue.status}</span>
              </div>
            </div>
          `;
        }).join('');

        const remainingCount = cluster.issues.length - 4;
        const remainingHtml = remainingCount > 0 
          ? `<div class="text-[8px] font-extrabold text-gray-400 dark:text-zinc-500 text-right mt-1">+${remainingCount} more pins</div>` 
          : '';

        const tooltipContent = `
          <div class="flex flex-col gap-1.5 min-w-[170px] max-w-[210px] font-sans p-0.5">
            <div class="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-1 mb-1">
              <span class="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">Clustered Alerts</span>
              <span class="text-[9px] font-black px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md">${cluster.issues.length} pins</span>
            </div>
            <div class="flex flex-col gap-1">
              ${tooltipItemsHtml}
            </div>
            ${remainingHtml}
            <div class="text-[8px] font-black text-center text-emerald-600 dark:text-emerald-400 border-t border-gray-50 dark:border-zinc-850 pt-1 mt-1 uppercase tracking-wider animate-pulse">Click to expand cluster</div>
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -12],
          className: 'custom-leaflet-tooltip',
          opacity: 0.98
        });

        // Click on cluster automatically calculates fitBounds to zoom & expand clustered elements
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          const bounds = L.latLngBounds(cluster.issues.map(i => [i.lat, i.lng]));
          mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        });
      }
    });
  };

  const formatCommentTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !newCommentText.trim()) return;

    const text = newCommentText.trim();
    if (onAddComment) {
      onAddComment(selectedIssue.id, text);
    }

    // Locally update state for immediate reactive UI
    setSelectedIssue(prev => prev ? {
      ...prev,
      comments: [...(prev.comments || []), {
        id: `comment-${Date.now()}`,
        author: userName,
        text,
        timestamp: Date.now()
      }]
    } : null);

    setNewCommentText('');
  };

  const handleUpvoteClick = () => {
    if (!selectedIssue) return;
    onVerifyIssue(selectedIssue.id);

    // Locally update UI state immediately for smoother reactivity
    setSelectedIssue(prev => prev ? {
      ...prev,
      upvotes: prev.upvotes + 1,
      voters: [...prev.voters, userEmail]
    } : null);
  };

  // Upload photo to resolve the selected issue
  const handleResolveTrigger = () => {
    if (!selectedIssue) return;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';

    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && selectedIssue) {
            onResolveIssue(selectedIssue.id, event.target.result as string);
            
            // Append to session resolutions
            setSessionResolutions(prev => [
              ...prev,
              {
                id: selectedIssue.id,
                lat: selectedIssue.lat,
                lng: selectedIssue.lng,
                category: selectedIssue.category,
                timestamp: Date.now()
              }
            ]);

            // Re-sync chosen issue state
            setSelectedIssue(prev => prev ? {
              ...prev,
              status: 'Resolved',
              resolvedImageUrl: event.target?.result as string
            } : null);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  const isReporter = selectedIssue?.reporter === 'Arjun Mehta'; // default User name
  const isVoter = selectedIssue?.voters?.includes(userEmail);
  const isResolved = selectedIssue?.status === 'Resolved';

  const uniqueCategories = Array.from(new Set(issues.map((i) => i.category)));

  return (
    <div className="flex flex-col gap-5 w-full" id="map-hub-tab">
      
      {/* Search and Category Filter Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3.5 items-center justify-between animate-fade-in" id="map-search-filter-panel">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-zinc-950 border border-green-100 dark:border-zinc-850 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-lg select-none">
            🔍
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Map Query Hub</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 uppercase tracking-widest font-black">Interactive</span>
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-zinc-550 font-medium">Find specific hazard pins or filtered local issue reports</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Keyword Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search description, reporter, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-950 text-xs font-semibold border border-gray-200 dark:border-zinc-850 rounded-xl pl-9 pr-8 py-2.5 outline-none text-gray-700 dark:text-zinc-300 placeholder:text-gray-450 focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown Selector */}
          <div className="relative flex-1 sm:w-48">
            <select
              id="category-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-950 text-xs font-bold border border-gray-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 outline-none cursor-pointer text-gray-700 dark:text-zinc-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none pr-8 shadow-2xs"
            >
              <option value="All">📁 All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryEmoji(cat)} {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-450 dark:text-zinc-550">
              <Plus className="w-3.5 h-3.5 rotate-45" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Side display Canvas */}
        <div className="lg:col-span-2 relative min-h-[460px] border border-gray-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div id="map-container" ref={mapContainerRef} className="w-full h-full bg-gray-100 dark:bg-zinc-950 min-h-[460px]"></div>
        {!mapLibraryReady && (
          <div className="absolute inset-0 bg-gray-50/80 dark:bg-zinc-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-[2000]">
            <div className="w-6 h-6 border-2 border-green-650 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-bold">Connecting to neighborhood map...</span>
          </div>
        )}

        {/* Floating City indicator */}
        <div className="absolute top-4 left-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 py-1.5 border border-gray-150 dark:border-zinc-800 rounded-xl shadow-lg text-[11px] font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 z-[1000]">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>Alert Map: {userCity} Neighborhood</span>
        </div>

        {/* Floating Filter indicator */}
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 py-1.5 border border-gray-150 dark:border-zinc-800 rounded-xl shadow-lg text-[11px] font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5 z-[1000]">
          <label htmlFor="status-filter" className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Filter:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Resolved')}
            className="bg-transparent text-[11px] font-bold outline-none cursor-pointer text-gray-700 dark:text-zinc-300 focus:ring-0 border-none p-0 pr-1"
          >
            <option value="All" className="bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300">All Issues</option>
            <option value="Active" className="bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300">Active Only</option>
            <option value="Resolved" className="bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300">Resolved Only</option>
          </select>
        </div>

        {/* Error Notification Banner for Location Errors */}
        {locationError && (
          <div className="absolute top-16 left-4 right-4 bg-red-500/95 dark:bg-red-900/95 backdrop-blur text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-black z-[1000] flex items-center justify-between border border-red-400 dark:border-red-800 animate-bounce">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-white hover:text-red-200 font-extrabold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floating Zoom and Location Controls */}
        {mapLibraryReady && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]" id="custom-map-zoom-controls">
            <button
              id="map-simulate-gps-btn"
              onClick={handleSimulateProximityLocation}
              className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-lg flex items-center justify-center select-none cursor-pointer transition-all active:scale-95 group border border-orange-400 dark:border-orange-800"
              title="Simulate Proximity GPS (Virtual user 320m away from Hazard)"
              aria-label="Simulate Proximity"
            >
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </button>
            <button
              id="map-locate-btn"
              onClick={handleShowMyLocation}
              disabled={locatingUser}
              className={`w-11 h-11 bg-white/95 dark:bg-zinc-900/95 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-750 dark:text-zinc-200 rounded-xl shadow-lg border border-gray-150 dark:border-zinc-800 flex items-center justify-center select-none cursor-pointer transition-all active:scale-95 group ${
                locatingUser ? 'opacity-80 cursor-wait' : ''
              }`}
              aria-label="Show My Location"
              title="Show My Location"
            >
              {locatingUser ? (
                <Loader2 className="w-5 h-5 text-green-600 dark:text-green-400 animate-spin" />
              ) : (
                <Locate className="w-5 h-5 text-gray-700 dark:text-zinc-300 group-hover:text-green-650 dark:group-hover:text-green-400 transition-colors" />
              )}
            </button>
            <button
              id="map-zoom-in-btn"
              onClick={handleZoomIn}
              className="w-11 h-11 bg-white/95 dark:bg-zinc-900/95 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-750 dark:text-zinc-200 rounded-xl shadow-lg border border-gray-150 dark:border-zinc-800 flex items-center justify-center select-none cursor-pointer transition-all active:scale-95 group"
              aria-label="Zoom In"
              title="Zoom In"
            >
              <Plus className="w-5 h-5 text-gray-700 dark:text-zinc-300 group-hover:text-green-650 dark:group-hover:text-green-400 transition-colors" />
            </button>
            <button
              id="map-zoom-out-btn"
              onClick={handleZoomOut}
              className="w-11 h-11 bg-white/95 dark:bg-zinc-900/95 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-750 dark:text-zinc-200 rounded-xl shadow-lg border border-gray-150 dark:border-zinc-800 flex items-center justify-center select-none cursor-pointer transition-all active:scale-95 group"
              aria-label="Zoom Out"
              title="Zoom Out"
            >
              <Minus className="w-5 h-5 text-gray-700 dark:text-zinc-300 group-hover:text-green-650 dark:group-hover:text-green-400 transition-colors" />
            </button>
          </div>
        )}

        {/* Proximity Alerts Toast Overlay */}
        {proximityAlerts.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-amber-350 dark:border-amber-900/65 rounded-2xl p-4 shadow-2xl z-[1000] space-y-3 animate-fade-in" id="proximity-toast-container">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm select-none">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-gray-800 dark:text-zinc-100 uppercase tracking-wider">
                    Hazard Proximity Alerts
                  </h4>
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-black">
                    Found {proximityAlerts.length} unresolved issues within 500 meters!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProximityAlerts([])}
                className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-300 cursor-pointer p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                title="Dismiss Alerts"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {proximityAlerts.map(({ issue, distance }) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between gap-2 p-2 bg-amber-50/15 dark:bg-amber-950/10 border border-amber-500/10 dark:border-amber-500/20 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs select-none">{getCategoryEmoji(issue.category)}</span>
                      <span className="text-[10px] font-extrabold text-gray-750 dark:text-zinc-250 truncate">
                        {issue.category}
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        {Math.round(distance)}m away
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 dark:text-zinc-400 truncate mt-0.5 max-w-[180px]">
                      "{issue.description}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIssue(issue);
                      if (mapRef.current) {
                        mapRef.current.setView([issue.lat, issue.lng], 16);
                      }
                    }}
                    className="shrink-0 text-[9px] font-black text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-150/60 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-950 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Focus 🎯
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Neighborhood Stats & Cleanup Path Manager */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between" id="map-details-card">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <span>📊 Neighborhood Environmental Stats</span>
            </h3>
            <div className="grid grid-cols-3 gap-2 bg-gray-50/50 dark:bg-zinc-950/30 p-2.5 rounded-2xl border border-gray-100 dark:border-zinc-850">
              <div className="text-center py-1">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-black uppercase block leading-none">Total</span>
                <span className="text-sm font-black text-gray-800 dark:text-zinc-200 block mt-1.5">{issues.length}</span>
              </div>
              <div className="text-center py-1 border-x border-gray-150 dark:border-zinc-800">
                <span className="text-[9px] text-red-500 dark:text-red-450 font-black uppercase block leading-none">Active</span>
                <span className="text-sm font-black text-red-600 dark:text-red-400 block mt-1.5">
                  {issues.filter(i => i.status !== 'Resolved').length}
                </span>
              </div>
              <div className="text-center py-1">
                <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase block leading-none">Solved</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-1.5">
                  {issues.filter(i => i.status === 'Resolved').length}
                </span>
              </div>
            </div>
          </div>

          {renderCleanupPathManager()}
        </div>

        <div className="bg-emerald-50/15 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/20 rounded-2xl p-4 text-center mt-4">
          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">🌟 Clean Up & Earn Points!</p>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 leading-normal">
            Click on any active alert marker on the map to open the slide-up remediation drawer, verify hazard urgency, or log a clean-up with photo proof.
          </p>
        </div>
      </div>

      {/* Viewport Slide-Up Bottom Sheet Modal for Selected Issue */}
      <AnimatePresence>
        {selectedIssue && (
          <>
            {/* Dark glassmorphism background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIssue(null)}
              className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs z-[2100]"
              id="bottom-sheet-overlay"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white dark:bg-zinc-900 border-t border-gray-150 dark:border-zinc-800 rounded-t-3xl shadow-2xl z-[2101] overflow-hidden flex flex-col max-h-[85vh]"
              id="bottom-sheet-drawer"
            >
              {/* Top Drag bar handle indicator */}
              <div 
                className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto my-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors shrink-0" 
                onClick={() => setSelectedIssue(null)}
              />

              <div className="overflow-y-auto px-6 pb-8 pt-2 space-y-5">
                {/* Header Section */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-zinc-300 shadow-3xs">
                        <span>{getCategoryEmoji(selectedIssue.category)}</span>
                        <span>{selectedIssue.category}</span>
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                        selectedIssue.status === 'Resolved' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-900/40 text-emerald-750 dark:text-emerald-400' 
                          : 'bg-red-50 dark:bg-red-950/30 border-red-250 dark:border-red-900/40 text-red-650 dark:text-red-400'
                      }`}>
                        {selectedIssue.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-550 font-black uppercase tracking-wider">
                      📍 Spotted by {selectedIssue.reporter} • {new Date(selectedIssue.timestamp).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-655 dark:hover:text-zinc-300 transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                    id="close-bottom-sheet-btn"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Description & Severity */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wider uppercase ${
                      selectedIssue.severity === 'High' 
                        ? 'bg-red-500' 
                        : selectedIssue.severity === 'Medium' 
                        ? 'bg-amber-500' 
                        : 'bg-yellow-500'
                    }`}>
                      {selectedIssue.severity} URGENCY
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest">
                      hazard details
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 dark:text-zinc-100 leading-relaxed font-bold bg-gray-50/55 dark:bg-zinc-950/20 border border-gray-100/50 dark:border-zinc-850 p-4 rounded-2xl">
                    "{selectedIssue.description}"
                  </p>
                </div>

                {/* Double-column Images Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[9px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1">
                      📸 Reported Spot Photo
                    </div>
                    <div className="w-full h-36 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 overflow-hidden shadow-xs relative group">
                      {selectedIssue.imageUrl ? (
                        <img 
                          src={selectedIssue.imageUrl} 
                          alt="Reported spot" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300 dark:text-zinc-700 h-full gap-1">
                          <Image className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] font-black uppercase">No Photo Attached</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[9px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1">
                      ✨ Resolved State Photo
                    </div>
                    <div className="w-full h-36 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 overflow-hidden shadow-xs relative group flex items-center justify-center">
                      {selectedIssue.resolvedImageUrl ? (
                        <img 
                          src={selectedIssue.resolvedImageUrl} 
                          alt="Resolved state" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="p-4 text-center text-gray-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400">
                            Pending Cleanup
                          </span>
                          <p className="text-[9px] text-gray-400 dark:text-zinc-550 max-w-[180px] leading-normal font-semibold">
                            Claim rewards by cleaning up this hazard and uploading photo proof!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Action Remediation Steps */}
                {selectedIssue.aiSteps && selectedIssue.aiSteps.length > 0 && (
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/3 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> AI Recommendation & Safety Steps
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-600 dark:text-zinc-300 font-semibold list-decimal pl-4">
                      {selectedIssue.aiSteps.map((step, index) => (
                        <li key={index} className="leading-relaxed">{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Discussion & Coordination Comment Section */}
                <div className="pt-4 border-t border-gray-150 dark:border-zinc-800/80 space-y-3" id="issue-comments-section">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Discussion & Cleanup Efforts
                    </h4>
                    <span className="text-[10px] font-extrabold bg-gray-100 dark:bg-zinc-850 text-gray-500 dark:text-zinc-400 px-2.5 py-0.5 rounded-full border border-gray-150 dark:border-zinc-800">
                      {(selectedIssue.comments || []).length} comments
                    </span>
                  </div>

                  {/* Comment Feed Container */}
                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1" id="comments-feed">
                    {(selectedIssue.comments || []).length === 0 ? (
                      <div className="text-center py-5 bg-gray-50/50 dark:bg-zinc-950/20 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-550">
                          No discussions yet. Coordinate a meeting time or share clean-up tips!
                        </p>
                      </div>
                    ) : (
                      (selectedIssue.comments || []).map((comment) => (
                        <div key={comment.id} className="bg-gray-50/70 dark:bg-zinc-950/30 border border-gray-100 dark:border-zinc-850 p-3 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                              {comment.author}
                            </span>
                            <span className="text-gray-400 dark:text-zinc-550 font-bold flex items-center gap-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              {formatCommentTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-gray-700 dark:text-zinc-300 leading-relaxed pl-2.5 border-l border-emerald-500/10 dark:border-emerald-500/20">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* New Comment Submission Form */}
                  <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1" id="add-comment-form">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Discuss cleanup plans, tips, or meeting details..."
                      className="flex-1 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-650 outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl shadow-3xs transition-colors flex items-center justify-center cursor-pointer shrink-0 border border-emerald-500 dark:border-emerald-800"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Actions & Verification */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-500">
                    <span className="flex items-center gap-1.5 font-bold">
                      <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400 fill-green-50 dark:fill-green-950/10" /> Verifications:
                    </span>
                    <span className="font-extrabold text-gray-800 dark:text-zinc-200">{selectedIssue.upvotes} verified</span>
                  </div>

                  {/* Footer Triggers */}
                  {!selectedIssue.resolvedImageUrl && selectedIssue.status !== 'Resolved' ? (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        disabled={isVoter || isReporter}
                        onClick={handleUpvoteClick}
                        className="py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 hover:border-green-300 dark:hover:border-green-850 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-green-700 dark:hover:text-green-400 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {isVoter ? 'Upvoted ✓' : `Verify (+${POINTS_VERIFY_ISSUE})`}
                      </button>
                      <button
                        onClick={handleResolveTrigger}
                        className="py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Clean up (+{POINTS_RESOLVE_ISSUE})
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 text-green-850 dark:text-green-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-3xs">
                      <CheckCircle className="w-4 h-4 fill-green-100 dark:fill-green-950/40" /> Resolved & Cleaned Up! Community Reward Issued.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
