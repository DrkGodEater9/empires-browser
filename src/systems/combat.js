// Daño, muerte, adquisición de objetivos.
import { UNITS } from '../config/data.js';
import { TEAM_COL } from '../config/constants.js';
import { S } from '../core/state.js';
import { emit } from '../core/events.js';
import { setOcc, cx, cy, distRect } from '../core/world.js';
import { cmdAttack } from './orders.js';

export function acquire(u) {
  const sight = (UNITS[u.t].rng + 3) * 32; let best = null, bd = sight;
  for (const o of S.units) { if (o.dead || o.team === u.team) continue; const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < bd) { bd = d; best = o; } }
  if (best) return best;
  for (const b of S.blds) { if (b.dead || b.team === u.team) continue; const d = distRect(u.x, u.y, b); if (d < bd) { bd = d; best = b; } }
  return best;
}

function alertPlayer(t) {
  const now = performance.now();
  if (now - S.lastAlert < 8000) return;
  S.lastAlert = now;
  emit('toast', '⚠️ ¡Te atacan!'); emit('sfx', 'alert');
  S.fx.push({ k: 'c', x: cx(t), y: cy(t), t: 0, max: 1.2, c: '#ef4444' });
}

export function hurt(t, dmg, src) {
  if (t.dead) return;
  if (t.kind === 'unit') dmg = Math.max(1, dmg - (UNITS[t.t].arm || 0) - S.UP[t.team].arm);
  if (t.team === 0 && !S.g.test) alertPlayer(t);
  t.hp -= dmg;
  if (t.hp <= 0) return kill(t);
  if (t.kind === 'unit' && t.t !== 'villager' && src && !src.dead && (t.state === 'idle' || (t.state === 'move' && t.amove))) { cmdAttack(t, src); t.auto = true; }
}

export function kill(e) {
  e.dead = true; S.g.dirty = true;
  const x = cx(e), y = cy(e);
  emit('sfx', e.kind === 'unit' ? 'death' : 'crash', x, y);
  for (let i = 0; i < (e.kind === 'unit' ? 5 : 12); i++) {
    S.fx.push({ k: 'p', x, y, vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.7) * 80, t: 0, max: 0.6 + Math.random() * 0.4, c: e.kind === 'unit' ? TEAM_COL[e.team] : '#a8a29e' });
  }
  if (e.kind !== 'unit') setOcc(e, null);
}

export function strike(u, t) {
  const d = UNITS[u.t];
  if (d.rng > 2) S.projs.push({ x1: u.x, y1: u.y - 4, x2: cx(t), y2: cy(t), t: 0 });
  emit('sfx', d.rng > 2 ? 'arrow' : 'hit', u.x, u.y);
  let dmg = d.atk + (u.t !== 'villager' ? S.UP[u.team].atk : 0);
  if (t.kind === 'bld') dmg *= d.bm != null ? d.bm : 1;
  else dmg *= (d.um != null ? d.um : 1) * ((d.bonus && d.bonus[t.t]) || 1);
  hurt(t, dmg, u);
  if (d.splash) for (const o of S.units) {
    if (!o.dead && o !== t && o.team !== u.team && Math.hypot(o.x - cx(t), o.y - cy(t)) < d.splash) hurt(o, dmg * 0.5, u);
  }
}
