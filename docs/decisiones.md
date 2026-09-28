# Registro de decisiones — stereocien-v2

Qué se decidió en el sitio nuevo de Stereo Cien, quién, cuándo y por qué, y
dónde vive en el código. Lo que falta está en [pendientes.md](pendientes.md);
cómo arrancar, en [README.md](../README.md); las trampas para quien llega con un
agente, en [CLAUDE.md](../CLAUDE.md).

Tres reglas de este archivo:

- **Una decisión entra solo si su porqué se puede comprobar**: en el código, en
  un commit o en una medición con fecha. Lo que no tiene respaldo no se escribe.
- **Si el código y este archivo no coinciden, gana el código** y esto es un bug.
- **Una decisión no se borra: se sustituye.** Si algo cambia, se agrega una
  entrada nueva que diga cuál reemplaza y por qué, y la vieja se marca como
  sustituida.

El diagnóstico completo va en los mensajes de commit de la rama:

```sh
git log --format='%h %s%n%b' ebe66f2..stereocien-v2
```

Y lo que se adaptó de web-beat, archivo por archivo, contra la copia intacta:

```sh
git diff be47585 -- src/middleware.ts
```

«Heredada» quiere decir que la regla viene de web-beat y que su porqué vale igual
aquí; el origen se dice para que nadie la tome por una ocurrencia local.

---

## Parte 1 · Producto y arquitectura

### 1. La plantilla es web-beat, y se porta sin rediseñar

- **Decisión:** el sitio nuevo sale de web-beat (rama `beat`, al aire desde el
  10 sep 2026): portar, no rediseñar.
- **Quién y cuándo:** Carlos, 2026-09-28.
- **Por qué:** web-beat es el front escrito para leer `cms-estaciones`, el mismo
  CMS multi-estación que va a servir a Stereo Cien, y resuelve la estación por
  `ESTACION_CODIGO` en vez de escribirla en el código. Lo que allá ya se pagó —la
  caché del cliente del CMS, las tres capas de indexación, las guardas— llega
  hecho.
- **Descartado:** web-enfoque como plantilla. Lee otro CMS (`cms-nrm`) y pinta
  HTML con `set:html`, que aquí la guarda de CI rechaza por ser XSS almacenado.
- **Dónde vive:** el commit `be47585` es la copia tal cual de web-beat en
  `b30e3fb`; el transporte heredado está en
  [`src/lib/cms/client.ts`](../src/lib/cms/client.ts).

### 2. Dos ramas, dos sitios, y no se mezclan

- **Decisión:** `stereocien` sigue siendo el sitio actual (Astro estático sobre
  WordPress, el que está al aire) y `stereocien-v2` es el nuevo. `main` está
  abandonada.
- **Quién y cuándo:** Carlos, 2026-09-28. `stereocien-v2` nace de
  `origin/stereocien` en `ebe66f2`.
- **Por qué:** el sitio actual sigue al aire y el equipo (Danira y Carlos) sigue
  empujando a `stereocien` mientras el nuevo no salga. En `stereocien-v2` el
  árbol viejo se va entero en el primer commit (`a597927`): dos sitios en un
  árbol es justo como web-beat terminó con código de legado que nadie importa y
  que confunde a quien llega (web-beat: `src/js/README.md`). El segundo
  commit (`be47585`) copia web-beat sin tocar para que el `git diff` de arriba
  enseñe qué se adaptó.
- **Descartado:** construir el sitio nuevo dentro de `stereocien`, junto al
  viejo, por lo mismo.
- **Dónde vive:** los commits `a597927` y `be47585`;
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) solo corre en
  `stereocien-v2`. Cómo clonar sin caer en `main` (que es la rama por omisión de
  GitHub) está en el README.

### 3. El alcance de la base: cimientos y cascarón

- **Decisión:** la base trae el tooling, el lector de Payload, los tokens y las
  fuentes del diseño, el layout con la barra fija persistente, la nota mínima,
  las guardas, CI y la documentación. Del Inicio solo se llenan «La noticia» y
  «Lado A · Las de hoy»; las otras nueve secciones quedan sin maquetar. No trae
  reproductor, ni anuncios, ni scrollytelling.
- **Quién y cuándo:** Carlos, 2026-09-28.
- **Por qué:** las secciones dependen de datos que todavía no existen en el CMS
  (Stereo Cien tiene 0 notas, 0 categorías y 0 programas) y del reproductor. La
  base deja listo el lugar donde llegan —las anclas de cada sección, el contrato
  `#player` de la barra, la cápsula SOUNDS con su `aria-controls`— para que
  entren sin rehacer el cascarón.
- **Descartado:** nada registrado.
- **Dónde vive:** [`src/pages/index.astro`](../src/pages/index.astro) (las 11
  secciones con su ancla, dos llenas),
  [`src/layouts/Base.astro`](../src/layouts/Base.astro),
  [`src/components/Barra.astro`](../src/components/Barra.astro).

### 4. El diseño aprobado es el lienzo «3 · Tornamesa v3», y se versiona

- **Decisión:** la fuente de verdad es el lienzo «3 · Tornamesa v3», versión
  `1790608880-572f` del 28 sep 2026. Su paquete de traspaso se sube tal cual al
  repo público.
- **Quién y cuándo:** Carlos, 2026-09-28. Puede cambiar «en un mínimo».
- **Por qué:** los artefactos del lienzo son privados (§2 del traspaso), y quien
  llegue sin acceso necesita la copia. Es lo mismo que hizo web-beat con su
  `design/`. Las 16 huellas de `SHA256SUMS.txt` se comprobaron al copiarlo.
- **Descartado:** las rutas A «Frecuencia» y B «Portada» de la exploración v1, y
  el acento lima, que el propio diseño eliminó (§8 y §16 del traspaso). El ZIP
  original no se versiona: pesa y es un artefacto de descarga
  ([`.gitignore`](../.gitignore)).
- **Dónde vive:**
  [`design/stereo-cien-home-handoff/`](../design/stereo-cien-home-handoff/), con
  el documento en
  [`stereo-cien-home-handoff.md`](../design/stereo-cien-home-handoff/stereo-cien-home-handoff.md).
  La entrada `design` de [`.claude/launch.json`](../.claude/launch.json) lo sirve
  en el 4399.

### 5. Las notas viven en `/noticias/<slug>`

- **Decisión:** una ruta por COLECCIÓN, no por sección. La nota va en
  `/noticias/<slug>`, igual que en Beat.
- **Quién y cuándo:** Carlos, 2026-09-28.
- **Por qué:**
  1. `noticias.categorias` es `hasMany` y no hay categoría primaria. Derivar la
     URL de `categorias[0]` haría que reordenar un array —un accidente
     editorial— moviera una URL viva en silencio.
  2. SOUNDS, Podcasts y Promociones no son categorías de `noticias`: son los
     canales del reproductor y dos colecciones propias.
  3. Una URL plana es inmutable: no cambia cuando la redacción re-archiva.
  4. Es lo que ya emite `getNewsURL` del CMS para las cuatro estaciones
     (cms-estaciones: `src/seo/site.ts`), así que los sitemaps que genera el CMS
     apuntan a rutas que este sitio sirve sin tocar el CMS.
- **Descartado:** conservar `/<seccion>/<slug>/` del sitio viejo. El costo es que
  las 932 notas que su build publica hoy en esa forma cambian de URL; se
  redirigen con 301 (decisión 6).
- **Dónde vive:** `rutaNota` y `SEGMENTOS_RESERVADOS` en
  [`src/config/site.ts`](../src/config/site.ts);
  [`src/pages/noticias/[slug].astro`](../src/pages/noticias/[slug].astro).

### 6. Los 301 del sitio viejo salen de un mapa exacto, versionado en el front

- **Decisión:** `/<seccion>/<slug>/` → `/noticias/<slug>` se resuelve con un mapa
  EXACTO en `src/config/redirecciones/sitio-viejo.json`, que el middleware
  consulta antes de `next()`: un solo salto, conserva el query y tiene guarda
  anti-bucle. Hoy está vacío; lo genera el importador de cms-estaciones.
- **Quién y cuándo:** Carlos, 2026-09-28, a recomendación de la sesión de
  web-beat.
- **Por qué un mapa y no una regla por patrón:** `/<seccion>/<slug>` no dice a qué
  nota nueva corresponde —el slug final lo decide la importación— ni si esa nota
  llegó a cargarse. Una regla `/<seccion>/(.*)` → `/noticias/$1` mandaría con 301
  a un 404 cada nota que no se importó, y un 301 se queda cacheado en el
  navegador de quien lo visita. Por eso el mapa sale de lo que SÍ se cargó.
- **Por qué en el front:** versionado, cargado en memoria al arrancar, sin red ni
  render por petición, y revisado por `scripts/guardas.mjs` en cada build (sin
  cadenas ni bucles, destinos bajo `/noticias/`, orígenes fuera de `/noticias/`,
  claves normalizadas y sin repetir).
- **Descartado:**
  - La colección `redirects` del CMS: es global, sin estación, así que una regla
    de Stereo Cien aplicaría en Beat; y si el CMS cae, caen los 301.
  - Apache: `pnpm build` no lo prueba y la guarda de CI no lo vería.
  - Las rutas del WordPress (`/wp-content/`, `/category/`, `/feed/`, `/wp-json/`,
    `/?p=<id>`): el WordPress vive en otro dominio
    (`stereociendigital.com.mx`), y en `stereociendigital.mx` esas rutas ya dan
    404 o el Inicio (curl, 2026-09-28).
- **Dónde vive:**
  [`src/config/redirecciones/sitio-viejo.json`](../src/config/redirecciones/sitio-viejo.json)
  (el formato y quién lo genera, en su clave `//`),
  [`src/config/redirecciones/sitio-viejo.ts`](../src/config/redirecciones/sitio-viejo.ts),
  [`src/middleware.ts`](../src/middleware.ts),
  [`scripts/guardas.mjs`](../scripts/guardas.mjs).

### 7. SSR en un proceso de Node, detrás del Apache propio

- **Decisión:** `output: 'server'` con el adaptador de Node en modo `standalone`,
  detrás del Apache que ya sirve el dominio.
- **Quién y cuándo:** Carlos, 2026-09-09 («Apache propio, con control»).
- **Por qué:** el sitio viejo es un build estático que solo publica las últimas
  100 notas por sección, y su despliegue es aditivo: lo que sale de esas 100 se
  queda congelado en el servidor y ya no se regenera. Renderizar bajo demanda
  quita el techo y las huérfanas. Y el servidor sigue siendo propio.
- **Descartado:** mover el hosting fuera del servidor propio.
- **Lo que deja abierto:** hoy no hay CDN delante (`Server: Apache` y ni una
  cabecera de CDN, 2026-09-28). Ver [pendientes.md](pendientes.md).
- **Dónde vive:** [`astro.config.mjs`](../astro.config.mjs) (`output`,
  `adapter`); la política de caché de borde en
  [`src/middleware.ts`](../src/middleware.ts); lo que el proxy inverso tiene que
  respetar (`ProxyPreserveHost On`), en `noIndexarHost` de
  [`src/config/site.ts`](../src/config/site.ts).

### 8. Publicidad: solo Google Ad Manager, con AdX de respaldo

- **Decisión:** cuando haya anuncios, solo GAM (la red de NRM, 23349147378, con el
  ad unit de Stereo Cien) con AdX de respaldo. AdSense no vuelve. El ad unit va
  por variable de entorno, nunca escrito en el código. El código de anuncios que
  se retira se borra, no se comenta.
- **Quién y cuándo:** Carlos. AdSense se quitó del sitio actual el 2026-09-09
  (rama `stereocien`, commits `f93e514` y `b63cd44`); la regla entra a esta base
  el 2026-09-28.
- **Por qué:**
  - AdX rellena dentro del slot de GAM, así que un respaldo con AdSense es
    redundante; y los Auto ads de AdSense eran las barras que empujaban el
    layout del sitio actual (`f93e514`).
  - Las estaciones de NRM comparten la red de Ad Manager y cada una tiene su ad
    unit. Escribirlo a mano es la puerta del copy-paste entre repos hermanos, y
    servir impresiones a la cuenta de otra estación es un bug de dinero que nadie
    ve hasta la facturación.
  - El código de anuncios comentado ya provocó dos diagnósticos falsos, y Astro
    conserva los comentarios HTML en la página servida: en el sitio actual, los
    bloques comentados seguían emitiendo el id de publisher.
- **Descartado:** AdSense como respaldo de GPT.
- **Dónde vive:** la regla `ad-unit` de
  [`scripts/guardas.mjs`](../scripts/guardas.mjs). Esta base todavía no tiene
  código de anuncios.

### 9. El mount de Triton es `XEOYAM`, y es correcto

- **Decisión:** el `tritonMount` de Stereo Cien es `XEOYAM` aunque lleve sufijo AM
  en una FM. No se «corrige».
- **Quién y cuándo:** Carlos; confirmado contra el CMS el 2026-09-28.
- **Por qué:** el sitio reproduce Stereo Cien Digital, un flujo solo de música.
  Por la frecuencia 100.1 FM va la programación de Enfoque Noticias. Lo dice el
  propio CMS en `estaciones.notaStream`.
- **Descartado:** cambiarlo por un mount de FM.
- **Dónde vive:** se lee del CMS y no se escribe en el código
  ([`src/lib/cms/estacion.ts`](../src/lib/cms/estacion.ts)). El valor de respaldo
  para cuando el CMS no responde está en
  [`src/layouts/Base.astro`](../src/layouts/Base.astro), y llega a la barra como
  `data-mount` ([`src/components/Barra.astro`](../src/components/Barra.astro)).

### 10. La medición solo se emite en el dominio canónico

- **Decisión:** GTM, comScore, Hotjar y Metricool se emiten solo si su variable
  trae valor **y** la petición llega por `stereociendigital.mx`, en un build hecho
  para ese dominio. `SITIO_NOINDEX` NO interviene: es solo de indexación.
- **Quién y cuándo:** la adaptación del layout, 2026-09-28 (commit `c6b0453`).
- **Por qué:** un staging y el sitio real pueden ser el MISMO build, así que la
  variable sola no los distingue. El caro es comScore: es la audiencia
  certificada que NRM reporta a los anunciantes, y un staging la inflaría con
  tráfico que no es audiencia. En web-beat pasó: su preproducción servía el mismo
  proceso y mandaba sus visitas al mismo comScore hasta que se apagó el 10 sep
  (web-beat: `deploy/PENDIENTES.md`, punto 1). Se mira el DESPLIEGUE y no el
  documento: una nota marcada `noIndex` es audiencia real y se mide.
- **Descartado:** la guarda de web-beat, que solo mira que la variable no venga
  vacía. También reusar la guarda de indexación (`!noindex`), que fue la primera
  versión: como pasa por `SITIO_NOINDEX`, con `=0` en local salían los cuatro
  contenedores desde 127.0.0.1 con los IDs reales, y con `=1` en el sitio real se
  apagaba su medición (reproducido en la revisión del 2026-09-28). Y GA4 directo:
  entra por GTM, porque con las dos vías las páginas vistas salen al doble.
- **Dónde vive:** `esDespliegueCanonico` en
  [`src/config/site.ts`](../src/config/site.ts); `medir` y `contenedor()` en
  [`src/layouts/Base.astro`](../src/layouts/Base.astro);
  [`.env.example`](../.env.example). Depende de que el `Host` llegue verdadero
  (decisión 16).

---

## Parte 2 · Decisiones técnicas de la adaptación

Las tomaron las sesiones que adaptaron la base el 2026-09-28; cada una dice su
commit.

### 11. `trailingSlash: 'ignore'`, y la barra final la quita el middleware

- **Decisión:** Astro deja `trailingSlash` en `'ignore'`. El middleware responde
  301 de `/x/` a `/x`, y lo hace DESPUÉS de consultar el mapa del sitio viejo.
- **Quién y cuándo:** commit `b5c9b11`, 2026-09-28.
- **Por qué:** en Astro 7 el 301 de `trailingSlash` corre antes que el
  middleware. Todas las URLs del sitio viejo terminan en barra, así que con
  `'never'` cada enlace viejo daría dos saltos: Astro a `/autos/<slug>` y de ahí
  el mapa a `/noticias/<slug>`. Consultando el mapa primero, es uno. Y el 301 del
  middleware no es opcional: con `'ignore'` cada ruta responde con y sin barra, y
  serían dos URLs con dos canónicas.
- **Descartado:** `trailingSlash: 'never'`, por los dos saltos.
- **Dónde vive:** [`astro.config.mjs`](../astro.config.mjs) (el porqué, escrito
  para que nadie lo «corrija»); `rutaSinBarraFinal` en
  [`src/middleware.ts`](../src/middleware.ts); la canónica sin barra en
  [`src/layouts/Base.astro`](../src/layouts/Base.astro).

### 12. Las claves del mapa se normalizan igual en el middleware y en la guarda

- **Decisión:** la ruta vieja se busca sin barra final, con los escapes `%XX`
  decodificados, en Unicode NFC y con las mayúsculas tal cual. La función vive
  dos veces —`normalizarRutaVieja` en TypeScript y su copia en la guarda, que no
  puede importar TS— y si se toca una, se toca la otra.
- **Quién y cuándo:** commit `b5c9b11`, 2026-09-28.
- **Por qué:** los enlaces viejos circulan con y sin barra (el Apache viejo
  respondía sin ella con un 301), y un mismo carácter no ASCII puede llegar como
  `%C3%B1`, como `%c3%b1` o sin escapar. Las mayúsculas no se pliegan porque el
  sitio viejo las distingue (`/autos/` da 200 y `/AUTOS/` da 404, curl
  2026-09-28): una URL con otra caja nunca funcionó. Los 932 slugs publicados hoy
  son ASCII; lo demás es para las notas que el despliegue aditivo dejó en el
  servidor.
- **Descartado:** comparar el texto crudo de la ruta.
- **Dónde vive:**
  [`src/config/redirecciones/sitio-viejo.ts`](../src/config/redirecciones/sitio-viejo.ts),
  [`scripts/guardas.mjs`](../scripts/guardas.mjs), y el formato en
  [`src/config/redirecciones/sitio-viejo.json`](../src/config/redirecciones/sitio-viejo.json).

### 13. Los 301 van antes que todo, solo en GET y HEAD, y conservan el query

- **Decisión:** los dos 301 (mapa y barra final) devuelven sin llamar a `next()`,
  solo para `GET` y `HEAD`, y le pegan el query de la petición al destino.
- **Quién y cuándo:** commit `b5c9b11`, 2026-09-28.
- **Por qué:** una URL vieja no tiene ruta, y dejarla pasar costaría el render del
  404 —con la consulta al CMS del layout— por cada enlace viejo; el día del corte
  eso es tráfico de verdad. Solo en lectura porque un 301 convierte un `POST` en
  `GET` y el cuerpo se pierde, y el sitio viejo era estático: nunca aceptó un
  `POST`. El query se conserva porque un enlace viejo con `utm_source` viene de
  una campaña. Y como el navegador cachea el 301 con fuerza, el mapa se corrige
  ANTES del corte, no después (heredado de web-beat).
- **Descartado:** nada registrado.
- **Dónde vive:** [`src/middleware.ts`](../src/middleware.ts).

### 14. El 301 de barra final no puede ser una redirección abierta

- **Decisión:** `rutaSinBarraFinal` no toca las rutas que empiezan con `//`,
  `/\`, `/_`, `/@` o `/.`.
- **Quién y cuándo:** commit `b5c9b11`, 2026-09-28.
- **Por qué:** el adaptador de Node arma la URL con `req.url`, y `//ejemplo.com/`
  es una pathname válida. Quitarle la barra daría `Location: //ejemplo.com`, que
  el navegador lee como otro dominio: una redirección abierta servida por
  nosotros. `/_`, `/@` y `/.` son internas de Astro, con el mismo criterio que usa
  Astro para no tocarlas.
- **Descartado:** nada registrado.
- **Dónde vive:** [`src/middleware.ts`](../src/middleware.ts).

### 15. El 404 se renderiza en el servidor, nunca prerenderizado

- **Decisión:** [`src/pages/404.astro`](../src/pages/404.astro) no lleva
  `export const prerender = true`, y una guarda de CI lo impide.
- **Quién y cuándo:** commit `b5c9b11`, 2026-09-28.
- **Por qué:** una URL vieja como `/autos/<slug>/` no tiene ruta en el sitio
  nuevo, y Astro 7 solo corre el middleware para ella porque renderiza el 404
  con él. Con el 404 prerenderizado, Astro sirve el archivo estático, el
  middleware no corre y el mapa de 301 queda muerto sin que nada falle. El 404 es
  barato a propósito: no consulta el CMS más de lo que ya consulta el layout.
- **Descartado:** nada registrado.
- **Dónde vive:** [`scripts/guardas.mjs`](../scripts/guardas.mjs), la cabecera de
  [`src/middleware.ts`](../src/middleware.ts) y
  [`src/pages/404.astro`](../src/pages/404.astro). La nota que no existe
  reescribe a `/404` con estado 404 real
  ([`src/pages/noticias/[slug].astro`](../src/pages/noticias/[slug].astro)).

### 16. La indexación se decide por petición y falla del lado seguro

- **Decisión:** un despliegue sale `noindex` si el dominio con el que se compiló
  no es el canónico **o** si el `Host` de la petición no lo es. Tres capas: la
  cabecera `X-Robots-Tag`, el `<meta robots>` y un `robots.txt` que es ruta, no
  archivo. `security.allowedDomains` lista `stereociendigital.mx` y su `www`.
- **Quién y cuándo:** heredada de web-beat; entra con `b5c9b11`, 2026-09-28.
- **Por qué:** un staging y el sitio real pueden ser el mismo artefacto, y sin
  mirar el `Host` el staging serviría un duplicado indexable del real.
- **Cómo depende del proxy** (medido el 2026-09-28 con Astro 7.2.10 y
  @astrojs/node 11.1.4, que corrige lo que decía el comentario heredado de
  web-beat): el adaptador arma `Astro.url` con el `Host` tal como llega, así que
  el vhost necesita `ProxyPreserveHost On`. `allowedDomains` decide a qué
  cabeceras del proxy se les cree: `X-Forwarded-Host` solo para los hosts de la
  lista, y `X-Forwarded-Proto` con la lista no vacía. Sin `X-Forwarded-Proto:
  https`, Node ve `http:` y `checkOrigin` responde 403 a todo `POST`, porque el
  navegador manda `Origin: https://...`. Apache no manda esa cabecera por
  omisión. El detalle está en `src/config/site.ts`, «Cómo llega la petición a
  Node».
- **Descartado:** un `robots.txt` estático en `public/`: diría lo mismo en el
  staging y en el sitio real.
- **Dónde vive:** `NOINDEX_SITIO`, `noIndexarHost` y `SITIO_NOINDEX` en
  [`src/config/site.ts`](../src/config/site.ts);
  [`src/middleware.ts`](../src/middleware.ts);
  [`src/layouts/Base.astro`](../src/layouts/Base.astro);
  [`src/pages/robots.txt.ts`](../src/pages/robots.txt.ts);
  [`astro.config.mjs`](../astro.config.mjs).

### 17. Los sitemaps los genera el CMS y este dominio los sirve

- **Decisión:** sin `@astrojs/sitemap`. `/sitemap.xml` y `/news-sitemap.xml` son
  proxies a los feeds que genera el CMS para `stereocien`, con los parámetros
  validados contra un conjunto cerrado; en un despliegue que no es el canónico
  responden 404.
- **Quién y cuándo:** heredada de web-beat; entra con `b5c9b11`, 2026-09-28.
- **Por qué:** el índice del CMS lista sus hijos con el dominio de la estación, y
  Google descarta un `<sitemapindex>` cuyos hijos viven en otro host: los hijos
  tienen que responder aquí. Dos sitemaps compitiendo es peor que uno. El sitio
  viejo anuncia `/sitemap.xml` en su `robots.txt` y responde 404 (curl,
  2026-09-28): es el agujero que esto cierra.
- **Descartado:** `@astrojs/sitemap`, que en el sitio viejo estaba configurada con
  una opción que no soporta.
- **Dónde vive:** [`src/lib/feeds.ts`](../src/lib/feeds.ts),
  [`src/pages/sitemap.xml.ts`](../src/pages/sitemap.xml.ts),
  [`src/pages/news-sitemap.xml.ts`](../src/pages/news-sitemap.xml.ts). El contrato
  con el CMS: cms-estaciones: `docs/feeds-por-estacion.md`.

### 18. La puerta es `pnpm build`, y CI la corre sin un solo secreto

- **Decisión:** `pnpm build` (`astro check` + guardas + build + guarda de cascada)
  es la puerta. CI la corre en cada push y cada PR a `stereocien-v2`, con
  `--frozen-lockfile`, sin `.env` y con pnpm por corepack. `.env` no ha vuelto
  al árbol desde que nace la rama: el primer commit (`a597927`) borra el del
  sitio viejo y solo trae `design/`, y el segundo (`be47585`), el primero con
  código, ya lo ignora.
- **Quién y cuándo:** commit `b5c9b11`, 2026-09-28; la puerta es heredada de
  web-beat.
- **Por qué:**
  - `pnpm check` da 0 errores en cosas que el compilador del build rechaza (en
    web-beat, un comentario mal cerrado).
  - El repo es público: una puerta sin secretos es segura en un PR de quien sea,
    y cada acción de terceros es código ajeno con acceso al workflow; por eso
    pnpm entra por corepack y no por una acción.
  - Corre también en push porque aquí todavía no hay `deploy.yml`.
  - En el sitio viejo el `.env` estaba versionado (solo traía la URL pública del
    WordPress, así que no hubo fuga), pero este sitio lleva config de servidor.
  - Las guardas tienen como regla cero falsos positivos, con una salida explícita
    `guarda-ok <regla>: <razón>` que obliga a escribir el porqué en el archivo.
- **Lo que no cubre:** que el sitio tenga contenido. `CMS_URL` es de ejecución y
  en CI no existe.
- **Descartado:** `pnpm check` como puerta.
- **Dónde vive:** [`package.json`](../package.json),
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml),
  [`.gitignore`](../.gitignore), [`scripts/guardas.mjs`](../scripts/guardas.mjs),
  [`scripts/guarda-cascada.mjs`](../scripts/guarda-cascada.mjs).

### 19. El lector de Payload se porta sin rediseñar, y nunca lee sin estación

- **Decisión:** el transporte y la caché de web-beat van tal cual (TTL leído en
  ejecución, deduplicación de peticiones en vuelo, `stale-if-error`). Toda
  colección con inquilino se lee con `cmsFetchEstacion`, que se niega a consultar
  una colección que no esté en `COLECCIONES_POR_ESTACION`. El valor por omisión de
  `ESTACION_CODIGO` es siempre `stereocien`.
- **Quién y cuándo:** Carlos pidió portar el lector de web-beat y no rediseñarlo;
  entra con `6f763dd`, 2026-09-28.
- **Por qué:** en cms-estaciones el `read` está abierto entre estaciones a
  propósito (para poder republicar), así que una consulta sin filtro devuelve las
  cuatro marcas mezcladas. La caché y la deduplicación salen de incidentes
  medidos en web-enfoque. Y un valor por omisión que apuntara a otra estación
  serviría su contenido con la marca de Stereo Cien sin que nada lo delatara.
  `promociones` y `paginas` se suman a la lista de web-beat: se probaron contra el
  CMS de producción y las dos llevan el campo `estacion`.
- **Descartado:** la forma de la API de web-beat: `src/lib/cms/noticias.ts`, que
  era la de Beat Scanner (una sección concreta con su destacada). Aquí es un listado genérico
  (`obtenerNotas`, `obtenerNota`, `obtenerRelacionadas`) con la misma lógica.
- **Dónde vive:** [`src/lib/cms/client.ts`](../src/lib/cms/client.ts),
  [`src/lib/cms/noticias.ts`](../src/lib/cms/noticias.ts),
  `ESTACION_CODIGO` en [`src/config/site.ts`](../src/config/site.ts).

### 20. Todo listado pide solo los campos que pinta, y la media no se recorta

- **Decisión:** `select` en toda consulta que no sea el detalle de una nota;
  `populate` recorta categorías y autores. La media se trae completa.
- **Quién y cuándo:** commit `6f763dd`, 2026-09-28.
- **Por qué:** medido ese día contra Beat con las 11 notas más recientes: 103.3 KB
  sin `select` y 16.8 KB con `select` y `populate`. Recortar la media con
  `populate[media]` sin `filename` ni `prefix` devuelve `url: null`, y las fotos
  desaparecen de todas las tarjetas sin un solo error. Ahorraba 2.3 KB.
- **Descartado:** recortar la media.
- **Dónde vive:** `CAMPOS_LISTADO` en
  [`src/lib/cms/noticias.ts`](../src/lib/cms/noticias.ts).

### 21. Las piezas no salen en ningún listado; «Excluir del home», solo en la portada

- **Decisión:** una nota con `distribucion: 'pieza'` queda fuera de TODO listado;
  `excluirDelHome` solo aplica al Inicio. Cada filtro es un `or` con
  `exists: false`, y cada uno va en su propio `where[and][n]`.
- **Quién y cuándo:** commit `6f763dd`, 2026-09-28. Que las piezas queden fuera
  de todo listado, y no solo del Inicio, es heredado de web-beat.
- **Por qué:** una pieza conserva su URL, su sitemap y el buscador, pero su lugar
  es dentro de su colección. Dos `or` sueltos se rompen: si comparten claves el
  segundo pisa al primero, y si no, se funden en un solo `or` de cuatro términos
  que una pieza puede cumplir. El `exists: false` está porque en Postgres un `!=`
  no devuelve las filas con NULL, y las notas de Stereo Cien llegan por una
  migración: no se apuesta a que el importador escriba el valor por omisión.
- **Descartado:** nada registrado.
- **Dónde vive:** `SIN_PIEZAS` y `FUERA_DEL_HOME` en
  [`src/lib/cms/noticias.ts`](../src/lib/cms/noticias.ts).

### 22. Una categoría que no existe da cero notas, nunca todas

- **Decisión:** si `obtenerNotas` recibe una categoría que el CMS no tiene,
  devuelve vacío. La categoría se resuelve por slug a su id una vez, y el listado
  filtra por ese id.
- **Quién y cuándo:** commit `6f763dd`, 2026-09-28.
- **Por qué:** hoy ninguna categoría de Stereo Cien existe en el CMS; confundir
  «no existe» con «sin filtro» pintaría las mismas notas en cada bloque del
  Inicio, el fallo que nadie reporta porque la página se ve llena. Se filtra por
  slug porque el id de WordPress no sobrevive la migración (queda aparte, en
  `wpId`) y el slug sí; y por id y no por `categorias.slug` porque el join crece
  con la tabla, y Cultura Pop trae 10,119 entradas.
- **Descartado:** filtrar por el id numérico de WordPress, como hacía el sitio
  viejo.
- **Dónde vive:** `obtenerNotas` en
  [`src/lib/cms/noticias.ts`](../src/lib/cms/noticias.ts), `obtenerCategoria` en
  [`src/lib/cms/categorias.ts`](../src/lib/cms/categorias.ts).

### 23. Los enlaces del cuerpo: esquemas cerrados, y el dominio propio es interno

- **Decisión:** el renderizador de Lexical deja pasar en un `href` solo `http`,
  `https`, `mailto`, `tel` y rutas relativas. Un enlace absoluto a
  `stereociendigital.mx` se trata como interno: no abre pestaña nueva.
- **Quién y cuándo:** commit `6f763dd`, 2026-09-28.
- **Por qué:** un `javascript:` en un enlace es el mismo XSS almacenado que un
  `set:html`, solo que esperando un clic. Y las notas del WordPress se enlazan
  entre sí con la URL completa: 32 enlaces así en las 50 entradas más recientes
  (2026-09-28). La URL se deja como viene y el 301 del sitio viejo la lleva a su
  nota nueva.
- **Descartado:** nada registrado.
- **Dónde vive:** `hrefDe` y `esExterno` en
  [`src/components/Lexical.astro`](../src/components/Lexical.astro).

### 24. La navegación solo lleva a destinos que existen hoy

- **Decisión:** cada sección enlaza a su ancla del Inicio (`/#vinilos`), no a una
  ruta. PROGRAMACIÓN queda fuera del menú; Alexa, el aviso de privacidad y los
  términos, fuera del pie; YouTube, fuera de las redes. Las redes usan un
  respaldo por red mientras el CMS no las tenga.
- **Quién y cuándo:** commit `6f763dd`, 2026-09-28.
- **Por qué:** `/vinilos` respondería 404. No hay ruta de programación y el CMS
  tiene 0 programas de Stereo Cien. `/alexa`, `/avisodeprivacidad` y
  `/terminosycondiciones` eran páginas del sitio viejo que este no tiene. El
  YouTube del pie viejo estaba comentado y apuntaba al canal de Beat. Los cinco
  campos de redes de la estación están en `null` en el CMS; el respaldo sale del
  pie del sitio viejo, y el CMS gana red por red en cuanto capture una.
- **Descartado:** enlazar rutas de sección que todavía no existen.
- **Dónde vive:** `NAV_CABECERA`, `REDES_RESPALDO`, `APPS` y `LEGALES` en
  [`src/config/navegacion.ts`](../src/config/navegacion.ts); `redesEstacion` en
  [`src/lib/cms/estacion.ts`](../src/lib/cms/estacion.ts). Qué categorías llenan
  cada sección es todavía una propuesta: ver [pendientes.md](pendientes.md).

### 25. El JSON-LD no afirma nada que la página no pinte

- **Decisión:** la ficha de la estación va sin `callSign` ni `areaServed`. La
  migaja del JSON-LD de una nota omite el eslabón de sección mientras su destino
  sea un ancla del Inicio.
- **Quién y cuándo:** `b5c9b11` (la ficha) y `c6b0453` (la migaja), 2026-09-28.
- **Por qué:** Google trata el marcado engañoso quitando la ficha entera, no solo
  la propiedad. Ningún texto del sitio viejo dice cuál es el indicativo: la razón
  social «Radio XHMM-FM» apunta a uno, pero el nombre de una sociedad no es una
  afirmación sobre la concesión, y un mount de Triton no es un indicativo. La
  cobertura de la antena describiría lo que va por el 100.1 (Enfoque), no lo que
  suena aquí. Y un eslabón que lleva a la misma página que «Inicio» no le dice
  nada a un buscador; omitirlo no afirma nada falso.
- **Descartado:** nada registrado.
- **Dónde vive:** [`src/lib/jsonld.ts`](../src/lib/jsonld.ts),
  [`src/pages/noticias/[slug].astro`](../src/pages/noticias/[slug].astro).

### 26. La barra persiste entre páginas

- **Decisión:** el `<aside>` de la barra lleva `transition:persist="barra"`, con
  nombre explícito, y el `<head>` carga el `ClientRouter`.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28.
- **Por qué:** la barra es el corazón del concepto (§14 del traspaso): el audio
  que llegue no puede cortarse al navegar. Sin `ClientRouter`,
  `transition:persist` no hace nada; en web-beat faltó y el atributo estaba
  puesto sin servir. Sin nombre, Astro genera uno por posición que no coincide
  entre páginas con distinto número de elementos con directiva, y el nodo se
  reemplaza en silencio (medido en web-beat). La consecuencia: lo de dentro de la
  barra tiene que ser igual en todas las páginas, así que sus enlaces van a
  `/#ancla` y nada se marca «activo» desde el servidor.
- **Descartado:** nada registrado.
- **Dónde vive:** [`src/layouts/Base.astro`](../src/layouts/Base.astro),
  [`src/components/Barra.astro`](../src/components/Barra.astro).

### 27. Por debajo de 1280 px, la barra es el bloque «equipo» del móvil

- **Decisión:** el corte de escritorio es 1280 px. Por debajo, la barra deja de
  ser lateral y entra al flujo entre la cabecera y la revista, con una rejilla de
  cuatro filas y `subgrid` en el `<main>`.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28.
- **Por qué:** 1280 es el `min-width` del tablero de escritorio del lienzo, y el
  móvil del diseño pone la cabecera arriba y el equipo debajo (§6), al revés del
  orden del documento. `subgrid` es lo único que mete la barra entre dos hijos
  del `<main>` sin sacarlos de él. Sin `subgrid` queda la barra arriba y luego la
  cabecera: se lee igual.
- **Descartado:** `display: contents` en el `<main>` (hay lectores de pantalla
  que con eso pierden el punto de referencia «principal») y envolver la cabecera
  (`sticky` se pega dentro de su padre y dejaría de estar fija).
- **Dónde vive:** [`src/styles/sitio.css`](../src/styles/sitio.css); las medidas
  compactas, en [`src/components/Barra.astro`](../src/components/Barra.astro).

### 28. Los controles que todavía no hacen nada van `disabled`, y nada finge que suena

- **Decisión:** ESCUCHAR EN VIVO y la cápsula SOUNDS se pintan porque el diseño
  los quiere a la vista, pero con `disabled`. La tornamesa no gira, el punto rojo
  no late y el ecualizador está quieto.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28; heredado de web-beat.
- **Por qué:** un botón que no hace nada y no está deshabilitado es alcanzable
  con el tabulador, se anuncia en el lector de pantalla y enseña a desconfiar de
  los demás. Con `disabled` se ve, no se enfoca y se anuncia como no disponible.
  Un disco girando afirmaría que algo suena. Quien construya el reproductor y el
  menú les quita el `disabled`: el enganche ya está (`data-accion="play"`,
  `aria-controls="menu-sounds"`).
- **Descartado:** dejarlos como botones inertes.
- **Dónde vive:** [`src/components/Barra.astro`](../src/components/Barra.astro),
  [`src/components/Tornamesa.astro`](../src/components/Tornamesa.astro).

### 29. Una zona sin contenido no pinta nada

- **Decisión:** ni rótulo ni «próximamente». Las 9 secciones del Inicio sin datos
  quedan como `<section id>` vacías; la barra no pinta AHORA SUENA, el volumen ni
  las pestañas; la cabecera no pinta BUSCAR ni MENÚ; el pie va en su versión
  mínima.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28; heredado de web-beat.
- **Por qué:** el Inicio se acorta en vez de enseñar un encabezado con nada
  debajo, y se va llenando solo conforme la redacción captura, sin un despliegue
  por sección. Una sección vacía no ocupa lugar, no se anuncia (sin nombre
  accesible no es punto de referencia) y sigue siendo un ancla válida para el
  índice. Por lo mismo la cabecera no esconde entradas por ancho como el diseño:
  sin MENÚ, una entrada escondida no tendría otro camino.
- **Descartado:** rótulos de relleno.
- **Dónde vive:** [`src/pages/index.astro`](../src/pages/index.astro),
  [`src/components/Barra.astro`](../src/components/Barra.astro),
  [`src/components/Cabecera.astro`](../src/components/Cabecera.astro),
  [`src/components/Pie.astro`](../src/components/Pie.astro).

### 30. Los tokens son los del §8, y la paleta de Tailwind no existe

- **Decisión:** los tokens del §8 del traspaso van en Tailwind 4 con
  `@theme static`, y `--color-*: initial` quita la paleta de Tailwind. Sin el
  lima. Cian y rojo solo como gráfico. El anillo de foco es azul sobre claro y
  cian solo sobre la barra. Tailwind entra por el plugin de Vite.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28.
- **Por qué:**
  - `static`: casi todo el CSS lee los tokens con `var()` desde el `<style>` de
    cada componente, que Tailwind no ve. Sin él, el sitio no truena: se pinta sin
    colores.
  - Sin paleta: `text-red-500` sería la puerta para meter un color que la marca
    no tiene, o texto en cian.
  - El foco pide 3:1 contra lo que lo rodea, y el cian sobre blanco da 2.6:1.
  - Mandan las reglas del §8 y no las notas de `tokens.json` del paquete: el
    propio traspaso avisa que esas notas son viejas.
  - `@astrojs/tailwind` se quedó en Tailwind 3 y Astro 5.
- **Descartado:** `@astrojs/tailwind`, que usaba el sitio viejo.
- **Dónde vive:** [`src/styles/tokens.css`](../src/styles/tokens.css),
  [`src/styles/sitio.css`](../src/styles/sitio.css), el orden de capas en
  [`src/styles/base.css`](../src/styles/base.css),
  [`astro.config.mjs`](../astro.config.mjs).

### 31. Las fuentes se auto-hospedan, y la display es Montserrat 900 mientras Lovelo no tenga licencia

- **Decisión:** ocho woff2 (217 KB) servidos desde el propio dominio: Montserrat
  900 como display, Libre Baskerville para el texto editorial y Roboto para la
  interfaz.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28; el auto-hospedaje es heredado
  de web-beat.
- **Por qué:** sin DNS ni TLS a terceros antes del primer pintado, se cachean como
  cualquier archivo del sitio y no se le manda a Google la IP del lector. Lovelo
  Black, la display del §8, no viene en el paquete de diseño ni tiene licencia
  confirmada para web; Montserrat 900 es la alternativa que el propio diseño
  declara. Las tres familias son SIL Open Font License 1.1.
- **Descartado:** el `<link>` a Google Fonts de los tableros.
- **Dónde vive:** [`scripts/fuentes.mjs`](../scripts/fuentes.mjs) (se corre con
  `pnpm fuentes` y la salida se commitea),
  [`src/styles/fuentes.css`](../src/styles/fuentes.css) (generado),
  `--font-display` en [`src/styles/tokens.css`](../src/styles/tokens.css), los dos
  `preload` en [`src/layouts/Base.astro`](../src/layouts/Base.astro).

### 32. Sin scroll suave

- **Decisión:** `html` no lleva `scroll-behavior: smooth`, aunque los tableros lo
  traen.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28.
- **Por qué:** el `ClientRouter` restaura la posición al volver atrás con un
  `scrollTo(x, y)` sin `behavior`. Con el scroll suave, el regreso al Inicio se
  vería bajar animado desde arriba hasta donde se había quedado el lector. Los
  tableros no tienen router y ahí no pasaba.
- **Descartado:** el scroll suave de los tableros.
- **Dónde vive:** [`src/styles/sitio.css`](../src/styles/sitio.css).

### 33. El favicon es el delfín del sitio viejo

- **Decisión:** el icono cuadrado es el delfín sobre la ola que hoy enseña la
  pestaña de `stereociendigital.mx`. La tarjeta de compartir de respaldo, de
  1200×630, es el logo en blanco sobre `#012169`. Las dos las genera un script
  que se corre a mano, y su salida se commitea.
- **Quién y cuándo:** commit `c6b0453`, 2026-09-28.
- **Por qué:** es el mismo archivo, con el mismo sha256, que sirve hoy el sitio
  vivo (comprobado el 2026-09-28), así que el cambio de sitio no le cambia el
  icono a quien lo tiene en sus marcadores. El paquete de diseño no trae ningún
  icono cuadrado. El script no va en el build porque `sharp` es dependencia de
  desarrollo, y así lo que se sirve es lo que alguien miró antes de commitear.
- **Descartado:** un favicon SVG. El único SVG de la marca es el logotipo
  horizontal, que a 16 o 32 px es una raya ilegible.
- **Dónde vive:** [`scripts/tarjetas.mjs`](../scripts/tarjetas.mjs) (se corre con
  `node scripts/tarjetas.mjs`),
  [`public/img/stereocien-icono.png`](../public/img/stereocien-icono.png),
  [`public/favicon/`](../public/favicon/),
  [`public/img/og-stereocien.png`](../public/img/og-stereocien.png), y la medida
  en `MEDIDA_TARJETA` de [`src/config/site.ts`](../src/config/site.ts).
