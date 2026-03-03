// clock.js — Core broadcast clock engine
// Modular mode renderer architecture. Each mode is a self-contained render function.

import { getSegmentAt, getNextSegment, resetSegmentCache } from './config.js';
import { BroadcastMode } from './modes/broadcast.js';
import { StudioLEDMode } from './modes/studio-led.js';
import { AnalogueMode } from './modes/analogue.js';
import { FlipMode } from './modes/flip.js';
import { MinimalMode } from './modes/minimal.js';
import { CountdownMode } from './modes/countdown.js';
import { BinaryMode } from './modes/binary.js';
import { WorldMode } from './modes/world.js';
import { SpectrumMode } from './modes/spectrum.js';
import { NixieMode } from './modes/nixie.js';

const TAU = Math.PI * 2;

export const MODES = [
  BroadcastMode,
  StudioLEDMode,
  AnalogueMode,
  FlipMode,
  MinimalMode,
  CountdownMode,
  BinaryMode,
  WorldMode,
  SpectrumMode,
  NixieMode,
];

export class BroadcastClock {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.segments = config.segments || [];
    this.colours = config.colours || {};
    this.display = config.display || {};
    this.timing = config.timing || {};

    // Current mode
    this._modeIndex = 0;
    this._mode = MODES[0];

    // Time state
    this._workerTime = Date.now();
    this._workerPerfStamp = performance.now();
    this._syncStatus = 'unsynced';
    this._syncRtt = Infinity;

    // Interaction
    this._hoveredSegment = null;
    this._selectedSegment = null;

    // Metadata
    this._nowPlaying = { artist: '', title: '' };
    this._showInfo = config.show || {};

    // Stopwatch
    this._stopwatch = { running: false, startTime: 0, elapsed: 0 };

    // Tally lights
    this._tallies = config.tallies || [
      { label: 'MIC LIVE', colour: '#ef4444', active: false },
      { label: 'ON AIR', colour: '#ef4444', active: false },
      { label: 'PHONE', colour: '#f59e0b', active: false },
      { label: 'RECORDING', colour: '#ef4444', active: false },
    ];

    // Broadcast widgets
    this._broadcastDelay = 0; // seconds
    this._actionButtons = [
      { label: 'BREAK', colour: '#22c55e', active: false },
      { label: 'EXIT', colour: '#f59e0b', active: false },
      { label: 'DUMP', colour: '#ef4444', active: false },
    ];

    // Callbacks
    this.onModeChange = null;
    this.onStopwatchChange = null;
    this.onTallyChange = null;

    // Worker
    this._worker = null;
    this._rafId = null;

    this._setupCanvas();
    this._setupEvents();
    this._startWorker();
    this._startRender();
  }

  // ─── Mode Management ─────────────────────────────────────

  get mode() { return this._mode; }
  get modeIndex() { return this._modeIndex; }
  get modes() { return MODES; }

  setMode(indexOrId) {
    let idx;
    if (typeof indexOrId === 'string') {
      idx = MODES.findIndex(m => m.id === indexOrId);
      if (idx < 0) return;
    } else {
      idx = indexOrId;
      if (idx < 0 || idx >= MODES.length) return;
    }
    this._modeIndex = idx;
    this._mode = MODES[idx];
    if (this.onModeChange) this.onModeChange(this._mode, idx);
  }

  // ─── Stopwatch ────────────────────────────────────────────

  get stopwatch() {
    const sw = this._stopwatch;
    const elapsed = sw.running
      ? sw.elapsed + (performance.now() - sw.startTime)
      : sw.elapsed;
    return { running: sw.running, elapsed };
  }

  stopwatchToggle() {
    const sw = this._stopwatch;
    if (sw.running) {
      sw.elapsed += performance.now() - sw.startTime;
      sw.running = false;
    } else {
      sw.startTime = performance.now();
      sw.running = true;
    }
    if (this.onStopwatchChange) this.onStopwatchChange(this.stopwatch);
  }

  stopwatchReset() {
    this._stopwatch = { running: false, startTime: 0, elapsed: 0 };
    if (this.onStopwatchChange) this.onStopwatchChange(this.stopwatch);
  }

  // ─── Tally Lights ────────────────────────────────────────

  get tallies() { return this._tallies; }

  toggleTally(index) {
    if (index >= 0 && index < this._tallies.length) {
      this._tallies[index].active = !this._tallies[index].active;
      if (this.onTallyChange) this.onTallyChange(this._tallies);
    }
  }

  // ─── Action Buttons ──────────────────────────────────────

  get actionButtons() { return this._actionButtons; }

  toggleAction(index) {
    if (index >= 0 && index < this._actionButtons.length) {
      this._actionButtons[index].active = !this._actionButtons[index].active;
    }
  }

  // ─── Broadcast Delay ─────────────────────────────────────

  get broadcastDelay() { return this._broadcastDelay; }
  set broadcastDelay(v) { this._broadcastDelay = v; }

  // ─── Precision Time ──────────────────────────────────────

  _now() {
    const elapsed = performance.now() - this._workerPerfStamp;
    return this._workerTime + elapsed;
  }

  _startWorker() {
    try {
      const workerUrl = new URL('./clock-worker.js', import.meta.url);
      this._worker = new Worker(workerUrl, { type: 'module' });
    } catch (e) {
      this._worker = null;
      this._fallbackTicker();
      return;
    }

    this._worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'tick') {
        this._workerTime = msg.time;
        this._workerPerfStamp = performance.now();
      } else if (msg.type === 'sync') {
        this._syncStatus = msg.status;
        this._syncRtt = msg.rtt;
      }
    };

    const syncEndpoint = this.timing.syncEnabled !== false
      ? (this.timing.syncEndpoint || '/api/time')
      : null;

    this._worker.postMessage({
      type: 'init',
      syncEndpoint,
      syncInterval: this.timing.syncInterval || 60000,
    });
  }

  _fallbackTicker() {
    setInterval(() => {
      this._workerTime = Date.now();
      this._workerPerfStamp = performance.now();
    }, 100);
  }

  // ─── Canvas Setup ─────────────────────────────────────────

  _setupCanvas() {
    this._resize();
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.canvas.parentElement || this.canvas);
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const pw = parent ? parent.clientWidth : 400;
    const ph = parent ? parent.clientHeight : 400;
    const size = Math.max(200, Math.min(pw, ph));
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.size = size;
    this.dpr = dpr;
    this.cx = (size * dpr) / 2;
    this.cy = (size * dpr) / 2;
    this.radius = (size * dpr) / 2 * 0.92;
  }

  // ─── Events ───────────────────────────────────────────────

  _setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouse(e));
    this.canvas.addEventListener('mouseleave', () => {
      this._hoveredSegment = null;
    });
    this.canvas.addEventListener('click', (e) => this._onClick(e));
  }

  _getMinuteFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * this.dpr - this.cx;
    const y = (e.clientY - rect.top) * this.dpr - this.cy;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < this.radius * 0.35 || dist > this.radius * 1.05) return -1;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += TAU;
    return (angle / TAU) * 60;
  }

  _onMouse(e) {
    const minute = this._getMinuteFromEvent(e);
    if (minute < 0) { this._hoveredSegment = null; return; }
    this._hoveredSegment = getSegmentAt(this.segments, minute);
  }

  _onClick(e) {
    const minute = this._getMinuteFromEvent(e);
    if (minute < 0) { this._selectedSegment = null; return; }
    this._selectedSegment = getSegmentAt(this.segments, minute);
  }

  // ─── Public API ───────────────────────────────────────────

  setNowPlaying(data) {
    this._nowPlaying = { ...this._nowPlaying, ...data };
  }

  setConfig(config) {
    this.config = config;
    this.segments = config.segments || [];
    this.colours = config.colours || {};
    this.display = config.display || {};
    this._showInfo = config.show || {};
    resetSegmentCache();
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._worker) this._worker.postMessage({ type: 'stop' });
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }

  // ─── Render Loop ──────────────────────────────────────────

  _startRender() {
    const frame = () => {
      this._render();
      this._rafId = requestAnimationFrame(frame);
    };
    this._rafId = requestAnimationFrame(frame);
  }

  _render() {
    const ctx = this.ctx;
    const now = this._now();
    const date = new Date(now);
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();
    const exactMinute = minutes + seconds / 60 + ms / 60000;

    // Clear & background
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Build state object for mode renderer
    const state = {
      cx: this.cx,
      cy: this.cy,
      r: this.radius,
      dpr: this.dpr,
      size: this.size,
      date,
      exactMinute,
      segments: this.segments,
      colours: this.colours,
      display: this.display,
      timing: this.timing,
      hoveredSegment: this._hoveredSegment,
      selectedSegment: this._selectedSegment,
      syncStatus: this._syncStatus,
      syncRtt: this._syncRtt,
      nowPlaying: this._nowPlaying,
      showInfo: this._showInfo,
    };

    // Render active mode
    const result = this._mode.render(ctx, state);

    // Store results for side panel access
    this._lastResult = result || {};

    // Draw stopwatch overlay if active
    this._drawStopwatch(ctx);
  }

  _drawStopwatch(ctx) {
    const sw = this.stopwatch;
    if (sw.elapsed === 0 && !sw.running) return;

    const elapsed = sw.elapsed;
    const totalSec = elapsed / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const hundredths = Math.floor((totalSec % 1) * 100);
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

    const fs = Math.max(12, this.size / 18) * this.dpr;
    const y = this.cy + this.radius * 0.88;

    // Background pill
    ctx.font = `700 ${fs}px "JetBrains Mono", monospace`;
    const tw = ctx.measureText(str).width + 20 * this.dpr;
    const th = fs * 1.4;
    const tx = this.cx - tw / 2;
    const ty = y - th / 2;

    ctx.fillStyle = sw.running ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    const rad = th / 2;
    ctx.moveTo(tx + rad, ty);
    ctx.lineTo(tx + tw - rad, ty);
    ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + rad);
    ctx.lineTo(tx + tw, ty + th - rad);
    ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - rad, ty + th);
    ctx.lineTo(tx + rad, ty + th);
    ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - rad);
    ctx.lineTo(tx, ty + rad);
    ctx.quadraticCurveTo(tx, ty, tx + rad, ty);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = sw.running ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1 * this.dpr;
    ctx.stroke();

    ctx.fillStyle = sw.running ? '#22c55e' : 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, this.cx, y);
    ctx.textAlign = 'center';
  }
}
