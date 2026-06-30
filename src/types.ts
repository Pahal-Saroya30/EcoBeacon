/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  name: string;
  email: string;
  city: string;
  points: number;
}

export interface Streak {
  count: number;
  lastEntry: string | null; // Date matching Date.toDateString()
}

export interface LogEntry {
  id: number;
  category: string;
  icon: string;
  weight: number;
  points: number;
  timestamp: number;
  notes?: string;
}

export interface IssueComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface IssueReport {
  id: number;
  category: string; // e.g., 'Waste Pile', 'Pothole', 'Damaged Streetlight', 'Water Leakage', 'Open Sewerage'
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  lat: number;
  lng: number;
  status: 'Reported' | 'Verified' | 'Resolved';
  upvotes: number;
  voters: string[]; // List of user emails who upvoted
  timestamp: number;
  reporter: string;
  imageUrl?: string; // base64 or placeholder URL
  resolvedImageUrl?: string; // base64 resolved photo
  aiSteps: string[];
  comments?: IssueComment[];
}

export interface RewardItem {
  id: number;
  title: string;
  pointsCost: number;
  icon: string;
  description: string;
}

export interface LevelThreshold {
  min: number;
  title: string;
  icon: string;
}
