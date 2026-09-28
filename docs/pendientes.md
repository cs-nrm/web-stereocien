# Pendientes — stereocien-v2

Lo que falta para que el sitio nuevo salga al aire, agrupado por quién lo
desbloquea. Estado al 2026-09-28. Lo que ya se decidió, con su porqué, está en
[decisiones.md](decisiones.md); cómo arrancar, en [README.md](../README.md).

## Lo más urgente

**El inventario de URLs del docroot del sitio viejo (IN-1), porque es lo único de
esta lista que se puede perder.** El despliegue del sitio viejo es aditivo: sube
el build encima del docroot sin borrar lo que sobra. Su build solo publica las
últimas 100 notas por sección (932 hoy), así que el servidor sigue respondiendo
200 con notas que ya ningún build genera y que ningún sitemap lista —el sitio
viejo no tiene: `/sitemap.xml` da 404—. Esa lista es la única contra la que se
puede comprobar el mapa de 301 (CMS-2). Si alguien limpia el docroot, o el corte
de dominio llega antes de levantarla, esas URLs se quedan sin 301 y nadie va a
saber cuáles eran.

**Lo segundo es la migración del WordPress (CMS-1), porque bloquea casi todo lo
demás.** Hoy Stereo Cien tiene 0 notas, 0 categorías, 0 programas, 0 podcasts y
0 promociones en el CMS. Sin eso no hay mapa de 301, ni secciones que maquetar
contra datos reales, ni programación.

Cada punto dice qué falta, por qué importa, qué bloquea y dónde está anotado en el
código. Los identificadores (IN-1, CMS-2…) son para citarlos entre sí y en los
commits; no cambian aunque se reordene la lista. Un punto resuelto se tacha y se
dice con qué commit, no se borra.

---

## Infraestructura (Carlos, con quien tenga acceso al servidor)

### IN-1 · Levantar el inventario de URLs del docroot del Apache viejo, antes de tocarlo

- **Qué falta:** listar todo lo que el docroot del sitio viejo sirve hoy (cada
  `/<seccion>/<slug>/` que exista como archivo), no solo lo que genera el build.
- **Por qué importa:** es la lista real de URLs viejas que responden 200. El mapa
  de 301 lo genera el importador a partir de lo que se cargó (CMS-2); sin esta
  lista no hay forma de saber qué URL vieja quedó sin 301 hasta que caiga en el
  404 el día del corte. Ver «Lo más urgente».
- **Bloquea:** comprobar el mapa de 301; limpiar el servidor.
- **Anotado:** la normalización de
  [`src/config/redirecciones/sitio-viejo.ts`](../src/config/redirecciones/sitio-viejo.ts)
  ya cuenta con los slugs «que su despliegue aditivo dejó en el servidor».

### IN-2 · El proceso de Node detrás del Apache

- **Qué falta:** el servicio de Node con el build de esta rama; el vhost de
  Apache como proxy inverso con `ProxyPreserveHost On` y
  `RequestHeader set X-Forwarded-Proto "https"` (mod_headers); y `CMS_URL` en el
  entorno del PROCESO.
- **Por qué importa:** sin `ProxyPreserveHost`, Node recibe el `Host` del backend
  y trata al sitio real como un despliegue de prueba: sale en `noindex` y sin
  medición. Sin `X-Forwarded-Proto`, Node ve `http:` y `checkOrigin` responde 403
  a todo `POST`. Apache no la manda por omisión y el vhost molde de web-beat
  (web-beat: `deploy/apache/020-beatdigital.conf`) tampoco la pone. Medido el
  2026-09-28 contra un build servido. Sin `CMS_URL`, el sitio responde 200 con
  la casa vacía y sin error visible; `pnpm preview` y el servicio no cargan
  `.env`.
- **Cómo se comprueba al montarlo:** `curl -sI https://stereociendigital.mx/` no
  trae `X-Robots-Tag`, y un POST de formulario con
  `Origin: https://stereociendigital.mx` no responde 403.
- **Bloquea:** el corte de dominio, IN-3.
- **Anotado:** `noIndexarHost` y el aviso de `CMS_URL` en
  [`src/config/site.ts`](../src/config/site.ts); `allowedDomains` en
  [`astro.config.mjs`](../astro.config.mjs).

### IN-3 · Un staging de verdad

- **Qué falta:** un entorno con proceso, puerto y build propios, con su nombre
  dentro de `security.allowedDomains`.
- **Por qué importa:** sin él no hay dónde probar antes del corte (web-beat
  tampoco lo tiene: su «preproducción» era el mismo proceso con otro nombre). Un
  staging sale `noindex`, que es lo correcto. Su vhost necesita lo mismo que el
  del sitio real (IN-2): sin `X-Forwarded-Proto`, o fuera de `allowedDomains`
  detrás de un proxy que reescriba el `Host`, da 403 en todo `POST`. Y lo que se comparta desde ahí sale sin imagen mientras
  `stereociendigital.mx` siga sirviendo el sitio viejo, porque la tarjeta de
  respaldo se resuelve contra el dominio canónico.
- **Bloquea:** probar el corte, los formularios (FR-5) y el reproductor en un
  entorno real.
- **Anotado:** `allowedDomains` en [`astro.config.mjs`](../astro.config.mjs);
  `TARJETA_COMPARTIR` en [`src/config/site.ts`](../src/config/site.ts).

### IN-4 · Un CDN delante

- **Qué falta:** un borde que cachee el HTML.
- **Por qué importa:** hoy no hay ninguno (`Server: Apache`, ni una cabecera de
  CDN, 2026-09-28). Las cabeceras `s-maxage` y `stale-while-revalidate` que pone
  el middleware solo compran algo si hay quien las respete; sin borde, cada
  petición llega al SSR. La auditoría del sitio viejo (CA-6) ya advertía que así
  el sitio nuevo serviría más lento que el estático de hoy. Con Cloudflare además
  hace falta su Cache Rule (por omisión no cachea documentos), y esa regla no se
  enciende mientras no exista la purga al publicar.
- **Bloquea:** aguantar el tráfico del corte sin cargar el origen.
- **Anotado:** `CACHE_HTML` en [`src/middleware.ts`](../src/middleware.ts).

### IN-5 · `www.stereociendigital.mx` no resuelve en DNS

- **Qué falta:** decidir si se apunta, y si se apunta, con un 301 al dominio sin
  `www`.
- **Por qué importa:** ya está en `allowedDomains`, pero no es el host canónico:
  apuntado sin 301, serviría el sitio entero en `noindex` y sin medición.
- **Bloquea:** nada del corte; es una decisión de DNS.
- **Anotado:** [`astro.config.mjs`](../astro.config.mjs).

### IN-6 · El script de despliegue y `deploy.yml`

- **Qué falta:** cómo se actualiza el servicio, versionado. El molde está en
  web-beat: `scripts/desplegar-v2.sh` y web-beat: `.github/workflows/deploy.yml`,
  con su porqué en web-beat: `docs/despliegue-v2.md`.
- **Por qué importa:** hoy no hay forma versionada de desplegar. En web-beat una
  puerta que fallaba en la VM abortaba el despliegue a medias —el `git pull` y el
  `install` ya hechos, el servicio con el artefacto viejo— y pasó tres veces en
  una tarde.
- **Bloquea:** el corte.
- **Anotado:** la cabecera de
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (por eso CI corre
  también en push).

---

## CMS (cms-estaciones)

### CMS-1 · La migración del WordPress de Stereo Cien

- **Qué falta:** cargar en Payload las notas, categorías, autores y media de
  Stereo Cien (la Fase 5 de cms-estaciones). Estaba bloqueada por el único global
  de `media.wpId`: la biblioteca de media es compartida entre las cuatro
  estaciones y los ids de adjunto de sus WordPress se solapan. El bloqueo está
  anotado en cms-estaciones: `src/collections/Media.ts`; confirmar con quien lleva
  el CMS si ya se resolvió.
- **Por qué importa:** sin contenido, el Inicio real enseña la barra, la cabecera
  y el pie, y es correcto. Para ver notas en local hoy: `ESTACION_CODIGO=beat`,
  nunca en un `.env` que sirva `stereociendigital.mx`.
- **Bloquea:** CMS-2, FR-1 y la programación de ST-2.
- **Anotado:** las cabeceras de
  [`src/lib/cms/noticias.ts`](../src/lib/cms/noticias.ts),
  [`src/lib/cms/categorias.ts`](../src/lib/cms/categorias.ts) y
  [`src/pages/index.astro`](../src/pages/index.astro);
  [`.env.example`](../.env.example).

### CMS-2 · Que el importador escriba `sitio-viejo.json`

- **Qué falta:** hoy el importador guarda el permalink en su intermedio
  (cms-estaciones: `src/scripts/migrar-wp/lib/normalizar.ts`) pero no lo escribe
  a Payload ni genera el mapa. Tiene que escribir
  `src/config/redirecciones/sitio-viejo.json` a partir de lo que SÍ se cargó, con
  el slug final de cada nota, en el formato de su clave `//`, y conservando esa
  clave.
- **Trampa:** el origen es la ruta del SITIO VIEJO (`/autos/<slug>`), no el
  permalink del WordPress, que vive en otro dominio. Y la sección de esa ruta es
  el directorio del sitio viejo, que no coincide con el slug de la categoría:
  `/autos` se llenaba con `autos-al-cien`, `/libros` con `libros-y-cultura`,
  `/comida-y-guias` con `guias-y-comida`.
- **Por qué importa:** sin el mapa, cada enlace viejo cae en el 404 el día del
  corte, y un 301 equivocado se queda pegado en el navegador de quien lo visitó:
  el mapa se corrige antes del corte, no después.
- **Bloquea:** el corte de dominio.
- **Cómo se comprueba:** `node scripts/guardas.mjs` valida el mapa (cadenas,
  bucles, destinos, claves sin normalizar o repetidas), y se contrasta contra
  IN-1.
- **Anotado:**
  [`src/config/redirecciones/sitio-viejo.json`](../src/config/redirecciones/sitio-viejo.json),
  [`src/config/redirecciones/sitio-viejo.ts`](../src/config/redirecciones/sitio-viejo.ts),
  [`scripts/guardas.mjs`](../scripts/guardas.mjs).

---

## Carlos

### CA-1 · A dónde van las rutas viejas que no son nota

- **Qué falta:** decidir el destino de las rutas de SECCIÓN de las 19 secciones
  del sitio viejo (`/autos/`, `/autos/2/`…) y de las páginas que no son nota y
  siguen vivas: `/sounds`, `/sounds/<slug>`, `/fiesta-sounds`, `/station`,
  `/podcast/…`, `/en-vivo`, `/programacion`, `/alexa`, `/avisodeprivacidad`,
  `/terminosycondiciones` y `/pruebas`. Todas responden 200 hoy (curl,
  2026-09-28). `/rss.xml` va aparte, en PL-1.
- **Por qué importa:** el día del corte todas caen en el 404. El mapa de 301 solo
  admite destinos `/noticias/<slug>` (la guarda rechaza cualquier otro), así que
  redirigir una sección o una página pide o una página nueva o ampliar el formato
  del mapa y su guarda. El aviso de privacidad y los términos son páginas legales
  que el pie nuevo todavía no puede enlazar.
- **Bloquea:** las páginas de sección, los legales del pie (FR-5), cerrar los 301.
- **Anotado:** «LO QUE FALTA» en
  [`src/config/redirecciones/sitio-viejo.json`](../src/config/redirecciones/sitio-viejo.json);
  `SEGMENTOS_RESERVADOS` en [`src/config/site.ts`](../src/config/site.ts) (toda
  ruta nueva de primer nivel entra ahí el mismo día); PROGRAMACIÓN, Alexa y
  `LEGALES` en [`src/config/navegacion.ts`](../src/config/navegacion.ts).

### CA-2 · De dónde salen los 4 canales SOUNDS cuando se apague el WordPress (con el CMS)

- **Qué falta:** hoy los canales son el tipo de entrada `sounds` del plugin del
  sitio viejo (rama `stereocien`: `wp/plugins/sounds-by-stereo-cien/`), leídos por
  la REST del WordPress, con los streams en Zeno.fm. Cada canal trae su stream, su
  mount, logo, colores, orden y dos imágenes de patrocinio. cms-estaciones no
  tiene colección para ellos.
- **Por qué importa:** al apagar el WordPress se van los canales, sus
  patrocinios y el proxy de portadas del plugin.
- **Bloquea:** SO-1, FR-3 y la sección A2 del Inicio (FR-1).
- **Anotado:** `LADOS` en [`src/config/navegacion.ts`](../src/config/navegacion.ts);
  `PENDIENTES_EN_EL_CMS` en [`src/lib/cms/client.ts`](../src/lib/cms/client.ts).

### CA-3 · El rótulo «EN VIVO · 100.1 FM» choca con lo que suena

- **Qué falta:** decidir qué dicen la fila EN VIVO · 100.1 FM, el botón ESCUCHAR
  EN VIVO y el «100.1» de la etiqueta de la tornamesa. Tiene que quedar antes del
  reproductor.
- **Por qué importa:** el sitio reproduce Stereo Cien Digital (mount `XEOYAM`,
  solo música); por el 100.1 FM va Enfoque Noticias, como dice
  `estaciones.notaStream` en el CMS. El diseño (§14 del traspaso) da por hecho
  «100.1 FM en vivo». Con el reproductor encendido, la barra diría que suena la
  frecuencia y sonaría otra cosa.
- **Bloquea:** ST-1.
- **Anotado:** `FRECUENCIA` y el rótulo en
  [`src/components/Barra.astro`](../src/components/Barra.astro);
  [`src/components/Tornamesa.astro`](../src/components/Tornamesa.astro);
  `tritonMount` en [`src/lib/cms/estacion.ts`](../src/lib/cms/estacion.ts).

### CA-4 · La licencia de Lovelo Black (con NRM)

- **Qué falta:** confirmar si hay licencia para servirla en web.
- **Por qué importa:** es la display del diseño (§8); hoy se ve Montserrat 900. Y
  el sitio viejo ya sirve `/fonts/Lovelo Black.otf` (200, 2026-09-28): o hay una
  licencia que encontrar, o el sitio viejo la sirve sin ella.
- **Bloquea:** la tipografía final. El cambio, cuando llegue, es el `.woff2` en
  `public/fuentes/`, su entrada en `scripts/fuentes.mjs` y `--font-display`.
- **Anotado:** [`scripts/fuentes.mjs`](../scripts/fuentes.mjs),
  [`src/styles/tokens.css`](../src/styles/tokens.css).

### CA-5 · El indicativo de la estación y la cuenta de YouTube (con NRM)

- **Qué falta:** el indicativo oficial, para el `callSign` del JSON-LD, y si
  Stereo Cien tiene canal de YouTube.
- **Por qué importa:** el JSON-LD lo omite hasta que se confirme: la razón social
  «Radio XHMM-FM» apunta a uno, pero no es una afirmación sobre la concesión. El
  YouTube del pie viejo apuntaba al canal de Beat, y en el CMS el campo está en
  `null`.
- **Bloquea:** completar la ficha de la estación y las redes del pie.
- **Anotado:** `nodoEstacion` en [`src/lib/jsonld.ts`](../src/lib/jsonld.ts);
  `REDES_RESPALDO` en [`src/config/navegacion.ts`](../src/config/navegacion.ts).

### CA-6 · La auditoría técnica del sitio viejo solo la tiene Carlos

- **Qué falta:** la auditoría del sitio viejo (9 sep 2026) vive como `STATUS.md`
  sin versionar en el checkout de Carlos del sitio actual. Decidir si se versiona
  en la rama `stereocien` o se comparte de otro modo.
- **Por qué importa:** es el diagnóstico medido del sitio viejo —el techo de 100
  notas por sección, el despliegue aditivo y sus huérfanas, el RSS de relleno, la
  página `/pruebas` indexable—, y es el respaldo de IN-1, IN-4 y PL-1.
- **Bloquea:** que alguien más que Carlos pueda trabajar IN-1.
- **Anotado:** en ningún archivo de este repo.

---

## Redacción (Carlos con la redacción)

### RE-1 · Confirmar qué categorías llenan cada sección

- **Qué falta:** `SECCIONES_EDITORIALES` es una PROPUESTA: Música ← `cultura-pop`,
  Vinilos ← `vinilos`, Comida y guías ← `guias-y-comida`, Libros ←
  `libros-y-cultura`, Autos ← `autos-al-cien` y Relojes ← `relojes`. Falta
  decidir además:
  - qué hacer con las afines (las coberturas de festivales, `vida-vinyl`): o la
    migración les suma la categoría principal, o `obtenerNotas` aprende a filtrar
    por varias;
  - las categorías sin sección en el diseño (`series-y-peliculas`, `tecnologia`,
    `destinos`, `mascotas`, `recap-2025`, `locutores`, `locutores-enfoque`): sus
    notas se migran y responden en `/noticias/<slug>`, pero no salen en ningún
    bloque;
  - la categoría `promociones` del WordPress (6 notas SOBRE promociones, que no
    son promociones de la colección del CMS);
  - `vinos`, con una sola entrada que es de un vinil de Michael Jackson: parece
    un error de captura.
- **Por qué importa:** decide qué pinta cada bloque del Inicio y la migaja de
  cada nota.
- **Bloquea:** FR-1; y parte de CMS-1, si la migración tiene que sumar
  categorías.
- **Anotado:** `SECCIONES_EDITORIALES` en
  [`src/config/navegacion.ts`](../src/config/navegacion.ts); `seccionDeNota` en
  [`src/lib/nota.ts`](../src/lib/nota.ts).

---

## Streaming

### ST-1 · El reproductor de Triton

- **Qué falta:** el reproductor del mount `XEOYAM`, enganchado al contrato que ya
  pinta la barra (`#player`, `data-mount`, `data-accion="play"`), quitándole el
  `disabled` al botón; el giro de la tornamesa y el brazo con
  `prefers-reduced-motion`; Media Session para los controles de la pantalla
  bloqueada (§14 del traspaso); y el preroll, que hoy está apagado en el CMS.
  Antes de todo, medir el mount que suena de verdad, como hizo web-beat: su CMS
  decía `XHSONFM` y sonaba `XHSONFMAAC` (web-beat: `agents/streaming.md`).
- **Por qué importa:** es el corazón del concepto, y hoy la barra enseña un
  botón que no reproduce.
- **Bloqueado por:** CA-3.
- **Anotado:** [`src/components/Barra.astro`](../src/components/Barra.astro),
  [`src/components/Tornamesa.astro`](../src/components/Tornamesa.astro),
  `tritonMount` y `prerollActivo` en
  [`src/lib/cms/estacion.ts`](../src/lib/cms/estacion.ts).

### ST-2 · AHORA SUENA, programación, RECIÉN SONÓ y el mini player móvil

- **Qué falta:** las zonas de la barra que hoy no se pintan (§5.1, puntos 5 a 7)
  y el mini player que se acopla abajo en el móvil (§6).
- **Por qué importa:** son la mitad de la barra en el diseño. No se pintan porque
  no hay de dónde sacarlas: Stereo Cien tiene 0 programas en el CMS, y lo que
  suena depende del reproductor.
- **Bloqueado por:** ST-1; la programación, por CMS-1 y por el destino de
  `/programacion` (CA-1).
- **Anotado:** la cabecera de
  [`src/components/Barra.astro`](../src/components/Barra.astro); PROGRAMACIÓN en
  [`src/config/navegacion.ts`](../src/config/navegacion.ts).

---

## SOUNDS

### SO-1 · Los 4 canales: el audio, lo que suena y la portada

- **Qué falta:** poner cada canal de Zeno en la tornamesa (§5.3 del traspaso),
  su «ahora suena» (hoy lo da Zeno, no el WordPress) y la portada de la canción
  (hoy, un proxy del plugin hacia la búsqueda de iTunes).
- **Por qué importa:** la cápsula SOUNDS y la sección A2 son del diseño
  aprobado; hoy la cápsula va `disabled`.
- **Bloqueado por:** CA-2; comparte la barra con ST-1.
- **Anotado:** `LADOS` en [`src/config/navegacion.ts`](../src/config/navegacion.ts)
  (las URLs de Zeno y del proxy); `PENDIENTES_EN_EL_CMS` en
  [`src/lib/cms/client.ts`](../src/lib/cms/client.ts).

---

## Ads

### AD-1 · Los espacios de Google Ad Manager

- **Qué falta:** los cinco formatos del §7 del traspaso (masthead, billboard o
  leaderboard, half page, robapáginas y anchor), cada uno con su medida reservada
  y la etiqueta PUBLICIDAD. Solo GAM con AdX, sin AdSense, y el ad unit por
  variable de entorno.
- **Por qué importa:** es la monetización del sitio; la medida reservada evita
  que la página brinque al cargar el anuncio.
- **Bloquea:** nada del resto.
- **Anotado:** la regla `ad-unit` de
  [`scripts/guardas.mjs`](../scripts/guardas.mjs); `--color-gris-publicidad` en
  [`src/styles/tokens.css`](../src/styles/tokens.css); cómo convive la barra con
  el masthead, en [`src/styles/sitio.css`](../src/styles/sitio.css).

### AD-2 · `ads.txt` y `app-ads.txt`

- **Qué falta:** el sitio nuevo no sirve ninguno de los dos. El viejo sirve
  `/ads.txt` desde su `public/` (rama `stereocien`: `public/ads.txt`, 529 líneas).
  Su app-ads está mal nombrado (rama `stereocien`: `public/app-pads.txt`): hoy
  `/app-ads.txt` da 404 y `/app-pads.txt` da 200 (curl, 2026-09-28).
- **Por qué importa:** con `/ads.txt` en 404 tras el corte, el inventario deja de
  estar autorizado para los compradores que lo verifican. `app-ads.txt` es lo que
  autoriza el inventario de las apps, y con el nombre equivocado hoy no está en
  la ruta donde se busca. Cuando entren a `public/`, van también a
  `SEGMENTOS_RESERVADOS`.
- **Bloquea:** el corte, en cuanto el sitio tenga anuncios, o antes si la ficha
  de desarrollador de las apps apunta a este dominio.
- **Anotado:** en ningún archivo de este repo.

---

## Analytics

### AN-1 · GA4 con el `ClientRouter`

- **Qué falta:** en la propiedad de GA4 de Stereo Cien, desmarcar «Medición
  mejorada → Vistas de página → Cambios de página basados en eventos del
  historial del navegador» antes de encender la medición.
- **Por qué importa:** viene encendido, y con el `pushState` del router las
  páginas vistas salen al doble (heredado de web-beat).
- **Bloquea:** confiar en las cifras de GA4 desde el corte.
- **Anotado:** [`.env.example`](../.env.example).

### AN-2 · Qué cuenta como vista en una navegación interna

- **Qué falta:** decidir con adops cómo se cuenta una vista cuando el lector
  navega sin recargar. Hoy los contenedores corren una vez por carga completa del
  documento: el `ClientRouter` no vuelve a ejecutar los scripts en línea (a
  propósito, para no contar doble) y nada escucha `astro:page-load`. Nada de este
  código emite una vista por navegación interna: si algún proveedor las cuenta
  por su cuenta (en GTM, con sus activadores de historial), hay que comprobarlo
  contra su panel.
- **Por qué importa:** comScore es la audiencia certificada que NRM reporta a los
  anunciantes; contar de menos también cuesta.
- **Bloquea:** encender la medición en el corte.
- **Anotado:** el bloque «LA MEDICIÓN» de
  [`src/layouts/Base.astro`](../src/layouts/Base.astro) explica por qué no se
  re-ejecutan; la vista por navegación no está resuelta en ningún archivo.

---

## Frontend

### FR-1 · Maquetar las 9 secciones que faltan del Inicio

- **Qué falta:** A2 SOUNDS, A3 Vinilos, A4 Podcasts, Voltea el disco
  (`#lado-b`), B1 Comida y guías, B2 Libros, B3 Autos, B4 Relojes y GANA. Hoy
  solo se llenan La noticia y Lado A · Las de hoy.
- **Por qué importa:** es la revista del diseño.
- **Bloqueado por:** CMS-1, RE-1, CA-2 (para SOUNDS) y DI-1.
- **Anotado:** [`src/pages/index.astro`](../src/pages/index.astro); de dónde sale
  cada sección, en `LADOS` de
  [`src/config/navegacion.ts`](../src/config/navegacion.ts).

### FR-2 · El scrollytelling y REDUCIR MOVIMIENTO

- **Qué falta:** el movimiento del §5.4 del traspaso —el índice que se ilumina
  con el scroll, SOUNDS en horizontal, Voltea el disco, el revelado de tarjetas—
  dentro de `@supports (animation-timeline: view())`, apagado con
  `prefers-reduced-motion` y con el botón REDUCIR MOVIMIENTO del pie.
- **Por qué importa:** es la mitad del concepto («la revista con scroll»).
- **Bloqueado por:** FR-1: una sección vacía no ocupa alto, así que hoy no hay
  nada que recorrer con el scroll.
- **Anotado:** el índice en
  [`src/components/Barra.astro`](../src/components/Barra.astro); por qué el pie
  no trae el botón todavía, en
  [`src/components/Pie.astro`](../src/components/Pie.astro).

### FR-3 · El menú SOUNDS

- **Qué falta:** el panel de canales del §5.3 (abrir y cerrar con la cápsula,
  Esc, clic fuera, `aria-pressed` por canal, VOLVER AL 100.1), y quitarle el
  `disabled` a la cápsula.
- **Por qué importa:** es la entrada a SOUNDS desde cualquier página.
- **Bloqueado por:** CA-2 y SO-1.
- **Anotado:** la cápsula y el contenedor `#menu-sounds` en
  [`src/components/Barra.astro`](../src/components/Barra.astro).

### FR-4 · BUSCAR y MENÚ en la cabecera

- **Qué falta:** los dos controles del diseño que la cabecera no pinta.
- **Por qué importa:** sin MENÚ, la cabecera no puede esconder entradas por ancho
  como el diseño, porque una entrada escondida no tendría otro camino.
- **Bloquea:** nada del resto.
- **Anotado:** [`src/components/Cabecera.astro`](../src/components/Cabecera.astro);
  `/buscar` ya está fuera de la caché en
  [`src/middleware.ts`](../src/middleware.ts), para que no nazca cacheada.

### FR-5 · El pie completo y el newsletter

- **Qué falta:** las columnas SECCIONES, NRM COMUNICACIONES y ESCÚCHANOS, los
  legales y el newsletter «MANTENTE INFORMADO».
- **Por qué importa:** hoy el pie es la estación, sus redes y el año. El
  newsletter necesita un formulario y un proveedor que el sitio no tiene, y es el
  primer `POST`: depende de `checkOrigin` y, por lo tanto, de IN-2 e IN-3.
- **Bloqueado por:** CA-1 (legales y secciones con página), IN-3.
- **Anotado:** [`src/components/Pie.astro`](../src/components/Pie.astro); los
  destinos ya listos (`APPS`, `MARCAS_NRM`, `LEGALES`) en
  [`src/config/navegacion.ts`](../src/config/navegacion.ts).

---

## Plataforma (rutas, SEO y feeds)

### PL-1 · `/rss.xml`

- **Qué falta:** servir `/rss.xml` como proxy del feed que ya genera el CMS
  (`/feeds/stereocien/rss.xml`, 200 el 2026-09-28), como se hace con los
  sitemaps; y que Carlos confirme que la URL se conserva.
- **Por qué importa:** la URL existe hoy en el sitio viejo y responde 200, pero
  sirve las cinco entradas del ejemplo de Astro («Using MDX», «First post»…)
  apuntando a `/blog/undefined/` (curl, 2026-09-28). En el sitio nuevo caería en
  el 404.
- **Bloquea:** nada del resto.
- **Anotado:** [`src/lib/feeds.ts`](../src/lib/feeds.ts) solo reenvía
  `sitemap.xml` y `news-sitemap.xml`; la ruta nueva entra también en
  `SEGMENTOS_RESERVADOS` de [`src/config/site.ts`](../src/config/site.ts).

---

## Diseño

### DI-1 · Los pendientes del propio lienzo

- **Qué falta:** lo que el traspaso deja anotado en su §15: las fotos con tamaño
  fijo de Comida, Libros, Autos, Relojes y GANA; dos fotos en un mismo marco en
  Autos; la foto y el titular que no coinciden en La noticia; los textos
  alternativos que salen del nombre de archivo; los slots sin foto; y los textos
  de relleno de SOUNDS, Libros y GANA.
- **Por qué importa:** quien maquete copia medidas y textos del lienzo, y lo que
  ahí es relleno no debe llegar al sitio.
- **Bloquea:** FR-1, en las secciones afectadas.
- **Anotado:** §15 de
  [`design/stereo-cien-home-handoff/stereo-cien-home-handoff.md`](../design/stereo-cien-home-handoff/stereo-cien-home-handoff.md).

### DI-2 · La nota no tiene tablero

- **Qué falta:** el diseño aprobado dibuja solo el Inicio. La nota se armó con las
  piezas del Inicio (tipografía, antetítulos, esquina recta) y nada que el diseño
  no haya dicho; lo mismo va a pasar con las páginas de sección.
- **Por qué importa:** la nota es el destino de todos los 301 del sitio viejo.
- **Bloquea:** nada del corte; es la nota mínima pero correcta.
- **Anotado:** la cabecera de
  [`src/pages/noticias/[slug].astro`](../src/pages/noticias/[slug].astro).
