/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, ShieldAlert, CheckSquare, MapPin, ChevronLeft, ChevronRight, BarChart2, AlertCircle, Camera, Check, Upload, Mic, MicOff } from 'lucide-react';
import { motion } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LogEntry, IssueReport } from '../types';
import { RECYCLING_RATES, POINTS_REPORT_ISSUE, MOCK_PRESETS, getCityCoordinates, getCategoryEmoji } from '../utils';

interface ReportFormProps {
  userCity: string;
  onAddLog: (log: LogEntry) => void;
  onAddIssue: (issue: IssueReport) => void;
  onNavigateToDashboard: () => void;
}

export default function ReportForm({
  userCity,
  onAddLog,
  onAddIssue,
  onNavigateToDashboard
}: ReportFormProps) {
  // Shared
  const [activeFlow, setActiveFlow] = useState<'recycling' | 'community' | null>(null);

  // Recycling flow state
  const [recyclingStep, setRecyclingStep] = useState(1);
  const [selectedRecycleCat, setSelectedRecycleCat] = useState<string | null>(null);
  const [recycleWeight, setRecycleWeight] = useState<number>(0.5);
  const [recycleNotes, setRecycleNotes] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const parseVoiceText = (transcript: string) => {
    setRecycleNotes(transcript);
    setVoiceError(null);
    
    // Smart parsing logic:
    const lowerTranscript = transcript.toLowerCase();
    
    // Find any category matches
    const categories = Object.keys(RECYCLING_RATES);
    const matchedCategory = categories.find(cat => 
      lowerTranscript.includes(cat.toLowerCase()) || 
      (cat === 'E-Waste' && (lowerTranscript.includes('electronic') || lowerTranscript.includes('e-waste') || lowerTranscript.includes('ewaste')))
    );
    if (matchedCategory) {
      setSelectedRecycleCat(matchedCategory);
    }

    // Try to match a weight (e.g. "5 kg", "2.5 kilograms")
    const numberMatch = lowerTranscript.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilo|kilograms|kilos|pounds|lbs)?/i);
    if (numberMatch && numberMatch[1]) {
      const parsedWeight = parseFloat(numberMatch[1]);
      if (!isNaN(parsedWeight) && parsedWeight > 0) {
        setRecycleWeight(parsedWeight);
      }
    } else {
      // Check for written numbers
      const writtenNumbers: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      for (const [word, val] of Object.entries(writtenNumbers)) {
        if (lowerTranscript.includes(word)) {
          setRecycleWeight(val);
          break;
        }
      }
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError('Speech Recognition is not natively supported in this browser environment. Try clicking the "Simulate Voice Input" presets below to test the automatic text/weight parsing feature!');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          parseVoiceText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone access blocked. Standard browser security inside iframes blocks microphone use. Try clicking the "Simulate Voice Input" presets below to test the automatic text/weight parsing feature!');
        } else {
          setVoiceError(`Speech recognition error: ${event.error || 'Access denied'}. Sandbox iframe context may block mic access. Try the quick "Simulate Voice Input" presets below!`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setVoiceError('Failed to initialize speech recognition. Try the simulated presets below!');
      setIsListening(false);
    }
  };

  // Community flow state
  const [communityStep, setCommunityStep] = useState(1);
  const [issuePhoto, setIssuePhoto] = useState<string | null>(null); // base64 representation
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // AI evaluation fields (derived from Gemini response or editable by user)
  const [evalCategory, setEvalCategory] = useState<string>('Waste Pile');
  const [evalSeverity, setEvalSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [evalDesc, setEvalDesc] = useState<string>('');
  const [evalAiSteps, setEvalAiSteps] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Map pinning state
  const [pinLat, setPinLat] = useState<number>(19.0760);
  const [pinLng, setPinLng] = useState<number>(72.8777);
  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<any>(null);
  const miniMarkerRef = useRef<any>(null);
  const [mapLibraryReady, setMapLibraryReady] = useState<boolean>(typeof L !== 'undefined');

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

  // Load default city coordinates when community step is map (Step 3)
  useEffect(() => {
    const coords = getCityCoordinates(userCity);
    setPinLat(coords.lat);
    setPinLng(coords.lng);
  }, [userCity]);

  // Leaflet map initializer for mini map
  useEffect(() => {
    if (activeFlow === 'community' && communityStep === 3 && mapLibraryReady) {
      // Small timeout to allow the div element to paint in DOM
      const timer = setTimeout(() => {
        if (!miniMapContainerRef.current) return;
        
        // Destroy existing map if any
        if (miniMapRef.current) {
          try {
            miniMapRef.current.remove();
          } catch(e) {}
          miniMapRef.current = null;
        }

        const mapObj = L.map(miniMapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([pinLat, pinLng], 15);

        const isDark = document.documentElement.classList.contains('dark');
        const tileUrl = isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, {
          maxZoom: 20
        }).addTo(mapObj);

        // Custom marker pin
        const pinHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-md text-white">
            📍
          </div>
        `;
        const pinIcon = L.divIcon({
          html: pinHtml,
          className: 'custom-pin-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const markerObj = L.marker([pinLat, pinLng], {
          icon: pinIcon,
          draggable: true
        }).addTo(mapObj);

        // Drag updates coordinates
        markerObj.on('dragend', () => {
          const latlng = markerObj.getLatLng();
          setPinLat(latlng.lat);
          setPinLng(latlng.lng);
        });

        // Click map snaps pin
        mapObj.on('click', (e: any) => {
          markerObj.setLatLng(e.latlng);
          setPinLat(e.latlng.lat);
          setPinLng(e.latlng.lng);
        });

        miniMapRef.current = mapObj;
        miniMarkerRef.current = markerObj;
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [activeFlow, communityStep, mapLibraryReady]);

  // Handle preset options
  const handleSelectPreset = (key: 'pothole' | 'garbage' | 'streetlight' | 'leakage') => {
    const preset = MOCK_PRESETS[key];
    setIssuePhoto(preset.img);
    setActivePreset(key);
  };

  // Drag and drop photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActivePreset(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIssuePhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run server side or simulated Gemini analysis
  const handleCallGeminiAnalysis = async () => {
    if (!issuePhoto) return;
    setIsAiLoading(true);
    setCommunityStep(2); // take them to step 2 verification dashboard

    try {
      const response = await fetch('/api/verify-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: issuePhoto,
          category: activePreset ? MOCK_PRESETS[activePreset as keyof typeof MOCK_PRESETS]?.category : 'Waste Pile',
          presetKey: activePreset
        })
      });

      if (!response.ok) {
        throw new Error('Verification network failure');
      }

      const verified = await response.json();
      setEvalCategory(verified.category || 'Waste Pile');
      setEvalSeverity(verified.severity || 'Medium');
      setEvalDesc(verified.description || 'Litter pile spotted close to high pedestrian pathway.');
      setEvalAiSteps(verified.aiSteps || [
        '1. Segregate plastics from degradable items.',
        '2. Place residues in standard heavy trash bags.',
        '3. Alert sanitary drivers for ward garbage collections.'
      ]);
    } catch (err) {
      console.error('Gemini call failed, loading local simulated parameters:', err);
      // Fallback local mock simulation
      const presetData = activePreset ? MOCK_PRESETS[activePreset as keyof typeof MOCK_PRESETS] : {
        category: 'Waste Pile',
        severity: 'Medium' as const,
        description: 'Litter and debris pile logged by user. Requires manual segregation.',
        aiSteps: [
          '1. Assess specific waste material sorting categories (organics vs plastics).',
          '2. Secure non-hazard items with clean standard recycling bins or bags.',
          '3. Report location landmarks to authorized sanitary sweepers.'
        ]
      };

      setEvalCategory(presetData.category);
      setEvalSeverity(presetData.severity);
      setEvalDesc(presetData.description);
      setEvalAiSteps(presetData.aiSteps);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Recycling Material Log
  const triggerSubmitRecycling = () => {
    if (!selectedRecycleCat) return;
    const rate = RECYCLING_RATES[selectedRecycleCat] || 20;
    const calcPts = Math.round(rate * recycleWeight);

    const newLog: LogEntry = {
      id: Date.now(),
      category: selectedRecycleCat,
      icon: selectedRecycleCat === 'Plastic' ? '🥤' : selectedRecycleCat === 'Paper' ? '📰' : selectedRecycleCat === 'Organic' ? '🍌' : selectedRecycleCat === 'Metal' ? '🥫' : selectedRecycleCat === 'Glass' ? '🍾' : '🔌',
      weight: recycleWeight,
      points: calcPts,
      timestamp: Date.now(),
      notes: recycleNotes.trim() || undefined
    };

    onAddLog(newLog);
    setRecycleNotes('');
    onNavigateToDashboard();
  };

  // Submit Community Issue report
  const triggerSubmitIssue = () => {
    const freshIssue: IssueReport = {
      id: Date.now(),
      category: evalCategory,
      severity: evalSeverity,
      description: evalDesc,
      lat: pinLat,
      lng: pinLng,
      status: 'Reported',
      upvotes: 0,
      voters: [],
      timestamp: Date.now(),
      reporter: 'Arjun Mehta', // standard User
      imageUrl: issuePhoto || undefined,
      aiSteps: evalAiSteps
    };

    onAddIssue(freshIssue);
    onNavigateToDashboard();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto" id="report-lodge-panel">
      
      {/* INITIAL SELECTION FORM TYPE */}
      {activeFlow === null && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Choose Action Type 🚀</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">Select standard recycling tracking or lodge a community issue alert.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logistics Card 1 */}
            <motion.button
              id="choice-recycling"
              whileTap={{ scale: 0.98 }}
              onClick={() => { setActiveFlow('recycling'); setRecyclingStep(1); }}
              className="flex flex-col items-start text-left p-6 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-green-50/20 dark:hover:bg-green-950/10 hover:border-green-200 dark:hover:border-green-900 transition-all shadow-sm hover:shadow-md outline-none cursor-pointer w-full"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-450 flex items-center justify-center font-bold text-xl mb-4 border border-green-100 dark:border-green-900/50">
                ♻️
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-zinc-200">Log Recycling Material</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">Sort plastics, papers, e-waste, metal tins at home. Estimate weight in kg, log details, and immediately claim verified Eco Points.</p>
            </motion.button>

            {/* Logistics Card 2 */}
            <motion.button
              id="choice-community"
              whileTap={{ scale: 0.98 }}
              onClick={() => { setActiveFlow('community'); setCommunityStep(1); }}
              className="flex flex-col items-start text-left p-6 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-orange-50/10 dark:hover:bg-orange-950/10 hover:border-orange-200 dark:hover:border-orange-900 transition-all shadow-sm hover:shadow-md outline-none cursor-pointer w-full"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-450 flex items-center justify-center font-bold text-xl mb-4 border border-orange-100 dark:border-orange-900/50">
                🚨
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-zinc-200">Report Community Issue</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">Pin active potholes, garbage piles, damaged street lamps, drainage blocks, or water spots to keep municipal staff alarmed.</p>
            </motion.button>
          </div>
        </div>
      )}

      {/* 1. RECYCLING FLOW SECTION */}
      {activeFlow === 'recycling' && (
        <div className="space-y-6">
          {/* Header indicator bar */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
            <motion.button
              id="recycling-cancel-btn"
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveFlow(null); setSelectedRecycleCat(null); setRecycleNotes(''); }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 transition-all cursor-pointer outline-none"
            >
              Cancel
            </motion.button>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${recyclingStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-600'}`}>1</span>
              <div className="w-8 h-[2px] bg-gray-100 dark:bg-zinc-850"></div>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${recyclingStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-600'}`}>2</span>
              <div className="w-8 h-[2px] bg-gray-100 dark:bg-zinc-850"></div>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${recyclingStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-600'}`}>3</span>
            </div>
          </div>

          {/* STEP 1: CHOOSE CATEGORY */}
          {recyclingStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">Select Material Category</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Choose the primary Sorted item you would like to log.</p>
              </div>

              {/* Voice Input Assistant Card */}
              <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 dark:from-emerald-950/10 dark:to-green-950/10 border border-green-500/10 dark:border-green-500/20 rounded-2xl p-4 space-y-3" id="recycle-voice-assistant">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-base select-none">
                      🎙️
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                        Voice Log Assistant
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                        Speak to automatically select category and weight (e.g. "5 kg of Plastic")
                      </p>
                    </div>
                  </div>

                  <button
                    id="voice-mic-trigger-btn"
                    type="button"
                    onClick={startSpeechRecognition}
                    disabled={isListening}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95 ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 animate-pulse'
                        : 'bg-white dark:bg-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 border-gray-200 dark:border-zinc-750'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Listening...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        <span>Tap to Speak</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Active Transcription or Voice Notes */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-gray-400 dark:text-zinc-550 uppercase tracking-widest">
                    Transcribed Recycling Description
                  </label>
                  <div className="relative">
                    <input
                      id="recycle-voice-transcription-input"
                      type="text"
                      placeholder='e.g., "Logged 5 kg of Plastic cups"'
                      value={recycleNotes}
                      onChange={(e) => setRecycleNotes(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-950 text-xs font-semibold border border-gray-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 outline-none text-gray-700 dark:text-zinc-300 placeholder:text-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all shadow-3xs"
                    />
                  </div>
                  
                  {isListening && (
                    <p className="text-[9px] text-red-500 font-bold animate-pulse">
                      ● Microphone active. Speak clearly now (e.g., "Logged 2 kg of metal cans").
                    </p>
                  )}

                  {voiceError && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                      ⚠ {voiceError}
                    </p>
                  )}

                  {!voiceError && !isListening && recycleNotes && (
                    <p className="text-[9px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Auto-parsed: check matching category & weight below!
                    </p>
                  )}
                </div>

                {/* Voice Simulation Presets */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100/35 dark:border-zinc-800/35" id="voice-presets-selector">
                  <span className="block text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                    Or Simulate Voice Input (Highly recommended for sandboxed browsers)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => parseVoiceText('Logged 4.5 kg of Plastic bottles')}
                      className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-gray-55 dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-650 dark:text-zinc-300 transition-all border border-gray-200 dark:border-zinc-800 cursor-pointer"
                    >
                      "4.5 kg of Plastic"
                    </button>
                    <button
                      type="button"
                      onClick={() => parseVoiceText('Reclaimed 12 kg of organic kitchen food waste')}
                      className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-gray-55 dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-650 dark:text-zinc-300 transition-all border border-gray-200 dark:border-zinc-800 cursor-pointer"
                    >
                      "12 kg of Organic"
                    </button>
                    <button
                      type="button"
                      onClick={() => parseVoiceText('Collected three kilograms of metal soda cans')}
                      className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-gray-55 dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-650 dark:text-zinc-300 transition-all border border-gray-200 dark:border-zinc-800 cursor-pointer"
                    >
                      "three kg of Metal"
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.keys(RECYCLING_RATES).map((catName) => {
                  const icon = catName === 'Plastic' ? '🥤' : catName === 'Paper' ? '📰' : catName === 'Organic' ? '🍌' : catName === 'Metal' ? '🥫' : catName === 'Glass' ? '🍾' : '🔌';
                  return (
                    <button
                      key={catName}
                      onClick={() => setSelectedRecycleCat(catName)}
                      className={`p-4 border text-center rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${selectedRecycleCat === catName ? 'ring-2 ring-green-600 bg-green-50/20 dark:bg-green-950/20 border-green-200 dark:border-green-800/65 shadow-sm' : 'border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'}`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">{catName}</span>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">{RECYCLING_RATES[catName]} pts/kg</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  id="log-next-1"
                  disabled={!selectedRecycleCat}
                  onClick={() => setRecyclingStep(2)}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                >
                  Configure Weight
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE WEIGHT */}
          {recyclingStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">Specify Estimated Weight</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Scale the total volume in kilograms to count estimated points.</p>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 p-6 rounded-2xl flex flex-col items-center justify-center max-w-md mx-auto relative">
                <span className="absolute top-3 left-4 text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border dark:border-emerald-900/30 font-bold px-2 py-0.5 rounded">
                  Rate: {RECYCLING_RATES[selectedRecycleCat!] || 20} pts/kg
                </span>
                <div className="text-sm font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-4">Calculated Volume</div>
                
                {/* Incrementor system */}
                <div className="flex items-center gap-6 my-4">
                  <button
                    onClick={() => setRecycleWeight(prev => Math.max(0.1, prev - 0.25))}
                    className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 flex items-center justify-center font-bold text-lg text-gray-600 dark:text-zinc-300 select-none shadow-sm cursor-pointer"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-gray-800 dark:text-zinc-100" id="weight-val">{recycleWeight.toFixed(2)}</span>
                    <span className="text-lg font-bold text-gray-500 dark:text-zinc-400 ml-1">kg</span>
                  </div>
                  <button
                    onClick={() => setRecycleWeight(prev => prev + 0.25)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 flex items-center justify-center font-bold text-lg text-gray-600 dark:text-zinc-300 select-none shadow-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-2.5 mt-2">
                  {[0.5, 1.0, 5.0, 10.0].map(p => (
                    <button
                      key={p}
                      onClick={() => setRecycleWeight(p)}
                      className={`px-3 py-1.5 text-xs font-bold border rounded-lg transition-all cursor-pointer ${recycleWeight === p ? 'bg-green-700 border-green-700 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700'}`}
                    >
                      +{p}kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Points Preview */}
              <div className="text-center">
                <div className="text-xs font-bold text-gray-400 dark:text-zinc-550 uppercase tracking-wide">Points Reward Preview</div>
                <div className="text-3xl font-black text-green-600 dark:text-green-400 mt-1" id="pts-preview">
                  +{Math.round((RECYCLING_RATES[selectedRecycleCat!] || 20) * recycleWeight)} pts
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setRecyclingStep(1)}
                  className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 hover:text-gray-750 dark:hover:text-zinc-200 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Category
                </button>
                <button
                  id="log-next-2"
                  onClick={() => setRecyclingStep(3)}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Confirm & Submission
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMISSION OVERVIEW */}
          {recyclingStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">Review Your Entry</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Review logistics details before permanent logging.</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-md mx-auto">
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-850">
                  <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Material category</span>
                  <span className="text-sm font-black text-gray-800 dark:text-zinc-200" id="conf-cat">
                    {selectedRecycleCat}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-850">
                  <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Total weight</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-zinc-300" id="conf-weight">
                    {recycleWeight.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-850">
                  <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Points awarded</span>
                  <span className="text-sm font-black text-green-600 dark:text-green-400" id="conf-pts">
                    +{Math.round((RECYCLING_RATES[selectedRecycleCat!] || 20) * recycleWeight)} pts
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Logging timestamp</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-zinc-400" id="conf-time">
                    {new Date().toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {recycleNotes && (
                  <div className="py-2.5 border-t border-gray-50 dark:border-zinc-850/60">
                    <span className="text-xs text-gray-400 dark:text-zinc-550 font-black uppercase tracking-wider block mb-1">🎙️ Voice Transcription Notes</span>
                    <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 italic bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-850">
                      "{recycleNotes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setRecyclingStep(2)}
                  className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 hover:text-gray-750 dark:hover:text-zinc-200 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Weight
                </button>
                <button
                  id="btn-submit-log"
                  onClick={triggerSubmitRecycling}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  ⚡ Record Recycling Log
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. COMMUNITY REPORT FLOW SECTION */}
      {activeFlow === 'community' && (
        <div className="space-y-6">
          {/* Header indicator bar */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-zinc-800">
            <button
              id="com-cancel-btn"
              onClick={() => { setActiveFlow(null); setIssuePhoto(null); setActivePreset(null); }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${communityStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-650'}`}>1</span>
              <div className="w-8 h-[2px] bg-gray-100 dark:bg-zinc-850"></div>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${communityStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-650'}`}>2</span>
              <div className="w-8 h-[2px] bg-gray-100 dark:bg-zinc-850"></div>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${communityStep >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-650'}`}>3</span>
              <div className="w-8 h-[2px] bg-gray-100 dark:bg-zinc-850"></div>
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${communityStep >= 4 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-650'}`}>4</span>
            </div>
          </div>

          {/* STEP 1: CHOOSE PHOTO / MOCK PRESET */}
          {communityStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">Upload Photo of the Issue</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Take an active photo of the sewage, water leak, waste pile, or pothole.</p>
              </div>

              {/* Photo Upload Box */}
              <div className="max-w-md mx-auto">
                <div
                  id="image-upload-area"
                  className="border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl p-6 hover:border-orange-400 dark:hover:border-orange-550 hover:bg-orange-50/5 dark:hover:bg-orange-950/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer min-h-[220px]"
                  onClick={() => document.getElementById('com-file-input')?.click()}
                >
                  {issuePhoto ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-sm">
                      <img src={issuePhoto} alt="Lodge preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold opacity-0 hover:opacity-100 transition-all">
                        Change Photo
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-gray-500 dark:text-zinc-400">
                      <div className="inline-flex p-3 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold">Upload issue image file</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">Drag-and-drop or select standard JPEG image from folder</p>
                    </div>
                  )}
                  <input
                    id="com-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Presets Grid */}
                <div className="mt-6 border-t border-gray-100 dark:border-zinc-800 pt-5">
                  <div className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-center mb-3">⚡ Camera presets for simulation logic</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="preset-pothole"
                      onClick={() => handleSelectPreset('pothole')}
                      className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${activePreset === 'pothole' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-350 dark:hover:border-zinc-700'}`}
                    >
                      🕳️ Deep Pothole
                    </button>
                    <button
                      id="preset-garbage"
                      onClick={() => handleSelectPreset('garbage')}
                      className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${activePreset === 'garbage' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-350 dark:hover:border-zinc-700'}`}
                    >
                      🗑️ Sidewalk Waste Pile
                    </button>
                    <button
                      id="preset-streetlight"
                      onClick={() => handleSelectPreset('streetlight')}
                      className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${activePreset === 'streetlight' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-350 dark:hover:border-zinc-700'}`}
                    >
                      💡 Dead Streetlight
                    </button>
                    <button
                      id="preset-leakage"
                      onClick={() => handleSelectPreset('leakage')}
                      className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${activePreset === 'leakage' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-350 dark:hover:border-zinc-700'}`}
                    >
                      💧 Water Pipeline Leak
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  id="com-next-1"
                  disabled={!issuePhoto}
                  onClick={handleCallGeminiAnalysis}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                >
                  🤖 Call Gemini Vision AI
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GEMINI VISION AI VERIFICATION */}
          {communityStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">AI Evaluation Overview 🤖</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Gemini Flash evaluates waste category integrity, lists severities, and recommends actions.</p>
              </div>

              {isAiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3" id="ai-analysis-loading">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-gray-700 dark:text-zinc-300 animate-pulse">Running Gemini Vision Classifier...</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Verifying photo integrity on server-side model</p>
                </div>
              ) : (
                <div className="space-y-6" id="ai-analysis-result">
                  {/* Category, Severity Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 p-4 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Evaluated Category</label>
                      <select
                        id="com-ai-cat-select"
                        value={evalCategory}
                        onChange={(e) => setEvalCategory(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-gray-800 dark:text-zinc-200"
                      >
                        <option value="Waste Pile">Waste Pile</option>
                        <option value="Pothole">Pothole</option>
                        <option value="Damaged Streetlight">Damaged Streetlight</option>
                        <option value="Water Leakage">Water Leakage</option>
                        <option value="Open Sewerage">Open Sewerage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Severity Level</label>
                      <select
                        id="com-ai-sev-select"
                        value={evalSeverity}
                        onChange={(e) => setEvalSeverity(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-gray-800 dark:text-zinc-200"
                      >
                        <option value="Low">Low Severity</option>
                        <option value="Medium">Medium Severity</option>
                        <option value="High">High Severity</option>
                      </select>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Description Detail</label>
                    <textarea
                      id="com-ai-desc"
                      rows={2}
                      value={evalDesc}
                      onChange={(e) => setEvalDesc(e.target.value)}
                      className="w-full p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 text-gray-800 dark:text-zinc-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* AI Suggested steps */}
                  <div className="border border-orange-100 dark:border-orange-900/30 bg-orange-50/25 dark:bg-orange-950/15 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-orange-800 dark:text-orange-450 flex items-center gap-1.5 mb-2">
                      <CheckSquare className="w-4 h-4" /> Recommended Cleanup Steps
                    </h4>
                    <ul className="space-y-2 text-xs text-orange-900 dark:text-zinc-300 font-medium">
                      {evalAiSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-2 leading-relaxed">
                           <span className="text-orange-500 font-black flex-shrink-0">✔</span>
                          <div>{step}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setCommunityStep(1)}
                      className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Retro-Photo
                    </button>
                    <button
                      id="com-next-2"
                      onClick={() => setCommunityStep(3)}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Pin exact Location
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: EXACT COORDINATES PINNING */}
          {communityStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">Pin Location coordinates</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Drag marker pin or tap anywhere on the map grid to locking issue lat/lng.</p>
              </div>

              {/* Map Holder */}
              <div className="relative border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div id="com-minimap" ref={miniMapContainerRef} className="w-full h-64 bg-gray-100 dark:bg-zinc-950"></div>
                {!mapLibraryReady && (
                  <div className="absolute inset-0 bg-gray-50/80 dark:bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-[2000]">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-bold">Connecting to map library...</span>
                  </div>
                )}
                
                {/* Visual coordinate badge */}
                <div className="absolute top-4 left-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-md rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-600 dark:text-zinc-300 border border-gray-100 dark:border-zinc-800 flex items-center gap-1 z-[1000]">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>{pinLat.toFixed(5)}, {pinLng.toFixed(5)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCommunityStep(2)}
                  className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> AI details
                </button>
                <button
                  id="com-next-3"
                  onClick={() => setCommunityStep(4)}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Review Summary & Submit
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW AND SUBMIT REPORT */}
          {communityStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-950 dark:text-zinc-100">Review Report Summary</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-550">Please audit the details before broadcasting on neighborhood maps.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm max-w-xl mx-auto">
                <div className="space-y-3.5">
                  <div className="border-b border-gray-50 dark:border-zinc-800 pb-2 flex justify-between">
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Category</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                      {getCategoryEmoji(evalCategory)} {evalCategory}
                    </span>
                  </div>
                  <div className="border-b border-gray-50 dark:border-zinc-800 pb-2 flex justify-between">
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Severity</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${evalSeverity === 'High' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400' : evalSeverity === 'Medium' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-850 dark:text-orange-400' : 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400'}`}>
                      {evalSeverity}
                    </span>
                  </div>
                  <div className="border-b border-gray-50 dark:border-zinc-800 pb-2 flex justify-between">
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Coordinates</span>
                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">
                      {pinLat.toFixed(4)}, {pinLng.toFixed(4)}
                    </span>
                  </div>
                  <div className="border-b border-gray-50 dark:border-zinc-800 pb-2 flex justify-between">
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase">Points claimed</span>
                    <span className="text-xs font-black text-green-600 dark:text-green-400">
                      +{POINTS_REPORT_ISSUE} pts
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 dark:text-zinc-500 font-semibold uppercase mb-1">Generated Issue Context</span>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 italic max-h-16 overflow-y-auto font-medium">"{evalDesc}"</p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 w-full h-40 shadow-sm bg-gray-50 dark:bg-zinc-950">
                  {issuePhoto && <img src={issuePhoto} alt="Lodge confirm preview" className="w-full h-full object-cover" />}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCommunityStep(3)}
                  className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-850 text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Map GPS Pin
                </button>
                <button
                  id="btn-submit-issue"
                  onClick={triggerSubmitIssue}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  ⚡ Publish Alert Map Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
