// Render del mundo en el canvas principal.
import { TS, WW, WH, FARM_FOOD, TEAM_COL, TEAM_DARK } from '../config/constants.js';
import { UNITS, BLDS, UPG } from '../config/data.js';
import { S } from '../core/state.js';
import { vis, clampCam, screenToWorld } from '../core/camera.js';
import { cx, cy } from '../core/world.js';
import { validPlace } from '../systems/economy.js';
import { seen, bexp, fog } from '../systems/fog.js';
import { SPR, ell } from './sprites.js';
import { gfx } from './terrain.js';
import { drawIcon } from '../assets/icons.js';

let cv, ctx;

// el canvas ocupa todo #stage (el área sobre la barra inferior); se redimensiona con él
export function initRenderer(canvas, stage) {
  cv = canvas; ctx = canvas.getContext('2d');
  resize(stage);
  new ResizeObserver(() => resize(stage)).observe(stage);
}

export function resize(stage) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  S.view.dpr = dpr; S.view.w = stage.clientWidth; S.view.h = stage.clientHeight;
  cv.width = Math.floor(S.view.w * dpr); cv.height = Math.floor(S.view.h * dpr);
  if (S.g.state !== 'menu') clampCam();
}

function bar(x, y, w, f, col) { ctx.fillStyle = '#000a'; ctx.fillRect(x - 1, y - 1, w + 2, 5); ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, f), 3); }

function drawBld(b) {
  const d = BLDS[b.t], px = b.x * TS, py = b.y * TS, w = b.w * TS, h = b.h * TS;
  if (!vis(px, py, w, h) || !bexp(b)) return;
  ctx.globalAlpha = b.done ? 1 : 0.55 + 0.35 * b.prog;
  ell(ctx, px + w / 2, py + h - 3, w / 2, 6, '#0004');
  if (b.t === 'farm') {
    ctx.fillStyle = '#7a5a32'; ctx.fillRect(px + 2, py + 2, w - 4, h - 4);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#d4b04a' : '#b8942f'; ctx.fillRect(px + 5, py + 6 + i * ((h - 12) / 4), w - 10, (h - 12) / 4 - 2); }
    ctx.globalAlpha = 1; bar(px + 6, py + h - 8, w - 12, b.amount / FARM_FOOD, '#facc15');
  } else {
    const bh = h * 0.62;
    ctx.fillStyle = d.col; ctx.fillRect(px + 3, py + h - bh - 2, w - 6, bh);
    ctx.fillStyle = '#0003'; ctx.fillRect(px + 3, py + h - 8, w - 6, 6);
    ctx.fillStyle = TEAM_COL[b.team]; ctx.beginPath();
    ctx.moveTo(px - 1, py + h - bh); ctx.lineTo(px + w / 2, py + 2); ctx.lineTo(px + w + 1, py + h - bh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.moveTo(px + w / 2, py + 2); ctx.lineTo(px + w + 1, py + h - bh); ctx.lineTo(px + w / 2, py + h - bh); ctx.closePath(); ctx.fill();
    drawIcon(ctx, d.icon, px + w / 2, py + h - bh / 2 - 1, Math.round(Math.min(w, h) * 0.42), '#fff');
  }
  ctx.globalAlpha = 1;
  if (!b.done) bar(px + 4, py - 4, w - 8, b.prog, '#38bdf8');
  else if (b.hp < b.maxhp) bar(px + 4, py - 4, w - 8, b.hp / b.maxhp, b.hp / b.maxhp > 0.4 ? '#4ade80' : '#ef4444');
  if (b.team === 0 && b.done) {
    if (b.queue.length) bar(px + 4, py + h + 2, w - 8, b.qp / UNITS[b.queue[0]].time, '#facc15');
    else if (b.adv) bar(px + 4, py + h + 2, w - 8, b.adv.p / b.adv.time, '#c084fc');
    else if (b.rs) bar(px + 4, py + h + 2, w - 8, b.rs.p / UPG.find(u => u.id === b.rs.id).time, '#c084fc');
  }
}

function drawUnit(u) {
  if (!vis(u.x - 16, u.y - 16, 32, 32) || !seen(u)) return;
  const picked = S.sel.includes(u);
  ell(ctx, u.x, u.y + u.r * 0.7, u.r, u.r * 0.45, '#0004');
  if (picked) { ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(u.x, u.y + u.r * 0.6, u.r + 3, u.r * 0.6 + 2, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = TEAM_COL[u.team]; ctx.strokeStyle = TEAM_DARK[u.team]; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, 7); ctx.fill(); ctx.stroke();
  drawIcon(ctx, UNITS[u.t].icon, u.x, u.y, Math.round(u.r * 1.45), '#fff');
  if (u.carryN > 0 && u.state !== 'idle') { ctx.fillStyle = { wood: '#92400e', food: '#e11d48', gold: '#fbbf24' }[u.carryT]; ctx.fillRect(u.x - 3, u.y - u.r - 6, 6, 5); }
  if (picked || u.hp < u.maxhp) bar(u.x - 9, u.y - u.r - 9, 18, u.hp / u.maxhp, u.hp / u.maxhp > 0.4 ? '#4ade80' : '#ef4444');
}

function drawRes(r) {
  const px = r.x * TS, py = r.y * TS;
  if (!vis(px, py, r.w * TS, r.h * TS)) return;
  if (r.t === 'tree') ctx.drawImage(SPR.tree[r.v], px, py - 14);
  else if (r.t === 'berry') ctx.drawImage(SPR.berry, px, py);
  else ctx.drawImage(SPR.gold, px, py);
  if (S.sel.includes(r)) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.strokeRect(px, py, r.w * TS, r.h * TS); }
}

export function render() {
  const { cam, view, ui } = S, k = view.dpr * cam.z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b1a10'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
  ctx.drawImage(gfx.terr, 0, 0);

  for (const b of S.sel) if (b.kind === 'bld' && b.rally) {
    ctx.strokeStyle = '#facc1599'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx(b), cy(b)); ctx.lineTo(b.rally.x, b.rally.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#facc15'; ctx.fillRect(b.rally.x - 1, b.rally.y - 14, 2, 14); ctx.fillRect(b.rally.x, b.rally.y - 14, 9, 6);
  }
  for (const r of S.ress) drawRes(r);
  for (const b of S.blds) drawBld(b);
  for (const b of S.sel) if (b.kind === 'bld' && !b.dead) { ctx.strokeStyle = b.team === 0 ? '#4ade80' : '#f87171'; ctx.lineWidth = 2; ctx.strokeRect(b.x * TS - 2, b.y * TS - 2, b.w * TS + 4, b.h * TS + 4); }
  for (const u of S.units.slice().sort((a, b) => a.y - b.y)) drawUnit(u);
  if (S.sel.length === 1 && S.sel[0].kind === 'unit' && S.sel[0].team === 1) { const u = S.sel[0]; ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 3, 0, 7); ctx.stroke(); }

  for (const p of S.projs) {
    const t = p.t / 0.22, x = p.x1 + (p.x2 - p.x1) * t, y = p.y1 + (p.y2 - p.y1) * t, a = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
    ctx.strokeStyle = '#f5f5f4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * 8, y - Math.sin(a) * 8); ctx.stroke();
  }
  for (const f of S.fx) {
    const a = 1 - f.t / f.max; ctx.globalAlpha = a;
    if (f.k === 'p') { ctx.fillStyle = f.c; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); }
    else { ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + 14 * (1 - a), 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  ctx.imageSmoothingEnabled = true; ctx.drawImage(fog.cv, 0, 0, WW, WH); // niebla (escala bilinear = bordes suaves)

  if (ui.place) { // fantasma de construcción (la validez se calcula aquí para seguir a la cámara)
    const d = BLDS[ui.place.t], w = screenToWorld(ui.mouse.x, ui.mouse.y);
    const tx = Math.round(w.x / TS - d.w / 2), ty = Math.round(w.y / TS - d.h / 2), ok = validPlace(ui.place.t, tx, ty);
    ui.place.tx = tx; ui.place.ty = ty; ui.place.ok = ok;
    ctx.globalAlpha = 0.6; ctx.fillStyle = ok ? '#22c55e' : '#ef4444'; ctx.fillRect(tx * TS, ty * TS, d.w * TS, d.h * TS);
    ctx.globalAlpha = 1; drawIcon(ctx, d.icon, (tx + d.w / 2) * TS, (ty + d.h / 2) * TS, 28, '#fff');
  }

  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const dr = ui.drag;
  if (dr && dr.moved) {
    const x = Math.min(dr.x, ui.mouse.x), y = Math.min(dr.y, ui.mouse.y), w = Math.abs(ui.mouse.x - dr.x), h = Math.abs(ui.mouse.y - dr.y);
    ctx.fillStyle = '#4ade8022'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }
  if (S.g.paused) { ctx.fillStyle = '#0008'; ctx.fillRect(0, 0, view.w, view.h); ctx.fillStyle = '#fff'; ctx.font = '700 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PAUSA', view.w / 2, view.h / 2); }
}
