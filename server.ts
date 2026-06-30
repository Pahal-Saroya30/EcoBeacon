/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload bounds for base64 image uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cors());

// Shared server-side Gemini client
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && !API_KEY.startsWith('MY_GEMINI_API_KEY')) {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini AI Client successfully initialized server-side');
  } catch (err) {
    console.error('Error initializing Gemini Client:', err);
  }
} else {
  console.log('Gemini API key is unset or placeholder. Server is running in Demo Mode.');
}

// API endpoint for vision analysis
app.post('/api/verify-issue', async (req, res) => {
  try {
    const { image, category, presetKey } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // 1. If key is unset, use high quality presets or simulated response directly
    if (!ai) {
      console.log('Calling simulated Gemini Vision analysis...');
      return res.json({
        category: category || 'Waste Pile',
        severity: 'Medium',
        description: 'Simulated preview analysis of the reported urban waste issue. Verified visually to determine local cleaning steps.',
        aiSteps: [
          '1. Assess neighborhood waste segregation practices around reported area.',
          '2. Secure non-hazard items with clean standard recycling bins or bags.',
          '3. Report location landmarks to authorized sanitary sweepers.'
        ],
        simulated: true
      });
    }

    // 2. Extract base64 stripped portion or fetch remote image URL
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const parts = image.split(',');
      base64Data = parts[1];
      const mimeMatch = parts[0].match(/data:(.*?);/);
      if (mimeMatch) {
         mimeType = mimeMatch[1];
      }
    } else if (image.startsWith('http://') || image.startsWith('https://')) {
      try {
        console.log(`Downloading preset remote image for Gemini Vision verification: ${image}`);
        const fetchRes = await fetch(image);
        if (!fetchRes.ok) {
          throw new Error(`Failed to download preset image, status code: ${fetchRes.status}`);
        }
        const contentType = fetchRes.headers.get('content-type');
        if (contentType) {
          mimeType = contentType;
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
        console.log(`Successfully converted preset image to base64 data. Mimetype: ${mimeType}`);
      } catch (fetchErr: any) {
        console.error('Error fetching preset remote image:', fetchErr);
        throw new Error(`Could not fetch the remote preset image payload: ${fetchErr.message}`);
      }
    } else {
      base64Data = image;
    }

    if (!base64Data) {
      throw new Error('Could not parse base64 image payload');
    }

    console.log(`Analyzing image payload with mimetype ${mimeType}...`);

    // 3. Invoke `@google/genai`
    const prompt = `Evaluate this uploaded photo from a city reporting application.
Evaluate whether it displays an urban cleanliness or infrastructure issue like potholes, trash/garbage piles, flickering/broken streetlights, plumbing water leaks, or open sewages.
Provide a re-evaluated best fit Category (must be exactly one of: "Waste Pile", "Pothole", "Damaged Streetlight", "Water Leakage", "Open Sewerage"), an appropriate Severity rating ("Low", "Medium", "High"), a short 1-2 sentence human-friendly Description of the issue depicted, and exactly 3 remediation/repaired Action Steps.
You MUST output your response as a valid, parsable JSON matching this structural schema:
{
  "category": "Waste Pile" | "Pothole" | "Damaged Streetlight" | "Water Leakage" | "Open Sewerage",
  "severity": "Low" | "Medium" | "High",
  "description": "Brief description...",
  "aiSteps": [
    "1. Step one details...",
    "2. Step two details...",
    "3. Step three details..."
  ]
}
Return ONLY pure JSON code. Do not include markdown wraps or block markers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text ? response.text.trim() : '';
    console.log('Gemini model response:', rawText);

    // Parse verified payload
    const parsedData = JSON.parse(rawText);
    return res.json(parsedData);

  } catch (err: any) {
    console.error('Server-side Gemini Vision exception:', err);
    res.status(500).json({
      error: 'Gemini AI evaluation failed',
      message: err.message || 'Error executing vision logic'
    });
  }
});

// Start routing hooks with Vite check
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

const chatHistoryByCity: Record<string, ChatMessage[]> = {};

interface ClientConnection {
  socket: WebSocket;
  name: string;
  email: string;
  city: string;
  points: number;
}
const activeClients: Set<ClientConnection> = new Set();

const DEFAULT_CITIES = ['Seattle', 'Greenville', 'Boston', 'San Francisco', 'New York', 'Austin', 'Denver'];
const SEED_TEMPLATES = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah.j@ecocommunity.org',
    content: 'Hey neighbors! Has anyone noticed the new smart bins on 5th Avenue? They seem to have separate sorting for glass now. 🍾',
    points: 340,
    offsetMinutes: 45
  },
  {
    name: 'Marcus Brody',
    email: 'marcus.b@greenmail.net',
    content: 'Yes! Already logged 3 kg of bottles there today. Let’s clean up the Maple Park entrance this Saturday at 9 AM, who is in?',
    points: 150,
    offsetMinutes: 30
  },
  {
    name: 'Elena Rostova',
    email: 'elena.ros@ecocitizen.com',
    content: 'Count me in for Saturday! I’ll bring some extra bio-degradable trash bags. 🍂 Let’s make sure we log our collections on the Eco Map!',
    points: 620,
    offsetMinutes: 15
  },
  {
    name: 'David Kim',
    email: 'd.kim@urbanplan.org',
    content: 'Just reported a flickering streetlight near the recycling depot. Hopefully the city verifies it soon so we can get cleaning points. ⚡',
    points: 90,
    offsetMinutes: 5
  }
];

DEFAULT_CITIES.forEach(city => {
  chatHistoryByCity[city] = SEED_TEMPLATES.map((tpl, i) => ({
    id: `seed-${city}-${i}`,
    name: tpl.name,
    email: tpl.email,
    city,
    content: tpl.content,
    timestamp: Date.now() - tpl.offsetMinutes * 60 * 1000,
    points: tpl.points
  }));
});

// REST Fallback API endpoints for Community Chat
app.get('/api/chat/history', (req, res) => {
  const city = (req.query.city as string) || 'Global';
  if (!chatHistoryByCity[city]) {
    chatHistoryByCity[city] = SEED_TEMPLATES.map((tpl, i) => ({
      id: `seed-${city}-${i}`,
      name: tpl.name,
      email: tpl.email,
      city,
      content: tpl.content.replace('5th Avenue', `${city} Blvd`).replace('Maple Park', `${city} Park`),
      timestamp: Date.now() - tpl.offsetMinutes * 60 * 1000,
      points: tpl.points
    }));
  }
  const cityClients = Array.from(activeClients).filter(c => c.city === city);
  res.json({
    history: chatHistoryByCity[city],
    onlineCount: Math.max(1, cityClients.length)
  });
});

app.post('/api/chat/send', (req, res) => {
  const { city, name, email, points, content, tempId } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }
  const activeCity = city || 'Global';
  
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || 'Anonymous',
    email: email || 'anon@ecobeacon.net',
    city: activeCity,
    content: content.trim(),
    timestamp: Date.now(),
    points: points || 0,
    tempId
  };

  if (!chatHistoryByCity[activeCity]) {
    chatHistoryByCity[activeCity] = [];
  }
  chatHistoryByCity[activeCity].push(newMessage);
  if (chatHistoryByCity[activeCity].length > 150) {
    chatHistoryByCity[activeCity].shift();
  }

  // Also broadcast to any active WebSocket clients
  activeClients.forEach(c => {
    if (c.city === activeCity && c.socket.readyState === WebSocket.OPEN) {
      c.socket.send(JSON.stringify({
        type: 'message',
        payload: newMessage
      }));
    }
  });

  res.json(newMessage);
});

function setupWebSockets(server: any) {
  const wss = new WebSocketServer({ noServer: true });
  console.log('WebSocket Server integrated with HTTP server in standalone mode.');

  server.on('upgrade', (request: any, socket: any, head: any) => {
    try {
      const host = request.headers.host || 'localhost';
      const parsedUrl = new URL(request.url || '', `http://${host}`);
      if (parsedUrl.pathname === '/api/chat') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('WebSocket manual upgrade handling error:', err);
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let clientInfo: ClientConnection | null = null;

    ws.on('message', (messageRaw: string) => {
      try {
        const data = JSON.parse(messageRaw);
        
        if (data.type === 'join') {
          const { name, email, city, points } = data.payload;
          
          if (clientInfo) {
            activeClients.delete(clientInfo);
          }

          clientInfo = {
            socket: ws,
            name: name || 'Anonymous',
            email: email || 'anon@ecobeacon.net',
            city: city || 'Global',
            points: points || 0
          };

          activeClients.add(clientInfo);
          console.log(`User ${clientInfo.name} joined chat for city: ${clientInfo.city}`);

          if (!chatHistoryByCity[clientInfo.city]) {
            chatHistoryByCity[clientInfo.city] = SEED_TEMPLATES.map((tpl, i) => ({
              id: `seed-${clientInfo!.city}-${i}`,
              name: tpl.name,
              email: tpl.email,
              city: clientInfo!.city,
              content: tpl.content.replace('5th Avenue', `${clientInfo!.city} Blvd`).replace('Maple Park', `${clientInfo!.city} Park`),
              timestamp: Date.now() - tpl.offsetMinutes * 60 * 1000,
              points: tpl.points
            }));
          }

          ws.send(JSON.stringify({
            type: 'history',
            payload: chatHistoryByCity[clientInfo.city]
          }));

          broadcastPresence(clientInfo.city);
        }

        else if (data.type === 'message') {
          if (!clientInfo) {
            ws.send(JSON.stringify({ type: 'error', message: 'You must join a city room first' }));
            return;
          }

          const { content, tempId } = data.payload;
          if (!content || !content.trim()) return;

          const newMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: clientInfo.name,
            email: clientInfo.email,
            city: clientInfo.city,
            content: content.trim(),
            timestamp: Date.now(),
            points: clientInfo.points,
            tempId
          };

          chatHistoryByCity[clientInfo.city].push(newMessage);
          if (chatHistoryByCity[clientInfo.city].length > 150) {
            chatHistoryByCity[clientInfo.city].shift();
          }

          broadcastMessage(clientInfo.city, newMessage);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (clientInfo) {
        activeClients.delete(clientInfo);
        broadcastPresence(clientInfo.city);
      }
    });

    ws.on('error', (err) => {
      if (clientInfo) {
        activeClients.delete(clientInfo);
        broadcastPresence(clientInfo.city);
      }
    });
  });

  function broadcastPresence(city: string) {
    const cityClients = Array.from(activeClients).filter(c => c.city === city);
    const onlineCount = cityClients.length;
    const membersList = cityClients.map(c => ({
      name: c.name,
      email: c.email,
      points: c.points
    }));

    const payload = JSON.stringify({
      type: 'presence',
      payload: {
        onlineCount,
        members: membersList
      }
    });

    cityClients.forEach(c => {
      if (c.socket.readyState === WebSocket.OPEN) {
        c.socket.send(payload);
      }
    });
  }

  function broadcastMessage(city: string, msg: ChatMessage) {
    const payload = JSON.stringify({
      type: 'message',
      payload: msg
    });

    activeClients.forEach(c => {
      if (c.city === city && c.socket.readyState === WebSocket.OPEN) {
        c.socket.send(payload);
      }
    });
  }
}

async function initializeServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite HMR Dev Middleware');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Mounted Production Static Server under ${distPath}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoBeacon server running on http://0.0.0.0:${PORT}`);
  });

  // Attach real-time WebSockets to server
  setupWebSockets(server);
}

initializeServer();
