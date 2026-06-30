/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogEntry, IssueReport } from '../types';

const DB_NAME = 'EcoBeaconOfflineDB';
const DB_VERSION = 1;
const LOGS_STORE = 'pending_logs';
const ISSUES_STORE = 'pending_issues';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOGS_STORE)) {
        db.createObjectStore(LOGS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ISSUES_STORE)) {
        db.createObjectStore(ISSUES_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function savePendingLog(log: LogEntry): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOGS_STORE, 'readwrite');
      const store = tx.objectStore(LOGS_STORE);
      const request = store.put(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to save pending log'));
    });
  } catch (err) {
    console.error('IndexedDB Save Log Error:', err);
    // LocalStorage fallback
    const fallback = localStorage.getItem('ecobeacon_fallback_logs') || '[]';
    const list = JSON.parse(fallback);
    list.push(log);
    localStorage.setItem('ecobeacon_fallback_logs', JSON.stringify(list));
  }
}

export async function savePendingIssue(issue: IssueReport): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ISSUES_STORE, 'readwrite');
      const store = tx.objectStore(ISSUES_STORE);
      const request = store.put(issue);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to save pending issue'));
    });
  } catch (err) {
    console.error('IndexedDB Save Issue Error:', err);
    // LocalStorage fallback
    const fallback = localStorage.getItem('ecobeacon_fallback_issues') || '[]';
    const list = JSON.parse(fallback);
    list.push(issue);
    localStorage.setItem('ecobeacon_fallback_issues', JSON.stringify(list));
  }
}

export async function getPendingLogs(): Promise<LogEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOGS_STORE, 'readonly');
      const store = tx.objectStore(LOGS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Failed to fetch pending logs'));
    });
  } catch (err) {
    console.error('IndexedDB Get Logs Error:', err);
    const fallback = localStorage.getItem('ecobeacon_fallback_logs') || '[]';
    return JSON.parse(fallback);
  }
}

export async function getPendingIssues(): Promise<IssueReport[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ISSUES_STORE, 'readonly');
      const store = tx.objectStore(ISSUES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Failed to fetch pending issues'));
    });
  } catch (err) {
    console.error('IndexedDB Get Issues Error:', err);
    const fallback = localStorage.getItem('ecobeacon_fallback_issues') || '[]';
    return JSON.parse(fallback);
  }
}

export async function clearPendingLogs(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOGS_STORE, 'readwrite');
      const store = tx.objectStore(LOGS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to clear pending logs'));
    });
  } catch (err) {
    localStorage.removeItem('ecobeacon_fallback_logs');
  }
}

export async function clearPendingIssues(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ISSUES_STORE, 'readwrite');
      const store = tx.objectStore(ISSUES_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to clear pending issues'));
    });
  } catch (err) {
    localStorage.removeItem('ecobeacon_fallback_issues');
  }
}
