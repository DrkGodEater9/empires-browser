// Pathfinding por BFS sobre la grilla de tiles (8 direcciones, sin cortar esquinas).
import { TS, MW, MH } from '../config/constants.js';
import { S } from './state.js';
import { walk, nearestFree, distRect, tileX, tileY, cx, cy } from './world.js';

const prevA = new Int32Array(MW * MH), queueA = new Int32Array(MW * MH);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function bfs(sx, sy, pred) {
  prevA.fill(-2);
  let head = 0, tail = 0; const si = sy * MW + sx; prevA[si] = -1; queueA[tail++] = si;
  while (head < tail) {
    const ci = queueA[head++], x = ci % MW, y = (ci / MW) | 0;
    if (pred(x, y)) {
      const out = []; let k = ci;
      while (prevA[k] !== -1) { out.push({ x: (k % MW) * TS + TS / 2, y: ((k / MW) | 0) * TS + TS / 2 }); k = prevA[k]; }
      return out.reverse();
    }
    for (let d = 0; d < 8; d++) {
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const ni = ny * MW + nx; if (prevA[ni] !== -2 || !walk(nx, ny)) continue;
      if (d >= 4 && (!walk(x + DIRS[d][0], y) || !walk(x, y + DIRS[d][1]))) continue;
      prevA[ni] = ci; queueA[tail++] = ni;
    }
  }
  return null;
}

export function pathToPoint(u, wx, wy) {
  const f = nearestFree(Math.floor(wx / TS), Math.floor(wy / TS)); if (!f) return false;
  const p = bfs(tileX(u), tileY(u), (x, y) => x === f[0] && y === f[1]);
  if (!p) return false; u.path = p; return true;
}

export function pathNear(u, t, rng) {
  const lim = rng + (t.kind === 'unit' ? TS * 0.6 : 0);
  const p = bfs(tileX(u), tileY(u), (x, y) => distRect(x * TS + TS / 2, y * TS + TS / 2, t) <= lim);
  if (!p) return false; u.path = p; return true;
}

export function follow(u, dt) {
  const p = u.path[0]; if (!p) return true;
  if (!walk(Math.floor(p.x / TS), Math.floor(p.y / TS))) { u.path = []; u.rt = 0; return false; }
  const dx = p.x - u.x, dy = p.y - u.y, d = Math.hypot(dx, dy), s = u.spd * dt;
  if (d <= s) { u.x = p.x; u.y = p.y; u.path.shift(); return u.path.length === 0; }
  u.x += dx / d * s; u.y += dy / d * s; return false;
}

export function stepToward(u, x, y, dt) {
  const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy); if (d < 1) return;
  const s = Math.min(u.spd * dt, d), nx = u.x + dx / d * s, ny = u.y + dy / d * s;
  if (walk(Math.floor(nx / TS), Math.floor(ny / TS)) || !walk(tileX(u), tileY(u))) { u.x = nx; u.y = ny; }
}

// mueve a `u` hasta quedar a menos de `rng` px de `t`; false si lleva demasiado sin poder llegar
export function approach(u, dt, t, rng) {
  if (!u.path.length) {
    if (u.rt <= 0) { u.rt = 0.4; if (pathNear(u, t, rng)) u.fail = 0; else if (++u.fail > 4) { u.fail = 0; return false; } }
  } else if (t.kind === 'unit' && u.rt <= 0) { u.rt = 0.5; pathNear(u, t, rng); }
  follow(u, dt);
  if (!u.path.length) stepToward(u, cx(t), cy(t), dt);
  return true;
}
