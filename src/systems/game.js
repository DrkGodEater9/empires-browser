// Ciclo de vida de la partida: nueva partida, update por frame, fin de juego.
import { TS, MW } from '../config/constants.js';
import { AI_CFG } from '../config/data.js';
import { S, resetWorld } from '../core/state.js';
import { emit } from '../core/events.js';
import { genMap } from '../core/map.js';
import { addBld, addUnit, spawnTile, cx, cy } from '../core/world.js';
import { centerOn } from '../core/camera.js';
import { calcPop } from './economy.js';
import { updateUnit, updateBld, separate } from './units.js';
import { aiTick } from './ai.js';
import { initFog, updateFog } from './fog.js';
import { bakeTerrain } from '../render/terrain.js';

export function newGame(diff, test = false) {
  resetWorld();
  const enemy = AI_CFG[diff];
  S.g = {
    state: 'play', t: 0, diff, paused: false, test, over: false, aiT: [0, 0], chk: 0, hud: 0, dirty: false,
    cfg: [AI_CFG.normal, enemy],
    ai: [{ n: 0, size: AI_CFG.normal.size, attacking: false }, { n: 0, size: enemy.size, attacking: false }],
  };
  initFog();
  genMap((Math.random() * 1e6) | 0);
  bakeTerrain();
  const p = addBld('tc', 0, 7, 50, true), e = addBld('tc', 1, MW - 10, 11, true);
  calcPop();
  for (let i = 0; i < 3; i++) for (const b of [p, e]) {
    const tl = spawnTile(b); addUnit('villager', b.team, tl[0] * TS + TS / 2, tl[1] * TS + TS / 2);
  }
  updateFog();
  S.cam.z = 1; centerOn(cx(p), cy(p));
  emit('game:start');
}

export function endGame(win) {
  S.g.over = true; S.g.state = 'over';
  emit('game:over', win, S.g.t);
}

export function update(dt) {
  const g = S.g;
  calcPop();
  for (const b of S.blds) if (!b.dead) updateBld(b, dt);
  for (const u of S.units) if (!u.dead) updateUnit(u, dt);
  separate();

  S.projs = S.projs.filter(p => (p.t += dt) < 0.22);
  for (const f of S.fx) { f.t += dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 160 * dt; } }
  S.fx = S.fx.filter(f => f.t < f.max);

  for (let T = g.test ? 0 : 1; T < 2; T++) { g.aiT[T] -= dt; if (g.aiT[T] <= 0) { g.aiT[T] = g.cfg[T].iv; aiTick(T); } }

  if (g.dirty) {
    g.dirty = false;
    S.units = S.units.filter(u => !u.dead); S.blds = S.blds.filter(b => !b.dead); S.ress = S.ress.filter(r => !r.dead);
    S.sel = S.sel.filter(e => !e.dead);
  }
  if ((g.fogT = (g.fogT ?? 0) - dt) <= 0) { g.fogT = 0.2; updateFog(); }

  g.chk -= dt;
  if (g.chk <= 0 && !g.over) {
    g.chk = 0.5;
    const pb = S.blds.some(b => b.team === 0), eb = S.blds.some(b => b.team === 1);
    if (!eb) endGame(true); else if (!pb) endGame(false);
  }
  g.t += dt;
}
