import * as THREE from "three";

const SPEED = 5.2;
const EYE = 1.7;
const RADIUS = 0.35;

export function createPlayer(camera, colliders) {
  const state = {
    pos: new THREE.Vector3(0, EYE, 10),
    yaw: 0,
    pitch: -0.12,
    keys: new Set(),
    locked: false,
    canMove: true,
    ignoreLookUntil: 0,
  };

  camera.position.copy(state.pos);
  applyRotation();

  function applyRotation() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = state.yaw;
    camera.rotation.x = state.pitch;
  }

  function onKey(e, down) {
    const k = e.code;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(k)) e.preventDefault();
    if (down) state.keys.add(k);
    else state.keys.delete(k);
  }

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  document.addEventListener("mousemove", (e) => {
    if (!state.locked || !state.canMove) return;
    if (performance.now() < state.ignoreLookUntil) return;
    state.yaw -= e.movementX * 0.0022;
    state.pitch -= e.movementY * 0.0022;
    state.pitch = Math.max(-1.35, Math.min(1.35, state.pitch));
  });

  function collides(x, z) {
    for (const c of colliders) {
      if (x + RADIUS > c.min.x && x - RADIUS < c.max.x && z + RADIUS > c.min.z && z - RADIUS < c.max.z) {
        return true;
      }
    }
    if (Math.abs(x) > 18 || Math.abs(z) > 18) return true;
    return false;
  }

  function faceToward(worldPos, opts = {}) {
    const headY = opts.headY ?? 1.7;
    const dx = worldPos.x - state.pos.x;
    const dy = headY - EYE;
    const dz = worldPos.z - state.pos.z;
    const targetYaw = Math.atan2(-dx, -dz);
    const dist = Math.hypot(dx, dz) || 0.001;
    const targetPitch = Math.max(-1.35, Math.min(1.35, Math.atan2(dy, dist)));

    if (opts.instant) {
      state.yaw = targetYaw;
      state.pitch = targetPitch;
      state.lookAnim = null;
      applyRotation();
      return;
    }

    state.lookAnim = {
      fromYaw: state.yaw,
      fromPitch: state.pitch,
      toYaw: targetYaw,
      toPitch: targetPitch,
      t: 0,
      dur: opts.duration ?? 0.5,
    };
  }

  function updateLookAnim(dt) {
    if (!state.lookAnim) return;
    state.lookAnim.t += dt;
    const u = Math.min(1, state.lookAnim.t / state.lookAnim.dur);
    const e = u * u * (3 - 2 * u);
    let dyaw = state.lookAnim.toYaw - state.lookAnim.fromYaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    state.yaw = state.lookAnim.fromYaw + dyaw * e;
    state.pitch = state.lookAnim.fromPitch + (state.lookAnim.toPitch - state.lookAnim.fromPitch) * e;
    if (u >= 1) state.lookAnim = null;
  }

  function update(dt) {
    updateLookAnim(dt);
    applyRotation();

    if (!state.canMove || !state.locked) {
      camera.position.set(state.pos.x, EYE, state.pos.z);
      return;
    }

    const forward = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    const right = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
    const wish = new THREE.Vector3();
    if (state.keys.has("KeyW")) wish.add(forward);
    if (state.keys.has("KeyS")) wish.sub(forward);
    if (state.keys.has("KeyD")) wish.add(right);
    if (state.keys.has("KeyA")) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(SPEED * dt);

    const nx = state.pos.x + wish.x;
    const nz = state.pos.z + wish.z;
    if (!collides(nx, state.pos.z)) state.pos.x = nx;
    if (!collides(state.pos.x, nz)) state.pos.z = nz;

    camera.position.set(state.pos.x, EYE, state.pos.z);
  }

  function resetPose() {
    state.pos.set(0, EYE, 10);
    state.yaw = 0;
    state.pitch = -0.12;
    state.lookAnim = null;
    applyRotation();
    camera.position.set(state.pos.x, EYE, state.pos.z);
  }

  return { state, update, resetPose, faceToward };
}
