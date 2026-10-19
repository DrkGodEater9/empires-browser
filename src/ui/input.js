// Mouse y teclado: selección, órdenes, colocación de edificios, cámara.
import { TS, MW, MH } from '../config/constants.js';
import { S } from '../core/state.js';
import { emit } from '../core/events.js';
import { screenToWorld, clampCam, centerOn, minZoom } from '../core/camera.js';
import { cx, cy } from '../core/world.js';
import { hitTest, rightClickOrder, attackMoveOrder, own } from '../systems/orders.js';
import { placeBuilding, canPay } from '../systems/economy.js';
import { BLDS } from '../config/data.js';
import { minimapCenter, minimapToWorld } from '../render/minimap.js';
import { findCmd } from './commandPanel.js';

export function select(list, add = false) {
  S.sel = add ? Array.from(new Set(S.sel.concat(list))) : list;
  if (S.sel.length) emit('sfx', 'select');
  emit('selection');
}

function boxSelect(d, ex, ey) {
  const a = screenToWorld(Math.min(d.x, ex), Math.min(d.y, ey)), b = screenToWorld(Math.max(d.x, ex), Math.max(d.y, ey));
  const us = S.units.filter(u => !u.dead && u.team === 0 && u.x >= a.x && u.x <= b.x && u.y >= a.y && u.y <= b.y);
  if (us.length) return select(us, d.shift);
  const bs = S.blds.filter(o => o.team === 0 && o.x * TS + o.w * TS > a.x && o.x * TS < b.x && o.y * TS + o.h * TS > a.y && o.y * TS < b.y);
  select(bs.slice(0, 1), d.shift);
}

function click(d, ex, ey) {
  const w = screenToWorld(ex, ey), t = hitTest(w.x, w.y), now = performance.now(), lc = S.ui.lastClick;
  if (!t) { if (!d.shift) select([]); return; }
  if (t.kind === 'unit' && t.team === 0 && lc.type === t.t && now - lc.t < 350) { // doble click: todos los del mismo tipo en pantalla
    const v0 = screenToWorld(0, 0), v1 = screenToWorld(S.view.w, S.view.h);
    select(S.units.filter(u => !u.dead && u.team === 0 && u.t === t.t && u.x > v0.x && u.x < v1.x && u.y > v0.y && u.y < v1.y));
  } else select([t], d.shift && t.team === 0);
  S.ui.lastClick = { t: now, type: t.kind === 'unit' ? t.t : null };
}

function tryPlace(shift) {
  const p = S.ui.place;
  if (!p.ok) return emit('toast', 'No se puede construir ahí');
  const builders = own().filter(u => u.kind === 'unit' && u.t === 'villager');
  if (placeBuilding(0, p.t, p.tx, p.ty, builders)) {
    emit('sfx', 'build');
    if (!shift || !canPay(0, BLDS[p.t].cost)) S.ui.place = null;
  }
}

export function initInput(canvas, mini) {
  const ui = S.ui;

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('mousedown', e => {
    if (S.g.state !== 'play') return;
    ui.mouse.x = e.clientX; ui.mouse.y = e.clientY;
    const w = screenToWorld(e.clientX, e.clientY);
    if (e.button === 2) { if (ui.place || ui.amode) { ui.place = null; ui.amode = false; } else rightClickOrder(w.x, w.y); return; }
    if (e.button !== 0) return;
    if (ui.place) return tryPlace(e.shiftKey);
    if (ui.amode) { ui.amode = false; attackMoveOrder(w.x, w.y); return; }
    ui.drag = { x: e.clientX, y: e.clientY, moved: false, shift: e.shiftKey };
  });
  window.addEventListener('mousemove', e => {
    ui.mouse.x = e.clientX; ui.mouse.y = e.clientY; ui.mouse.in = e.target === canvas;
    if (ui.drag && Math.hypot(e.clientX - ui.drag.x, e.clientY - ui.drag.y) > 5) ui.drag.moved = true;
    if (ui.mouse.mini) minimapCenter(e);
  });
  document.addEventListener('mouseleave', () => { ui.mouse.in = false; });
  window.addEventListener('mouseup', e => {
    ui.mouse.mini = false;
    if (e.button !== 0 || !ui.drag) return;
    const d = ui.drag; ui.drag = null;
    if (S.g.state !== 'play') return;
    if (d.moved) boxSelect(d, e.clientX, e.clientY); else click(d, e.clientX, e.clientY);
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault(); if (S.g.state === 'menu') return;
    const w = screenToWorld(e.clientX, e.clientY), cam = S.cam;
    cam.z = Math.max(minZoom(), Math.min(1.7, cam.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    cam.x = w.x - e.clientX / cam.z; cam.y = w.y - e.clientY / cam.z; clampCam();
  }, { passive: false });

  // minimapa
  mini.addEventListener('mousedown', e => {
    if (S.g.state !== 'play') return; e.preventDefault();
    if (e.button === 0) { ui.mouse.mini = true; minimapCenter(e); }
    else if (e.button === 2) { const w = minimapToWorld(e); rightClickOrder(w.x, w.y); }
  });
  mini.addEventListener('contextmenu', e => e.preventDefault());

  // teclado
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); ui.keys[k] = true;
    if (e.repeat || S.g.state !== 'play') return;
    if (k === 'escape') { ui.place = null; ui.amode = false; select([]); }
    else if (k === 'p') S.g.paused = !S.g.paused;
    else if (k === 'm') emit('mute:toggle');
    else if (k === 'h') { const t = S.blds.find(b => b.team === 0 && b.t === 'tc'); if (t) centerOn(cx(t), cy(t)); }
    else if (k === '.') { const v = S.units.find(u => u.team === 0 && u.t === 'villager' && u.state === 'idle'); if (v) { select([v]); centerOn(v.x, v.y); } }
    else { const c = findCmd(k); if (c) c.act(); }
  });
  window.addEventListener('keyup', e => { ui.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in ui.keys) ui.keys[k] = false; });
}

// flechas del teclado + bordes de pantalla
export function panCamera(dt) {
  const { keys, mouse, drag } = S.ui, { cam, view } = S, sp = 650 * dt / cam.z;
  let mx = 0, my = 0;
  if (keys.arrowleft) mx -= 1; if (keys.arrowright) mx += 1;
  if (keys.arrowup) my -= 1; if (keys.arrowdown) my += 1;
  if (mouse.in && !drag && S.g.state === 'play') {
    if (mouse.x < 8) mx -= 1; if (mouse.x > view.w - 8) mx += 1;
    if (mouse.y < 8) my -= 1; if (mouse.y > view.h - 4) my += 1;
  }
  if (mx || my) { cam.x += mx * sp; cam.y += my * sp; clampCam(); }
}
