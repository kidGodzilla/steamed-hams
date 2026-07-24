import "./style.css";
import * as THREE from "three";
import { buildWorld, updateWorld } from "./world.js";
import { createPlayer } from "./player.js";
import { createStory } from "./story.js";
import { playDoorbell } from "./audio.js";

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

    if (opts.choices?.length) {
      for (const c of opts.choices) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = c.text;
        btn.addEventListener("click", () => c.next());
        choicesEl.appendChild(btn);
      }
    } else {
      continueBtn.classList.remove("hidden");
      continueBtn.onclick = () => opts.continue?.();
    }
  },
  closeDialogue() {
    dialogueEl.classList.add("hidden");
    document.body.classList.remove("ui-mode");
    player.state.canMove = true;
    if (running && endScreen.classList.contains("hidden")) {
      player.state.ignoreLookUntil = performance.now() + 300;
      canvas.requestPointerLock();
    }
  },
  showEnd(title, body) {
    ui.clearToast();
    document.exitPointerLock?.();
    document.body.classList.add("ui-mode");
    player.state.locked = false;
    player.state.canMove = false;
    endTitle.textContent = title;
    endBody.textContent = body;
    endScreen.classList.remove("hidden");
    hud.classList.add("hidden");
  },
};

function startGame() {
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
    // Interact prompt wins over toasts so hints don't hide E
    toastTimer = 0;
    promptEl.innerHTML = `<kbd>E</kbd> ${label}`;
    promptEl.classList.remove("hidden");
    break;
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
    if (player.state.canMove) updateFocus();
  } else if (!running) {
    // Idle camera drift on title — look at the front of the house
    camera.position.set(Math.sin(t * 0.12) * 3, 3.2, 14);
    camera.lookAt(0, 2.2, 0);
    if (refs) updateWorld(refs, t);
  }

  renderer.render(scene, camera);
}

frame();
