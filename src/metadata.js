// metadata.js — Icecast/now-playing integration

export class MetadataProvider {
  constructor(options = {}) {
    this.pollUrl = options.pollUrl || null;
    this.pollInterval = options.pollInterval || 10000;
    this.onUpdate = options.onUpdate || (() => {});
    this._timer = null;
    this._current = { artist: '', title: '', listeners: 0 };
  }

  get current() {
    return this._current;
  }

  start() {
    if (!this.pollUrl) return;
    this._poll();
    this._timer = setInterval(() => this._poll(), this.pollInterval);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  setNowPlaying(data) {
    this._current = { ...this._current, ...data };
    this.onUpdate(this._current);
  }

  async _poll() {
    try {
      const res = await fetch(this.pollUrl);
      if (!res.ok) return;
      const data = await res.json();
      this._current = {
        artist: data.artist || '',
        title: data.title || '',
        listeners: data.listeners || 0,
      };
      this.onUpdate(this._current);
    } catch (e) {
      // silent fail — metadata is optional
    }
  }
}
