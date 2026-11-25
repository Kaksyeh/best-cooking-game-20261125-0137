// render.js — everything the player sees, drawn on one canvas.
// One job: paint the kitchen, the order board, the chef, and the screens.

import {
  W,
  H,
  BOARD_H,
  SHIFT_SECONDS,
  WIN_SCORE,
  MAX_FAILED,
  INGREDIENT_NAMES,
  RECIPES,
  STATIONS,
  ISLAND,
} from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// One ingredient or dish, drawn as a small flat icon. s is the half-size.
export function drawItem(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  switch (kind) {
    case 'tomato':
      ctx.fillStyle = '#d23c2e';
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7d33';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(-s * 0.4, -s * 0.2);
      ctx.lineTo(s * 0.4, -s * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'onion':
      ctx.fillStyle = '#b98ac2';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#efe3f2';
      ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'pasta':
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = s * 0.22;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, i * s * 0.55);
        ctx.quadraticCurveTo(0, i * s * 0.55 - s * 0.35, s * 0.8, i * s * 0.55);
        ctx.stroke();
      }
      break;
    case 'cheese':
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.5);
      ctx.lineTo(s * 0.85, s * 0.5);
      ctx.lineTo(s * 0.85, -s * 0.1);
      ctx.lineTo(-s * 0.2, -s * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d99a1f';
      ctx.beginPath();
      ctx.arc(s * 0.3, s * 0.1, s * 0.14, 0, Math.PI * 2);
      ctx.arc(-s * 0.3, s * 0.25, s * 0.11, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'lettuce':
      ctx.fillStyle = '#5da24a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7cbf63';
      ctx.beginPath();
      ctx.arc(-s * 0.3, -s * 0.2, s * 0.45, 0, Math.PI * 2);
      ctx.arc(s * 0.3, s * 0.2, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'bread':
      ctx.fillStyle = '#c98f4e';
      rr(ctx, -s * 0.9, -s * 0.55, s * 1.8, s * 1.1, s * 0.4);
      ctx.fill();
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.3);
      ctx.lineTo(s * 0.1, s * 0.3);
      ctx.moveTo(s * 0.1, -s * 0.3);
      ctx.lineTo(s * 0.6, s * 0.3);
      ctx.stroke();
      break;
    case 'tomato_chopped':
    case 'onion_chopped':
    case 'lettuce_chopped': {
      const base = kind.split('_')[0];
      for (let i = 0; i < 3; i++) {
        drawItem(ctx, base, (i - 1) * s * 0.62, (i % 2 === 0 ? -s * 0.2 : s * 0.25), s * 0.5);
      }
      break;
    }
    case 'soup':
      ctx.fillStyle = '#efe6d4';
      ctx.beginPath();
      ctx.arc(0, 0, s, Math.PI * 0.05, Math.PI * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e2574c';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 0.82, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.9);
      ctx.quadraticCurveTo(-s * 0.45, -s * 1.2, -s * 0.3, -s * 1.45);
      ctx.moveTo(s * 0.25, -s * 0.9);
      ctx.quadraticCurveTo(s * 0.4, -s * 1.2, s * 0.25, -s * 1.45);
      ctx.stroke();
      break;
    case 'pasta_dish':
      ctx.fillStyle = '#efe6d4';
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = s * 0.18;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, i * s * 0.22);
        ctx.quadraticCurveTo(0, i * s * 0.22 - s * 0.25, s * 0.6, i * s * 0.22);
        ctx.stroke();
      }
      ctx.fillStyle = '#d23c2e';
      ctx.beginPath();
      ctx.arc(-s * 0.3, -s * 0.1, s * 0.12, 0, Math.PI * 2);
      ctx.arc(s * 0.35, s * 0.12, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'salad':
      ctx.fillStyle = '#efe6d4';
      ctx.beginPath();
      ctx.arc(0, 0, s, Math.PI * 0.05, Math.PI * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5da24a';
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.2, s * 0.45, 0, Math.PI * 2);
      ctx.arc(s * 0.3, -s * 0.25, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d23c2e';
      ctx.beginPath();
      ctx.arc(s * 0.1, s * 0.05, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c98f4e';
      ctx.fillRect(-s * 0.6, s * 0.15, s * 0.35, s * 0.3);
      ctx.fillRect(s * 0.35, s * 0.1, s * 0.35, s * 0.3);
      break;
    case 'burnt':
      ctx.fillStyle = '#1c1a18';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,120,120,0.8)';
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.8);
      ctx.quadraticCurveTo(s * 0.2, -s * 1.2, 0, -s * 1.5);
      ctx.stroke();
      break;
    default:
      break;
  }
  ctx.restore();
}

function drawStation(ctx, s, g) {
  const rc = s.rect;
  ctx.save();
  if (s.kind === 'ingredient') {
    ctx.fillStyle = '#7a4a28';
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 8);
    ctx.fill();
    ctx.fillStyle = '#a06a3c';
    rr(ctx, rc.x + 4, rc.y + 4, rc.w - 8, rc.h - 8, 6);
    ctx.fill();
    drawItem(ctx, s.item, rc.x + 30, rc.y + rc.h / 2, 15);
    text(ctx, s.label, rc.x + 52, rc.y + rc.h / 2, 16, '#fff3dd', 'left');
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#7a4a28';
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 8);
    ctx.fill();
    ctx.fillStyle = '#d9b380';
    rr(ctx, rc.x + 12, rc.y + 30, rc.w - 24, rc.h - 60, 6);
    ctx.fill();
    // Knife.
    ctx.strokeStyle = '#c8ccd2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rc.x + 30, rc.y + rc.h - 26);
    ctx.lineTo(rc.x + rc.w - 30, rc.y + rc.h - 26);
    ctx.stroke();
    text(ctx, 'CHOP', rc.x + rc.w / 2, rc.y + 16, 14, '#ffe9c4');
  } else if (s.kind === 'stove') {
    ctx.fillStyle = '#5d646c';
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 8);
    ctx.fill();
    ctx.fillStyle = '#878e98';
    rr(ctx, rc.x + 6, rc.y + 6, rc.w - 12, rc.h - 12, 6);
    ctx.fill();
    for (let i = 0; i < 2; i++) {
      const b = g.burners[i];
      const bx = b.x;
      const by = b.y;
      ctx.fillStyle = '#2b2e33';
      ctx.beginPath();
      ctx.arc(bx, by, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8ccd2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, by, 30, 0, Math.PI * 2);
      ctx.stroke();
      if (b.stage === 'pasta' || b.stage === 'pasta_tomato') {
        ctx.fillStyle = '#3a3f46';
        ctx.beginPath();
        ctx.arc(bx, by - 4, 20, 0, Math.PI * 2);
        ctx.fill();
        if (b.stage === 'pasta_tomato') drawItem(ctx, 'tomato', bx, by - 6, 9);
        else drawItem(ctx, 'pasta', bx, by - 6, 9);
      } else if (b.stage === 'soup_cooking' || b.stage === 'pasta_cooking') {
        ctx.fillStyle = '#3a3f46';
        ctx.beginPath();
        ctx.arc(bx, by - 4, 20, 0, Math.PI * 2);
        ctx.fill();
        drawItem(ctx, b.stage === 'soup_cooking' ? 'soup' : 'pasta_dish', bx, by - 8, 13);
        const frac = Math.min(1, b.t / b.dur);
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bx, by, 36, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
      } else if (b.stage === 'soup_ready' || b.stage === 'pasta_ready') {
        drawItem(ctx, b.stage === 'soup_ready' ? 'soup' : 'pasta_dish', bx, by - 4, 16);
        const frac = 1 - Math.min(1, b.t / 6);
        ctx.strokeStyle = frac > 0.4 ? '#7cbf63' : '#e2574c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bx, by, 36, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
      } else if (b.stage === 'soup_burnt' || b.stage === 'pasta_burnt') {
        drawItem(ctx, 'burnt', bx, by - 4, 15);
      }
    }
    text(ctx, 'STOVE', rc.x + rc.w / 2, rc.y + rc.h - 8, 13, '#ffe9c4');
  } else if (s.kind === 'bin') {
    ctx.fillStyle = '#4a4f55';
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 6);
    ctx.fill();
    ctx.fillStyle = '#6a7076';
    rr(ctx, rc.x + 6, rc.y + 6, rc.w - 12, rc.h - 20, 4);
    ctx.fill();
    text(ctx, 'BIN', rc.x + rc.w / 2, rc.y + rc.h - 8, 12, '#ffe9c4');
  } else if (s.kind === 'assembly') {
    ctx.fillStyle = '#7a4a28';
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 8);
    ctx.fill();
    ctx.fillStyle = '#ddd2bd';
    rr(ctx, rc.x + 8, rc.y + 8, rc.w - 16, rc.h - 8, 6);
    ctx.fill();
    // The plate being assembled.
    const a = g.assembly;
    const cx = rc.x + rc.w / 2;
    const cy = rc.y + rc.h / 2 + 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b9ac93';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    let i = 0;
    if (a.lettuce) drawItem(ctx, 'lettuce_chopped', cx - 26 + i++ * 26, cy - 4, 11);
    if (a.tomato) drawItem(ctx, 'tomato_chopped', cx - 26 + i++ * 26, cy - 4, 11);
    if (a.bread) drawItem(ctx, 'bread', cx - 26 + i++ * 26, cy - 4, 11);
    text(ctx, 'ASSEMBLY', rc.x + rc.w / 2, rc.y + 18, 13, '#5a4630');
  } else if (s.kind === 'pass') {
    ctx.fillStyle = '#7a4a28';
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 8);
    ctx.fill();
    ctx.fillStyle = '#3a2417';
    rr(ctx, rc.x + 10, rc.y + 10, rc.w - 20, rc.h - 44, 6);
    ctx.fill();
    // Heat lamps.
    ctx.fillStyle = '#ff9a3d';
    ctx.beginPath();
    ctx.arc(rc.x + rc.w / 2 - 40, rc.y + 22, 7, 0, Math.PI * 2);
    ctx.arc(rc.x + rc.w / 2 + 40, rc.y + 22, 7, 0, Math.PI * 2);
    ctx.fill();
    if (g.passPlate) {
      drawItem(ctx, g.passPlate, rc.x + rc.w / 2, rc.y + rc.h / 2 + 12, 20);
    }
    text(ctx, 'PASS', rc.x + rc.w / 2, rc.y + rc.h - 14, 14, '#ffe9c4');
  }
  ctx.restore();
}

function drawChef(ctx, chef, g) {
  const { x, y } = chef;
  ctx.save();
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: dark shirt, white apron.
  ctx.fillStyle = '#3d4a5c';
  ctx.beginPath();
  ctx.arc(x, y + 2, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5f0e6';
  rr(ctx, x - 11, y - 6, 22, 20, 6);
  ctx.fill();
  // Head + toque.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 16, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 7, y - 26, 7, 0, Math.PI * 2);
  ctx.arc(x, y - 30, 8, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 11, y - 28, 22, 6);
  // Carried item above the head.
  if (chef.carry) {
    drawItem(ctx, chef.carry, x, y - 52, 14);
  }
  // Chop progress ring.
  if (chef.chop > 0) {
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + chef.chop * Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard(ctx, g) {
  // Board strip.
  ctx.fillStyle = '#241811';
  ctx.fillRect(0, 0, W, BOARD_H);
  ctx.fillStyle = '#3a2417';
  ctx.fillRect(0, BOARD_H - 6, W, 6);
  text(ctx, 'ORDERS', 24, 26, 18, '#ffd76a', 'left');
  text(ctx, 'SIMMER & SMOKE', 24, 54, 13, '#c9a06a', 'left');
  // Order cards.
  const cardW = 250;
  const cardH = 76;
  const startX = 210;
  for (let i = 0; i < 3; i++) {
    const o = g.orders[i];
    const cx = startX + i * (cardW + 12);
    const cy = 14;
    if (!o) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      rr(ctx, cx, cy, cardW, cardH, 8);
      ctx.fill();
      text(ctx, '—', cx + cardW / 2, cy + cardH / 2, 20, 'rgba(255,255,255,0.25)');
      continue;
    }
    const r = RECIPES[o.dish];
    const urgent = o.t < 10;
    ctx.fillStyle = urgent && Math.floor(g.time * 4) % 2 === 0 ? '#5c2620' : '#4a2f1c';
    rr(ctx, cx, cy, cardW, cardH, 8);
    ctx.fill();
    ctx.fillStyle = r.color;
    rr(ctx, cx, cy, 8, cardH, 4);
    ctx.fill();
    text(ctx, r.name, cx + 18, cy + 20, 17, '#fff3dd', 'left');
    text(ctx, `${r.points} pts`, cx + cardW - 10, cy + 20, 14, '#ffd76a', 'right');
    // Timer bar.
    const frac = Math.max(0, o.t / o.total);
    ctx.fillStyle = '#1c120a';
    rr(ctx, cx + 18, cy + 44, cardW - 36, 12, 6);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7cbf63' : frac > 0.25 ? '#e8a33d' : '#e2574c';
    if (frac > 0) {
      rr(ctx, cx + 18, cy + 44, Math.max(12, (cardW - 36) * frac), 12, 6);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(o.t)}s`, cx + cardW - 10, cy + 66, 14, urgent ? '#ff8a7a' : '#ffe9c4', 'right');
  }
  // Shift timer, score, failed, bell — right side.
  const hx = W - 210;
  const mins = Math.floor(Math.max(0, g.shiftLeft) / 60);
  const secs = Math.floor(Math.max(0, g.shiftLeft) % 60);
  const low = g.shiftLeft < 30;
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, hx, 28, 30, low ? '#ff8a7a' : '#fff3dd');
  text(ctx, `SCORE ${g.score} / ${WIN_SCORE}`, hx, 60, 16, '#ffd76a');
  // Failed orders as three small crosses.
  for (let i = 0; i < MAX_FAILED; i++) {
    const fx = hx - 40 + i * 22;
    ctx.strokeStyle = i < g.failed ? '#e2574c' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx - 6, 82);
    ctx.lineTo(fx + 6, 94);
    ctx.moveTo(fx + 6, 82);
    ctx.lineTo(fx - 6, 94);
    ctx.stroke();
  }
  text(ctx, g.bellUsed ? 'BELL USED' : 'BELL: SPACE', hx + 62, 88, 12, g.bellUsed ? 'rgba(255,255,255,0.35)' : '#ffd76a');
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(12,8,5,0.78)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, title, W / 2, H / 2 - 110, 64, accent || '#ffd76a');
  let y = H / 2 - 30;
  for (const line of lines) {
    text(ctx, line, W / 2, y, 20, '#fff3dd');
    y += 34;
  }
}

export function draw(ctx, view) {
  const { g, chef, screen, hover, muted } = view;
  // Floor: warm wood planks.
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(0, BOARD_H, W, H - BOARD_H);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let y = BOARD_H + 44; y < H; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Walls.
  ctx.fillStyle = '#5a2e22';
  ctx.fillRect(0, BOARD_H, 16, H - BOARD_H);
  ctx.fillRect(W - 16, BOARD_H, 16, H - BOARD_H);
  ctx.fillRect(0, H - 16, W, 16);
  ctx.fillStyle = '#6e3a2a';
  for (let y = BOARD_H + 20; y < H - 20; y += 28) {
    ctx.fillRect(0, y, 16, 2);
    ctx.fillRect(W - 16, y, 16, 2);
  }
  // Island (decorative prep table with pots).
  ctx.fillStyle = '#6b4423';
  rr(ctx, ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 8);
  ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, ISLAND.x + 5, ISLAND.y + 5, ISLAND.w - 10, ISLAND.h - 10, 6);
  ctx.fill();
  ctx.fillStyle = '#3a3f46';
  ctx.beginPath();
  ctx.arc(ISLAND.x + 50, ISLAND.y + 40, 16, 0, Math.PI * 2);
  ctx.arc(ISLAND.x + 120, ISLAND.y + 40, 16, 0, Math.PI * 2);
  ctx.arc(ISLAND.x + 190, ISLAND.y + 40, 16, 0, Math.PI * 2);
  ctx.fill();
  // Stations.
  for (const s of STATIONS) drawStation(ctx, s, g);
  // Interaction hint.
  if (screen === 'playing' && hover) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const label = hover.kind === 'board' ? 'Hold E to chop' : `E — ${hover.label}`;
    const wdt = ctx.measureText(label).width + 24;
    rr(ctx, hover.ix - wdt / 2, hover.iy - 64, wdt, 26, 13);
    ctx.fill();
    text(ctx, label, hover.ix, hover.iy - 51, 14, '#ffd76a');
  }
  // Particles.
  for (const p of g.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Chef.
  drawChef(ctx, chef, g);
  // Order board + HUD.
  drawBoard(ctx, g);
  // Flash message.
  if (g.flash) {
    ctx.globalAlpha = Math.min(1, g.flash.t);
    text(ctx, g.flash.text, W / 2, BOARD_H + 36, 26, g.flash.color);
    ctx.globalAlpha = 1;
  }
  // Mute + pause hints.
  text(ctx, muted ? 'MUTED (M)' : 'M mute · P pause', W - 14, H - 26, 12, 'rgba(255,243,221,0.6)', 'right');
  // Screens.
  if (screen === 'title') {
    drawOverlay(ctx, 'SIMMER & SMOKE', [
      'You run a smokehouse bistro. One 180-second dinner shift.',
      'WASD / arrows — walk · E — pick up, place, serve · hold E — chop',
      'Space — rush bell once per shift (+10s on every order)',
      'Tomato Soup: chopped tomato, cooked on the stove.',
      'Pasta al Forno: pasta + chopped tomato + cheese, baked.',
      'Garden Salad: chopped lettuce + chopped tomato + bread, no cooking.',
      `Serve ${WIN_SCORE} points of food to win. Fail 3 orders and the shift ends.`,
      '',
      'Press ENTER or click to start',
    ]);
  } else if (screen === 'win') {
    drawOverlay(ctx, 'SHIFT COMPLETE!', [
      `Score ${g.score} · ${g.served} dishes served · $${g.tips} in tips`,
      'The bistro is buzzing. The smokehouse stays open.',
      '',
      'Press R to cook another shift',
    ], '#7cbf63');
  } else if (screen === 'loss') {
    drawOverlay(ctx, 'SHIFT OVER', [
      g.failed >= MAX_FAILED
        ? 'Three orders failed. The pass went quiet.'
        : `Time ran out at ${g.score} / ${WIN_SCORE} points.`,
      `Score ${g.score} · ${g.served} dishes served`,
      '',
      'Press R to try again',
    ], '#e2574c');
  } else if (screen === 'paused') {
    drawOverlay(ctx, 'PAUSED', ['Press P to get back to the pass.'], '#ffd76a');
  }
}
