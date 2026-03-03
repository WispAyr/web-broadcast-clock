// config.js — Configuration parsing and defaults

export const DEFAULT_COLOURS = {
  music: '#3b82f6',
  ads: '#ef4444',
  news: '#22c55e',
  talk: '#f59e0b',
  jingle: '#8b5cf6',
  weather: '#06b6d4',
  intro: '#ec4899',
};

export const DEFAULT_DISPLAY = {
  showLabels: true,
  showCentreTime: true,
  showNowPlaying: true,
  showNextSegment: true,
  theme: 'dark',
  fontSize: 'auto',
};

export function parseConfig(raw) {
  const config = typeof raw === 'string' ? JSON.parse(raw) : { ...raw };
  config.colours = { ...DEFAULT_COLOURS, ...(config.colours || {}) };
  config.display = { ...DEFAULT_DISPLAY, ...(config.display || {}) };
  config.segments = (config.segments || []).map(s => ({
    start: s.start,
    end: s.end,
    type: s.type || 'music',
    label: s.label || s.type,
    description: s.description || '',
  }));
  config.metadata = config.metadata || {};
  config.show = config.show || {};
  return config;
}

// ─── Segment Lookup with Hysteresis ─────────────────────────
// Cache to prevent flickering at segment boundaries.
// Uses floored minutes since segments are defined in whole minutes.

let _cachedFlooredMinute = -1;
let _cachedCurrentSeg = null;
let _cachedNextSeg = null;
let _cachedSegments = null;

function _invalidateCache(segments, flooredMinute) {
  if (segments !== _cachedSegments || flooredMinute !== _cachedFlooredMinute) {
    _cachedSegments = segments;
    _cachedFlooredMinute = flooredMinute;
    return true;
  }
  return false;
}

export function getSegmentAt(segments, minute) {
  const floored = Math.floor(minute);
  if (!_invalidateCache(segments, floored) && _cachedCurrentSeg !== null) {
    // Verify cached segment is still valid (hysteresis)
    const seg = _cachedCurrentSeg;
    if (floored >= seg.start && floored < seg.end) {
      return seg;
    }
  }
  // Recalculate
  const seg = segments.find(s => floored >= s.start && floored < s.end) || null;
  _cachedCurrentSeg = seg;
  return seg;
}

export function getNextSegment(segments, minute) {
  const floored = Math.floor(minute);
  if (!_invalidateCache(segments, floored) && _cachedNextSeg !== null) {
    return _cachedNextSeg;
  }
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  // Find the first segment that starts strictly after the current floored minute
  const next = sorted.find(s => s.start > floored) || sorted[0] || null;
  _cachedNextSeg = next;
  return next;
}

// Reset cache when config changes
export function resetSegmentCache() {
  _cachedFlooredMinute = -1;
  _cachedCurrentSeg = null;
  _cachedNextSeg = null;
  _cachedSegments = null;
}
