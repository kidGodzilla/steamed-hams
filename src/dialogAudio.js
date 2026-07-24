/**
 * Optional synced dialogue VO from dialog.wav / dialog.mp3 + dialog-cues.json.
 * Uses Web Audio (AudioBuffer + start offset/duration) for sample-accurate cues.
 * If media is missing, all calls no-op and the game stays text-only.
 */

const CANDIDATES = ["/audio/dialog.wav", "/audio/dialog.mp3"];

let cues = null;
let readyPromise = null;
let voEnabled = false;
let ctx = null;
let buffer = null;
let activeSource = null;
let activeGain = null;
let activeToken = 0;
let endTimer = 0;

function loadVo() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    try {
      const cuesRes = await fetch("/audio/dialog-cues.json");
      if (!cuesRes.ok) {
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

      let mediaUrl = null;
      for (const url of CANDIDATES) {
        const head = await fetch(url, { method: "HEAD" });
        if (head.ok) {
          mediaUrl = url;
          break;
        }
      }
      if (!mediaUrl) {
        voEnabled = false;
        return false;
      }

      const abs = await fetch(mediaUrl).then((r) => {
        if (!r.ok) throw new Error("dialog media missing");
        return r.arrayBuffer();
      });

      ctx = new (window.AudioContext || window.webkitAudioContext)();
      buffer = await ctx.decodeAudioData(abs.slice(0));
      voEnabled = true;
      return true;
    } catch {
      voEnabled = false;
      cues = {};
      buffer = null;
      return false;
    }
  })();

  return readyPromise;
}

async function ensureRunningContext() {
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

/** Prefetch on first user gesture. Safe if VO files are absent. */
export function prepareDialogAudio() {
  return loadVo().then(async (ok) => {
    if (ok) await ensureRunningContext();
    return ok;
  });
}

/** True once dialog media + cues are confirmed available. */
export function isDialogVoEnabled() {
  return voEnabled;
}

export function stopDialogAudio() {
  activeToken += 1;
  if (endTimer) {
    clearTimeout(endTimer);
    endTimer = 0;
  }
  if (activeSource) {
    try {
      activeSource.onended = null;
      activeSource.stop();
    } catch {
      /* already stopped */
    }
    activeSource.disconnect();
    activeSource = null;
  }
  if (activeGain) {
    try {
      activeGain.disconnect();
    } catch {
      /* ignore */
    }
    activeGain = null;
  }
}

/**
 * Play a named cue [start, end] seconds from the decoded buffer.
 * Resolves when the segment finishes, or immediately if VO is unavailable.
 */
export function playDialogCue(id, { volume = 0.92 } = {}) {
  if (!id) return Promise.resolve();
  const token = ++activeToken;

  return loadVo().then(async () => {
    if (!voEnabled || !buffer || !cues || !ctx) return;
    const span = cues[id];
    if (!span || token !== activeToken) return;

    let [start, end] = span;
    if (!(end > start)) return;

    // Clamp to buffer bounds
    const max = buffer.duration;
    start = Math.max(0, Math.min(start, max));
    end = Math.max(start, Math.min(end, max));
    const duration = end - start;
    if (duration <= 0.01) return;

    if (!(await ensureRunningContext()) || token !== activeToken) return;

    // Stop prior cue without bumping token (we're the new owner)
    if (endTimer) {
      clearTimeout(endTimer);
      endTimer = 0;
    }
    if (activeSource) {
      try {
        activeSource.onended = null;
        activeSource.stop();
      } catch {
        /* ignore */
      }
      activeSource.disconnect();
      activeSource = null;
    }
    if (activeGain) {
      activeGain.disconnect();
      activeGain = null;
    }

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    activeSource = source;
    activeGain = gain;

    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (endTimer) {
          clearTimeout(endTimer);
          endTimer = 0;
        }
        if (activeSource === source) {
          activeSource = null;
          activeGain = null;
        }
        resolve();
      };

      source.onended = done;
      // Backup in case onended is delayed/missing after stop()
      endTimer = window.setTimeout(done, duration * 1000 + 50);

      try {
        // when=0 → now; offset/duration are sample-accurate on the buffer
        source.start(0, start, duration);
      } catch {
        voEnabled = false;
        done();
      }
    });
  });
}
