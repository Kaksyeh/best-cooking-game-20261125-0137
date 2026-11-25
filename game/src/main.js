// main.js — the game loop, screens, scene staging, and the test hook.
// One job: wire the kitchen together and run it.

import {
  W,
  H,
  SHIFT_SECONDS,
  WIN_SCORE,
  MAX_FAILED,
  createGameState,
  updateBurners,
  updateParticles,
  setFlash,
  stationById,
} from './world.js';
import { updateOrders, ringBell } from './orders.js';
import { createChef, moveChef, nearestStation, interact, updateChop } from './chef.js';
import { draw } from './render.js';
import { sfx } from './audio.js';
import { createInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const SCENE = params.get('scene');
let speedMul = Math.max(0.25, Math.min(16, parseFloat(params.get('speed') || '1') || 1));

let g = createGameState();
let chef = createChef();
const input = createInput(canvas);
let screen = 'title';
let last = performance.now();
let lastTickSecond = -1;

function reset() {
  g = createGameState();
  chef = createChef();
  screen = 'playing';
  lastTickSecond = -1;
}

function doInteract() {
  const ev = interact(chef, g);
  if (!ev) return;
  if (ev === 'served') {
    sfx.chime();
    setFlash(g, 'Served! +' + g.score + ' pts', '#7cbf63');
  } else if (ev === 'no-order') {
    sfx.buzz();
    setFlash(g, 'No order wants that dish', '#ff8a7a');
  } else if (ev === 'pickup') {
    sfx.pickup();
  } else if (ev === 'pickup-burnt') {
    sfx.buzz();
    setFlash(g, 'Burnt! Bin it.', '#ff8a7a');
  } else if (ev === 'bin') {
    sfx.click();
  } else if (ev === 'cook-soup' || ev === 'cook-pasta' || ev === 'place-pasta' || ev === 'add-tomato') {
    sfx.place();
  } else if (ev === 'assemble') {
    sfx.click();
  }
}

function doBell() {
  if (ringBell(g)) {
    sfx.bell();
    setFlash(g, 'Rush bell! +10s on every order', '#ffd76a');
  } else {
    sfx.buzz();
  }
}

function win() {
  screen = 'win';
  sfx.chime();
  sfx.bell();
}

function lose() {
  screen = 'loss';
  sfx.buzz();
}

function update(dt) {
  g.time += dt;
  g.shiftLeft -= dt;
  const expired = updateOrders(g, dt);
  if (expired > 0) {
    sfx.buzz();
    setFlash(g, expired === 1 ? 'An order failed!' : `${expired} orders failed!`, '#ff8a7a');
  }
  updateBurners(g, dt);
  moveChef(chef, input, dt);
  const chopped = updateChop(chef, g, input, dt);
  if (chopped) sfx.chop();
  if (input.pressed('KeyE')) doInteract();
  if (input.pressed('Space')) doBell();
  // Clicking a station the chef stands near works like E.
  for (const c of input.takeClicks()) {
    const s = STATIONS_NEAR(c.x, c.y);
    if (s && nearestStation(chef) === s) doInteract();
  }
  // Sizzle while anything cooks.
  const cooking = g.burners.some((b) => b.stage === 'soup_cooking' || b.stage === 'pasta_cooking');
  sfx.sizzle(cooking);
  // Low-time tick.
  const sec = Math.ceil(g.shiftLeft);
  if (sec <= 10 && sec !== lastTickSecond && sec > 0) {
    lastTickSecond = sec;
    sfx.tick();
  }
  updateParticles(g, dt);
  if (g.failed >= MAX_FAILED) {
    lose();
    return;
  }
  if (g.score >= WIN_SCORE) {
    win();
    return;
  }
  if (g.shiftLeft <= 0) {
    if (g.score >= WIN_SCORE) win();
    else lose();
  }
}

function STATIONS_NEAR(x, y) {
  let best = null;
  let bestD = 90;
  for (const s of [
    stationById('tomato'),
    stationById('onion'),
    stationById('pasta'),
    stationById('cheese'),
    stationById('lettuce'),
    stationById('bread'),
    stationById('board'),
    stationById('stove'),
    stationById('bin'),
    stationById('assembly'),
    stationById('pass'),
  ]) {
    const d = Math.hypot(x - s.ix, y - s.iy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function frame(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const dt = rawDt * speedMul;
  if (screen === 'title') {
    if (input.pressed('Enter') || input.takeClicks().length > 0) {
      sfx.ensure();
      sfx.click();
      screen = 'playing';
    }
  } else if (screen === 'playing') {
    if (input.pressed('KeyP') || input.pressed('Escape')) {
      screen = 'paused';
      sfx.sizzle(false);
    } else {
      update(dt);
    }
  } else if (screen === 'paused') {
    if (input.pressed('KeyP') || input.pressed('Escape')) screen = 'playing';
  } else if (screen === 'win' || screen === 'loss') {
    sfx.sizzle(false);
    if (input.pressed('KeyR') || input.pressed('Enter')) reset();
  }
  if (input.pressed('KeyM')) sfx.toggleMute();
  draw(ctx, { g, chef, screen, hover: screen === 'playing' ? nearestStation(chef) : null, muted: sfx.muted });
  input.endFrame();
  requestAnimationFrame(frame);
}

// Staged scenes for screenshots (?scene=cover|cooking|rush|serve).
function stageScene(name) {
  reset();
  if (name === 'cover') {
    // Kitchen, order board, ingredients, a dish mid-assembly, a timer, a plate ready.
    g.shiftLeft = 132;
    g.score = 120;
    g.served = 2;
    g.orders = [
      { id: 1, dish: 'soup', t: 32, total: 48 },
      { id: 2, dish: 'salad', t: 24, total: 40 },
    ];
    g.nextOrderId = 3;
    g.assembly = { lettuce: true, tomato: true, bread: false };
    g.passPlate = 'salad';
    g.burners[0] = { stage: 'soup_cooking', t: 3, dur: 6, x: 1193, y: 298 };
    chef.x = 300;
    chef.y = 670;
    chef.carry = 'tomato_chopped';
  } else if (name === 'cooking') {
    g.shiftLeft = 148;
    g.score = 40;
    g.served = 1;
    g.orders = [{ id: 1, dish: 'pasta', t: 38, total: 48 }];
    g.nextOrderId = 2;
    g.burners[0] = { stage: 'pasta_cooking', t: 5, dur: 8, x: 1193, y: 298 };
    g.burners[1] = { stage: 'soup_ready', t: 2, dur: 0, x: 1193, y: 372 };
    chef.x = 1050;
    chef.y = 330;
    chef.carry = 'cheese';
  } else if (name === 'rush') {
    g.shiftLeft = 45;
    g.score = 240;
    g.served = 5;
    g.orders = [
      { id: 1, dish: 'soup', t: 8, total: 32 },
      { id: 2, dish: 'pasta', t: 12, total: 36 },
      { id: 3, dish: 'salad', t: 15, total: 30 },
    ];
    g.nextOrderId = 4;
    g.burners[0] = { stage: 'soup_cooking', t: 4, dur: 6, x: 1193, y: 298 };
    chef.x = 640;
    chef.y = 500;
    chef.carry = 'pasta';
  } else if (name === 'serve') {
    g.shiftLeft = 88;
    g.score = 240;
    g.served = 5;
    g.orders = [
      { id: 1, dish: 'soup', t: 20, total: 48 },
      { id: 2, dish: 'salad', t: 30, total: 40 },
    ];
    g.nextOrderId = 3;
    chef.x = 980;
    chef.y = 670;
    chef.carry = 'soup';
  }
}

if (SCENE) stageScene(SCENE);

// Test hook: drives the real code paths for automated play-tests.
window.__simmer = {
  get state() {
    return {
      screen,
      score: g.score,
      tips: g.tips,
      served: g.served,
      failed: g.failed,
      shiftLeft: g.shiftLeft,
      orders: g.orders.map((o) => ({ dish: o.dish, t: Math.round(o.t * 10) / 10, total: o.total })),
      carry: chef.carry,
      burners: g.burners.map((b) => b.stage),
      assembly: { ...g.assembly },
      bellUsed: g.bellUsed,
      chef: { x: Math.round(chef.x), y: Math.round(chef.y) },
    };
  },
  start() {
    sfx.ensure();
    screen = 'playing';
  },
  reset() {
    reset();
  },
  teleport(x, y) {
    chef.x = x;
    chef.y = y;
  },
  station(id) {
    const s = stationById(id);
    return s ? { x: s.ix, y: s.iy } : null;
  },
  interact() {
    doInteract();
  },
  bell() {
    doBell();
  },
  setHoldE(v) {
    input.debugHoldE = v;
  },
  setTimeLeft(s) {
    g.shiftLeft = s;
  },
  setSpeed(n) {
    speedMul = Math.max(0.25, Math.min(16, n));
  },
};

requestAnimationFrame(frame);
