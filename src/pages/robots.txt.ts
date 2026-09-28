/**
 * `robots.txt` — la TERCERA capa de la política de indexación.
 *
 * Es la que un rastreador lee ANTES de pedir nada; las otras dos (el
 * `X-Robots-Tag` del middleware y el `<meta robots>` del layout) solo actúan sobre
 * una respuesta que ya se sirvió. Heredado de web-beat, donde faltaba y era un
 * agujero real.
 *
 * Y es una RUTA, no un archivo en `public/`. Tiene que serlo: la decisión
 * depende del `Host` de cada petición, porque un staging y el sitio real pueden
 * ser el MISMO artefacto. Un archivo estático diría lo mismo en los dos, y
 * entonces o el staging invita a rastrear, o el sitio real se cierra a sí mismo.
 * Es el mismo razonamiento que está escrito en `noIndexarHost`.
 */
import type { APIRoute } from 'astro';
import { NOINDEX_SITIO, noIndexarHost } from '@/config/site';
import { SITEMAPS_ANUNCIADOS } from '@/lib/feeds';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  /*
    Las DOS reglas, como el middleware y el `<meta robots>`: la del dominio con
    el que se compiló y la del `Host` de esta petición. Basta con que una cierre.
    Con una sola, este archivo podía invitar a rastrear un despliegue que las
    otras dos capas estaban marcando `noindex`.
  */
  const cerrado = NOINDEX_SITIO || noIndexarHost(url.hostname);

  const cuerpo = cerrado
    ? [
        '# Despliegue que NO es el dominio canónico (staging, una IP, un local).',
        '# Se cierra entero para que no compita con el sitio real en el índice.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        '# Los proxies del servidor no son contenido.',
        'Disallow: /api/',
        '',
        ...SITEMAPS_ANUNCIADOS.map((s) => `Sitemap: ${s}`),
        '',
      ].join('\n');

  return new Response(cuerpo, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      /*
        Una hora en el borde. Es de lo primero que pide un rastreador y no cambia
        casi nunca, pero tampoco conviene un TTL largo: si alguna vez sale
        cerrado por error en el dominio canónico (un `SITIO_NOINDEX=1` olvidado),
        una caché de un día lo mantendría fuera de Google durante horas después
        de corregirlo.
      */
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
