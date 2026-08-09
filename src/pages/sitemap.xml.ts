import type { APIRoute } from 'astro';
import { site } from '../data/site';

/** Doua pagini — nu merita o integrare intreaga, doar generam XML-ul. */
const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/joc', priority: '0.8', changefreq: 'monthly' },
];

export const GET: APIRoute = () => {
  const now = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.path === '/' ? site.url : site.url + p.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
