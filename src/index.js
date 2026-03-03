// index.js — Web component registration + standalone init

import { BroadcastClock, MODES } from './clock.js';
import { MetadataProvider } from './metadata.js';
import { parseConfig } from './config.js';

// ─── Web Component ─────────────────────────────────────────

class BroadcastClockElement extends HTMLElement {
  static get observedAttributes() {
    return ['config', 'config-url', 'size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._clock = null;
    this._metadata = null;
  }

  connectedCallback() {
    const size = this.getAttribute('size') || '500';
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; }
        canvas { display: block; }
        .bc-wrap { width: ${size}px; height: ${size}px; }
      </style>
      <div class="bc-wrap">
        <canvas></canvas>
      </div>
    `;

    this._init();
  }

  async _init() {
    let config;
    const configUrl = this.getAttribute('config-url');
    const configAttr = this.getAttribute('config');

    if (configUrl) {
      try {
        const res = await fetch(configUrl);
        config = parseConfig(await res.json());
      } catch (e) {
        console.error('[broadcast-clock] Failed to load config:', e);
        return;
      }
    } else if (configAttr) {
      try {
        config = parseConfig(configAttr);
      } catch (e) {
        console.error('[broadcast-clock] Invalid config JSON:', e);
        return;
      }
    } else {
      config = parseConfig({ segments: [], name: 'Default' });
    }

    const canvas = this.shadowRoot.querySelector('canvas');
    this._clock = new BroadcastClock(canvas, config);

    // Metadata
    if (config.metadata?.icecast?.enabled) {
      const pollUrl = config.metadata.icecast.proxyUrl || '/api/now-playing';
      this._metadata = new MetadataProvider({
        pollUrl,
        pollInterval: config.metadata.icecast.pollInterval || 10000,
        onUpdate: (data) => this._clock.setNowPlaying(data),
      });
      this._metadata.start();
    }
  }

  disconnectedCallback() {
    if (this._clock) this._clock.destroy();
    if (this._metadata) this._metadata.stop();
  }

  // Public API
  setNowPlaying(data) {
    if (this._clock) this._clock.setNowPlaying(data);
  }

  setConfig(config) {
    if (this._clock) this._clock.setConfig(parseConfig(config));
  }
}

if (!customElements.get('broadcast-clock')) {
  customElements.define('broadcast-clock', BroadcastClockElement);
}

// ─── Standalone Init ────────────────────────────────────────

export { BroadcastClock, MODES, MetadataProvider, parseConfig };

/**
 * Initialise a broadcast clock on an existing canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {object} config - raw config object
 * @returns {{ clock: BroadcastClock, metadata: MetadataProvider|null }}
 */
export function init(canvas, config) {
  const parsed = parseConfig(config);
  const clock = new BroadcastClock(canvas, parsed);
  let metadata = null;

  if (parsed.metadata?.icecast?.enabled) {
    const pollUrl = parsed.metadata.icecast.proxyUrl || '/api/now-playing';
    metadata = new MetadataProvider({
      pollUrl,
      pollInterval: parsed.metadata.icecast.pollInterval || 10000,
      onUpdate: (data) => clock.setNowPlaying(data),
    });
    metadata.start();
  }

  return { clock, metadata };
}