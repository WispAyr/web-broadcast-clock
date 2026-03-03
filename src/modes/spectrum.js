// modes/spectrum.js — Rainbow spectrum second sweep
import { TAU } from './utils.js';

const HALF_PI = Math.PI / 2;

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const colour = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * colour).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const SpectrumMode = {
  id: 'spectrum',
  name: 'Spectrum',
  description: 'Rainbow colour spectrum second sweep',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();

    const dotR = r * 0.92;
    const dotSize = Math.max(4, r * 0.028);

    // Draw spectrum dots
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * TAU - HALF_PI;
      const x = cx + Math.cos(angle) * dotR;
      const y = cy + Math.sin(angle) * dotR;
      const isActive = i <= seconds;
      const hue = (i / 60) * 360;
      const colour = hslToHex(hue, 85, 55);
      const isMajor = i % 5 === 0;
      const sz = (isMajor ? dotSize * 1.4 : dotSize) * dpr;

      ctx.beginPath();
      ctx.arc(x, y, sz, 0, TAU);

      if (isActive) {
        ctx.fillStyle = colour;
        ctx.save();
        ctx.shadowColor = colour;
        ctx.shadowBlur = 10 * dpr;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = `rgba(100,100,100,0.08)`;
        ctx.fill();
      }
    }

    // Current second indicator — brighter, larger
    const currentAngle = (seconds / 60) * TAU - HALF_PI;
    const hue = (seconds / 60) * 360;
    const currentColour = hslToHex(hue, 90, 60);
    const csx = cx + Math.cos(currentAngle) * dotR;
    const csy = cy + Math.sin(currentAngle) * dotR;
    ctx.save();
    ctx.shadowColor = currentColour;
    ctx.shadowBlur = 20 * dpr;
    ctx.beginPath();
    ctx.arc(csx, csy, dotSize * 2 * dpr, 0, TAU);
    ctx.fillStyle = currentColour;
    ctx.fill();
    ctx.restore();

    // Time in centre
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    const timeFs = Math.max(22, size / 6) * dpr;
    ctx.font = `700 ${timeFs}px "JetBrains Mono", monospace`;
    // Colour the time with current hue
    ctx.fillStyle = currentColour;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.shadowColor = currentColour;
    ctx.shadowBlur = 15 * dpr;
    ctx.fillText(`${h}:${m}:${s}`, cx, cy);
    ctx.restore();

    return {};
  }
};
