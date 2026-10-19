import { WW, WH, TEAM_COL } from '../config/constants.js';
import { S } from '../core/state.js';
import { centerOn } from '../core/camera.js';
import { seen, bexp, fog } from '../systems/fog.js';
import { gfx } from './terrain.js';

let mini, mctx;
const SIZE = 160, SC = SIZE / WW;

export function initMinimap(canvas) { mini = canvas; mctx = canvas.getContext('2d'); }

export function renderMini() {
  mctx.drawImage(gfx.mini, 0, 0);
  for (const r of S.ress) {
    mctx.fillStyle = r.t === 'tree' ? '#14532d' : r.t === 'gold' ? '#fbbf24' : '#e11d48';
    const z = r.t === 'gold' ? 3 : 2; mctx.fillRect(r.x * 32 * SC, r.y * 32 * SC, z, z);
  }
  mctx.drawImage(fog.cv, 0, 0, SIZE, SIZE);
  for (const b of S.blds) { if (!bexp(b)) continue; mctx.fillStyle = TEAM_COL[b.team]; mctx.fillRect(b.x * 32 * SC, b.y * 32 * SC, b.w * 32 * SC + 1, b.h * 32 * SC + 1); }
  for (const u of S.units) { if (!seen(u)) continue; mctx.fillStyle = TEAM_COL[u.team]; mctx.fillRect(u.x * SC - 1, u.y * SC - 1, 2.5, 2.5); }
  mctx.strokeStyle = '#fff'; mctx.lineWidth = 1;
  mctx.strokeRect(S.cam.x * SC, S.cam.y * SC, S.view.w / S.cam.z * SC, S.view.h / S.cam.z * SC);
}

// coordenadas del mundo bajo un evento de mouse sobre el minimapa
export function minimapToWorld(e) {
  const r = mini.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * WW, y: (e.clientY - r.top) / r.height * WH };
}
export function minimapCenter(e) { const w = minimapToWorld(e); centerOn(w.x, w.y); }
