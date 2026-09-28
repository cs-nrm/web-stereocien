/**
 * El contrato de paginación de las vistas de índice.
 *
 * Heredado de web-beat sin cambios de lógica. Allá nació el 2026-09-17 porque una
 * sección tenía **53 notas publicadas y solo 11 alcanzables**: pedía una tanda y se
 * acababa ahí, y las otras 42 respondían por su URL y estaban en el sitemap, pero
 * desde el sitio no había forma de llegar a ellas. Aquí todavía no pagina ninguna
 * vista —hoy el sitio es el Inicio y la nota—; esto es el contrato para la primera
 * que lo haga, y `obtenerNotas` en `src/lib/cms/noticias.ts` ya lo usa.
 *
 * La página va en el QUERY (`?pagina=2`) y no en la ruta (`/pagina/2`): una vista
 * de índice que ya es ruta dinámica —una sección por categoría, por ejemplo—
 * necesitaría otro archivo de ruta por cada una, y un `/pagina/` de primer nivel
 * es un segmento más que reservar.
 *
 * Y por eso mismo `rutaPagina` NO conserva otros parámetros: arrastrar el query
 * entero sería justo lo que la regla de abajo prohíbe. El día que una vista tenga
 * dos parámetros, se combinan aquí y se validan los dos.
 */

/**
 * Tope de página. Es la regla de oro del cliente del CMS aplicada a la URL:
 * la clave de caché es la consulta entera, así que `?pagina=999999999` es una
 * entrada de caché regalada, y hay tantas como números quiera teclear alguien.
 *
 * Mismo motivo y misma forma que el `PAGINA_MAX` de `src/lib/feeds.ts`. La lección
 * está pagada en `web-enfoque` (heredado de web-beat): un parámetro sin validar
 * produjo **836 de 1,103 errores por hora**.
 *
 * Lo que importa es que sea un número CERRADO, no cuál. Ojo con el tamaño, eso sí:
 * con las 12 notas por página que `obtenerNotas` usa por omisión son 2,400 notas
 * alcanzables por vista, y el WordPress de Stereo Cien tiene 10,119 entradas solo
 * en Cultura Pop (2026-09-28). Si la migración las trae todas, la cola de esa
 * sección solo se alcanza por su URL y por el sitemap; subir el tope es la salida,
 * y cuesta exactamente eso: más claves de caché posibles.
 */
export const TOPE_PAGINA = 200;

/** El nombre del parámetro, en un solo sitio: lo leen la vista, la canónica y el paginador. */
export const PARAM_PAGINA = 'pagina';

/**
 * La página pedida, ya validada. Cualquier cosa que no sea un entero dentro del
 * rango cae a 1.
 *
 * `Number('')` es `0` y `Number(' 2 ')` es `2`: por eso se comprueba con
 * `Number.isInteger` sobre el valor convertido y no con un `parseInt`, que se
 * traga `2abc` y devolvería 2. Un valor raro no es un error del lector: es la
 * primera página.
 */
export function leerPagina(url: URL): number {
  const crudo = url.searchParams.get(PARAM_PAGINA);
  if (crudo === null) return 1;
  const n = Number(crudo);
  if (!Number.isInteger(n) || n < 1 || n > TOPE_PAGINA) return 1;
  return n;
}

/**
 * Cuántas páginas hay. Devuelve 1 cuando no hay nada, para que el paginador no
 * tenga que distinguir «vacío» de «una sola página»: en los dos casos no se pinta.
 */
export function totalPaginas(total: number, porPagina: number): number {
  if (!Number.isFinite(total) || total <= 0 || porPagina <= 0) return 1;
  return Math.min(TOPE_PAGINA, Math.ceil(total / porPagina));
}

/**
 * El `href` de una página.
 *
 * La página 1 va SIN parámetro. Es lo que evita que `/<vista>` y
 * `/<vista>?pagina=1` sean dos URLs con el mismo contenido.
 */
export function rutaPagina(pathname: string, n: number): string {
  return n <= 1 ? pathname : `${pathname}?${PARAM_PAGINA}=${n}`;
}

/** Un hueco en la tira de números: se pinta como «…» y no es enlazable. */
export const HUECO = 'hueco' as const;

/**
 * Los números que se pintan: siempre la primera, la última y las vecinas de la
 * actual, con «…» donde se salta.
 *
 * Con 5 páginas caben todas; con 18 sale `1 … 7 8 9 … 18`. El tope existe porque
 * una tira de dieciocho números no se lee, y en móvil no cabe.
 */
export function ventanaPaginas(
  actual: number,
  total: number,
  alrededor = 1,
): (number | typeof HUECO)[] {
  if (total <= 1) return [];

  const visibles = new Set<number>([1, total]);
  for (let n = actual - alrededor; n <= actual + alrededor; n++) {
    if (n >= 1 && n <= total) visibles.add(n);
  }

  const orden = [...visibles].sort((a, b) => a - b);
  const salida: (number | typeof HUECO)[] = [];
  let previa = 0;
  for (const n of orden) {
    // Un salto de exactamente uno no merece «…»: cabe el número que falta.
    if (previa && n - previa === 2) salida.push(previa + 1);
    else if (previa && n - previa > 2) salida.push(HUECO);
    salida.push(n);
    previa = n;
  }
  return salida;
}
