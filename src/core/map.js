// Generación procedural del mapa (agua, bosques, recursos). Simétrico para ambas bases.
import { MW, MH } from '../config/constants.js';
import { S } from './state.js';
import { vnoise } from './util.js';
import { placeRes, mirror } from './world.js';

export function genMap(seed) {
  const s = seed % 1000;
  S.terrain = new Uint8Array(MW * MH);
  S.occ = new Array(MW * MH).fill(null);
  const clear = new Uint8Array(MW * MH);
  const mark = (cx, cy, r) => {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(MH - 1, cy + r); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(MW - 1, cx + r); x++)
        if (Math.hypot(x - cx, y - cy) <= r) clear[y * MW + x] = 1;
  };
  mark(8.5, 51.5, 9); mark(MW - 8.5, MH - 51.5, 9);
  for (let i = 0; i <= 240; i++) { // corredor entre bases para que nada quede encerrado
    const t = i / 240, o = Math.sin(t * 6.28 * 1.5 + s) * 5;
    mark(8 + (MW - 17) * t + o * 0.7, MH - 13 - (MH - 25) * t + o * 0.7, 2.2);
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!clear[y * MW + x] && vnoise(x * 0.11, y * 0.11, s) > 0.64) S.terrain[y * MW + x] = 1;
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const k = y * MW + x; if (clear[k] || S.terrain[k]) continue;
    if (vnoise(x * 0.2 + 50, y * 0.2 + 50, s) > 0.6 && Math.random() < 0.8) placeRes('tree', x, y);
  }
  // recursos iniciales (espejados para el enemigo)
  const pb = [['berry', 13, 48], ['berry', 14, 49], ['berry', 13, 50], ['berry', 14, 47], ['berry', 15, 49], ['gold', 13, 54], ['gold', 3, 57]];
  pb.forEach(([t, x, y]) => { placeRes(t, x, y); const w = t === 'gold' ? 2 : 1, m = mirror(x, y, w, w); placeRes(t, m[0], m[1]); });
  for (let i = 0; i < 34; i++) {
    const x = 2 + ((Math.random() * 8) | 0), y = 43 + ((Math.random() * 6) | 0), m = mirror(x, y, 1, 1);
    placeRes('tree', x, y); placeRes('tree', m[0], m[1]);
  }
  for (let i = 0; i < 6; i++) {
    const x = 14 + ((Math.random() * 36) | 0), y = 14 + ((Math.random() * 36) | 0), m = mirror(x, y, 2, 2);
    placeRes('gold', x, y); placeRes('gold', m[0], m[1]);
  }
  for (let i = 0; i < 8; i++) {
    const x = 12 + ((Math.random() * 40) | 0), y = 12 + ((Math.random() * 40) | 0);
    for (let k = 0; k < 4; k++) {
      const bx = x + ((Math.random() * 3) | 0), by = y + ((Math.random() * 3) | 0), m = mirror(bx, by, 1, 1);
      placeRes('berry', bx, by); placeRes('berry', m[0], m[1]);
    }
  }
}
