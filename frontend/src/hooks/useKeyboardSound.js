let keyStrokeSounds = null;

function getKeyStrokeSounds() {
  if (typeof Audio === "undefined") return [];
  if (!keyStrokeSounds) {
    keyStrokeSounds = [
      new Audio("/sounds/keystroke1.mp3"),
      new Audio("/sounds/keystroke2.mp3"),
      new Audio("/sounds/keystroke3.mp3"),
      new Audio("/sounds/keystroke4.mp3"),
    ];
  }
  return keyStrokeSounds;
}

function useKeyboardSound() {
  const playRandomKeyStrokeSound = () => {
    const sounds = getKeyStrokeSounds();
    if (sounds.length === 0) return;

    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    randomSound.currentTime = 0;
    randomSound.play().catch(() => {});
  };

  return { playRandomKeyStrokeSound };
}

export default useKeyboardSound;
