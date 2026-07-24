import * as THREE from "three";

export const PALETTE = {
  grass: 0x4a8f3c,
  dirt: 0x6b4a2e,
  path: 0x9a8a6a,
  wall: 0xc4a8d0,
  wallDark: 0xa888b8,
  lilac: 0xc4a8d0,
  krustyRed: 0xd42020,
  krustyYellow: 0xffd84d,
  wine: 0x6b1e3a,
  roof: 0x8b3a2a,
  floor: 0xb8956a,
  rug: 0x8b2e2e,
  wood: 0x7a5230,
  woodDark: 0x5a3a1e,
  trim: 0xffffff,
  window: 0x7ec8e3,
  curtain: 0xc45c6a,
  door: 0x5c3d1e,
  kitchen: 0xe8e0d0,
  counter: 0xc0c8cc,
  fridge: 0xe8e8ec,
  stove: 0x3a3a3e,
  stoveWhite: 0xf4f4f6,
  ovenCavity: 0x000000,
  fire: 0xff6a20,
  fireCore: 0xffe066,
  smoke: 0x6a6a6a,
  plate: 0xf0f0f0,
  glass: 0xa8d4e8,
  bun: 0xd4a05a,
  patty: 0x5a2e14,
  lettuce: 0x5aaa3a,
  cheese: 0xf0c040,
  yellow: 0xffd84d,
  skin: 0xffd90f, // Simpsons yellow
  blue: 0x3a5f9a,
  brown: 0x5c3a1e,
  hair: 0x9a9a9a,
  chalmersHair: 0xa0a0a8,
  mustache: 0x2a1a10,
  suit: 0x2c3a4a,
  chalmersJacket: 0x2f4f9a,
  chalmersShirt: 0xf4f4f8,
  chalmersTie: 0xc62828,
  skinnerJacket: 0x3d5fad,
  skinnerShirt: 0xd8b8e4,
  skinnerTie: 0xf0b090,
  shirt: 0xf5f0e6,
  red: 0xc0392b,
  green: 0x2d6a4f,
  hedge: 0x3d6b35,
  nightSky: 0x0b1a2e,
  aurora1: 0x40d080,
  aurora2: 0x50a0e0,
  aurora3: 0xa060d0,
  roast: 0x4a2818,
  burnt: 0x2a1810,
};

const geoCache = new THREE.BoxGeometry(1, 1, 1);
const matCache = new Map();

function mat(color, opts = {}) {
  const key = `${color}|${opts.emissive || 0}|${opts.emissiveIntensity || 0}|${opts.transparent || false}|${opts.opacity ?? 1}`;
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshLambertMaterial({
        color,
        emissive: opts.emissive || 0x000000,
        emissiveIntensity: opts.emissiveIntensity || 0,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1,
      }),
    );
  }
  return matCache.get(key);
}

export function voxel(color, x, y, z, sx = 1, sy = 1, sz = 1, opts = {}) {
  const mesh = new THREE.Mesh(geoCache, mat(color, opts));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = !opts.noShadow;
  mesh.receiveShadow = !opts.noShadow;
  if (opts.name) mesh.name = opts.name;
  if (opts.userData) mesh.userData = { ...mesh.userData, ...opts.userData };
  return mesh;
}

export function addBox(group, color, x, y, z, sx, sy, sz, opts = {}) {
  const m = voxel(color, x + sx / 2, y + sy / 2, z + sz / 2, sx, sy, sz, opts);
  group.add(m);
  return m;
}

export function makeCharacter({
  jacket = PALETTE.chalmersJacket,
  shirt = PALETTE.chalmersShirt,
  tie = PALETTE.chalmersTie,
  hair,
  mustache = false,
  balding = false,
} = {}) {
  const g = new THREE.Group();
  // Jacket torso + open front showing shirt / tie
  addBox(g, jacket, -0.35, 0.7, -0.2, 0.7, 0.9, 0.4);
  addBox(g, shirt, -0.14, 1.05, -0.24, 0.28, 0.52, 0.08, { noShadow: true });
  addBox(g, shirt, -0.2, 1.48, -0.25, 0.16, 0.1, 0.08, { noShadow: true }); // collar L
  addBox(g, shirt, 0.04, 1.48, -0.25, 0.16, 0.1, 0.08, { noShadow: true }); // collar R
  addBox(g, tie, -0.055, 1.02, -0.28, 0.11, 0.5, 0.06, { noShadow: true });
  addBox(g, tie, -0.07, 1.44, -0.29, 0.14, 0.1, 0.06, { noShadow: true }); // knot
  addBox(g, PALETTE.skin, -0.28, 1.55, -0.25, 0.56, 0.55, 0.5);
  if (balding) {
    // Horseshoe fringe — bald yellow crown, grey around sides + back
    addBox(g, hair, -0.36, 1.68, -0.2, 0.1, 0.42, 0.4); // left
    addBox(g, hair, 0.26, 1.68, -0.2, 0.1, 0.42, 0.4); // right
    addBox(g, hair, -0.3, 1.72, 0.18, 0.6, 0.38, 0.12); // back
    addBox(g, hair, -0.34, 1.98, 0.02, 0.16, 0.12, 0.26); // rear-left rim
    addBox(g, hair, 0.18, 1.98, 0.02, 0.16, 0.12, 0.26); // rear-right rim
  } else {
    addBox(g, hair, -0.32, 1.95, -0.28, 0.64, 0.28, 0.56);
  }
  addBox(g, 0x222222, -0.18, 1.75, -0.26, 0.1, 0.1, 0.06, { noShadow: true });
  addBox(g, 0x222222, 0.08, 1.75, -0.26, 0.1, 0.1, 0.06, { noShadow: true });
  if (mustache) {
    addBox(g, PALETTE.mustache, -0.16, 1.62, -0.28, 0.32, 0.1, 0.08, { noShadow: true });
  }
  addBox(g, jacket, -0.55, 1.15, -0.12, 0.22, 0.55, 0.22);
  addBox(g, jacket, 0.33, 1.15, -0.12, 0.22, 0.55, 0.22);
  addBox(g, 0x2a2a2a, -0.32, 0, -0.15, 0.28, 0.7, 0.3);
  addBox(g, 0x2a2a2a, 0.04, 0, -0.15, 0.28, 0.7, 0.3);
  g.userData.isCharacter = true;
  return g;
}

export function makeHam() {
  const g = new THREE.Group();
  addBox(g, PALETTE.bun, -0.28, 0, -0.28, 0.56, 0.14, 0.56, { noShadow: true });
  addBox(g, PALETTE.patty, -0.24, 0.14, -0.24, 0.48, 0.12, 0.48, { noShadow: true });
  addBox(g, PALETTE.cheese, -0.25, 0.24, -0.25, 0.5, 0.05, 0.5, { noShadow: true });
  addBox(g, PALETTE.lettuce, -0.26, 0.28, -0.26, 0.52, 0.05, 0.52, { noShadow: true });
  addBox(g, PALETTE.bun, -0.28, 0.33, -0.28, 0.56, 0.14, 0.56, { noShadow: true });
  return g;
}

export function makeChair() {
  const g = new THREE.Group();
  // Seat; tall backrest on +Z so the open side / sitter faces local -Z
  addBox(g, PALETTE.wood, -0.3, 0.45, -0.3, 0.6, 0.1, 0.6);
  addBox(g, PALETTE.woodDark, -0.3, 0, -0.3, 0.1, 0.45, 0.1);
  addBox(g, PALETTE.woodDark, 0.2, 0, -0.3, 0.1, 0.45, 0.1);
  addBox(g, PALETTE.woodDark, -0.3, 0, 0.2, 0.1, 0.45, 0.1);
  addBox(g, PALETTE.woodDark, 0.2, 0, 0.2, 0.1, 0.45, 0.1);
  addBox(g, PALETTE.wood, -0.3, 0.55, 0.3, 0.6, 0.85, 0.12);
  return g;
}

/** Door leaf hinged at local origin; extends along +Z when rotation.y = 0. */
export function makeDoorLeaf({ width = 1.9, height = 2.85, label = "Door" } = {}) {
  const g = new THREE.Group();
  const t = 0.12;

  // Main slab (pivot at hinge edge)
  addBox(g, PALETTE.door, 0, 0, 0, t, height, width);
  // Raised panels
  addBox(g, PALETTE.woodDark, t * 0.85, 0.25, 0.2, 0.06, height * 0.35, width * 0.35, { noShadow: true });
  addBox(g, PALETTE.woodDark, t * 0.85, height * 0.52, 0.2, 0.06, height * 0.35, width * 0.35, { noShadow: true });
  addBox(g, PALETTE.wood, -0.02, 0.25, 0.2, 0.06, height * 0.35, width * 0.35, { noShadow: true });
  addBox(g, PALETTE.wood, -0.02, height * 0.52, 0.2, 0.06, height * 0.35, width * 0.35, { noShadow: true });
  // Cross rail
  addBox(g, PALETTE.woodDark, -0.01, height * 0.45, 0.12, t + 0.04, 0.12, width - 0.24, { noShadow: true });
  // Knobs proud of each face (not intersecting the slab)
  addBox(g, 0xc4a35a, t + 0.01, height * 0.48, width - 0.35, 0.12, 0.1, 0.1, {
    emissive: 0x886622,
    emissiveIntensity: 0.35,
    noShadow: true,
  });
  addBox(g, 0x8a7038, -0.1, height * 0.48, width - 0.35, 0.09, 0.08, 0.08, { noShadow: true });

  g.userData = { id: "kitchenDoor", label };
  g.name = "kitchenDoor";
  return g;
}

export function makeSmokePuff(group, count = 10) {
  const puffs = [];
  for (let i = 0; i < count; i++) {
    const p = addBox(
      group,
      PALETTE.smoke,
      (Math.random() - 0.5) * 0.8,
      Math.random() * 0.5,
      (Math.random() - 0.5) * 0.8,
      0.25 + Math.random() * 0.35,
      0.25 + Math.random() * 0.35,
      0.25 + Math.random() * 0.35,
      { transparent: true, opacity: 0.35, noShadow: true, emissive: 0x222222, emissiveIntensity: 0.1 },
    );
    puffs.push({
      mesh: p,
      baseX: p.position.x,
      baseZ: p.position.z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.5,
    });
  }
  return puffs;
}
