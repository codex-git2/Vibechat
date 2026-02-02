export class AudioManager {
  constructor() {
    this.ctx = null;
    this.windGain = null;
    this.windOsc = null;
    this.ensure();
  }

  ensure() {
    if (!window.AudioContext) return;
    this.ctx = this.ctx ?? new AudioContext();
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.ctx.destination);

    this.windOsc = this.ctx.createOscillator();
    this.windOsc.type = "triangle";
    this.windOsc.frequency.value = 180;
    this.windOsc.connect(this.windGain);
    this.windOsc.start();
  }

  playJump() {
    this.playBurst(320, 0.08, 0.3);
  }

  playSwing() {
    this.playBurst(260, 0.12, 0.25);
  }

  playRelease() {
    this.playBurst(200, 0.1, 0.2);
  }

  playImpact() {
    this.playBurst(140, 0.2, 0.4);
  }

  playBurst(freq, duration, gain) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    gainNode.gain.value = gain;
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  update(delta, hero) {
    if (!this.windGain) return;
    const target = Math.min(hero.speed / 40, 1);
    this.windGain.gain.value += (target * 0.2 - this.windGain.gain.value) * delta * 4;
  }
}
