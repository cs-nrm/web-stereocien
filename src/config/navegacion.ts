/**
 * La navegación del sitio, en un solo lugar: el índice tipo tracklist de la
 * barra, el menú de la cabecera, las secciones editoriales y las redes.
 *
 * La forma sale del diseño aprobado
 * (`design/stereo-cien-home-handoff/stereo-cien-home-handoff.md`: §5.1 la barra
 * fija, §5.2 la revista y su cabecera) y las URLs reales, del sitio viejo (rama
 * `stereocien`). Nada de aquí es inventado: lo que no tiene fuente se queda fuera y
 * está anotado como pendiente.
 *
 * La regla que manda en todo el archivo: **solo entradas con un destino que exista
 * HOY.** Hoy el sitio es el Inicio y la nota; no hay páginas de sección. Por eso
 * cada sección enlaza a su ANCLA del Inicio (`/#vinilos`) y no a una ruta
 * (`/vinilos`), que respondería 404. El día que una sección tenga página propia,
 * su `href` cambia aquí y solo aquí.
 */

/**
 * Los `id` de las secciones del Inicio, tal como los dibuja el diseño (§5.2).
 *
 * Es la lista CERRADA de anclas que existen: el Inicio las pone y este archivo las
 * enlaza. Con el tipo, una ancla mal escrita aquí no compila en vez de llevar al
 * lector a lo alto de la página sin avisar.
 */
export const ANCLAS_INICIO = [
  'noticia',
  'lado-a',
  'sounds',
  'vinilos',
  'podcasts',
  'lado-b',
  'comida',
  'libros',
  'autos',
  'relojes',
  'promos',
] as const;

export type AnclaInicio = (typeof ANCLAS_INICIO)[number];

/**
 * El `href` de un ancla del Inicio, con la barra delante: funciona igual desde el
 * Inicio que desde una nota.
 */
const aInicio = (ancla: AnclaInicio): string => `/#${ancla}`;

// ============================================================
// El índice tipo tracklist de la barra (§5.1, punto 4)
// ============================================================

/** Una pista del índice. `ancla` va SIN `#`. */
export interface EntradaIndice {
  codigo: string;
  nombre: string;
  ancla: string;
}

/**
 * Un lado del disco.
 *
 * `tema` y `ancla` van además de lo pactado entre agentes, y son aditivos: la fila
 * del LADO en el diseño es un enlace más —«LADO A · Música» lleva a `#lado-a`,
 * «LADO B · Vida & estilo» a `#lado-b`— y sin estos dos campos el índice tendría
 * que escribirlos a mano.
 */
export interface Lado {
  id: 'a' | 'b' | 'gana';
  /** En su forma normal; las mayúsculas del diseño son CSS. */
  nombre: string;
  entradas: EntradaIndice[];
  /** Lo que el diseño escribe junto al nombre del lado: «Música», «Vida & estilo». */
  tema: string;
  /** A dónde lleva la fila del lado. Sin `#`. */
  ancla: string;
}

const entrada = (codigo: string, nombre: string, ancla: AnclaInicio): EntradaIndice => ({
  codigo,
  nombre,
  ancla,
});

/**
 * El índice de la barra, en el orden del diseño.
 *
 * El Lado A es lo musical y el Lado B vida y estilo; al final, GANA (§1 del
 * diseño). Cada pista se ilumina con el scroll cuando su sección está a la vista.
 *
 * GANA no numera pista: en el diseño su fila es UNA, «GANA · Promociones», y lleva
 * a `#promos`. Va como entrada igual —`codigo` es la palabra que el diseño pone en
 * el hueco del número— para que quien recorra `entradas` para iluminar anclas vea
 * también esta sección. Por eso su `tema` y su `ancla` repiten los de su única
 * entrada: quien pinte el índice dibuja una sola fila para GANA, no dos.
 *
 * De dónde sale cada sección, porque no todas son notas:
 *
 *   · A1 Las de hoy, A3 Vinilos y el Lado B entero son NOTAS (`noticias`),
 *     filtradas por la categoría de su sección: ver `SECCIONES_EDITORIALES`.
 *
 *   · A2 SOUNDS no es una categoría ni una colección del CMS. Los 4 canales viven
 *     hoy en el WordPress del sitio viejo, en el tipo de entrada `sounds` del plugin
 *     que está en la rama `stereocien` (`wp/plugins/sounds-by-stereo-cien/`), y se
 *     leen por su REST, `/wp-json/wp/v2/sounds`. Cada canal trae la URL del stream
 *     de Zeno.fm (`sounds_stream_url`) y su mount (`sounds_mount_url`), el logo,
 *     cinco colores, el orden, si está activo, y dos imágenes de patrocinio con su
 *     liga («Presentado por» y «Patrocinado por»). Lo que suena lo da Zeno, no
 *     WordPress (`api.zeno.fm/mounts/metadata/subscribe/<mount>`), y la portada de
 *     la canción, un proxy del plugin hacia la búsqueda de iTunes
 *     (`/wp-json/sounds/v1/itunes`). Publicados el 2026-09-28: `back-to-disco`,
 *     `nu-disco`, `new` y `rock-en-espanol`. Ojo: el diseño llama NEWS al que en
 *     WordPress se llama «New».
 *
 *   · A4 Podcasts sale del CMS: la colección `podcasts` son los EPISODIOS, y cada
 *     uno apunta a su programa en `programas`. Las tres tarjetas del diseño
 *     —Autos al Cien, El Especial, El Gran Circo— son programas, no episodios: cada
 *     una lleva el nombre del show y su «ESCUCHAR». En el WordPress
 *     viejo eran categorías (`podcast-autos-al-cien-podcast`,
 *     `podcast-el-especial-de-stereo-cien`, `podcast-el-gran-circo`). Hoy Stereo
 *     Cien tiene 0 programas y 0 podcasts en el CMS.
 *
 *   · GANA sale de la colección `promociones` del CMS (premio, vigencia `inicio` y
 *     `fin`, portada, cómo se participa). Hoy, 0. La categoría `promociones` del
 *     WordPress (6 entradas) son NOTAS sobre promociones, no promociones: a cuál de
 *     los dos lados van al migrar lo decide la migración.
 */
export const LADOS: Lado[] = [
  {
    id: 'a',
    nombre: 'Lado A',
    tema: 'Música',
    ancla: 'lado-a',
    entradas: [
      entrada('A1', 'Las de hoy', 'lado-a'),
      entrada('A2', 'SOUNDS', 'sounds'),
      entrada('A3', 'Vinilos', 'vinilos'),
      entrada('A4', 'Podcasts', 'podcasts'),
    ],
  },
  {
    id: 'b',
    nombre: 'Lado B',
    tema: 'Vida & estilo',
    ancla: 'lado-b',
    entradas: [
      entrada('B1', 'Comida y guías', 'comida'),
      entrada('B2', 'Libros', 'libros'),
      entrada('B3', 'Autos', 'autos'),
      entrada('B4', 'Relojes', 'relojes'),
    ],
  },
  {
    id: 'gana',
    nombre: 'Gana',
    tema: 'Promociones',
    ancla: 'promos',
    entradas: [entrada('GANA', 'Promociones', 'promos')],
  },
];

// ============================================================
// El menú de la cabecera (§5.2)
// ============================================================

export interface EntradaNav {
  /** En su forma normal; las mayúsculas del diseño son CSS. SOUNDS es la marca y va así. */
  nombre: string;
  href: string;
  /** Sale del sitio: se abre en otra pestaña y lleva la flecha ↗ del diseño. */
  externo?: boolean;
}

/**
 * El menú de la cabecera.
 *
 * El diseño dibuja siete: `MÚSICA · SOUNDS · PODCASTS · VIDA & ESTILO ·
 * PROMOCIONES · PROGRAMACIÓN · ENFOQUE ↗`. Van seis.
 *
 * **PROGRAMACIÓN queda fuera** porque no tiene destino: no hay ruta de
 * programación en este sitio, y en el CMS Stereo Cien tiene 0 programas
 * (2026-09-28). Entra cuando exista la página —en el sitio viejo era
 * `/programacion`—, en su lugar entre Promociones y Enfoque.
 *
 * ENFOQUE es externo, y la URL sale de la barra del player del sitio viejo
 * (`src/components/BarStereo.astro` de la rama `stereocien`, el enlace «Enfoque»):
 * `https://enfoquenoticias.com.mx/`. Respondió 200 el 2026-09-28. Es el sitio de la
 * programación que va por la frecuencia; ver `tritonMount` en
 * `src/lib/cms/estacion.ts`.
 *
 * Qué entradas se esconden a qué ancho (el diseño quita Promociones por debajo de
 * 1600 px, y Programación y Enfoque por debajo de 1800) es CSS de la cabecera, no
 * dato de este archivo.
 */
export const NAV_CABECERA: EntradaNav[] = [
  { nombre: 'Música', href: aInicio('lado-a') },
  { nombre: 'SOUNDS', href: aInicio('sounds') },
  { nombre: 'Podcasts', href: aInicio('podcasts') },
  { nombre: 'Vida & estilo', href: aInicio('lado-b') },
  { nombre: 'Promociones', href: aInicio('promos') },
  { nombre: 'Enfoque', href: 'https://enfoquenoticias.com.mx/', externo: true },
];

// ============================================================
// Las secciones editoriales: qué categorías del CMS llenan cada una
// ============================================================

/**
 * Una sección del diseño que se llena con NOTAS.
 *
 * Lo leen `seccionDeNota()` en `src/lib/nota.ts` (la migaja de la nota) y quien
 * arme los bloques del Inicio, que le pasa `categoria` a `obtenerNotas`.
 */
export interface SeccionEditorial {
  /**
   * El NOMBRE de la sección en su forma normal: «Comida y guías», no «COMIDA Y
   * GUÍAS». Es el que va a lo que lee una máquina —la migaja del JSON-LD— y al DOM.
   * Heredado de web-beat: allá la migaja copiaba el rótulo en mayúsculas y así lo
   * enseñaba Google encima del resultado.
   */
  nombre: string;
  /** El rótulo ya en mayúsculas, para un titular de display. La misma palabra que `nombre`. */
  rotulo: string;
  /** Hoy, el ancla de la sección en el Inicio. Cambia aquí el día que haya página. */
  href: string;
  ancla: string;
  /**
   * El `slug` de LA categoría del CMS que llena el bloque de esta sección. Es la
   * que se le pasa a `obtenerNotas({ categoria })`, que filtra por una sola.
   */
  categoria: string;
  /**
   * Otras categorías del WordPress que también son de esta sección. Hoy solo las
   * usa `seccionDeNota` para la migaja: una nota de Corona Capital es del Lado A
   * aunque no sea de Cultura Pop.
   *
   * No llenan el bloque del Inicio. Para que lo llenen hay dos caminos, y
   * decidirlo es parte de la propuesta: que la migración le sume a esas notas
   * también la categoría principal (`noticias.categorias` admite varias), o que
   * `obtenerNotas` aprenda a filtrar por varias a la vez.
   */
  afines: readonly string[];
}

/**
 * PROPUESTA EDITORIAL, pendiente de que Carlos la confirme con la redacción.
 *
 * Hoy Stereo Cien no tiene ninguna categoría en el CMS (2026-09-28): llegan con la
 * migración del WordPress, con el MISMO slug que allá. Estos slugs son los del
 * WordPress (`stereociendigital.com.mx/wp-json/wp/v2/categories`, consultado ese
 * día), no los de las URLs del sitio viejo, y NO coinciden: la sección `/autos` de
 * aquel sitio se llenaba con la categoría `autos-al-cien`, `/libros` con
 * `libros-y-cultura`, `/comida-y-guias` con `guias-y-comida`. Mientras la categoría
 * no exista, su bloque del Inicio sale vacío, que es lo correcto.
 *
 * El mapeo, contra las 19 secciones del sitio viejo:
 *
 *   Música (Lado A)  ← `cultura-pop` (10,119 entradas, la más grande). Afines:
 *                      las coberturas de festivales de música que el sitio viejo
 *                      tenía como sección propia —`corona-capital-2026`,
 *                      `cobertura-tecate-emblema-2026`, `remind`—.
 *   Vinilos          ← `vinilos`. Afín: `vida-vinyl` (reediciones en vinil).
 *   Comida y guías   ← `guias-y-comida`.
 *   Libros           ← `libros-y-cultura`.
 *   Autos            ← `autos-al-cien`.
 *   Relojes          ← `relojes`.
 *
 * Sin sección en el diseño —sus notas se migran y responden en `/noticias/<slug>`,
 * pero no salen en ningún bloque del Inicio y su migaja no lleva sección—:
 * `series-y-peliculas`, `tecnologia`, `destinos` (la sección «Viajes» del sitio
 * viejo), `mascotas`, `recap-2025` (listas de fin de año, mezcladas), `locutores`,
 * `locutores-enfoque` y `promociones`. El pie del diseño sí enlaza «Series y
 * Películas» y «Viajes»; no tienen destino hasta que haya página de sección.
 *
 * Y una que hay que revisar a mano: `vinos` tiene UNA entrada y es de un vinil de
 * Michael Jackson. Parece un error de captura; si lo es, esa nota va a Vinilos.
 */
export const SECCIONES_EDITORIALES = {
  musica: {
    nombre: 'Música',
    rotulo: 'MÚSICA',
    href: aInicio('lado-a'),
    ancla: 'lado-a',
    categoria: 'cultura-pop',
    afines: ['corona-capital-2026', 'cobertura-tecate-emblema-2026', 'remind'],
  },
  vinilos: {
    nombre: 'Vinilos',
    rotulo: 'VINILOS',
    href: aInicio('vinilos'),
    ancla: 'vinilos',
    categoria: 'vinilos',
    afines: ['vida-vinyl'],
  },
  comida: {
    nombre: 'Comida y guías',
    rotulo: 'COMIDA Y GUÍAS',
    href: aInicio('comida'),
    ancla: 'comida',
    categoria: 'guias-y-comida',
    afines: [],
  },
  libros: {
    nombre: 'Libros',
    rotulo: 'LIBROS',
    href: aInicio('libros'),
    ancla: 'libros',
    categoria: 'libros-y-cultura',
    afines: [],
  },
  autos: {
    nombre: 'Autos',
    rotulo: 'AUTOS',
    href: aInicio('autos'),
    ancla: 'autos',
    categoria: 'autos-al-cien',
    afines: [],
  },
  relojes: {
    nombre: 'Relojes',
    rotulo: 'RELOJES',
    href: aInicio('relojes'),
    ancla: 'relojes',
    categoria: 'relojes',
    afines: [],
  },
} as const satisfies Record<string, SeccionEditorial & { ancla: AnclaInicio }>;

// ============================================================
// Redes, apps y el pie
// ============================================================

/**
 * Las redes de la estación, de RESPALDO.
 *
 * El CMS es la fuente —`estaciones.facebook`, `.instagram`, `.x`, `.youtube`,
 * `.tiktok`— y sigue siendo el que gana. Hoy los cinco campos de Stereo Cien están
 * en `null` (comprobado contra `admin.nrm.com.mx` el 2026-09-28), y sin esto el
 * sitio no enseñaría ninguna forma de seguir a la estación.
 *
 * Salen del pie del sitio viejo (`src/components/Footer.astro` de la rama
 * `stereocien`, el bloque «Síguenos en redes sociales»): son los perfiles REALES.
 * Los cuatro respondieron 200 el 2026-09-28, y Facebook e Instagram, además, con
 * el nombre de la cuenta: «Stereo Cien Mx».
 *
 * YouTube va en `null`: el pie viejo tenía ese enlace COMENTADO y apuntando al
 * canal de Beat, no a uno de Stereo Cien. `redesEstacion()` no pinta una red sin
 * URL.
 *
 * Es un respaldo POR RED y no una lista alterna: en cuanto el CMS traiga
 * `facebook`, ese valor gana y este se ignora. Ver `redesEstacion()` en
 * `src/lib/cms/estacion.ts`.
 */
export const REDES_RESPALDO: Readonly<
  Record<'facebook' | 'instagram' | 'x' | 'youtube' | 'tiktok', string | null>
> = {
  facebook: 'https://www.facebook.com/StereoCienMx/',
  instagram: 'https://www.instagram.com/stereocienmx/',
  x: 'https://x.com/stereocienmx',
  youtube: null,
  tiktok: 'https://www.tiktok.com/@stereocienmx',
};

/**
 * Las apps de la estación, para el «ESCÚCHANOS» del pie del diseño.
 *
 * Salen del pie del sitio viejo (mismo archivo que las redes): son las fichas
 * reales en tiendas, y las dos respondieron 200 el 2026-09-28.
 *
 * Alexa, que el diseño también dibuja, queda FUERA: en el sitio viejo apuntaba a
 * su página `/alexa`, y esa página no existe en este sitio.
 */
export const APPS: EntradaNav[] = [
  {
    nombre: 'App Store',
    href: 'https://apps.apple.com/mx/app/stereo-cien-100-1/id444261571',
    externo: true,
  },
  {
    nombre: 'Google Play',
    href: 'https://play.google.com/store/apps/details?id=com.sferea.stereocien',
    externo: true,
  },
];

/**
 * Las otras marcas de NRM, para la columna «NRM COMUNICACIONES» del pie del
 * diseño, en su orden. Las URLs salen de la tira de logos del pie viejo y las
 * cuatro respondieron 200 el 2026-09-28.
 */
export const MARCAS_NRM: EntradaNav[] = [
  { nombre: 'Beat Digital', href: 'https://beatdigital.mx/', externo: true },
  { nombre: 'Oye Digital', href: 'https://oyedigital.mx/', externo: true },
  { nombre: 'Sabrosita Digital', href: 'https://sabrositadigital.mx/', externo: true },
  { nombre: 'Enfoque Noticias', href: 'https://enfoquenoticias.com.mx/', externo: true },
];

/**
 * La fila de abajo del pie.
 *
 * El diseño dibuja tres: Aviso de privacidad, Términos y condiciones y Contacto
 * comercial. Solo el tercero tiene destino hoy —el contacto comercial de NRM, el
 * «Ventas» del pie viejo, respondió 200 el 2026-09-28—. El aviso y los términos
 * eran páginas del sitio viejo (`/avisodeprivacidad/` y `/terminosycondiciones/`)
 * que este sitio todavía no tiene; entran aquí cuando existan.
 */
export const LEGALES: EntradaNav[] = [
  { nombre: 'Contacto comercial', href: 'https://nrm.com.mx/contacto/', externo: true },
];
