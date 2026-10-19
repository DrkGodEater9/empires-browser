// Primitivas del mundo: tiles, ocupación, creación de entidades y geometría.
import { TS, MW, MH, FARM_FOOD } from '../config/constants.js';
import { UNITS, BLDS, RES } from '../config/data.js';
import { S } from './state.js';

export const walk = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && S.terrain[y * MW + x] === 0 && !S.occ[y * MW + x];
export const tileX = u => Math.floor(u.x / TS);
export const tileY = u => Math.floor(u.y / TS);
export const cx = e => e.kind === 'unit' ? e.x : (e.x + e.w / 2) * TS;
export const cy = e => e.kind === 'unit' ? e.y : (e.y + e.h / 2) * TS;
export const resType = e => e.kind === 'res' ? RES[e.t].type : 'food';
export const mirror = (x, y, w, h) => [MW - x - w, MH - y - h];

export function setOcc(e, v) {
  for (let j = 0; j < e.h; j++) for (let i = 0; i < e.w; i++) S.occ[(e.y + j) * MW + e.x + i] = v;
}

export function freeFor(x, y, w, h) {
  if (x < 0 || y < 0 || x + w > MW || y + h > MH) return false;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = (y + j) * MW + x + i; if (S.terrain[k] || S.occ[k]) return false; }
  return true;
}

export function nearestFree(tx, ty, maxR = 12) {
  if (walk(tx, ty)) return [tx, ty];
  for (let r = 1; r <= maxR; r++) {
    let best = null, bd = 1e9;
    for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r || !walk(x, y)) continue;
      const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) return best;
  }
  return null;
}

// distancia en px desde un punto al borde de una entidad (unidad = al borde del círculo)
export function distRect(px, py, e) {
  if (e.kind === 'unit') return Math.hypot(px - e.x, py - e.y) - e.r;
  const rx = e.x * TS, ry = e.y * TS;
  const dx = Math.max(rx - px, 0, px - (rx + e.w * TS)), dy = Math.max(ry - py, 0, py - (ry + e.h * TS));
  return Math.hypot(dx, dy);
}

export function placeRes(t, x, y) {
  const w = t === 'gold' ? 2 : 1;
  if (!freeFor(x, y, w, w)) return null;
  const r = { id: S.nextId++, kind: 'res', t, x, y, w, h: w, amount: RES[t].amount, v: (Math.random() * 3) | 0, dead: false };
  S.ress.push(r); setOcc(r, r); return r;
}

export function addBld(t, team, x, y, done) {
  const d = BLDS[t];
  const b = {
    id: S.nextId++, kind: 'bld', t, team, x, y, w: d.w, h: d.h,
    hp: done ? d.hp : d.hp * 0.1, maxhp: d.hp, prog: done ? 1 : 0, done: !!done,
    queue: [], qp: 0, at: 0, rally: null, adv: null, rs: null,
    amount: t === 'farm' ? FARM_FOOD : 0, dead: false,
  };
  S.blds.push(b); setOcc(b, b); ejectUnits(b); return b;
}

export function addUnit(t, team, x, y) {
  const d = UNITS[t];
  const u = {
    id: S.nextId++, kind: 'unit', t, team, x, y, r: d.r, hp: d.hp, maxhp: d.hp, spd: d.spd,
    state: 'idle', path: [], target: null, dest: null, amove: false, auto: false,
    carryT: null, carryN: 0, gt: 0, at: 0, rt: 0, aq: Math.random() * 0.5, fail: 0, gtype: null, dead: false,
  };
  S.units.push(u); return u;
}

// saca del footprint a las unidades que queden dentro de un edificio nuevo
export function ejectUnits(b) {
  for (const u of S.units) {
    const tx = tileX(u), ty = tileY(u);
    if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) {
      const f = nearestFree(tx, ty);
      if (f) { u.x = f[0] * TS + TS / 2; u.y = f[1] * TS + TS / 2; u.path = []; }
    }
  }
}

export function spawnTile(b) {
  const c = [];
  for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) {
    if ((x < b.x || x >= b.x + b.w || y < b.y || y >= b.y + b.h) && walk(x, y)) c.push([x, y]);
  }
  if (!c.length) return nearestFree(b.x, b.y + b.h, 20);
  if (b.rally) {
    const rx = b.rally.x / TS, ry = b.rally.y / TS;
    c.sort((p, q) => Math.hypot(p[0] - rx, p[1] - ry) - Math.hypot(q[0] - rx, q[1] - ry));
    return c[0];
  }
  return c[(Math.random() * c.length) | 0];
}
