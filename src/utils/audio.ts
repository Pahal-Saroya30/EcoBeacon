/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Web Audio Nature Soundscape Synthesizer
// Completely programmatic, high-fidelity, and zero-asset footprint.

class NatureSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLFO: OscillatorNode | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private birdTimer: number | null = null;
  private isPlaying: boolean = false;
  private activeSound: 'forest' | 'rain' | 'birds' = 'forest';
  private currentVolume: number = 0.35;

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  // Generates 4 seconds of high-fidelity Brown Noise (perfect for wind/ocean rustle)
  private createBrownNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 4.0; // Boost volume slightly
    }
    return buffer;
  }

  // Generates 3 seconds of highpass-filtered White Noise for crisp rain details
  private createWhiteNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Plays a randomized sweet woodland bird chirp
  private triggerBirdChirp() {
    if (!this.ctx || !this.masterGain || !this.isPlaying || this.activeSound !== 'birds') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();

    osc.type = 'sine';
    chirpGain.gain.setValueAtTime(0, now);
    
    // Quick fade in/out envelope for the chirp
    chirpGain.gain.linearRampToValueAtTime(0.04 * (Math.random() * 0.5 + 0.5), now + 0.04);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    // Dynamic frequency modulation sweep (like a real bird chirping!)
    const baseFreq = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.28);

    // Route audio
    osc.connect(chirpGain);
    chirpGain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.4);

    // Schedule next chirp with organic variations (between 2 to 5.5 seconds)
    const nextInterval = 2000 + Math.random() * 3500;
    this.birdTimer = window.setTimeout(() => this.triggerBirdChirp(), nextInterval);
  }

  public start(sound: 'forest' | 'rain' | 'birds') {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      // Resume context if suspended (browser security autoplay policies)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.stopAll();
      this.isPlaying = true;
      this.activeSound = sound;

      const now = this.ctx.currentTime;

      if (sound === 'forest') {
        // --- Forest Wind Rustle ---
        const windBuffer = this.createBrownNoiseBuffer();
        this.windNode = this.ctx.createBufferSource();
        this.windNode.buffer = windBuffer;
        this.windNode.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.setValueAtTime(350, now);

        // Low frequency oscillator (LFO) to modulate wind intensity automatically
        this.windLFO = this.ctx.createOscillator();
        this.windLFO.frequency.setValueAtTime(0.08, now); // Slow 12-second wave

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(140, now); // Modulate lowpass cutoff by +/- 140Hz

        // Hook LFO to the lowpass filter frequency
        this.windLFO.connect(lfoGain);
        lfoGain.connect(this.windFilter.frequency);

        this.windNode.connect(this.windFilter);
        this.windFilter.connect(this.masterGain);

        this.windLFO.start(now);
        this.windNode.start(now);
      } else if (sound === 'rain') {
        // --- Summer Rain ---
        const rainBuffer = this.createWhiteNoiseBuffer();
        this.rainNode = this.ctx.createBufferSource();
        this.rainNode.buffer = rainBuffer;
        this.rainNode.loop = true;

        this.rainFilter = this.ctx.createBiquadFilter();
        this.rainFilter.type = 'bandpass';
        this.rainFilter.frequency.setValueAtTime(1000, now);
        this.rainFilter.Q.setValueAtTime(1.5, now);

        // Gentle highpass filter to catch direct soft splash drops
        const hpFilter = this.ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(2200, now);

        this.rainNode.connect(this.rainFilter);
        this.rainFilter.connect(hpFilter);
        hpFilter.connect(this.masterGain);

        this.rainNode.start(now);
      } else if (sound === 'birds') {
        // --- Woodland Birds ---
        // Play very soft background wind rustle + periodic active chirping
        const ambientBuffer = this.createBrownNoiseBuffer();
        this.windNode = this.ctx.createBufferSource();
        this.windNode.buffer = ambientBuffer;
        this.windNode.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.setValueAtTime(250, now); // Deeper, quieter background breeze

        this.windNode.connect(this.windFilter);
        this.windFilter.connect(this.masterGain);
        this.windNode.start(now);

        // Start programmatic chirps
        this.triggerBirdChirp();
      }
    } catch (e) {
      console.error('Failed to start Nature Soundscape Synthesizer:', e);
    }
  }

  public stopAll() {
    this.isPlaying = false;
    
    if (this.birdTimer) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }

    try {
      if (this.windNode) {
        this.windNode.stop();
        this.windNode.disconnect();
        this.windNode = null;
      }
      if (this.windLFO) {
        this.windLFO.stop();
        this.windLFO.disconnect();
        this.windLFO = null;
      }
      if (this.windFilter) {
        this.windFilter.disconnect();
        this.windFilter = null;
      }
      if (this.rainNode) {
        this.rainNode.stop();
        this.rainNode.disconnect();
        this.rainNode = null;
      }
      if (this.rainFilter) {
        this.rainFilter.disconnect();
        this.rainFilter = null;
      }
    } catch (e) {
      // Ignore cleanup state errors
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = vol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public isSoundscapeActive(): boolean {
    return this.isPlaying;
  }

  public getActiveSound(): 'forest' | 'rain' | 'birds' {
    return this.activeSound;
  }
}

export const soundscape = new NatureSoundscape();

/**
 * Synthesizes a high-fidelity, organic, arpeggiated sparkle chime sweep using the Web Audio API
 * to provide a rewarding audio feedback when an EcoBadge achievement is unlocked.
 */
export const playUnlockChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    // Create a dedicated, short-lived audio context for the chime to avoid channel conflicts
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // Positive harmonic arpeggio: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz), E6 (1318.51Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const noteDelay = 0.09; // fast sparkling sweep
    const noteDuration = 1.2; // organic decay duration

    // Master volume for the chime arpeggio
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.connect(ctx.destination);

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Blend of sine waves for purity and triangle waves for subtle warm wood-wind like body
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * noteDelay);

      // Program smooth envelope: instant attack, beautiful exponential decay
      gainNode.gain.setValueAtTime(0, now + index * noteDelay);
      gainNode.gain.linearRampToValueAtTime(0.12, now + index * noteDelay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * noteDelay + noteDuration);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now + index * noteDelay);
      osc.stop(now + index * noteDelay + noteDuration + 0.1);
    });

    // Auto-clean/close the temporary audio context once the arpeggio has finished playing
    const totalPlayTimeMs = (notes.length * noteDelay + noteDuration + 0.5) * 1000;
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, totalPlayTimeMs);

  } catch (error) {
    console.warn('Could not play achievement unlock chime:', error);
  }
};

