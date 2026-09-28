import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@tailwindcss/vite';

// Front público de Stereo Cien 100.1 — Astro SSR sobre `cms-estaciones`.
// Modelo: `web-beat`, que es la plantilla escrita a propósito para las cuatro
// estaciones de NRM. Tres decisiones heredadas de ahí, a propósito:
//   1. security.checkOrigin: true → protección CSRF gratis para cualquier POST
//      que llegue a existir (el newsletter del diseño aprobado, por ejemplo).
//   2. Sin @astrojs/sitemap → los sitemaps los GENERA el CMS y este dominio los
//      sirve (ver src/lib/feeds.ts). Dos sitemaps compitiendo es peor que uno. El
//      sitio viejo tenía la integración con una opción que no soporta
//      (`sitemap({ sitemap: '/sitemap.xml' })`): su robots.txt anunciaba un
//      /sitemap.xml que respondía 404.
//   3. Tailwind entra por el PLUGIN DE VITE, no por `@astrojs/tailwind`, que es lo
//      que usaba el sitio viejo. Esa integración se quedó en Tailwind 3 y Astro 5
//      (su última versión, 6.0.2, declara `tailwindcss: ^3.0.24` y
//      `astro: ^3||^4||^5`): mantenerla obligaba a quedarse dos majors atrás.
export default defineConfig({
  // Dominio canónico, sin `www`. Decide la indexación: cualquier despliegue
  // compilado con otro dominio sale noindex solo (ver `NOINDEX_SITIO` en
  // src/config/site.ts).
  site: process.env.PUBLIC_SITE_URL || 'https://stereociendigital.mx',
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  /*
   * `trailingSlash` se queda en 'ignore' (el valor por omisión), escrito para que
   * nadie lo "corrija" a 'never'. La barra final la quita el MIDDLEWARE con un 301,
   * y tiene que ser él y no Astro.
   *
   * Trampa: en Astro 7 el 301 de `trailingSlash` corre ANTES que el middleware
   * (`handleRequest` en astro/dist/core/routing/handler.js llama a
   * `handleTrailingSlash` antes de renderizar, y el middleware va dentro del
   * render). Todas las URLs del sitio viejo terminan en barra
   * (`/autos/<slug>/`, y así las declara su `<link rel="canonical">`), así que con
   * 'never' cada enlace viejo daría DOS saltos: Astro a `/autos/<slug>` y de ahí el mapa de 301 a
   * `/noticias/<slug>`. El middleware consulta el mapa primero y quita la barra
   * después: un solo salto en los dos casos.
   *
   * Con 'ignore' cada ruta responde con y sin barra (el patrón de la ruta acaba en
   * `\/?$`), y por eso el 301 del middleware no es opcional: sin él habría dos URLs
   * sirviendo lo mismo. Lo único que Astro sigue haciendo por su cuenta es juntar
   * barras finales repetidas (`/x//` → `/x/`), también antes del middleware.
   */
  trailingSlash: 'ignore',

  vite: {
    plugins: [tailwind()],
    server: {
      watch: {
        /*
         * `design/` son megabytes de `.dc.html`, capturas e imágenes del lienzo
         * aprobado. No alimentan el build, y vigilarlos solo compra recargas del
         * servidor de desarrollo cada vez que alguien abre o regenera el lienzo.
         *
         * `node_modules` y `.git` van escritos a mano aunque ya son exclusiones por
         * omisión. Heredado de web-beat: allá una lista sin ellos dejó el servidor de
         * desarrollo sirviendo CSS viejo durante varias sesiones, y lo atribuyó a que
         * la lista REEMPLAZABA la de omisión. En la Vite instalada aquí (8.2.2) la
         * lista se SUMA —`resolveChokidarOptions` concatena las dos, comprobado en
         * su código—, así que hoy repetirlas es redundante; se dejan porque no
         * cuestan nada y cubren el día que una versión de Vite cambie de criterio.
         * Se nota tarde porque el build sí toma los cambios: solo el dev queda atrás.
         */
        ignored: ['**/node_modules/**', '**/.git/**', '**/design/**', '**/dist/**'],
      },
    },
  },
  security: {
    checkOrigin: true,
    /**
     * Qué hace esta lista, medido el 2026-09-28 con Astro 7.2.10 y @astrojs/node
     * 11.1.4 contra un build servido. El comentario que venía de web-beat decía
     * que sin ella `Astro.url` caía a "localhost"; con estas versiones no es así, y
     * el detalle completo está en src/config/site.ts («Cómo llega la petición a
     * Node»):
     *
     *  - El adaptador arma `Astro.url` con el `Host` tal como llega. La lista NO
     *    decide eso.
     *  - La lista decide a qué cabeceras del proxy se les cree. Con ella no vacía,
     *    Astro lee `X-Forwarded-Proto` (para cualquier host) y `X-Forwarded-Host`
     *    (solo para los hosts de aquí). Detrás de Apache, Node habla HTTP. Sin
     *    creerle a `X-Forwarded-Proto: https`, `Astro.url` sale `http:` y
     *    `checkOrigin` responde **403 a todo POST**, porque el navegador manda
     *    `Origin: https://...`. Así que la lista hace falta, y el vhost además tiene
     *    que MANDAR esa cabecera: Apache no la pone por omisión.
     *  - Si el proxy reescribe el `Host` (Apache sin `ProxyPreserveHost On`), el
     *    host real solo se recupera de `X-Forwarded-Host`, y únicamente si está en
     *    esta lista. Si no, el sitio real sale en noindex y sin medición.
     *
     * Los patrones van solo con `hostname`, sin `protocol` ni `port`, para que el
     * match no dependa de cómo se resuelva el esquema detrás del proxy inverso.
     *
     * TODO staging o preproducción entra en esta lista, igual que en web-beat. Sin
     * ella, si su proxy reescribe el `Host`, `Astro.url` no dice la verdad y el
     * primer formulario que se pruebe ahí falla sin razón aparente.
     */
    allowedDomains: [
      { hostname: 'stereociendigital.mx' },
      /* El `www` hoy ni siquiera resuelve en DNS (comprobado con curl el
         2026-09-28). Si mañana alguien lo apunta a este proceso detrás de un proxy
         que reescriba el `Host`, sin la entrada su `X-Forwarded-Host` no se cree y
         `Astro.url` no diría la verdad. Listarlo cuesta una línea. */
      { hostname: 'www.stereociendigital.mx' },
    ],
  },
  devToolbar: {
    enabled: true,
  },
});
