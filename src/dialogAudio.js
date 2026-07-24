/**
 * Optional synced dialogue VO from public/audio/dialog.mp3 + dialog-cues.json.
 * If either file is missing (e.g. not committed for copyright), all calls no-op
 * and the game continues as text-only.
 */

let cues = null;
let readyPromise = null;
let voEnabled = false;
let audio = null;
let stopHandler = null;
let activeToken = 0;

function loadVo() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    try {
      const [cuesRes, audioRes] = await Promise.all([
        fetch("/audio/dialog-cues.json"),
        fetch("/audio/dialog.mp3", { method: "HEAD" }),
      ]);

      if (!cuesRes.ok || !audioRes.ok) {
        voEnabled = false;
        cues = {};
        return false;
      }

      const data = await cuesRes.json();
      if (!data || typeof data !== "object") {
        voEnabled = false;
        cues = {};
        return false;
      }

      cues = data;
      audio = new Audio("/audio/dialog.mp3");
      audio.preload = "auto";
      audio.addEventListener("error", () => {
        voEnabled = false;
      });
      voEnabled = true;
      return true;
    } catch {
      voEnabled = false;
      cues = {};
      return false;
    }
  })();

  return readyPromise;
}

/** Prefetch on first user gesture. Safe if VO files are absent. */
export function prepareDialogAudio() {
  return loadVo();
}

export function stopDialogAudio() {
  activeToken += 1;
  if (!audio) return;
  if (stopHandler) {
    audio.removeEventListener("timeupdate", stopHandler);
    stopHandler = null;
  }
  try {
    audio.pause();
  } catch {
    /* ignore */
  }
}

/**
 * Play a named cue [start, end] from dialog.mp3.
 * Resolves when the segment finishes, or immediately if VO is unavailable.
 */
export function playDialogCue(id, { volume = 0.92 } = {}) {
  if (!id) return Promise.resolve();
  const token = ++activeToken;

  return loadVo().then(() => {
    if (!voEnabled || !audio || !cues) return;
    const span = cues[id];
    if (!span || token !== activeToken) return;

    const [start, end] = span;
    if (!(end > start)) return;

    if (stopHandler) {
      audio.removeEventListener("timeupdate", stopHandler);
      stopHandler = null;
    }
    try {
      audio.pause();
    } catch {
      /* ignore */
    }
    audio.volume = volume;

    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (stopHandler) {
          audio.removeEventListener("timeupdate", stopHandler);
          stopHandler = null;
        }
        if (token === activeToken) {
          try {
            audio.pause();
          } catch {
            /* ignore */
          }
        }
        resolve();
      };

      const failSoft = () => {
        voEnabled = false;
        done();
      };

      const startPlayback = () => {
        if (token !== activeToken) {
          resolve();
          return;
        }
        try {
          audio.currentTime = start;
        } catch {
          failSoft();
          return;
        }
        const p = audio.play();
        if (p?.catch) p.catch(failSoft);

        stopHandler = () => {
          if (token !== activeToken) {
            done();
            return;
          }
          if (audio.currentTime >= end - 0.03) done();
        };
        audio.addEventListener("timeupdate", stopHandler);
        setTimeout(done, Math.max(200, (end - start) * 1000 + 400));
      };

      if (audio.readyState >= 1) startPlayback();
      else {
        audio.addEventListener("loadedmetadata", startPlayback, { once: true });
        audio.addEventListener("error", failSoft, { once: true });
      }
    });
  });
}
