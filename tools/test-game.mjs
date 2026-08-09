/**
 * Test pentru logica jocului, fara browser.
 *
 * Stub-uim exact API-ul de DOM/canvas pe care il foloseste modulul si
 * controlam manual ceasul + requestAnimationFrame, ca tick-urile sa fie
 * deterministe. Pozitia capului se deduce din apelurile de desen: capul e
 * singurul cerc de corp cu raza cell*0.46.
 *
 * Ruleaza: node tools/test-game.mjs
 */

/* ---------------- ceas controlabil ---------------- */
let clock = 0;
const rafQueue = [];

/* ---------------- stub canvas 2D ---------------- */
const arcs = []; // { x, y, r } — resetat de test intre cadre

function makeCtx() {
  const noop = () => {};
  return {
    setTransform: noop, save: noop, restore: noop, translate: noop, rotate: noop,
    fillRect: noop, beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop,
    fill: noop, ellipse: noop, roundRect: noop, closePath: noop,
    arc: (x, y, r) => arcs.push({ x, y, r }),
    createRadialGradient: () => ({ addColorStop: noop }),
    fillStyle: '', strokeStyle: '', lineWidth: 0, lineCap: '',
    globalAlpha: 1, shadowBlur: 0, shadowColor: '',
  };
}

const SIZE = 420; // => cell = 420/21 = 20

const canvas = {
  width: SIZE, height: SIZE,
  getContext: () => makeCtx(),
  getBoundingClientRect: () => ({ width: SIZE, height: SIZE }),
  addEventListener: () => {},
  removeEventListener: () => {},
};

/* ---------------- stub UI ---------------- */
const el = (initial = '') => ({
  textContent: initial,
  _attrs: {},
  setAttribute(k, v) { this._attrs[k] = v; },
  removeAttribute(k) { delete this._attrs[k]; },
  hasAttribute(k) { return k in this._attrs; },
  addEventListener() {},
});

const ui = {
  score: el('0'), high: el('0'), overlay: el(), overlayTitle: el(),
  overlayText: el(), overlayBtn: el(), muteBtn: el(),
};

/* ---------------- globale ---------------- */
const keyHandlers = [];

globalThis.window = {
  addEventListener: (t, fn) => { if (t === 'keydown') keyHandlers.push(fn); },
  removeEventListener: () => {},
  devicePixelRatio: 1,
  AudioContext: undefined, // fara sunet in test
};
globalThis.document = {
  hidden: false,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.performance = { now: () => clock };
globalThis.requestAnimationFrame = (fn) => { rafQueue.push(fn); return rafQueue.length; };
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
};

/* ---------------- random determinist ----------------
 * Golim o coada de valori impinsa de test; cand se termina, cadem pe o
 * valoare fixa care pune mancarea in coltul (19,19), departe de actiune. */
let randQueue = [];
Math.random = () => (randQueue.length ? randQueue.shift() : 0.93);

/* ---------------- helper: avanseaza n cadre ---------------- */
function advance(ms, stepMs = 16) {
  for (let t = 0; t < ms; t += stepMs) {
    clock += stepMs;
    const q = rafQueue.splice(0, rafQueue.length);
    for (const fn of q) fn(clock);
  }
}

function press(key) {
  for (const fn of keyHandlers) fn({ key, preventDefault() {} });
}

/** Capul = cercul de corp cu raza cea mai mare (cell*0.46 = 9.2). */
function head() {
  const cell = SIZE / 21;
  const target = cell * 0.46;
  let best = null;
  for (const a of arcs) {
    if (Math.abs(a.r - target) < 0.01) best = a; // ultimul din cadru
  }
  return best ? { x: Math.round(best.x / cell - 0.5), y: Math.round(best.y / cell - 0.5) } : null;
}

/* ================= testele ================= */
const { startGiardia } = await import('../src/game/giardia.ts');

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
};

/* Texte de test: neutre, ca asertiunile sa nu depinda de limba livrata. */
const TXT = {
  start: 'START', intro: 'INTRO', paused: 'PAUSED', pausedBody: 'PAUSED_BODY',
  resume: 'RESUME', dead: 'DEAD', again: 'AGAIN',
  wall: 'WALL_HIT', self: 'SELF_HIT', pill: 'PILL_HIT',
  scoreIs: (n) => `SCORE_${n}`,
  soundOn: 'SOUND_ON', soundOff: 'SOUND_OFF',
};

const game = startGiardia(canvas, ui, TXT);

console.log('\nStare initiala');
check('overlay-ul de start e vizibil', !ui.overlay.hasAttribute('hidden'));
check('titlul de start e "Giardia"', ui.overlayTitle.textContent === 'Giardia');
check('textul introductiv vine din traduceri', ui.overlayText.textContent === TXT.intro);
check('scorul porneste de la 0', ui.score.textContent === '0');

console.log('\nMiscare');
ui.overlayBtn.textContent = 'Start';
game_start();
function game_start() {
  // butonul are handler intern; il apelam prin acelasi drum ca UI-ul
  // (addEventListener e stub, deci simulam pornirea prin tasta Space)
  press(' ');
}
advance(50);
arcs.length = 0;
advance(20);
const h0 = head();
check('capul e desenat', h0 !== null, JSON.stringify(h0));

arcs.length = 0;
advance(200); // > un tick (165ms)
const h1 = head();
check(
  'se misca spre dreapta cu o casuta',
  h0 && h1 && h1.x === h0.x + 1 && h1.y === h0.y,
  `${JSON.stringify(h0)} -> ${JSON.stringify(h1)}`,
);

console.log('\nDirectie');
press('ArrowDown');
arcs.length = 0;
advance(200);
const h2 = head();
check(
  'ArrowDown coboara',
  h1 && h2 && h2.y === h1.y + 1 && h2.x === h1.x,
  `${JSON.stringify(h1)} -> ${JSON.stringify(h2)}`,
);

press('ArrowUp'); // intoarcere la 180° — trebuie ignorata
arcs.length = 0;
advance(200);
const h3 = head();
check(
  'intoarcerea la 180° e refuzata (nu se sinucide)',
  h2 && h3 && h3.y === h2.y + 1,
  `${JSON.stringify(h2)} -> ${JSON.stringify(h3)}`,
);

console.log('\nColiziune cu peretele');
advance(165 * 30); // coboara pana iese din grila
check(
  'moare in perete',
  ui.overlayTitle.textContent === TXT.dead,
  `titlu="${ui.overlayTitle.textContent}"`,
);
check(
  'motivul e cel injectat pentru perete',
  ui.overlayText.textContent.startsWith(TXT.wall),
  `text="${ui.overlayText.textContent}"`,
);
check(
  'scorul apare prin functia din traduceri',
  ui.overlayText.textContent.includes('SCORE_0'),
  `text="${ui.overlayText.textContent}"`,
);
check(
  'scorul 0 NU suprascrie recordul',
  localStorage.getItem('giardia.highscore') === null,
);

console.log('\nRestart si mancare');
// Fortam pozitia mancarii: nutrient exact in fata capului, la (8,10).
randQueue = [8 / 21, 10 / 21, 0.9];
press(' '); // restart din starea "mort"
advance(50);
check('overlay-ul dispare la restart', ui.overlay.hasAttribute('hidden'));
check('scorul revine la 0', ui.score.textContent === '0');

advance(165 * 3 + 40); // capul: 5 -> 6 -> 7 -> 8, mananca la al treilea tick
check(
  'nutrientul da +10 puncte',
  ui.score.textContent === '10',
  `scor="${ui.score.textContent}"`,
);

console.log('\nPersistenta recordului');
advance(165 * 40); // lasa-l sa moara in peretele din dreapta
check('a murit din nou', ui.overlayTitle.textContent === TXT.dead);
check(
  'recordul 10 s-a salvat',
  localStorage.getItem('giardia.highscore') === '10',
  `salvat="${localStorage.getItem('giardia.highscore')}"`,
);
check('UI-ul arata recordul', ui.high.textContent === '10', `high="${ui.high.textContent}"`);

game.destroy();

console.log(`\n${pass} trecute, ${fail} picate\n`);
process.exit(fail ? 1 : 0);
