/**
 * Valores de PRESENTACIÓN derivados de una nota.
 *
 * Viven aparte de `src/lib/cms/noticias.ts` a propósito: ese módulo habla con el
 * CMS, este decide cómo se lee un dato en pantalla. La firma, el nombre de la
 * categoría, la sección y la fecha son decisiones de front, y varias tienen que
 * resolver inconsistencias del contenido capturado.
 */
import { urlMedia } from '@/lib/cms/client';
import { SECCIONES_EDITORIALES, type SeccionEditorial } from '@/config/navegacion';
import type { Noticia } from '@/types/payload';

/**
 * El nombre de categoría que se pinta en la tarjeta: el «Cultura Pop» de «por
 * Cecilia Masariego · Cultura Pop» en el diseño.
 *
 * `noticias.categorias` es `hasMany` y NO hay categoría primaria — es
 * justamente la razón por la que la URL de una nota es plana, `/noticias/<slug>`
 * (heredado de web-beat). Para PINTAR sí hace falta elegir una, y se toma la
 * primera: aquí sí es aceptable, porque reordenar el array cambia una etiqueta, no
 * una URL.
 */
export function nombreCategoria(nota: Noticia): string | null {
  const primera = (nota.categorias ?? [])[0];
  if (!primera || typeof primera === 'number') return null;
  return primera.nombre ?? null;
}

/**
 * A QUÉ SECCIÓN del diseño pertenece una nota, o `null` si a ninguna.
 *
 * Lo decide la categoría (ver `SECCIONES_EDITORIALES`): la principal de cada
 * sección o una de sus afines. De aquí sale la migaja de la nota.
 *
 * Se recorren las categorías EN EL ORDEN DE LA NOTA y gana la primera que sea
 * de una sección — el mismo criterio que `nombreCategoria`. Es coherente y es lo
 * menos sorprendente: quien captura decide cuál va primero, y reordenar el array
 * cambia una etiqueta, no una URL.
 *
 * Devuelve `null`, y no una sección de caída, cuando ninguna categoría es de una
 * sección: una nota de Series y películas o de Tecnología no es del Lado A ni del
 * B, y ponerle una sección que no es suya sería una migaja falsa —que Google enseña
 * tal cual encima del resultado—. Quien la llama pinta la migaja sin ese eslabón.
 * web-beat caía a una sección fija porque allá el sitio ya la pintaba en todas
 * las notas antes de partir sus secciones; aquí nunca fue así.
 */
export function seccionDeNota(nota: Noticia): SeccionEditorial | null {
  const secciones: SeccionEditorial[] = Object.values(SECCIONES_EDITORIALES);
  for (const c of nota.categorias ?? []) {
    if (typeof c === 'number' || !c?.slug) continue;
    const slug = c.slug;
    const hallada = secciones.find((s) => s.categoria === slug || s.afines.includes(slug));
    if (hallada) return hallada;
  }
  return null;
}

/** El slug de la primera categoría — para enlazar el rótulo al filtro. */
export function slugCategoria(nota: Noticia): string | null {
  const primera = (nota.categorias ?? [])[0];
  if (!primera || typeof primera === 'number') return null;
  return primera.slug ?? null;
}

/** La firma de una nota, ya resuelta para pintarse. */
export interface Firma {
  nombre: string;
  slug: string | null;
  /**
   * La foto del autor, si la relación existe y la trae. Con el texto libre es
   * `null` siempre: una cadena no tiene foto.
   */
  foto: string | null;
  /** Las iniciales, para el hueco de la foto cuando no hay foto. */
  monograma: string;
  /** Una línea sobre quién firma. `null` cae al texto de la casa. */
  cargo: string | null;
}

/**
 * Las INICIALES con las que se rellena el hueco de la foto.
 *
 * Heredado de web-beat: allá ese hueco fue un círculo vacío, y a simple vista se
 * leía como una imagen que no cargó. Un monograma dice «no hay retrato de esta
 * persona», que es la verdad.
 *
 * El caso raro está medido, no imaginado, aunque en el contenido de Beat: la
 * misma persona aparecía como «FO», «Fernanda Ortíz» y «Fernanda Ortiz» en el
 * texto libre. Una firma que YA son iniciales —una sola palabra, en mayúsculas,
 * corta— se deja tal cual; partirla daría «F». Las firmas de Stereo Cien llegan
 * con la migración del WordPress y todavía no se han medido.
 */
function monogramaDe(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 1) {
    const sola = palabras[0];
    if (sola.length <= 3 && sola === sola.toUpperCase()) return sola;
    return sola.slice(0, 1).toUpperCase();
  }
  return palabras
    .slice(0, 2)
    .map((p) => p.slice(0, 1))
    .join('')
    .toUpperCase();
}

/**
 * La firma: el «por Cecilia Masariego» de las tarjetas del diseño.
 *
 * Hay DOS campos y no dicen lo mismo: `autores` es una relación a la colección
 * `autores` y `autor` es texto libre. Se prefiere la relación cuando existe,
 * porque es la única que puede dar una firma estable, una foto y una página de
 * autor; si no, el texto libre. Hoy Stereo Cien tiene 0 autores en el CMS
 * (2026-09-28).
 *
 * La foto solo llega si quien consulta pidió `depth: 2`: con 1 el autor viene
 * poblado pero su `foto` sigue siendo un id. `obtenerNota` ya lo hace, y es la
 * única que necesita la ficha; los listados piden `depth: 1`. Si llegara como id,
 * `urlMedia` devuelve `null` y se pinta el monograma — degrada, no truena.
 *
 * `cargo` antes que `bio`: este hueco es de UNA línea («Conductora», «Editor
 * digital»), que es exactamente para lo que el CMS tiene `cargo`. La `bio` es un
 * párrafo y aquí se leería apretada.
 */
export function firma(nota: Noticia): Firma | null {
  const rel = (nota.autores ?? []).find((a) => typeof a === 'object' && a !== null);
  if (rel && typeof rel === 'object') {
    const nombre = rel.nombre ?? '';
    return {
      nombre,
      slug: rel.slug ?? null,
      foto: urlMedia(rel.foto, 'thumbnail'),
      monograma: monogramaDe(nombre),
      cargo: (rel.cargo ?? rel.bio ?? '').trim() || null,
    };
  }
  const libre = (nota.autor ?? '').trim();
  return libre
    ? { nombre: libre, slug: null, foto: null, monograma: monogramaDe(libre), cargo: null }
    : null;
}

const MESES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

/**
 * La fecha corta: `18 AGO 2026`.
 *
 * Heredado de web-beat, con su formato. Se arma a mano y no con `Intl`: en
 * mayúsculas y con el mes abreviado a tres letras sin punto, que es lo que `Intl` en
 * español no da (devuelve «18 ago 2026», con punto en algunos entornos). Y con
 * `timeZone` fija, porque el servidor puede correr en UTC y una nota publicada a
 * las 20:00 de México saldría con la fecha del día siguiente.
 */
export function fechaCorta(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  const partes = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(d);
  const g = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
  return `${g('day')} ${MESES[Number(g('month')) - 1]} ${g('year')}`;
}

/** La fecha en ISO, para `<time datetime>` y para los metadatos de artículo. */
export function fechaIso(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Los tres destinos de «compartir» de una nota.
 *
 * Se arman en el SERVIDOR con la URL canónica. Nada de `location.href`: la nota se
 * puede abrir con `?utm_*` pegado y compartirlo propagaría el rastreo de quien lo
 * compartió a todos los que reciban el enlace.
 *
 * `icono` es un nombre, no un archivo: quien pinte los botones lo traduce a su
 * juego de iconos. Se conservan los de web-beat para no cambiar la firma.
 */
export function enlacesCompartir(
  url: string,
  titulo: string,
): Array<{ icono: 'facebook' | 'x-marca' | 'link'; etiqueta: string; href: string }> {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);
  return [
    {
      icono: 'facebook',
      etiqueta: 'Compartir en Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    { icono: 'x-marca', etiqueta: 'Compartir en X', href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { icono: 'link', etiqueta: 'Copiar enlace', href: url },
  ];
}
