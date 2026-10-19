// Bus de eventos mínimo: la lógica del juego emite, la UI y el audio escuchan.
//   toast(msg) · sfx(name, x?, y?) · selection() · game:start() · game:over(win, time)
const handlers = {};
export const on = (evt, fn) => (handlers[evt] || (handlers[evt] = [])).push(fn);
export const emit = (evt, ...args) => { const hs = handlers[evt]; if (hs) for (const h of hs) h(...args); };
