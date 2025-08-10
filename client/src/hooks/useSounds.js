// Simple sound hook without external dependencies
export function useSounds() {
  const playSound = (soundName) => {
    try {
      // Create audio element for basic sound support
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available:', soundName);
    }
  };

  return playSound;
}