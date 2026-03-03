// modes/nixie.js — Warm vintage Nixie tube display
import { TAU } from './utils.js';

export const NixieMode = {
  id: 'nixie',
  name: 'Nixie Tube',
  description: 'Warm vintage Nixie tube display with orange glow',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    const digits = [h[0], h[1], ':', m[0], m[1], ':', s[0], s[1]];
    const tubeW = r * 0.2;
    const tubeH = r * 0.42;
    const gap = r * 0.035;
    const colonW = r * 0.06;

    let totalW = 0;
    for (const d of digits) totalW += d === ':' ? colonW : tubeW;
    totalW += (digits.length - 1) * gap;

    let x = cx - totalW / 2;
    const y = cy - tubeH / 2 - r * 0.03;

    for (const digit of digits) {
      if (digit === ':') {
        _drawNixieColon(ctx, x + colonW / 2, cy - r * 0.03, colonW, dpr);
        x += colonW + gap;
      } else {
        _drawNixieTube(ctx, x, y, tubeW, tubeH, digit, dpr);
        x += tubeW + gap;
      }
    }

    // Warm ambient label
    const dateStr = _formatDate(date);
    const fs = Math.max(9, size / 26) * dpr;
    ctx.font = `400 ${fs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,160,60,0.25)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateStr, cx, cy + tubeH / 2 + r * 0.15);

    return {};
  }
};

function _formatDate(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function _drawNixieTube(ctx, x, y, w, h, digit, dpr) {
  const rad = 8 * dpr;

  // Glass tube background
  const tubeGrad = ctx.createLinearGradient(x, y, x + w, y);
  tubeGrad.addColorStop(0, 'rgba(40,25,15,0.7)');
  tubeGrad.addColorStop(0.3, 'rgba(30,18,10,0.85)');
  tubeGrad.addColorStop(0.7, 'rgba(30,18,10,0.85)');
  tubeGrad.addColorStop(1, 'rgba(40,25,15,0.7)');

  ctx.beginPath();
  _roundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = tubeGrad;
  ctx.fill();

  // Glass reflection
  const refGrad = ctx.createLinearGradient(x, y, x, y + h * 0.3);
  refGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
  refGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  _roundRect(ctx, x + 2 * dpr, y + 2 * dpr, w - 4 * dpr, h * 0.3, rad);
  ctx.fillStyle = refGrad;
  ctx.fill();

  // Tube border
  ctx.beginPath();
  _roundRect(ctx, x, y, w, h, rad);
  ctx.strokeStyle = 'rgba(255,140,40,0.12)';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // Wire cathode hints (dim digits behind)
  const ghostFs = h * 0.55;
  ctx.font = `700 ${ghostFs}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let d = 0; d <= 9; d++) {
    if (String(d) === digit) continue;
    ctx.fillStyle = 'rgba(255,120,30,0.03)';
    ctx.fillText(String(d), x + w / 2, y + h / 2);
  }

  // Active digit — bright orange with glow
  ctx.save();
  ctx.shadowColor = 'rgba(255,140,40,0.8)';
  ctx.shadowBlur = 25 * dpr;
  ctx.font = `700 ${ghostFs}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#ff9020';
  ctx.fillText(digit, x + w / 2, y + h / 2);
  ctx.restore();

  // Second glow pass for intensity
  ctx.save();
  ctx.shadowColor = 'rgba(255,100,20,0.4)';
  ctx.shadowBlur = 40 * dpr;
  ctx.font = `700 ${ghostFs}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255,180,80,0.3)';
  ctx.fillText(digit, x + w / 2, y + h / 2);
  ctx.restore();

  // Inner warm ambient glow
  const glowGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.6);
  glowGrad.addColorStop(0, 'rgba(255,120,30,0.08)');
  glowGrad.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.beginPath();
  _roundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = glowGrad;
  ctx.fill();
}

function _drawNixieColon(ctx, x, cy, w, dpr) {
  const dotR = w * 0.25;
  const offset = w * 1.2;

  ctx.save();
  ctx.shadowColor = 'rgba(255,140,40,0.6)';
  ctx.shadowBlur = 8 * dpr;
  ctx.fillStyle = '#ff9020';
  ctx.beginPath();
  ctx.arc(x, cy - offset, dotR, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, cy + offset, dotR, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function _roundRect(ctx, x, y, w, h, rad) {
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
}
