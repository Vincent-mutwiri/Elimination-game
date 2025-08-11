export function useSounds() {
  return function play(name) {
    try {
      // eslint-disable-next-line no-undef
      if (typeof window !== 'undefined' && typeof AudioContext !== 'undefined') {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode).connect(ctx.destination);
        oscillator.type = 'sine';
        const now = ctx.currentTime;

        if (name === 'countdown') {
          oscillator.frequency.setValueAtTime(880, now);
          oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.4);
          gainNode.gain.setValueAtTime(0.001, now);
          gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
        } else {
          oscillator.frequency.setValueAtTime(660, now);
          gainNode.gain.setValueAtTime(0.001, now);
          gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.25);
        }
      }
    } catch {}
  };
}
