/**
 * Las notas de la estación: el listado, la nota suelta y sus relacionadas.
 *
 * Portado de web-beat sin rediseñar la lógica —la categoría resuelta por slug una
 * sola vez, el conteo aparte, el orden, cómo se tratan `distribucion` y el tamaño
 * de página constante—. Lo que cambia es la forma: allá la API era la de Beat
 * Scanner, una sección concreta con su destacada; aquí es un listado genérico que
 * cada bloque del Inicio y cada vista pide con sus opciones, y quien pinta decide
 * qué nota destaca.
 *
 * Hoy Stereo Cien tiene CERO notas en el CMS (2026-09-28). Todo lo de aquí
 * devuelve vacío sin error, que es lo que se ve en pantalla hasta la migración.
 * Para probar con contenido: `ESTACION_CODIGO=beat` en local, nunca como valor por
 * omisión.
 */
import {
  cmsContarEstacion,
  cmsFetchEstacion,
  SIN_PAGINACION,
  type ParamsCms,
  type RespuestaLista,
} from './client';
import { TOPE_PAGINA, totalPaginas } from '@/lib/paginacion';
import { obtenerCategoria } from './categorias';
import type { Noticia } from '@/types/payload';

/**
 * Los campos que un LISTADO necesita, y solo esos. Obligatorio en toda consulta
 * que no sea el detalle de una nota.
 *
 * Sin `select`, cada nota del listado arrastra su `contenido` entero —el árbol
 * Lexical del cuerpo— para pintar una tarjeta que solo enseña el titular. Medido
 * el 2026-09-28 contra el CMS con las 11 notas más recientes de Beat y `depth: 1`:
 * **103.3 KB sin `select`, 19.6 KB con él y 16.8 KB con el `populate` de abajo**.
 * Es lo que viaja del CMS al servidor en cada consulta, y lo que se guarda en la
 * caché del cliente por cada entrada.
 *
 * Lo que queda: titular, slug, resumen, foto, categorías (el rótulo de la tarjeta)
 * y los dos campos de la firma. `id` llega siempre, se pida o no. `fecha` y
 * `createdAt` van porque la fecha que se pinta cae de una a otra.
 *
 * `populate` recorta los documentos RELACIONADOS a lo que la tarjeta lee: de la
 * categoría, nombre y slug; del autor, lo que usa `firma()` en `src/lib/nota.ts`.
 *
 * Trampa, medida el mismo día: la MEDIA no se recorta con `populate`. Pedir
 * `populate[media][url]` sin `filename` y `prefix` devuelve `url: null` —Payload
 * arma la URL a partir de esos dos— y la foto desaparece de todas las tarjetas sin
 * un solo error. Lo que se ahorraba eran 2.3 KB en 11 notas; no compensa un
 * recorte que se rompe en silencio el día que `Media` cambie cómo arma su URL.
 */
const CAMPOS_LISTADO: ParamsCms = {
  'select[titulo]': true,
  'select[slug]': true,
  'select[resumen]': true,
  'select[imagen]': true,
  'select[categorias]': true,
  'select[autor]': true,
  'select[autores]': true,
  'select[fecha]': true,
  'select[createdAt]': true,
  'populate[categorias][nombre]': true,
  'populate[categorias][slug]': true,
  'populate[autores][nombre]': true,
  'populate[autores][slug]': true,
  'populate[autores][cargo]': true,
  'populate[autores][bio]': true,
  'populate[autores][foto]': true,
};

/**
 * La base de todo listado. `depth: 1` puebla `imagen`, `categorias` y `autores`;
 * con `depth: 0` vendrían como ids y la tarjeta se quedaría sin foto —sin error:
 * `urlMedia` recibe un número y devuelve `null`—.
 */
const BASE_LISTADO: ParamsCms = { depth: 1, ...SIN_PAGINACION, ...CAMPOS_LISTADO };

/**
 * Solo las publicadas.
 *
 * Hoy es redundante y se escribe igual: el CMS ya le exige `estado: 'publicada'`
 * a quien lee sin sesión (`lecturaPublicaPublicada` en `cms-estaciones`), y este
 * front lee siempre sin sesión. Lo que protege es el día en que el front lea con
 * un token —una vista previa, por ejemplo—: con sesión el CMS devuelve TODO, y sin
 * esta línea las despublicadas saldrían en el Inicio. No cuesta nada en caché: es
 * la misma en todas las consultas.
 */
const PUBLICADAS: ParamsCms = { 'where[estado][equals]': 'publicada' };

/*
  Los dos filtros de colocación, cada uno en su propio índice de `and`.

  Trampa: los dos son un `or` (ver abajo por qué), y dos `or` sueltos en la misma
  consulta se rompen de dos maneras. Si los dos escriben `where[or][0]` y
  `where[or][1]`, al combinarlos el segundo PISA al primero —son las mismas claves— y
  las piezas vuelven a salir sin error. Si el segundo sigue en `[or][2]` y `[or][3]`,
  queda UN solo `or` de cuatro términos, y una pieza con `excluirDelHome: false` lo
  cumple. Cada uno en su `where[and][n]` los deja como dos condiciones que tienen
  que cumplirse a la vez. Los índices 0 y 1 son fijos: un tercer filtro de este tipo
  va en el 2. La combinación con `and` se comprobó contra el CMS el 2026-09-28.

  El `or` con `exists: false` NO es decorativo (heredado de web-beat): en Postgres
  un `!=` **no devuelve las filas con NULL**, así que sin él se perderían todas las
  notas que nunca tocaron el campo. Hoy ninguna nota de Beat tiene NULL en estos
  dos campos, pero las de Stereo Cien todavía no existen y llegan por una
  migración: no se apuesta a que el importador escriba el valor por omisión.
*/

/**
 * Una `pieza` no se distribuye como noticia, en NINGÚN listado.
 *
 * `noticias.distribucion` separa QUÉ es una pieza de DÓNDE se coloca: una pieza de
 * lista conserva su URL, su sitemap y el buscador —se comparte suelta, tiene que
 * poder encontrarse— pero no sale en los listados editoriales, porque su lugar es
 * dentro de su colección. El CMS lo describe así en el propio campo. Heredado de
 * web-beat, que la excluía de todos sus listados y no solo del Inicio.
 */
const SIN_PIEZAS: ParamsCms = {
  'where[and][0][or][0][distribucion][not_equals]': 'pieza',
  'where[and][0][or][1][distribucion][exists]': false,
};

/**
 * Fuera del Inicio lo que la redacción marcó con «Excluir del home».
 *
 * Es una excepción de COLOCACIÓN para una nota normal: sale en su sección, pero
 * no en la portada. El CMS lo documenta en el campo:
 * «el front filtra con `where[excluirDelHome][not_equals]=true`». web-beat nunca lo
 * leyó; este front sí, en `paraPortada`.
 */
const FUERA_DEL_HOME: ParamsCms = {
  'where[and][1][or][0][excluirDelHome][not_equals]': true,
  'where[and][1][or][1][excluirDelHome][exists]': false,
};

/** Orden público: primero lo fijado, luego por fecha. Es el `defaultSort` del CMS. */
const ORDEN = '-fijada,-fecha';

/** Tamaño de página por omisión, y su tope. */
const POR_PAGINA = 12;
/**
 * Un número CERRADO por la regla de oro del cliente: la clave de caché es la
 * consulta entera, y un `porPagina` sin tope es una clave distinta por cada número.
 * Hoy lo escribe el código y no el lector, pero cuesta lo mismo acotarlo aquí que
 * descubrirlo después.
 */
const TOPE_POR_PAGINA = 50;

function enteroEnRango(v: number | undefined, min: number, max: number, porOmision: number): number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : porOmision;
}

export interface OpcionesNotas {
  /**
   * `slug` de una categoría del CMS. Ausente = todas las notas de la estación.
   *
   * No romper: presente pero inexistente en el CMS = CERO notas, no todas. Hoy
   * es el caso de TODAS las categorías de Stereo Cien, y confundir los dos haría
   * que cada bloque del Inicio pintara las mismas notas sin filtrar —la clase de
   * fallo que nadie reporta porque la página se ve llena—.
   */
  categoria?: string;
  /** 1 por omisión. Fuera de `1..TOPE_PAGINA` cae a 1: valídala antes con `leerPagina`. */
  pagina?: number;
  /** 12 por omisión, tope 50. Constante entre páginas de una misma vista: ver abajo. */
  porPagina?: number;
  /** Para el Inicio: además de las piezas, saca lo marcado con «Excluir del home». */
  paraPortada?: boolean;
}

export interface PaginaDeNotas {
  notas: Noticia[];
  /**
   * Cuántas notas hay con ese filtro. Exacto cuando el conteo respondió; si no
   * respondió, es lo mínimo que se sabe (las de las páginas anteriores más las de
   * esta), y `totalPaginas` queda en 1.
   */
  total: number;
  /** Ya acotado a `TOPE_PAGINA`. 1 cuando no hay nada o no se pudo contar: no se pinta tira. */
  totalPaginas: number;
  /** La página que se sirvió, ya validada. */
  pagina: number;
}

/**
 * Un listado de notas de la estación.
 *
 * Una sola consulta de contenido y un conteo APARTE, en paralelo. El conteo es
 * `cmsContarEstacion`: sin `page`, `limit` ni `sort`, así que todas las páginas de
 * una misma vista comparten un solo `COUNT`, y con timeout corto y `null` si falla
 * —sin total no hay tira de números, que es una vista con menos navegación y no una
 * vista rota—. `SIN_PAGINACION` se queda puesto aunque esto pagine: con
 * `pagination=false` Payload respeta `page` (ver `cmsContarEstacion` en
 * `./client`).
 *
 * El tamaño de página tiene que ser CONSTANTE entre páginas de una misma vista
 * (heredado de web-beat): el desplazamiento lo calcula Payload como
 * `(page - 1) * limit`, así que un `porPagina` distinto en la página 2 —por
 * ejemplo, uno menos por no tener destacada— se saltaría una nota en cada salto.
 * Si una vista destaca una nota, la saca de la misma tanda en memoria, no de una
 * consulta aparte: dos consultas tienen dos relojes de caché y la destacada y la
 * rejilla pueden quedar desfasadas (le pasó a `web-enfoque`).
 *
 * La categoría se resuelve por slug UNA vez con `obtenerCategoria` —cacheada— y el
 * listado filtra por su id con `where[categorias][in]`. El slug directo obligaría a
 * `where[categorias.slug]`, que en Payload es un join contra la tabla de
 * relaciones. Medido el 2026-09-28 sobre las 145 notas de Beat, los dos tardan lo
 * mismo (~160 ms): con una tabla así de chica no se nota. Lo que crece con la tabla
 * es el join, y el WordPress de Stereo Cien trae 10,119 entradas solo en Cultura Pop
 * (contadas ese día en su API). Y de paso la consulta de la categoría es la que
 * distingue «no existe» de «sin filtro».
 *
 * Degrada, nunca truena: si el CMS no responde, una página vacía.
 */
export async function obtenerNotas(opciones: OpcionesNotas = {}): Promise<PaginaDeNotas> {
  const pagina = enteroEnRango(opciones.pagina, 1, TOPE_PAGINA, 1);
  const porPagina = enteroEnRango(opciones.porPagina, 1, TOPE_POR_PAGINA, POR_PAGINA);
  const vacia: PaginaDeNotas = { notas: [], total: 0, totalPaginas: 1, pagina };

  let porCategoria: ParamsCms = {};
  // `!== undefined` y no un `if (opciones.categoria)`: una cadena vacía es una
  // categoría que no existe, no «sin filtro». Esa ni se le pregunta al CMS.
  if (opciones.categoria !== undefined) {
    const slug = opciones.categoria.trim();
    const categoria = slug ? await obtenerCategoria(slug) : null;
    if (!categoria) return vacia;
    porCategoria = { 'where[categorias][in]': String(categoria.id) };
  }

  const where: ParamsCms = {
    ...PUBLICADAS,
    ...SIN_PIEZAS,
    ...(opciones.paraPortada ? FUERA_DEL_HOME : {}),
    ...porCategoria,
  };

  const [lista, contadas] = await Promise.all([
    cmsFetchEstacion<RespuestaLista<Noticia>>('noticias', {
      ...BASE_LISTADO,
      ...where,
      sort: ORDEN,
      limit: porPagina,
      page: pagina,
    }).catch(() => null),
    cmsContarEstacion('noticias', where),
  ]);

  if (!lista) return vacia;
  const notas = lista.docs;

  if (contadas === null) {
    return { notas, total: (pagina - 1) * porPagina + notas.length, totalPaginas: 1, pagina };
  }
  return { notas, total: contadas, totalPaginas: totalPaginas(contadas, porPagina), pagina };
}

/**
 * Una nota por slug, completa: es la única consulta que trae `contenido`.
 *
 * A diferencia del resto, este error SÍ se propaga: la página necesita distinguir
 * «no existe» (`null`, un 404) de «el CMS no responde» (un 503 que no se cachea).
 *
 * Las piezas NO se filtran aquí: conservan su URL aunque no salgan en listados.
 */
export async function obtenerNota(slug: string): Promise<Noticia | null> {
  const r = await cmsFetchEstacion<RespuestaLista<Noticia>>('noticias', {
    ...PUBLICADAS,
    'where[slug][equals]': slug,
    // `depth: 2` para que la FOTO del autor venga poblada: con 1 llega el autor
    // pero su `foto` sigue siendo un id. Y el `audio.archivo` de la nota, que es
    // otra relación a `media`.
    depth: 2,
    limit: 1,
    draft: false,
  });
  return r.docs[0] ?? null;
}

/**
 * Las relacionadas del pie de una nota: de sus mismas categorías, las más
 * recientes.
 *
 * La nota actual se excluye EN MEMORIA, no en el `where`.
 *
 * Es la regla de oro de la caché de este cliente, y viene de un incidente medido
 * (heredado de web-beat): en `web-enfoque` esta misma función usaba
 * `where[id][not_equals]=<id>`, así que cada nota generaba su propia entrada de
 * caché y la consulta más llamada del sitio nunca acertaba — **836 de los 1,103
 * errores por hora salían de ahí**. Filtrando por categoría a secas, todas las
 * notas de una categoría comparten una sola entrada.
 */
export async function obtenerRelacionadas(nota: Noticia, cuantas = 3): Promise<Noticia[]> {
  const cats = (nota.categorias ?? [])
    .map((c) => (typeof c === 'number' ? c : c?.id))
    .filter((id): id is number => typeof id === 'number');
  if (!cats.length) return [];

  try {
    const r = await cmsFetchEstacion<RespuestaLista<Noticia>>('noticias', {
      ...BASE_LISTADO,
      ...PUBLICADAS,
      ...SIN_PIEZAS,
      'where[categorias][in]': cats.join(','),
      sort: '-fecha',
      // Se piden algunas más de las necesarias para poder descartar la actual sin
      // quedarse corto.
      limit: cuantas + 3,
    });
    return r.docs.filter((n) => n.id !== nota.id).slice(0, cuantas);
  } catch {
    return [];
  }
}
