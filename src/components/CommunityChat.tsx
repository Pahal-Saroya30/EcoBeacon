/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Circle, 
  RefreshCw, 
  Sparkles, 
  Smile, 
  Info,
  Building2,
  Trash2,
  Medal,
  Flame,
  X,
  Menu,
  ChevronDown,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { getLevelForPoints } from '../utils';

interface CommunityChatProps {
  user: User;
}

interface ChatMessage {
  id: string;
  name: string;
  email: string;
  city: string;
  content: string;
  timestamp: number;
  points: number;
  tempId?: string;
}

interface OnlineMember {
  name: string;
  email: string;
  points: number;
}

const QUICK_REPLIES = [
  'Saturday park clean-up? 🌲',
  'Bins on 5th Avenue are empty! ♻️',
  'Streetlight resolved! 💡',
  'Composting at home today! 🍂',
  'Just hit a new Eco Level! 🏆',
  'Logged 5kg of plastic today! 🥤'
];

// Client-side lightweight image compression using HTML5 Canvas
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Auto-detect and parse URLs & Base64 images
const parseMessageContent = (content: string) => {
  const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp)(?:\?.*)?$/i;
  const images: string[] = [];
  const links: string[] = [];
  
  // Find Base64 data URLs (which represent direct image uploads)
  const dataUrlRegex = /data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+/g;
  const dataUrlMatches = content.match(dataUrlRegex) || [];
  dataUrlMatches.forEach(img => {
    if (!images.includes(img)) {
      images.push(img);
    }
  });

  // Find standard http/https web URLs
  const webUrlRegex = /https?:\/\/[^\s]+/gi;
  const webUrlMatches = content.match(webUrlRegex) || [];
  webUrlMatches.forEach(url => {
    // Strip trailing punctuation often copied alongside URLs
    const cleanedUrl = url.replace(/[),.;>\]]+$/, '');
    
    if (IMAGE_EXT_REGEX.test(cleanedUrl)) {
      if (!images.includes(cleanedUrl)) {
        images.push(cleanedUrl);
      }
    } else {
      if (!links.includes(cleanedUrl)) {
        links.push(cleanedUrl);
      }
    }
  });

  // Clean the visible text by removing huge Base64 blocks to prevent chat bubble bloat
  let visibleText = content;
  visibleText = visibleText.replace(/data:image\/[a-zA-Z+.-]+;base64,[A-Za-z0-9+/=]+/g, '');
  visibleText = visibleText.replace(/!\[.*?\]\(\s*\)/g, ''); // strip empty markdown images
  visibleText = visibleText.trim();

  return {
    visibleText,
    images,
    links
  };
};

// Highlight and linkify URLs in message text
const FormattedMessageText = ({ text, isMe }: { text: string; isMe: boolean }) => {
  if (!text) return null;
  const words = text.split(/(\s+)/);
  return (
    <p className="break-words leading-relaxed">
      {words.map((word, i) => {
        if (/^https?:\/\/[^\s]+/i.test(word)) {
          const cleanedUrl = word.replace(/[),.;>\]]+$/, '');
          return (
            <a
              key={i}
              href={cleanedUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className={`underline break-all inline-flex items-center gap-0.5 font-bold ${
                isMe ? 'text-green-150 hover:text-white' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
              }`}
            >
              {cleanedUrl}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          );
        }
        return <span key={i}>{word}</span>;
      })}
    </p>
  );
};

// Rich OpenGraph-like Preview card for shared URLs
interface LinkPreviewProps {
  url: string;
  key?: any;
}

const LinkPreviewCard = ({ url }: LinkPreviewProps) => {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  let title = "Shared Environmental Reference";
  let description = "Explore this shared community link for educational guidelines, local initiatives, and sustainability checklists.";
  let bgGradient = "from-emerald-50 to-teal-50 dark:from-zinc-950/40 dark:to-teal-950/10";
  let borderStyle = "border-emerald-100/70 dark:border-emerald-900/20";
  let categoryEmoji = "🌱";

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('compost')) {
    title = "Home & Community Composting Tutorial";
    description = "Transform organic table scraps into rich soil amendment. Learn sorting rules and how to operate zero-odor compost cells.";
    bgGradient = "from-amber-50 to-emerald-50 dark:from-zinc-950/40 dark:to-emerald-950/10";
    borderStyle = "border-amber-100/70 dark:border-amber-900/20";
    categoryEmoji = "🍂";
  } else if (lowerUrl.includes('recycle') || lowerUrl.includes('bin')) {
    title = "City Recycling Bins Allocation Rules";
    description = "Essential guide on rigid plastics, clear/colored glass bottles, metals, paperboards, and handling critical electronic waste.";
    bgGradient = "from-blue-50 to-emerald-50 dark:from-zinc-950/40 dark:to-blue-950/10";
    borderStyle = "border-blue-100/70 dark:border-blue-900/20";
    categoryEmoji = "♻️";
  } else if (lowerUrl.includes('cleanup') || lowerUrl.includes('trash') || lowerUrl.includes('walk')) {
    title = "EcoBeacon Neighborhood Trash Walks Checklist";
    description = "Plan, map, and complete neighborhood cleanup drives. Discover safety steps and claim eco-points on the active map.";
    bgGradient = "from-emerald-50 to-yellow-50 dark:from-zinc-950/40 dark:to-yellow-950/10";
    borderStyle = "border-emerald-150/75 dark:border-emerald-900/20";
    categoryEmoji = "🧹";
  } else if (lowerUrl.includes('epa.gov') || lowerUrl.includes('government') || lowerUrl.includes('.gov')) {
    title = "Ecology Directives & Conservation Standards";
    description = "Official municipal environmental regulations, water safety measurements, and verified public trash remediation procedures.";
    bgGradient = "from-slate-50 to-blue-50 dark:from-zinc-950/40 dark:to-slate-900/20";
    borderStyle = "border-slate-200/70 dark:border-slate-800/20";
    categoryEmoji = "🏛️";
  } else if (lowerUrl.includes('wikipedia.org')) {
    title = "Circular Economy & Green Cities Overview";
    description = "Wikipedia definition and context on municipal material feedback loops, product lifecycles, and sustainable architecture.";
    bgGradient = "from-gray-50 to-slate-50 dark:from-zinc-950/40 dark:to-zinc-900/20";
    borderStyle = "border-gray-200/70 dark:border-zinc-800/20";
    categoryEmoji = "📖";
  } else if (lowerUrl.includes('github.com')) {
    title = "EcoBeacon Community Source Code Repository";
    description = "Browse real-time WebSocket messaging servers, interactive map overlays, custom AI verification systems, and submit pull requests.";
    bgGradient = "from-purple-50 to-slate-50 dark:from-zinc-950/40 dark:to-purple-950/10";
    borderStyle = "border-purple-100/70 dark:border-purple-900/20";
    categoryEmoji = "💻";
  }

  return (
    <a
      href={url}
      target="_blank"
      referrerPolicy="no-referrer"
      rel="noopener noreferrer"
      className={`block mt-2 p-3 bg-gradient-to-br ${bgGradient} border ${borderStyle} rounded-2xl shadow-3xs hover:shadow-2xs hover:scale-[1.015] active:scale-[0.985] transition-all group overflow-hidden max-w-[280px] sm:max-w-[340px] text-left`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg select-none mt-0.5 shrink-0 bg-white dark:bg-zinc-900 w-8 h-8 rounded-xl flex items-center justify-center border border-gray-150/75 dark:border-zinc-800 shadow-3xs">
          {categoryEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest truncate max-w-[140px]">
              {hostname}
            </span>
            <span className="text-[7px] bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-black tracking-wider uppercase">PREVIEW</span>
          </div>
          <h4 className="text-[10px] font-black text-gray-900 dark:text-zinc-200 tracking-tight leading-snug mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {title}
          </h4>
          <p className="text-[9px] text-gray-500 dark:text-zinc-400 leading-normal mt-1 block">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
};

// Large inline image preview for shared/uploaded images
interface ImagePreviewProps {
  src: string;
  onZoom: (src: string) => void;
  key?: any;
}

const ImagePreviewPanel = ({ src, onZoom }: ImagePreviewProps) => {
  return (
    <div className="relative mt-2 rounded-2xl overflow-hidden border border-gray-150 dark:border-zinc-800 shadow-3xs max-w-[280px] group select-none bg-gray-50/50 dark:bg-zinc-950/40">
      <img
        src={src}
        alt="Shared chat attachment"
        className="w-full h-auto max-h-[180px] object-cover hover:scale-102 cursor-zoom-in transition-transform duration-200"
        onClick={() => onZoom(src)}
      />
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md backdrop-blur-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Zoom Click
      </div>
    </div>
  );
};

// Full-screen high-quality lightbox image viewer
interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

const ImageLightbox = ({ src, onClose }: LightboxProps) => {
  if (!src) return null;
  
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" id="chat-lightbox-overlay">
      <div
        className="absolute inset-0 cursor-zoom-out"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative max-w-full max-h-[85vh] flex flex-col items-center z-10"
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer outline-none shadow-sm"
          title="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>
        
        <img
          src={src}
          alt="Expanded visual attachment"
          className="rounded-2xl max-w-full max-h-[75vh] object-contain shadow-2xl border border-white/10"
        />
        
        <div className="text-[10px] text-zinc-350 font-extrabold uppercase tracking-widest mt-4 flex items-center gap-1.5 text-center bg-zinc-900/80 px-3.5 py-1.5 rounded-full border border-zinc-800 backdrop-blur-xs">
          <span>Attachment Viewer</span>
          <span className="text-zinc-650">•</span>
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = src;
              link.download = `ecobeacon_shared_img_${Date.now()}.jpg`;
              link.click();
            }} 
            className="text-emerald-400 hover:underline cursor-pointer"
          >
            Download
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function CommunityChat({ user }: CommunityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'polling'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Responsive Drawer & Interaction States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Record<string, { count: number; users: string[] }>>>(() => {
    try {
      const saved = localStorage.getItem(`ecobeacon_chat_reactions_${user.city}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollerRef = useRef<HTMLDivElement | null>(null);

  // Shared Link & Image Upload States
  const [uploadImageBase64, setUploadImageBase64] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const base64 = await compressImage(file);
      setUploadImageBase64(base64);
      // Reset input value so same file can be uploaded again if needed
      e.target.value = '';
    } catch (err) {
      console.error('Error compressing uploaded file:', err);
    }
  };

  // Save reactions to localstorage for active session persistency
  useEffect(() => {
    localStorage.setItem(`ecobeacon_chat_reactions_${user.city}`, JSON.stringify(reactions));
  }, [reactions, user.city]);

  // Connect to WS server
  useEffect(() => {
    let active = true;

    function connect() {
      if (!active) return;
      
      // If we exceeded maximum reconnect attempts, switch permanently to polling mode
      if (reconnectAttempts >= 3) {
        setStatus('polling');
        console.log('Transitioned EcoBeacon Chat cleanly to secure REST HTTP polling mode.');
        return;
      }

      setStatus('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Fallback to absolute local port 3000 if host isn't standard
      let host = window.location.host;
      if (!host || host.includes('localhost:5173') || host.includes('localhost:3001')) {
        host = 'localhost:3000';
      }
      
      const wsUrl = `${protocol}//${host}/api/chat`;
      console.log(`Connecting to Community Chat WS: ${wsUrl}`);

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!active) return;
          console.log('Successfully connected to EcoBeacon Chat WebSocket Server');
          setStatus('connected');
          setReconnectAttempts(0);

          // Join the city specific channel room
          socket.send(JSON.stringify({
            type: 'join',
            payload: {
              name: user.name,
              email: user.email,
              city: user.city,
              points: user.points
            }
          }));
        };

        socket.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'history') {
              setMessages(data.payload);
              scrollToBottom();
            } else if (data.type === 'message') {
              setMessages((prev) => {
                // Deduplicate seed and server broadcasts
                if (prev.some((m) => m.id === data.payload.id)) {
                  return prev;
                }
                // Check if we have an optimistic message with this tempId
                if (data.payload.tempId && prev.some((m) => m.id === data.payload.tempId)) {
                  return prev.map((m) => m.id === data.payload.tempId ? data.payload : m);
                }
                return [...prev, data.payload];
              });
              scrollToBottom();
            } else if (data.type === 'presence') {
              setOnlineCount(data.payload.onlineCount || 1);
              setOnlineMembers(data.payload.members || []);
            }
          } catch (err) {
            console.error('Error decoding WS message payload:', err);
          }
        };

        socket.onclose = () => {
          if (!active) return;
          console.log('Chat WebSocket connection closed');
          
          if (reconnectAttempts < 3) {
            setStatus('disconnected');
            // Reconnect strategy
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            setTimeout(() => {
              setReconnectAttempts((prev) => prev + 1);
              connect();
            }, delay);
          } else {
            setStatus('polling');
          }
        };

        socket.onerror = () => {
          // Quietly handle connection errors to avoid error log spam in sandboxed preview environments
          console.log('WebSocket not available; operating in secure REST HTTP polling mode.');
          socket.close();
        };

      } catch (err) {
        console.log('WebSocket initialization failed; operating in secure REST HTTP polling mode.', err);
        setStatus('polling');
      }
    }

    connect();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user.city, user.name, user.email, user.points, reconnectAttempts]);

  // REST Polling Fallback when WebSocket is offline
  useEffect(() => {
    let intervalId: any = null;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/chat/history?city=${encodeURIComponent(user.city)}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.history);
          setOnlineCount(data.onlineCount || 1);
        }
      } catch (err) {
        console.error('REST Chat History polling error:', err);
      }
    };

    // If not connected, fetch immediately and start polling
    if (status !== 'connected') {
      fetchHistory();
      intervalId = setInterval(fetchHistory, 4000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user.city, status]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBottomBtn(false);
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Show button if scrolled up by more than 200px
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
    setShowScrollBottomBtn(!isNearBottom);
  };

  const sendViaHttp = async (text: string, tempId: string) => {
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: user.city,
          name: user.name,
          email: user.email,
          points: user.points,
          content: text,
          tempId
        })
      });
      if (response.ok) {
        const sentMessage = await response.json();
        setMessages((prev) => {
          // Replace optimistic message with real message
          const filtered = prev.filter(m => m.id !== tempId);
          if (filtered.some(m => m.id === sentMessage.id)) return filtered;
          return [...filtered, sentMessage];
        });
        scrollToBottom();
      } else {
        console.error('Failed to send message via REST fallback');
      }
    } catch (err) {
      console.error('Error in sendViaHttp:', err);
    }
  };

  // Send text message
  const handleSendMessage = async (textToSend?: string) => {
    let text = (textToSend || inputValue).trim();
    
    // Append the base64 image payload if present
    if (uploadImageBase64) {
      text = text ? `${text} ${uploadImageBase64}` : uploadImageBase64;
    }
    
    if (!text) return;

    // Optimistic message creation
    const tempId = `optimistic-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      name: user.name,
      email: user.email,
      city: user.city,
      content: text,
      timestamp: Date.now(),
      points: user.points,
      tempId
    };

    // Clear attachment state
    setUploadImageBase64(null);

    // Append optimistic message
    setMessages((prev) => {
      if (prev.some(m => m.id === tempId)) return prev;
      return [...prev, tempMessage];
    });
    if (!textToSend) {
      setInputValue('');
    }
    scrollToBottom();

    // Check if WebSocket is connected and open
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          type: 'message',
          payload: {
            content: text,
            tempId
          }
        }));
      } catch (wsErr) {
        console.error('Failed to send via WS, attempting HTTP fallback:', wsErr);
        await sendViaHttp(text, tempId);
      }
    } else {
      // Use HTTP fallback to send message
      await sendViaHttp(text, tempId);
    }
  };

  // Handle emoji toggles local-side
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => {
      const msgReactions = prev[messageId] || {};
      const reactionInfo = msgReactions[emoji] || { count: 0, users: [] };
      
      let newUsers = [...reactionInfo.users];
      let newCount = reactionInfo.count;
      
      if (newUsers.includes(user.email)) {
        newUsers = newUsers.filter((u) => u !== user.email);
        newCount = Math.max(0, newCount - 1);
      } else {
        newUsers.push(user.email);
        newCount += 1;
      }
      
      const updatedMsgReactions = {
        ...msgReactions,
        [emoji]: { count: newCount, users: newUsers }
      };
      
      if (newCount === 0) {
        delete updatedMsgReactions[emoji];
      }
      
      return {
        ...prev,
        [messageId]: updatedMsgReactions
      };
    });
  };

  // Styling for level tags
  const getLevelBadgeStyles = (title: string) => {
    switch (title) {
      case 'Waste Warrior':
        return 'bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800';
      case 'Green Scout':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      case 'Eco Ranger':
        return 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30';
      case 'Planet Guardian':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      case 'Eco Champion':
        return 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
      case 'Eco Master':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border-amber-200 dark:border-amber-900/30';
      default:
        return 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700';
    }
  };

  // Check if current message is continuation of the previous message from the same user within 90s
  const isContinuation = (msg: ChatMessage, idx: number) => {
    if (idx === 0) return false;
    const prevMsg = messages[idx - 1];
    const isSameUser = msg.email === prevMsg.email;
    const timeDiff = msg.timestamp - prevMsg.timestamp;
    const isRecent = timeDiff < 90 * 1000;
    return isSameUser && isRecent;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] md:h-[calc(100vh-230px)] min-h-[480px] overflow-hidden" id="community-chat-tab-root">
      
      {/* SIDEBAR: Online Members (Visible on Desktop, hidden on mobile/tablet) */}
      <aside className="hidden lg:flex lg:col-span-4 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl p-5 flex-col gap-4 overflow-hidden shadow-xs" id="chat-sidebar">
        <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-green-600 dark:text-green-400 font-extrabold uppercase tracking-widest">Lobby Directory</span>
            <h3 className="text-sm font-black text-gray-950 dark:text-zinc-150 uppercase tracking-tight mt-0.5 flex items-center gap-1.5">
              📍 {user.city} Chat Room
            </h3>
          </div>
          <span className="text-2xl select-none">💬</span>
        </div>

        {/* Live Network Status Indicator */}
        <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {status === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              )}
            </span>
            <span className="font-extrabold text-gray-600 dark:text-zinc-400">
              {status === 'connected' ? 'Connected Live' : status === 'connecting' ? 'Connecting Node...' : 'HTTP Fallback'}
            </span>
          </div>

          <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-md">
            {onlineCount} neighbor{onlineCount !== 1 ? 's' : ''} live
          </span>
        </div>

        {/* Directory Header */}
        <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 dark:text-zinc-550 uppercase tracking-widest mt-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>Active Neighbors</span>
        </div>

        {/* Interactive scrollable list of active users */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar" id="online-users-scroll">
          {onlineMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50/40 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800/60">
              <span className="text-xl animate-spin mb-1">⏳</span>
              <span className="text-[10px] font-extrabold text-gray-400">Loading member matrix...</span>
            </div>
          ) : (
            <AnimatePresence>
              {onlineMembers.map((member) => {
                const isMe = member.email === user.email;
                const level = getLevelForPoints(member.points);
                return (
                  <motion.div
                    key={member.email}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isMe ? 'bg-green-500/10 border-green-250/30 dark:bg-green-950/15 dark:border-green-900/40 shadow-3xs' : 'bg-gray-50/30 dark:bg-zinc-950/40 border-gray-100 dark:border-zinc-800/50'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar circle */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-3xs">
                        {member.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-950 dark:text-zinc-150 truncate flex items-center gap-1 leading-none">
                          {member.name}
                          {isMe && <span className="text-[8px] font-black bg-green-500 text-white px-1 rounded uppercase tracking-wide">me</span>}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5 block">
                          {level.icon} {level.title}
                        </p>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-450 px-2 py-0.5 rounded-lg border border-yellow-500/20 text-[10px] font-black shrink-0">
                      <Medal className="w-2.5 h-2.5 text-yellow-500" />
                      <span>{member.points}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Action guidelines footer */}
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-2 text-[10px] text-gray-500 dark:text-zinc-400">
          <Info className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="leading-normal font-bold">
            All messages stream live using local WebSockets bound to your city channel. Support and coordinate neighborhood cleanliness drives!
          </p>
        </div>
      </aside>

      {/* MOBILE MEMBERS DRAWER (Saves space on mobile/tablet) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" id="chat-mobile-directory-drawer">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative ml-auto w-80 max-w-[85vw] h-full bg-white dark:bg-[#09090b] shadow-2xl border-l border-gray-150 dark:border-zinc-850 p-5 flex flex-col gap-4 z-10"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-3">
                <div>
                  <span className="text-[9px] text-green-600 dark:text-green-400 font-extrabold uppercase tracking-widest">Lobby Directory</span>
                  <p className="text-sm font-black text-gray-950 dark:text-zinc-150 uppercase tracking-tight mt-0.5">
                    📍 {user.city} Chat Room
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-150 dark:border-zinc-800/60 bg-gray-55 dark:bg-zinc-950/40 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    {status === 'connected' ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    )}
                  </span>
                  <span className="font-extrabold capitalize text-gray-600 dark:text-zinc-400">
                    {status === 'connected' ? 'Connected Live' : 'HTTP Polling'}
                  </span>
                </div>

                <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50 dark:bg-green-950/60 px-1.5 py-0.5 rounded-md">
                  {onlineCount} active
                </span>
              </div>

              {/* Active list inside drawer */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar" id="mobile-online-users-scroll">
                {onlineMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50/40 dark:bg-zinc-950/20 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800/60">
                    <span className="text-xl animate-spin mb-1">⏳</span>
                    <span className="text-[10px] font-bold text-gray-400">Loading neighbors...</span>
                  </div>
                ) : (
                  onlineMembers.map((member) => {
                    const isMe = member.email === user.email;
                    const level = getLevelForPoints(member.points);
                    return (
                      <div
                        key={member.email}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isMe ? 'bg-green-50/20 border-green-200/50 dark:bg-green-950/10 dark:border-green-900/40' : 'bg-gray-50/40 dark:bg-zinc-950/40 border-gray-100 dark:border-zinc-800/50'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7.5 h-7.5 rounded-lg bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 uppercase">
                            {member.name.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-900 dark:text-zinc-150 truncate flex items-center gap-1">
                              {member.name}
                            </p>
                            <p className="text-[8.5px] font-bold text-gray-400 dark:text-zinc-550 uppercase mt-0.5">
                              {level.icon} {level.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-450 px-1.5 py-0.5 rounded-md border border-yellow-500/20 text-[9px] font-black shrink-0">
                          <span>{member.points} pts</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-2 text-[10px] text-gray-500 dark:text-zinc-400 mt-auto">
                <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="leading-normal font-bold">
                  Participate regularly to raise weekly environmental score standards!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHAT FEED CONTAINER (8 columns on desktop) */}
      <main className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl shadow-xs flex flex-col overflow-hidden h-full relative" id="chat-workspace">
        
        {/* DESKTOP HEADER */}
        <header className="hidden sm:flex p-4 border-b border-gray-100 dark:border-zinc-800/80 items-center justify-between bg-gray-50/10 dark:bg-zinc-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 dark:bg-green-500/5 border border-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0 shadow-3xs">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-950 dark:text-zinc-150 uppercase tracking-wide">
                Neighborhood Green Discussions
              </h3>
              <p className="text-[10px] text-gray-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                Discussing trash walks, home composting, and street cleanliness
              </p>
            </div>
          </div>
        </header>

        {/* MOBILE/TABLET COMPACT ROW WITH MINI MEMBERS CAROUSEL */}
        <header className="lg:hidden flex items-center justify-between p-3.5 bg-zinc-50/50 dark:bg-[#0d0d11] border-b border-gray-150 dark:border-zinc-850 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex -space-x-2.5 overflow-hidden">
              {onlineMembers.slice(0, 4).map((member) => (
                <div 
                  key={member.email} 
                  className="w-7.5 h-7.5 rounded-full border-2 border-white dark:border-zinc-900 bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0 shadow-sm uppercase"
                  title={`${member.name}`}
                >
                  {member.name.substring(0, 2)}
                </div>
              ))}
              {onlineMembers.length > 4 && (
                <div className="w-7.5 h-7.5 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-extrabold text-[9px] flex items-center justify-center shrink-0 shadow-sm">
                  +{onlineMembers.length - 4}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-950 dark:text-zinc-200 leading-none">
                Active Neighbors ({onlineCount})
              </p>
              <p className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 flex items-center gap-1 leading-none">
                <span className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-green-500"></span>
                </span>
                Live in {user.city}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-xl text-[10px] font-black text-zinc-600 dark:text-zinc-450 hover:text-emerald-500 flex items-center gap-1 shadow-3xs cursor-pointer transition-colors outline-none"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directory</span>
          </button>
        </header>

        {/* CHAT SCROLLING CANVAS */}
        <div 
          ref={chatScrollerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/10 dark:bg-zinc-950/10 scroll-smooth no-scrollbar" 
          id="chat-scroller"
        >
          {status === 'connecting' && messages.length === 0 ? (
            <div className="space-y-4 animate-pulse p-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`flex gap-3 max-w-[70%] ${n % 2 === 0 ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <span className="text-4xl animate-bounce">🌱</span>
              <h4 className="text-xs font-bold text-gray-700 dark:text-zinc-350">Neighborhood discussion is quiet</h4>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Be the first to say hello, request sorting tips, or schedule a weekend street cleanliness drive with your fellow neighbors!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.email === user.email;
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const level = getLevelForPoints(msg.points);
              const continuation = isContinuation(msg, idx);
              const msgReactions = (reactions[msg.id] || {}) as Record<string, { count: number; users: string[] }>;
              const hasReactions = Object.keys(msgReactions).length > 0;

              return (
                <motion.div 
                  key={msg.id} 
                  initial={continuation ? { opacity: 0, y: 3 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`flex gap-2.5 max-w-[85%] group relative ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'} ${continuation ? 'mt-0.5' : 'mt-3.5'}`}
                >
                  {/* Sender Avatar - shown only if not a continuous message chain */}
                  {!continuation ? (
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-black text-xs uppercase text-white shadow-3xs select-none ${isMe ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-450 dark:bg-zinc-750'}`}>
                      {msg.name.substring(0, 2)}
                    </div>
                  ) : (
                    // Spacing placeholder to keep alignment
                    <div className="w-8 shrink-0" />
                  )}

                  {/* Message Bubble Column */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* Header info (omit if continuation) */}
                    {!continuation && (
                      <div className={`flex items-center gap-1.5 text-[9px] font-extrabold text-gray-400 dark:text-zinc-500 mb-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-black text-gray-800 dark:text-zinc-350">{msg.name}</span>
                        <span className={`px-1 rounded border font-black text-[8px] leading-none py-0.5 ${getLevelBadgeStyles(level.title)}`}>
                          {level.icon} {level.title}
                        </span>
                        <span>{formattedTime}</span>
                      </div>
                    )}

                    {/* Actual Bubble Card */}
                    {(() => {
                      const parsed = parseMessageContent(msg.content);
                      return (
                        <>
                          {parsed.visibleText && (
                            <div className="relative">
                              <div className={`p-3 rounded-2xl text-[11px] font-semibold leading-relaxed shadow-3xs border transition-colors ${
                                isMe 
                                  ? 'bg-emerald-600 text-white border-emerald-700/80 rounded-tr-xs' 
                                  : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-150 border-gray-150 dark:border-zinc-800/80 rounded-tl-xs'
                              }`}>
                                <FormattedMessageText text={parsed.visibleText} isMe={isMe} />
                              </div>

                              {/* Mini hover Quick Emoji Reaction overlay bar (Desktop Only) */}
                              <div className={`absolute top-0 z-10 flex items-center gap-1 bg-white dark:bg-zinc-800 border border-gray-150 dark:border-zinc-700/80 shadow-md rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 ${
                                isMe ? 'left-0 -translate-x-[110%] -translate-y-2' : 'right-0 translate-x-[110%] -translate-y-2'
                              }`}>
                                {['❤️', '👍', '👏', '🌱'].map((emoji) => {
                                  const isSelected = (reactions[msg.id]?.[emoji]?.users || []).includes(user.email);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className={`hover:scale-130 transition-transform p-1 text-xs cursor-pointer rounded-full ${isSelected ? 'bg-emerald-500/10 dark:bg-emerald-400/20' : ''}`}
                                    >
                                      {emoji}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Image attachments preview */}
                          {parsed.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group/img">
                              <ImagePreviewPanel src={img} onZoom={setLightboxImage} />

                              {/* Quick reaction overlay on top of image for image-only messages */}
                              {!parsed.visibleText && imgIdx === 0 && (
                                <div className={`absolute top-2 z-10 flex items-center gap-1 bg-white dark:bg-zinc-800 border border-gray-150 dark:border-zinc-700/80 shadow-md rounded-full px-1.5 py-0.5 opacity-0 group-hover/img:opacity-100 transition-all duration-150 ${
                                  isMe ? 'left-2' : 'right-2'
                                }`}>
                                  {['❤️', '👍', '👏', '🌱'].map((emoji) => {
                                    const isSelected = (reactions[msg.id]?.[emoji]?.users || []).includes(user.email);
                                    return (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                        className={`hover:scale-130 transition-transform p-1 text-xs cursor-pointer rounded-full ${isSelected ? 'bg-emerald-500/10 dark:bg-emerald-400/20' : ''}`}
                                      >
                                        {emoji}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Link previews */}
                          {parsed.links.map((link, linkIdx) => (
                            <LinkPreviewCard key={linkIdx} url={link} />
                          ))}
                        </>
                      );
                    })()}

                    {/* Reaction Display badges */}
                    {hasReactions && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msgReactions).map(([emoji, info]) => {
                          const active = info.users.includes(user.email);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                                active 
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold scale-102' 
                                  : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{info.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Scroll-To-Bottom Floating Widget Button */}
        <AnimatePresence>
          {showScrollBottomBtn && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={scrollToBottom}
              className="absolute bottom-[115px] right-6 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center gap-1 text-[10px] font-black select-none cursor-pointer transition-transform z-20 hover:scale-105 active:scale-95"
            >
              <span>Latest Messages</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* QUICK REPLIES COMPACT HORIZONTAL BAR */}
        <div className="p-2 border-t border-gray-100 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-zinc-950/30 flex gap-1.5 overflow-x-auto select-none no-scrollbar">
          <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 flex items-center gap-1 shrink-0 px-1 uppercase tracking-widest leading-none">
            <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
          </span>
          {QUICK_REPLIES.map((replyText, i) => (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendMessage(replyText)}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 hover:bg-green-500/10 hover:border-green-400 hover:text-green-700 dark:hover:bg-green-950/30 dark:hover:text-green-400 shrink-0 cursor-pointer transition-all outline-none"
            >
              {replyText}
            </motion.button>
          ))}
        </div>

        {/* Image Attachment Upload Preview Indicator */}
        {uploadImageBase64 && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-950/20 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500 shadow-3xs shrink-0 select-none">
              <img src={uploadImageBase64} alt="Pending upload thumbnail" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setUploadImageBase64(null)}
                className="absolute inset-0 bg-black/50 hover:bg-black/65 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider block">Attachment Prepared</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block mt-0.5">Will be broadcast with your next message.</span>
            </div>
          </div>
        )}

        {/* MESSAGE COMPOSER INPUT FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3.5 border-t border-gray-100 dark:border-zinc-800/80 flex items-center gap-2 bg-white dark:bg-zinc-900"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Write message to neighbors in ${user.city}...`}
              className="w-full text-xs font-semibold pl-4 pr-10 py-2.5 rounded-2xl border border-gray-250 dark:border-zinc-850 bg-gray-50/30 dark:bg-zinc-950/30 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
            />
            
            {/* Attachment Button inside Input Field */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors cursor-pointer"
              title="Attach visual file/image"
              id="chat-attach-btn"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            
            {/* Hidden Input field */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <motion.button
            type="submit"
            whileTap={(inputValue.trim() || uploadImageBase64) ? { scale: 0.96 } : {}}
            disabled={!inputValue.trim() && !uploadImageBase64}
            className="px-4 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-gray-100 dark:disabled:bg-zinc-800 text-white disabled:text-gray-400 font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 outline-none shadow-xs"
            title="Send message"
            id="send-chat-message-btn"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </form>

      </main>

      {/* High Quality Lightbox zoom modal */}
      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
