// Barra superior, panel de información, toasts y pantalla final.
import { RES_ICON } from '../config/constants.js';
import { UNITS, BLDS, RES, AGES, UPG } from '../config/data.js';
import { S } from '../core/state.js';
import { on } from '../core/events.js';
import { clock } from '../core/util.js';
import { gatherersOn } from '../systems/orders.js';
import { svg, hydrateIcons } from '../assets/icons.js';

const $ = id => document.getElementById(id);
let toastT = 0;

export const costHtml = cost => Object.keys(cost).map(k => `<span class="c">${svg(RES_ICON[k], 12)}${cost[k]}</span>`).join('');

export function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

export function initHud() {
  hydrateIcons();
  on('toast', toast);
  on('game:start', () => { $('menu').classList.add('hidden'); $('end').classList.add('hidden'); });
  on('game:over', (win, t) => {
    $('endTitle').textContent = win ? 'Victoria' : 'Derrota';
    $('endSub').textContent = (win ? 'Destruiste el imperio enemigo' : 'Tu imperio ha caído') + ' en ' + clock(t) + '.';
    $('end').classList.remove('hidden');
  });
}

const setText = (id, v) => { $(id).querySelector('b').textContent = v; };

export function updateHud() {
  const r = S.R[0];
  setText('rFood', Math.floor(r.food)); setText('rWood', Math.floor(r.wood)); setText('rGold', Math.floor(r.gold));
  setText('rPop', `${S.POP[0]}/${S.CAP[0]}`); $('rPop').classList.toggle('warn', S.POP[0] >= S.CAP[0]);
  setText('rAge', AGES[S.AGE[0] - 1].name);
  $('clock').textContent = clock(S.g.t);
}

const STATE_ES = { idle: 'Libre', move: 'Moviéndose', gather: 'Recolectando', 'return': 'Entregando', build: 'Construyendo', attack: 'Atacando' };
const row = (label, v) => `<div class="row"><span>${label}</span><b>${v}</b></div>`;

export function refreshInfo() {
  const info = $('info'), sel = S.sel;
  if (!sel.length) { info.innerHTML = '<div class="tip">Selecciona unidades o edificios.<br>Click derecho para dar órdenes · arrastra para seleccionar varios.</div>'; return; }

  if (sel.length > 1) {
    const c = {};
    sel.forEach(e => { const d = e.kind === 'unit' ? UNITS[e.t] : BLDS[e.t]; c[d.name] = c[d.name] || { n: 0, ic: d.icon }; c[d.name].n++; });
    info.innerHTML = `<div class="nm">${sel.length} seleccionados</div><div class="group">` +
      Object.keys(c).map(k => `<span class="chip">${svg(c[k].ic, 18)}${k} <b>×${c[k].n}</b></span>`).join('') + '</div>';
    return;
  }

  const e = sel[0]; let nm, ic, extra = '';
  if (e.kind === 'unit') {
    const d = UNITS[e.t]; nm = d.name; ic = d.icon;
    extra = row('Ataque', d.atk + (e.t !== 'villager' ? S.UP[e.team].atk : 0)) + row('Alcance', d.rng > 2 ? d.rng : 'melé') + row('Armadura', (d.arm || 0) + S.UP[e.team].arm);
    if (e.t === 'villager') extra += row('Estado', e.carryN ? `lleva ${e.carryN} ${svg(RES_ICON[e.carryT], 12)}` : STATE_ES[e.state] || '');
  } else if (e.kind === 'bld') {
    const d = BLDS[e.t]; nm = d.name; ic = d.icon;
    if (!e.done) extra = row('Construcción', Math.floor(e.prog * 100) + '%');
    else if (e.t === 'farm') extra = row('Comida restante', e.amount) + row('Aldeanos', gatherersOn(e) + '/2');
    else if (d.pop) extra = row('Población', '+' + d.pop);
    if (e.adv) extra += row('Avanzando a ' + AGES[e.adv.to - 1].name, Math.floor(e.adv.p / e.adv.time * 100) + '%');
    if (e.rs) { const up = UPG.find(u => u.id === e.rs.id); extra += row('Investigando ' + up.name, Math.floor(e.rs.p / up.time * 100) + '%'); }
    if (e.t === 'smithy' && e.team === 0) extra += row('Mejoras', [...S.UPD[0]].map(id => svg(UPG.find(u => u.id === id).ic, 16)).join('') || 'ninguna');
    if (e.queue.length) extra += '<div class="q">' + e.queue.map((q, i) => `<span>${svg(UNITS[q].icon, 16)}${i === 0 ? `<u style="width:${(e.qp / UNITS[q].time * 100) | 0}%"></u>` : ''}</span>`).join('') + '</div>';
  } else { const d = RES[e.t]; nm = d.name; ic = d.icon; extra = row('Restante', `${e.amount} ${svg(RES_ICON[d.type], 12)}`); }

  const hpf = e.maxhp ? e.hp / e.maxhp : 1;
  info.innerHTML = `<div class="head"><span class="big">${svg(ic, 38)}</span><div><div class="nm${e.team === 1 ? ' foe' : ''}">${nm}${e.team === 1 ? ' (enemigo)' : ''}</div>` +
    (e.maxhp ? `<div class="hp"><i style="width:${hpf * 100}%"></i></div><small>${Math.ceil(e.hp)} / ${e.maxhp} PV</small>` : '') + `</div></div>${extra}`;
}
