/* -------------------------------------------------------------------------
   AUDIO SYNTHESIS ENGINE (WEB AUDIO API)
   ------------------------------------------------------------------------- */
const AudioEngine = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playTone(freq, type = 'sine', duration = 0.1, ramp = false) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    if (ramp) {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playSlide() {
    this.playTone(180, 'sine', 0.15, true);
  },

  playOp() {
    this.playTone(380, 'triangle', 0.08);
  },

  playFail() {
    this.playTone(130, 'sawtooth', 0.4);
  },

  playClear() {
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.15);
      }, idx * 100);
    });
  }
};
