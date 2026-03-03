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

export function getSegmentAt(segments, minute) {
  return segments.find(s => minute >= s.start && minute < s.end) || null;
}

export function getNextSegment(segments, minute) {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  return sorted.find(s => s.start > minute) || sorted[0] || null;
}
