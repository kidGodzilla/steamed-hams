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
