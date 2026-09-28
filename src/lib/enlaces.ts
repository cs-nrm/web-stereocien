/**
 * El único filtro por el que pasa una URL que viene del CMS antes de llegar a un
 * `href`.
 *
 * Existe porque había tres caminos y solo uno filtraba. `Lexical.astro` tenía su
 * lista cerrada de esquemas, pero el enlace de respaldo de `Embed.astro` y las
 * redes del pie (`Pie.astro`, que salen del documento de la estación) escribían
 * la URL tal cual. Reproducido el 2026-09-28: un bloque embed con
 * `javascript:...` salía servido como `<a href="javascript:...">`. Hoy no se
 * ejecutaba solo porque ese enlace abre con `target="_blank"` y sin opener. Eso
 * es un efecto colateral, no una defensa: quitar el `_blank` lo convertía en XSS
 * almacenado.
 *
 * No romper: un `javascript:` en un enlace es el mismo XSS almacenado que un
 * `set:html`, solo que esperando un clic.
 */

/** Los esquemas que pueden llegar a un `href`. Lista cerrada a propósito. */
const ESQUEMAS_ABSOLUTOS = /^(https?:|mailto:|tel:)/i;
const ESQUEMAS_WEB = /^https?:/i;

/**
 * Relativo al sitio: empieza con una sola barra, o es un ancla.
 *
 * Trampa: no basta con «empieza con / y no con //». El navegador lee la barra
 * invertida como barra y, antes de interpretar la URL, quita los tabuladores y
 * saltos de línea. `/\evil.example/b` y `/<TAB>/evil.example/c` pasaban por
 * relativos y el navegador los resolvía a `https://evil.example/...`: un enlace
 * fuera del sitio que se ve como de la casa, sin `target` ni `rel`. Por eso se
 * limpia primero y se exige que lo segundo no sea ni `/` ni `\`.
 */
const RELATIVO = /^(\/(?![/\\])|#)/;

/**
 * La URL lista para un `href`, o `null` si no pasa.
 *
 * `soloWeb` limita a http y https. Es para los enlaces que salen del sitio a una
 * publicación o a una red social, donde un `mailto:` o un `tel:` no tienen sentido.
 */
export function hrefSeguro(
  crudo: string | null | undefined,
  { soloWeb = false }: { soloWeb?: boolean } = {},
): string | null {
  const url = (crudo ?? '').replace(/[\t\n\r]/g, '').trim();
  if (!url) return null;
  if (RELATIVO.test(url)) return soloWeb ? null : url;
  if (!(soloWeb ? ESQUEMAS_WEB : ESQUEMAS_ABSOLUTOS).test(url)) return null;
  try {
    new URL(url);
  } catch {
    return null; // un esquema válido con una URL que no parsea no es un enlace
  }
  return url;
}
