// Audio 100% sintetizado con WebAudio (sin archivos): efectos + música ambiental suave.
import { S } from '../core/state.js';
import { on } from '../core/events.js';
import { vis } from '../core/camera.js';
import { svg } from '../assets/icons.js';

const snd = { ctx: null, master: null, mute: false, last: {}, noiseBuf: null };
const THROTTLE = { hit: 70, arrow: 80, death: 90, crash: 150, build: 350, select: 40, order: 40, click: 30 };

function ensure() {
  if (!snd.ctx) {
    try {
      snd.ctx = new (window.AudioContext || window.webkitAudioContext)();
      snd.master = snd.ctx.createGain(); snd.master.gain.value = 0.5; snd.master.connect(snd.ctx.destination);
      const n = snd.ctx.sampleRate; snd.noiseBuf = snd.ctx.createBuffer(1, n, n);
      const d = snd.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { snd.ctx = null; }
  }
  if (snd.ctx && snd.ctx.state === 'suspended') snd.ctx.resume();
  return snd.ctx;
}

function tone(f, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
  const c = snd.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(snd.master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.1, freq = 1200, delay = 0) {
  const c = snd.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = snd.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(snd.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const SFX = {
  click: () => tone(660, 0.06, 'square', 0.05),
  select: () => tone(520, 0.07, 'triangle', 0.08, 200),
  order: () => tone(380, 0.08, 'triangle', 0.07, -120),
  build: () => { noise(0.07, 0.12, 900); noise(0.07, 0.09, 700, 0.12); },
  done: () => { tone(523, 0.15, 'triangle', 0.12); tone(784, 0.25, 'triangle', 0.12, 0, 0.12); },
  train: () => { tone(440, 0.1, 'sine', 0.1); tone(587, 0.14, 'sine', 0.1, 0, 0.09); },
  hit: () => noise(0.07, 0.09, 500),
  arrow: () => tone(900, 0.1, 'sawtooth', 0.03, -600),
  death: () => tone(200, 0.25, 'sawtooth', 0.06, -140),
  crash: () => noise(0.5, 0.2, 300),
  alert: () => { tone(300, 0.18, 'square', 0.08); tone(300, 0.18, 'square', 0.08, 0, 0.25); },
  age: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, 0, i * 0.15)),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.14, 0, i * 0.18)),
  lose: () => [330, 262, 196].forEach((f, i) => tone(f, 0.6, 'sawtooth', 0.08, 0, i * 0.3)),
};

function sfx(name, x, y) {
  if (S.g.test || snd.mute || !SFX[name]) return;
  if (x !== undefined && !vis(x - 16, y - 16, 32, 32)) return;   // sonidos posicionales: solo si están en pantalla
  if (!ensure()) return;
  const now = performance.now();
  if (snd.last[name] && now - snd.last[name] < (THROTTLE[name] || 0)) return;
  snd.last[name] = now; SFX[name]();
}

// música: notas pentatónicas lentas sobre un bajo que va cambiando
let musicTimer = null, step = 0;
function startMusic() {
  stopMusic(); if (S.g.test) return;
  const scale = [0, 2, 4, 7, 9], roots = [220, 196, 174.6, 196];
  musicTimer = setInterval(() => {
    if (snd.mute || S.g.paused || !ensure()) return;
    const base = roots[(step >> 3) & 3];
    tone(base * Math.pow(2, scale[(Math.random() * 5) | 0] / 12) * (Math.random() < 0.3 ? 2 : 1), 1.8, 'triangle', 0.03);
    if (step % 4 === 0) tone(base / 2, 3, 'sine', 0.045);
    step++;
  }, 700);
}
function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }

export function initSound(btn) {
  on('sfx', sfx);
  on('game:start', () => { sfx('click'); startMusic(); });
  on('game:over', win => { stopMusic(); sfx(win ? 'win' : 'lose'); });
  const toggle = () => { snd.mute = !snd.mute; btn.innerHTML = svg(snd.mute ? 'muted' : 'speaker', 20); };
  on('mute:toggle', toggle);
  btn.addEventListener('click', () => { ensure(); toggle(); });
}
