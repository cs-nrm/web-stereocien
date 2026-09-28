# web-stereocien, rama `stereocien-v2`: el sitio nuevo de Stereo Cien 100.1

Astro 7 en modo SSR (adaptador de Node, `standalone`) sobre `cms-estaciones`, el
Payload multi-estación de NRM (`https://admin.nrm.com.mx/api`, lectura pública).
Es el sitio que va a sustituir al que hoy sirve `stereociendigital.mx`.

La plantilla es [web-beat](https://github.com/cs-nrm/web-beat) (rama `beat`, el
sitio de Beat 100.9, al aire desde el 10 sep 2026), y la regla con la que se armó
esta rama es **portar, no rediseñar**: lo que allá ya se pagó con fallos de
producción se trae tal cual, y solo se adapta lo que es de la estación.

> Si algo de lo que sigue no coincide con el código, gana el código y esto es un
> bug del documento.

## En qué estado está

**Es la BASE, y no está al aire.** Trae los cimientos y el cascarón: el lector de
Payload, los tokens y las fuentes del diseño, el layout con la barra de la radio
fija entre páginas, la nota mínima en `/noticias/<slug>`, las reglas de
indexación, el mapa de 301 del sitio viejo (vacío todavía), las guardas y la CI.
Del Inicio solo se llenan dos de las once secciones, «La noticia» y «Lado A · Las
de hoy», con las notas más recientes; las otras nueve son anclas vacías. No trae
reproductor, anuncios ni scrollytelling.

**Hoy Stereo Cien tiene cero contenido en el CMS**: la migración del WordPress está
pendiente. Por eso el Inicio real enseña la barra, la cabecera y el pie, y nada
más. **Es lo correcto**, no una avería. Cómo verlo con notas está más abajo.

Lo que ya se decidió y por qué está en [docs/decisiones.md](docs/decisiones.md); lo
que falta y quién lo desbloquea, en [docs/pendientes.md](docs/pendientes.md).

## Las ramas

Confundirlas es el error más caro de este repo.

| Rama | Qué es |
|---|---|
| `stereocien` | **El sitio viejo**: Astro estático sobre WordPress, el que está al aire hoy. El equipo sigue empujando ahí mientras el nuevo no salga. |
| `stereocien-v2` | **Este sitio.** Nació el 28 sep 2026 de `stereocien` (`ebe66f2`). No se mezcla con `stereocien` en ninguna dirección. |
| `main` | Abandonada. No se usa y no se le hace PR. |

**Trampa: `main` es la rama por omisión de GitHub.** Un `git clone` sin `-b` te
deja en el sitio equivocado, GitHub propone `main` como destino de cada PR, y los
worktrees que crea la app de escritorio de Claude nacen sobre ella. Por eso aquí
siempre se clona con `-b stereocien-v2` y el PR se cambia a mano a
`stereocien-v2`.

Los dos primeros commits de la rama sirven de mapa: el primero (`a597927`) vacía
el árbol del sitio viejo y sube el paquete del diseño, y el segundo (`be47585`)
copia tal cual la base de web-beat en `b30e3fb`. Así, `git diff be47585 -- <archivo>` enseña exactamente qué se adaptó a
Stereo Cien y qué quedó igual que en la plantilla.

## Clonar

**Si no tienes el repo**, un clon nuevo, ya en la rama:

```bash
git clone -b stereocien-v2 https://github.com/cs-nrm/web-stereocien.git web-stereocien-v2
cd web-stereocien-v2
```

**Si ya tienes el repo y ahí construyes el sitio viejo**, no cambies de rama en esa
carpeta ni corras `pnpm install` ahí. Desde la carpeta del sitio viejo:

```bash
git fetch origin
git worktree add ../web-stereocien-v2 stereocien-v2
cd ../web-stereocien-v2
```

El porqué: el sitio viejo solo compila con el `node_modules` que ya tienes en esa
carpeta, y ese `node_modules` no se puede volver a armar (`npm ci` está roto en la
rama `stereocien`). Un `pnpm install` ahí lo reescribe, y a partir de ese momento
ya no puedes construir el sitio que está al aire. El worktree es otra carpeta, con
su propio `node_modules`, sobre el mismo repo. Así lo tiene Carlos.

Y si trabajas con Claude: **abre la sesión en la carpeta de `stereocien-v2`**, no en
la del sitio viejo. El panel de preview lee el `.claude/launch.json` de la carpeta
donde se abrió la sesión, y desde la del sitio viejo levanta el sitio viejo.

## Arrancar

1. **Node 22**, 22.12 o más nuevo (`engines` de `package.json`). `.nvmrc` dice
   `22`, así que con nvm basta `nvm use`.
2. **pnpm 9.0.0**, fijado en `packageManager` y servido por corepack:

   ```bash
   corepack enable
   ```

   Node 22 y 24 traen corepack; desde Node 25 ya no viene incluido, y si
   `corepack` no existe, `npm install -g corepack` primero. Si tienes otro pnpm
   global que se interpone, `corepack pnpm <comando>` usa siempre el fijado. Aquí
   no se usa npm: el `package-lock.json` es de la rama `stereocien`, del sitio
   viejo.
3. **El `.env`**:

   ```bash
   cp .env.example .env
   ```

   y en el `.env` pon `CMS_URL=https://admin.nrm.com.mx`. La lectura del CMS es
   pública: no hace falta ninguna credencial.
4. **Dependencias y servidor de desarrollo**:

   ```bash
   pnpm install
   pnpm dev
   ```

   Arranca en http://localhost:4321. Si el puerto está ocupado (el `npm run dev`
   del sitio viejo usa el mismo), Astro toma el siguiente libre y lo imprime en la
   consola: abre el que diga ahí, no el que esperabas.

**`CMS_URL` es la variable que hace o rompe el arranque.** Va SIN prefijo
`PUBLIC_`, así que se lee en EJECUCIÓN, no al compilar. Si falta, el sitio
responde **200 con la casa vacía**: barra, cabecera y pie perfectos, y ni una nota.
No hay error en pantalla, y en Stereo Cien se ve idéntico a lo que se ve hoy con el
CMS vacío. Pasó en el beta de `web-enfoque` y volvió a pasar en web-beat con
`pnpm preview`. `pnpm dev` carga el `.env`; `pnpm preview` y el servicio **no**:

```bash
pnpm preview:cms
# o, lo mismo:
CMS_URL=https://admin.nrm.com.mx pnpm preview
```

En local el sitio sale `noindex` y sin medición (ni GTM, ni comScore, ni Hotjar, ni
Metricool). Las dos cosas se deciden por el host de cada petición, y `localhost` no
es el dominio canónico. Es lo que se quiere. `SITIO_NOINDEX=0` abre la indexación
para probarla, pero no enciende la medición: esa solo sale en
`stereociendigital.mx`.

### Ver el sitio con notas

Mientras la migración no esté cargada, la única forma de ver tarjetas y notas es
pedirle al CMS las de otra estación:

```bash
ESTACION_CODIGO=beat pnpm dev
```

Sirve las notas de Beat con la marca de Stereo Cien. **Solo en local**: nunca en un
`.env` que sirva `stereociendigital.mx`, porque nada en pantalla delataría que el
contenido es de otra estación. Por eso el valor por omisión es siempre
`stereocien`.

## Los comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo. Carga `.env`. `pnpm start` es lo mismo: no arranca el build |
| `pnpm build` | **La puerta**: `astro check` + `scripts/guardas.mjs` + `astro build` + `scripts/guarda-cascada.mjs`. La misma que corre CI |
| `pnpm check` | `astro check` + las guardas. **No basta como puerta** |
| `pnpm guardas` | Solo las dos guardas. La de cascada lee el CSS de `dist/`: sin un build previo se omite |
| `pnpm preview` | Sirve lo que dejó `pnpm build`. **No carga `.env`** |
| `pnpm preview:cms` | Lo mismo, con `CMS_URL=https://admin.nrm.com.mx` |
| `pnpm sync:types` | Trae los tipos de Payload a `src/types/payload.ts` desde el commit de `cms-estaciones` fijado en `payload-types.lock.json`. Necesita ese repo clonado junto a este (`../cms-estaciones`), y es privado: pide acceso |
| `pnpm sync:types:check` | Falla si `src/types/payload.ts` no coincide con el commit fijado |
| `pnpm fuentes` | Regenera `public/fuentes/` y `src/styles/fuentes.css` desde Google Fonts. Se corre a mano y la salida se commitea |
| `node scripts/tarjetas.mjs` | Regenera la tarjeta de compartir (`public/img/og-stereocien.png`) y los favicon. Se corre a mano y la salida se commitea |

**`pnpm check` NO basta.** El compilador del build rechaza cosas que `astro check`
da por buenas: en web-beat, un comentario mal cerrado dio 0 errores en `check` y
reventó el build. Antes de dar algo por bueno, `pnpm build`.

## Cómo está armado

```
src/
  pages/          index (el Inicio), noticias/[slug], 404, robots.txt, sitemap.xml, news-sitemap.xml
  layouts/        Base.astro: el <head> (canónica, indexación, Open Graph, JSON-LD, medición) y el cascarón
  components/     Barra y Tornamesa (la radio), Cabecera, Pie, TarjetaNota; Lexical y Embed (el cuerpo de la nota)
  lib/cms/        el lector de Payload: client.ts (transporte, caché, filtro por estación) y un módulo por colección. SOLO servidor
  lib/            nota.ts (presentación), jsonld.ts, feeds.ts (proxy de los sitemaps del CMS), paginacion.ts, env.ts
  config/         site.ts (URLs, indexación, CMS), navegacion.ts (índice, menú, secciones, redes), redirecciones/ (el mapa de 301)
  styles/         base.css declara el orden de capas; tokens.css, fuentes.css, sitio.css (el cascarón), prosa.css (el cuerpo)
  types/          payload.ts, generado por `pnpm sync:types`. No se edita a mano
  middleware.ts   los 301 del sitio viejo, la barra final, la caché de borde y el X-Robots-Tag
scripts/          las guardas, las fuentes, las tarjetas y el sync de tipos
public/           fuentes, iconos, logo y la tarjeta de compartir
design/           el paquete del diseño aprobado. El sitio no lee nada de aquí
```

Tres cosas que no se ven en el árbol:

- **Las notas viven en `/noticias/<slug>`**, igual que en Beat, y no en
  `/<seccion>/<slug>` como en el sitio viejo. El porqué está en
  `src/config/site.ts`. Las URLs viejas llegan a su nota con un 301 del mapa
  `src/config/redirecciones/sitio-viejo.json`, que llenará el importador del CMS.
- **Toda consulta a una colección con estación va por `cmsFetchEstacion`**, que
  inyecta el filtro. En `cms-estaciones` la lectura está abierta entre estaciones a
  propósito: una consulta sin filtro no se ve vacía, se ve llena con las notas de
  otra estación.
- **La barra de la radio no se recarga al navegar** (`transition:persist` en
  `src/layouts/Base.astro`, con el `ClientRouter`). Es el corazón del diseño: el
  reproductor que venga no se puede cortar al cambiar de página.

## El diseño

El aprobado es el lienzo **«3 · Tornamesa v3»** (versión `1790608880-572f`, 28 sep
2026). La copia está en `design/stereo-cien-home-handoff/`, subida tal cual.

Para mirarlo, abre `design/stereo-cien-home-handoff/vista-estatica/C3-Desktop.html`
en Chrome (necesita internet para las fuentes). La fuente de verdad es el lienzo,
que es privado: pídele a Carlos acceso de edición. Qué leer primero, las reglas de
color que no se negocian y cómo actualizar la copia están en
[design/README.md](design/README.md).

El diseño dibuja solo el Inicio. La nota no tiene tablero propio: usa las mismas
piezas.

## Cómo trabajamos

1. **Una rama propia desde `stereocien-v2`**:

   ```bash
   git fetch origin
   git switch -c <tu-rama> origin/stereocien-v2
   ```

2. **`pnpm build` en verde antes de pedir revisión.** Es la misma puerta que corre
   la CI (`.github/workflows/ci.yml`) en cada push a `stereocien-v2` y en cada PR
   hacia ella, sin un solo secreto. Lo que la CI no puede cubrir: que el sitio
   tenga contenido, porque allá no existe `CMS_URL`. Eso se mira contra el proceso
   arrancado.
3. **El PR va hacia `stereocien-v2`.** GitHub propone `main`: cámbialo.
4. **Commits en español, y el mensaje lleva el diagnóstico**: qué se midió, contra
   qué, y qué se descartó en el camino. `git log` da el tono.
5. **Los arreglos al sitio que está al aire van en la rama `stereocien`**, desde el
   checkout del sitio viejo. Nada viaja de una rama a la otra.
6. **Lo que se decide y lo que queda pendiente va a `docs/`**, no al chat.

Antes de cambiar una línea, lee su comentario: el porqué está escrito en el propio
código, y casi siempre existe porque algo ya falló ahí, en este repo o en web-beat.

## Documentos que valen

| Archivo | Qué es |
|---|---|
| `CLAUDE.md` | La puerta de entrada para quien llega con un agente: trampas, áreas y cómo se escribe aquí |
| `AGENTS.md` | Lo imprescindible en corto, para las herramientas que leen ese nombre (Codex) |
| `docs/decisiones.md` | Lo que ya se decidió, con su porqué |
| `docs/pendientes.md` | Lo que falta, y quién lo desbloquea |
| `design/README.md` | Cómo usar el paquete del diseño aprobado |
| `design/stereo-cien-home-handoff/stereo-cien-home-handoff.md` | El traspaso del diseño: la especificación del Inicio |
| `.env.example` | Cada variable con su porqué, y la regla de `PUBLIC_*` contra las de ejecución |
| `src/config/redirecciones/sitio-viejo.json` | El mapa de 301: su clave `//` explica el formato y quién lo genera |

Los documentos del sitio viejo (su `AGENTS.md`, `ROADMAP.md` y compañía) siguen en
la rama `stereocien` y describen aquel sitio: no aplican aquí. Hay además una
auditoría técnica del sitio viejo del 9 sep 2026 que no está versionada; si te
hace falta, pídesela a Carlos.
