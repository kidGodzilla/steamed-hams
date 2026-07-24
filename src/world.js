import * as THREE from "three";
import {
  PALETTE,
  addBox,
  makeCharacter,
  makeHam,
  makeChair,
  makeDoorLeaf,
  makeSmokePuff,
} from "./voxels.js";

export function buildWorld(scene) {
  const interactables = [];
  const colliders = [];
  const lights = {};
  const refs = {};

  // Ground (extends past Krusty Burger down the street)
  addBox(scene, PALETTE.grass, -50, -1, -22, 72, 1, 44, { noShadow: true });
  addBox(scene, PALETTE.path, -1.3, -0.97, -2, 2.6, 1, 14, { noShadow: true });
  addBox(scene, PALETTE.path, -48, -0.97, -7.2, 42, 1, 2.4, { noShadow: true }); // street to Krusty

  // Hedge fence along street
  for (let x = -14; x <= 14; x += 2) {
    if (Math.abs(x) < 2.5) continue;
    addBox(scene, PALETTE.hedge, x, 0, 14, 1.8, 1.3, 0.7, { noShadow: true });
  }

  const house = new THREE.Group();
  house.name = "house";

  // Simple stoop centered on the door (front wall exterior is z=3)
  addBox(house, PALETTE.wallDark, -1.5, 0, 3, 3, 0.28, 1.5);
  addBox(house, PALETTE.wood, -1.25, 0.28, 4.3, 2.5, 0.16, 0.8);
  addBox(house, PALETTE.woodDark, -1.1, 0, 5.0, 2.2, 0.28, 0.65);

  // Floor (stops at the front wall — does not poke through the doorway)
  addBox(house, PALETTE.floor, -6, 0, -8, 13, 0.25, 10, { noShadow: true });
  addBox(house, PALETTE.rug, 0.5, 0.26, -1.2, 3.2, 0.04, 2.4, { noShadow: true });

  const intWallH = 4;
  const extWallH = 6;

  // Exterior walls — front opening is exactly 2 units (x -1..1) to match the door
  addBox(house, PALETTE.wall, -6, 0, -8, 13, extWallH, 1);
  addBox(house, PALETTE.wall, -6, 0, 2, 5, extWallH, 1); // left of door: x -6..-1
  addBox(house, PALETTE.wall, 1, 0, 2, 6, extWallH, 1); // right of door: x 1..7
  addBox(house, PALETTE.wall, -1, 3, 2, 2, 1, 1); // lintel over door
  addBox(house, PALETTE.wall, -1, 4, 2, 2, extWallH - 4, 1); // story above door
  addBox(house, PALETTE.wallDark, -6, 4, 2, 13, 0.28, 1); // second-floor band (front)
  // Left wall with a kitchen window cutout (opening: y 1..3, z -6.4..-4.2)
  addBox(house, PALETTE.wall, -6, 0, -7, 1, extWallH, 0.6); // south of window
  addBox(house, PALETTE.wall, -6, 0, -4.2, 1, extWallH, 6.2); // north of window
  addBox(house, PALETTE.wall, -6, 0, -6.4, 1, 1, 2.2); // under window
  addBox(house, PALETTE.wall, -6, 3, -6.4, 1, 1, 2.2); // over window
  addBox(house, PALETTE.wall, -6, 4, -6.4, 1, extWallH - 4, 2.2); // above window to roof
  addBox(house, PALETTE.wall, 6, 0, -7, 1, extWallH, 9);

  // Window frames + glass + curtains
  function windowUnit(x, y, z, w, h, axis = "x") {
    if (axis === "x") {
      addBox(house, PALETTE.trim, x - 0.05, y - 0.1, z, 0.15, h + 0.2, w + 0.2);
      addBox(house, PALETTE.window, x, y, z + 0.05, 0.12, h, w, {
        emissive: 0x226655,
        emissiveIntensity: 0.35,
        noShadow: true,
      });
      addBox(house, PALETTE.curtain, x + 0.08, y, z + 0.1, 0.08, h, w * 0.35, { noShadow: true });
      addBox(house, PALETTE.curtain, x + 0.08, y, z + w * 0.65, 0.08, h, w * 0.35, { noShadow: true });
    } else {
      addBox(house, PALETTE.trim, x, y - 0.1, z - 0.05, w + 0.2, h + 0.2, 0.15);
      addBox(house, PALETTE.window, x + 0.05, y, z, w, h, 0.12, {
        emissive: 0x224466,
        emissiveIntensity: 0.25,
        noShadow: true,
      });
    }
  }

  // Kitchen escape window — visible from INSIDE the kitchen (inner face x≈-5)
  addBox(house, PALETTE.woodDark, -5.15, 0.9, -6.5, 0.2, 0.15, 2.4); // sill
  addBox(house, PALETTE.woodDark, -5.15, 0.9, -6.5, 0.2, 2.2, 0.15); // jamb S
  addBox(house, PALETTE.woodDark, -5.15, 0.9, -4.35, 0.2, 2.2, 0.15); // jamb N
  addBox(house, PALETTE.woodDark, -5.15, 2.95, -6.5, 0.2, 0.15, 2.4); // header
  // Curtains pulled aside so the opening reads clearly
  addBox(house, PALETTE.curtain, -5.0, 1.05, -6.4, 0.1, 1.9, 0.35, { noShadow: true });
  addBox(house, PALETTE.curtain, -5.0, 1.05, -4.55, 0.1, 1.9, 0.35, { noShadow: true });
  // Half-casement on the south jamb — leaves the north half clear to see Krusty Burger
  const kitchenSash = new THREE.Group();
  kitchenSash.name = "kitchenSash";
  kitchenSash.position.set(-4.95, 1.1, -6.3);
  // Frame only (no opaque glass fill)
  addBox(kitchenSash, PALETTE.trim, -0.04, 0, 0.02, 0.1, 1.75, 0.95, { noShadow: true });
  addBox(kitchenSash, PALETTE.trim, -0.02, 0.05, 0.08, 0.06, 0.1, 0.82, { noShadow: true }); // bottom rail
  addBox(kitchenSash, PALETTE.trim, -0.02, 1.6, 0.08, 0.06, 0.1, 0.82, { noShadow: true }); // top rail
  addBox(kitchenSash, PALETTE.trim, -0.02, 0.05, 0.08, 0.06, 1.65, 0.1, { noShadow: true }); // stile
  addBox(kitchenSash, PALETTE.trim, -0.02, 0.05, 0.85, 0.06, 1.65, 0.1, { noShadow: true });
  addBox(kitchenSash, PALETTE.glass, 0.01, 0.18, 0.18, 0.03, 1.4, 0.65, {
    transparent: true,
    opacity: 0.22,
    noShadow: true,
  });
  kitchenSash.userData.closedRotY = 0;
  kitchenSash.userData.ajarRotY = -1.25; // nearly open — clears the view
  kitchenSash.userData.openRotY = -1.45;
  kitchenSash.rotation.y = kitchenSash.userData.ajarRotY;
  house.add(kitchenSash);
  refs.kitchenSash = kitchenSash;

  const kitchenWindow = addBox(house, 0xff00ff, -5.55, 0.6, -6.5, 2.4, 2.6, 2.5, {
    name: "kitchenWindow",
    userData: { id: "kitchenWindow", label: "Climb out the kitchen window" },
  });
  kitchenWindow.material = kitchenWindow.material.clone();
  kitchenWindow.material.transparent = true;
  kitchenWindow.material.opacity = 0;
  kitchenWindow.material.depthWrite = false;
  interactables.push(kitchenWindow);
  refs.kitchenWindow = kitchenWindow;

  // Front windows on the exterior face (z≈3) — ground + upper story
  windowUnit(-4.2, 1, 2.95, 1.8, 1.8, "z");
  windowUnit(3.2, 1, 2.95, 1.8, 1.8, "z");
  windowUnit(-4.2, 4.35, 2.95, 1.6, 1.35, "z");
  windowUnit(3.2, 4.35, 2.95, 1.6, 1.35, "z");

  // Attached garage (right / +X)
  addBox(house, PALETTE.floor, 6.25, 0, -3.2, 5.2, 0.22, 5.8, { noShadow: true });
  addBox(house, PALETTE.wall, 6, 0, -3.8, 0.35, intWallH, 6.4); // shared wall with house
  addBox(house, PALETTE.wall, 11.2, 0, -3.8, 0.35, intWallH + 0.5, 6.4);
  addBox(house, PALETTE.wall, 6.5, 0, -3.8, 5.2, intWallH + 0.5, 0.35);
  addBox(house, PALETTE.wall, 6.5, 0, 2.35, 2.2, intWallH + 0.5, 0.35);
  addBox(house, PALETTE.wall, 9.5, 0, 2.35, 2.2, intWallH + 0.5, 0.35);
  addBox(house, PALETTE.wall, 8.2, 2.85, 2.35, 1.8, 0.35, 0.35); // lintel over garage door
  addBox(house, PALETTE.door, 7.35, 0.28, 2.38, 1.7, 2.55, 0.14);
  addBox(house, PALETTE.roof, 6, intWallH + 0.2, -4.2, 5.8, 0.42, 6.8, { noShadow: true });

  // Interior partitions (ground floor only)
  addBox(house, PALETTE.wall, -2, 0, -8, 1, intWallH, 6);
  addBox(house, PALETTE.wall, -2, 0, 0, 1, intWallH, 3);
  addBox(house, PALETTE.wall, -2, 3, -2, 1, 1, 2);
  addBox(house, PALETTE.wall, -1, 0, -3, 2, intWallH, 1);
  addBox(house, PALETTE.wall, 3, 0, -3, 3, intWallH, 1);
  addBox(house, PALETTE.wall, 1, 3, -3, 2, 1, 1);

  // Roof + chimney (sits on taller exterior shell)
  addBox(house, PALETTE.roof, -7, extWallH, -9, 15, 0.55, 13, { noShadow: true });
  addBox(house, PALETTE.roof, -5.5, extWallH + 0.45, -8, 12, 0.45, 11, { noShadow: true });
  addBox(house, PALETTE.roof, 6, intWallH + 0.55, -4.2, 5.8, 0.35, 6.8, { noShadow: true });
  addBox(house, PALETTE.wallDark, 4, extWallH + 0.5, -6, 1.3, 2.2, 1.3);
  addBox(house, 0x333333, 4.25, extWallH + 2.6, -5.75, 0.8, 0.35, 0.8, { noShadow: true });

  // Wall art
  addBox(house, PALETTE.woodDark, 0.5, 2.2, -7.85, 1.2, 0.9, 0.08);
  addBox(house, 0xd4e8f0, 0.6, 2.3, -7.8, 1.0, 0.7, 0.06, { noShadow: true });
  // Picture on living-room side wall (not the entrance)
  addBox(house, PALETTE.woodDark, 5.85, 2.0, -5.2, 0.08, 0.8, 1.0);
  addBox(house, 0xf0d080, 5.8, 2.1, -5.1, 0.06, 0.6, 0.8, { noShadow: true });

  // Ceiling lamps
  addBox(house, 0xeeeeaa, 2, 3.6, 0, 0.5, 0.2, 0.5, {
    emissive: 0xffe8a0,
    emissiveIntensity: 0.6,
    noShadow: true,
  });
  addBox(house, 0xeeeeaa, -4, 3.6, -5, 0.4, 0.2, 0.4, {
    emissive: 0xffe8a0,
    emissiveIntensity: 0.5,
    noShadow: true,
  });

  // Front doorframe stays when open; leaf + accents hide together
  addBox(house, PALETTE.woodDark, -1.15, 0.28, 2.98, 0.15, 3.05, 0.14); // left jamb
  addBox(house, PALETTE.woodDark, 1.0, 0.28, 2.98, 0.15, 3.05, 0.14); // right jamb
  addBox(house, PALETTE.woodDark, -1.15, 3.15, 2.98, 2.3, 0.18, 0.14); // header

  const door = new THREE.Group();
  door.name = "frontDoor";
  door.userData = { id: "frontDoor", label: "Answer the door" };
  addBox(door, PALETTE.door, -1, 0.28, 3.02, 2, 2.9, 0.14);
  addBox(door, PALETTE.woodDark, -0.85, 0.5, 3.14, 0.75, 1.05, 0.05, { noShadow: true });
  addBox(door, PALETTE.woodDark, -0.85, 1.7, 3.14, 0.75, 1.05, 0.05, { noShadow: true });
  addBox(door, 0xc4a35a, 0.55, 1.55, 3.16, 0.14, 0.14, 0.1, {
    emissive: 0x665522,
    emissiveIntensity: 0.25,
    noShadow: true,
  });
  house.add(door);
  interactables.push(door);
  refs.door = door;

  colliders.push(
    { min: { x: -6.5, z: -8.5 }, max: { x: 6.5, z: -7.5 } },
    { min: { x: -6.5, z: 1.6 }, max: { x: -1.05, z: 2.6 } },
    { min: { x: 1.05, z: 1.6 }, max: { x: 6.5, z: 2.6 } },
    // Left wall with a gap at the kitchen window (z -6.4..-4.2)
    { min: { x: -6.5, z: -8.5 }, max: { x: -5.5, z: -6.4 } },
    { min: { x: -6.5, z: -4.2 }, max: { x: -5.5, z: 2.5 } },
    { min: { x: 5.5, z: -8.5 }, max: { x: 6.5, z: 2.5 } },
    { min: { x: -2.5, z: -8.5 }, max: { x: -1.5, z: -2.15 } },
    { min: { x: -2.5, z: 0.15 }, max: { x: -1.5, z: 2.5 } },
    // Counter / oven block — keep clear lane along the window wall
    { min: { x: -5.05, z: -7.7 }, max: { x: -2.7, z: -6.25 } },
  );

  // —— Kitchen ——
  // Clear lane along the left wall / window; appliances sit toward the fridge
  addBox(house, PALETTE.kitchen, -5.8, 0.25, -7.6, 3.5, 0.05, 1.4, { noShadow: true });
  addBox(house, PALETTE.counter, -4.35, 0.25, -7.55, 2.15, 1.05, 1.0);
  addBox(house, PALETTE.wood, -4.2, 2.3, -7.55, 1.9, 1.2, 0.7); // cabinets
  addBox(house, PALETTE.fridge, -2.9, 0.25, -7.6, 0.85, 2.4, 0.9);

  // Oven — white exterior, dark cavity (away from the window approach)
  addBox(house, PALETTE.stoveWhite, -5.0, 0.25, -7.4, 1.7, 1.85, 1.25);
  addBox(house, PALETTE.stove, -4.95, 2.05, -7.35, 1.6, 0.14, 1.15, { noShadow: true }); // cooktop
  // Burner discs
  addBox(house, 0x222226, -4.75, 2.16, -7.1, 0.32, 0.04, 0.32, { noShadow: true });
  addBox(house, 0x222226, -4.2, 2.16, -7.1, 0.32, 0.04, 0.32, { noShadow: true });
  addBox(house, 0x222226, -4.75, 2.16, -6.6, 0.32, 0.04, 0.32, { noShadow: true });
  addBox(house, 0x222226, -4.2, 2.16, -6.6, 0.32, 0.04, 0.32, { noShadow: true });
  // Dark cavity recess (visible when door drops open)
  addBox(house, PALETTE.ovenCavity, -4.85, 0.4, -7.25, 1.4, 1.35, 1.0, { noShadow: true });
  addBox(house, 0x050506, -4.75, 0.5, -7.15, 1.2, 1.15, 0.85, { noShadow: true });

  // Bottom-hinged white oven door on the FRONT face
  const ovenDoor = new THREE.Group();
  ovenDoor.name = "ovenDoor";
  ovenDoor.position.set(-4.15, 0.4, -6.15);
  addBox(ovenDoor, PALETTE.stoveWhite, -0.8, 0, -0.06, 1.6, 1.35, 0.1, { noShadow: true });
  addBox(ovenDoor, 0x111114, -0.5, 0.3, -0.01, 1.0, 0.75, 0.04, {
    emissive: 0x1a0800,
    emissiveIntensity: 0.2,
    noShadow: true,
  });
  addBox(ovenDoor, 0x888888, -0.1, 1.15, 0.02, 0.24, 0.1, 0.1, { noShadow: true }); // handle
  ovenDoor.userData.closedRotX = 0;
  ovenDoor.userData.openRotX = Math.PI / 2.15;
  ovenDoor.rotation.x = ovenDoor.userData.closedRotX;
  house.add(ovenDoor);
  refs.ovenDoor = ovenDoor;

  const stove = addBox(house, PALETTE.stove, -4.85, 2.05, -7.3, 1.4, 0.22, 1.0, {
    name: "stove",
    userData: { id: "stove", label: "Open the oven" },
  });
  interactables.push(stove);
  refs.stove = stove;

  // Inspect zone in front of the oven (doesn't block the window lane)
  const stoveProxy = addBox(house, 0xff00ff, -4.9, 0.35, -6.9, 1.9, 2.2, 1.4, {
    name: "stoveProxy",
    userData: { id: "stove", label: "Open the oven" },
  });
  stoveProxy.material = stoveProxy.material.clone();
  stoveProxy.material.transparent = true;
  stoveProxy.material.opacity = 0;
  stoveProxy.material.depthWrite = false;
  interactables.push(stoveProxy);
  refs.stoveProxy = stoveProxy;

  // Burnt roast toward the front of the cavity so flames read when open
  const roast = new THREE.Group();
  roast.position.set(-4.15, 0.55, -6.5);
  addBox(roast, PALETTE.burnt, -0.4, 0, -0.28, 0.8, 0.28, 0.55, { noShadow: true });
  addBox(roast, PALETTE.roast, -0.3, 0.22, -0.2, 0.6, 0.22, 0.4, {
    emissive: 0x441100,
    emissiveIntensity: 0.45,
    noShadow: true,
  });
  roast.visible = false;
  roast.traverse((o) => {
    if (o.isMesh) o.raycast = () => {};
  });
  house.add(roast);
  refs.roast = roast;

  // Flames — bright and forward in the cavity mouth
  const fire = new THREE.Group();
  fire.position.set(-4.15, 0.75, -6.45);
  fire.visible = false;
  const flames = [];
  for (let i = 0; i < 12; i++) {
    const f = addBox(
      fire,
      i % 2 ? PALETTE.fire : PALETTE.fireCore,
      (Math.random() - 0.5) * 0.9,
      Math.random() * 0.35,
      (Math.random() - 0.5) * 0.45,
      0.22 + Math.random() * 0.28,
      0.55 + Math.random() * 0.7,
      0.22 + Math.random() * 0.28,
      { emissive: i % 2 ? PALETTE.fire : PALETTE.fireCore, emissiveIntensity: 2.2, noShadow: true },
    );
    f.raycast = () => {};
    flames.push({ mesh: f, baseY: f.position.y, phase: Math.random() * Math.PI * 2 });
  }
  house.add(fire);
  refs.fire = fire;
  refs.flames = flames;

  const fireLight = new THREE.PointLight(0xff6622, 0, 10, 2);
  fireLight.position.set(-4.15, 1.15, -6.35);
  house.add(fireLight);
  lights.fire = fireLight;

  // Kitchen smoke — light wisps from the closed oven door
  const kitchenSmoke = new THREE.Group();
  kitchenSmoke.position.set(-4.15, 1.7, -6.1);
  kitchenSmoke.visible = false;
  const smokePuffs = makeSmokePuff(kitchenSmoke, 7);
  for (const p of smokePuffs) {
    p.mesh.scale.set(0.75, 0.9, 0.75);
    p.mesh.material.opacity = 0.2;
  }
  kitchenSmoke.traverse((o) => {
    if (o.isMesh) o.raycast = () => {};
  });
  house.add(kitchenSmoke);
  refs.kitchenSmoke = kitchenSmoke;
  refs.smokePuffs = smokePuffs;

  // Full kitchen inferno (revealed when checking the door after dinner)
  const kitchenInferno = new THREE.Group();
  kitchenInferno.visible = false;
  const infernoFlames = [];
  for (let i = 0; i < 28; i++) {
    const f = addBox(
      kitchenInferno,
      i % 2 ? PALETTE.fire : PALETTE.fireCore,
      -5.4 + Math.random() * 2.8,
      0.3 + Math.random() * 2.2,
      -7.3 + Math.random() * 4.5,
      0.35 + Math.random() * 0.55,
      0.9 + Math.random() * 1.8,
      0.35 + Math.random() * 0.55,
      { emissive: PALETTE.fire, emissiveIntensity: 1.7, noShadow: true },
    );
    f.raycast = () => {};
    infernoFlames.push({ mesh: f, baseY: f.position.y, phase: Math.random() * Math.PI * 2 });
  }
  house.add(kitchenInferno);
  refs.kitchenInferno = kitchenInferno;
  refs.infernoFlames = infernoFlames;

  const infernoLight = new THREE.PointLight(0xff4400, 0, 14, 1.6);
  infernoLight.position.set(-4.0, 2.5, -5.0);
  house.add(infernoLight);
  lights.inferno = infernoLight;

  // Exterior / house-engulfed fire (finale)
  const houseFire = new THREE.Group();
  houseFire.visible = false;
  const houseFlames = [];
  for (let i = 0; i < 16; i++) {
    const f = addBox(
      houseFire,
      i % 2 ? PALETTE.fire : PALETTE.fireCore,
      -4 + Math.random() * 8,
      1 + Math.random() * 3,
      1.5 + Math.random() * 1.2,
      0.4 + Math.random() * 0.5,
      0.8 + Math.random() * 1.4,
      0.35 + Math.random() * 0.4,
      { emissive: PALETTE.fire, emissiveIntensity: 1.6, noShadow: true },
    );
    houseFlames.push({ mesh: f, baseY: f.position.y, phase: Math.random() * Math.PI * 2 });
  }
  // roof flames
  for (let i = 0; i < 8; i++) {
    const f = addBox(
      houseFire,
      PALETTE.fireCore,
      -3 + Math.random() * 6,
      6.2 + Math.random(),
      -6 + Math.random() * 6,
      0.5,
      1.2 + Math.random(),
      0.5,
      { emissive: PALETTE.fire, emissiveIntensity: 1.8, noShadow: true },
    );
    houseFlames.push({ mesh: f, baseY: f.position.y, phase: Math.random() * Math.PI * 2 });
  }
  house.add(houseFire);
  refs.houseFire = houseFire;
  refs.houseFlames = houseFlames;

  const houseFireLight = new THREE.PointLight(0xff5522, 0, 28, 1.5);
  houseFireLight.position.set(0, 4, 1);
  house.add(houseFireLight);
  lights.houseFire = houseFireLight;

  const chimneySmoke = new THREE.Group();
  chimneySmoke.position.set(4.6, 9.2, -5.4);
  chimneySmoke.visible = false;
  const chimneyPuffs = makeSmokePuff(chimneySmoke, 8);
  house.add(chimneySmoke);
  refs.chimneySmoke = chimneySmoke;
  refs.chimneyPuffs = chimneyPuffs;

  const extinguisher = addBox(house, PALETTE.red, -2.75, 0.25, -7.05, 0.35, 1.15, 0.35, {
    name: "extinguisher",
    userData: { id: "extinguisher", label: "Grab fire extinguisher" },
  });
  addBox(house, 0xdddddd, -2.7, 1.3, -7.0, 0.25, 0.2, 0.25);
  interactables.push(extinguisher);
  refs.extinguisher = extinguisher;

  // Kitchen doorway frame (always visible — reads as a door opening)
  addBox(house, PALETTE.woodDark, -2.15, 0, -2.15, 0.35, 3.05, 0.2); // south jamb
  addBox(house, PALETTE.woodDark, -2.15, 0, 0, 0.35, 3.05, 0.2); // north jamb
  addBox(house, PALETTE.woodDark, -2.2, 2.95, -2.15, 0.45, 0.25, 2.35); // lintel
  addBox(house, PALETTE.trim, -1.88, 1.2, -2.05, 0.08, 0.15, 0.15, { noShadow: true }); // hinge hint

  // Door leaf — hinged at south jamb; starts ajar so "shut" is obvious
  const kitchenDoor = makeDoorLeaf({
    width: 1.95,
    height: 2.9,
    label: "Shut the kitchen door",
  });
  kitchenDoor.position.set(-1.55, 0.05, -2.0);
  kitchenDoor.rotation.y = -1.15; // swung open into dining room
  kitchenDoor.visible = false;
  kitchenDoor.userData.openRotY = -1.15;
  kitchenDoor.userData.openWideRotY = -Math.PI / 2; // fully open against dining wall
  kitchenDoor.userData.closedRotY = 0;
  kitchenDoor.userData.origin = kitchenDoor.position.clone();
  kitchenDoor.userData.originRotY = kitchenDoor.rotation.y;
  house.add(kitchenDoor);
  interactables.push(kitchenDoor);
  refs.kitchenDoor = kitchenDoor;

  // Backup steamed hams on sideboard (north of window — keeps sill approach clear)
  addBox(house, PALETTE.wood, -5.35, 0.25, -3.55, 1.3, 0.9, 0.65);
  const hamReady = makeHam();
  hamReady.position.set(-4.85, 1.25, -3.3);
  hamReady.visible = false;
  house.add(hamReady);
  refs.hamReady = hamReady;

  const hamReady2 = makeHam();
  hamReady2.position.set(-4.25, 1.25, -3.3);
  hamReady2.visible = false;
  house.add(hamReady2);
  refs.hamReady2 = hamReady2;

  const hamProxy = addBox(house, 0xff00ff, -5.1, 1.1, -3.5, 1.5, 0.7, 0.8, {
    name: "steamedHams",
    userData: { id: "steamedHams", label: "Take the steamed hams" },
  });
  hamProxy.material = hamProxy.material.clone();
  hamProxy.material.transparent = true;
  hamProxy.material.opacity = 0;
  hamProxy.material.depthWrite = false;
  hamProxy.visible = false;
  interactables.push(hamProxy);
  refs.hamProxy = hamProxy;

  // —— Dining room ——
  addBox(house, PALETTE.wood, 0.5, 0.25, -0.5, 3.2, 0.18, 1.8);
  addBox(house, PALETTE.woodDark, 0.7, 0, -0.3, 0.2, 0.25, 0.2);
  addBox(house, PALETTE.woodDark, 3.3, 0, -0.3, 0.2, 0.25, 0.2);
  addBox(house, PALETTE.woodDark, 0.7, 0, 0.8, 0.2, 0.25, 0.2);
  addBox(house, PALETTE.woodDark, 3.3, 0, 0.8, 0.2, 0.25, 0.2);

  // Place settings
  addBox(house, PALETTE.plate, 1.2, 0.44, 0.05, 0.5, 0.05, 0.5);
  addBox(house, PALETTE.plate, 2.5, 0.44, 0.05, 0.5, 0.05, 0.5);
  addBox(house, PALETTE.glass, 1.7, 0.44, 0.55, 0.18, 0.35, 0.18, {
    transparent: true,
    opacity: 0.55,
    noShadow: true,
  });
  addBox(house, PALETTE.glass, 3.0, 0.44, 0.55, 0.18, 0.35, 0.18, {
    transparent: true,
    opacity: 0.55,
    noShadow: true,
  });

  const wineService = new THREE.Group();
  wineService.name = "wineService";
  wineService.position.set(2.05, 0.43, 0.42);
  // Ice bucket (metal cylinder-ish)
  addBox(wineService, PALETTE.counter, -0.2, 0, -0.12, 0.38, 0.08, 0.38, { noShadow: true });
  addBox(wineService, PALETTE.counter, -0.17, 0.08, -0.1, 0.32, 0.28, 0.32, { noShadow: true });
  addBox(wineService, 0x888888, -0.19, 0.34, -0.11, 0.36, 0.06, 0.34, { noShadow: true });
  addBox(wineService, PALETTE.glass, -0.08, 0.12, 0.02, 0.12, 0.22, 0.12, {
    transparent: true,
    opacity: 0.45,
    noShadow: true,
  });
  // Wine bottle
  addBox(wineService, PALETTE.wine, 0.18, 0.05, 0.02, 0.1, 0.42, 0.1, { noShadow: true });
  addBox(wineService, 0x2a1810, 0.18, 0.46, 0.02, 0.08, 0.12, 0.08, { noShadow: true });
  wineService.visible = false;
  wineService.traverse((o) => {
    if (o.isMesh) o.raycast = () => {};
  });
  house.add(wineService);
  refs.wineService = wineService;

  const plateSpot = addBox(house, PALETTE.plate, 1.2, 0.5, 0.05, 0.5, 0.04, 0.5, {
    name: "serveSpot",
    userData: { id: "serveSpot", label: "Serve steamed hams" },
  });
  plateSpot.visible = false;
  interactables.push(plateSpot);
  refs.plateSpot = plateSpot;

  const hamOnTable = makeHam();
  hamOnTable.position.set(1.45, 0.52, 0.3);
  hamOnTable.visible = false;
  house.add(hamOnTable);
  refs.hamOnTable = hamOnTable;

  const hamOnTable2 = makeHam();
  hamOnTable2.position.set(2.75, 0.52, 0.3);
  hamOnTable2.visible = false;
  house.add(hamOnTable2);
  refs.hamOnTable2 = hamOnTable2;

  const chair1 = makeChair();
  chair1.position.set(1.4, 0, 1.5); // north of table, face -Z
  house.add(chair1);
  const chair2 = makeChair();
  chair2.position.set(2.8, 0, -1.3); // south of table, face +Z
  chair2.rotation.y = Math.PI;
  house.add(chair2);

  // Living room
  addBox(house, PALETTE.blue, 3.5, 0.25, -6.3, 2.3, 0.65, 1.15);
  addBox(house, PALETTE.blue, 3.5, 0.9, -7.05, 2.3, 0.8, 0.4);
  addBox(house, PALETTE.wood, 5.1, 0.25, -5.0, 0.7, 0.9, 0.7); // side table
  addBox(house, PALETTE.yellow, 5.25, 1.2, -4.85, 0.25, 0.35, 0.25, {
    emissive: 0xffcc66,
    emissiveIntensity: 0.4,
    noShadow: true,
  });

  const auroraView = addBox(house, PALETTE.window, 5.85, 1, -6.4, 0.18, 2.1, 2.4, {
    name: "auroraWindow",
    userData: { id: "auroraWindow", label: "Point out the aurora borealis" },
    emissive: 0x228866,
    emissiveIntensity: 0.5,
  });
  interactables.push(auroraView);
  refs.auroraView = auroraView;

  // Exit trigger for finale
  const yardExit = addBox(scene, 0x00ff00, -2, 0, 6, 4, 2.5, 3, {
    name: "yardExit",
    userData: { id: "yardExit", label: "See Chalmers out" },
  });
  yardExit.material = yardExit.material.clone();
  yardExit.material.transparent = true;
  yardExit.material.opacity = 0;
  yardExit.material.depthWrite = false;
  yardExit.visible = false;
  interactables.push(yardExit);
  refs.yardExit = yardExit;

  scene.add(house);
  refs.house = house;

  // Krusty Burger — down the street, facing the kitchen window (+X toward the house)
  const krusty = new THREE.Group();
  krusty.name = "krustyBurger";
  krusty.position.set(-40, 0, -6);
  krusty.rotation.y = Math.PI / 2;
  addBox(krusty, PALETTE.dirt, -2.8, -0.05, -2.3, 5.6, 0.12, 4.6, { noShadow: true }); // lot pad
  addBox(krusty, PALETTE.krustyRed, -2.5, 0, -2, 5, 4.5, 4);
  addBox(krusty, PALETTE.krustyYellow, -2.8, 4.5, -2.3, 5.6, 0.55, 4.6, { noShadow: true });
  addBox(krusty, PALETTE.krustyYellow, -1.2, 5.2, 2.15, 2.4, 2.2, 0.35); // sign board
  addBox(krusty, PALETTE.krustyRed, -0.9, 6.8, 2.2, 1.8, 0.45, 0.25, { noShadow: true });
  addBox(krusty, 0xffffff, -0.5, 5.6, 2.22, 0.55, 0.55, 0.12, { noShadow: true }); // clown face
  addBox(krusty, 0x222222, -0.35, 5.75, 2.24, 0.12, 0.12, 0.06, { noShadow: true });
  addBox(krusty, 0x222222, -0.05, 5.75, 2.24, 0.12, 0.12, 0.06, { noShadow: true });
  addBox(krusty, PALETTE.krustyRed, -0.25, 5.45, 2.24, 0.45, 0.12, 0.06, { noShadow: true }); // smile
  addBox(krusty, PALETTE.krustyYellow, -2.2, 1.2, 2.05, 0.35, 0.35, 0.2, {
    emissive: 0xffaa22,
    emissiveIntensity: 0.55,
    noShadow: true,
  });
  scene.add(krusty);
  refs.krusty = krusty;

  // Firetruck on the street (shown during finale)
  const firetruck = new THREE.Group();
  firetruck.name = "firetruck";
  firetruck.position.set(-7.5, 0, 13.5);
  firetruck.rotation.y = Math.PI * 0.08;
  addBox(firetruck, PALETTE.red, -1.6, 0.55, -0.55, 3.2, 1.1, 1.1);
  addBox(firetruck, PALETTE.red, 0.35, 0.75, -0.65, 1.4, 1.35, 1.3); // cab
  addBox(firetruck, PALETTE.window, 0.85, 1.15, -0.05, 0.65, 0.55, 0.08, {
    emissive: 0x224466,
    emissiveIntensity: 0.35,
    noShadow: true,
  });
  addBox(firetruck, 0xcccccc, -0.2, 1.55, -0.05, 2.2, 0.35, 0.12, { noShadow: true }); // ladder rack
  addBox(firetruck, 0x222222, -1.1, 0, -0.55, 0.45, 0.45, 0.45);
  addBox(firetruck, 0x222222, 1.15, 0, -0.55, 0.45, 0.45, 0.45);
  addBox(firetruck, 0x222222, -1.1, 0, 0.35, 0.45, 0.45, 0.45);
  addBox(firetruck, 0x222222, 1.15, 0, 0.35, 0.45, 0.45, 0.45);
  addBox(firetruck, PALETTE.yellow, -0.15, 1.05, 0.62, 0.9, 0.18, 0.08, {
    emissive: 0xffcc44,
    emissiveIntensity: 0.4,
    noShadow: true,
  });
  firetruck.visible = false;
  firetruck.traverse((o) => {
    if (o.isMesh) o.raycast = () => {};
  });
  scene.add(firetruck);
  refs.firetruck = firetruck;

  // Chalmers
  const chalmers = makeCharacter({
    body: PALETTE.suit,
    hair: PALETTE.chalmersHair,
    accent: PALETTE.shirt,
    mustache: true,
  });
  chalmers.position.set(0, 0.35, 5.5);
  chalmers.rotation.y = Math.PI;
  chalmers.userData = { id: "chalmers", label: "Talk to Superintendent Chalmers" };
  scene.add(chalmers);
  interactables.push(chalmers);
  refs.chalmers = chalmers;

  // Skinner body — only shown for the outdoor farewell tableau (gameplay is 1st-person)
  const skinner = makeCharacter({
    body: 0x4a6aaa,
    hair: 0xc8c8c8,
    accent: 0xe8d0e0,
  });
  skinner.name = "skinner";
  skinner.visible = false;
  skinner.position.set(0, 0, 8);
  scene.add(skinner);
  refs.skinner = skinner;

  // Lights
  scene.add(new THREE.AmbientLight(0x7a90a8, 0.5));
  const moon = new THREE.DirectionalLight(0xd0e4ff, 0.6);
  moon.position.set(-8, 18, 10);
  scene.add(moon);

  const porch = new THREE.PointLight(0xffe0a0, 1.15, 14);
  porch.position.set(0, 3.5, 4);
  scene.add(porch);
  lights.porch = porch;

  const diningLight = new THREE.PointLight(0xffe8c0, 1.15, 12);
  diningLight.position.set(2, 3.5, 0);
  scene.add(diningLight);

  const kitchenLight = new THREE.PointLight(0xfff0d0, 0.95, 9);
  kitchenLight.position.set(-4, 3.5, -5);
  scene.add(kitchenLight);
  lights.kitchen = kitchenLight;

  // Aurora — far behind the house, soft sky glow (not big sheets over the entrance)
  const aurora = new THREE.Group();
  const ribbonGeo = new THREE.PlaneGeometry(36, 4, 16, 2);
  const colors = [PALETTE.aurora1, PALETTE.aurora2, 0x70e0c0];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: colors[i],
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, mat);
    ribbon.position.set((i - 1) * 3, 16 + i * 1.8, -22 - i * 2);
    ribbon.rotation.x = -0.55;
    ribbon.userData.phase = i * 1.4;
    aurora.add(ribbon);
  }
  scene.add(aurora);
  refs.aurora = aurora;

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 220; i++) {
    starPos.push((Math.random() - 0.5) * 95, 11 + Math.random() * 30, (Math.random() - 0.5) * 95);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.13, transparent: true, opacity: 0.9 }),
    ),
  );

  // Single tree out front
  const tree = new THREE.Group();
  const s = 1.05;
  addBox(tree, PALETTE.woodDark, -0.28 * s, 0, -0.28 * s, 0.56 * s, 2.3 * s, 0.56 * s);
  addBox(tree, PALETTE.green, -1.4 * s, 1.7 * s, -1.4 * s, 2.8 * s, 2.0 * s, 2.8 * s, {
    noShadow: true,
  });
  addBox(tree, PALETTE.hedge, -1.0 * s, 3.2 * s, -1.0 * s, 2.0 * s, 1.4 * s, 2.0 * s, {
    noShadow: true,
  });
  tree.position.set(-4.5, 0, 6.5);
  scene.add(tree);

  // Mailbox
  addBox(scene, 0x333333, 2.6, 0, 7.2, 0.15, 1.25, 0.15);
  addBox(scene, 0xc45c26, 2.25, 1.15, 7.0, 0.8, 0.42, 0.55);
  addBox(scene, 0x222222, 2.9, 1.45, 7.15, 0.12, 0.25, 0.12);

  // Bushes flanking the house (clear of the stoop)
  addBox(scene, PALETTE.hedge, -5.2, 0, 4.2, 1.6, 1.2, 1.2, { noShadow: true });
  addBox(scene, PALETTE.hedge, 4.4, 0, 4.2, 1.6, 1.2, 1.2, { noShadow: true });

  return { interactables, colliders, lights, refs };
}

function animateFlames(list, t, amp = 0.15) {
  if (!list) return;
  for (const f of list) {
    f.mesh.position.y = f.baseY + Math.sin(t * 8 + f.phase) * amp;
    f.mesh.scale.y = 0.75 + Math.sin(t * 10 + f.phase) * 0.4;
  }
}

function animateSmoke(list, t) {
  if (!list) return;
  for (const p of list) {
    p.mesh.position.y = (t * p.speed + p.phase) % 2.8;
    p.mesh.position.x = p.baseX + Math.sin(t * 1.2 + p.phase) * 0.25;
    p.mesh.position.z = p.baseZ + Math.cos(t * 0.9 + p.phase) * 0.2;
    p.mesh.material.opacity = 0.08 + (1 - p.mesh.position.y / 2.8) * 0.18;
  }
}

export function updateWorld(refs, t) {
  if (refs.fire?.visible) animateFlames(refs.flames, t);
  if (refs.kitchenInferno?.visible) animateFlames(refs.infernoFlames, t, 0.22);
  if (refs.houseFire?.visible) animateFlames(refs.houseFlames, t, 0.25);
  if (refs.kitchenSmoke?.visible) animateSmoke(refs.smokePuffs, t);
  if (refs.chimneySmoke?.visible) animateSmoke(refs.chimneyPuffs, t * 0.8);

  if (refs.aurora) {
    for (const ribbon of refs.aurora.children) {
      ribbon.position.x = Math.sin(t * 0.15 + ribbon.userData.phase) * 3;
      ribbon.material.opacity = 0.1 + Math.sin(t * 0.4 + ribbon.userData.phase) * 0.06;
    }
  }
}
