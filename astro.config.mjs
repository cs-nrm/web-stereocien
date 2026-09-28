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
     * Sin esta lista, `Astro.url` en producción es SIEMPRE `http://localhost/`:
     * el adaptador de node descarta el `Host` que no puede validar y cae a
     * "localhost" (`validateHost`, que usa astro/dist/core/app/node.js, devuelve
     * `undefined` cuando `allowedDomains` está vacío o el host no está en ella).
     *
     * Dos consecuencias, las dos ya pagadas en web-beat y en web-enfoque:
     *  1. El `X-Robots-Tag` del middleware, el `<meta robots>` y el robots.txt miran
     *     el host de la petición. Con "localhost" creerían que el sitio real es un
     *     despliegue de prueba y dejarían TODO stereociendigital.mx fuera de Google.
     *  2. `checkOrigin` compara el header `Origin` contra `url.origin`: con
     *     "localhost" de un lado y el dominio real del otro, **todo POST responde
     *     403**.
     *
     * Los patrones van solo con `hostname`, sin `protocol` ni `port`, para que el
     * match no dependa de cómo se resuelva el esquema detrás del proxy inverso (que
     * habla HTTP con Node y anuncia HTTPS por `X-Forwarded-Proto`). Un host que no
     * esté aquí no se rechaza: vuelve a "localhost", que es el lado seguro para la
     * indexación.
     *
     * TODO staging o preproducción TIENE que entrar en esta lista. Trampa pagada en
     * web-beat: un staging fuera de ella sale noindex igual (tampoco es el host
     * canónico, y eso es lo que se quiere), pero `Astro.url` deja de decir la verdad
     * y **todo POST da 403**, así que el primer formulario que se pruebe ahí falla
     * sin razón aparente. Y si el que falta es el canónico, el sitio real entero
     * queda en noindex.
     */
    allowedDomains: [
      { hostname: 'stereociendigital.mx' },
      /* El `www` hoy ni siquiera resuelve en DNS (comprobado con curl el
         2026-09-28), pero si mañana alguien lo apunta a este proceso sin un 301
         delante, un host que NO esté en esta lista se resuelve como "localhost" y
         el middleware marcaría el sitio real como despliegue de prueba. Listarlo
         cuesta una línea. */
      { hostname: 'www.stereociendigital.mx' },
    ],
  },
  devToolbar: {
    enabled: true,
  },
});
