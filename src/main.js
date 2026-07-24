import "./style.css";
import * as THREE from "three";
import { buildWorld, updateWorld } from "./world.js";
import { createPlayer } from "./player.js";
import { createStory } from "./story.js";
import { playDoorbell } from "./audio.js";
import { playDialogCue, stopDialogAudio, prepareDialogAudio } from "./dialogAudio.js";

const canvas = document.getElementById("c");
const titleScreen = document.getElementById("title-screen");
const hud = document.getElementById("hud");
const promptEl = document.getElementById("prompt");
const objectiveEl = document.getElementById("objective");
const dialogueEl = document.getElementById("dialogue");
const speakerEl = document.getElementById("speaker");
const lineEl = document.getElementById("line");
const choicesEl = document.getElementById("choices");
const continueBtn = document.getElementById("dialogue-continue");
const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endBody = document.getElementById("end-body");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x0b1a2e);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1a2e, 0.018);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 120);

const { interactables, colliders, lights, refs } = buildWorld(scene);
const player = createPlayer(camera, colliders);
const raycaster = new THREE.Raycaster();
raycaster.far = 5.5;

let story = null;
let focused = null;
let toastTimer = 0;
let running = false;

const ui = {
  setObjective(title, body) {
    objectiveEl.innerHTML = `<strong>${title}</strong>${body}`;
    objectiveEl.style.animation = "none";
    void objectiveEl.offsetWidth;
    objectiveEl.style.animation = "";
  },
  toast(msg) {
    promptEl.innerHTML = msg;
    promptEl.classList.remove("hidden");
    toastTimer = 2.8;
  },
  clearToast() {
    toastTimer = 0;
    promptEl.classList.add("hidden");
  },
  openDialogue(opts) {
    ui.clearToast();
    player.state.canMove = false;
    player.state.locked = false;
    document.exitPointerLock?.();
    document.body.classList.add("ui-mode");
    dialogueEl.classList.remove("hidden");
    speakerEl.textContent = opts.speaker;
    lineEl.textContent = opts.line;
    choicesEl.innerHTML = "";
    continueBtn.classList.add("hidden");
    continueBtn.onclick = null;

    if (opts.audio) playDialogCue(opts.audio);
    else stopDialogAudio();

    if (opts.choices?.length) {
      for (const c of opts.choices) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = c.text;
        btn.addEventListener("click", () => {
          for (const b of choicesEl.querySelectorAll("button")) b.disabled = true;
          stopDialogAudio();
          c.next();
        });
        choicesEl.appendChild(btn);
      }
    } else {
      continueBtn.classList.remove("hidden");
      continueBtn.onclick = () => {
        stopDialogAudio();
        opts.continue?.();
      };
    }
  },
  closeDialogue() {
    stopDialogAudio();
    dialogueEl.classList.add("hidden");
    document.body.classList.remove("ui-mode");
    player.state.canMove = true;
    if (running && endScreen.classList.contains("hidden")) {
      player.state.ignoreLookUntil = performance.now() + 300;
      canvas.requestPointerLock();
    }
  },
  showEnd(title, body, opts = {}) {
    stopDialogAudio();
    ui.clearToast();
    document.exitPointerLock?.();
    document.body.classList.add("ui-mode");
    player.state.locked = false;
    player.state.canMove = false;
    endTitle.textContent = title;
    endBody.textContent = body;
    document.getElementById("replay-btn").textContent = opts.success ? "Play Again" : "Try again";
    endScreen.classList.remove("hidden");
    hud.classList.add("hidden");
  },
};

function startGame() {
  prepareDialogAudio();
  playDoorbell();
  titleScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  running = true;
  story = createStory(refs, lights, ui, player);

  refs.door.visible = true;
  refs.fire.visible = false;
  refs.roast.visible = false;
  refs.kitchenSmoke.visible = false;
  refs.chimneySmoke.visible = false;
  refs.kitchenInferno.visible = false;
  refs.houseFire.visible = false;
  lights.fire.intensity = 0;
  lights.houseFire.intensity = 0;
  if (lights.inferno) lights.inferno.intensity = 0;
  if (lights.kitchen) lights.kitchen.intensity = 0.95;
  if (lights.porch) lights.porch.intensity = 1.15;
  refs.extinguisher.visible = true;
  refs.hamReady.visible = false;
  refs.hamReady2.visible = false;
  refs.hamProxy.visible = false;
  refs.hamOnTable.visible = false;
  refs.hamOnTable2.visible = false;
  refs.plateSpot.visible = false;
  refs.yardExit.visible = false;
  refs.kitchenDoor.visible = false;
  refs.kitchenDoor.position.copy(refs.kitchenDoor.userData.origin);
  refs.kitchenDoor.rotation.y = refs.kitchenDoor.userData.openRotY ?? refs.kitchenDoor.userData.originRotY;
  refs.kitchenDoor.userData.label = "Shut the kitchen door";
  if (refs.wineService) refs.wineService.visible = false;
  if (refs.firetruck) refs.firetruck.visible = false;
  if (refs.ovenDoor) refs.ovenDoor.rotation.x = refs.ovenDoor.userData.closedRotX ?? 0;
  if (refs.kitchenSash) {
    refs.kitchenSash.rotation.y = refs.kitchenSash.userData.ajarRotY ?? -1.25;
  }
  if (refs.apron) refs.apron.visible = true;
  if (refs.mother) refs.mother.visible = true;
  if (refs.motherWindowGlass) refs.motherWindowGlass.visible = true;
  refs.chalmers.position.set(0, 0.35, 5.5);
  refs.chalmers.rotation.y = Math.PI;
  if (refs.skinner) refs.skinner.visible = false;
  player.resetPose();
  player.state.canMove = true;
  player.state.ignoreLookUntil = performance.now() + 400;

  // Lock after a tick so the start click doesn't yank the camera
  requestAnimationFrame(() => {
    canvas.requestPointerLock?.();
  });
}

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("replay-btn").addEventListener("click", () => {
  location.reload();
});

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  player.state.locked = locked;
  if (locked) {
    player.state.ignoreLookUntil = performance.now() + 250;
  }
});

canvas.addEventListener("click", () => {
  if (!running) return;
  if (document.pointerLockElement !== canvas && dialogueEl.classList.contains("hidden")) {
    player.state.ignoreLookUntil = performance.now() + 250;
    canvas.requestPointerLock();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && running && story && focused && player.state.canMove) {
    const id = focused.userData?.id;
    if (id) story.interact(id);
  }

  // Enter advances single-continue dialogue (not multi-choice)
  if (
    (e.code === "Enter" || e.code === "NumpadEnter") &&
    running &&
    !dialogueEl.classList.contains("hidden") &&
    !continueBtn.classList.contains("hidden") &&
    !continueBtn.disabled
  ) {
    e.preventDefault();
    continueBtn.click();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function gatherTargets() {
  const targets = [];
  for (const obj of interactables) {
    if (obj.visible === false) continue;
    obj.traverse?.((c) => {
      if (c.isMesh) targets.push(c);
    });
    if (obj.isMesh) targets.push(obj);
  }
  return targets;
}

function nearKitchenWindow() {
  if (!story?.canInteract?.("kitchenWindow")) return false;
  const p = player.state.pos;
  const dx = p.x - (-5.05);
  const dz = p.z - (-5.3);
  return Math.hypot(dx, dz) < 2.6;
}

/** Closer sill zone — walking into it counts as climbing out. */
function walkingIntoKitchenWindow() {
  if (!story?.canInteract?.("kitchenWindow")) return false;
  const p = player.state.pos;
  return p.x < -4.15 && p.z > -6.7 && p.z < -4.3;
}

function walkingIntoYardExit() {
  if (!story?.canInteract?.("yardExit")) return false;
  if (!refs.yardExit?.visible) return false;
  const p = player.state.pos;
  // Match yardExit volume (-2,0,6)+(4,2.5,3), slightly padded
  return p.x > -2.4 && p.x < 2.4 && p.z > 5.4 && p.z < 9.6;
}

function isMoving() {
  const k = player.state.keys;
  return k.has("KeyW") || k.has("KeyA") || k.has("KeyS") || k.has("KeyD");
}

function tryWalkInteract() {
  if (!running || !story || !player.state.canMove || !player.state.locked) return;
  if (!isMoving()) return;

  if (walkingIntoKitchenWindow()) {
    story.interact("kitchenWindow");
    return;
  }
  if (walkingIntoYardExit()) {
    story.interact("yardExit");
  }
}

function inBackRoom() {
  const p = player.state.pos;
  return p.x > 1.2 && p.x < 5.7 && p.z > -7.9 && p.z < -3.35;
}

function updateFocus() {
  focused = null;

  if (!running || !story || !player.state.canMove || !player.state.locked) {
    if (toastTimer <= 0) promptEl.classList.add("hidden");
    return;
  }

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(gatherTargets(), false);

  for (const hit of hits) {
    let obj = hit.object;
    while (obj && !obj.userData?.id) obj = obj.parent;
    if (!obj?.userData?.id) continue;
    const id = obj.userData.id;
    const label = story.labelFor(id, obj.userData.label);
    if (!label) continue;
    focused = obj;
    toastTimer = 0;
    promptEl.innerHTML = `<kbd>E</kbd> ${label}`;
    promptEl.classList.remove("hidden");
    break;
  }

  // Standing in/at the sill often puts you inside the hitbox — use proximity
  if (!focused && nearKitchenWindow() && refs.kitchenWindow) {
    const label = story.labelFor("kitchenWindow", "Climb out the kitchen window");
    if (label) {
      focused = refs.kitchenWindow;
      toastTimer = 0;
      promptEl.innerHTML = `<kbd>E</kbd> ${label}`;
      promptEl.classList.remove("hidden");
    }
  }

  if (!focused && story.canInteract("yardExit") && refs.yardExit?.visible) {
    const label = story.labelFor("yardExit", "See Chalmers out");
    if (label && walkingIntoYardExit()) {
      focused = refs.yardExit;
      toastTimer = 0;
      promptEl.innerHTML = `<kbd>E</kbd> ${label}`;
      promptEl.classList.remove("hidden");
    }
  }

  // Anywhere in the living / back room
  if (!focused && inBackRoom() && refs.checkMother) {
    const label = story.labelFor("checkMother", "Check on Mother");
    if (label) {
      focused = refs.checkMother;
      toastTimer = 0;
      promptEl.innerHTML = `<kbd>E</kbd> ${label}`;
      promptEl.classList.remove("hidden");
    }
  }

  if (!focused) {
    if (toastTimer > 0) {
      promptEl.classList.remove("hidden");
    } else {
      promptEl.classList.add("hidden");
    }
  }
}

const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (toastTimer > 0) toastTimer -= dt;

  if (running && player) {
    // Keep updating during dialogue so look-at pivots can finish
    player.update(dt);
    updateWorld(refs, t);
    if (player.state.canMove) {
      updateFocus();
      tryWalkInteract();
    }
  } else if (!running) {
    // Idle camera drift on title — look at the front of the house
    camera.position.set(Math.sin(t * 0.12) * 3, 3.2, 14);
    camera.lookAt(0, 2.2, 0);
    if (refs) updateWorld(refs, t);
  }

  renderer.render(scene, camera);
}

frame();
