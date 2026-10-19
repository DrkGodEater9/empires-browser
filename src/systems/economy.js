// Recursos, población, entrenamiento, edades, mejoras y construcción.
import { MAXPOP, RIC } from '../config/constants.js';
import { UNITS, BLDS, AGES, UPG } from '../config/data.js';
import { S } from '../core/state.js';
import { emit } from '../core/events.js';
import { walk, addBld } from '../core/world.js';
import { cmdBuild } from './orders.js';

const say = (T, msg) => { if (T === 0 && !S.g.test) emit('toast', msg); };

export function canPay(T, cost) { for (const k in cost) if (S.R[T][k] < cost[k]) return false; return true; }
export function pay(T, cost) { if (!canPay(T, cost)) return false; for (const k in cost) S.R[T][k] -= cost[k]; return true; }
export const costStr = c => Object.keys(c).map(k => RIC[k] + c[k]).join(' ');

export function calcPop() {
  S.POP = [0, 0]; S.CAP = [0, 0];
  for (const u of S.units) if (!u.dead) S.POP[u.team]++;
  for (const b of S.blds) if (!b.dead) { S.POP[b.team] += b.queue.length; if (b.done) S.CAP[b.team] += BLDS[b.t].pop || 0; }
  S.CAP[0] = Math.min(S.CAP[0], MAXPOP); S.CAP[1] = Math.min(S.CAP[1], MAXPOP);
}

export function train(b, type) {
  const T = b.team, ud = UNITS[type];
  if (!b.done || b.dead || b.queue.length >= 5) return false;
  if (S.AGE[T] < (ud.age || 1)) { say(T, 'Requiere Edad ' + AGES[ud.age - 1].name); return false; }
  if (S.POP[T] >= S.CAP[T]) { say(T, 'Necesitas más casas 🏠'); return false; }
  if (!pay(T, ud.cost)) { say(T, 'Recursos insuficientes'); return false; }
  b.queue.push(type); S.POP[T]++; return true;
}

export function startAdvance(b) {
  const T = b.team, next = AGES[S.AGE[T]];
  if (!next || !b.done || b.dead || S.blds.some(o => o.team === T && o.adv)) return false;
  if (!pay(T, next.cost)) { say(T, 'Recursos insuficientes'); return false; }
  b.adv = { p: 0, time: next.time, to: S.AGE[T] + 1 };
  say(T, 'Avanzando a la Edad ' + next.name + '…'); return true;
}

export function canResearch(T, up) {
  if (S.UPD[T].has(up.id) || S.AGE[T] < up.age || (up.req && !S.UPD[T].has(up.req))) return false;
  return !S.blds.some(o => o.team === T && o.rs && o.rs.id === up.id);
}
export function startResearch(b, id) {
  const T = b.team, up = UPG.find(u => u.id === id);
  if (!up || b.t !== 'smithy' || !b.done || b.dead || b.rs || !canResearch(T, up)) return false;
  if (!pay(T, up.cost)) { say(T, 'Recursos insuficientes'); return false; }
  b.rs = { id, p: 0 }; return true;
}

export function validPlace(t, x, y, m = 0) {
  const d = BLDS[t];
  for (let j = -m; j < d.h + m; j++) for (let i = -m; i < d.w + m; i++) if (!walk(x + i, y + j)) return false;
  return true;
}

export function placeBuilding(T, t, x, y, builders, margin = 0) {
  if (S.AGE[T] < (BLDS[t].age || 1)) return null;
  if (!validPlace(t, x, y, margin)) return null;
  if (!pay(T, BLDS[t].cost)) return null;
  const b = addBld(t, T, x, y, false);
  for (const u of builders) cmdBuild(u, b);
  return b;
}
