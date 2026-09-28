# CLAUDE.md — puerta de entrada

El sitio nuevo de **Stereo Cien 100.1** (`stereociendigital.mx`): Astro 7 SSR sobre
`cms-estaciones`, el Payload multi-estación de NRM, con `web-beat` como plantilla
(portar, no rediseñar). **Es la base y NO está al aire**: Stereo Cien tiene cero
contenido en el CMS, así que un Inicio con barra, cabecera y pie, y nada más, es lo
correcto.

**La rama es `stereocien-v2`.** `stereocien` es el sitio viejo, el que está al
aire, y no se toca desde aquí. `main` está abandonada y es la rama por omisión de
GitHub (trampa 1).

Vocabulario: **«el sitio viejo»** es el de la rama `stereocien`; **«el sitio»** o
«el sitio nuevo» es esta rama. «v2» es solo el nombre de la rama.

---

## Antes de escribir una línea

**El porqué está en los comentarios del código.** Casi cada decisión rara tiene
encima un comentario que dice qué falló la vez que se hizo de otra forma, aquí o
en web-beat. **Léelo antes de cambiar la línea que comenta.** Si el comentario y el
código se contradicen, es un bug: dilo, no elijas uno en silencio.

Lo transversal está en tres documentos:

- [docs/decisiones.md](docs/decisiones.md) — lo que ya se decidió y por qué. No se
  reabre sin preguntarle a Carlos.
- [docs/pendientes.md](docs/pendientes.md) — lo que falta y quién lo desbloquea.
- [design/README.md](design/README.md) — el diseño aprobado y sus reglas.

Este repo **no tiene actas por área** todavía. El contexto de dominio de cada área
está en las de web-beat (`web-beat: agents/<área>.md`, repo público), y vale como
el porqué, **no como mapa de este repo**: hablan de archivos de Beat, y muchos no
existen aquí (`web-beat: src/components/Anuncio.astro`, `web-beat: src/scripts/`,
`web-beat: src/js/`).

Para ver qué se adaptó de la plantilla: `git diff be47585 -- <archivo>`. Ese commit
es la copia tal cual de web-beat en `b30e3fb`.

---

## Arrancar y las puertas

```bash
corepack enable
cp .env.example .env    # y pon CMS_URL=https://admin.nrm.com.mx
pnpm install
pnpm dev                # http://localhost:4321
```

Node 22.12 o más nuevo (`engines`; `.nvmrc` dice `22`), pnpm 9.0.0 fijado en
`packageManager`. Si el pnpm global estorba, `corepack pnpm <comando>`.

| Comando | Qué hace |
|---|---|
| `pnpm build` | **La puerta.** `astro check` + `scripts/guardas.mjs` + `astro build` + `scripts/guarda-cascada.mjs` |
| `pnpm check` | `astro check` + guardas. NO basta como puerta |
| `pnpm preview:cms` | Sirve el build con `CMS_URL` de producción (`pnpm preview` no carga `.env`) |
| `pnpm sync:types` | Tipos de Payload desde `cms-estaciones` (privado, clonado en `../cms-estaciones`) |
| `pnpm fuentes` | Regenera `public/fuentes/` y `src/styles/fuentes.css`. A mano; se commitea |
| `node scripts/tarjetas.mjs` | Regenera la tarjeta de compartir y los favicon. A mano; se commitea |

**La puerta es `pnpm build`**, y es la misma que corre la CI
([.github/workflows/ci.yml](.github/workflows/ci.yml)) en cada push a
`stereocien-v2` y en cada PR hacia ella. `pnpm check` da 0 errores en cosas que el
compilador del build rechaza (en web-beat, un comentario mal cerrado). La CI corre
sin `.env` a propósito, para no necesitar secretos; por lo mismo, un build verde no
dice que el sitio tenga contenido.

Las guardas de [scripts/guardas.mjs](scripts/guardas.mjs) y
[scripts/guarda-cascada.mjs](scripts/guarda-cascada.mjs) tienen como regla **cero
falsos positivos**, y una salida explícita, `guarda-ok <regla>: <razón>` en el
archivo, que obliga a escribir el porqué. Hoy vigilan: el ad unit escrito en el
código, `set:html`, el 404 prerenderizado (mataría los 301), el mapa de 301 del
sitio viejo y, en el CSS construido, dos reglas del mismo selector peleando por
una propiedad de transformación.

En `.claude/launch.json` hay tres entradas: `stereocien-v2` (dev, 4331),
`stereocien-v2-build` (el build servido con `.env`, 4332; hace falta `pnpm build`
antes) y `design` (el paquete del diseño, 4399).

---

## Las trampas que cuestan una tarde

La mayoría ya pasó, aquí, en web-beat o en `web-enfoque`, y donde se sabe dónde,
lo dice. Las demás son de este repo y cuestan lo mismo la primera vez.

1. **`main` es la rama por omisión de GitHub, y los worktrees de la app de
   escritorio nacen sobre ella**, no sobre `stereocien-v2`: otro árbol de archivos
   por completo, y los archivos del encargo «no existen». Misma trampa que
   documentó web-beat. Antes de tocar nada:

   ```bash
   git merge-base --is-ancestor a597927 HEAD && echo bien
   ```

   `a597927` es el primer commit de `stereocien-v2`, y `main` no lo contiene. Si no
   imprime `bien`, en el worktree recién creado y sin cambios propios:
   `git fetch origin && git reset --hard origin/stereocien-v2`, sobre la misma rama
   `claude/*` (conserva el nombre que la app sigue para el PR). Tampoco traen
   `node_modules`: `pnpm install`. Y el PR va contra `stereocien-v2`; la
   herramienta propone `main`.

2. **El checkout del sitio viejo no se toca.** El sitio viejo solo compila con un
   `node_modules` que ya no se puede reproducir (`npm ci` está roto en la rama
   `stereocien`). Quien construye el sitio viejo en una carpeta no cambia de rama
   ahí ni corre `pnpm install` ahí: usa un worktree
   (`git worktree add ../web-stereocien-v2 stereocien-v2`) o un clon aparte. Así lo
   tiene Carlos.

3. **El panel de preview de Claude lee el `.claude/launch.json` de la carpeta
   donde se abrió la sesión.** Abierta en la carpeta del sitio viejo, levanta el
   sitio viejo (el de la rama `stereocien`, `.claude/launch.json`, define
   `astro-dev` en el 4499), y parece que tus cambios no se ven. Medido el 28 sep
   2026. Abre la sesión en la carpeta de `stereocien-v2`.

4. **`CMS_URL` es de EJECUCIÓN.** Va sin prefijo `PUBLIC_`: se lee al arrancar con
   `envServidor()` (`src/lib/env.ts`), no se hornea al compilar. Si falta, el sitio
   responde **200 con la casa vacía**, sin error en pantalla, y en Stereo Cien eso
   se ve idéntico al CMS vacío de hoy. Pagada en el beta de `web-enfoque` y otra vez
   en web-beat. Cuando falta, el proceso imprime un aviso en la consola
   (`src/config/site.ts`); léelo.

5. **`pnpm preview` y el servicio no cargan `.env`.** Solo `pnpm dev` lo hace. Para
   el build: `pnpm preview:cms`, o
   `CMS_URL=https://admin.nrm.com.mx pnpm preview`. La entrada
   `stereocien-v2-build` de `.claude/launch.json` carga el `.env` a mano por lo
   mismo.

6. **El proxy de delante decide si el sitio real se indexa y si acepta POST.**
   Medido el 2026-09-28 con Astro 7.2.10; el detalle está en
   `src/config/site.ts`, «Cómo llega la petición a Node». Son tres cosas, y
   ninguna se ve en local:
   - `ProxyPreserveHost On` en el vhost. Sin eso, Node recibe el `Host` del
     backend y el sitio real sale `noindex` y sin medición.
   - `RequestHeader set X-Forwarded-Proto "https"` en el vhost :443. Apache no la
     manda por omisión, y el vhost molde de web-beat tampoco. Sin ella,
     `Astro.url` sale `http:` y `checkOrigin` responde **403 a todo POST**.
   - Todo host que sirva este proceso, staging incluido, va en
     `security.allowedDomains` (`astro.config.mjs`). Sin la lista, Astro no le
     cree a ninguna de esas dos cabeceras.

   El comentario que venía de web-beat decía que sin la lista `Astro.url` caía a
   `localhost`. Con estas versiones no pasa así: no lo repitas.

7. **`ESTACION_CODIGO=beat` solo en local.** Es la forma de ver notas mientras la
   migración no llega (`ESTACION_CODIGO=beat pnpm dev`), y en un `.env` que sirva
   `stereociendigital.mx` serviría las notas de Beat con la marca de Stereo Cien
   sin que nada lo delatara. Preventiva: no ha pasado, y el valor por omisión es
   siempre `stereocien` para que no pase.

8. **Una consulta nueva va por `cmsFetchEstacion`, nunca por `cmsFetch`**
   (`src/lib/cms/client.ts`). En `cms-estaciones` la lectura está abierta entre
   estaciones a propósito, y olvidar el filtro no da error: devuelve las cuatro
   marcas mezcladas. Aquí se nota más que en ningún lado: con cero contenido
   propio, una consulta sin filtro no se ve vacía, se ve LLENA. `cmsFetch` es solo
   para `estaciones` y las colecciones sin estación (`media`).

9. **Todo efecto se prueba en el flujo Inicio → nota → atrás**, no recargando. La
   barra lleva `transition:persist="barra"` con el `ClientRouter`: su DOM
   sobrevive a la navegación y el JavaScript no se vuelve a ejecutar. En web-beat
   se rompieron ahí cuatro cosas distintas y ninguna se veía en carga limpia. Por
   lo mismo, el marcado de la barra tiene que ser idéntico en todas las páginas: el
   de la página nueva se descarta (ver `src/components/Barra.astro`). Y sin el
   `<ClientRouter />` de `src/layouts/Base.astro`, `transition:persist` no hace
   nada: en web-beat estuvo faltando desde que se construyó la cabecera, con el
   atributo puesto y sin servir de nada.

10. **La cascada CSS se prueba sobre un build SERVIDO, no sobre `astro dev`.**
    `src/styles/sitio.css` y `src/styles/prosa.css` entran en `layer(proyecto)`, y
    el `<style>` de cada componente no lleva capa, así que le gana a todo
    (`src/styles/base.css`); en web-beat, con el mismo esquema, dev y build
    discreparon. `pnpm build` y luego
    la entrada `stereocien-v2-build` (4332) o `pnpm preview:cms`. La guarda de
    cascada lee el CSS construido de `dist/` por la misma razón.

11. **Una zona sin contenido se deja vacía y sin rótulo.** Nada de «próximamente»:
    el rótulo que la encabezaba también se va. Así está armado hoy el Inicio
    (`src/pages/index.astro`): cada sección sin datos queda como una `<section id>`
    vacía, que no ocupa lugar y sigue siendo ancla del índice. Regla de web-beat.
    Vale igual para un botón que todavía no hace nada: no se pinta (por eso faltan
    BUSCAR y MENÚ en la cabecera). La excepción es lo que el diseño quiere a la
    vista: ESCUCHAR EN VIVO y la cápsula SOUNDS se pintan, pero con `disabled`
    (`src/components/Barra.astro`), para que no se enfoquen ni finjan funcionar.

12. **Un atributo sin valor vale la cadena vacía, y `!!''` es `false`.** Para un
    `data-algo` a secas, `hasAttribute`. Así se quedó plegado el menú de web-beat
    al volver al Inicio.

13. **`set:html` está prohibido con contenido del CMS**: es XSS almacenado. El
    cuerpo de la nota sale como texto por `src/components/Lexical.astro`, y los
    embeds se reconstruyen desde la URL (`src/components/Embed.astro`). Los dos
    únicos `set:html` del repo son JSON-LD que arma `serializar()` de
    `src/lib/jsonld.ts`, con su `guarda-ok`. `web-enfoque` lo usa, y es una de
    las dos razones por las que la plantilla es web-beat (la otra: `web-enfoque`
    lee otro CMS, `cms-nrm`).

14. **El código de anuncios muerto se BORRA, no se comenta.** Astro conserva los
    comentarios HTML en la página servida, y un `grep` sobre el HTML de producción
    coincide igual dentro de `<!-- -->`. En el sitio viejo, el 9 sep 2026, eso dio
    dos diagnósticos falsos: un respaldo de AdSense que parecía vivo y una red vieja
    de Ad Manager que solo existía en un comentario. Se borra en un commit aparte,
    que se pueda revertir.

---

## Mapa de áreas

Quién toca qué HOY en este repo, y qué documento de web-beat (o del sitio viejo)
sirve de referencia al portar esa área.

| Área | Archivos que le tocan hoy | Referencia al portar | Estado |
|---|---|---|---|
| frontend | `src/components/Barra.astro`, `src/components/Tornamesa.astro`, `src/components/Cabecera.astro`, `src/components/Pie.astro`, `src/components/TarjetaNota.astro`; `src/pages/index.astro`, `src/pages/404.astro`; `src/styles/`; el `<body>` de `src/layouts/Base.astro` | `web-beat: agents/frontend.md` y `web-beat: movimiento.md` | Cascarón. Faltan 9 de las 11 secciones del Inicio, el scrollytelling, el menú SOUNDS, BUSCAR y MENÚ, el newsletter, el pie completo y REDUCIR MOVIMIENTO |
| content | `src/lib/cms/`, `src/lib/nota.ts`, `src/lib/paginacion.ts`, `src/pages/noticias/[slug].astro`, `src/components/Lexical.astro`, `src/components/Embed.astro`, `SECCIONES_EDITORIALES` en `src/config/navegacion.ts`, `src/types/payload.ts` | `web-beat: agents/content.md` y `web-beat: docs/lo-que-el-front-necesita-del-cms.md` | Lector portado. Cero contenido hasta la migración; la asignación sección → categoría es PROPUESTA |
| metadata | el `<head>` de `src/layouts/Base.astro`, `src/config/site.ts`, `src/middleware.ts`, `src/config/redirecciones/`, `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts`, `src/pages/news-sitemap.xml.ts`, `src/lib/feeds.ts`, `src/lib/jsonld.ts`, `scripts/tarjetas.mjs` | `web-beat: agents/metadata.md` | Portado. El mapa de 301 está vacío; faltan `/rss.xml` y el indicativo de la estación para el JSON-LD |
| streaming | el contrato de la barra en `src/components/Barra.astro` (`#player`, `data-mount`, `data-accion="play"`), `tritonMount` en `src/lib/cms/estacion.ts`, `src/components/Tornamesa.astro` (gira cuando haya audio) | `web-beat: agents/streaming.md`; del sitio viejo, rama `stereocien`: `src/js/player.js` | Sin reproductor. El mount `XEOYAM` es correcto; hay que medir el que suena de verdad antes de portar |
| sounds | la cápsula SOUNDS de `src/components/Barra.astro`, la pista A2 de `LADOS` en `src/config/navegacion.ts`, `PENDIENTES_EN_EL_CMS` en `src/lib/cms/client.ts` | No hay acta en web-beat. Del sitio viejo, rama `stereocien`: `wp/plugins/sounds-by-stereo-cien/`, `src/pages/sounds/`, `src/pages/fiesta-sounds/`, `.agents/specs/sounds.json` | Sin fuente de datos: los 4 canales siguen en el WordPress |
| ads | ninguno, a propósito; solo la guarda del ad unit en `scripts/guardas.mjs` | `web-beat: agents/ads.md`; del sitio viejo, rama `stereocien`: `src/js/ads.js` y `public/ads.txt` | Sin anuncios. Cuando lleguen: solo Google Ad Manager con AdX de respaldo, ad unit por env. AdSense no vuelve |
| analytics | los cuatro contenedores del `<head>` de `src/layouts/Base.astro`, la sección «Medición» de `.env.example`, `src/env.d.ts` | `web-beat: agents/analytics.md` | GTM, comScore, Hotjar y Metricool se emiten solo si su variable trae valor y la petición es del dominio canónico. El front no manda eventos propios |
| deploy | `.github/workflows/ci.yml`, `security.allowedDomains` en `astro.config.mjs`, `.claude/launch.json` (solo local) | `web-beat: agents/deploy.md`, `web-beat: scripts/desplegar-v2.sh`, `web-beat: .github/workflows/deploy.yml`, `web-beat: deploy/apache/020-beatdigital.conf` | No hay dónde desplegar: no hay workflow de despliegue ni script. Un push a `stereocien-v2` solo corre la CI |

**`src/layouts/Base.astro` lo comparten frontend, metadata y analytics** (y ads,
cuando haya anuncios), y `src/middleware.ts` junta los 301 del sitio viejo, la
caché de borde y el `X-Robots-Tag`. Antes de tocar cualquiera de los dos, lee el
comentario de la parte que vas a cambiar: es lo que evita pisarse.

---

## Cómo se escribe aquí

- **Todo va en español** (código, comentarios, commits, documentos), y los nombres
  de archivo y de función también.
- **El porqué va en el código.** Un comentario dice lo que no se debe romper y la
  trampa que se midió; se lee antes de cambiar la línea que comenta.
- **Toda ruta que se cite en un documento tiene que existir**, y se comprueba con
  `ls` o `test -e` antes de escribirla, no de memoria. Una ruta de otro repo lleva
  el nombre del repo delante (`web-beat: agents/streaming.md`). Las actas de
  web-beat se reescribieron enteras porque citaban más de cuarenta archivos
  inexistentes, que es peor que no tener documentación.
- **El mensaje del commit lleva el diagnóstico**: qué se midió, contra qué, y qué
  se descartó en el camino. `git log` da el tono.
- **Cero emojis marcadores** en código, comentarios, commits o documentos. El
  porqué se escribe con palabras («no romper:», «trampa:», «verificado:»).
- **Las decisiones y los pendientes van a `docs/`** (`docs/decisiones.md`,
  `docs/pendientes.md`), no se quedan en el chat ni en un comentario suelto.
- **Nada de secretos en el repo, que es público.** `.env` está ignorado; lo que va
  en `.env.example` son valores que ya salen en el HTML del sitio.
