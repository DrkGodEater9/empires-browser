// Panel de comandos (botones según la selección) y sus atajos de teclado.
import { AGES, BLDS, UNITS, UPG, BUILD_MENU } from '../config/data.js';
import { S } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { canPay, costStr, train, startAdvance, startResearch, canResearch } from '../systems/economy.js';
import { own, cmdStop } from '../systems/orders.js';

const $ = id => document.getElementById(id);
let cmds = [], modeKey = '';

export const findCmd = key => cmds.find(c => c.k.toLowerCase() === key);

export function startPlace(t) {
  const d = BLDS[t];
  if (S.AGE[0] < (d.age || 1)) return emit('toast', 'Requiere Edad ' + AGES[d.age - 1].name);
  if (!canPay(0, d.cost)) return emit('toast', 'Recursos insuficientes');
  S.ui.place = { t }; S.ui.amode = false;
}

const STOP = { k: 'S', ic: '✋', nm: 'Detener', act: () => own().forEach(e => e.kind === 'unit' && cmdStop(e)) };
const AMOVE = { k: 'A', ic: '🎯', nm: 'Atacar-mover', act: () => { S.ui.amode = true; S.ui.place = null; } };
const KEYS = 'QWERTYU';

function trainCmd(bt, t, i) {
  const ud = UNITS[t];
  return { k: KEYS[i], ic: ud.icon, nm: ud.name, cost: ud.cost, age: ud.age || 1, act: () => own().forEach(b => b.kind === 'bld' && b.t === bt && train(b, t)) };
}

function buildCmds(mode) {
  if (mode === 'villager') return BUILD_MENU.map((t, i) => ({ k: KEYS[i], ic: BLDS[t].icon, nm: BLDS[t].name, cost: BLDS[t].cost, age: BLDS[t].age || 1, act: () => startPlace(t) })).concat([STOP]);
  if (mode === 'mil') return [AMOVE, STOP];
  if (!mode || !mode.bld) return [];
  const bt = mode.bld, d = BLDS[bt];
  if (d.upg) return UPG.map((up, i) => ({
    k: KEYS[i], ic: up.ic, nm: up.name, cost: up.cost, age: up.age,
    done: () => S.UPD[0].has(up.id),
    busy: () => !canResearch(0, up) || own().every(b => b.rs),
    act: () => { const b = own().find(o => o.t === 'smithy' && o.done && !o.rs); if (b) startResearch(b, up.id); },
  }));
  const list = d.train.map((t, i) => trainCmd(bt, t, i));
  if (bt === 'tc') list.push({
    k: KEYS[list.length], ic: '🏛️', nm: AGES[S.AGE[0]] ? 'Edad ' + AGES[S.AGE[0]].name : 'Edad máxima',
    get cost() { return AGES[S.AGE[0]] ? AGES[S.AGE[0]].cost : null; },
    done: () => S.AGE[0] >= AGES.length,
    busy: () => S.blds.some(b => b.team === 0 && b.adv),
    act: () => own().forEach(b => b.t === 'tc' && startAdvance(b)),
  });
  return list;
}

function render() {
  $('cmds').innerHTML = cmds.map((c, i) => {
    const cost = c.cost ? costStr(c.cost) : '';
    const lock = c.age > 1 ? ` · 🏛️${AGES[c.age - 1].name}` : '';
    return `<button data-i="${i}" title="${c.nm}"><span class="k">${c.k}</span><span class="ic">${c.ic}</span><span>${c.nm}</span><span class="cost">${cost}${lock}</span></button>`;
  }).join('');
}

export function refreshCommands(force) {
  const o = own(); let key = '', mode = null;
  if (o.some(e => e.kind === 'unit' && e.t === 'villager')) { key = 'villager'; mode = 'villager'; }
  else if (o.some(e => e.kind === 'unit')) { key = 'mil'; mode = 'mil'; }
  else if (o.length && o[0].kind === 'bld' && o[0].done && (BLDS[o[0].t].train || BLDS[o[0].t].upg)) { key = 'b' + o[0].t; mode = { bld: o[0].t }; }
  key += ':' + S.AGE[0];
  if (key !== modeKey || force) { modeKey = key; cmds = buildCmds(mode); render(); }
  [...$('cmds').children].forEach((el, i) => {
    const c = cmds[i];
    const locked = c.age > S.AGE[0], poor = c.cost && !canPay(0, c.cost), done = c.done && c.done(), busy = c.busy && c.busy();
    el.classList.toggle('off', !!(locked || poor || done || busy));
    el.classList.toggle('done', !!done);
  });
}

export function initCommandPanel() {
  $('cmds').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b && S.g.state === 'play') { emit('sfx', 'click'); cmds[+b.dataset.i].act(); }
  });
  on('selection', () => refreshCommands(true));
  on('game:start', () => refreshCommands(true));
}
