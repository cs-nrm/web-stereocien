/**
 * La tarjeta de compartir de respaldo y el juego mínimo de favicon.
 *
 *   node scripts/tarjetas.mjs
 *
 * Se corre A MANO y la salida SE COMMITEA. No es parte del build: `sharp` es
 * dependencia de desarrollo y la imagen de producción no tiene por qué traerla,
 * y así lo que se sirve es exactamente lo que alguien miró antes de commitear.
 * Volver a correrlo cuando cambie cualquiera de las dos fuentes de abajo.
 *
 * Genera, y al final MIDE lo que escribió (no lo que pidió):
 *
 *   public/img/og-stereocien.png          1200×630 — el logo en blanco sobre #012169
 *   public/favicon/favicon-32x32.png      32×32
 *   public/favicon/apple-touch-icon.png   180×180, sobre blanco
 *   public/favicon/favicon.ico            16, 32 y 48 dentro de un solo .ico
 *   public/favicon.ico                    el mismo .ico, en la raíz
 *
 * El `.ico` va DOS veces a propósito. `/favicon/` es la carpeta de siempre del
 * sitio viejo (sus `<link>` apuntaban ahí) y es donde apuntan los del nuevo. La
 * copia de la raíz es para quien la pide sin leer el HTML —rastreadores, el
 * navegador al abrir un XML o un RSS—: sin ella, cada una de esas peticiones cae al
 * 404 del sitio, que es una página renderizada en el servidor con su consulta al
 * CMS, para servir un icono.
 *
 * No hay favicon SVG, y no por olvido: el único SVG de la marca es el logotipo
 * horizontal (`public/img/stereocien.svg`, 500×166), que a 16 o 32 px es una
 * raya ilegible. El icono cuadrado —el delfín sobre la ola— solo existe en PNG.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

/**
 * El logotipo, el MISMO archivo que pinta la cabecera, así que la tarjeta no se
 * puede quedar en una marca anterior sin que alguien lo note. Es la copia de
 * `edb21c7d…svg` del paquete de diseño (ver `assets/blob-map.csv` del handoff).
 */
const LOGO = 'public/img/stereocien.svg';

/**
 * El icono cuadrado: el delfín sobre la ola, 512×512 con transparencia.
 *
 * NO viene del paquete de diseño, que no trae ningún icono cuadrado. Es el
 * `android-chrome-512x512.png` del sitio viejo (rama `stereocien`,
 * `public/favicon/`), el mismo icono que hoy enseña la pestaña de
 * stereociendigital.mx: se conserva para que el cambio de sitio no le cambie el
 * icono a quien ya lo tiene en sus marcadores. Es la copia de mayor resolución que
 * existe de esa marca.
 */
const ICONO = 'public/img/stereocien-icono.png';

/** El azul de la barra del reproductor: `--color-azul-principal`. */
const AZUL = '#012169';

/** La medida de `MEDIDA_TARJETA` en `src/config/site.ts`. Si cambia aquí, cambia allá. */
const TARJETA = { ancho: 1200, alto: 630 };

await mkdir('public/img', { recursive: true });
await mkdir('public/favicon', { recursive: true });

/* ── La tarjeta de compartir ─────────────────────────────────────────────── */

/**
 * El logo en BLANCO, derivado del mismo SVG.
 *
 * El original es azul sobre transparente —las letras llevan un degradado que va
 * del cian al casi negro— y sobre #012169 se perdería entero. Se reemplazan los
 * dos rellenos de degradado por blanco y el gris del delfín se deja como está: es
 * el mismo gris de la marca y sobre el azul se lee.
 *
 * Se hace en memoria y no con un segundo SVG en `public/`: un archivo más es una
 * copia más que se puede quedar vieja.
 */
const svgOriginal = await readFile(LOGO, 'utf8');
const svgBlanco = svgOriginal.replace(/fill:url\(#[^)]+\)/g, 'fill:#FFFFFF');
if (svgBlanco === svgOriginal) {
  throw new Error(
    `No encontré los rellenos de degradado en ${LOGO}: si el logo cambió de forma, revisa este reemplazo antes de generar una tarjeta azul sobre azul.`,
  );
}

// El logo ocupa el 60 % del ancho: centrado y con aire, como una tarjeta de marca.
const anchoLogo = Math.round(TARJETA.ancho * 0.6);
const logo = await sharp(Buffer.from(svgBlanco), { density: 300 })
  .resize({ width: anchoLogo })
  .png()
  .toBuffer();
const { height: altoLogo = 0 } = await sharp(logo).metadata();

await sharp({
  create: { width: TARJETA.ancho, height: TARJETA.alto, channels: 4, background: AZUL },
})
  .composite([
    {
      input: logo,
      left: Math.round((TARJETA.ancho - anchoLogo) / 2),
      top: Math.round((TARJETA.alto - altoLogo) / 2),
    },
  ])
  .flatten({ background: AZUL })
  // Sin canal alfa: la tarjeta es opaca, y así no hay transparencia que una
  // plataforma pueda pintar de otro color.
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile('public/img/og-stereocien.png');

/* ── Los favicon ─────────────────────────────────────────────────────────── */

const icono = await readFile(ICONO);

/** El icono a una medida, con su transparencia. */
const aMedida = (lado) =>
  sharp(icono).resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

await writeFile('public/favicon/favicon-32x32.png', await aMedida(32));

/**
 * El de iOS va sobre BLANCO y con margen.
 *
 * iOS rellena de NEGRO la transparencia de un `apple-touch-icon`, y el delfín
 * azul oscuro sobre negro no se ve. El margen es porque iOS redondea las esquinas
 * del cuadro y se comería la cola del delfín.
 */
const ladoApple = 180;
const margenApple = 16;
await sharp({
  create: { width: ladoApple, height: ladoApple, channels: 4, background: '#ffffff' },
})
  .composite([{ input: await aMedida(ladoApple - margenApple * 2), left: margenApple, top: margenApple }])
  .flatten({ background: '#ffffff' })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile('public/favicon/apple-touch-icon.png');

/**
 * Un `.ico` con tres PNG dentro.
 *
 * `sharp` no escribe `.ico`, y el formato es lo bastante chico como para
 * armarlo aquí sin otra dependencia: una cabecera de 6 bytes, una entrada de 16
 * por imagen y luego los PNG tal cual. Desde Windows Vista un `.ico` puede llevar
 * PNG en vez de mapas de bits, y todos los navegadores lo leen.
 */
async function ico(lados) {
  const imagenes = await Promise.all(lados.map(aMedida));
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0); // reservado
  cabecera.writeUInt16LE(1, 2); // 1 = icono
  cabecera.writeUInt16LE(imagenes.length, 4);
  const entradas = [];
  let desplazamiento = 6 + 16 * imagenes.length;
  imagenes.forEach((png, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(lados[i] >= 256 ? 0 : lados[i], 0); // ancho (0 = 256)
    e.writeUInt8(lados[i] >= 256 ? 0 : lados[i], 1); // alto
    e.writeUInt8(0, 2); // colores de paleta: ninguno
    e.writeUInt8(0, 3); // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(desplazamiento, 12);
    desplazamiento += png.length;
    entradas.push(e);
  });
  return Buffer.concat([cabecera, ...entradas, ...imagenes]);
}

const favicon = await ico([16, 32, 48]);
await writeFile('public/favicon/favicon.ico', favicon);
await writeFile('public/favicon.ico', favicon);

/* ── Lo que se escribió, MEDIDO ──────────────────────────────────────────── */

/**
 * Se leen de vuelta los archivos, no los números que se le pidieron a `sharp`:
 * las medidas de la tarjeta viajan en `og:image:width/height`, y unas medidas que
 * no correspondan al archivo son peores que ninguna (ver `MEDIDA_TARJETA`).
 */
for (const ruta of [
  'public/img/og-stereocien.png',
  'public/favicon/favicon-32x32.png',
  'public/favicon/apple-touch-icon.png',
]) {
  const m = await sharp(ruta).metadata();
  const peso = (await readFile(ruta)).length;
  console.log(`${ruta.padEnd(40)} ${m.width}×${m.height}  ${(peso / 1024).toFixed(1)} KB`);
}
{
  const bin = await readFile('public/favicon/favicon.ico');
  const n = bin.readUInt16LE(4);
  const lados = Array.from({ length: n }, (_, i) => bin.readUInt8(6 + 16 * i) || 256);
  console.log(`${'public/favicon/favicon.ico'.padEnd(40)} ${lados.join(', ')}  ${(bin.length / 1024).toFixed(1)} KB`);
}

const og = await sharp('public/img/og-stereocien.png').metadata();
if (og.width !== TARJETA.ancho || og.height !== TARJETA.alto) {
  throw new Error(`La tarjeta salió de ${og.width}×${og.height}, no de ${TARJETA.ancho}×${TARJETA.alto}.`);
}
