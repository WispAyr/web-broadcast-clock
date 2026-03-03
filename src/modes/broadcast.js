// modes/broadcast.js — Coloured segment wheel broadcast clock
import { getSegmentAt, getNextSegment } from '../config.js';

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const GAP_RAD = (1.5 * Math.PI) / 180;

export const BroadcastMode = {
  id: 'broadcast',
  name: 'Broadcast Clock',
  description: 'Coloured segment wheel with show timing',

  render(ctx, state) {
    const { cx, cy, r, dpr, size, date, exactMinute, segments, colours, display, hoveredSegment, selectedSegment, syncStatus, syncRtt, timing } = state;

    const currentSeg = getSegmentAt(segments, exactMinute);
    const nextSeg = getNextSegment(segments, exactMinute);

    // Draw segments
    _drawSegments(ctx, cx, cy, r, dpr, size, exactMinute, currentSeg, segments, colours, display, hoveredSegment, selectedSegment);
    _drawMinuteMarkers(ctx, cx, cy, r, dpr, size);
    _drawSweepHand(ctx, cx, cy, r, dpr, exactMinute);
    _drawCentre(ctx, cx, cy, r, dpr, size, date, currentSeg, nextSeg, exactMinute, colours, display);

    if (timing?.showSyncStatus !== false) {
      _drawSyncIndicator(ctx, cx, cy, r, dpr, size, syncStatus);
    }

    return { currentSeg, nextSeg };
  }
};

function _rgba(hex, alpha) {
  const rv = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${rv},${g},${b},${alpha})`;
}

function _drawSegments(ctx, cx, cy, r, dpr, size, exactMinute, currentSeg, segments, colours, display, hoveredSegment, selectedSegment) {
  const outerR = r;
  const innerR = r * 0.55;
  const labelR = r * 0.75;

  for (const seg of segments) {
    const startAngle = (seg.start / 60) * TAU - HALF_PI + GAP_RAD / 2;
    const endAngle = (seg.end / 60) * TAU - HALF_PI - GAP_RAD / 2;
    const baseColour = colours[seg.type] || '#666';
    const isCurrent = currentSeg === seg;
    const isHovered = hoveredSegment === seg;

    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    const alpha = isCurrent ? 1.0 : isHovered ? 0.9 : 0.7;
    grad.addColorStop(0, _rgba(baseColour, alpha * 0.6));
    grad.addColorStop(0.5, _rgba(baseColour, alpha * 0.85));
    grad.addColorStop(1, _rgba(baseColour, alpha));

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Current segment glow
    if (isCurrent) {
      ctx.save();
      ctx.shadowColor = baseColour;
      ctx.shadowBlur = 25 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR + 2 * dpr, startAngle, endAngle);
      ctx.arc(cx, cy, innerR - 1 * dpr, endAngle, startAngle, true);
      ctx.closePath();
      ctx.strokeStyle = _rgba(baseColour, 0.8);
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
      ctx.restore();
    }

    // Inner shadow for depth
    const innerShadowGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, innerR + (outerR - innerR) * 0.15);
    innerShadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
    innerShadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = innerShadowGrad;
    ctx.fill();

    // Segment border
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Labels for segments wider than 5 minutes — curved text
    if (display.showLabels && (seg.end - seg.start) >= 5) {
      const midAngle = ((seg.start + seg.end) / 2 / 60) * TAU - HALF_PI;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      const fontSize = Math.max(9, Math.min(14, size / 38)) * dpr;
      ctx.save();
      ctx.font = `${isCurrent ? '700' : '500'} ${fontSize}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = isCurrent ? '#fff' : 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(lx, ly);
      let rot = midAngle + HALF_PI;
      if (rot > HALF_PI && rot < HALF_PI + Math.PI) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillText(seg.label, 0, 0);
      ctx.restore();
    }
  }
}

function _drawMinuteMarkers(ctx, cx, cy, r, dpr, size) {
  const outerR = r * 1.02;
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * TAU - HALF_PI;
    const isMajor = i % 5 === 0;
    const innerR = isMajor ? r * 0.94 : r * 0.97;
    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = cy + Math.sin(angle) * innerR;
    const x2 = cx + Math.cos(angle) * outerR;
    const y2 = cy + Math.sin(angle) * outerR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = (isMajor ? 2.5 : 1) * dpr;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (isMajor) {
      const numR = r * 1.09;
      const nx = cx + Math.cos(angle) * numR;
      const ny = cy + Math.sin(angle) * numR;
      const fontSize = Math.max(11, size / 32) * dpr;
      ctx.font = `600 ${fontSize}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), nx, ny);
    }
  }
}

function _drawSweepHand(ctx, cx, cy, r, dpr, exactMinute) {
  const angle = (exactMinute / 60) * TAU - HALF_PI;
  const handR = r * 1.0;
  const tailR = r * 0.12;

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 8 * dpr;

  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(angle + Math.PI) * tailR, cy + Math.sin(angle + Math.PI) * tailR);
  ctx.lineTo(cx + Math.cos(angle) * handR, cy + Math.sin(angle) * handR);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Tip dot
  ctx.beginPath();
  ctx.arc(cx + Math.cos(angle) * handR, cy + Math.sin(angle) * handR, 3.5 * dpr, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Centre pivot
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5 * dpr, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

function _drawCentre(ctx, cx, cy, r, dpr, size, date, currentSeg, nextSeg, exactMinute, colours, display) {
  const innerR = r * 0.50;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  grad.addColorStop(0, 'rgba(10, 14, 26, 0.98)');
  grad.addColorStop(0.8, 'rgba(10, 14, 26, 0.95)');
  grad.addColorStop(1, 'rgba(10, 14, 26, 0.88)');
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, TAU);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, TAU);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // Time
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');

  const timeFontSize = Math.max(18, size / 9) * dpr;
  ctx.font = `700 ${timeFontSize}px "JetBrains Mono", "SF Mono", monospace`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${h}:${m}:${s}`, cx, cy - innerR * 0.15);

  if (currentSeg) {
    const segFontSize = Math.max(11, size / 20) * dpr;
    ctx.font = `600 ${segFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = colours[currentSeg.type] || '#888';
    ctx.fillText(currentSeg.label, cx, cy + innerR * 0.18);

    const remainMin = currentSeg.end - exactMinute;
    const remM = Math.floor(remainMin);
    const remS = Math.floor((remainMin - remM) * 60);
    const remStr = `${remM}:${String(remS).padStart(2, '0')} remaining`;
    const remFontSize = Math.max(9, size / 30) * dpr;
    ctx.font = `400 ${remFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(remStr, cx, cy + innerR * 0.42);
  }

  if (nextSeg && display.showNextSegment) {
    const nextMin = nextSeg.start - exactMinute;
    const nM = nextMin < 0 ? nextMin + 60 : nextMin;
    const nMins = Math.floor(nM);
    const nSecs = Math.floor((nM - nMins) * 60);
    const nextStr = `Next: ${nextSeg.label} in ${nMins}:${String(nSecs).padStart(2, '0')}`;
    const nextFontSize = Math.max(8, size / 36) * dpr;
    ctx.font = `400 ${nextFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(nextStr, cx, cy + innerR * 0.62);
  }
}

function _drawSyncIndicator(ctx, cx, cy, r, dpr, size, syncStatus) {
  const x = cx + r * 0.88;
  const y = cy - r * 0.88;
  const dotR = 4 * dpr;
  const colour = syncStatus === 'synced' ? '#22c55e' : syncStatus === 'degraded' ? '#f59e0b' : '#ef4444';

  ctx.beginPath();
  ctx.arc(x, y, dotR, 0, TAU);
  ctx.fillStyle = colour;
  ctx.fill();

  const fs = Math.max(7, size / 50) * dpr;
  ctx.font = `500 ${fs}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(syncStatus === 'synced' ? 'SYNC' : syncStatus === 'degraded' ? 'SYNC ~' : 'NO SYNC', x - dotR * 2, y);
  ctx.textAlign = 'center';
}
