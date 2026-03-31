const audioCache: Record<string, HTMLAudioElement> = {};

export const playSound = (name: 'correct' | 'incorrect' | 'finish') => {
  const srcMap: Record<string, string> = {
    correct: '/siqi/audio/correct.wav',
    incorrect: '/siqi/audio/incorrect.wav',
    finish: '/siqi/audio/finish.mp3',
  };

  const src = srcMap[name];
  if (!src) return;

  try {
    let audio = audioCache[src];
    if (!audio) {
      audio = new Audio(src);
      audioCache[src] = audio;
    } else {
      audio.currentTime = 0;
    }
    audio.play().catch((e) => console.warn('音效播放失败:', e));
  } catch (e) {
    console.warn('音效加载失败:', e);
  }
};
