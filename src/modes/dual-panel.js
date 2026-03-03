// modes/dual-panel.js — Dual-panel broadcast clock with green LED + segment wheel + analogue hands
import { getSegmentAt, getNextSegment } from '../config.js';

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const GAP_RAD = (1.5 * Math.PI) / 180;

export const DualPanelMode = {
  id: 'dual-panel',
  name: 'Dual Panel Studio',
  description: 'Green LED clock + segment wheel with analogue hands',

  render(ctx, state) {
    const { width, height, dpr, date, exactMinute, segments, colours, display, hoveredSegment, selectedSegment, timing } = state;
    
    // Calculate layout dimensions
    const panelWidth = width / 2;
    const panelHeight = height;
    const leftPanelCenterX = panelWidth / 2;
    const rightPanelCenterX = panelWidth + (panelWidth / 2);
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Save context for left panel
    ctx.save();
    ctx.translate(0, 0);
    ctx.rect(0, 0, panelWidth, panelHeight);
    ctx.clip();
    
    // Render left panel: Green LED digital clock
    _renderLEDClock(ctx, leftPanelCenterX, centerY, panelWidth, panelHeight, dpr, date);
    
    ctx.restore();
    
    // Save context for right panel
    ctx.save();
    ctx.translate(panelWidth, 0);
    ctx.rect(0, 0, panelWidth, panelHeight);
    ctx.clip();
    
    // Render right panel: Segment wheel with analogue hands
    const radius = Math.min(panelWidth, panelHeight) * 0.4;
    const rightCx = panelWidth / 2;
    const rightCy = panelHeight / 2;
    
    _renderSegmentWheel(ctx, rightCx, rightCy, radius, dpr, panelWidth, exactMinute, segments, colours, display, hoveredSegment, selectedSegment);
    _renderAnalogueHands(ctx, rightCx, rightCy, radius, dpr, date, exactMinute);
    _renderMinuteMarkers(ctx, rightCx, rightCy, radius, dpr);
    _renderShowInfo(ctx, rightCx, rightCy, radius, dpr, panelWidth, panelHeight, state);
    
    ctx.restore();
    
    // Render bottom strip across both panels
    _renderBottomStrip(ctx, width, height, dpr, state);
    
    return { currentSeg: getSegmentAt(segments, exactMinute), nextSeg: getNextSegment(segments, exactMinute) };
  }
};

function _renderLEDClock(ctx, cx, cy, width, height, dpr, date) {
  // Dark background for left panel
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0a0e1a');
  grad.addColorStop(1, '#151928');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  
  // Green LED time display
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  
  // Main time digits (HH:MM)
  const mainFontSize = Math.min(width * 0.15, height * 0.2) * dpr;
  ctx.font = `bold ${mainFontSize}px "Segment7", "JetBrains Mono", monospace`;
  ctx.fillStyle = '#00ff00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${h}:${m}`, cx, cy - mainFontSize * 0.5);
  
  // Seconds (smaller, below)
  const secFontSize = mainFontSize * 0.6;
  ctx.font = `bold ${secFontSize}px "Segment7", "JetBrains Mono", monospace`;
  ctx.fillStyle = '#00ff00';
  ctx.fillText(s, cx, cy + secFontSize * 0.3);
  
  // Date below
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = date.toLocaleDateString('en-GB', dateOptions);
  const dateFontSize = Math.max(12, width * 0.035) * dpr;
  ctx.font = `500 ${dateFontSize}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
  ctx.fillText(dateStr, cx, cy + mainFontSize * 0.8);
  
  // Settings cog top-right
  const cogSize = Math.max(20, width * 0.05) * dpr;
  const cogX = width - cogSize * 1.5;
  const cogY = cogSize * 1.5;
  _drawCog(ctx, cogX, cogY, cogSize, dpr);
}

function _drawCog(ctx, x, y, size, dpr) {
  const teeth = 8;
  const innerRadius = size * 0.3;
  const outerRadius = size * 0.6;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Cog background
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, TAU);
  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.fill();
  
  // Teeth
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * TAU;
    const angle1 = angle - (TAU / teeth) * 0.2;
    const angle2 = angle + (TAU / teeth) * 0.2;
    
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle1) * innerRadius, Math.sin(angle1) * innerRadius);
    ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    ctx.lineTo(Math.cos(angle2) * innerRadius, Math.sin(angle2) * innerRadius);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fill();
  }
  
  // Centre hole
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius * 0.5, 0, TAU);
  ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.fill();
  
  ctx.restore();
}

function _renderSegmentWheel(ctx, cx, cy, r, dpr, size, exactMinute, segments, colours, display, hoveredSegment, selectedSegment) {
  const outerR = r;
  const innerR = r * 0.55;
  const labelR = r * 0.75;
  
  // Background gradient
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
  bgGrad.addColorStop(0, 'rgba(20, 25, 40, 0.9)');
  bgGrad.addColorStop(1, 'rgba(10, 14, 26, 0.95)');
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, TAU);
  ctx.fillStyle = bgGrad;
  ctx.fill();
  
  for (const seg of segments) {
    const startAngle = (seg.start / 60) * TAU - HALF_PI + GAP_RAD / 2;
    const endAngle = (seg.end / 60) * TAU - HALF_PI - GAP_RAD / 2;
    const baseColour = colours[seg.type] || '#666';
    const isCurrent = getSegmentAt([seg], exactMinute) === seg;
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
    
    // Labels for segments wider than 5 minutes
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

function _renderAnalogueHands(ctx, cx, cy, r, dpr, date, exactMinute) {
  const hours = date.getHours() % 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Hour hand
  const hourAngle = ((hours + minutes / 60) / 12) * TAU - HALF_PI;
  const hourLength = r * 0.45;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hourAngle) * hourLength, cy + Math.sin(hourAngle) * hourLength);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  
  // Minute hand
  const minuteAngle = ((minutes + seconds / 60) / 60) * TAU - HALF_PI;
  const minuteLength = r * 0.65;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(minuteAngle) * minuteLength, cy + Math.sin(minuteAngle) * minuteLength);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  
  // Second hand (red)
  const secondAngle = (seconds / 60) * TAU - HALF_PI;
  const secondLength = r * 0.75;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(secondAngle) * secondLength, cy + Math.sin(secondAngle) * secondLength);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2 * dpr;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Second hand tip
  ctx.beginPath();
  ctx.arc(cx + Math.cos(secondAngle) * secondLength, cy + Math.sin(secondAngle) * secondLength, 3 * dpr, 0, TAU);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.restore();
  
  // Centre pivot
  ctx.beginPath();
  ctx.arc(cx, cy, 6 * dpr, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(cx, cy, 3 * dpr, 0, TAU);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
}

function _renderMinuteMarkers(ctx, cx, cy, r, dpr) {
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
      const fontSize = Math.max(11, r / 3) * dpr;
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = i === 0 ? '00' : String(i).padStart(2, '0');
      ctx.fillText(label, nx, ny);
    }
  }
}

function _renderShowInfo(ctx, cx, cy, r, dpr, width, height, state) {
  const { show, segments, exactMinute } = state;
  const currentSeg = getSegmentAt(segments, exactMinute);
  
  // Show name at bottom of right panel
  const showNameY = cy + r * 1.2;
  const fontSize = Math.max(14, width * 0.04) * dpr;
  
  ctx.font = `600 ${fontSize}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(show?.name || 'Lunch Break - Noon', cx, showNameY);
  
  // Presenter info
  if (show?.presenter) {
    const presenterY = showNameY + fontSize * 1.2;
    const presenterFontSize = fontSize * 0.8;
    ctx.font = `500 ${presenterFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`With ${show.presenter}`, cx, presenterY);
  }
  
  // Current segment info
  if (currentSeg) {
    const segY = showNameY + fontSize * 2.4;
    const segFontSize = fontSize * 0.7;
    const remainMin = currentSeg.end - exactMinute;
    const remM = Math.floor(remainMin);
    const remS = Math.floor((remainMin - remM) * 60);
    
    ctx.font = `500 ${segFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${currentSeg.label} — ${remM}:${String(remS).padStart(2, '0')} remaining`, cx, segY);
  }
}

function _renderBottomStrip(ctx, width, height, dpr, state) {
  const stripHeight = Math.max(40, height * 0.08);
  const stripY = height - stripHeight;
  
  // Strip background
  const stripGrad = ctx.createLinearGradient(0, stripY, 0, height);
  stripGrad.addColorStop(0, 'rgba(20, 25, 40, 0.9)');
  stripGrad.addColorStop(1, 'rgba(10, 14, 26, 0.95)');
  ctx.fillStyle = stripGrad;
  ctx.fillRect(0, stripY, width, stripHeight);
  
  // Top border
  ctx.beginPath();
  ctx.moveTo(0, stripY);
  ctx.lineTo(width, stripY);
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();
  
  // Now playing info (from Icecast)
  const { metadata } = state;
  if (metadata?.title || metadata?.artist) {
    const npFontSize = Math.max(12, stripHeight * 0.3) * dpr;
    ctx.font = `500 ${npFontSize}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const npText = metadata.title && metadata.artist 
      ? `Now Playing: ${metadata.title} - ${metadata.artist}`
      : metadata.title || metadata.artist || '';
    
    ctx.fillText(npText, 20 * dpr, stripY + stripHeight / 2);
  }
  
  // Sync status indicator
  if (state.timing?.showSyncStatus !== false) {
    const syncStatus = state.syncStatus || 'unknown';
    const syncColour = syncStatus === 'synced' ? '#22c55e' : syncStatus === 'degraded' ? '#f59e0b' : '#ef4444';
    const syncText = syncStatus === 'synced' ? 'SYNCED' : syncStatus === 'degraded' ? 'SYNC DEGRADED' : 'NO SYNC';
    
    const syncFontSize = Math.max(10, stripHeight * 0.25) * dpr;
    ctx.font = `500 ${syncFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = syncColour;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(syncText, width - 20 * dpr, stripY + stripHeight / 2);
  }
}

function _rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}