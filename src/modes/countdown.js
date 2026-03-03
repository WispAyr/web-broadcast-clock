// modes/countdown.js — Countdown to next segment/break with urgency colours
import { TAU } from './utils.js';
import { getNextSegment } from '../config.js';

const HALF_PI = Math.PI / 2;

export const CountdownMode = {
  id: 'countdown',
  name: 'Countdown',
  description: 'Countdown timer to next segment — urgency colour coding',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date, exactMinute, segments } = state;
    const nextSeg = getNextSegment(segments, exactMinute);

    let remainMin = 0;
    let label = 'No segments';
    if (nextSeg) {
      remainMin = nextSeg.start - exactMinute;
      if (remainMin < 0) remainMin += 60;
      label = nextSeg.label;
    }

    const mins = Math.floor(remainMin);
    const secs = Math.floor((remainMin - mins) * 60);
    const tenths = Math.floor(((remainMin - mins) * 60 - secs) * 10);

    // Urgency colour
    let colour, glowColour;
    if (remainMin > 5) {
      colour = '#22c55e';
      glowColour = 'rgba(34,197,94,0.3)';
    } else if (remainMin > 1) {
      colour = '#f59e0b';
      glowColour = 'rgba(245,158,11,0.3)';
    } else {
      colour = '#ef4444';
      glowColour = 'rgba(239,68,68,0.4)';
    }

    // Background urgency ring
    const ringR = r * 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();

    // Progress arc
    if (nextSeg) {
      const maxMin = 10;
      const elapsed = Math.min(maxMin, maxMin - remainMin);
      const progress = Math.max(0, elapsed / maxMin);
      const startAngle = -HALF_PI;
      const endAngle = startAngle + progress * TAU;

      ctx.beginPath();
      ctx.arc(cx, cy, ringR, startAngle, endAngle);
      ctx.strokeStyle = colour;
      ctx.lineWidth = r * 0.08;
      ctx.lineCap = 'round';
      ctx.save();
      ctx.shadowColor = colour;
      ctx.shadowBlur = 15 * dpr;
      ctx.stroke();
      ctx.restore();
    }

    // "NEXT" label
    const labelFs = Math.max(9, size / 24) * dpr;
    ctx.font = `500 ${labelFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEXT', cx, cy - r * 0.35);

    // Segment label
    const nameFs = Math.max(12, size / 16) * dpr;
    ctx.font = `600 ${nameFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = colour;
    ctx.fillText(label, cx, cy - r * 0.18);

    // Big countdown
    const countStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const countFs = Math.max(30, size / 4) * dpr;
    ctx.font = `700 ${countFs}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#f8fafc';
    ctx.save();
    ctx.shadowColor = glowColour;
    ctx.shadowBlur = 20 * dpr;
    ctx.fillText(countStr, cx, cy + r * 0.08);
    ctx.restore();

    // Tenths
    const tenthFs = Math.max(14, size / 10) * dpr;
    ctx.font = `400 ${tenthFs}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`.${tenths}`, cx, cy + r * 0.3);

    // Current time small at bottom
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s2 = String(date.getSeconds()).padStart(2, '0');
    const timeFs = Math.max(10, size / 20) * dpr;
    ctx.font = `500 ${timeFs}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText(`${h}:${m}:${s2}`, cx, cy + r * 0.55);

    return { nextSeg };
  }
};
