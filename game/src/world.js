// world.js — the kitchen: layout, stations, recipes, and the fresh state.
// One job: what the kitchen is and how its stations behave over time.

export const W = 1280;
export const H = 800;
export const BOARD_H = 104;
export const SHIFT_SECONDS = 180;
export const WIN_SCORE = 300;
export const MAX_FAILED = 3;
export const CHEF_SPEED = 270;
export const CHOP_SECONDS = 1.2;
export const SOUP_COOK_SECONDS = 6;
export const PASTA_COOK_SECONDS = 8;
export const BURN_GRACE_SECONDS = 6;

export const INGREDIENT_NAMES = {
  tomato: 'Tomato',
  onion: 'Onion',
  pasta: 'Pasta',
  cheese: 'Cheese',
  lettuce: 'Lettuce',
  bread: 'Bread',
  tomato_chopped: 'Chopped Tomato',
  onion_chopped: 'Chopped Onion',
  lettuce_chopped: 'Chopped Lettuce',
  soup: 'Tomato Soup',
  pasta_dish: 'Pasta al Forno',
  salad: 'Garden Salad',
  burnt: 'Burnt Food',
};

export const RECIPES = {
  soup: { key: 'soup', name: 'Tomato Soup', points: 40, color: '#e2574c' },
  pasta: { key: 'pasta', name: 'Pasta al Forno', points: 60, color: '#e8a33d' },
  salad: { key: 'salad', name: 'Garden Salad', points: 50, color: '#5da24a' },
};

export const CHOP_MAP = {
  tomato: 'tomato_chopped',
  onion: 'onion_chopped',
  lettuce: 'lettuce_chopped',
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

// ix/iy is the interaction point: the spot the chef stands near to use the station.
export const STATIONS = [
  { id: 'tomato', kind: 'ingredient', item: 'tomato', label: 'Tomatoes', rect: rect(24, 120, 196, 70), ix: 122, iy: 206 },
  { id: 'onion', kind: 'ingredient', item: 'onion', label: 'Onions', rect: rect(228, 120, 196, 70), ix: 326, iy: 206 },
  { id: 'pasta', kind: 'ingredient', item: 'pasta', label: 'Pasta', rect: rect(432, 120, 196, 70), ix: 530, iy: 206 },
  { id: 'cheese', kind: 'ingredient', item: 'cheese', label: 'Cheese', rect: rect(636, 120, 196, 70), ix: 734, iy: 206 },
  { id: 'lettuce', kind: 'ingredient', item: 'lettuce', label: 'Lettuce', rect: rect(840, 120, 196, 70), ix: 938, iy: 206 },
  { id: 'bread', kind: 'ingredient', item: 'bread', label: 'Bread', rect: rect(1044, 120, 196, 70), ix: 1142, iy: 206 },
  { id: 'board', kind: 'board', label: 'Chopping Board', rect: rect(24, 240, 126, 180), ix: 168, iy: 330 },
  { id: 'stove', kind: 'stove', label: 'Stove', rect: rect(1130, 240, 126, 180), ix: 1112, iy: 330 },
  { id: 'bin', kind: 'bin', label: 'Bin', rect: rect(1130, 448, 80, 64), ix: 1112, iy: 480 },
  { id: 'assembly', kind: 'assembly', label: 'Assembly', rect: rect(24, 600, 216, 140), ix: 256, iy: 670 },
  { id: 'pass', kind: 'pass', label: 'Pass', rect: rect(1040, 600, 216, 140), ix: 1024, iy: 670 },
];

export const ISLAND = rect(520, 400, 240, 80);

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function createGameState() {
  return {
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    tips: 0,
    served: 0,
    failed: 0,
    bellUsed: false,
    orders: [],
    spawnIn: 2,
    nextOrderId: 1,
    burners: [
      { stage: 'empty', t: 0, dur: 0, x: 1193, y: 298 },
      { stage: 'empty', t: 0, dur: 0, x: 1193, y: 372 },
    ],
    assembly: { lettuce: false, tomato: false, bread: false },
    passPlate: null,
    particles: [],
    flash: null,
  };
}

export function spawnParticle(g, x, y, vx, vy, life, color, size) {
  g.particles.push({ x, y, vx, vy, life, maxLife: life, color, size });
}

function spawnSteam(g, b) {
  spawnParticle(
    g,
    b.x + (Math.random() - 0.5) * 26,
    b.y - 14,
    (Math.random() - 0.5) * 12,
    -26 - Math.random() * 14,
    0.9,
    'rgba(255,255,255,0.55)',
    3 + Math.random() * 3,
  );
}

// Advance the two burners: cooking finishes, then a grace window, then it burns.
export function updateBurners(g, dt) {
  for (const b of g.burners) {
    if (b.stage === 'soup_cooking' || b.stage === 'pasta_cooking') {
      b.t += dt;
      if (Math.random() < dt * 6) spawnSteam(g, b);
      if (b.t >= b.dur) {
        b.stage = b.stage === 'soup_cooking' ? 'soup_ready' : 'pasta_ready';
        b.t = 0;
      }
    } else if (b.stage === 'soup_ready' || b.stage === 'pasta_ready') {
      b.t += dt;
      if (b.t >= BURN_GRACE_SECONDS) {
        b.stage = b.stage === 'soup_ready' ? 'soup_burnt' : 'pasta_burnt';
        b.t = 0;
      }
    }
  }
}

export function updateParticles(g, dt) {
  for (const p of g.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 6 * dt;
    p.life -= dt;
  }
  g.particles = g.particles.filter((p) => p.life > 0);
  if (g.flash) {
    g.flash.t -= dt;
    if (g.flash.t <= 0) g.flash = null;
  }
}

export function setFlash(g, text, color) {
  g.flash = { text, color: color || '#ffd76a', t: 1.4 };
}
