import './styles/main.css';
import { S } from './core/state.js';
import { makeSprites } from './render/sprites.js';
import { initRenderer, render } from './render/renderer.js';
import { initMinimap, renderMini } from './render/minimap.js';
import { initHud, updateHud, refreshInfo } from './ui/hud.js';
import { initCommandPanel, refreshCommands } from './ui/commandPanel.js';
import { initInput, panCamera } from './ui/input.js';
import { initSound } from './audio/sound.js';
import { newGame, update } from './systems/game.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), mini = $('mini');

makeSprites();
initRenderer(canvas);
initMinimap(mini);
initHud();
initCommandPanel();
initInput(canvas, mini);
initSound($('snd'));

// menú
let chosen = 'normal';
document.querySelectorAll('.diff button').forEach(b => b.onclick = () => {
  chosen = b.dataset.d;
  document.querySelectorAll('.diff button').forEach(x => x.classList.toggle('sel', x === b));
});
$('play').onclick = () => newGame(chosen);
$('again').onclick = () => { $('end').classList.add('hidden'); $('menu').classList.remove('hidden'); S.g.state = 'menu'; };

// bucle principal
let last = performance.now(), miniTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const g = S.g;
  if (g.state !== 'menu') {
    if (g.state === 'play' && !g.paused) update(dt);
    panCamera(dt);
    render();
    if ((miniTick++ & 3) === 0) renderMini();
    if ((g.hud -= dt) <= 0) { g.hud = 0.2; updateHud(); refreshCommands(false); refreshInfo(); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test sin interfaz (IA vs IA): index.html?test
if (location.search.includes('test')) import('./dev/selftest.js').then(m => m.run());
