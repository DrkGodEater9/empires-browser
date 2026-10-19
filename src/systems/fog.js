// Niebla de guerra: tiles sin explorar (negro), explorados pero fuera de visión (oscuro) y visibles.
import { TS, MW, MH } from '../config/constants.js';
import { BLDS } from '../config/data.js';
import { S } from '../core/state.js';
import { cx, cy } from '../core/world.js';

export const fog = { cv: null };   // canvas MWxMH con alpha por tile; el renderer lo escala (bilinear = bordes suaves)
let fctx = null, img = null;

export function initFog() {
  S.explored = new Uint8Array(MW * MH); S.visible = new Uint8Array(MW * MH);
  fog.cv = document.createElement('canvas'); fog.cv.width = MW; fog.cv.height = MH;
  fctx = fog.cv.getContext('2d'); img = fctx.createImageData(MW, MH);
}

function reveal(x, y, r) {
  const tx = Math.floor(x / TS), ty = Math.floor(y / TS), ri = Math.ceil(r);
  for (let j = -ri; j <= ri; j++) for (let i = -ri; i <= ri; i++) {
    if (i * i + j * j > r * r) continue;
    const X = tx + i, Y = ty + j; if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue;
    const k = Y * MW + X; S.visible[k] = 1; S.explored[k] = 1;
  }
}

export function updateFog() {
  S.visible.fill(0);
  for (const u of S.units) if (u.team === 0 && !u.dead) reveal(u.x, u.y, u.t === 'archer' || u.t === 'knight' || u.t === 'catapult' ? 7 : 6);
  for (const b of S.blds) if (b.team === 0 && !b.dead) reveal(cx(b), cy(b), BLDS[b.t].sight || 6);
  const d = img.data;
  for (let k = 0; k < MW * MH; k++) { d[k * 4 + 3] = !S.explored[k] ? 255 : S.visible[k] ? 0 : 130; }
  fctx.putImageData(img, 0, 0);
}

// ¿puede el jugador ver esta unidad / recordar este edificio?
export const seen = u => u.team === 0 || S.g.test || S.visible[Math.floor(u.y / TS) * MW + Math.floor(u.x / TS)] === 1;
export const bexp = b => b.team === 0 || S.g.test || S.explored[(b.y + (b.h >> 1)) * MW + b.x + (b.w >> 1)] === 1;
