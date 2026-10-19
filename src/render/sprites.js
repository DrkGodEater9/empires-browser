// Sprites procedurales (se dibujan una vez en canvases fuera de pantalla).
export function mkSprite(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c;
}
export function tri(g, a, b, c, d, e, f, col) { g.fillStyle = col; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
export function ell(g, x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }

export const SPR = {};

export function makeSprites() {
  SPR.tree = [0, 1, 2].map(v => mkSprite(32, 46, g => {
    ell(g, 16, 41, 11, 4, '#0003');
    g.fillStyle = '#6b4423'; g.fillRect(14, 31, 5, 11);
    const c = [['#1f5f2a', '#2a7a35', '#38963f'], ['#25692c', '#318a3a', '#46a84a'], ['#2d6a2a', '#3d8a34', '#5aa844']][v];
    tri(g, 16, 14, 2, 36, 30, 36, c[0]); tri(g, 16, 8, 4, 28, 28, 28, c[1]); tri(g, 16, 1, 7, 18, 25, 18, c[2]);
  }));
  SPR.berry = mkSprite(32, 32, g => {
    ell(g, 16, 26, 11, 4, '#0003'); ell(g, 16, 19, 12, 9, '#2d7a2f'); ell(g, 11, 16, 7, 6, '#3b9a3d'); ell(g, 21, 17, 7, 6, '#36903a');
    g.fillStyle = '#e11d48';
    [[9, 15], [15, 19], [21, 14], [24, 20], [13, 12], [18, 15]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 2.2, 0, 7); g.fill(); });
  });
  SPR.gold = mkSprite(64, 64, g => {
    ell(g, 32, 54, 28, 7, '#0003');
    g.fillStyle = '#6b7280'; g.beginPath(); g.moveTo(6, 52); g.lineTo(14, 22); g.lineTo(30, 10); g.lineTo(48, 18); g.lineTo(58, 52); g.closePath(); g.fill();
    g.fillStyle = '#8b92a0'; g.beginPath(); g.moveTo(14, 22); g.lineTo(30, 10); g.lineTo(38, 30); g.lineTo(20, 40); g.closePath(); g.fill();
    g.fillStyle = '#fbbf24';
    [[22, 40, 6], [38, 36, 7], [30, 24, 5], [46, 44, 5], [14, 46, 4]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, 7); g.fill(); });
    g.fillStyle = '#fde68a';
    [[20, 38, 2], [36, 34, 2.5], [29, 22, 1.6]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, 7); g.fill(); });
  });
}
