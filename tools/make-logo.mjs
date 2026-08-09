/**
 * Generator logo GIARDIA — craniu pixel-art 16x16.
 *
 * Grila e sursa de adevar. Din ea iese SVG-ul (rects unite pe randuri, ca sa
 * fie mic) si toate PNG-urile pentru favicon / apple-touch / og.
 * Ruleaza: node tools/make-logo.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// '#' = os, '.' = gol. 16x16, simetric pe verticala.
const SKULL = [
  '................',
  '....########....',
  '..############..',
  '.##############.',
  '################',
  '################', // arcada — masiva, doua randuri pline
  '##....####....##', // orbite: pline sus...
  '##....####....##',
  '###...####...###', // ...si ingustate spre barbie => privire adancita
  '####..####..####',
  '#######..#######', // nas: triunghi care se deschide in jos
  '######....######',
  '################',
  '.##############.',
  '..############..',
  '..#.##.##.##.#..', // dinti
];

/** Uneste pixelii vecini de pe acelasi rand intr-un singur <rect>. */
function runs(grid) {
  const out = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === '#') {
        const start = x;
        while (x < row.length && row[x] === '#') x++;
        out.push({ x: start, y, w: x - start });
      } else x++;
    }
  });
  return out;
}

function toSvg(grid, { fill = 'currentColor', bg = null, pad = 0 } = {}) {
  const size = grid.length;
  const box = size + pad * 2;
  const rects = runs(grid)
    .map((r) => `<rect x="${r.x + pad}" y="${r.y + pad}" width="${r.w}" height="1"/>`)
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" ` +
    `shape-rendering="crispEdges" fill="${fill}" role="img" aria-label="GIARDIA">` +
    (bg ? `<rect width="${box}" height="${box}" fill="${bg}"/>` : '') +
    `<g>${rects}</g></svg>`
  );
}

mkdirSync(`${ROOT}/public/brand`, { recursive: true });

// 1. SVG monocrom care mosteneste culoarea din CSS — pentru navbar.
const inline = toSvg(SKULL, { fill: 'currentColor' });
writeFileSync(`${ROOT}/src/components/skull.svg`, inline);

// 2. Favicon SVG: os deschis pe fundal transparent, cu padding ca sa respire.
const faviconSvg = toSvg(SKULL, { fill: '#E8E4DC', pad: 1 });
writeFileSync(`${ROOT}/public/favicon.svg`, faviconSvg);

// 3. Rasterizari. Fundal opac doar unde platforma cere (apple-touch, maskable).
const raster = [
  { file: 'public/favicon-32.png', size: 32, bg: null, pad: 1 },
  { file: 'public/favicon-16.png', size: 16, bg: null, pad: 0 },
  { file: 'public/apple-touch-icon.png', size: 180, bg: '#07080A', pad: 3 },
  { file: 'public/brand/icon-192.png', size: 192, bg: '#07080A', pad: 2 },
  { file: 'public/brand/icon-512.png', size: 512, bg: '#07080A', pad: 2 },
  { file: 'public/brand/maskable-512.png', size: 512, bg: '#07080A', pad: 5 },
];

for (const r of raster) {
  const svg = toSvg(SKULL, { fill: '#E8E4DC', bg: r.bg, pad: r.pad });
  await sharp(Buffer.from(svg))
    .resize(r.size, r.size, { kernel: 'nearest' }) // nearest = pixelii raman patrati
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${ROOT}/${r.file}`);
  console.log(`  ✓ ${r.file} (${r.size}px)`);
}

console.log(`  ✓ public/favicon.svg (${faviconSvg.length} bytes)`);
console.log(`  ✓ src/components/skull.svg (${inline.length} bytes)`);
