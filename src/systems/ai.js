// Jugador de computadora: economía, construcción, edades, mejoras, ejército y oleadas.
import { TS, MAXPOP } from '../config/constants.js';
import { UPG } from '../config/data.js';
import { S } from '../core/state.js';
import { cx, cy } from '../core/world.js';
import { cmdGather, cmdMove, nearestRes } from './orders.js';
import { train, placeBuilding, startAdvance, startResearch } from './economy.js';

export function aiTick(T) {
  const cfg = S.g.cfg[T], ai = S.g.ai[T], res = S.R[T], foe = 1 - T, age = S.AGE[T];
  const mine = S.blds.filter(b => b.team === T && !b.dead), done = mine.filter(b => b.done);
  if (!mine.length) return;
  const tc = done.find(b => b.t === 'tc');
  const vil = S.units.filter(u => u.team === T && u.t === 'villager' && !u.dead);
  const army = S.units.filter(u => u.team === T && u.t !== 'villager' && !u.dead);
  const home = tc || mine[0], hx = cx(home) / TS, hy = cy(home) / TS;
  const count = t => mine.filter(b => b.t === t).length;
  const trainers = done.filter(b => b.t === 'barracks' || b.t === 'stable' || b.t === 'siege');
  const rax = done.filter(b => b.t === 'barracks');

  // villagers + edad
  if (tc && vil.length + tc.queue.length < cfg.vil) train(tc, 'villager');
  if (tc && !tc.adv && age < 3 && (age < 2 || cfg.siege) && vil.length >= cfg.vil * 0.7 && army.length >= (age === 1 ? 3 : 6)) startAdvance(tc);

  // construcción (de a una)
  const building = mine.some(b => !b.done);
  const build = type => {
    let bv = null, bd = 1e9;
    for (const v of vil) { if (v.state === 'build' || v.carryN > 5) continue; const d = Math.hypot(v.x - hx * TS, v.y - hy * TS); if (d < bd) { bd = d; bv = v; } }
    if (!bv) return;
    for (let r = 4; r < 14; r++) for (let k = 0; k < 14; k++) {
      const a = Math.random() * 6.283, x = Math.round(hx + Math.cos(a) * r - 1), y = Math.round(hy + Math.sin(a) * r - 1);
      if (placeBuilding(T, type, x, y, [bv], 1)) return;
    }
  };
  const berries = nearestRes('food', hx * TS, hy * TS, T, 22 * TS);
  if (!building && vil.length >= 4) {
    if (S.CAP[T] - S.POP[T] <= 3 && S.CAP[T] < MAXPOP && res.wood >= 30) build('house');
    else if (rax.length + mine.filter(b => b.t === 'barracks' && !b.done).length < cfg.maxRax && vil.length >= cfg.vil * 0.5 && res.wood >= 100 && S.g.t > 50 * (count('barracks') + 1)) build('barracks');
    else if ((!berries || berries.kind !== 'res') && count('farm') < 2 + Math.floor(vil.length / 6) && res.wood >= 50) build('farm');
    else if (age >= 2 && count('tower') < cfg.towers && count('barracks') > 0 && res.wood >= 60 && res.gold >= 40) build('tower');
    else if (age >= 2 && cfg.maxRax > 1 && !count('stable') && res.wood >= 120) build('stable');
    else if (age >= 2 && !count('smithy') && res.wood >= 100 && res.gold >= 30) build('smithy');
    else if (age >= 3 && cfg.siege && !count('siege') && res.wood >= 200 && res.gold >= 50) build('siege');
  }

  // entrenamiento
  trainers.forEach(b => {
    if (b.queue.length >= 2) return;
    if (b.t === 'barracks') {
      const pick = (ai.n++ % 3 === 2) ? 'archer' : 'soldier';
      if (!train(b, pick)) train(b, pick === 'archer' ? 'soldier' : 'archer');
    } else if (b.t === 'stable') train(b, 'knight');
    else if (b.t === 'siege' && army.filter(u => u.t === 'catapult').length < 4) train(b, 'catapult');
  });
  // mejoras solo con excedente
  if (res.food >= 400 && res.gold >= 250) done.filter(b => b.t === 'smithy' && !b.rs).forEach(b => { for (const up of UPG) if (startResearch(b, up.id)) break; });

  // asignación de aldeanos libres
  const cnt = { wood: 0, food: 0, gold: 0 };
  vil.forEach(v => { if (v.gtype && (v.state === 'gather' || v.state === 'return')) cnt[v.gtype]++; });
  const want = S.g.t < 60 ? { wood: 0.45, food: 0.45, gold: 0.1 } : { wood: 0.38, food: 0.34, gold: 0.28 };
  vil.filter(v => v.state === 'idle').forEach(v => {
    let type = 'wood', bs = -1e9;
    for (const k in want) { const s = want[k] * (vil.length + 1) - cnt[k]; if (s > bs) { bs = s; type = k; } }
    let r = nearestRes(type, hx * TS, hy * TS, T, 40 * TS);
    if (!r && type !== 'wood') { type = 'wood'; r = nearestRes('wood', hx * TS, hy * TS, T, 60 * TS); }
    if (r) { cmdGather(v, r); cnt[type]++; }
  });

  // defensa y oleadas
  let threat = null, td = 14 * TS;
  for (const u of S.units) { if (u.dead || u.team !== foe) continue; const d = Math.hypot(u.x - hx * TS, u.y - hy * TS); if (d < td) { td = d; threat = u; } }
  if (threat && !ai.attacking) army.forEach(u => { if (u.state === 'idle') cmdMove(u, threat.x, threat.y, true); });
  if (!ai.attacking && S.g.t > cfg.first && army.length >= ai.size) { ai.attacking = true; ai.size += cfg.grow; }
  if (ai.attacking) {
    if (army.length <= 2) { ai.attacking = false; army.forEach(u => cmdMove(u, hx * TS, hy * TS, true)); }
    else army.forEach(u => {
      if (u.state !== 'idle') return;
      let best = null, bd = 1e9;
      for (const b of S.blds) { if (b.dead || b.team !== foe) continue; const d = Math.hypot(cx(b) - u.x, cy(b) - u.y); if (d < bd) { bd = d; best = b; } }
      if (best) cmdMove(u, cx(best), cy(best), true);
    });
  }
}
