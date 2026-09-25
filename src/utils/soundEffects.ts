// Web Audio API harmonic sound synthesizers for Price Alerts and Trading cues
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a pleasant high-tech 2-tone melodic harmonic alert chime
 */
export function playAlertChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // E6

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2 (Harmonic echo)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, now + 0.1); // A6
    osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.25);

    gain2.gain.setValueAtTime(0.18, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

/**
 * Plays a subtle sonar ping
 */
export function playSonarPing() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Graceful fallback
  }
}

/**
 * Plays a rich high-conviction signal sound (Bullish fanfare or Bearish descent)
 */
export function playSignalAlertSound(side: 'LONG' | 'SHORT' = 'LONG') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const isLong = side === 'LONG';

    // 3-note ascending or descending chord
    const frequencies = isLong ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 659.25, 523.25, 392.0];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isLong ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch {
    // Graceful audio fallback
  }
}

/**
 * Plays a harmonic ascending chime for CPR Top Central Bullish Breakouts
 */
export function playBreakoutChime(side: 'BULLISH' | 'BEARISH' = 'BULLISH') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const isBull = side === 'BULLISH';
    const notes = isBull ? [587.33, 739.99, 880.0, 1174.66] : [880.0, 739.99, 587.33, 440.0];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isBull ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.15, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.3);
    });
  } catch {}
}

/**
 * Plays a celebratory double chime when Target 1 (TP1) is achieved / 50% locked
 */
export function playProfitHitChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046.5, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.2, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.4);
    });
  } catch {}
}

/**
 * Uses Web Speech API to announce new signal alerts in English or Hindi
 */
export function speakSignalAlert(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    // Cancel any previous utterances to avoid queuing delay
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Pick English or natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(
        (v) => (v.lang.startsWith('en') || v.lang.startsWith('hi')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      ) || voices[0];
      if (preferred) utterance.voice = preferred;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Graceful fallback if speech synthesis blocked
  }
}
