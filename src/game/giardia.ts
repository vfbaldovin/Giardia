/**
 * GIARDIA — The Game
 *
 * Snake, dar esti un trofozoit de Giardia intr-un intestin. Diferentele fata
 * de un snake clasic:
 *  - miscarea logica ramane pe grila (deterministica, usor de testat), dar
 *    randarea interpoleaza intre tick-uri => corpul curge, nu sare;
 *  - corpul e desenat ca un lant de blob-uri cu raza descrescatoare, plus
 *    flageli care oscileaza — arata organic, nu ca un sir de patrate;
 *  - pastilele de metronidazol apar pe harta si te omoara.
 */

type Vec = { x: number; y: number };
type FoodKind = 'nutrient' | 'bile';
type Phase = 'idle' | 'playing' | 'paused' | 'dead';

const COLS = 21;
const ROWS = 21;

/** Durata unui tick la start si la viteza maxima (ms). */
const TICK_START = 165;
const TICK_MIN = 72;
/** La cate mancaruri se atinge viteza maxima. */
const RAMP = 40;

const PILL_EVERY = 5; // la cate nutrienti apare o pastila
const PILL_LIFE = 9000; // ms cat sta pe harta
const BILE_CHANCE = 0.14; // sansa ca mancarea sa fie bila (bonus)

const C = {
  void: '#07080A',
  void2: '#0D1013',
  bile: '#1B2A1E',
  moss: '#3F5A3A',
  slime: '#8FBF5A',
  viral: '#6B4E8F',
  spore: '#B69FBE',
  bone: '#E8E4DC',
  blood: '#8F3A3A',
};

const KEY_DIR: Record<string, Vec> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const STORAGE_KEY = 'giardia.highscore';

/* ------------------------------------------------------------------ *
 * Sunet: cateva blip-uri sintetizate. Fara fisiere, fara request-uri.
 * AudioContext se creeaza abia la primul input (politica de autoplay).
 * ------------------------------------------------------------------ */
class Blips {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  play(freq: number, dur = 0.08, type: OscillatorType = 'square', gain = 0.05) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  eat() { this.play(520, 0.07); this.play(780, 0.05); }
  bonus() { this.play(660, 0.1, 'triangle', 0.06); this.play(990, 0.12, 'triangle', 0.05); }
  die() { this.play(150, 0.35, 'sawtooth', 0.07); }
  turn() { this.play(300, 0.02, 'square', 0.015); }
}

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number;
};

export type GameHandle = { destroy(): void };

export function startGiardia(canvas: HTMLCanvasElement, ui: {
  score: HTMLElement;
  high: HTMLElement;
  overlay: HTMLElement;
  overlayTitle: HTMLElement;
  overlayText: HTMLElement;
  overlayBtn: HTMLElement;
  muteBtn: HTMLButtonElement;
}): GameHandle {
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const sfx = new Blips();

  /* ---------------- stare ---------------- */
  let phase: Phase = 'idle';
  let snake: Vec[] = [];
  let prev: Vec[] = []; // pozitiile de la tick-ul anterior, pentru interpolare
  let dir: Vec = { x: 1, y: 0 };
  /** Coada de directii: apasarile rapide nu se mai pierd intre tick-uri. */
  let queue: Vec[] = [];
  let food: Vec & { kind: FoodKind } = { x: 0, y: 0, kind: 'nutrient' };
  let pills: (Vec & { born: number })[] = [];
  let particles: Particle[] = [];
  let score = 0;
  let eaten = 0;
  let high = 0;
  let shake = 0;
  let slowUntil = 0;
  let tickAcc = 0;
  let lastFrame = 0;
  let raf = 0;
  let flagellaPhase = 0;

  try {
    high = Number(localStorage.getItem(STORAGE_KEY) ?? 0) || 0;
  } catch {
    high = 0; // localStorage blocat (mod privat) — jocul merge, doar nu retine
  }
  ui.high.textContent = String(high);

  /* ---------------- geometrie canvas ---------------- */
  let cell = 0;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.floor(Math.min(rect.width, rect.height));
    cell = size / COLS;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ---------------- utilitare ---------------- */
  const occupied = (x: number, y: number) =>
    snake.some((s) => s.x === x && s.y === y) ||
    pills.some((p) => p.x === x && p.y === y);

  function placeFood() {
    let x: number, y: number, guard = 0;
    do {
      x = (Math.random() * COLS) | 0;
      y = (Math.random() * ROWS) | 0;
    } while (occupied(x, y) && ++guard < 500);
    food = { x, y, kind: Math.random() < BILE_CHANCE ? 'bile' : 'nutrient' };
  }

  function placePill() {
    let x: number, y: number, guard = 0;
    do {
      x = (Math.random() * COLS) | 0;
      y = (Math.random() * ROWS) | 0;
    } while (
      (occupied(x, y) || (x === food.x && y === food.y) || nearHead(x, y, 4)) &&
      ++guard < 500
    );
    if (guard < 500) pills.push({ x, y, born: performance.now() });
  }

  /** Nu punem pastile in fata capului — ar fi moarte fara reactie. */
  function nearHead(x: number, y: number, r: number) {
    const h = snake[0];
    return h && Math.abs(h.x - x) < r && Math.abs(h.y - y) < r;
  }

  function burst(cx: number, cy: number, color: string, n = 14, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.5 + Math.random() * 2.5) * power;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: 400 + Math.random() * 450,
        color, size: 1.5 + Math.random() * 3,
      });
    }
  }

  function reset() {
    const midY = ROWS >> 1;
    snake = [
      { x: 5, y: midY },
      { x: 4, y: midY },
      { x: 3, y: midY },
    ];
    prev = snake.map((s) => ({ ...s }));
    dir = { x: 1, y: 0 };
    queue = [];
    pills = [];
    particles = [];
    score = 0;
    eaten = 0;
    shake = 0;
    slowUntil = 0;
    tickAcc = 0;
    placeFood();
    ui.score.textContent = '0';
  }

  function tickDuration() {
    const t = Math.min(eaten / RAMP, 1);
    const base = TICK_START + (TICK_MIN - TICK_START) * t;
    return performance.now() < slowUntil ? base * 1.7 : base;
  }

  function setOverlay(title: string, text: string, btn: string) {
    ui.overlayTitle.textContent = title;
    ui.overlayText.textContent = text;
    ui.overlayBtn.textContent = btn;
    ui.overlay.removeAttribute('hidden');
  }

  function hideOverlay() {
    ui.overlay.setAttribute('hidden', '');
  }

  /* ---------------- logica ---------------- */
  function step() {
    prev = snake.map((s) => ({ ...s }));

    // Preia urmatoarea directie valida din coada (fara intoarcere la 180°).
    while (queue.length) {
      const d = queue.shift()!;
      if (d.x === -dir.x && d.y === -dir.y) continue; // ar fi sinucidere
      if (d.x === dir.x && d.y === dir.y) continue; // aceeasi directie
      dir = d;
      sfx.turn();
      break;
    }

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Peretele intestinului
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) {
      return die('Ai intrat în peretele intestinal.');
    }
    // Propriul corp — coada se elibereaza in acelasi tick, deci o ignoram
    if (snake.some((s, i) => i < snake.length - 1 && s.x === head.x && s.y === head.y)) {
      return die('Te-ai mâncat pe tine. Clasic.');
    }
    // Pastila
    const pill = pills.find((p) => p.x === head.x && p.y === head.y);
    if (pill) {
      burst((pill.x + 0.5) * cell, (pill.y + 0.5) * cell, C.bone, 26, 1.6);
      return die('Metronidazol. Tratamentul a funcționat.');
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      const isBile = food.kind === 'bile';
      score += isBile ? 50 : 10;
      eaten++;
      ui.score.textContent = String(score);
      burst(
        (food.x + 0.5) * cell,
        (food.y + 0.5) * cell,
        isBile ? C.viral : C.slime,
        isBile ? 24 : 12,
        isBile ? 1.4 : 1,
      );
      if (isBile) {
        slowUntil = performance.now() + 4000;
        sfx.bonus();
      } else {
        snake.push({ ...snake[snake.length - 1] }); // creste doar la nutrienti
        sfx.eat();
      }
      shake = Math.min(shake + (isBile ? 7 : 4), 14);
      placeFood();
      if (eaten % PILL_EVERY === 0) placePill();
    } else {
      snake.pop();
    }

    // Pastilele expira
    const now = performance.now();
    pills = pills.filter((p) => now - p.born < PILL_LIFE);
  }

  function die(reason: string) {
    phase = 'dead';
    sfx.die();
    shake = 22;
    const h = snake[0];
    burst((h.x + 0.5) * cell, (h.y + 0.5) * cell, C.blood, 34, 2);
    if (score > high) {
      high = score;
      ui.high.textContent = String(high);
      try {
        localStorage.setItem(STORAGE_KEY, String(high));
      } catch {
        /* fara persistenta — nu e fatal */
      }
    }
    setOverlay('Ai murit', `${reason} Scor: ${score}.`, 'Încă o dată');
  }

  /* ---------------- desen ---------------- */
  function drawArena(w: number) {
    ctx.fillStyle = C.void;
    ctx.fillRect(0, 0, w, w);

    // Grila foarte discreta
    ctx.strokeStyle = 'rgba(143,191,90,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < COLS; i++) {
      ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, w);
      ctx.moveTo(0, i * cell); ctx.lineTo(w, i * cell);
    }
    ctx.stroke();

    // Vilozitati pe margini — dau senzatia de tesut, nu de cutie
    ctx.fillStyle = C.bile;
    const n = 34;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const len = 6 + Math.sin(i * 1.7 + flagellaPhase * 0.5) * 3;
      ctx.fillRect(t * w - 1.5, 0, 3, len);
      ctx.fillRect(t * w - 1.5, w - len, 3, len);
      ctx.fillRect(0, t * w - 1.5, len, 3);
      ctx.fillRect(w - len, t * w - 1.5, len, 3);
    }
  }

  function drawFood() {
    const cx = (food.x + 0.5) * cell;
    const cy = (food.y + 0.5) * cell;
    const pulse = 1 + Math.sin(flagellaPhase * 3) * 0.12;
    const r = cell * (food.kind === 'bile' ? 0.34 : 0.26) * pulse;

    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = food.kind === 'bile' ? C.viral : C.slime;
    ctx.fillStyle = food.kind === 'bile' ? C.viral : C.slime;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    if (food.kind === 'bile') {
      ctx.fillStyle = C.spore;
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPills(now: number) {
    for (const p of pills) {
      const age = now - p.born;
      const left = PILL_LIFE - age;
      // Clipeste in ultimele 2.5s inainte sa dispara
      if (left < 2500 && Math.floor(left / 160) % 2 === 0) continue;

      const x = p.x * cell;
      const y = p.y * cell;
      const pad = cell * 0.16;
      const w = cell - pad * 2;
      const h = w * 0.62;
      const oy = y + (cell - h) / 2;

      ctx.save();
      ctx.translate(x + pad + w / 2, oy + h / 2);
      ctx.rotate(-0.4);
      ctx.fillStyle = C.bone;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.fillStyle = C.blood;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w / 2, h, [h / 2, 0, 0, h / 2]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(7,8,10,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Pozitia interpolata a segmentului i, in pixeli. */
  function segAt(i: number, alpha: number): Vec {
    const cur = snake[i];
    const old = prev[Math.min(i, prev.length - 1)] ?? cur;
    return {
      x: (old.x + (cur.x - old.x) * alpha + 0.5) * cell,
      y: (old.y + (cur.y - old.y) * alpha + 0.5) * cell,
    };
  }

  function drawSnake(alpha: number) {
    const len = snake.length;

    // Corpul: de la coada spre cap, ca desenul capului sa fie deasupra
    for (let i = len - 1; i >= 0; i--) {
      const p = segAt(i, alpha);
      const t = i / Math.max(len - 1, 1);
      const r = cell * (0.46 - t * 0.2); // se subtiaza spre coada
      const g = ctx.createRadialGradient(
        p.x - r * 0.3, p.y - r * 0.35, r * 0.1, p.x, p.y, r,
      );
      g.addColorStop(0, i === 0 ? C.slime : C.moss);
      g.addColorStop(1, i === 0 ? C.moss : C.bile);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flageli — patru fire care ies din coada si oscileaza
    const tail = segAt(len - 1, alpha);
    const beforeTail = segAt(Math.max(len - 2, 0), alpha);
    const ang = Math.atan2(tail.y - beforeTail.y, tail.x - beforeTail.x);
    ctx.strokeStyle = 'rgba(143,191,90,0.55)';
    ctx.lineWidth = Math.max(cell * 0.06, 1);
    ctx.lineCap = 'round';
    for (let f = 0; f < 4; f++) {
      const spread = (f - 1.5) * 0.42;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      for (let s = 1; s <= 6; s++) {
        const d = s * cell * 0.16;
        const wobble = Math.sin(flagellaPhase * 6 + s * 0.9 + f) * cell * 0.09;
        const a = ang + spread;
        ctx.lineTo(
          tail.x + Math.cos(a) * d - Math.sin(a) * wobble,
          tail.y + Math.sin(a) * d + Math.cos(a) * wobble,
        );
      }
      ctx.stroke();
    }

    // Capul: cei doi nuclei = "fata" clasica de Giardia
    const head = segAt(0, alpha);
    const hr = cell * 0.46;
    const perp = { x: -dir.y, y: dir.x };
    for (const side of [-1, 1]) {
      const ex = head.x + perp.x * hr * 0.36 * side + dir.x * hr * 0.12;
      const ey = head.y + perp.y * hr * 0.36 * side + dir.y * hr * 0.12;
      ctx.fillStyle = C.void;
      ctx.beginPath();
      ctx.ellipse(ex, ey, hr * 0.26, hr * 0.3, Math.atan2(dir.y, dir.x), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.spore;
      ctx.beginPath();
      ctx.arc(ex - dir.x * hr * 0.05, ey - dir.y * hr * 0.05, hr * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Discul de sugere
    ctx.strokeStyle = 'rgba(7,8,10,0.45)';
    ctx.lineWidth = Math.max(cell * 0.05, 1);
    ctx.beginPath();
    ctx.arc(head.x + dir.x * hr * 0.28, head.y + dir.y * hr * 0.28, hr * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawParticles(dt: number) {
    particles = particles.filter((p) => {
      p.life += dt;
      if (p.life >= p.max) return false;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });
  }

  /* ---------------- bucla ---------------- */
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(now - lastFrame, 100);
    lastFrame = now;
    flagellaPhase += dt / 1000;

    if (phase === 'playing') {
      tickAcc += dt;
      const td = tickDuration();
      while (tickAcc >= td && phase === 'playing') {
        tickAcc -= td;
        step();
      }
    }

    const w = canvas.width / dpr;
    ctx.save();
    if (shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      shake *= 0.88;
    }

    drawArena(w);
    if (snake.length) {
      drawFood();
      drawPills(now);
      const alpha = phase === 'playing' ? Math.min(tickAcc / tickDuration(), 1) : 1;
      drawSnake(alpha);
    }
    drawParticles(dt);
    ctx.restore();

    // Tenta violeta cat timp bila e activa
    if (now < slowUntil) {
      ctx.fillStyle = 'rgba(107,78,143,0.12)';
      ctx.fillRect(0, 0, w, w);
    }
  }

  /* ---------------- input ---------------- */
  function push(d: Vec) {
    if (phase !== 'playing') return;
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 3) queue.push(d);
  }

  function onKey(e: KeyboardEvent) {
    const d = KEY_DIR[e.key] ?? KEY_DIR[e.key.toLowerCase()];
    if (d) {
      e.preventDefault();
      push(d);
      return;
    }
    if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      if (phase === 'playing') pause();
      else if (phase === 'paused') resume();
      else start();
    }
  }

  let touchStart: { x: number; y: number } | null = null;

  function onTouchStart(e: TouchEvent) {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return; // tap, nu swipe
    push(
      Math.abs(dx) > Math.abs(dy)
        ? { x: Math.sign(dx), y: 0 }
        : { x: 0, y: Math.sign(dy) },
    );
  }

  /* ---------------- control ---------------- */
  function start() {
    reset();
    phase = 'playing';
    lastFrame = performance.now();
    hideOverlay();
  }

  function pause() {
    phase = 'paused';
    setOverlay('Pauză', 'Parazitul așteaptă.', 'Continuă');
  }

  function resume() {
    phase = 'playing';
    lastFrame = performance.now();
    tickAcc = 0;
    hideOverlay();
  }

  ui.overlayBtn.addEventListener('click', () => {
    if (phase === 'paused') resume();
    else start();
  });

  ui.muteBtn.addEventListener('click', () => {
    sfx.muted = !sfx.muted;
    ui.muteBtn.setAttribute('aria-pressed', String(sfx.muted));
    ui.muteBtn.textContent = sfx.muted ? 'Sunet: off' : 'Sunet: on';
  });

  // Pauza automata cand pleci din tab — altfel te intorci la un cadavru.
  function onVisibility() {
    if (document.hidden && phase === 'playing') pause();
  }

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  reset();
  setOverlay(
    'Giardia',
    'Săgeți / WASD sau swipe. Mănâncă tot, ferește-te de pastile.',
    'Start',
  );
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
