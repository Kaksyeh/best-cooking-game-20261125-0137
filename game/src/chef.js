// chef.js — the chef: walking, carrying, chopping, and using the stations.
// One job: everything the chef does with their hands and feet.

import {
  W,
  H,
  BOARD_H,
  CHEF_SPEED,
  CHOP_SECONDS,
  CHOP_MAP,
  SOUP_COOK_SECONDS,
  PASTA_COOK_SECONDS,
  STATIONS,
  ISLAND,
  spawnParticle,
} from './world.js';
import { serveDish } from './orders.js';

const WALL = 16;

export function createChef() {
  return { x: 640, y: 620, r: 18, dir: 'down', carry: null, chop: 0, moving: false };
}

function hitsSolid(x, y, r) {
  if (x - r < WALL || x + r > W - WALL) return true;
  if (y - r < BOARD_H + 4 || y + r > H - WALL) return true;
  for (const s of STATIONS) {
    const rc = s.rect;
    if (x + r > rc.x && x - r < rc.x + rc.w && y + r > rc.y && y - r < rc.y + rc.h) return true;
  }
  if (x + r > ISLAND.x && x - r < ISLAND.x + ISLAND.w && y + r > ISLAND.y && y - r < ISLAND.y + ISLAND.h) return true;
  return false;
}

export function moveChef(chef, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.down('KeyA') || input.down('ArrowLeft')) dx -= 1;
  if (input.down('KeyD') || input.down('ArrowRight')) dx += 1;
  if (input.down('KeyW') || input.down('ArrowUp')) dy -= 1;
  if (input.down('KeyS') || input.down('ArrowDown')) dy += 1;
  chef.moving = dx !== 0 || dy !== 0;
  if (!chef.moving) return;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  if (dy < 0) chef.dir = 'up';
  else if (dy > 0) chef.dir = 'down';
  else if (dx < 0) chef.dir = 'left';
  else if (dx > 0) chef.dir = 'right';
  const step = CHEF_SPEED * dt;
  const nx = chef.x + dx * step;
  if (!hitsSolid(nx, chef.y, chef.r)) chef.x = nx;
  const ny = chef.y + dy * step;
  if (!hitsSolid(chef.x, ny, chef.r)) chef.y = ny;
}

export function nearestStation(chef) {
  let best = null;
  let bestD = 82;
  for (const s of STATIONS) {
    const d = Math.hypot(chef.x - s.ix, chef.y - s.iy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

// Hold-E chopping: progress while E is held at the board with a choppable item.
export function updateChop(chef, g, input, dt) {
  const s = nearestStation(chef);
  const holding = chef.carry && CHOP_MAP[chef.carry];
  const holdingE = input.down('KeyE') || input.debugHoldE === true;
  if (s && s.kind === 'board' && holding && holdingE) {
    chef.chop += dt / CHOP_SECONDS;
    if (Math.random() < dt * 8) {
      spawnParticle(g, s.ix + (Math.random() - 0.5) * 30, s.iy - 10, (Math.random() - 0.5) * 40, -30, 0.5, '#e8d9a0', 2.5);
    }
    if (chef.chop >= 1) {
      chef.carry = CHOP_MAP[chef.carry];
      chef.chop = 0;
      return 'chopped';
    }
  } else if (chef.chop > 0) {
    chef.chop = Math.max(0, chef.chop - dt * 2);
  }
  return null;
}

// One E press at the nearest station. Returns a short event tag for sounds/flashes.
export function interact(chef, g) {
  const s = nearestStation(chef);
  if (!s) return null;
  if (s.kind === 'ingredient') {
    if (!chef.carry) {
      chef.carry = s.item;
      return 'pickup';
    }
    return null;
  }
  if (s.kind === 'board') return null; // chopping is hold-E, handled in updateChop
  if (s.kind === 'stove') return stoveInteract(chef, g);
  if (s.kind === 'assembly') return assemblyInteract(chef, g);
  if (s.kind === 'bin') {
    if (chef.carry) {
      chef.carry = null;
      return 'bin';
    }
    return null;
  }
  if (s.kind === 'pass') {
    if (chef.carry === 'soup' || chef.carry === 'pasta_dish' || chef.carry === 'salad') {
      const dish = chef.carry === 'soup' ? 'soup' : chef.carry === 'pasta_dish' ? 'pasta' : 'salad';
      const served = serveDish(g, dish);
      if (served) {
        chef.carry = null;
        for (let i = 0; i < 14; i++) {
          spawnParticle(g, s.ix, s.iy - 20, (Math.random() - 0.5) * 90, -40 - Math.random() * 50, 0.8, '#ffd76a', 3);
        }
        return 'served';
      }
      return 'no-order';
    }
    return null;
  }
  return null;
}

function stoveInteract(chef, g) {
  const b = g.burners;
  // Pick up a finished or burnt dish first.
  for (const burner of b) {
    if ((burner.stage === 'soup_ready' || burner.stage === 'pasta_ready') && !chef.carry) {
      chef.carry = burner.stage === 'soup_ready' ? 'soup' : 'pasta_dish';
      burner.stage = 'empty';
      burner.t = 0;
      return 'pickup';
    }
  }
  for (const burner of b) {
    if ((burner.stage === 'soup_burnt' || burner.stage === 'pasta_burnt') && !chef.carry) {
      chef.carry = 'burnt';
      burner.stage = 'empty';
      burner.t = 0;
      return 'pickup-burnt';
    }
  }
  if (!chef.carry) return null;
  // Finish a waiting pasta before starting a new soup.
  if (chef.carry === 'tomato_chopped') {
    const waiting = b.find((x) => x.stage === 'pasta');
    if (waiting) {
      waiting.stage = 'pasta_tomato';
      chef.carry = null;
      return 'add-tomato';
    }
    const empty = b.find((x) => x.stage === 'empty');
    if (empty) {
      empty.stage = 'soup_cooking';
      empty.t = 0;
      empty.dur = SOUP_COOK_SECONDS;
      chef.carry = null;
      return 'cook-soup';
    }
    return null;
  }
  if (chef.carry === 'pasta') {
    const empty = b.find((x) => x.stage === 'empty');
    if (empty) {
      empty.stage = 'pasta';
      chef.carry = null;
      return 'place-pasta';
    }
    return null;
  }
  if (chef.carry === 'cheese') {
    const waiting = b.find((x) => x.stage === 'pasta_tomato');
    if (waiting) {
      waiting.stage = 'pasta_cooking';
      waiting.t = 0;
      waiting.dur = PASTA_COOK_SECONDS;
      chef.carry = null;
      return 'cook-pasta';
    }
    return null;
  }
  return null;
}

function assemblyInteract(chef, g) {
  const a = g.assembly;
  if (chef.carry === 'lettuce_chopped' && !a.lettuce) {
    a.lettuce = true;
    chef.carry = null;
    return 'assemble';
  }
  if (chef.carry === 'tomato_chopped' && !a.tomato) {
    a.tomato = true;
    chef.carry = null;
    return 'assemble';
  }
  if (chef.carry === 'bread' && !a.bread) {
    a.bread = true;
    chef.carry = null;
    return 'assemble';
  }
  if (!chef.carry && a.lettuce && a.tomato && a.bread) {
    a.lettuce = false;
    a.tomato = false;
    a.bread = false;
    chef.carry = 'salad';
    return 'pickup';
  }
  return null;
}
