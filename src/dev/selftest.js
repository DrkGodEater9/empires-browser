// Smoke test sin interfaz: simula una partida IA vs IA y vuelca un resumen en <pre id="out">.
// Uso: abrir /?test (o --dump-dom en un navegador headless).
import { S } from '../core/state.js';
import { newGame, update } from '../systems/game.js';

export function run() {
  const out = document.createElement('pre'); out.id = 'out'; document.body.appendChild(out);
  const errs = []; window.addEventListener('error', e => errs.push(e.message));
  try {
    newGame('normal', true);
    let t = 0; const t0 = Date.now();
    const rich = location.search.includes('rich'); // recursos abundantes: ejercita edades, mejoras, caballeros y catapultas
    let tick = 0;
    while (S.g.state === 'play' && t < 2400) {
      if (rich && (tick++ % 200) === 0) for (const r of S.R) { r.food = Math.max(r.food, 3000); r.wood = Math.max(r.wood, 3000); r.gold = Math.max(r.gold, 3000); }
      update(0.05); t += 0.05;
    }
    const kinds = {}; S.units.forEach(u => { const k = u.team + u.t; kinds[k] = (kinds[k] || 0) + 1; });
    const bkinds = {}; S.blds.forEach(b => { const k = b.team + b.t; bkinds[k] = (bkinds[k] || 0) + 1; });
    const by = team => ({ units: S.units.filter(u => u.team === team).length, blds: S.blds.filter(b => b.team === team).length });
    out.textContent = JSON.stringify({ simSeconds: Math.round(t), ms: Date.now() - t0, state: S.g.state, age: S.AGE, upgrades: S.UPD.map(s => [...s]), p0: by(0), p1: by(1), res: S.R, kinds, bkinds, errs });
  } catch (e) { out.textContent = 'ERROR ' + e.stack; }
}
