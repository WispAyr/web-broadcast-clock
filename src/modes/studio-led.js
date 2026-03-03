// modes/studio-led.js — Classic broadcast LED dot matrix clock
import { TAU, timeInWords } from './utils.js';

const HALF_PI = Math.PI / 2;

export const StudioLEDMode = {
  id: 'studio-led',
  name: 'Studio LED',
  description: 'Classic broadcast LED dot sweep clock',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();

    // 60 dots around perimeter
    _drawDotRing(ctx, cx, cy, r, dpr, seconds);

    // Large digital time in centre
    _drawLEDTime(ctx, cx, cy, r, dpr, size, hours, minutes, seconds, ms);

    // Time in words at bottom
    _drawTimeInWords(ctx, cx, cy, r, dpr, size, date);

    return {};
  }
};

function _drawDotRing(ctx, cx, cy, r, dpr, seconds) {
  const dotR = r * 0.92;
  const dotSize = Math.max(3, r * 0.022);

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * TAU - HALF_PI;
    const x = cx + Math.cos(angle) * dotR;
    const y = cy + Math.sin(angle) * dotR;
    const isActive = i <= seconds;
    const isMajor = i % 5 === 0;

    // Green for 0-49, red for 50-59
    let colour;
    if (i >= 50) {
      colour = isActive ? '#ef4444' : 'rgba(239,68,68,0.12)';
    } else {
      colour = isActive ? '#22c55e' : 'rgba(34,197,94,0.1)';
    }

    ctx.beginPath();
    ctx.arc(x, y, (isMajor ? dotSize * 1.5 : dotSize) * dpr, 0, TAU);
    ctx.fillStyle = colour;
    ctx.fill();

    // Glow on active dots
    if (isActive) {
      ctx.save();
      ctx.shadowColor = i >= 50 ? '#ef4444' : '#22c55e';
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, (isMajor ? dotSize * 1.2 : dotSize * 0.8) * dpr, 0, TAU);
      ctx.fillStyle = i >= 50 ? '#ef4444' : '#22c55e';
      ctx.fill();
      ctx.restore();
    }

    // 5-minute number labels
    if (isMajor) {
      const numR = dotR + 18 * dpr;
      const nx = cx + Math.cos(angle) * numR;
      const ny = cy + Math.sin(angle) * numR;
      const fs = Math.max(9, r * 0.04) * dpr;
      ctx.font = `600 ${fs}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i === 0 ? 60 : i), nx, ny);
    }
  }
}

function _drawLEDTime(ctx, cx, cy, r, dpr, size, hours, minutes, seconds, ms) {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  const tenths = Math.floor(ms / 100);

  // Main time: HH:MM
  const mainSize = Math.max(28, size / 5.5) * dpr;
  ctx.font = `700 ${mainSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${h}:${m}`, cx, cy - r * 0.1);

  // Seconds large below
  const secSize = Math.max(18, size / 9) * dpr;
  ctx.font = `700 ${secSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = seconds >= 50 ? '#ef4444' : '#22c55e';

  // Glow effect on seconds
  ctx.save();
  ctx.shadowColor = seconds >= 50 ? '#ef4444' : '#22c55e';
  ctx.shadowBlur = 12 * dpr;
  ctx.fillText(s, cx, cy + r * 0.15);
  ctx.restore();

  // Tenths below seconds
  const tenthSize = Math.max(10, size / 18) * dpr;
  ctx.font = `400 ${tenthSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(`.${tenths}`, cx, cy + r * 0.3);
}

function _drawTimeInWords(ctx, cx, cy, r, dpr, size, date) {
  const words = timeInWords(date);
  const fs = Math.max(9, size / 28) * dpr;
  ctx.font = `400 ${fs}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words, cx, cy + r * 0.55);
}
