/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelThreshold } from './types';

export const RECYCLING_RATES: Record<string, number> = {
  'Plastic': 30,
  'Paper': 20,
  'Organic': 15,
  'Metal': 50,
  'Glass': 25,
  'E-Waste': 80,
};

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { min: 0, title: 'Waste Warrior', icon: '🌱' },
  { min: 500, title: 'Green Scout', icon: '🌿' },
  { min: 1500, title: 'Eco Ranger', icon: '🌳' },
  { min: 3500, title: 'Planet Guardian', icon: '🌍' },
  { min: 7000, title: 'Eco Champion', icon: '👑' },
  { min: 15000, title: 'Eco Master', icon: '🏆' },
];

export const DAILY_POINTS_GOAL = 500;
export const POINTS_REPORT_ISSUE = 50;
export const POINTS_VERIFY_ISSUE = 15;
export const POINTS_RESOLVE_ISSUE = 100;

export const getCityCoordinates = (cityName: string = 'Mumbai'): { lat: number; lng: number } => {
  const norm = cityName.trim().toLowerCase();
  if (norm.includes('mumbai')) return { lat: 19.0760, lng: 72.8777 };
  if (norm.includes('delhi')) return { lat: 28.6139, lng: 77.2090 };
  if (norm.includes('bangalore') || norm.includes('bengaluru')) return { lat: 12.9716, lng: 77.5946 };
  if (norm.includes('hyderabad')) return { lat: 17.3850, lng: 78.4867 };
  if (norm.includes('chennai')) return { lat: 13.0827, lng: 80.2707 };
  if (norm.includes('pune')) return { lat: 18.5204, lng: 73.8567 };
  if (norm.includes('kolkata')) return { lat: 22.5726, lng: 88.3639 };
  if (norm.includes('ahmedabad')) return { lat: 23.0225, lng: 72.5714 };
  return { lat: 19.0760, lng: 72.8777 }; // Default Mumbai
};

export const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    'Waste Pile': '🗑️',
    'Pothole': '🕳️',
    'Damaged Streetlight': '💡',
    'Water Leakage': '💧',
    'Open Sewerage': '☣️',
  };
  return emojis[category] || '📍';
};

export const getLevelForPoints = (totalPoints: number): LevelThreshold => {
  let level = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalPoints >= threshold.min) {
      level = threshold;
    }
  }
  return level;
};

export const getLevelProgress = (totalPoints: number): number => {
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalPoints < LEVEL_THRESHOLDS[i + 1].min) {
      const range = LEVEL_THRESHOLDS[i + 1].min - LEVEL_THRESHOLDS[i].min;
      const done = totalPoints - LEVEL_THRESHOLDS[i].min;
      return done / range;
    }
  }
  return 1.0;
};

export const MOCK_PRESETS = {
  pothole: {
    category: 'Pothole',
    severity: 'High' as const,
    description: 'Dangerous, deep pothole in the middle of a busy avenue. Two-wheelers are at high risk of accidents.',
    aiSteps: [
      '1. Clean the pothole cavity from dirt, aggregate, and structural moisture.',
      '2. Prime aggregate floor and apply customized cold structural asphalt compound.',
      '3. Compact utilizing solid heavy metal hand tamping tools for visual level confirmation.'
    ],
    img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800&auto=format&fit=crop'
  },
  garbage: {
    category: 'Waste Pile',
    severity: 'High' as const,
    description: 'A large garbage pile overflowing on the sidewalk near the residential gate. Bad odor and health hazard.',
    aiSteps: [
      '1. Assess specific waste material sorting categories (organics vs plastics).',
      '2. Secure non-recyclables in industrial thick poly trash bags securely.',
      '3. Request local municipal trash container pickups or drop off at recycling center.'
    ],
    img: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=800&auto=format&fit=crop'
  },
  streetlight: {
    category: 'Damaged Streetlight',
    severity: 'Medium' as const,
    description: 'Flickering street light at the corner. The lane becomes pitch dark, raising safety concerns for pedestrians.',
    aiSteps: [
      '1. Take exact note of structural ID marker values on base metal of lamp post.',
      '2. Raise automated electricity board ticket requesting local technical support.',
      '3. Exchange flickering high pressure sodium lamp with green low-energy smart light emitting diodes.'
    ],
    img: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=800&auto=format&fit=crop'
  },
  leakage: {
    category: 'Water Leakage',
    severity: 'Medium' as const,
    description: 'Municipal water pipe leaking clean drinking water onto the street. Creating a swampy puddle.',
    aiSteps: [
      '1. Shut main plumbing line block valve immediately upstream of burst.',
      '2. Prime pipe crack and fix with heavy-duty elastic vinyl plumbing wrapper sealant.',
      '3. Clamp metal pipe compression sleeves tightly to seal structural fracturing.'
    ],
    img: 'https://images.unsplash.com/photo-1585241936939-be4099dec914?q=80&w=800&auto=format&fit=crop'
  }
};

export const seedMockIssues = (cityName: string = 'Mumbai') => {
  const coords = getCityCoordinates(cityName);
  return [
    {
      id: 1001,
      category: 'Waste Pile',
      description: 'Large pile of plastic bottles and cardboard blocking the pedestrian footpath near the market area. Needs urgent clearance.',
      severity: 'High' as const,
      lat: coords.lat + 0.003,
      lng: coords.lng + 0.004,
      status: 'Reported' as const,
      upvotes: 4,
      voters: [] as string[],
      timestamp: Date.now() - 36 * 3600 * 1000,
      reporter: 'Sneha Patil',
      imageUrl: MOCK_PRESETS.garbage.img,
      aiSteps: MOCK_PRESETS.garbage.aiSteps,
      comments: [
        {
          id: 'c1',
          author: 'Sneha Patil',
          text: 'Let\'s organize a group clean-up here this Saturday at 9:00 AM! Bring gloves and heavy-duty bags if you have them.',
          timestamp: Date.now() - 32 * 3600 * 1000
        },
        {
          id: 'c2',
          author: 'Amit Sharma',
          text: 'Great initiative! I can bring 5 biodegradable trash bags and a handcart to haul the bottles to the nearest recycling hub.',
          timestamp: Date.now() - 28 * 3600 * 1000
        },
        {
          id: 'c3',
          author: 'Rohan Verma',
          text: 'I\'ll be there to help! Let\'s meet up right next to the fruit vendor corner. Hope more neighbors join us.',
          timestamp: Date.now() - 24 * 3600 * 1000
        }
      ]
    },
    {
      id: 1002,
      category: 'Pothole',
      description: 'Deep pothole in the middle of the road, dangerous for two-wheelers especially during rains.',
      severity: 'High' as const,
      lat: coords.lat - 0.004,
      lng: coords.lng - 0.003,
      status: 'Verified' as const,
      upvotes: 12,
      voters: [] as string[],
      timestamp: Date.now() - 48 * 3600 * 1000,
      reporter: 'Rohan Verma',
      imageUrl: MOCK_PRESETS.pothole.img,
      aiSteps: MOCK_PRESETS.pothole.aiSteps,
      comments: [
        {
          id: 'c4',
          author: 'Rohan Verma',
          text: 'Please drive slow here. The pothole is quite deep and gets filled with water during sudden downpours, making it invisible!',
          timestamp: Date.now() - 45 * 3600 * 1000
        },
        {
          id: 'c5',
          author: 'Priya Nair',
          text: 'I submitted a complaint to the municipal ward authority. They confirmed receiving the coordinates and mentioned a repair crew will arrive by next Tuesday.',
          timestamp: Date.now() - 40 * 3600 * 1000
        }
      ]
    },
    {
      id: 1003,
      category: 'Damaged Streetlight',
      description: 'Streetlight is flickering and mostly dark. Makes the alley unsafe for walking at night.',
      severity: 'Medium' as const,
      lat: coords.lat + 0.002,
      lng: coords.lng - 0.005,
      status: 'Resolved' as const,
      upvotes: 8,
      voters: [] as string[],
      timestamp: Date.now() - 72 * 3600 * 1000,
      reporter: 'Ananya Iyer',
      imageUrl: MOCK_PRESETS.streetlight.img,
      resolvedImageUrl: 'https://images.unsplash.com/photo-1509398530224-3bb5f2f45550?q=80&w=800&auto=format&fit=crop',
      aiSteps: MOCK_PRESETS.streetlight.aiSteps,
      comments: [
        {
          id: 'c6',
          author: 'Ananya Iyer',
          text: 'Very dark here in the evening. It\'s better to avoid walking alone here after 8:00 PM until this is fixed.',
          timestamp: Date.now() - 70 * 3600 * 1000
        },
        {
          id: 'c7',
          author: 'Sneha Patil',
          text: 'The Municipal authority resolved it! The streetlight has been replaced with a brand new, highly energy-efficient bright LED. Feels super safe now!',
          timestamp: Date.now() - 65 * 3600 * 1000
        }
      ]
    }
  ];
};

export const REWARD_ITEMS = [
  {
    id: 1,
    title: 'Reusable Organic Cotton Tote Bag',
    pointsCost: 300,
    icon: '👜',
    description: 'Heavy duty, biodegradable bag to completely replace single-use plastic grocery bags.'
  },
  {
    id: 2,
    title: 'Zero-Waste Bamboo Toothbrush Duo',
    pointsCost: 150,
    icon: '🪥',
    description: 'Two premium plant-based charcoal bristled brushes with 100% compostable bamboo handles.'
  },
  {
    id: 3,
    title: '$5 Eco-Fashion Coupon',
    pointsCost: 400,
    icon: '🏷️',
    description: 'Get five dollars off high-quality organic wardrobe items at sustainable apparel partners.'
  },
  {
    id: 4,
    title: 'Adopt-A-Tree Plantation Certificate',
    pointsCost: 1000,
    icon: '🌳',
    description: 'We will plant and care for a native mahogany or teak sapling in your name, complete with GPS tracking.'
  },
  {
    id: 5,
    title: 'Solar Portable Phone Charger',
    pointsCost: 2500,
    icon: '☀️',
    description: 'High efficiency solar panel power bank (10,000 mAh) for standard USB devices.'
  }
];
