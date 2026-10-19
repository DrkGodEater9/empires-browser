// Barra superior, panel de información, toasts y pantalla final.
import { RIC } from '../config/constants.js';
import { UNITS, BLDS, RES, AGES, UPG } from '../config/data.js';
import { S } from '../core/state.js';
import { on } from '../core/events.js';
import { clock } from '../core/util.js';
import { gatherersOn } from '../systems/orders.js';

const $ = id => document.getElementById(id);
let toastT = 0;

export function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

export function initHud() {
  on('toast', toast);
  on('game:start', () => { $('menu').classList.add('hidden'); $('end').classList.add('hidden'); });
  on('game:over', (win, t) => {
    $('endTitle').textContent = win ? '🏆 ¡Victoria!' : '💀 Derrota';
    $('endSub').textContent = (win ? 'Destruiste el imperio enemigo' : 'Tu imperio ha caído') + ' en ' + clock(t) + '.';
    $('end').classList.remove('hidden');
  });
}

export function updateHud() {
  const r = S.R[0];
  $('rFood').textContent = '🍖 ' + Math.floor(r.food);
  $('rWood').textContent = '🪵 ' + Math.floor(r.wood);
  $('rGold').textContent = '🪙 ' + Math.floor(r.gold);
  $('rPop').textContent = `👥 ${S.POP[0]}/${S.CAP[0]}`;
  $('rPop').style.color = S.POP[0] >= S.CAP[0] ? '#fca5a5' : '';
  $('rAge').textContent = '🏛️ ' + AGES[S.AGE[0] - 1].name;
  $('clock').textContent = clock(S.g.t);
}

const STATE_ES = { idle: 'Libre', move: 'Moviéndose', gather: 'Recolectando', 'return': 'Entregando', build: 'Construyendo', attack: 'Atacando' };

export function refreshInfo() {
  const info = $('info'), sel = S.sel;
  if (!sel.length) { info.innerHTML = '<div class="tip">Selecciona unidades o edificios.<br>Click derecho para dar órdenes · arrastra para seleccionar varios.</div>'; return; }

  if (sel.length > 1) {
    const c = {};
    sel.forEach(e => { const k = e.kind === 'unit' ? UNITS[e.t].icon + ' ' + UNITS[e.t].name : BLDS[e.t].icon + ' ' + BLDS[e.t].name; c[k] = (c[k] || 0) + 1; });
    info.innerHTML = `<div class="nm">${sel.length} seleccionados</div>` + Object.keys(c).map(k => `${k} ×${c[k]}`).join('<br>');
    return;
  }

  const e = sel[0]; let nm, ic, extra = '';
  if (e.kind === 'unit') {
    const d = UNITS[e.t]; nm = d.name; ic = d.icon;
    extra = `Ataque ${d.atk + (e.t !== 'villager' ? S.UP[e.team].atk : 0)} · Alcance ${d.rng > 2 ? d.rng : 'melé'} · Armadura ${(d.arm || 0) + S.UP[e.team].arm}`;
    if (e.t === 'villager') extra += e.carryN ? `<br>Lleva ${e.carryN} ${RIC[e.carryT]}` : `<br>${STATE_ES[e.state] || ''}`;
  } else if (e.kind === 'bld') {
    const d = BLDS[e.t]; nm = d.name; ic = d.icon;
    if (!e.done) extra = `Construyendo ${Math.floor(e.prog * 100)}%`;
    else if (e.t === 'farm') extra = `Quedan ${e.amount} 🍖 · ${gatherersOn(e)}/2 aldeanos`;
    else if (d.pop) extra = `Población +${d.pop}`;
    if (e.adv) extra += `<br>🏛️ Avanzando a ${AGES[e.adv.to - 1].name}… ${Math.floor(e.adv.p / e.adv.time * 100)}%`;
    if (e.rs) { const up = UPG.find(u => u.id === e.rs.id); extra += `<br>${up.ic} Investigando ${up.name}… ${Math.floor(e.rs.p / up.time * 100)}%`; }
    if (e.t === 'smithy' && e.team === 0) extra += `<br>Mejoras: ${[...S.UPD[0]].map(id => UPG.find(u => u.id === id).ic).join(' ') || 'ninguna'}`;
    if (e.queue.length) extra += '<div class="q">' + e.queue.map((q, i) => `<span>${UNITS[q].icon}${i === 0 ? `<u style="width:${(e.qp / UNITS[q].time * 100) | 0}%"></u>` : ''}</span>`).join('') + '</div>';
  } else { const d = RES[e.t]; nm = d.name; ic = d.icon; extra = `Quedan ${e.amount} ${RIC[d.type]}`; }

  const hpf = e.maxhp ? e.hp / e.maxhp : 1;
  info.innerHTML = `<div class="big">${ic}</div><div class="nm" style="color:${e.team === 1 ? '#fca5a5' : 'inherit'}">${nm}${e.team === 1 ? ' (enemigo)' : ''}</div>` +
    (e.maxhp ? `<div class="hp"><i style="width:${hpf * 100}%"></i></div>${Math.ceil(e.hp)}/${e.maxhp} ❤️<br>` : '') + extra;
}
