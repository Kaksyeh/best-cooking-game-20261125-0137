// orders.js — the order board: spawning, timers, serving, and the rush bell.
// One job: everything about customer orders and the score they pay.

import { RECIPES, SHIFT_SECONDS } from './world.js';

const DISH_KEYS = ['soup', 'pasta', 'salad'];

// Tick the board. Returns how many orders expired this frame.
export function updateOrders(g, dt) {
  g.spawnIn -= dt;
  if (g.spawnIn <= 0 && g.orders.length < 3) {
    spawnOrder(g);
    const elapsed = SHIFT_SECONDS - g.shiftLeft;
    g.spawnIn = Math.max(7, 13 - elapsed / 30);
  }
  for (const o of g.orders) o.t -= dt;
  const expired = g.orders.filter((o) => o.t <= 0);
  if (expired.length > 0) {
    g.orders = g.orders.filter((o) => o.t > 0);
    g.failed += expired.length;
  }
  return expired.length;
}

function spawnOrder(g) {
  const elapsed = SHIFT_SECONDS - g.shiftLeft;
  const dish = DISH_KEYS[Math.floor(Math.random() * DISH_KEYS.length)];
  const total = Math.max(28, 48 - elapsed / 15);
  g.orders.push({ id: g.nextOrderId++, dish, t: total, total });
}

// Serve a finished dish to the oldest open order for it.
// Returns { points, tip, dish } or null when no order wants it.
export function serveDish(g, dish) {
  const idx = g.orders.findIndex((o) => o.dish === dish);
  if (idx < 0) return null;
  const o = g.orders[idx];
  g.orders.splice(idx, 1);
  const tip = Math.round(20 * Math.max(0, o.t / o.total));
  const points = RECIPES[dish].points + tip;
  g.score += points;
  g.tips += tip;
  g.served += 1;
  return { points, tip, dish };
}

// The rush bell: once per shift, +10 seconds on every open order timer.
export function ringBell(g) {
  if (g.bellUsed) return false;
  g.bellUsed = true;
  for (const o of g.orders) o.t += 10;
  return true;
}
