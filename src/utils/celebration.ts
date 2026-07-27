import confetti from 'canvas-confetti';

/**
 * Plays a clean, pleasant multi-tone victory / success chime using Web Audio API.
 * No external audio files or dependencies required.
 */
export function playSuccessSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Ascending major chord sequence (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: now + 0.0, duration: 0.18 },  // C5
      { freq: 659.25, time: now + 0.12, duration: 0.18 }, // E5
      { freq: 783.99, time: now + 0.24, duration: 0.22 }, // G5
      { freq: 1046.50, time: now + 0.38, duration: 0.55 }  // C6
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Smooth gain envelope (attack & decay)
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.28, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });

    // Shimmering accent chime
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();

    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(1046.50, now + 0.38);
    shimmerGain.gain.setValueAtTime(0.001, now + 0.38);
    shimmerGain.gain.exponentialRampToValueAtTime(0.12, now + 0.42);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    shimmerOsc.start(now + 0.38);
    shimmerOsc.stop(now + 0.95);

  } catch (error) {
    console.error('Web Audio API playSuccessSound error:', error);
  }
}

/**
 * Triggers a full-screen, multi-stage celebratory confetti explosion using canvas-confetti.
 */
export function triggerFullConfetti(): void {
  try {
    // 1. Initial burst from center
    confetti({
      particleCount: 110,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#8e004b', '#ff007f', '#ffd9e2', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      zIndex: 9999
    });

    // 2. Left side cannon
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.7 },
        colors: ['#8e004b', '#ff007f', '#ffd9e2', '#f59e0b'],
        zIndex: 9999
      });
    }, 200);

    // 3. Right side cannon
    setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.7 },
        colors: ['#8e004b', '#3b82f6', '#10b981', '#8b5cf6'],
        zIndex: 9999
      });
    }, 400);

    // 4. Finale grand shower from top
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 120,
        startVelocity: 45,
        origin: { y: 0.3 },
        colors: ['#8e004b', '#ff007f', '#ffd9e2', '#ffffff'],
        zIndex: 9999
      });
    }, 700);
  } catch (error) {
    console.error('Confetti trigger error:', error);
  }
}

/**
 * Executes both sound effect and full-screen confetti explosion.
 */
export function triggerCelebration(): void {
  playSuccessSound();
  triggerFullConfetti();
}
