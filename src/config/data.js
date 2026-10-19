// Datos de balance: unidades, edificios, recursos, edades, mejoras y dificultad de la IA.

export const UNITS = {
  villager: { name: 'Aldeano', hp: 30, spd: 58, atk: 3, rng: 0.8, cd: 1.2, cost: { food: 50 }, time: 6, icon: 'pick', r: 7 },
  soldier:  { name: 'Soldado', hp: 75, spd: 62, atk: 8, rng: 0.8, cd: 1, cost: { food: 60, gold: 25 }, time: 9, icon: 'sword', r: 8, bm: 1, arm: 1, bonus: { knight: 1.7 } },
  archer:   { name: 'Arquero', hp: 40, spd: 60, atk: 6, rng: 5.5, cd: 1.3, cost: { wood: 45, gold: 30 }, time: 9, icon: 'bow', r: 7, bm: 0.3 },
  knight:   { name: 'Caballero', hp: 110, spd: 88, atk: 11, rng: 0.8, cd: 1.1, cost: { food: 80, gold: 40 }, time: 12, icon: 'knight', r: 9, bm: 0.8, arm: 2, age: 2, bonus: { archer: 1.5, catapult: 2 } },
  catapult: { name: 'Catapulta', hp: 90, spd: 38, atk: 40, rng: 8, cd: 3.5, cost: { wood: 120, gold: 80 }, time: 18, icon: 'catapult', r: 10, bm: 3, um: 0.6, splash: 45, age: 3 },
};

export const BLDS = {
  tc:       { name: 'Centro Urbano', w: 3, h: 3, hp: 800, cost: {}, time: 0, icon: 'castle', pop: 10, train: ['villager'], atk: 5, rng: 6, cd: 1.6, col: '#9a8a6a', sight: 10 },
  house:    { name: 'Casa', w: 2, h: 2, hp: 200, cost: { wood: 30 }, time: 12, icon: 'house', pop: 5, col: '#b8905a' },
  barracks: { name: 'Cuartel', w: 3, h: 3, hp: 500, cost: { wood: 100 }, time: 25, icon: 'swords', train: ['soldier', 'archer'], col: '#8a7a78' },
  farm:     { name: 'Granja', w: 2, h: 2, hp: 100, cost: { wood: 50 }, time: 10, icon: 'wheat', col: '#c9a64a' },
  tower:    { name: 'Torre', w: 2, h: 2, hp: 400, cost: { wood: 60, gold: 40 }, time: 20, icon: 'tower', atk: 9, rng: 7, cd: 1.4, col: '#7c8088', age: 2, sight: 9 },
  stable:   { name: 'Establo', w: 3, h: 3, hp: 500, cost: { wood: 120 }, time: 25, icon: 'horseshoe', train: ['knight'], age: 2, col: '#9a7b55' },
  smithy:   { name: 'Herrería', w: 2, h: 2, hp: 350, cost: { wood: 100, gold: 30 }, time: 22, icon: 'anvil', upg: true, age: 2, col: '#6b6b73' },
  siege:    { name: 'Taller de asedio', w: 3, h: 3, hp: 500, cost: { wood: 200, gold: 50 }, time: 30, icon: 'gear', train: ['catapult'], age: 3, col: '#8b6a4a' },
};

// orden en el menú del aldeano (teclas Q W E R T Y U)
export const BUILD_MENU = ['house', 'barracks', 'farm', 'tower', 'stable', 'smithy', 'siege'];

export const RES = {
  tree:  { name: 'Árbol', type: 'wood', amount: 120, rate: 0.8, icon: 'tree' },
  berry: { name: 'Arbusto de bayas', type: 'food', amount: 100, rate: 0.7, icon: 'berry' },
  gold:  { name: 'Mina de oro', type: 'gold', amount: 600, rate: 0.9, icon: 'coin' },
};

// AGES[n] = coste para *llegar* a la edad n+1
export const AGES = [
  { name: 'Aldea' },
  { name: 'Castillo', cost: { food: 300, gold: 150 }, time: 25 },
  { name: 'Imperial', cost: { food: 600, gold: 400 }, time: 40 },
];

export const UPG = [
  { id: 'atk1', name: 'Armas I', ic: 'sword', cost: { food: 100, gold: 60 }, time: 20, age: 2, atk: 2 },
  { id: 'arm1', name: 'Armadura I', ic: 'shield', cost: { food: 100, gold: 60 }, time: 20, age: 2, arm: 1 },
  { id: 'atk2', name: 'Armas II', ic: 'swords', cost: { food: 220, gold: 140 }, time: 30, age: 3, req: 'atk1', atk: 3 },
  { id: 'arm2', name: 'Armadura II', ic: 'shield2', cost: { food: 220, gold: 140 }, time: 30, age: 3, req: 'arm1', arm: 2 },
];

export const AI_CFG = {
  easy:   { iv: 1.6, vil: 9,  maxRax: 1, first: 260, size: 6,  grow: 2, towers: 0, eco: 0.8, siege: false },
  normal: { iv: 1.0, vil: 14, maxRax: 2, first: 190, size: 8,  grow: 3, towers: 1, eco: 1,   siege: true },
  hard:   { iv: 0.6, vil: 20, maxRax: 3, first: 140, size: 10, grow: 4, towers: 2, eco: 1.25, siege: true },
};
