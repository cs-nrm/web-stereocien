# design/ — el diseño aprobado

`design/stereo-cien-home-handoff/` es el paquete de traspaso del lienzo
**«3 · Tornamesa v3»**, versión **`1790608880-572f`** (28 sep 2026): la nueva home
de Stereo Cien. Entró al repo tal cual salió del zip, sin tocar un archivo, y
Carlos decidió subirlo así a este repo público, como hizo web-beat con el suyo.

## La fuente de verdad es el lienzo, no esta carpeta

El lienzo vive en https://claude.ai/artifact/Kp5Y8gZXuM3uhoUshron1h (un artefacto
de tipo Design; la versión vigente es la página «3 · Tornamesa v3»). **Es privado**:
para verlo, y sobre todo para editarlo, pídele a Carlos acceso de edición.

Esta carpeta es la copia, para quien no tenga acceso y para que el diseño quede
fechado junto al código que lo implementa. El diseño puede cambiar todavía, poco;
si la copia y el lienzo no coinciden, gana el lienzo y la copia se actualiza (ver
abajo).

De páginas del sitio, el lienzo dibuja **solo el Inicio**. La nota no tiene tablero
propio: usa las mismas piezas. Aparte viene una página de referencia,
`design/stereo-cien-home-handoff/tendencias/tendencias-al-cien.html` («Tendencias
al Cien»): qué técnicas web de 2026 entraron en la v3 y cuáles quedaron marcadas
para la siguiente fase de desarrollo. Se abre en cualquier navegador.

## Cómo verlo

- **Sin nada instalado:** abre
  `design/stereo-cien-home-handoff/vista-estatica/C3-Desktop.html` en Chrome. No
  responde a clics, pero el scroll sí anima. Necesita internet: las fuentes cargan
  de Google Fonts. En la misma carpeta están los móviles, en un marco de 390×844:
  `design/stereo-cien-home-handoff/vista-estatica/C3-Movil-1.html` (la página
  completa) y `design/stereo-cien-home-handoff/vista-estatica/C3-Movil-2.html`
  (SOUNDS en la tornamesa).
- **Servido:** la entrada `design` de `.claude/launch.json` (puerto 4399), o a
  mano, desde la raíz del repo:

  ```bash
  python3 -m http.server 4399 --directory design/stereo-cien-home-handoff
  ```

  y abre http://localhost:4399/vista-estatica/C3-Desktop.html.
- **Capturas:** `design/stereo-cien-home-handoff/previews/`, a 1920, 1366 y 390 de
  ancho. Salen de un render local que imita el lienzo y pueden variar un poco.

Los `.dc.html` de `design/stereo-cien-home-handoff/project/` son los ORIGINALES
editables, no páginas: necesitan el runtime del lienzo, y abiertos directo en el
navegador enseñan los `{{huecos}}` sin llenar. Las herramientas de
`design/stereo-cien-home-handoff/herramientas/` son para editar el lienzo, no para
el sitio.

## Qué leer primero para desarrollar

La especificación es
`design/stereo-cien-home-handoff/stereo-cien-home-handoff.md`. Para construir el
sitio, en este orden:

| Sección | Qué dice |
|---|---|
| §5 | El escritorio: la barra fija, la revista sección por sección con sus `id`, el menú SOUNDS, el movimiento con el scroll y los cortes responsivos |
| §6 | El móvil: el orden, las pastillas, el «equipo» y el mini player |
| §7 | La publicidad: formatos IAB, medidas y dónde va cada uno |
| §8 | El sistema visual: colores con su uso, tipografía, logos e imágenes |
| §14 | Las notas para llevarlo a producción |
| §15 | Los pendientes conocidos del propio diseño |

Del resto, §9 (los estados de cada tablero) sirve cuando se porte una interacción;
§10 a §13 son para editar el lienzo, no para el sitio.

## Las reglas de color que no se negocian

Salen del §8 y del §14, y ya están en `src/styles/tokens.css`, que además borra la
paleta entera de Tailwind: un color que no esté ahí no existe en este sitio.

- **El lima está eliminado.** El `#e7ff00` solo aparece en la exploración v1
  (`Main`, `A-Frecuencia-Movil`, `B-Portada-*`). No se reutiliza.
- **El cian del logo (`#29abe2`) va solo como gráfico o relleno**: ecualizador,
  marcadores, brillos, el anillo de foco sobre azul. Nunca como texto: sobre blanco
  da 2.6:1.
- **El rojo en vivo (`#ef4444`) va solo en las marcas de en vivo y del
  reproductor**, y nunca como texto de menos de 24 px.

Y una trampa del propio paquete: las notas de
`design/stereo-cien-home-handoff/project/ds/stereo-cien/tokens.json` son viejas.
Todavía mencionan el lima y describen `marino` y `azul-acero` con otros usos. Los
valores coinciden; para el uso manda el §8.

## El sitio nunca lee de design/

Ningún archivo del sitio carga nada de esta carpeta; los comentarios del código la
citan como fuente, nada más. Lo que el sitio necesita del paquete se **copia** a
`public/`, con el mismo contenido byte por byte:

| En el sitio | Copia de (dentro de `design/stereo-cien-home-handoff/`) |
|---|---|
| `public/img/stereocien.svg` | `assets/blobs/edb21c7d69e282ac2d2cc6822b2ccf4b.svg` (el logo) |
| `public/img/sounds-palabra-blanca.svg` | `assets/blobs/050586508788f6852a2952e51f5be75e.svg` (la palabra SOUNDS en blanco) |
| `public/img/grano.png` | `assets/blobs/76f4b8067e23ee972b35903f070d62b9.png` (la textura de grano de la barra) |

El porqué: esta carpeta se reemplaza entera cada vez que cambia el lienzo, y un
sitio que la leyera cambiaría de cara con cada actualización del paquete sin que
nadie lo decidiera. Además `design/` no se sirve, está fuera de `astro check`
(`tsconfig.json`) y fuera del vigilante del servidor de desarrollo
(`astro.config.mjs`), así que un archivo de aquí referenciado desde el sitio sería
un 404.

Las fotos de `design/stereo-cien-home-handoff/assets/blobs/` son las que el equipo
puso en el lienzo para maquetar, no contenido del sitio: el contenido llega del
CMS.

## Cómo actualizar el paquete cuando cambie el lienzo

1. Consigue el paquete nuevo: el zip `stereo-cien-home-handoff.zip`, con la misma
   estructura que esta carpeta, y déjalo en `design/`. Ahí no se versiona
   (`design/*.zip` está en `.gitignore`); en la raíz del repo, sí se colaría en
   el commit.
2. **Reemplaza la carpeta entera**, no archivo por archivo: así lo que el lienzo
   quitó también se va. Desde la raíz del repo:

   ```bash
   unzip -l design/stereo-cien-home-handoff.zip | head
   rm -rf design/stereo-cien-home-handoff
   unzip -q design/stereo-cien-home-handoff.zip -d design/
   ```

   El `unzip -l` es para mirar antes: las rutas del zip tienen que empezar con
   `stereo-cien-home-handoff/`. Si no traen esa carpeta, descomprime con
   `-d design/stereo-cien-home-handoff` en su lugar, o los archivos se riegan
   sueltos en `design/`.
3. Comprueba las huellas (los paréntesis te dejan de vuelta en la raíz):

   ```bash
   (cd design/stereo-cien-home-handoff/project && shasum -a 256 -c ../SHA256SUMS.txt)
   ```

   Todas tienen que decir `OK`. La primera línea de
   `design/stereo-cien-home-handoff/SHA256SUMS.txt` dice la versión del lienzo.
4. Mira si cambió alguno de los tres archivos que el sitio copia (`cmp` no dice
   nada si son iguales):

   ```bash
   cmp design/stereo-cien-home-handoff/assets/blobs/edb21c7d69e282ac2d2cc6822b2ccf4b.svg public/img/stereocien.svg
   cmp design/stereo-cien-home-handoff/assets/blobs/050586508788f6852a2952e51f5be75e.svg public/img/sounds-palabra-blanca.svg
   cmp design/stereo-cien-home-handoff/assets/blobs/76f4b8067e23ee972b35903f070d62b9.png public/img/grano.png
   ```

   Si alguno cambió, o ya no existe con ese nombre (búscalo en
   `design/stereo-cien-home-handoff/assets/blob-map.csv`, que dice qué es cada
   archivo), cópialo otra vez a `public/`. Si cambió el logo, corre también
   `node scripts/tarjetas.mjs`, que dibuja con él la tarjeta de compartir, y
   commitea lo que genere. Si cambió el §8, revisa `src/styles/tokens.css`.
5. Actualiza la versión y la fecha al principio de este archivo, y la tabla de
   copias si cambió algún nombre.
6. Un commit solo para el paquete, con la versión del lienzo en el mensaje, y
   aparte de cualquier cambio al sitio que la versión nueva pida.
