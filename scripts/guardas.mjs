#!/usr/bin/env node
/**
 * Guardas de CI.
 *
 * Cada una existe por un error que ya costó algo en esta casa (aquí o en
 * web-beat, de donde se heredan), no por prolijidad.
 *
 * Regla de esta herramienta: **cero falsos positivos**. Una guarda que grita
 * por cosas correctas se desactiva a la semana, y entonces no protege de nada —
 * peor que no tenerla. Por eso los patrones son estrechos y hay una salida
 * explícita (`guarda-ok:`) que OBLIGA a escribir la razón en el mismo archivo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const fuentes = globSync('src/**/*.{ts,tsx,js,astro}');
const fallos = [];

for (const archivo of fuentes) {
  const texto = readFileSync(archivo, 'utf8');
  const lineas = texto.split('\n');

  /*
   * Salida explícita: `guarda-ok <regla>: <razón>` en cualquier parte del archivo.
   *
   * Es por ARCHIVO y por REGLA, no por línea, y a propósito. Cuando el hallazgo
   * cae en un ATRIBUTO de una etiqueta no hay dónde poner un comentario en la
   * misma línea —Astro no admite comentarios dentro de la lista de atributos—, y
   * obligar a ello empujaría a desactivar la guarda entera. Nombrar la regla evita
   * que una exención escrita para una cosa tape otra distinta, y la razón queda
   * escrita y revisable en el diff.
   */
  const eximida = (regla) => new RegExp(`guarda-ok\\s+${regla}:\\s*\\S`).test(texto);

  lineas.forEach((linea, i) => {
    const ubic = `${archivo}:${i + 1}`;

    /*
     * El ad unit de GAM, escrito en el código.
     *
     * Hoy esta base no tiene anuncios, y la regla se queda para el día que los
     * tenga. Las estaciones de NRM comparten la red de Ad Manager y cada una tiene
     * su ad unit —el de esta es el de Stereo Cien—, así que escribirlo a mano es
     * la puerta del copy-paste entre repos hermanos: servir impresiones de una
     * estación a la cuenta de otra es un bug de DINERO que nadie ve hasta la
     * facturación. Heredado de web-beat, que documenta la ruta del ad unit de
     * Stereo Cien pegada por copy-paste en repos de otras estaciones. Va siempre
     * por env.
     *
     * El patrón busca una RUTA de ad unit (`/` + 8-12 dígitos + `/`), no un
     * número largo suelto: así un `program_id` en un comentario no dispara.
     */
    if (!eximida('ad-unit') && /["'`][^"'`]*\/\d{8,12}\/[^"'`]*["'`]/.test(linea)) {
      fallos.push(`${ubic}  ruta de ad unit escrita en el código. Va por env (en web-beat: PUBLIC_GAM_NETWORK_ID / PUBLIC_GAM_AD_UNIT).`);
    }

    /*
     * `set:html` con contenido que venga del CMS es XSS almacenado: basta que
     * alguien con acceso al editor escriba un `<script>`. El renderizador de
     * Lexical saca el texto COMO TEXTO, así que en la práctica no hace falta.
     *
     * Se busca el atributo (`set:html=`), no la palabra: los comentarios que
     * explican por qué NO se usa mencionan el nombre y no deben disparar.
     */
    if (!eximida('set:html') && /set:html\s*=/.test(linea)) {
      fallos.push(`${ubic}  set:html — si el valor viene del CMS es XSS. Si es una constante nuestra, anótalo con "guarda-ok set:html: <razón>".`);
    }
  });
}

/*
 * El 404 tiene que renderizarse en el servidor.
 *
 * Una URL vieja (`/autos/<slug>/`) no tiene ruta en el sitio nuevo, y el
 * middleware solo corre para ella porque Astro renderiza el 404 con él. Con
 * `prerender = true` Astro sirve el 404 como archivo estático, el middleware no
 * corre y el mapa de 301 del sitio viejo queda muerto sin que nada falle: cada
 * enlace viejo cae en el 404 con el mapa lleno. Ver `src/middleware.ts`.
 */
const PAGINA_404 = 'src/pages/404.astro';
if (existsSync(PAGINA_404) && /export\s+const\s+prerender\s*=\s*true\b/.test(readFileSync(PAGINA_404, 'utf8'))) {
  fallos.push(`${PAGINA_404}  prerender = true: con el 404 estático el middleware no corre en las URLs sin ruta y los 301 del sitio viejo mueren.`);
}

/*
 * El mapa de 301 del sitio viejo (`src/config/redirecciones/sitio-viejo.json`).
 *
 * Lo genera el importador de cms-estaciones y nadie lo lee a mano, así que esta
 * guarda es la única revisión que tiene. Cada regla es un modo de falla con
 * consecuencia en el navegador de un lector real, porque un 301 se queda cacheado:
 *
 *   · clave sin normalizar   → nunca coincide con ninguna petición: el 301 no existe
 *   · destino fuera de /noticias/<slug> → no es una nota, o daría un segundo salto
 *   · destino que también es origen → CADENA de redirecciones
 *   · origen igual a su destino → BUCLE: ERR_TOO_MANY_REDIRECTS
 *   · origen bajo /noticias/ → taparía una nota VIVA del sitio nuevo, porque el
 *     mapa se consulta antes que cualquier ruta
 *   · clave repetida → `JSON.parse` se queda con la última en silencio
 */
const MAPA = 'src/config/redirecciones/sitio-viejo.json';

/**
 * La MISMA normalización que `normalizarRutaVieja` en
 * `src/config/redirecciones/sitio-viejo.ts` (este archivo no puede importar TS).
 * Si se toca allá, se toca aquí: una clave que esta guarda da por buena y el
 * middleware no encuentra es un 301 que no existe.
 */
function normalizarRutaVieja(pathname) {
  let ruta = pathname;
  try {
    ruta = decodeURIComponent(ruta);
  } catch {
    // escape roto: se compara tal cual, igual que en el middleware
  }
  const sinBarra = ruta.normalize('NFC').replace(/\/+$/, '');
  return sinBarra === '' ? '/' : sinBarra;
}

/*
 * El destino es una nota: `/noticias/` + un solo segmento, sin barra final (sería
 * un segundo 301), sin query ni `#`, y en ASCII imprimible. Lo último no es
 * estética: el destino viaja en la cabecera `Location`, y un carácter fuera de
 * ASCII ahí o revienta la respuesta o llega mal codificado. Un slug con acentos va
 * escapado (`%C3%B1`).
 */
const DESTINO_VALIDO = /^\/noticias\/[\x21-\x7e]+$/;
const destinoValido = (d) => DESTINO_VALIDO.test(d) && !/[/?#]/.test(d.slice('/noticias/'.length));

let totalRutas = 0;
if (!existsSync(MAPA)) {
  fallos.push(`${MAPA}  no existe. src/config/redirecciones/sitio-viejo.ts lo importa: sin él no compila.`);
} else {
  const crudo = readFileSync(MAPA, 'utf8');
  let doc = null;
  try {
    doc = JSON.parse(crudo);
  } catch (e) {
    fallos.push(`${MAPA}  no es JSON válido: ${e.message}`);
  }

  const rutas = doc?.rutas;
  if (doc && (typeof rutas !== 'object' || rutas === null || Array.isArray(rutas))) {
    fallos.push(`${MAPA}  falta el objeto "rutas" ({ origen: destino }).`);
  } else if (doc) {
    const entradas = Object.entries(rutas);
    totalRutas = entradas.length;
    const origenes = new Set(Object.keys(rutas));

    for (const [origen, destino] of entradas) {
      const ubic = `${MAPA}  "${origen}"`;

      if (typeof destino !== 'string') {
        fallos.push(`${ubic}  el destino no es texto.`);
        continue;
      }
      if (!origen.startsWith('/') || origen === '/') {
        fallos.push(`${ubic}  el origen tiene que ser una ruta que empiece con "/" y no sea la raíz.`);
      } else if (/[?#]/.test(origen)) {
        fallos.push(`${ubic}  el origen lleva query o "#": el middleware busca solo la ruta, así que nunca coincidiría.`);
      } else if (normalizarRutaVieja(origen) !== origen) {
        fallos.push(`${ubic}  origen sin normalizar: el middleware lo buscaría como "${normalizarRutaVieja(origen)}" (sin barra final, escapes decodificados, NFC).`);
      }
      if (origen === destino) {
        fallos.push(`${ubic}  BUCLE: el origen es su propio destino.`);
      } else if (/^\/noticias(\/|$)/.test(origen)) {
        fallos.push(`${ubic}  origen bajo /noticias/: taparía una nota viva del sitio nuevo.`);
      }
      if (!destinoValido(destino)) {
        fallos.push(`${ubic}  destino "${destino}" no es "/noticias/<slug>" (un segmento, sin barra final ni query, en ASCII).`);
      }
      if (origenes.has(destino)) {
        fallos.push(`${ubic}  CADENA: el destino "${destino}" también es origen de otro 301.`);
      }
    }

    /*
     * Claves repetidas en el TEXTO. Se leen como «cadena JSON seguida de `:`», que
     * en este archivo solo pueden ser claves (los valores van seguidos de `,`, `}` o
     * `]`), y se decodifican con el propio `JSON.parse` para comparar lo mismo que
     * compara el objeto.
     */
    const vistas = new Set();
    for (const m of crudo.matchAll(/"((?:[^"\\]|\\.)*)"\s*:/g)) {
      const clave = JSON.parse(`"${m[1]}"`);
      if (!clave.startsWith('/') || clave === '//') continue;
      if (vistas.has(clave)) fallos.push(`${MAPA}  "${clave}"  clave repetida: JSON.parse se queda con la última en silencio.`);
      vistas.add(clave);
    }
  }
}

if (fallos.length) {
  console.error(`\nguardas: FALLA, ${fallos.length} hallazgo(s)\n` + fallos.map((f) => '  ' + f).join('\n') + '\n');
  process.exit(1);
}
console.log(`guardas: sin hallazgos (${fuentes.length} archivos, ${totalRutas} redirecciones del sitio viejo).`);
