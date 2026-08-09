import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { routes, languages, defaultLang, type Lang, type RouteKey } from '../i18n/ui';

/**
 * Sitemap multilingv. Fiecare URL isi declara toate traducerile prin
 * <xhtml:link rel="alternate">, inclusiv pe sine — asa cere Google, altfel
 * grupul de traduceri nu e considerat valid.
 */
const pages: { key: RouteKey; priority: string; changefreq: string }[] = [
  { key: 'home', priority: '1.0', changefreq: 'weekly' },
  { key: 'game', priority: '0.8', changefreq: 'monthly' },
];

const abs = (p: string) => (p === '/' ? site.url : `${site.url}${p}`);

export const GET: APIRoute = () => {
  const now = new Date().toISOString().slice(0, 10);
  const langs = Object.keys(languages) as Lang[];

  const urls = pages.flatMap((p) =>
    langs.map((lang) => {
      const alts = langs
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${languages[l].htmlLang}" href="${abs(routes[p.key][l])}"/>`,
        )
        .concat(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(routes[p.key][defaultLang])}"/>`,
        )
        .join('\n');

      return `  <url>
    <loc>${abs(routes[p.key][lang])}</loc>
${alts}
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
    }),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
