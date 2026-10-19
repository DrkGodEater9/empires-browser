// Comportamiento por frame de unidades y edificios.
import { TS, CARRY, FARM_RATE } from '../config/constants.js';
import { UNITS, BLDS, RES, AGES, UPG } from '../config/data.js';
import { S } from '../core/state.js';
import { emit } from '../core/events.js';
import { setOcc, addUnit, spawnTile, distRect, cx, cy, tileX, tileY, walk } from '../core/world.js';
import { pathToPoint, approach, follow } from '../core/pathfinding.js';
import { cmdMove, cmdGather, cmdAttack, cmdBuild, nearestRes, nearestDrop } from './orders.js';
import { acquire, strike, hurt } from './combat.js';

function startReturn(u) { u.state = 'return'; u.path = []; u.fail = 0; u.rt = 0; }

function endAttack(u) {
  u.target = null; u.auto = false;
  if (u.amove && u.dest) { u.state = 'move'; u.path = []; u.rt = 0; } else u.state = 'idle';
}

export function updateUnit(u, dt) {
  const d = UNITS[u.t], mil = u.t !== 'villager';
  u.rt -= dt; u.at -= dt;
  switch (u.state) {
    case 'idle':
      if (mil && (u.aq -= dt) <= 0) { u.aq = 0.4; const t = acquire(u); if (t) { cmdAttack(u, t); u.auto = true; } }
      break;

    case 'move': {
      if (u.amove && (u.aq -= dt) <= 0) {
        u.aq = 0.5; const t = acquire(u);
        if (t) { u.state = 'attack'; u.target = t; u.path = []; u.rt = 0; u.auto = true; break; }
      }
      const arrived = () => !u.dest || Math.hypot(u.dest.x - u.x, u.dest.y - u.y) < 26;
      if (!u.path.length) {
        if (arrived()) { u.state = 'idle'; u.amove = false; break; }
        if (u.rt <= 0) { u.rt = 0.5; if (!pathToPoint(u, u.dest.x, u.dest.y)) { u.state = 'idle'; u.amove = false; } }
      } else if (follow(u, dt) && arrived()) { u.state = 'idle'; u.amove = false; }
      break;
    }

    case 'attack': {
      const t = u.target;
      if (!t || t.dead || t.kind === 'res') return endAttack(u);
      const dist = distRect(u.x, u.y, t), rng = d.rng * TS;
      if (u.auto && dist > TS * 13) return endAttack(u);
      if (dist <= rng) { u.path = []; if (u.at <= 0) { u.at = d.cd; strike(u, t); } }
      else if (!approach(u, dt, t, rng)) endAttack(u);
      break;
    }

    case 'gather': {
      const r = u.target;
      if (!r || r.dead) {
        const n = nearestRes(u.gtype, u.x, u.y, u.team, 14 * TS);
        if (n) { u.target = n; u.path = []; u.fail = 0; } else if (u.carryN > 0) startReturn(u); else u.state = 'idle';
        break;
      }
      if (u.carryN >= CARRY) { startReturn(u); break; }
      if (distRect(u.x, u.y, r) <= 24) {
        u.path = [];
        const rate = (r.kind === 'bld' ? FARM_RATE : RES[r.t].rate) / (S.g.cfg[u.team].eco * (1 + 0.1 * (S.AGE[u.team] - 1)));
        u.gt += dt;
        if (u.gt >= rate) {
          u.gt = 0; u.carryT = u.gtype; u.carryN++; r.amount--;
          if (r.amount <= 0) { r.dead = true; S.g.dirty = true; setOcc(r, null); }
        }
      } else if (!approach(u, dt, r, 24)) u.state = 'idle';
      break;
    }

    case 'return': {
      const tc = nearestDrop(u);
      if (!tc) { u.state = 'idle'; break; }
      if (distRect(u.x, u.y, tc) <= 24) {
        S.R[u.team][u.carryT] += u.carryN; u.carryN = 0; u.path = [];
        const r = u.target && !u.target.dead ? u.target : nearestRes(u.gtype, u.x, u.y, u.team, 14 * TS);
        if (r) { u.target = r; u.state = 'gather'; u.fail = 0; } else u.state = 'idle';
      } else if (!approach(u, dt, tc, 24)) u.state = 'idle';
      break;
    }

    case 'build': {
      const b = u.target;
      if (!b || b.dead || b.done) {
        if (b && b.done && !b.dead && b.t === 'farm') { cmdGather(u, b); break; }
        let nb = null, bd = 10 * TS;
        for (const o of S.blds) if (!o.dead && !o.done && o.team === u.team) { const dd = distRect(u.x, u.y, o); if (dd < bd) { bd = dd; nb = o; } }
        if (nb) cmdBuild(u, nb); else u.state = 'idle';
        break;
      }
      if (distRect(u.x, u.y, b) <= 24) {
        u.path = []; const bt = BLDS[b.t].time;
        b.prog += dt / bt; b.hp = Math.min(b.maxhp, b.hp + b.maxhp * 0.9 * dt / bt);
        if (Math.random() < dt * 1.6) emit('sfx', 'build', u.x, u.y);
        if (b.prog >= 1) {
          b.prog = 1; b.done = true;
          if (b.team === 0 && !S.g.test) { emit('toast', BLDS[b.t].name + ' terminado'); emit('sfx', 'done'); }
        }
      } else if (!approach(u, dt, b, 24)) u.state = 'idle';
      break;
    }
  }
}

export function updateBld(b, dt) {
  if (!b.done) return;
  const d = BLDS[b.t], T = b.team;

  if (b.adv) { // avance de edad
    b.adv.p += dt;
    if (b.adv.p >= b.adv.time) {
      S.AGE[T] = b.adv.to; b.adv = null;
      if (T === 0) { emit('toast', '🏛️ ¡Edad ' + AGES[S.AGE[0] - 1].name + '!'); emit('sfx', 'age'); }
    }
  }
  if (b.rs) { // investigación en herrería
    b.rs.p += dt; const up = UPG.find(x => x.id === b.rs.id);
    if (b.rs.p >= up.time) {
      S.UPD[T].add(up.id); S.UP[T].atk += up.atk || 0; S.UP[T].arm += up.arm || 0; b.rs = null;
      if (T === 0) { emit('toast', up.name + ' investigada'); emit('sfx', 'done'); }
    }
  }
  if (b.queue.length) { // cola de entrenamiento
    const ut = UNITS[b.queue[0]]; b.qp += dt;
    if (b.qp >= ut.time) {
      const tl = spawnTile(b);
      if (tl) {
        b.qp = 0; const type = b.queue.shift();
        const u = addUnit(type, T, tl[0] * TS + TS / 2, tl[1] * TS + TS / 2);
        if (T === 0) emit('sfx', 'train');
        const rl = b.rally;
        if (rl) { if (rl.target && !rl.target.dead && type === 'villager') cmdGather(u, rl.target); else cmdMove(u, rl.x, rl.y); }
      } else b.qp = ut.time;
    }
  }
  if (d.atk) { // torres y centro urbano disparan
    b.at -= dt;
    if (b.at <= 0) {
      let best = null, bd = d.rng * TS;
      for (const o of S.units) { if (o.dead || o.team === T) continue; const dd = Math.hypot(o.x - cx(b), o.y - cy(b)); if (dd < bd) { bd = dd; best = o; } }
      if (best) {
        b.at = d.cd; S.projs.push({ x1: cx(b), y1: cy(b) - 10, x2: best.x, y2: best.y, t: 0 });
        emit('sfx', 'arrow', cx(b), cy(b)); hurt(best, d.atk, null);
      } else b.at = 0.3;
    }
  }
}

// empuja suavemente a las unidades que se solapan
export function separate() {
  const us = S.units, n = us.length;
  for (let i = 0; i < n; i++) {
    const a = us[i]; if (a.dead) continue;
    for (let j = i + 1; j < n; j++) {
      const b = us[j]; if (b.dead) continue;
      const dx = b.x - a.x; if (dx > 18 || dx < -18) continue;
      const dy = b.y - a.y, dd = dx * dx + dy * dy, m = a.r + b.r - 2;
      if (dd >= m * m || dd < 0.0001) continue;
      const dist = Math.sqrt(dd), push = (m - dist) * 0.25, ux = dx / dist * push, uy = dy / dist * push;
      if (walk(Math.floor((a.x - ux) / TS), Math.floor((a.y - uy) / TS))) { a.x -= ux; a.y -= uy; }
      if (walk(Math.floor((b.x + ux) / TS), Math.floor((b.y + uy) / TS))) { b.x += ux; b.y += uy; }
    }
  }
}
