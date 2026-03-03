// modes/world.js — Multiple time zones displayed simultaneously
import { TAU } from './utils.js';

const ZONES = [
  { label: 'LONDON', tz: 'Europe/London', colour: '#3b82f6' },
  { label: 'NEW YORK', tz: 'America/New_York', colour: '#8b5cf6' },
  { label: 'LOS ANGELES', tz: 'America/Los_Angeles', colour: '#f59e0b' },
  { label: 'SYDNEY', tz: 'Australia/Sydney', colour: '#22c55e' },
];

function getTimeInZone(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(date);
    const get = type => (parts.find(p => p.type === type) || {}).value || '00';
    return { h: get('hour'), m: get('minute'), s: get('second') };
  } catch {
    return { h: '--', m: '--', s: '--' };
  }
}

function getDayInZone(date, tz) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, weekday: 'short'
    }).format(date);
  } catch {
    return '';
  }
}

export const WorldMode = {
  id: 'world',
  name: 'World Clock',
  description: 'Multiple time zones — London, NYC, LA, Sydney',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;

    // Main local time — big
    const localTime = getTimeInZone(date, ZONES[0].tz);
    const mainFs = Math.max(24, size / 5) * dpr;
    ctx.font = `700 ${mainFs}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${localTime.h}:${localTime.m}:${localTime.s}`, cx, cy - r * 0.25);

    // Local label
    const labelFs = Math.max(9, size / 22) * dpr;
    ctx.font = `600 ${labelFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = ZONES[0].colour;
    ctx.fillText(ZONES[0].label, cx, cy - r * 0.48);

    // Day/Date
    const dayStr = getDayInZone(date, ZONES[0].tz);
    const dateFs2 = Math.max(8, size / 28) * dpr;
    ctx.font = `400 ${dateFs2}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(dayStr.toUpperCase(), cx, cy - r * 0.1);

    // Secondary zones — arranged below
    const zoneY = cy + r * 0.15;
    const zoneGap = r * 0.55;
    const startX = cx - ((ZONES.length - 2) * zoneGap) / 2;

    for (let i = 1; i < ZONES.length; i++) {
      const zone = ZONES[i];
      const x = startX + (i - 1) * zoneGap;
      const zt = getTimeInZone(date, zone.tz);
      const zDay = getDayInZone(date, zone.tz);

      // Zone label
      const zlFs = Math.max(7, size / 36) * dpr;
      ctx.font = `600 ${zlFs}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = zone.colour;
      ctx.textAlign = 'center';
      ctx.fillText(zone.label, x, zoneY);

      // Zone time
      const ztFs = Math.max(14, size / 12) * dpr;
      ctx.font = `700 ${ztFs}px "JetBrains Mono", monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`${zt.h}:${zt.m}`, x, zoneY + r * 0.14);

      // Seconds smaller
      const zsFs = Math.max(9, size / 22) * dpr;
      ctx.font = `400 ${zsFs}px "JetBrains Mono", monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(`:${zt.s}`, x + r * 0.14, zoneY + r * 0.14);

      // Day
      ctx.font = `400 ${zlFs}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText(zDay.toUpperCase(), x, zoneY + r * 0.26);
    }

    return {};
  }
};
