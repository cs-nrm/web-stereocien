/**
 * Datos estructurados — JSON-LD.
 *
 * La regla que gobierna este archivo: **el JSON-LD no puede afirmar nada que la
 * página no pinte.** Un `datePublished` que no sea la fecha visible, o un `author`
 * distinto de la firma, no es un dato de más: Google lo trata como marcado
 * engañoso y con eso se pierde la ficha entera, no solo la propiedad. Por eso todo
 * lo que se emite sale del MISMO valor que ya usa el marcado —`firma()`,
 * `fechaIso()`, `seccionDeNota()`— y nunca de una segunda fuente.
 *
 * Y la segunda: **un dato que no existe se OMITE.** Cuando la firma de una nota
 * viene del campo de texto libre y no del catálogo de `autores`, no hay página de
 * autor que enlazar: un `author.url` de relleno sería una URL que responde 404. De eso
 * se encarga `serializar` por todos —cualquier propiedad en `null` desaparece del
 * JSON—, así que un builder puede escribir `?? null` sin condicionales.
 *
 * Toda URL va ABSOLUTA y contra `SITE_URL`, nunca contra el host que sirve. Es
 * lo mismo que ya hacen la canónica y `og:image`, y por la misma razón: lo que se
 * publica apunta al sitio real, no al staging que lo esté sirviendo.
 */
import { IDIOMA_REGION, SITE_URL, TARJETA_COMPARTIR, urlAbsoluta } from '@/config/site';

/** Un nodo de schema.org, antes de podarle los huecos. */
export type Nodo = Record<string, unknown>;

/**
 * `@id` estable de la estación, y por eso lleva `SITE_URL` y no una cadena
 * suelta: es la MISMA entidad cuando el Inicio la describe entera y cuando una
 * nota la nombra como su `publisher`. Sin un id compartido, Google ve dos
 * organizaciones que se llaman igual.
 */
export const ID_ESTACION = `${SITE_URL}/#estacion`;

/**
 * El nombre de la marca, escrito una vez.
 *
 * Es constante y no el `nombre` del CMS a propósito: tiene que ser el mismo valor
 * que fijan `og:site_name` y el sufijo de cada `<title>` en el layout, y los tres
 * tienen que decir lo mismo. Coincide con `estaciones.nombre` del CMS
 * («Stereo Cien 100.1»), y la frecuencia viaja en él. El nombre de PUBLICACIÓN del
 * CMS (`STEREO CIEN`) sí entra, pero como `alternateName`.
 */
const NOMBRE = 'Stereo Cien 100.1';

/**
 * El logo, como URL del sitio. Tiene que ser el MISMO archivo que pinta la
 * cabecera, por la razón de `nodoPublicador`.
 */
const LOGO = '/img/stereocien.svg';

/**
 * El JSON listo para el atributo.
 *
 * Hace dos cosas que no son cosméticas:
 *
 * 1. **Poda los huecos.** Una propiedad en `null` se cae del documento en vez de
 *    salir vacía. Es la regla de arriba, aplicada en un solo sitio.
 * 2. **Escapa `<` como `\u003c`.** El contenido viene del CMS, y basta un
 *    `</script>` dentro de un titular para que el navegador cierre el bloque ahí
 *    mismo: el JSON-LD se rompe y el resto del titular se pinta como HTML. Con el
 *    escape, el analizador de JSON lo devuelve como texto y el de HTML nunca ve
 *    una etiqueta. Es la razón por la que este archivo existe y no se llama a
 *    `JSON.stringify` en cada página.
 */
export function serializar(nodos: Nodo[]): string {
  const doc =
    nodos.length === 1
      ? { '@context': 'https://schema.org', ...nodos[0] }
      : { '@context': 'https://schema.org', '@graph': nodos };
  return JSON.stringify(doc, (_clave, valor) =>
    valor === null || valor === undefined ? undefined : valor,
  ).replace(/</g, '\\u003c');
}

/**
 * La estación como PUBLICADOR: la identidad mínima con la que una nota la nombra.
 *
 * `RadioStation` y no `Organization` porque es lo que es —y `RadioStation` hereda
 * de `Organization`, así que sigue siendo válida donde schema.org pide una
 * organización, como el `publisher` de un `NewsArticle`—.
 *
 * El `logo` sí puede ser SVG; la prohibición de SVG es de `og:image`, que la
 * leen Facebook y X. Google Imágenes acepta SVG, y así el logo del JSON-LD sale
 * del mismo archivo que el de la cabecera y no puede quedarse en una marca
 * anterior.
 */
export function nodoPublicador(): Nodo {
  return {
    '@type': 'RadioStation',
    '@id': ID_ESTACION,
    name: NOMBRE,
    url: urlAbsoluta('/'),
    logo: urlAbsoluta(LOGO),
  };
}

/**
 * La estación descrita ENTERA. Va solo en el Inicio.
 *
 * Solo ahí, y es deliberado: la ficha de la estación es la de una página —la
 * portada— y repetirla en cada ruta no añade nada que Google no vaya a leer una
 * vez. Las demás páginas nombran la misma entidad por su `@id` cuando la necesitan
 * (ver `nodoPublicador`).
 *
 * Todo lo que afirma está verificado: la razón social, el domicilio y el grupo
 * salen del aviso de privacidad del sitio viejo (`avisodeprivacidad` en la rama
 * `stereocien`), y NRM Comunicaciones además del pie y del `<meta publisher>` del
 * mismo sitio. No se agrega `broadcastFrequency` —que sería el dato más obvio de
 * una estación— porque en schema.org es propiedad de `BroadcastService`, no de
 * `RadioStation`; los 100.1 ya viajan en el `name`.
 *
 * Lo que se OMITE a propósito, por la regla de arriba:
 *  - `callSign`. Ningún texto del sitio viejo dice cuál es el indicativo. La razón
 *    social se llama «Radio XHMM-FM», y eso apunta a uno, pero el nombre de una
 *    sociedad no es una afirmación sobre la concesión; hasta que se confirme, no
 *    va. Tampoco sale de `estaciones.tritonMount` (`XEOYAM`): un mount es el nombre
 *    de un flujo en Triton, y este en particular es el de Stereo Cien Digital, no
 *    el de la frecuencia.
 *  - `areaServed`. Lo que suena en este sitio es Stereo Cien Digital, un flujo
 *    solo de música; por la frecuencia abierta del 100.1 FM va la programación de
 *    Enfoque Noticias (lo dice `estaciones.notaStream` en el CMS). Declarar la
 *    cobertura de la antena sería describir otra cosa que la que la página toca.
 *
 * Este nodo es de STEREO CIEN: razón social y domicilio son suyos. El día que este
 * código sirva a otra estación, es lo primero que se cambia.
 *
 * `sameAs` recibe las redes YA RESUELTAS por `redesEstacion()`, las mismas que
 * pinta el pie. No se leen de `REDES_RESPALDO`: si mañana el CMS trae otra cuenta
 * de Facebook, el pie y el JSON-LD tienen que seguir enlazando a la misma.
 */
export function nodoEstacion(datos: {
  nombrePublico?: string | null;
  redes?: readonly string[];
}): Nodo {
  return {
    ...nodoPublicador(),
    alternateName: datos.nombrePublico ?? null,
    legalName: 'RADIO XHMM-FM, S.A. DE C.V.',
    image: {
      '@type': 'ImageObject',
      url: urlAbsoluta(TARJETA_COMPARTIR.ruta),
      width: TARJETA_COMPARTIR.ancho,
      height: TARJETA_COMPARTIR.alto,
    },
    /*
      El domicilio fiscal, repartido como lo pide `PostalAddress`. La colonia va
      dentro de `streetAddress` porque schema.org no tiene un campo para ella, y
      `addressLocality` lleva la alcaldía: es el nivel que sigue al C.P. en una
      dirección mexicana.

      El aviso de privacidad dice «México Distrito Federal», el nombre de antes
      de 2016, y es texto legal que no es nuestro para reescribirlo. Aquí va el
      nombre vigente: esto no es el aviso, es un dato que se le da a un buscador.
    */
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Prolongación Paseo de la Reforma No 115, Col. Paseo de las Lomas',
      postalCode: '01330',
      addressLocality: 'Álvaro Obregón',
      addressRegion: 'Ciudad de México',
      addressCountry: 'MX',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'NRM COMUNICACIONES',
      url: 'https://nrm.com.mx',
    },
    sameAs: datos.redes && datos.redes.length > 0 ? [...datos.redes] : null,
  };
}

/**
 * La nota como `NewsArticle`.
 *
 * Cada propiedad viene del valor que la página YA pinta:
 *   · `headline` y `description` → el `h1` y la bajada
 *   · `datePublished` → el mismo ISO del `<time datetime>` visible
 *   · `author` → `firma(nota)`, la de la ficha del pie
 *   · `image` → la misma variante que carga el `<img>` del hero
 *
 * Y por eso `headline` NO recibe `meta.title` del CMS, ni `image` la
 * `meta.image`, aunque el `<title>` y la `og:image` de la misma nota sí los usen
 * (decisión de Carlos en web-beat, 2026-09-07; la aplica
 * `src/pages/noticias/[slug].astro`). No es una inconsistencia, es la línea entre
 * dos cosas distintas: el `<title>` y la tarjeta de compartir son PROMOCIÓN —pueden decirlo más corto o con otra foto, y
 * para eso existe ese grupo del CMS—, mientras que el JSON-LD es una AFIRMACIÓN
 * sobre lo que hay en la página. Un `headline` que no sea el `h1` visible es
 * exactamente el marcado que Google lee como engañoso, y ahí no se pierde la
 * propiedad: se pierde la ficha entera.
 *
 * `dateModified` es la única que no está en pantalla, y sale de `updatedAt` del
 * CMS. Es un dato verdadero y Google lo usa para saber si vale la pena volver;
 * omitirlo haría que una nota corregida siguiera pareciendo la de ayer.
 *
 * Las medidas de la imagen se pasan SOLO si el CMS las trae para la variante
 * que se está sirviendo (ver `medidaMedia`). Unas medidas inventadas son peores
 * que ninguna: Google recorta la tarjeta con ellas.
 */
export function nodoNota(datos: {
  canonica: string;
  titulo: string;
  resumen?: string | null;
  imagen?: string | null;
  imagenAncho?: number | null;
  imagenAlto?: number | null;
  publicado?: string | null;
  modificado?: string | null;
  autor?: string | null;
}): Nodo {
  return {
    '@type': 'NewsArticle',
    mainEntityOfPage: { '@type': 'WebPage', '@id': datos.canonica },
    url: datos.canonica,
    headline: datos.titulo,
    description: datos.resumen ?? null,
    inLanguage: IDIOMA_REGION,
    image: datos.imagen
      ? {
          '@type': 'ImageObject',
          url: datos.imagen,
          width: datos.imagenAncho ?? null,
          height: datos.imagenAlto ?? null,
        }
      : null,
    datePublished: datos.publicado ?? null,
    dateModified: datos.modificado ?? datos.publicado ?? null,
    author: datos.autor ? { '@type': 'Person', name: datos.autor } : null,
    publisher: nodoPublicador(),
  };
}

/**
 * La migaja, con los mismos eslabones que la de pantalla.
 *
 * Los `nombre` van en la forma NORMAL del nombre —«Comida y guías», «Vinilos»—,
 * no en mayúsculas (decisión de Carlos en web-beat, 2026-09-07). Allá la migaja
 * copiaba el `rotulo` de la sección y salía en mayúsculas, que es lo que Google
 * enseña literalmente al lector encima del resultado. Es la misma palabra: la
 * mayúscula es el `text-transform: uppercase` de la pastilla, una decisión de CSS,
 * y no tiene por qué acabar dentro de un resultado de búsqueda.
 *
 * Y no es una «versión arreglada» de lo que dice el DOM: el marcado visible
 * también escribe el nombre en su forma normal y deja el aspecto al CSS, así que
 * los dos siguen diciendo lo mismo. Eso es lo que importa — una migaja que no
 * coincida con la visible es justo el marcado que Google penaliza. Por eso la
 * página arma estos pasos con la misma fuente que su migaja visible.
 *
 * Devuelve `null` con menos de dos pasos: una migaja de un solo eslabón no dice
 * nada que la canónica no diga ya.
 */
export function nodoMigaja(pasos: Array<{ nombre: string; url: string }>): Nodo | null {
  if (pasos.length < 2) return null;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: pasos.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.nombre,
      item: p.url,
    })),
  };
}
