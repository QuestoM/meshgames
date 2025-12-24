class AudioController {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  
  // Scheduler state
  private isPlaying: boolean = false;
  private bpm: number = 120;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private scheduleAheadTime: number = 0.1;
  private lookahead: number = 25.0;
  private current16thNote: number = 0;

  // Music Theory
  // Simple minor pentatonic scale intervals relative to root
  private scale = [0, 3, 5, 7, 10]; 
  private rootFreq = 55; // Low A

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  init() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.noiseBuffer) {
      this.createNoiseBuffer();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2.0; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // --- Sound Effects ---

  playClickSound(success: boolean) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (success) {
      // Pleasant high ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } else {
      // Error buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
      osc.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }
  }

  // --- Music Scheduler ---

  startMusic(bpm: number) {
    if (!this.ctx) return;
    this.init();
    this.bpm = bpm;
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    // Vibe customization based on BPM
    if (this.bpm < 110) this.rootFreq = 48.99; // G1
    else if (this.bpm > 140) this.rootFreq = 61.74; // B1
    else this.rootFreq = 55; // A1
    
    this.scheduler();
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.timerID) window.clearTimeout(this.timerID);
  }

  private scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.current16thNote, this.nextNoteTime);
        this.nextNote();
    }
    if (this.isPlaying) {
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat; 
    this.current16thNote++;
    if (this.current16thNote === 16) {
        this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.ctx) return;

    // --- Drums ---
    // Kick on 1, 5, 9, 13
    if (beatNumber % 4 === 0) {
        this.playKick(time);
    }

    // Snare on 5, 13
    if (beatNumber === 4 || beatNumber === 12) {
        this.playSnare(time);
    }

    // Hi-hats every 8th note
    if (beatNumber % 2 === 0) {
        if (beatNumber === 4 || beatNumber === 12) {
            this.playHiHat(time, 0.15);
        } else {
            this.playHiHat(time, 0.08); 
        }
    }

    // --- Bass / Synth ---
    // Play a bass note on 16th notes to drive rhythm
    // Pattern: X . . X . X . . (Simple syncopation)
    const isBassNote = [0, 3, 5, 8, 11, 14].includes(beatNumber);
    
    if (isBassNote) {
        // Pick a note from pentatonic scale
        // Pattern logic: root on beat 1, random others
        let noteIndex = 0;
        if (beatNumber !== 0) {
           noteIndex = Math.floor(Math.random() * this.scale.length);
        }
        
        const freq = this.rootFreq * Math.pow(2, this.scale[noteIndex] / 12);
        this.playBass(time, freq, beatNumber === 0 ? 0.3 : 0.1); // Accent beat 1
    }
  }

  // --- Instrument Synthesis ---

  private playKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.noiseBuffer) return;
    
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 800;
    
    // Add some body to snare
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.1, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(gain);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    source.start(time);
    source.stop(time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playHiHat(time: number, volume: number) {
    if (!this.ctx || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(volume * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    source.start(time);
    source.stop(time + 0.05);
  }

  private playBass(time: number, freq: number, volume: number) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2); // Filter envelope "wow" sound

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.3);
  }
}

export const audioService = new AudioController();
