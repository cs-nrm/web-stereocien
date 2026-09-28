/**
 * Middleware del sitio, en este orden: los 301 del sitio viejo, el 301 de barra
 * final, la política de caché de borde y la cabecera de indexación.
 *
 * No romper: `src/pages/404.astro` tiene que renderizarse en el SERVIDOR (sin
 * `export const prerender = true`). Una URL vieja como `/autos/<slug>/` no tiene
 * ruta en el sitio nuevo, y Astro 7 solo corre el middleware para ella porque
 * renderiza el 404 con él (`renderDefaultError` en
 * astro/dist/core/errors/default-handler.js). Con el 404 prerenderizado, Astro
 * sirve el archivo estático, el middleware no corre y el mapa de 301 queda muerto
 * sin que nada falle. `scripts/guardas.mjs` lo vigila.
 */
import { defineMiddleware } from 'astro:middleware';
import { NOINDEX_SITIO, noIndexarHost } from '@/config/site';
import { destinoSitioViejo } from '@/config/redirecciones/sitio-viejo';

/**
 * Rutas que NUNCA se cachean, ni en el borde ni en el navegador.
 *
 * - `/api/`: reservado para los proxies de servidor. Hoy no existe ninguno
 *   (`src/pages/api/` no está); la regla va por delante para que el primero no
 *   nazca cacheado, porque serviría datos viejos a quien acaba de pedirlos.
 * - `/buscar`: todavía no existe, pero el diseño aprobado dibuja un buscador en la
 *   cabecera, y su respuesta depende de la consulta del lector. La regla va por
 *   delante para que el día que llegue no nazca cacheada.
 *
 * Lo que NO está, a diferencia de web-beat: `/mi/`. Allá es el área de oyentes con
 * sesión; aquí no hay cuentas ni en el sitio ni en el diseño. Si algún día las hay,
 * no basta con sumarlas aquí: su respuesta tiene que salir además
 * `private, no-store` (web-beat lo hace para `/mi/`), porque cachear en el borde
 * contenido POR OYENTE es servirle a uno lo de otro.
 */
const SIN_CACHE = [/^\/api\//, /^\/buscar(\/|$)/];

/**
 * Política de caché del HTML (heredada de web-beat).
 *
 * `max-age=0` + `s-maxage`: el NAVEGADOR revalida siempre (nadie ve un Inicio
 * viejo en su pestaña) pero el BORDE sí lo guarda, que es donde importa para
 * aguantar tráfico.
 *
 * `stale-while-revalidate` es la pieza que protege el origen en el pico: cuando el
 * TTL vence, el borde sirve la copia vieja de inmediato y refresca por detrás, en
 * vez de mandar a todo el mundo al SSR a la vez.
 *
 * Estas cabeceras solo compran algo si hay un borde que las respete. Hoy
 * `stereociendigital.mx` no tiene ninguno (comprobado el 2026-09-28: `Server:
 * Apache` y ni una cabecera de CDN). Si se pone Cloudflare, además hace falta su
 * Cache Rule (por defecto no cachea documentos aunque lo pidan las cabeceras), y
 * esa regla no se enciende mientras no exista la purga al publicar.
 */
const CACHE_HTML = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
const CACHE_404 = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

/**
 * La ruta sin su barra final, o `null` si no hay que redirigir.
 *
 * La regla de canónica del sitio es la pathname SIN barra final (salvo la raíz),
 * y el layout la arma con `Astro.url.pathname`: sin este 301, `/noticias/x/` y
 * `/noticias/x` servirían lo mismo con dos canónicas distintas. Lo hace el
 * middleware y no `trailingSlash` de Astro por el orden (ver `astro.config.mjs`).
 *
 * Trampa, y es de seguridad: `//ejemplo.com/` es una pathname válida. Quitarle la
 * barra y mandarla en `Location` sería `Location: //ejemplo.com`, que el navegador
 * lee como OTRO dominio: una redirección abierta servida por nosotros. Por eso se
 * saltan las rutas que empiezan con `//` o `/\`, junto con las internas de Astro
 * (`/_…`, `/@…`, `/.…`) — el mismo criterio que usa Astro (`isInternalPath`)
 * para no tocarlas.
 */
function rutaSinBarraFinal(ruta: string): string | null {
  if (ruta === '/' || !ruta.endsWith('/')) return null;
  if (/^\/[\/\\_@.]/.test(ruta)) return null;
  const limpia = ruta.replace(/\/+$/, '');
  return limpia === '' ? null : limpia;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const metodo = context.request.method;
  const ruta = context.url.pathname;
  const lectura = metodo === 'GET' || metodo === 'HEAD';

  /*
    Los dos 301 van PRIMERO y devuelven sin llamar a `next()`, y solo en GET/HEAD.

    Primero, porque no tiene sentido renderizar una página para tirarla, y sobre
    todo porque una URL vieja no tiene ruta: dejarla pasar costaría el render del
    404 —con la consulta al CMS del layout— por cada enlace viejo que llegue. El día
    del corte eso es tráfico de verdad.

    Solo en lectura, porque un 301 convierte un POST en GET en el navegador (el
    cuerpo se pierde), y el sitio viejo era estático: nunca aceptó un POST.

    El mapa va ANTES que la barra final para que una URL vieja —todas terminan en
    `/`— llegue a su nota en UN solo salto, no en dos.

    La query se conserva en los dos. Un enlace viejo con `?utm_source=…` viene de
    una campaña, y perder los parámetros al redirigir es perder su atribución
    justo el día que más importa.

    Los dos son 301: permanentes, y el navegador los cachea con fuerza. Un destino
    equivocado en el mapa se queda pegado en la máquina de quien lo visitó, así que
    el mapa se corrige ANTES del corte, no después (heredado de web-beat).
  */
  if (lectura) {
    const destino = destinoSitioViejo(ruta);
    if (destino) return context.redirect(destino + context.url.search, 301);

    const sinBarra = rutaSinBarraFinal(ruta);
    if (sinBarra) return context.redirect(sinBarra + context.url.search, 301);
  }

  const cacheable = lectura && !SIN_CACHE.some((r) => r.test(ruta));

  const respuesta = await next();

  // Solo HTML, y sin pisar a quien ya haya decidido su propia política.
  if (cacheable && !respuesta.headers.has('Cache-Control')) {
    const tipo = respuesta.headers.get('Content-Type') ?? '';
    if (tipo.includes('text/html')) {
      if (respuesta.status === 200) respuesta.headers.set('Cache-Control', CACHE_HTML);
      else if (respuesta.status === 404) respuesta.headers.set('Cache-Control', CACHE_404);
    }
  }

  /**
   * Despliegue que no es el dominio canónico: se marca `noindex` por cabecera.
   *
   * La cabecera es la que de verdad protege: aplica a TODO lo que sale (páginas,
   * feeds, robots), no solo al HTML, y Google la respeta incluso donde
   * no hay dónde poner un `<meta>`.
   *
   * Se evalúan las DOS reglas y basta con que una cierre:
   * - `NOINDEX_SITIO`: el dominio con el que se compiló.
   * - `noIndexarHost`: el `Host` de ESTA petición. Cubre el caso que muerde — el
   *   mismo artefacto de producción servido por otro nombre sería un duplicado
   *   indexable del sitio real.
   *
   * Depende de que a Node le llegue el `Host` verdadero: `ProxyPreserveHost On`
   * en el proxy, o `X-Forwarded-Host` con el host en `security.allowedDomains`. Si
   * no, el sitio real sale fuera de Google. El detalle medido está en
   * src/config/site.ts, «Cómo llega la petición a Node».
   */
  if (NOINDEX_SITIO || noIndexarHost(context.url.hostname)) {
    respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return respuesta;
});
