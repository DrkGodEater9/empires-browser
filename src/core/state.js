// Estado compartido del juego. Un único objeto mutable `S` para que cualquier módulo
// pueda leer/escribir sin problemas de bindings de ES modules.
export const S = {
  // mundo
  units: [], blds: [], ress: [], projs: [], fx: [], sel: [],
  occ: [], terrain: new Uint8Array(0),
  nextId: 1,

  // por equipo (0 = jugador, 1 = enemigo)
  R: [{ food: 0, wood: 0, gold: 0 }, { food: 0, wood: 0, gold: 0 }],
  POP: [0, 0], CAP: [0, 0],
  AGE: [1, 1],
  UPD: [new Set(), new Set()],          // mejoras investigadas
  UP: [{ atk: 0, arm: 0 }, { atk: 0, arm: 0 }],

  // niebla
  explored: new Uint8Array(0), visible: new Uint8Array(0),
  lastAlert: 0,

  // partida
  g: { state: 'menu', t: 0, diff: 'normal', paused: false, test: false, over: false, aiT: [0, 0], chk: 0, hud: 0, dirty: false, cfg: [], ai: [] },

  // cámara y vista
  cam: { x: 0, y: 0, z: 1 },
  view: { w: 0, h: 0, dpr: 1 },

  // interacción
  ui: { place: null, amode: false, drag: null, mouse: { x: 0, y: 0, in: true, mini: false }, keys: {}, lastClick: { t: 0, type: null } },
};

export function resetWorld() {
  S.units = []; S.blds = []; S.ress = []; S.projs = []; S.fx = []; S.sel = [];
  S.nextId = 1; S.lastAlert = 0;
  S.R = [{ food: 200, wood: 150, gold: 50 }, { food: 200, wood: 150, gold: 50 }];
  S.POP = [0, 0]; S.CAP = [0, 0]; S.AGE = [1, 1];
  S.UPD = [new Set(), new Set()];
  S.UP = [{ atk: 0, arm: 0 }, { atk: 0, arm: 0 }];
  S.ui.place = null; S.ui.amode = false; S.ui.drag = null;
}
