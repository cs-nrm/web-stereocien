/**
 * Los 301 del sitio viejo: `/<seccion>/<slug>/` → `/noticias/<slug>`.
 *
 * El sitio viejo de Stereo Cien (Astro estático sobre el WordPress) servía ~1,008
 * notas en 19 secciones, con la sección en la URL. El nuevo las sirve en
 * `/noticias/<slug>` (el porqué está en `src/config/site.ts`). Sin estos 301, el día
 * del corte de dominio cada enlace compartido, cada marcador y todo lo que Google
 * tiene indexado de esas notas cae en 404.
 *
 * Por qué un MAPA EXACTO y no una regla por patrón: `/<seccion>/<slug>` no dice
 * a qué nota nueva corresponde —el slug final lo decide la importación, y puede no
 * ser el mismo— ni si esa nota llegó a cargarse. Una regla `/<seccion>/(.*)` →
 * `/noticias/$1` mandaría con 301 a un 404 cada nota que no se importó, y un 301 se
 * queda cacheado en el navegador de quien lo visita.
 *
 * Por qué aquí y no en otro lado (decisión de Carlos, 2026-09-28):
 *  - No en la colección `redirects` del CMS: es global, sin estación, así que una
 *    regla de Stereo Cien aplicaría en las otras tres; y si el CMS cae, caen los 301.
 *  - No en Apache: `pnpm build` no lo prueba, y la guarda de CI tampoco lo vería.
 *  - En el front, versionado y cargado en memoria: sin red, sin render, O(1) por
 *    petición, y lo revisa `scripts/guardas.mjs` en cada build.
 *
 * El formato del JSON, quién lo genera y lo que falta están escritos en el propio
 * `sitio-viejo.json`, en su clave `//`.
 *
 * Lo que NO entra, y es a propósito: `/wp-content/`, `/category/`, `/feed/`,
 * `/wp-json/` y `/?p=<id>` son rutas del WORDPRESS, que vive en OTRO dominio
 * (`stereociendigital.com.mx`; el sitio viejo lo lee de ahí, ver su `.env` en la
 * rama `stereocien`). Comprobado con curl el 2026-09-28 contra
 * `stereociendigital.mx`: las cuatro primeras responden 404 hoy, así que ningún
 * enlace que funcione hoy las pide a este dominio; y `/?p=<id>` responde el Inicio
 * (Apache ignora el query), que es justo lo que el sitio nuevo hace sin ninguna
 * regla. Las imágenes de las notas viejas apuntan a
 * `stereociendigital.com.mx/wp-content/`, no a este dominio.
 */
import mapa from './sitio-viejo.json';

/**
 * La ruta como la guarda el mapa. El middleware y la guarda de CI
 * (`scripts/guardas.mjs`, que no puede importar TS y la repite) tienen que
 * normalizar IGUAL: si se toca aquí, se toca allá.
 *
 *  - Sin barra final. Todas las URLs del sitio viejo terminan en `/` (así las
 *    declara su canónica), pero su Apache también respondía sin ella con un 301, y
 *    los enlaces circulan de las dos formas. Normalizar deja una sola clave por nota.
 *  - Escapes `%XX` decodificados y en NFC. Un mismo carácter no ASCII puede llegar
 *    como `%C3%B1` (el navegador escapa en mayúscula) o como `%c3%b1` (si el enlace
 *    ya venía escapado en minúscula), o sin escapar: comparar el texto crudo haría
 *    que la misma nota fallara según quién escribió el enlace. Los 932 slugs que
 *    el build del sitio viejo publica hoy (las últimas 100 por sección, contados
 *    contra su API el 2026-09-28) son todos ASCII; esto es para el que no lo sea,
 *    entre los que su despliegue aditivo dejó en el servidor.
 *  - Mayúsculas y minúsculas TAL CUAL: el sitio viejo las distinguía (`/AUTOS/`
 *    daba 404), así que una URL con otra caja nunca funcionó y no hay nada que
 *    rescatar.
 */
export function normalizarRutaVieja(pathname: string): string {
  let ruta = pathname;
  try {
    ruta = decodeURIComponent(ruta);
  } catch {
    // Un escape roto (`%E0%A4%A`) no se puede decodificar: se busca tal cual, y
    // como ninguna clave del mapa tiene esa forma, simplemente no coincide.
  }
  const sinBarra = ruta.normalize('NFC').replace(/\/+$/, '');
  return sinBarra === '' ? '/' : sinBarra;
}

/**
 * El mapa en memoria, construido UNA vez al cargar el módulo (al arrancar el
 * proceso), no por petición.
 *
 * Se filtra lo que no sea texto aunque la guarda de CI ya lo impide: un valor que
 * no fuera cadena llegaría a `context.redirect()` y tiraría la petición con un 500
 * en vez de dejarla caer al 404.
 */
const REDIRECCIONES: ReadonlyMap<string, string> = new Map(
  Object.entries((mapa as unknown as { rutas?: Record<string, unknown> }).rutas ?? {}).filter(
    (par): par is [string, string] => typeof par[1] === 'string',
  ),
);

/**
 * El destino nuevo de una ruta del sitio viejo, o `null` si no es una de ellas.
 *
 * Guarda anti-bucle: un destino igual a la propia ruta daría un 301 hacia sí mismo,
 * que en el navegador es `ERR_TOO_MANY_REDIRECTS` —la URL caída—. La guarda de CI
 * ya lo rechaza en el JSON; esta línea es la red por si alguien sube un mapa sin
 * pasar por el build.
 */
export function destinoSitioViejo(pathname: string): string | null {
  if (REDIRECCIONES.size === 0) return null;
  const ruta = normalizarRutaVieja(pathname);
  const destino = REDIRECCIONES.get(ruta);
  if (!destino || destino === ruta) return null;
  return destino;
}
