// clock-worker.js — Background Web Worker for authoritative timekeeping
// Prevents background tab throttling from killing clock accuracy.

let offset = 0; // ms offset: correctedTime = Date.now() + offset
let syncEndpoint = null;
let syncInterval = 60000;
let syncTimer = null;
let tickTimer = null;
let lastSyncRtt = Infinity;
let syncStatus = 'unsynced'; // 'synced' | 'degraded' | 'unsynced'

function getCorrectedTime() {
  return Date.now() + offset;
}

async function performSync() {
  if (!syncEndpoint) return;

  const SAMPLES = 3;
  let bestRtt = Infinity;
  let bestOffset = 0;

  for (let i = 0; i < SAMPLES; i++) {
    try {
      const t0 = Date.now();
      const res = await fetch(syncEndpoint);
      const t3 = Date.now();
      if (!res.ok) continue;
      const data = await res.json();
      const serverTime = data.serverTime;
      const rtt = t3 - t0;
      const estimatedOffset = serverTime + Math.round(rtt / 2) - t3;

      if (rtt < bestRtt) {
        bestRtt = rtt;
        bestOffset = estimatedOffset;
      }
    } catch (e) {
      // silent
    }
    // Small delay between samples
    if (i < SAMPLES - 1) await new Promise(r => setTimeout(r, 50));
  }

  if (bestRtt < Infinity) {
    offset = bestOffset;
    lastSyncRtt = bestRtt;
    if (bestRtt < 20) syncStatus = 'synced';       // <10ms each way
    else if (bestRtt < 200) syncStatus = 'degraded';
    else syncStatus = 'unsynced';
  } else {
    syncStatus = 'unsynced';
  }

  self.postMessage({ type: 'sync', offset, rtt: lastSyncRtt, status: syncStatus });
}

function startTicking() {
  if (tickTimer) clearInterval(tickTimer);
  // Post authoritative time every 100ms — immune to main thread rAF throttling
  tickTimer = setInterval(() => {
    self.postMessage({ type: 'tick', time: getCorrectedTime() });
  }, 100);
}

function startSyncLoop() {
  if (syncTimer) clearInterval(syncTimer);
  performSync();
  syncTimer = setInterval(() => performSync(), syncInterval);
}

self.onmessage = function (e) {
  const msg = e.data;
  if (msg.type === 'init') {
    syncEndpoint = msg.syncEndpoint || null;
    syncInterval = msg.syncInterval || 60000;
    startTicking();
    if (syncEndpoint) startSyncLoop();
  } else if (msg.type === 'sync-now') {
    performSync();
  } else if (msg.type === 'set-offset') {
    offset = msg.offset || 0;
  } else if (msg.type === 'stop') {
    if (tickTimer) clearInterval(tickTimer);
    if (syncTimer) clearInterval(syncTimer);
  }
};
