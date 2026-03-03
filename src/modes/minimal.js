// modes/minimal.js — Ultra-clean, massive time digits
import { TAU } from './utils.js';

export const MinimalMode = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Ultra-clean massive time display — pure focus',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    // Massive time
    const mainFs = Math.max(40, size / 3.2) * dpr;
    ctx.font = `200 ${mainFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${h}:${m}:${s}`, cx, cy - r * 0.05);

    // Date below
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    const dateFs = Math.max(10, size / 22) * dpr;
    ctx.font = `300 ${dateFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(dateStr, cx, cy + r * 0.2);

    // Hour progress bar at bottom
    const barW = r * 1.6;
    const barH = 3 * dpr;
    const barX = cx - barW / 2;
    const barY = cy + r * 0.65;
    const progress = (minutes * 60 + seconds + ms / 1000) / 3600;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(barX, barY, barW * progress, barH);

    // Tick marks on progress bar
    for (let i = 0; i <= 4; i++) {
      const x = barX + (barW * i / 4);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, barY - 2 * dpr, 1 * dpr, barH + 4 * dpr);
    }

    return {};
  }
};
