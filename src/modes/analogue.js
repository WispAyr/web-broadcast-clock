// modes/analogue.js — Traditional analogue studio clock face
import { TAU, timeInWords } from './utils.js';

const HALF_PI = Math.PI / 2;

export const AnalogueMode = {
  id: 'analogue',
  name: 'Analogue Studio',
  description: 'Traditional clock face with hour/minute/second hands',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date } = state;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();

    _drawDial(ctx, cx, cy, r, dpr, size);
    _drawHourMarkers(ctx, cx, cy, r, dpr, size);
    _drawHands(ctx, cx, cy, r, dpr, hours, minutes, seconds, ms);
    _drawCentreOverlay(ctx, cx, cy, r, dpr, size, date, ms);
    _drawTimeInWords(ctx, cx, cy, r, dpr, size, date);

    return {};
  }
};

function _drawDial(ctx, cx, cy, r, dpr, size) {
  // Outer ring
  const grad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r);
  grad.addColorStop(0, 'rgba(30,35,50,0.9)');
  grad.addColorStop(1, 'rgba(20,25,40,0.95)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, 0, TAU);
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner face
  const innerGrad = ctx.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy, r * 0.85);
  innerGrad.addColorStop(0, 'rgba(50,55,70,0.5)');
  innerGrad.addColorStop(1, 'rgba(25,30,45,0.7)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, 0, TAU);
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // Bezel ring
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, 0, TAU);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 3 * dpr;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.93, 0, TAU);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();
}

function _drawHourMarkers(ctx, cx, cy, r, dpr, size) {
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * TAU - HALF_PI;
    const isHour = i % 5 === 0;

    if (isHour) {
      const innerR = r * 0.75;
      const outerR = r * 0.85;
      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3 * dpr;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Hour number
      const numR = r * 0.66;
      const hourNum = i === 0 ? 12 : i / 5;
      const nx = cx + Math.cos(angle) * numR;
      const ny = cy + Math.sin(angle) * numR;
      const fs = Math.max(14, size / 18) * dpr;
      ctx.font = `700 ${fs}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(hourNum), nx, ny);
    } else {
      const innerR = r * 0.82;
      const outerR = r * 0.85;
      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1 * dpr;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
}

function _drawHands(ctx, cx, cy, r, dpr, hours, minutes, seconds, ms) {
  const smoothSeconds = seconds + ms / 1000;
  const smoothMinutes = minutes + smoothSeconds / 60;
  const smoothHours = (hours % 12) + smoothMinutes / 60;

  // Hour hand
  const hourAngle = (smoothHours / 12) * TAU - HALF_PI;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 6 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(hourAngle + Math.PI) * r * 0.08, cy + Math.sin(hourAngle + Math.PI) * r * 0.08);
  ctx.lineTo(cx + Math.cos(hourAngle) * r * 0.48, cy + Math.sin(hourAngle) * r * 0.48);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 5 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Minute hand
  const minAngle = (smoothMinutes / 60) * TAU - HALF_PI;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 6 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(minAngle + Math.PI) * r * 0.1, cy + Math.sin(minAngle + Math.PI) * r * 0.1);
  ctx.lineTo(cx + Math.cos(minAngle) * r * 0.72, cy + Math.sin(minAngle) * r * 0.72);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Second hand — coloured
  const secAngle = (smoothSeconds / 60) * TAU - HALF_PI;
  ctx.save();
  ctx.shadowColor = 'rgba(139,92,246,0.5)';
  ctx.shadowBlur = 10 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(secAngle + Math.PI) * r * 0.15, cy + Math.sin(secAngle + Math.PI) * r * 0.15);
  ctx.lineTo(cx + Math.cos(secAngle) * r * 0.82, cy + Math.sin(secAngle) * r * 0.82);
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1.5 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Second hand tip
  ctx.beginPath();
  ctx.arc(cx + Math.cos(secAngle) * r * 0.82, cy + Math.sin(secAngle) * r * 0.82, 2.5 * dpr, 0, TAU);
  ctx.fillStyle = '#8b5cf6';
  ctx.fill();
  ctx.restore();

  // Centre cap
  ctx.beginPath();
  ctx.arc(cx, cy, 5 * dpr, 0, TAU);
  ctx.fillStyle = '#8b5cf6';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3 * dpr, 0, TAU);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
}

function _drawCentreOverlay(ctx, cx, cy, r, dpr, size, date, ms) {
  // Digital time overlay
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const hundredths = String(Math.floor(ms / 10)).padStart(2, '0');

  // "Local Time" label
  const labelFs = Math.max(7, size / 42) * dpr;
  ctx.font = `500 ${labelFs}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOCAL TIME', cx, cy + r * 0.22);

  // Digital time
  const timeFs = Math.max(10, size / 22) * dpr;
  ctx.font = `600 ${timeFs}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`${h}:${m}:${s}`, cx, cy + r * 0.32);

  // Sub-seconds
  const subFs = Math.max(8, size / 32) * dpr;
  ctx.font = `400 ${subFs}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(`.${hundredths}`, cx, cy + r * 0.42);
}

function _drawTimeInWords(ctx, cx, cy, r, dpr, size, date) {
  const words = timeInWords(date);
  const fs = Math.max(8, size / 30) * dpr;
  ctx.font = `400 ${fs}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words, cx, cy + r * 0.8);
}
