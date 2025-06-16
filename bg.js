let audio = document.querySelector('.audio-element');
let isPausedBySystem = false;
let userVolume = 1; // Default volume level

// Handle messages from popup
chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.name === "playTrack") {
    audio.loop = true;
    audio.src = 't-' + msg.track + '.mp3';
    audio.volume = userVolume;
    audio.play();
    isPausedBySystem = false;
  } else if (msg.name === "pauseTrack") {
    instantFadeOut(audio, () => {
      isPausedBySystem = false;
    });
  } else if (msg.name === "setVolume") {
    userVolume = msg.volume;
    audio.volume = userVolume;
  }
});

// Super-fast fade-out (~150ms)
function instantFadeOut(audio, callback) {
  let fade = setInterval(() => {
    if (audio.volume > 0.2) {
      audio.volume -= 0.2;
    } else {
      clearInterval(fade);
      audio.volume = 0;
      audio.pause();
      if (callback) callback();
    }
  }, 30); // very fast 30ms steps
}

// Super-fast fade-in (~150ms)
function instantFadeIn(audio) {
  audio.volume = 0;
  audio.play();
  let fade = setInterval(() => {
    if (audio.volume < userVolume - 0.2) {
      audio.volume += 0.2;
    } else {
      clearInterval(fade);
      audio.volume = userVolume;
    }
  }, 30); // very fast 30ms steps
}

// Check for other audio and fade in/out accordingly
function checkForOtherAudio() {
  chrome.tabs.query({}, function(tabs) {
    const otherAudioPlaying = tabs.some(tab => tab.audible);

    if (otherAudioPlaying && !audio.paused && !isPausedBySystem) {
      instantFadeOut(audio, () => {
        isPausedBySystem = true;
      });
    } else if (!otherAudioPlaying && isPausedBySystem) {
      instantFadeIn(audio);
      isPausedBySystem = false;
    }
  });
}

// Run every 3 seconds
setInterval(checkForOtherAudio, 3000);
