/**
 * Genereaza /public/og.jpg (1200x630) — imaginea de share.
 *
 * Wordmark-ul e desenat cu o mica fonta pixel proprie, nu cu un font de
 * sistem: asa iese identic pe orice masina si se potriveste cu craniul.
 * Ruleaza: node tools/make-og.mjs
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const W = 1200;
const H = 630;

/* --- fonta pixel 5x7, doar glifele de care avem nevoie --- */
const GLYPHS = {
  G: ['.###.', '#...#', '#....', '#.##.', '#...#', '#...#', '.###.'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
};

const SKULL = [
  '................', '....########....', '..############..', '.##############.',
  '################', '################', '##....####....##', '##....####....##',
  '###...####...###', '####..####..####', '#######..#######', '######....######',
  '################', '.##############.', '..############..', '..#.##.##.##.#..',
];

/** Transforma o grila in <rect>-uri, unind pixelii vecini pe orizontala. */
function gridRects(grid, ox, oy, px, fill, opacity = 1) {
  const out = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === '#') {
        const s = x;
        while (x < row.length && row[x] === '#') x++;
        out.push(
          `<rect x="${ox + s * px}" y="${oy + y * px}" width="${(x - s) * px}" ` +
          `height="${px}" fill="${fill}" opacity="${opacity}"/>`,
        );
      } else x++;
    }
  });
  return out.join('');
}

function word(text, ox, oy, px, fill, opacity = 1) {
  let out = '';
  let cx = ox;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (!g) { cx += 6 * px; continue; }
    out += gridRects(g, cx, oy, px, fill, opacity);
    cx += 6 * px; // 5 latime + 1 spatiu
  }
  return out;
}

const NAME = 'GIARDIA';
const PX = 22;
const wordW = NAME.length * 6 * PX - PX;
const wordX = (W - wordW) / 2;
const wordY = 250;

const skullPx = 7;
const skullW = 16 * skullPx;

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#07080A" stop-opacity="0.62"/>
      <stop offset="55%"  stop-color="#07080A" stop-opacity="0.86"/>
      <stop offset="100%" stop-color="#07080A" stop-opacity="0.97"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#fade)"/>

  <!-- craniul, deasupra wordmark-ului -->
  ${gridRects(SKULL, (W - skullW) / 2, 120, skullPx, '#E8E4DC')}

  <!-- aberatie cromatica: doua copii decalate, ca in hero -->
  ${word(NAME, wordX + 5, wordY, PX, '#6B4E8F', 0.75)}
  ${word(NAME, wordX - 5, wordY, PX, '#8FBF5A', 0.65)}
  ${word(NAME, wordX, wordY, PX, '#E8E4DC')}

  <!-- linie + eticheta de gen, tot din blocuri (fara font de sistem) -->
  <rect x="${W / 2 - 210}" y="470" width="420" height="3" fill="#8FBF5A"/>
  <g fill="#8FBF5A">
    ${[0, 1, 2, 3, 4]
      .map((i) => `<rect x="${W / 2 - 60 + i * 26}" y="505" width="14" height="14"/>`)
      .join('')}
  </g>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#8FBF5A"/>
</svg>`;

const cover = resolve(ROOT, 'src/assets/vol1-cover.jpg');

await sharp(cover)
  .resize(W, H, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 0.85, saturation: 1.15 })
  .blur(3)
  .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
  .jpeg({ quality: 86, progressive: true, mozjpeg: true })
  .toFile(resolve(ROOT, 'public/og.jpg'));

console.log('  ✓ public/og.jpg (1200x630)');
