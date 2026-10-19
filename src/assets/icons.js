// Íconos vectoriales propios (viewBox 24x24). Una sola definición sirve para HTML (SVG) y para canvas.
// Formas: ['p', [x,y,...]] polígono · ['l', [x,y,...], ancho] polilínea · ['c', x, y, r] círculo · ['o', x, y, rExt, rInt] anillo

const P = (...pts) => ['p', pts];
const L = (pts, w = 2) => ['l', pts, w];
const C = (x, y, r) => ['c', x, y, r];
const O = (x, y, ro, ri) => ['o', x, y, ro, ri];
const R = (x, y, w, h) => P(x, y, x + w, y, x + w, y + h, x, y + h);

function arc(cx, cy, r, a0, a1, n = 14) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
  return out;
}
function quad(p0, c, p1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push(u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]); }
  return out;
}
const mapPts = (pts, f) => { const o = []; for (let i = 0; i < pts.length; i += 2) o.push(...f(pts[i], pts[i + 1])); return o; };
function xform(shapes, f) {
  return shapes.map(s => {
    if (s[0] === 'p') return ['p', mapPts(s[1], f)];
    if (s[0] === 'l') return ['l', mapPts(s[1], f), s[2]];
    const [nx, ny] = f(s[1], s[2]); return [s[0], nx, ny, ...s.slice(3)];
  });
}
const rot = (shapes, deg) => {
  const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  return xform(shapes, (x, y) => [12 + (x - 12) * ca - (y - 12) * sa, 12 + (x - 12) * sa + (y - 12) * ca]);
};
const scale = (shapes, k) => xform(shapes, (x, y) => [12 + (x - 12) * k, 12 + (y - 12) * k]);

const sword = [P(12, 1, 14, 4, 14, 15, 10, 15, 10, 4), P(6, 15, 18, 15, 18, 17.5, 6, 17.5), R(11, 17.5, 2, 3.5), C(12, 22, 1.6)];
const gearShapes = () => {
  const out = [O(12, 12, 7.5, 4.2), C(12, 12, 1.8)];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a), p = (r, w) => [12 + r * c - w * s, 12 + r * s + w * c];
    out.push(['p', [...p(6.5, -1.7), ...p(10.5, -1.4), ...p(10.5, 1.4), ...p(6.5, 1.7)]]);
  }
  return out;
};

export const ICON = {
  // recursos y estado
  food: [C(12, 14.5, 7), L([12, 8, 12, 4], 1.8), P(12, 5.5, 17.5, 2.5, 16.5, 7.5)],
  wood: [O(7.2, 16, 5.6, 2.6), O(16.8, 16, 5.6, 2.6), O(12, 7.6, 5.6, 2.6)],
  coin: [O(12, 12, 10, 7), C(12, 12, 3.4)],
  person: [C(12, 7.5, 4.2), P(4, 21, 5, 15, 8, 12.5, 16, 12.5, 19, 15, 20, 21)],
  age: [P(12, 2, 22, 8, 2, 8), R(4, 10, 3.5, 9), R(10.25, 10, 3.5, 9), R(16.5, 10, 3.5, 9), R(2, 20, 20, 2.5)],
  speaker: [P(3, 9, 7, 9, 12, 5, 12, 19, 7, 15, 3, 15), L(arc(12, 12, 4.5, -50, 50, 6), 1.8), L(arc(12, 12, 8.5, -50, 50, 8), 1.8)],
  muted: [P(3, 9, 7, 9, 12, 5, 12, 19, 7, 15, 3, 15), L([15.5, 9, 21.5, 15], 2), L([21.5, 9, 15.5, 15], 2)],

  // unidades
  pick: rot([L([12, 6, 12, 22], 2.4), L(quad([3, 9.5], [12, 0.5], [21, 9.5]), 3.2)], 35),
  sword: scale(rot(sword, 45), 1.22),
  bow: [L(arc(6, 12, 11, -65, 65), 2.2), L([10.65, 2.1, 10.65, 21.9], 1), L([3, 12, 20, 12], 1.6), P(23, 12, 18.5, 9.5, 18.5, 14.5)],
  knight: [P(6, 21.5, 6, 18, 9.5, 14.5, 8, 12.5, 5.5, 13.5, 3.5, 11.5, 9, 5, 10.5, 2.5, 12, 4.5, 16, 5.5, 19.5, 11, 19.5, 21.5), R(5, 21.5, 15.5, 1.5)],
  catapult: [O(7, 17, 5, 2.8), L([7, 17, 18, 5.5], 2.4), P(15.5, 2.5, 22.5, 4.5, 20.5, 9.5, 14.5, 7.5), L([1.5, 22, 17, 22], 2)],

  // edificios
  castle: [P(3, 21, 3, 9, 6, 9, 6, 5.5, 9, 5.5, 9, 9, 15, 9, 15, 5.5, 18, 5.5, 18, 9, 21, 9, 21, 21, 14, 21, 14, 15.5, 10, 15.5, 10, 21)],
  house: [P(2.5, 12, 12, 3, 21.5, 12, 18.5, 12, 18.5, 21, 13.5, 21, 13.5, 15, 10.5, 15, 10.5, 21, 5.5, 21, 5.5, 12)],
  swords: [...rot(sword, 45), ...rot(sword, -45)].map(s => s),
  wheat: [L([12, 22, 12, 5], 1.8), ...[5, 9.5, 14].flatMap(y => [P(12, y + 2.5, 7.5, y - 1.5, 8.5, y + 2), P(12, y + 2.5, 16.5, y - 1.5, 15.5, y + 2)]), P(12, 1, 14, 5, 12, 6.5, 10, 5)],
  tower: [P(6, 21.5, 6, 8, 4, 8, 4, 2.5, 8, 2.5, 8, 5, 10, 5, 10, 2.5, 14, 2.5, 14, 5, 16, 5, 16, 2.5, 20, 2.5, 20, 8, 18, 8, 18, 21.5, 13.5, 21.5, 13.5, 16, 10.5, 16, 10.5, 21.5)],
  horseshoe: [L(arc(12, 10.5, 7.5, 180, 0, 16), 4.2), R(2.6, 3, 4, 7.5), R(17.4, 3, 4, 7.5)],
  anvil: [P(2, 8, 19, 8, 22, 5.5, 22, 10.5, 17, 11.5, 15, 13.5, 15, 17, 19.5, 19, 19.5, 21.5, 4.5, 21.5, 4.5, 19, 9, 17, 9, 13.5, 7, 11.5, 2, 11.5)],
  gear: gearShapes(),

  // acciones y recursos del mapa
  stop: [R(5.5, 5.5, 13, 13)],
  target: [O(12, 12, 9, 7), C(12, 12, 2.5), L([12, 1, 12, 6], 2), L([12, 18, 12, 23], 2), L([1, 12, 6, 12], 2), L([18, 12, 23, 12], 2)],
  shield: [P(12, 2, 20, 5, 20, 12, 12, 22, 4, 12, 4, 5)],
  shield2: [L([12, 2, 20, 5, 20, 12, 12, 22, 4, 12, 4, 5, 12, 2], 2), P(12, 7, 16, 8.5, 16, 12, 12, 17, 8, 12, 8, 8.5)],
  tree: [P(12, 1.5, 18, 10, 15, 10, 20, 17, 13.2, 17, 13.2, 22.5, 10.8, 22.5, 10.8, 17, 4, 17, 9, 10, 6, 10)],
  berry: [C(8, 15, 4.2), C(16, 15, 4.2), C(12, 8.5, 4.2), L([12, 4.5, 14, 1.5], 1.6)],
};
ICON.swords = scale([...rot(sword, 45), ...rot(sword, -45)], 1.1);

function shapeSvg(s, color) {
  const f = color || 'currentColor', pts = a => a.map(v => +v.toFixed(2)).join(' ');
  if (s[0] === 'p') return `<polygon points="${pts(s[1])}" fill="${f}"/>`;
  if (s[0] === 'l') return `<polyline points="${pts(s[1])}" fill="none" stroke="${f}" stroke-width="${s[2]}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (s[0] === 'c') return `<circle cx="${s[1]}" cy="${s[2]}" r="${s[3]}" fill="${f}"/>`;
  return `<circle cx="${s[1]}" cy="${s[2]}" r="${(s[3] + s[4]) / 2}" fill="none" stroke="${f}" stroke-width="${s[3] - s[4]}"/>`;
}

export function svg(name, size = 18, color) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${(ICON[name] || []).map(s => shapeSvg(s, color)).join('')}</svg>`;
}

function paint(g, shapes, color) {
  g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of shapes) {
    g.beginPath();
    if (s[0] === 'p' || s[0] === 'l') {
      const p = s[1]; g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
      if (s[0] === 'p') { g.closePath(); g.fill(); } else { g.lineWidth = s[2]; g.stroke(); }
    } else if (s[0] === 'c') { g.arc(s[1], s[2], s[3], 0, 7); g.fill(); }
    else { g.lineWidth = s[3] - s[4]; g.arc(s[1], s[2], (s[3] + s[4]) / 2, 0, 7); g.stroke(); }
  }
}

const cache = new Map();
// dibuja el ícono centrado en (x,y); usa un sprite cacheado al doble de resolución
export function drawIcon(ctx, name, x, y, size, color = '#fff') {
  const key = name + '|' + size + '|' + color; let c = cache.get(key);
  if (!c) {
    const px = Math.ceil(size * 2); c = document.createElement('canvas'); c.width = c.height = px;
    const g = c.getContext('2d'); g.scale(px / 24, px / 24); paint(g, ICON[name] || [], color); cache.set(key, c);
  }
  ctx.drawImage(c, x - size / 2, y - size / 2, size, size);
}

// reemplaza <i data-ic="nombre" data-s="tamaño"> por su SVG
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = svg(el.dataset.ic, +el.dataset.s || 18); });
}
