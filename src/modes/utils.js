// modes/utils.js — Shared utilities for clock modes

const TAU = Math.PI * 2;

export { TAU };

export function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function timeInWords(date) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty'];

  function numWords(n) {
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  let h = date.getHours();
  const m = date.getMinutes();
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const hourWord = numWords(h12);

  if (m === 0) return `${hourWord} O'Clock`;
  if (m === 15) return `Quarter Past ${hourWord}`;
  if (m === 30) return `Half Past ${hourWord}`;
  if (m === 45) {
    const nextH = h12 === 12 ? 1 : h12 + 1;
    return `Quarter To ${numWords(nextH)}`;
  }
  return `${numWords(m)} minute${m !== 1 ? 's' : ''} past ${hourWord}`;
}

export function drawRoundRect(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}
