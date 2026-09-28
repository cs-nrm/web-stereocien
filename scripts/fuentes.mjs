/**
 * Baja las webfonts a `public/fuentes/` y genera `src/styles/fuentes.css`.
 *
 * Se corre A MANO (`pnpm fuentes`) y la salida se commitea: el build no baja
 * nada de Google, y así el sitio no depende de que Google responda el día que se
 * construye la imagen.
 *
 * Solo los subconjuntos `latin` y `latin-ext`: el español no necesita más, y el
 * `unicode-range` hace que `latin-ext` solo se descargue si aparece un carácter
 * que lo requiera, así que incluirlo es gratis en tiempo de ejecución.
 *
 * Heredado de web-beat, con una diferencia: allá las tres familias eran
 * VARIABLES y cada archivo se nombraba `-var`. Aquí no todas lo son, y lo que
 * devuelve Google depende de lo que se le pida (verificado con curl el
 * 2026-09-28):
 *   · Montserrat pedida en un solo peso (`wght@900`) llega como archivo ESTÁTICO
 *     de ese peso, más chico que el variable completo. Es lo que conviene: el
 *     diseño solo usa el 900.
 *   · Roboto y Libre Baskerville (redonda) son variables: pedidas en rango
 *     (`400..700`) llegan como UN archivo por subconjunto que cubre todos los
 *     pesos. Pedidas por pesos sueltos Google devuelve ese mismo archivo repetido
 *     en tres `@font-face`, o sea lo mismo con más texto.
 *   · La itálica de Libre Baskerville se pide solo en 400 (los balazos) y llega
 *     estática.
 * Por eso el archivo se nombra por familia, PESO y estilo (`roboto-400-700-latin`),
 * no por «variable o no», y se baja una sola vez aunque dos bloques lo compartan.
 *
 * Y la display NO es la de marca. El diseño pide Lovelo Black (§8 del handoff),
 * que no está disponible: no hay archivo en el paquete de diseño ni licencia para
 * servirla en web. Hasta que llegue, la display es Montserrat 900, que es la
 * alternativa que el propio diseño declara (`'Lovelo', 'Montserrat', sans-serif`).
 * El día que llegue la licencia: se pone el `.woff2` de Lovelo Black en
 * `public/fuentes/`, se cambia la entrada de Montserrat de abajo (o su `@font-face`
 * a mano si no viene de Google) y la familia de `--font-display` en
 * `src/styles/tokens.css`. Nada más cambia.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const DEST = 'public/fuentes';
const SUBSETS = new Set(['latin', 'latin-ext']);

/**
 * Lo que el diseño usa de verdad (§8 del handoff), y ni un peso más:
 *   · Montserrat 900 — display, siempre en mayúsculas (sustituta de Lovelo).
 *   · Libre Baskerville 400 y 700, e itálica 400 — el texto editorial; los
 *     balazos van en itálica.
 *   · Roboto 400 a 700 — interfaz y etiquetas (el diseño usa 400, 500 y 700).
 *
 * `archivo` es el prefijo del nombre local. Las cuatro son SIL Open Font License
 * 1.1, que permite auto-hospedarlas y redistribuirlas.
 */
const FAMILIAS = [
  { nombre: 'Montserrat', consulta: 'Montserrat:wght@900', archivo: 'montserrat' },
  {
    nombre: 'Libre Baskerville',
    consulta: 'Libre+Baskerville:ital,wght@0,400..700;1,400',
    archivo: 'libre-baskerville',
  },
  { nombre: 'Roboto', consulta: 'Roboto:wght@400..700', archivo: 'roboto' },
];

await mkdir(DEST, { recursive: true });

const bloques = [];
/** URL de Google → nombre local, para no bajar dos veces el mismo archivo. */
const bajados = new Map();
let totalBytes = 0;

for (const fam of FAMILIAS) {
  const url = `https://fonts.googleapis.com/css2?family=${fam.consulta}&display=swap`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Google Fonts respondió ${res.status} para ${fam.nombre}`);
  const css = await res.text();

  // Cada @font-face viene precedido por un comentario con el nombre del subset.
  const encontrados = [...css.matchAll(/\/\*\s*([\w[\]-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
  if (!encontrados.length) throw new Error(`No pude parsear el CSS de ${fam.nombre}`);
  let n = 0;

  for (const [, subset, bloque] of encontrados) {
    if (!SUBSETS.has(subset)) continue;
    const campo = (re) => (bloque.match(re) || [])[1]?.trim();
    const peso = campo(/font-weight:\s*([^;]+);/) ?? '400';
    const estilo = campo(/font-style:\s*([^;]+);/) ?? 'normal';
    const ancho = campo(/font-stretch:\s*([^;]+);/);
    const rango = campo(/unicode-range:\s*([^;]+);/);
    const urlFuente = campo(/url\((https:[^)]+)\)/);
    if (!urlFuente) continue;

    const italica = estilo.startsWith('italic') || estilo.startsWith('oblique');
    const nombreLocal = `${fam.archivo}-${peso.replace(/\s+/g, '-')}${italica ? '-italica' : ''}-${subset}.woff2`;

    if (!bajados.has(urlFuente)) {
      const bin = Buffer.from(
        await (await fetch(urlFuente, { headers: { 'User-Agent': UA } })).arrayBuffer(),
      );
      await writeFile(`${DEST}/${nombreLocal}`, bin);
      bajados.set(urlFuente, nombreLocal);
      totalBytes += bin.length;
      n++;
      console.log(
        `  ${nombreLocal.padEnd(46)} ${(bin.length / 1024).toFixed(1).padStart(6)} KB  (${estilo}, peso ${peso}${ancho ? `, ancho ${ancho}` : ''})`,
      );
    }
    const archivoLocal = bajados.get(urlFuente);

    bloques.push(
      [
        `/* ${fam.nombre} · ${subset} · ${estilo} · peso ${peso}${ancho ? ` · ancho ${ancho}` : ''} */`,
        `@font-face {`,
        `  font-family: '${fam.nombre}';`,
        `  font-style: ${estilo};`,
        `  font-weight: ${peso};`,
        ...(ancho ? [`  font-stretch: ${ancho};`] : []),
        `  font-display: swap;`,
        `  src: url('/fuentes/${archivoLocal}') format('woff2');`,
        ...(rango ? [`  unicode-range: ${rango};`] : []),
        `}`,
      ].join('\n'),
    );
  }
  console.log(`${fam.nombre}: ${n} archivos\n`);
}

const cabecera = `/* ============================================================
   WEBFONTS AUTO-HOSPEDADAS
   ------------------------------------------------------------
   Los tableros del diseño las cargan con un <link> a fonts.googleapis.com. Aquí
   no: los woff2 se sirven desde nuestro dominio, así que no hay DNS ni TLS a
   terceros antes del primer pintado, se cachean como cualquier otro archivo del
   sitio y no se le manda a Google la IP del lector en cada visita (heredado de
   web-beat, que ya lo hizo así).

   Tres familias: Montserrat 900 (display, sustituta de Lovelo Black mientras no
   haya licencia), Libre Baskerville (texto editorial, con itálica para los
   balazos) y Roboto (interfaz y etiquetas). El porqué de cada peso está en
   \`scripts/fuentes.mjs\`.

   GENERADO por \`scripts/fuentes.mjs\` — no editar a mano. Volver a correr
   \`pnpm fuentes\` si cambian las familias o los pesos, y revisar que los
   \`<link rel="preload">\` de \`src/layouts/Base.astro\` sigan apuntando a
   archivos que existen: se nombran por familia, peso y subconjunto.

   Licencias: las tres son SIL Open Font License 1.1, que permite auto-hospedarlas
   y redistribuirlas.
   ============================================================ */

`;

await writeFile('src/styles/fuentes.css', cabecera + bloques.join('\n\n') + '\n');
console.log(`TOTAL: ${(totalBytes / 1024).toFixed(1)} KB en ${bajados.size} archivos, ${bloques.length} @font-face`);
