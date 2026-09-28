/**
 * Config del sitio — Stereo Cien 100.1.
 *
 * El contrato de URLs vive aquí, y es el mismo de web-beat: **una ruta por
 * COLECCIÓN, no por sección**. Las notas van en `/noticias/<slug>` y NO en
 * `/<seccion>/<slug>`, por tres razones (heredadas de web-beat, y aquí valen igual):
 *   1. `noticias.categorias` es `hasMany` y no hay categoría primaria en el CMS.
 *      Derivar el path de `categorias[0]` haría que reordenar un array —accidente
 *      editorial— cambiara una URL viva en silencio.
 *   2. No todas las secciones del sitio son categorías de `noticias`: SOUNDS son
 *      los canales del reproductor y Podcasts es su propia colección.
 *   3. Una URL plana es inmutable: no cambia cuando la redacción re-archiva.
 *
 * Y de paso coincide con lo que el CMS ya emite en `getNewsURL`
 * (`cms-estaciones/src/seo/site.ts`), así que los sitemaps que genera el CMS
 * apuntan a rutas que este sitio sí sirve, sin tocar el CMS.
 *
 * Lo que cuesta, y por qué no se discute aquí: el build del sitio viejo publica hoy
 * 932 notas en `/<seccion>/<slug>/` repartidas en 19 secciones (el tope es de 100
 * por sección; hay más en el servidor, por el despliegue aditivo). Esas URLs NO se conservan:
 * se redirigen con 301 mediante un MAPA EXACTO versionado en este repo
 * (`src/config/redirecciones/sitio-viejo.json`), que consulta `src/middleware.ts`
 * antes de renderizar nada. Ahí está explicado el formato y quién lo genera.
 */
import { envServidor } from '@/lib/env';

/** URL pública del sitio, sin barra final. */
export const SITE_URL = (
  import.meta.env.PUBLIC_SITE_URL || 'https://stereociendigital.mx'
).replace(/\/$/, '');

/** Único host que Google debe indexar. Todo lo demás es un despliegue de prueba. */
export const HOST_CANONICO = 'stereociendigital.mx';

/**
 * Escape hatch manual, común a las dos reglas de indexación:
 * `SITIO_NOINDEX=1` fuerza noindex, `=0` fuerza indexar. `null` = decide el host.
 */
const forzadoNoIndex = (): boolean | null => {
  const v = envServidor('SITIO_NOINDEX');
  if (v === '1') return true;
  if (v === '0') return false;
  return null;
};

/**
 * ¿Este despliegue debe quedar FUERA de Google?
 *
 * Se decide solo, comparando el dominio con el que se compiló contra el canónico:
 * cualquier despliegue que no sea `stereociendigital.mx` (staging, una IP, un
 * local) se marca `noindex` sin que nadie tenga que acordarse de una variable.
 * **Falla del lado seguro**: si te equivocas al configurar, lo que pasa es que NO
 * se indexa, no que se indexe un duplicado.
 */
export const NOINDEX_SITIO = ((): boolean => {
  const forzado = forzadoNoIndex();
  if (forzado !== null) return forzado;
  try {
    return new URL(SITE_URL).host !== HOST_CANONICO;
  } catch {
    return true; // URL inválida = configuración rota → no indexar
  }
})();

/**
 * La misma pregunta, pero por PETICIÓN.
 *
 * `NOINDEX_SITIO` mira el dominio con el que se COMPILÓ, y eso deja un hueco: un
 * staging y el sitio real pueden ser el mismo artefacto, así que al compilar con
 * el dominio canónico el staging empezaría a servir el sitio como indexable — un
 * duplicado exacto compitiéndole al real. El `Host` de la petición sí distingue
 * los dos. Es también la regla con la que el layout decide si carga la medición.
 *
 * Depende de que a Node le llegue el `Host` VERDADERO, y eso no se ve desde aquí.
 * Ver «Cómo llega la petición a Node», abajo.
 *
 * La otra mitad de la garantía la da el propio Apache (heredado de web-beat): con
 * vhosts por nombre, el `Host` **es** lo que elige el vhost, así que una petición
 * con `Host: stereociendigital.mx` no puede llegar al proceso de un staging — la
 * reclama el vhost del sitio vivo. Meter un proxy intermedio que reescriba el
 * `Host` rompe las dos mitades a la vez.
 */
export function noIndexarHost(hostname: string): boolean {
  const forzado = forzadoNoIndex();
  if (forzado !== null) return forzado;
  return hostname.toLowerCase() !== HOST_CANONICO;
}

/**
 * ¿Esta petición llegó por el dominio canónico, en un build hecho para él?
 *
 * Es la guarda de la MEDICIÓN (`src/layouts/Base.astro`), y se separó de la de
 * indexación a propósito: NO pasa por `SITIO_NOINDEX`. Ese interruptor es para
 * abrir o cerrar la puerta a Google. Si también decidiera la medición, un
 * `SITIO_NOINDEX=0` en local —la forma de probar la indexación— metía tráfico de
 * prueba a comScore con los IDs reales (reproducido el 2026-09-28), y un `=1` en
 * el sitio real para sacarlo de Google le apagaba la medición.
 */
export function esDespliegueCanonico(hostname: string): boolean {
  let hostCompilado: string;
  try {
    hostCompilado = new URL(SITE_URL).host;
  } catch {
    return false;
  }
  return hostCompilado === HOST_CANONICO && hostname.toLowerCase() === HOST_CANONICO;
}

/*
 * CÓMO LLEGA LA PETICIÓN A NODE. Medido el 2026-09-28 contra un build servido,
 * con Astro 7.2.10 y @astrojs/node 11.1.4 (el comentario que venía de web-beat
 * describía otro mecanismo y aquí era falso):
 *
 * 1. EL HOST. El adaptador arma `Astro.url` con el `Host` tal como llega. Apache
 *    sin `ProxyPreserveHost On` manda el del backend (`127.0.0.1:<puerto>`), y
 *    entonces el sitio real sale en noindex y sin medición. Astro puede recuperar
 *    el host real de `X-Forwarded-Host`, pero solo le cree si ese host está en
 *    `security.allowedDomains` (`astro.config.mjs`). Lo seguro son las dos cosas:
 *    `ProxyPreserveHost On` en el vhost, y todos los hosts en la lista, staging
 *    incluido.
 *
 * 2. EL PROTOCOLO. Detrás del proxy, Node habla HTTP, así que `Astro.url` sale
 *    `http:` salvo que el proxy mande `X-Forwarded-Proto: https`. Astro solo lo
 *    lee si `allowedDomains` no está vacía. Sin esa cabecera, `checkOrigin`
 *    compara `Origin: https://stereociendigital.mx` contra `http://...` y
 *    **responde 403 a todo POST**, con el Host correcto y todo. Apache no la
 *    manda por omisión, y el vhost molde de web-beat
 *    (web-beat: deploy/apache/020-beatdigital.conf) tampoco la pone. Hace falta
 *    `RequestHeader set X-Forwarded-Proto "https"` (mod_headers) en el vhost :443.
 *
 * Cómo se comprueba al montar el vhost: un POST de formulario al dominio, con
 * `Origin: https://stereociendigital.mx`, NO debe responder 403. Y `curl -sI
 * https://stereociendigital.mx/` NO debe traer `X-Robots-Tag`.
 */

/** Origen INTERNO del CMS (API) — SOLO server-side. Puede ser una IP privada
 *  (p. ej. http://10.0.0.5:3000). El navegador nunca lo ve. Sin `/api`: el
 *  cliente (`src/lib/cms/client.ts`) lo añade. */
export const CMS_URL = envServidor('CMS_URL').replace(/\/$/, '');

/**
 * Si falta, se grita. No es paranoia: es el fallo que ya costó un despliegue.
 *
 * `CMS_URL` va SIN prefijo `PUBLIC_`, así que se lee en ejecución y Vite no la
 * hornea en el bundle —solo inlinea las `PUBLIC_*`—. Cuando el proceso arranca sin
 * ella, cada consulta sale contra una URL vacía, falla, y el sitio responde **200
 * con cero contenido**: cabecera, pie y menú perfectos, y ni una noticia.
 *
 * Es el peor modo de falla que existe. No hay error en pantalla, el monitoreo ve
 * 200, y quien lo mira piensa que el CMS está vacío (y en Stereo Cien, mientras la
 * migración del WordPress no se cargue, el CMS SÍ está vacío: las dos causas se ven
 * idénticas). Pasó en el beta de `web-enfoque` (31 jul 2026) y volvió a pasar en
 * web-beat con `pnpm preview`, que tampoco carga `.env`.
 *
 * Un aviso en el arranque no lo arregla, pero convierte media hora de buscar a
 * ciegas en una línea que dice qué hacer.
 */
if (!CMS_URL) {
  console.error(
    '\nCMS_URL está vacía. El sitio va a responder 200 SIN CONTENIDO.\n' +
      '   Es una variable de EJECUCIÓN (sin prefijo PUBLIC_), así que no basta con\n' +
      '   tenerla en `.env`: `astro preview` y el servicio no lo cargan.\n' +
      '   · en local:     CMS_URL=https://admin.nrm.com.mx pnpm preview\n' +
      '   · en el server: que llegue al entorno del proceso de Node.\n',
  );
}

/** Origen PÚBLICO del CMS: la media que carga el navegador.
 *  Si no se define, cae a `CMS_URL` (setup de un solo host). Separarlos hace
 *  trivial el corte «IP interna ↔ dominio público». */
export const CMS_URL_PUBLICA = (
  import.meta.env.PUBLIC_CMS_URL || CMS_URL
).replace(/\/$/, '');

/**
 * `codigo` de la estación en la colección `estaciones` del CMS.
 *
 * Es env var y no una constante a propósito: es lo que hace que el mismo código
 * sirva a otra estación (así nació este repo, de web-beat). El id numérico NO se
 * hardcodea nunca — se resuelve por este código (ver `src/lib/cms/client.ts`).
 *
 * Mientras la migración del WordPress no esté cargada, Stereo Cien no tiene ni una
 * nota en el CMS. Para probar en local con contenido, `ESTACION_CODIGO=beat`; pero
 * el valor por omisión es SIEMPRE el de esta estación: un omiso que apuntara a otra
 * serviría su contenido con esta marca sin que nada lo delatara.
 */
export const ESTACION_CODIGO = envServidor('ESTACION_CODIGO', 'stereocien');

export const IDIOMA = 'es';
export const IDIOMA_REGION = 'es-MX';
export const LOCALE_OG = 'es_MX';

/**
 * La medida de las tarjetas de compartir.
 *
 * Va aquí y no escrita en el `<head>` porque la lee más de uno —`og:image:width`
 * y `og:image:height` del layout, y el `image` del JSON-LD de la estación
 * (`src/lib/jsonld.ts`)— y porque es un dato DEL ARCHIVO, no una preferencia:
 * 1200×630 (1.91:1) es la medida que piden Facebook y X para la tarjeta grande, y
 * la imagen tiene que medir exactamente eso. La genera `scripts/tarjetas.mjs`, que
 * mide lo que escribió; si un día la genera a otra medida, se cambia aquí y en el
 * script, y las etiquetas siguen diciendo la verdad.
 *
 * Unas medidas que no correspondan al archivo son peores que ninguna (heredado de
 * web-beat): las plataformas reservan el hueco con ellas antes de bajar la imagen,
 * así que el error se ve como un recorte raro en la publicación, no como un fallo.
 */
export const MEDIDA_TARJETA = { ancho: 1200, alto: 630 } as const;

/**
 * La tarjeta de RESPALDO: el Inicio, los legales y cualquier página que no traiga
 * la suya (la nota pasa la foto de la nota).
 *
 * Es una ruta del propio sitio, y `Base.astro` la resuelve contra `SITE_URL`. Trampa
 * conocida (pagada en web-beat): mientras `stereociendigital.mx` siga sirviendo el
 * sitio viejo, esa URL absoluta responde 404, así que una página del sitio nuevo
 * compartida desde un staging sale sin imagen. Se arregla sola con el corte de
 * dominio; si antes hiciera falta compartir desde un staging, la tarjeta tendría
 * que vivir en una URL que no dependa del dominio (web-beat usó una del CMS).
 */
export const TARJETA_COMPARTIR = {
  ruta: '/img/og-stereocien.png',
  ...MEDIDA_TARJETA,
} as const;

// ============================================================
// Contrato de URLs
// ============================================================

/** Una ruta por colección: la nota vive en `/noticias/<slug>`. */
export const rutaNota = (slug: string): string => `/noticias/${slug}`;

/**
 * Conjunto CERRADO de primeros segmentos que son rutas de la app o archivos
 * estáticos, y por tanto nunca se resuelven como slug de contenido.
 *
 * Hoy no hay ninguna ruta dinámica de primer nivel que la consulte; existe para el
 * día que la haya (una página de sección por slug, por ejemplo), que tiene que
 * comprobarla ANTES que cualquier otra cosa. La lección está pagada en
 * `web-enfoque`: a su lista equivalente le faltaba una entrada y provocó
 * `ERR_TOO_MANY_REDIRECTS` en una sección del menú.
 *
 * Mantener en sintonía con `src/pages/` y con lo estático de `public/`. Una ruta
 * nueva de primer nivel entra aquí el mismo día que entra a `src/pages/`.
 *
 * Las 19 secciones del sitio viejo (`autos`, `vinilos`...) NO van aquí: sus NOTAS
 * las resuelve el mapa de 301 del middleware antes de llegar a cualquier ruta, y
 * sus índices todavía no tienen página. El día que una sección tenga página
 * propia, entra aquí como cualquier ruta nueva.
 */
export const SEGMENTOS_RESERVADOS = [
  // Rutas de `src/pages/`
  'noticias',
  // Reservado para los proxies de servidor: hoy no existe `src/pages/api/`.
  'api',
  '404',
  'robots.txt',
  'sitemap.xml',
  'news-sitemap.xml',
  // Estáticos: los que genera Astro y los de `public/`
  '_astro',
  '_image',
  '_server-islands',
  'img',
  'favicon',
  'favicon.ico',
  'fuentes',
] as const;

export const urlAbsoluta = (ruta: string): string =>
  `${SITE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
