const cache = new Map();

function get(name) {
  if (!cache.has(name)) {
    const a = new Audio(`/audio/${name}.wav`);
    a.preload = "auto";
    cache.set(name, a);
  }
  return cache.get(name);
}

/** Play a one-shot SFX. Safe to call from click handlers (user gesture). */
export function play(name, { volume = 0.85, rate = 1 } = {}) {
  const base = get(name);
  const a = base.cloneNode();
  a.volume = volume;
  a.playbackRate = rate;
  const p = a.play();
  if (p?.catch) p.catch(() => {});
  return a;
}

export function playDoorbell() {
  return play("doorbell", { volume: 0.9 });
}

export function playDoorSwing({ volume = 0.8, rate = 1 } = {}) {
  return play("door_swing", { volume, rate });
}

export function playFiretruck({ volume = 0.75 } = {}) {
  return play("firetruck", { volume });
}

export function playHelpHelp({ volume = 0.9 } = {}) {
  return play("help_help", { volume });
}

let flamesLoop = null;

/** Looping fire bed — safe to call again to retune volume. */
export function startFlamesLoop({ volume = 0.55 } = {}) {
  if (!flamesLoop) {
    flamesLoop = get("flames");
    flamesLoop.loop = true;
  }
  flamesLoop.volume = volume;
  if (flamesLoop.paused) {
    flamesLoop.currentTime = 0;
    const p = flamesLoop.play();
    if (p?.catch) p.catch(() => {});
  }
  return flamesLoop;
}

export function stopFlamesLoop() {
  if (!flamesLoop) return;
  flamesLoop.pause();
  flamesLoop.currentTime = 0;
}
