// Órdenes a unidades, búsquedas (recursos, depósitos) y resolución de clicks en el mundo.
import { TS, MW, MH } from '../config/constants.js';
import { BLDS, RES } from '../config/data.js';
import { S } from '../core/state.js';
import { emit } from '../core/events.js';
import { walk, cx, cy, resType } from '../core/world.js';
import { pathToPoint } from '../core/pathfinding.js';
import { seen, bexp } from './fog.js';

export const own = () => S.sel.filter(e => e.team === 0 && !e.dead);

export function cmdMove(u, x, y, amove) {
  u.state = 'move'; u.amove = !!amove; u.dest = { x, y }; u.target = null; u.path = []; u.fail = 0;
  if (!pathToPoint(u, x, y)) u.state = 'idle';
}
export function cmdGather(u, r) {
  u.state = 'gather'; u.target = r; u.gtype = resType(r); u.path = []; u.gt = 0; u.fail = 0; u.amove = false;
  if (u.carryN && u.carryT !== u.gtype) u.carryN = 0;
}
export function cmdAttack(u, t) { u.state = 'attack'; u.target = t; u.path = []; u.rt = 0; u.fail = 0; u.auto = false; }
export function cmdBuild(u, b) { u.state = 'build'; u.target = b; u.path = []; u.rt = 0; u.fail = 0; u.amove = false; }
export function cmdStop(u) { u.state = 'idle'; u.path = []; u.target = null; u.amove = false; }

export function gatherersOn(f) {
  let n = 0; for (const u of S.units) if (!u.dead && u.target === f && (u.state === 'gather' || u.state === 'return')) n++;
  return n;
}

export function nearestRes(type, x, y, team, maxD) {
  let best = null, bd = maxD;
  for (const r of S.ress) { if (r.dead || RES[r.t].type !== type) continue; const d = Math.hypot(cx(r) - x, cy(r) - y); if (d < bd) { bd = d; best = r; } }
  if (type === 'food') for (const b of S.blds) {
    if (b.dead || b.t !== 'farm' || !b.done || b.team !== team) continue;
    const d = Math.hypot(cx(b) - x, cy(b) - y); if (d < bd && gatherersOn(b) < 2) { bd = d; best = b; }
  }
  return best;
}

export function nearestDrop(u) {
  let best = null, bd = 1e9;
  for (const b of S.blds) {
    if (b.dead || b.team !== u.team || b.t !== 'tc' || !b.done) continue;
    const d = Math.hypot(cx(b) - u.x, cy(b) - u.y); if (d < bd) { bd = d; best = b; }
  }
  return best;
}

// tiles libres cerca de (wx,wy) para repartir un grupo
export function spreadTiles(wx, wy, n) {
  const tx = Math.floor(wx / TS), ty = Math.floor(wy / TS), c = [];
  for (let y = ty - 7; y <= ty + 7; y++) for (let x = tx - 7; x <= tx + 7; x++) if (walk(x, y)) c.push([x, y, Math.hypot(x - wx / TS + 0.5, y - wy / TS + 0.5)]);
  c.sort((a, b) => a[2] - b[2]); return c.slice(0, n);
}

// entidad bajo un punto del mundo (respeta la niebla)
export function hitTest(wx, wy) {
  let best = null, bd = 1e9;
  for (const u of S.units) {
    if (u.dead || !seen(u)) continue;
    const d = Math.hypot(u.x - wx, u.y - wy); if (d < u.r + 5 && d < bd) { best = u; bd = d; }
  }
  if (best) return best;
  const tx = Math.floor(wx / TS), ty = Math.floor(wy / TS);
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return null;
  const e = S.occ[ty * MW + tx];
  if (!e) return null;
  if (e.kind === 'bld' ? !bexp(e) : !(S.explored[ty * MW + tx] || S.g.test)) return null;
  return e;
}

export function rightClickOrder(wx, wy) {
  const sel = S.sel.filter(e => e.team === 0 && !e.dead);
  const us = sel.filter(e => e.kind === 'unit'), bl = sel.filter(e => e.kind === 'bld');
  const t = hitTest(wx, wy);
  if (!us.length) { // punto de reunión
    for (const b of bl) if (BLDS[b.t].train) b.rally = { x: wx, y: wy, target: t && (t.kind === 'res' || (t.kind === 'bld' && t.t === 'farm' && t.team === 0)) ? t : null };
    if (bl.length) { S.fx.push({ k: 'c', x: wx, y: wy, t: 0, max: 0.5, c: '#facc15' }); emit('sfx', 'order'); }
    return;
  }
  const isEnemy = t && t.team === 1;
  const gatherable = t && (t.kind === 'res' || (t.kind === 'bld' && t.t === 'farm' && t.team === 0 && t.done));
  const buildable = t && t.kind === 'bld' && t.team === 0 && !t.done;
  S.fx.push({ k: 'c', x: wx, y: wy, t: 0, max: 0.5, c: isEnemy ? '#ef4444' : '#4ade80' });
  emit('sfx', 'order');
  const rest = [];
  for (const u of us) {
    if (isEnemy && u.t !== 'villager') cmdAttack(u, t);
    else if (gatherable && u.t === 'villager') cmdGather(u, t);
    else if (buildable && u.t === 'villager') cmdBuild(u, t);
    else rest.push(u);
  }
  if (rest.length) {
    const tl = spreadTiles(wx, wy, rest.length);
    rest.sort((a, b) => Math.hypot(a.x - wx, a.y - wy) - Math.hypot(b.x - wx, b.y - wy));
    rest.forEach((u, i) => { const p = tl[i % Math.max(1, tl.length)]; if (p) cmdMove(u, p[0] * TS + TS / 2, p[1] * TS + TS / 2, false); });
  }
}

export function attackMoveOrder(wx, wy) {
  const us = own().filter(e => e.kind === 'unit');
  S.fx.push({ k: 'c', x: wx, y: wy, t: 0, max: 0.5, c: '#ef4444' });
  emit('sfx', 'order');
  const tl = spreadTiles(wx, wy, us.length);
  us.forEach((u, i) => { const p = tl[i % Math.max(1, tl.length)]; if (p) cmdMove(u, p[0] * TS + TS / 2, p[1] * TS + TS / 2, true); });
}
