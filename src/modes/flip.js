// modes/flip.js — Retro split-flap / flip clock aesthetic
import { drawRoundRect } from './utils.js';

export const FlipMode = {
  id: 'flip',
  name: 'Digital Flip',
  description: 'Retro split-flap airport departure board style',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    const digits = [h[0], h[1], ':', m[0], m[1], ':', s[0], s[1]];
    const digitW = r * 0.22;
    const digitH = r * 0.38;
    const gap = r * 0.04;
    const colonW = r * 0.08;

    // Calculate total width
    let totalW = 0;
    for (const d of digits) {
      totalW += d === ':' ? colonW : digitW;
    }
    totalW += (digits.length - 1) * gap;

    let x = cx - totalW / 2;
    const y = cy - digitH / 2 - r * 0.05;

    for (const digit of digits) {
      if (digit === ':') {
        _drawColon(ctx, x + colonW / 2, cy - r * 0.05, colonW, dpr);
        x += colonW + gap;
      } else {
        _drawFlipDigit(ctx, x, y, digitW, digitH, digit, dpr);
        x += digitW + gap;
      }
    }

    // Date below
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${days[date.getDay()]}  ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    const dateFs = Math.max(10, size / 24) * dpr;
    ctx.font = `500 ${dateFs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateStr, cx, cy + digitH / 2 + r * 0.12);

    return {};
  }
};

function _drawFlipDigit(ctx, x, y, w, h, digit, dpr) {
  const rad = 6 * dpr;
  const splitGap = 1.5 * dpr;

  // Top half
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h / 2 - splitGap / 2);
  ctx.lineTo(x, y + h / 2 - splitGap / 2);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
  ctx.fillStyle = '#1a1f2e';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();
  ctx.restore();

  // Bottom half — slightly darker
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2 + splitGap / 2);
  ctx.lineTo(x + w, y + h / 2 + splitGap / 2);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.closePath();
  ctx.fillStyle = '#151a28';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();
  ctx.restore();

  // Split line shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y + h / 2 - splitGap / 2, w, splitGap);

  // Digit text — render in both halves via clipping
  const fs = h * 0.7;
  ctx.font = `700 ${fs}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#e8e0d4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(digit, x + w / 2, y + h / 2);

  // Slight gradient overlay on top half for 3D effect
  const topGrad = ctx.createLinearGradient(x, y, x, y + h / 2);
  topGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h / 2);
  ctx.clip();
  ctx.fillStyle = topGrad;
  ctx.fillRect(x, y, w, h / 2);
  ctx.restore();
}

function _drawColon(ctx, x, cy, w, dpr) {
  const dotR = w * 0.2;
  const offset = w * 0.6;
  ctx.fillStyle = '#e8e0d4';
  ctx.beginPath();
  ctx.arc(x, cy - offset, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, cy + offset, dotR, 0, Math.PI * 2);
  ctx.fill();
}
