// Zero-Asset Procedural Web Audio ASMR Synthesizer
// Generates organic wood clicks, crystalline chimes, and water drops via Web Audio API.
// Also manages intelligent media ducking during high-priority Adhan events (P0).
(() => {
  class ProceduralAudioHaptics {
    constructor() {
      this.ctx = null;
      this.duckedElements = new Set();
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    // Warm organic wood tap (45ms, triangle wave with exponential pitch decay)
    playWoodTap(volume = 0.22) {
      try {
        if (typeof feat === 'function' && feat('audioHaptics') === false) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.045);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);

        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.05);
      } catch {}
    }

    // Pristine harmonic crystal chime (528Hz + 1056Hz harmonic with 1.8s exponential tail)
    playCrystalChime(volume = 0.20) {
      try {
        if (typeof feat === 'function' && feat('audioHaptics') === false) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const freqs = [528, 1056];
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          // 15ms linear attack envelope ramp to eliminate click/pop
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(volume / (idx + 1), t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 1.85);
        });
      } catch {}
    }

    // Gentle acoustic notification chime (warm D5 + A5 harmonic blend, 20ms attack ramp, 1400Hz lowpass filter, ~1.2s smooth decay)
    playGentleChime(volume = 0.18) {
      try {
        if (typeof feat === 'function') {
          if (feat('audioHaptics') === false) return;
          if (feat('notifSound') === false) return;
        }
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const notes = [
          { freq: 587.33, gainMul: 1.0, decay: 1.2 }, // D5 warm root
          { freq: 880.00, gainMul: 0.55, decay: 1.0 } // A5 warm fifth overtone
        ];

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(1.0, t);
        filter.connect(this.ctx.destination);

        notes.forEach(({ freq, gainMul, decay }) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          // 20ms linear attack envelope ramp eliminating initial click/pop
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(volume * gainMul, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

          osc.connect(gain);
          gain.connect(filter);

          osc.start(t);
          osc.stop(t + decay + 0.05);
        });
      } catch {}
    }

    // Refreshing water drop for health and 20-20-20 eye rests
    playWaterDrop(volume = 0.25) {
      try {
        if (typeof feat === 'function' && feat('audioHaptics') === false) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.03);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.09);

        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
      } catch {}
    }

    // Intelligent Audio Ducking: smoothly lowers external/internal media gain
    duckMedia(targetVolume = 0.1, rampMs = 400) {
      try {
        const audios = document.querySelectorAll('audio, video');
        audios.forEach((el) => {
          if (!el.paused && el.id !== 'adhan-player' && el.id !== 'pr-audio') {
            if (!el.dataset.origVol) el.dataset.origVol = el.volume;
            const startVol = el.volume;
            const start = performance.now();
            const ramp = () => {
              const now = performance.now();
              const p = Math.min(1, (now - start) / rampMs);
              el.volume = startVol + (targetVolume - startVol) * p;
              if (p < 1) requestAnimationFrame(ramp);
            };
            ramp();
            this.duckedElements.add(el);
          }
        });
      } catch {}
    }

    // Restores media volume back to normal smoothly
    restoreMedia(rampMs = 1200) {
      try {
        this.duckedElements.forEach((el) => {
          const origVol = parseFloat(el.dataset.origVol || '1.0');
          const startVol = el.volume;
          const start = performance.now();
          const ramp = () => {
            const now = performance.now();
            const p = Math.min(1, (now - start) / rampMs);
            el.volume = startVol + (origVol - startVol) * p;
            if (p < 1) requestAnimationFrame(ramp);
            else delete el.dataset.origVol;
          };
          ramp();
        });
        this.duckedElements.clear();
      } catch {}
    }
  }

  window.audioHaptics = new ProceduralAudioHaptics();
})();
