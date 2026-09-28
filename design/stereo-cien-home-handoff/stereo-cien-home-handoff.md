# Stereo Cien · Nueva home — paquete de traspaso

- **Proyecto:** rediseño de la home de stereociendigital.mx (Stereo Cien 100.1 FM)
- **Estado:** prototipo de diseño navegable. No es código de producción.
- **Versión del lienzo:** `1790608880-572f`, del 28 de septiembre de 2026
- **Idioma del sitio:** español (México)

Este documento sirve para dos cosas. La primera es que otro Claude, u otra persona, entienda el diseño y pueda modificarlo sin romper nada. La segunda es recrear el lienzo completo en otra cuenta o en otra computadora. Va dentro del zip `stereo-cien-home-handoff.zip`, que también trae los archivos fuente, las imágenes y capturas de referencia.

---

## 1. Qué es

Es la nueva home de Stereo Cien. El concepto se resume en *la radio fija, la revista con scroll*:

- **A la izquierda hay una barra fija con una tornamesa.** El reproductor nunca desaparece: botón de escuchar, disco que gira, índice de secciones, lo que suena ahora y la programación.
- **A la derecha hay una revista que se lee con scroll**, con transiciones guiadas por el scroll (scrollytelling).
- **El sitio está organizado como un disco.** El **Lado A** es todo lo musical: noticias de música, SOUNDS, Vinilos y Podcasts. El **Lado B** es vida y estilo: Comida y guías, Libros, Autos y Relojes. Al final va **GANA**, con las promociones.
- **Referencia de ambición:** Codrops Webzibition. La idea era que se viera nuevo e impactante, no genérico.

## 2. Dónde vive

| Qué | Dónde |
|---|---|
| **Lienzo (fuente de verdad)** | https://claude.ai/artifact/Kp5Y8gZXuM3uhoUshron1h. Es un artefacto de tipo *Design*; la versión actual está en la página **"3 · Tornamesa v3"**. |
| Archivo histórico | Páginas "2 · Archivo (v2 brief)" y "1 · Exploración" del mismo lienzo. Solo son referencia. La exploración v1 usa un acento lima que ya se eliminó. |
| Página de tendencias | https://claude.ai/artifact/EfYUP3hoCmNLGuqj3qKj36 ("Tendencias al Cien"). Hay una copia en `tendencias/`. |
| Sistema de diseño | "Stereo Cien": https://claude.ai/code/artifact/616a4523-9903-4755-a46c-3b3ffa586219. Hay una copia en `project/ds/stereo-cien/tokens.json`. |

Los artefactos son privados. Se comparten desde el menú **Compartir** del lienzo, y para que otra persona (y su Claude) pueda modificarlo, necesita **acceso de edición**.

## 3. Cómo pasárselo a otro Claude

### Opción A: el mismo lienzo (recomendada)

1. Comparte el lienzo con **acceso de edición** a la persona.
2. En su Claude, que debe tener la herramienta Artifact (por ejemplo, Cowork), pega esto junto con este `.md`:

```text
Vas a continuar el diseño de la nueva home de Stereo Cien.
Lienzo: https://claude.ai/artifact/Kp5Y8gZXuM3uhoUshron1h (tipo Design), página "3 · Tornamesa v3".
Primero lee el archivo stereo-cien-home-handoff.md adjunto. Después lee con la herramienta
Artifact los archivos vivos: project/C3-Desktop.dc.html, project/C3-Movil-1.dc.html,
project/C3-Movil-2.dc.html y project/canvas.json.
El equipo edita en vivo: vuelve a leerlos justo antes de publicar y conserva todas las
imágenes <img src="/_blob/…"> que encuentres (son fotos que puso el equipo).
Lo que quiero cambiar: …
```

### Opción B: este paquete (otra cuenta u otra computadora)

Sube el zip completo, o la carpeta descomprimida, y di qué quieres cambiar. Con esto el otro Claude puede:

- leer el diseño y proponer o hacer cambios sobre los archivos de `project/`;
- recrear el lienzo en su propia cuenta con todo y fotos, siguiendo la sección 13.

El zip que exporta el propio lienzo, con el HTML, sirve para **ver** el diseño. Para **editarlo**, los originales son los `.dc.html` de `project/`, que vienen en este paquete.

### Opción C: llevarlo a un sitio real

Usa este documento como especificación. La sección 14 trae notas para desarrollo.

## 4. Contenido del paquete

```text
stereo-cien-home-handoff/
├── stereo-cien-home-handoff.md   ← este documento
├── project/                      ← copia exacta de los archivos editables del lienzo
│   ├── canvas.json               ← tableros, posiciones, páginas y notas del lienzo
│   ├── C3-Desktop.dc.html        ← desktop v3 (principal)
│   ├── C3-Movil-1.dc.html        ← móvil v3: página completa con scroll
│   ├── C3-Movil-2.dc.html        ← móvil v3: vista "SOUNDS en la tornamesa"
│   ├── C2-*.dc.html              ← archivo v2
│   ├── Main.dc.html, A-*, B-*, C-*.dc.html   ← exploración v1
│   └── ds/stereo-cien/tokens.json ← tokens del sistema de diseño
├── assets/
│   ├── blobs/<id>.<ext>          ← cada imagen que los tableros usan como /_blob/<id>
│   ├── blob-map.csv              ← id → archivo → qué es → dónde se usa (tablero y slot)
│   └── fuentes-logo/             ← logo SOUNDS original y sus 4 variantes limpias
├── previews/                     ← capturas de referencia (render local)
├── vista-estatica/               ← C3-Desktop, C3-Movil-1 y C3-Movil-2 en HTML normal, con fotos
├── tendencias/tendencias-al-cien.html   ← página de tendencias; abre en cualquier navegador
├── SHA256SUMS.txt                ← huellas de los archivos de project/ (versión 1790608880-572f)
└── herramientas/
    ├── lint.py                   ← valida el formato .dc.html
    ├── probar-logica.js          ← prueba la lógica del menú SOUNDS y las pestañas (Node)
    └── render-estatico.js        ← convierte un tablero en HTML estático para revisarlo (Node)
```

**Para solo mirar el diseño**, abre `vista-estatica/C3-Desktop.html` en Chrome. No responde a clics, pero el scroll sí anima. Las fuentes cargan de Google Fonts, así que necesita internet. Los tableros móviles se ven en un marco de 390×844 con su propio scroll.

Las capturas de `previews/` salen de un render local que imita el lienzo, así que pueden variar un poco respecto al editor real. Son estas:

- `desktop-1920-portada.jpg`
- `desktop-1920-menu-sounds.jpg`
- `desktop-1920-sounds.jpg`
- `desktop-1920-voltea-el-disco.jpg`
- `desktop-1920-lado-b.jpg`
- `desktop-1920-pagina-completa.jpg` (con el movimiento apagado)
- `desktop-1366-portada.jpg`
- `movil-390-portada.jpg`
- `movil-390-menu-sounds.jpg`
- `movil-390-pagina-completa.jpg`

## 5. Desktop — `C3-Desktop.dc.html`

El tablero es de 1920×1080 con `expand: fill`: en Play o en la vista enfocada llena la ventana, así que el diseño es fluido. El contenido se divide en `.c3-split`, un flex con la barra (`aside.c3-bar`) y la revista (`main.c3-main`).

### 5.1 Barra fija (`aside.c3-bar`)

La barra es `position: sticky` con `height: 100vh` y un ancho de `clamp(560px, 32vw, 640px)`. El fondo es azul `#012169`, con un brillo radial cian y una textura de grano. De arriba a abajo tiene:

1. **Fila superior.** A la izquierda, **EN VIVO · 100.1 FM**: es un botón que regresa al vivo, con un punto rojo que late cuando la fuente es el vivo. A la derecha, la **cápsula SOUNDS**: el logo, más "· CANAL" cuando suena un canal, y una flecha. Al tocarla abre el **menú de canales** (ver 5.3).
2. **Botón grande:** dice ESCUCHAR EN VIVO, ESCUCHAR SOUNDS o PAUSAR. Lleva un círculo rojo y un ecualizador cian.
3. **Tornamesa.** El vinilo gira cuando suena. La etiqueta central cambia según la fuente: logo de Stereo Cien con "100.1", o el patrón de cada canal SOUNDS. El **brazo apunta hacia el disco**: pasa de `rotate(-4deg)` a `rotate(7deg)` al reproducir.
4. **Índice tipo tracklist**, junto al disco. Son enlaces a cada sección que se iluminan con el scroll:
   - LADO A: A1 Las de hoy, A2 SOUNDS, A3 Vinilos, A4 Podcasts.
   - LADO B: B1 Comida y guías, B2 Libros, B3 Autos, B4 Relojes.
   - GANA: Promociones.
5. **AHORA SUENA**: título y artista. En vivo aparece además "LA HISTORIA DETRÁS →", que lleva a la nota `#nota-heaven`.
6. **Volumen**, con un control deslizante.
7. **Pestañas:**
   - **PROGRAMACIÓN**: línea de tiempo de 14:00 a 20:00, con la aguja roja de "ahora" y "SIGUE".
   - **RECIÉN SONÓ**: las últimas 4 canciones.

### 5.2 Revista (`main.c3-main`), en orden

| Sección | id | Contenido | Slots de imagen |
|---|---|---|---|
| Masthead 970×250 | — | Anuncio. Va dentro de la columna a partir de 1600 px y a todo lo ancho por debajo de 1599. Tiene la creatividad "portada". | (imagen directa) |
| Header fijo | — | Logo; MÚSICA · SOUNDS · PODCASTS · VIDA & ESTILO · PROMOCIONES · PROGRAMACIÓN · ENFOQUE ↗; buscar; MENÚ | — |
| La noticia | `#noticia` | Nota principal (Cultura pop) | `c3-noticia` |
| **Lado A** · Música · A1 Las de hoy | `#lado-a` | 4 notas numeradas. La 04 (etiqueta "SONANDO AHORA", id `nota-heaven`) es la historia de la canción al aire; la enlaza "LA HISTORIA DETRÁS" de la barra. Half page 300×600 en un riel a partir de 1800 px. | `c3-la-1`…`4` |
| A2 SOUNDS | `#sounds` | Sección fijada con **scroll horizontal**. Tiene una intro (logo, texto, "ABRIR SOUNDS") y 4 tarjetas de canal con "PONER EN LA TORNAMESA". | `c3-snd-bd/nd/re/nw` |
| A3 Vinilos | `#vinilos` | Reseña y 3 relacionadas, sobre fondo crema. Half page 300×600 por debajo de 1799 px. | `c3-vin-main`, `c3-vin-2`…`4` |
| A4 Podcasts | `#podcasts` | 3 tarjetas: Autos al Cien, El Especial y El Gran Circo | `c3-pod-1`…`3` |
| Billboard | — | 970×250. Por debajo de 1599 px cambia a leaderboard 728×90. | — |
| **Voltea el disco** | `#lado-b` | Transición 3D fijada: el disco gira de Lado A a Lado B | — |
| B1 Comida y guías | `#comida` | 3 notas | `c3-com-1`…`3` |
| B2 Libros | `#libros` | Reseña y robapáginas 300×250 | `c3-lib-1` |
| B3 Autos | `#autos` | Nota principal, 3 miniaturas 16:9 y la tarjeta del podcast Autos al Cien | `c3-aut-main`, `c3-aut-2`…`4` |
| B4 Relojes | `#relojes` | 2 notas | `c3-rel-1`, `c3-rel-2` |
| GANA | `#promos` | 4 promociones | `c3-pro-1`…`4` |
| Cierre | — | Newsletter "MANTENTE INFORMADO", footer (con el botón REDUCIR MOVIMIENTO) y anchor 728×90 fijo abajo, que se puede cerrar | — |

### 5.3 Menú SOUNDS

- **Abrir y cerrar:** la cápsula abre y cierra el panel. El panel es blanco, con el logo "SOUNDS by Stereo Cien" y "4 CANALES".
- **Contenido:** los 4 canales, cada uno con su disco: BACK TO DISCO, NU-DISCO, ROCK ESPAÑOL y NEWS.
  - El canal actual se marca con "EN LA TORNAMESA", un ecualizador y su disco girando.
  - Tocar un canal lo pone en la tornamesa, empieza a sonar y cierra el menú.
- **Pie del menú:**
  - "VER CANALES →" baja a `#sounds` (en móvil, a `#m-sounds`).
  - "VOLVER AL 100.1" aparece solo cuando suena un canal.
- **Otras formas de cerrarlo:** con **Esc** o con un clic fuera. Mientras se edita el lienzo, estos dos no cierran el menú.
- **Accesibilidad:** la cápsula lleva `aria-expanded` y `aria-controls="c3-snd-menu"`. Cada canal lleva `aria-pressed` y una etiqueta como "Poner Nu-Disco en la tornamesa".

### 5.4 Movimiento con el scroll (solo CSS)

- **Revelado de tarjetas** (`.rv`): usa `animation-timeline: view()`.
- **SOUNDS:** la sección es alta y tiene un pin `sticky`. La pista se mueve en X con una `view-timeline` (`--snd`).
- **Voltea el disco:** el disco hace `rotateY` de 180° mientras los textos del Lado A salen y los del Lado B entran.
- **Índice de la barra:** `.c3-split` declara un `timeline-scope`. Cada sección tiene una `view-timeline` con `inset 50% 49.9%`, y la fila activa del índice se pinta de blanco con marcador cian.
- **Soporte:**
  - Todo está dentro de `@supports (animation-timeline: view())`. Sin soporte, la página queda estática y legible.
  - `prefers-reduced-motion: reduce` y el botón **REDUCIR MOVIMIENTO** (clase `.no-motion`) apagan las animaciones y sueltan los pins.

### 5.5 Responsivo

- **Por ancho:**
  - A partir de 1800 px: riel con half page en Lado A.
  - Hasta 1799 px: se ocultan PROGRAMACIÓN y ENFOQUE del menú; el half page baja a Vinilos; "Voltea el disco" se ve al 80 %.
  - Hasta 1599 px: margen de 40 px; masthead a todo lo ancho; se oculta PROMOCIONES del menú; billboard → leaderboard 728×90; la noticia pasa a una columna; tornamesa más chica.
- **Por alto:**
  - Base: filas del índice (`--ixh`) de 22 px y tarjetas SOUNDS (`--card`) de 380 px.
  - Hasta 999 px de alto: solo baja la tornamesa (caja de 300 px).
  - Hasta 879 px: tornamesa de 240 px, `--ixh` de 20 px y `--card` de 320 px.
  - Hasta 759 px: tornamesa de 200 px, `--ixh` de 18 px y `--card` de 280 px.
- **Tamaños probados:** 1920×1080, 1440×900 y 1366×768.

## 6. Móvil

### `C3-Movil-1.dc.html` (390×844)

La página hace scroll dentro de `.m-scroll`. En orden tiene:

- masthead 320×100;
- header;
- **chips** (LADO A, SOUNDS, PODCASTS, LADO B, GANA), que se marcan con el scroll;
- **equipo** (`#m-equipo`): EN VIVO · 100.1 con la cápsula SOUNDS (su menú ocupa todo el ancho), el botón de escuchar, la tornamesa de 150 px con "ahora suena", y las pestañas PROGRAMACIÓN y RECIÉN SONÓ;
- las mismas secciones que en desktop, en el mismo orden. Tienen id `m-noticia`, `m-lado-a`, `m-sounds`, `m-vinilos`, `m-podcasts`, `m-lado-b` y `m-promos`; Comida, Libros, Autos y Relojes no tienen id;
- publicidad: robapáginas 300×250 al entrar a Lado B y otro antes de Relojes;
- un **mini player** que se acopla abajo cuando el equipo sale de pantalla, y un anchor 320×50.

Los slots son `c3m-…` (25 en total) y todavía no tienen fotos.

### `C3-Movil-2.dc.html`

Es una vista fija de "SOUNDS en la tornamesa":

- header y chips, con SOUNDS activo;
- la sección SOUNDS a pantalla completa con sus 4 canales, con Back to Disco sonando;
- el mini player.

Los slots son `c3m2-snd-*`.

## 7. Publicidad (formatos IAB)

| Formato | Tamaño | Dónde |
|---|---|---|
| Masthead | 970×250 · móvil 320×100 | Arriba de todo |
| Billboard / leaderboard | 970×250 · 728×90 por debajo de 1599 px | Entre Lado A y Lado B |
| Half page | 300×600 | Riel de Lado A a partir de 1800 px; en Vinilos por debajo de 1799 |
| Robapáginas | 300×250 | Libros (desktop). En móvil: al entrar a Lado B y antes de Relojes. |
| Anchor | 728×90 · móvil 320×50 | Fijo abajo, a la derecha de la barra, y se puede cerrar |

Cada espacio lleva la etiqueta "PUBLICIDAD" y reserva su medida exacta, para que la página no brinque al cargar el anuncio.

## 8. Sistema visual

### Colores

| Token | Hex | Uso |
|---|---|---|
| azulprincipal | `#012169` | Marca. Fondo de la barra y texto o acento sobre blanco o gris. |
| marino | `#04095d` | Fondos profundos (sección SOUNDS) |
| logo-cian | `#29abe2` | **Solo como gráfico o relleno** (ecualizador, marcadores, brillos). Nunca como texto. |
| rojo en vivo (no es token) | `#ef4444` | **Solo para marcas de en vivo y del reproductor.** Nunca como texto de menos de 24 px. |
| negro | `#000000` | Texto principal |
| white | `#ffffff` | Fondos de header y tarjetas; texto sobre azul |
| gris-fondo | `#f5f5f5` | Fondo de página |
| crema | `#f5f3e7` | Fondo de Vinilos |
| gris-texto | `#666666` | Texto secundario sobre claro |
| gris-footer-texto | `#c1c1c1` | Texto secundario sobre oscuro |
| gris-publicidad | `#71717a` | Etiqueta PUBLICIDAD sobre blanco. Algunas etiquetas usan `#666666`. |
| logo-indigo / azul-acero | `#2a3b8f` / `#24628c` | Patrones de los discos SOUNDS |

- **Lima eliminado.** El `#e7ff00` aparece solo en la exploración v1 (`Main`, `A-Frecuencia-Movil`, `B-Portada-*`); no lo reutilices.
- **Notas viejas en `tokens.json`:** todavía mencionan el lima y describen `marino` y `azul-acero` con usos distintos. Para v3 mandan las reglas de esta sección.
- **Colores del logo SOUNDS:** `#00628c` en la palabra y `#1f3d7b` en "by Stereo Cien".

### Tipografía

- **Display:** `'Lovelo', 'Montserrat', sans-serif` en peso 900, siempre en mayúsculas. Lovelo Black no está cargada (el paquete no incluye el archivo ni su licencia), así que hoy se ve Montserrat 900.
- **Texto editorial:** Libre Baskerville. Los balazos van en itálica.
- **Interfaz y etiquetas:** Roboto.
- **Antetítulos y botones:** 12 px, mayúsculas, con `letter-spacing` de 2 a 3 px. El tamaño mínimo de texto es 12 px.
- **Fuentes:** solo Google Fonts (el link `css2` que ya trae cada tablero).

### Logos (en `assets/`)

- **Stereo Cien:** `edb21c7d…svg`.
- **SOUNDS completo:** a color para fondos claros (`9d6bb4a0…`) y blanco para oscuros (`352196f2…`).
- **Palabra SOUNDS:** a color para la cápsula activa (`8514548f…`) y blanca para la cápsula en vivo (`05058650…`).
- **Original:** `fuentes-logo/logo-sounds-original.svg`. Las variantes quitan el `<style>` y recortan el viewBox.
- **Textura de grano:** `76f4b806….png`.

### Imágenes

Las notas y sus fotos van en esquina recta. El redondeo se reserva para piezas de audio (podcasts, discos y botones) y contenedores como el menú SOUNDS. Las fotos llenan su marco con `object-fit: cover`.

## 9. Estados e interacción (lógica de cada tablero)

La lógica vive en `class Component extends DCLogic { renderVals() {…} }`, en el `<script type="text/x-dc">` al final de cada archivo. La tabla describe `C3-Desktop`.

- `C3-Movil-1` tiene los mismos estados, salvo `volume`.
- `C3-Movil-2` solo tiene `playing` (arranca en true), `src` (arranca en `bd`) y `anchor`, y no tiene Tweaks.

| Estado | Valores | Efecto |
|---|---|---|
| `playing` | true / false | Gira el vinilo, entra el brazo, se mueve el ecualizador y el botón dice PAUSAR |
| `src` | `live`, `bd`, `nd`, `re`, `nw` | Fuente: el vivo o los canales Back to Disco, Nu-Disco, Rock Español y News. Cambia la etiqueta del disco, AHORA SUENA y los colores de la cápsula. |
| `tab` | `prog`, `hist` | Pestaña de abajo |
| `sndOpen` | true / false | Menú SOUNDS abierto |
| `volume` | 0–100 | Deslizador de volumen |
| `motion` | true / false | Botón REDUCIR MOVIMIENTO |
| `anchor` | true / false | Anchor visible o cerrado |

**Tweaks › Edición** (en `C3-Desktop` y `C3-Movil-1`). Son props del tablero y solo actúan mientras se edita; en Play no cambian nada:

- **`seccion`:** qué sección aparece arriba al editar. El marco del lienzo no hace scroll, así que en modo edición los pins se sueltan y la sección elegida sube hasta arriba.
- **`menuSounds`:** muestra el menú SOUNDS abierto mientras se edita. En Play siempre arranca cerrado.

## 10. Editar en el lienzo (para el equipo)

- **Fotos:** en Tweaks › Edición elige la sección y **suelta la foto justo sobre su marco**, que tiene un id como `c3-com-2`. Si cae fuera del marco, pídele a Claude que la meta.
- **Textos:** se editan directo en el lienzo.
- **Probar interacciones y scroll:** usa Play o la vista enfocada.
- **Ids de marcos:**
  - Desktop (30): `c3-noticia`, `c3-la-1…4`, `c3-snd-bd/nd/re/nw`, `c3-vin-main`, `c3-vin-2…4`, `c3-pod-1…3`, `c3-com-1…3`, `c3-lib-1`, `c3-aut-main`, `c3-aut-2…4`, `c3-rel-1…2` y `c3-pro-1…4`.
  - Móvil: los mismos con prefijo `c3m-`, salvo que Vinilos tiene solo 2 relacionadas (`c3m-vin-2…3`), Autos una miniatura (`c3m-aut-2`) y GANA 2 promos (`c3m-pro-1…2`). Son 25.

## 11. Formato `.dc.html`: reglas para quien modifique

Si vas a editar desde otro Claude, respeta esto. Si creas un artefacto Design nuevo, su `SKILL.md` es la referencia oficial y manda sobre este resumen.

1. **Estructura de cada archivo:**
   - `<!doctype html>` y `<script src="./support.js"></script>`. Esta línea va **exacta**, porque la aporta el runtime del lienzo.
   - `<x-dc><helmet>`, con el link de Google Fonts y un `<style>`, y luego `</helmet>`.
   - El markup.
   - `</x-dc>` y el `<script type="text/x-dc" data-dc-script data-props='…'>` con la clase `Component`.
2. **Huecos `{{nombre}}`:** son solo búsquedas simples, nunca expresiones. Todo se calcula en `renderVals()` y se expone por nombre.
3. **Condicionales:** `<sc-if value="{{cond}}" hint-placeholder-val="{{true|false}}">…</sc-if>`. Hay que poner siempre el `hint-*`.
4. **Eventos:** `onClick="{{fn}}"`, donde la función viene de `renderVals()`. Se permite el ciclo de vida de React (`componentDidMount` / `componentWillUnmount`); se usa para Esc y el clic fuera del menú.
5. **`data-props`:** va como JSON entre comillas simples. El editor a veces lo reescribe con comillas dobles y `&quot;` (hoy `C3-Desktop` está así, con `seccion` en "SOUNDS"). Las dos formas son válidas.
6. **Raíz:** en desktop es un `div` fluido a lo ancho; en móvil mide exactamente 390×844, igual que `$preview`.
7. **Imágenes y archivos:**
   - Solo se usan assets del artefacto (`/_blob/<id>`), que se suben con la herramienta Artifact (`asset: true`).
   - No hay URLs externas, salvo Google Fonts.
   - Los SVG solo van en `<img>` o `url()`, sin `<style>`, animaciones, `foreignObject` ni imágenes embebidas.
8. **Marcos de foto (`<image-slot id>`):**
   - El editor monta cada uno dentro de un contenedor que **solo toma el `style` en línea** del slot. Las clases no se aplican.
   - Por eso el tamaño va en línea, o el slot va dentro de un `div` con tamaño.
   - Al soltar una foto, el editor inserta un `<img src="/_blob/…">` dentro del slot. **Nunca borres esas `<img>`.**
   - Para que la foto llene el marco en cualquier ancho, dale el estilo `display:block; width:100%; height:100%; max-width:none; object-fit:cover`.
9. **Modo edición:**
   - Mientras se edita, el `body` lleva `data-dc-editor-on`.
   - El editor apaga animaciones y transiciones, el marco no hace scroll (`html[data-dc-canvas]{overflow:hidden}`) y un tablero no puede medir más de 8000 px de alto.
   - Las reglas `body[data-dc-editor-on] …` de cada tablero sueltan los pins y muestran la sección elegida.
10. **`canvas.json`:**
    - Conserva **todas** las llaves existentes (`attachments`, `maxH`, `w` de las notas, `designSystems`, `pages`, `launch`).
    - Los tableros desktop fluidos (`C3-Desktop`, `C2-Desktop`, `C-Tornamesa-Desktop`) llevan `"expand": "fill"`; los demás tienen tamaño fijo.
    - Los tableros y notas sin llave `page` pertenecen a la primera página ("1 · Exploración").
11. **No renombres los archivos de los tableros.** Hay enlaces entre ellos: `C3-Movil-2` enlaza a `C3-Movil-1.dc.html`, y `canvas.json` los nombra por archivo.

## 12. Flujo para modificar y publicar (Claude, mismo lienzo)

1. **Lee lo vivo** con Artifact `read` (url del lienzo; `paths` con los archivos de `project/`). No trabajes de memoria, porque el equipo edita en vivo.
2. **Compara con tu copia** y conserva cualquier `<img src="/_blob/…">` nueva.
3. **Edita y valida:**
   - `python3 herramientas/lint.py project/C3-Desktop.dc.html project/C3-Movil-1.dc.html project/C3-Movil-2.dc.html`
   - `node herramientas/probar-logica.js project/C3-Desktop.dc.html`, y lo mismo con `C3-Movil-1` y `C3-Movil-2` (en este último solo revisa los huecos, porque no tiene menú).
   - Revisa visualmente a 1920×1080, 1440×900, 1366×768 y 390×844, en el lienzo (Play) o con `node herramientas/render-estatico.js project/C3-Desktop.dc.html /tmp/vista.html '{"playing":true,"sndOpen":true}'`. Agrega `--editor` y `'{"props":{"seccion":"Autos"}}'` para ver el modo edición.
4. **Vuelve a leer justo antes de publicar.** Si cambió algo, integra esos cambios.
5. **Publica solo los archivos que cambiaron.** `file_path` puede ser cualquiera de ellos; los demás van en `files`. Si solo cambió un móvil, ese va en `file_path` y `files` se omite.

```text
Artifact  action: publish
  url:       https://claude.ai/artifact/Kp5Y8gZXuM3uhoUshron1h
  root:      <carpeta que contiene project/>
  file_path: <root>/project/C3-Desktop.dc.html
  files:     {"project/C3-Movil-1.dc.html": "project/C3-Movil-1.dc.html",
              "project/canvas.json": "project/canvas.json"}
```

6. **Verifica** leyendo de vuelta: compara el sha256 de lo publicado con el de tus archivos. `SHA256SUMS.txt` trae las huellas de esta versión, por si necesitas saber si el lienzo cambió desde el paquete.

## 13. Recrear el lienzo en otra cuenta

1. **Crea un artefacto Design nuevo:** Artifact `quickstart` con `intent: "design"` y publica con el `type_url` que regrese y un título. Lee el `SKILL.md` que llega.
2. **Sube las imágenes** de `assets/blobs/` como assets del artefacto nuevo:
   - Usa Artifact `publish` con el `url` nuevo, `asset: true` y `file_paths`.
   - Son 34 archivos y caben hasta 25 por llamada, así que son dos llamadas.
   - El tipo Design ya declara la capacidad `assets`.
   - Copia **tal cual** el `url` que regresa cada archivo y guárdalo, por ejemplo en `nuevos-ids.json` con la forma `{"assets/blobs/<id>.jpg": "<url nuevo>"}`.
3. **Reemplaza los ids viejos por los nuevos** en `project/`:

```python
import csv, json, pathlib, re
nuevos = json.load(open('nuevos-ids.json', encoding='utf-8'))
mapa = {r['id']: nuevos[r['archivo']] for r in csv.DictReader(open('assets/blob-map.csv', encoding='utf-8'))}
for f in pathlib.Path('project').rglob('*.dc.html'):
    s = f.read_text(encoding='utf-8')
    s = re.sub(r'/_blob/([0-9a-f]{32})', lambda m: mapa.get(m.group(1), m.group(0)), s)
    f.write_text(s, encoding='utf-8')
```

4. **Publica** `project/*.dc.html` y `project/ds/stereo-cien/tokens.json` como en la sección 12, pero con el url del artefacto nuevo.
5. **`canvas.json`: fusiónalo, no lo sobrescribas.** El artefacto nuevo trae el suyo:
   - del nuevo, conserva `v`, `createdOnFiles` y `title` (o pon "Stereo Cien — Nueva home");
   - del nuestro, copia `boards`, `order`, `pages`, `notes`, `launch` y `attachments`.
6. **Sistema de diseño:** si la nueva cuenta no tiene acceso a él, quita o reemplaza la entrada `designSystems`. Si quieres tenerlo en la cuenta nueva, crea uno desde el tipo *Design System* con `tokens.json` y el logo; los tokens ya van en `project/ds/`.

Los `.dc.html` no son páginas web autónomas: necesitan el runtime del lienzo (`support.js`). Si se abren directo en un navegador, se ven los `{{huecos}}` sin llenar.

## 14. Notas para llevarlo a producción

- **Player persistente:** la barra es el corazón del concepto, así que el audio no se puede cortar al navegar. Conviene una app shell o SPA donde la barra no se recargue, más la Media Session API para los controles de bloqueo de pantalla.
- **Fuentes de audio:** 100.1 FM en vivo y 4 canales SOUNDS (Back to Disco, Nu-Disco, Rock Español y News). Faltan las URLs de streaming y los metadatos de "ahora suena", programación y "recién sonó"; hoy son estáticos.
- **Scroll:**
  - Las animaciones ya están en CSS de scroll con `@supports` y degradan a una página estática.
  - Mantén esa degradación y el botón REDUCIR MOVIMIENTO.
  - El pin horizontal de SOUNDS usa `height` calculada con `--card` y `--bar`.
- **Anuncios:** espacios GPT con los tamaños de la sección 7 y espacio reservado para evitar CLS. El anchor se puede cerrar.
- **Imágenes:** entrégalas al doble de resolución y recórtalas con `object-fit: cover` en marcos de proporción fija.
- **Accesibilidad:**
  - Mantén los `aria-*` del menú, Esc para cerrar, el foco visible y el texto mínimo de 12 px.
  - Contraste: cian y rojo solo como gráfico.

## 15. Pendientes y notas conocidas

- **Fotos con tamaño fijo:** las 14 fotos más nuevas (Comida, Libros, Autos, Relojes y GANA) conservan el tamaño en px que pone el editor al soltarlas. A 1920 se ven bien, pero en otros anchos pueden desalinearse; por ejemplo, en Comida la tercera foto queda más alta. Hay que normalizarlas con el estilo del punto 11.8, como ya están las de La noticia, Lado A, SOUNDS, Vinilos y Podcasts.
- **Dos fotos en un marco:** `c3-aut-main` tiene dos fotos distintas. Se ve la primera (Geely, `f11372b4…`, que corresponde al titular); la segunda (Mazda, `89b9d22b…`) queda oculta. Hay que dejar solo la de Geely.
- **Foto y titular no coinciden:** en La noticia, la foto es de Bruce Springsteen y el titular es de Toni Basil. Hay que cambiar uno de los dos.
- **Textos alternativos:** salen del nombre de archivo. Ocho fotos de Autos y Relojes dicen "conectividad-seguridad-entretenimiento-1"; hay que corregirlos antes de producción.
- **Sin foto:** `c3-vin-2`…`4` (relacionadas de Vinilos), `c3-pro-3` (tercera promo de GANA) y todos los slots de los tableros móviles.
- **Textos de relleno:** "[Descripción del canal]" y "Presentado por [MARCA]" en SOUNDS; "[Extracto de la reseña]" en Libros; "[Premio y vigencia]" en GANA.
- **Lovelo Black** no está cargada.

## 16. Historial breve de decisiones

1. **v1 (exploración):** tres rutas, A Frecuencia, B Portada y C Tornamesa. Se eligió la tornamesa.
2. **v2 (brief):** una sola interfaz con modo teatral. Hoy queda como archivo.
3. **v3:**
   - Barra fija con tornamesa y revista con scroll.
   - Scrollytelling: "Voltea el disco", SOUNDS horizontal y el índice que se ilumina.
   - Página aparte de tendencias.
4. **Nueva división de lados:** Lado A es lo musical (noticias de música, SOUNDS, Vinilos y Podcasts) y Lado B es vida y estilo (Comida, Libros, Autos y Relojes).
5. **Ajustes:**
   - El brazo de la tornamesa apunta hacia adentro.
   - Hay marcos de foto en todas las secciones y un selector de sección para editar lo que queda abajo.
6. **SOUNDS:**
   - Subió a la esquina superior derecha del reproductor, como cápsula, con el logo oficial y el menú de canales.
   - Se quitó la pestaña SOUNDS de abajo, que repetía lo mismo.
7. **Reglas de color:**
   - Se eliminó el lima.
   - Rojo solo para marcas de en vivo y del reproductor.
   - Cian solo como gráfico.
