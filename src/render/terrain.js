// Pre-renderiza el terreno entero (y su versión pequeña para el minimapa) una sola vez por partida.
import { TS, MW, MH, WW, WH } from '../config/constants.js';
import { S } from '../core/state.js';
import { mulberry } from '../core/util.js';
import { mkSprite } from './sprites.js';

export const gfx = { terr: null, mini: null };

export function bakeTerrain() {
  const r = mulberry(7);
  const water = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH ? false : S.terrain[y * MW + x] === 1;
  gfx.terr = mkSprite(WW, WH, g => {
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const px = x * TS, py = y * TS;
      if (water(x, y)) {
        g.fillStyle = (x + y) % 2 ? '#2f6fb0' : '#3478b8'; g.fillRect(px, py, TS, TS);
        g.strokeStyle = '#ffffff30'; g.lineWidth = 1.5;
        if (r() < 0.5) { g.beginPath(); const wx = px + 6 + r() * 12, wy = py + 8 + r() * 16; g.moveTo(wx, wy); g.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy); g.stroke(); }
        continue;
      }
      const sand = water(x - 1, y) || water(x + 1, y) || water(x, y - 1) || water(x, y + 1);
      if (sand) { g.fillStyle = '#d8c58a'; g.fillRect(px, py, TS, TS); continue; }
      g.fillStyle = `hsl(100,38%,${38 + r() * 6}%)`; g.fillRect(px, py, TS, TS);
      g.strokeStyle = 'hsla(110,40%,28%,.55)'; g.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const tx = px + r() * TS, ty = py + 4 + r() * 24;
        g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - 1.5, ty - 4); g.moveTo(tx, ty); g.lineTo(tx + 1.5, ty - 4); g.stroke();
      }
      if (r() < 0.06) { g.fillStyle = ['#fde047', '#fff', '#f9a8d4'][(r() * 3) | 0]; g.beginPath(); g.arc(px + r() * TS, py + r() * TS, 1.8, 0, 7); g.fill(); }
    }
  });
  gfx.mini = mkSprite(160, 160, g => { g.imageSmoothingEnabled = true; g.drawImage(gfx.terr, 0, 0, 160, 160); });
}
