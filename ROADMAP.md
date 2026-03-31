# Roadmap de Refactorización — Stereo Cien

## Objetivo

Separar `src/js/streaming.js` en archivos por dominio, de forma que cada subagente definido en `.agents/` tenga ownership claro sobre sus archivos sin solapamientos. Sin cambiar ningún comportamiento funcional.

---

## El problema central

`streaming.js` hoy mezcla cuatro dominios en un solo archivo:

| Archivo | Dominios mezclados | Líneas |
|---|---|---|
| `src/js/streaming.js` | ads + player + analytics (comScore) + voting | ~800 |
| `src/components/BaseHead.astro` | meta/SEO + favicons + ads scripts + analytics scripts | 123 |

---

## Mapa de extracción: `streaming.js`

| Líneas actuales | Contenido | Archivo destino |
|---|---|---|
| 1–17 | SVG constants + vars globales del player (`streaming`, `local_status`, etc.) | `src/js/player.js` |
| 18–108 | Ads: `adFallback()`, `initAdFallbackListener()`, `initGPT()` | `src/js/ads.js` |
| 110–141 | `initPlayerSDK()` — init del SDK de Triton | `src/js/player.js` |
| 143–299 | `getStatus()`, `completeAd()`, `startAd()`, `errorAd()`, `play()`, `pause()`, `stop()`, callbacks SDK | `src/js/player.js` |
| 300–326 | Volumen init + `detectarNavegador()` | `src/js/player.js` |
| 328–477 | `getInfoMusic()` — now playing + cover art + voting inline | `src/js/player.js` |
| 480–522 | `getInfoProg()` — programación en vivo desde WP API | `src/js/player.js` |
| 527–622 | Controles: `radioActive()`, `playstopRadio()`, `transitionPlayer()`, click handlers | `src/js/player.js` |
| 634–715 | Listeners de View Transitions (`astro:before-preparation`, `astro:after-swap`) | `src/js/player.js` |
| 716–731 | comScore beacon + `pageview_candidate.txt` fetch | `src/js/analytics.js` |
| 734–fin | `astro:page-load`: `initGPT()` call, lógica `/en-vivo/`, tabs `/programacion/` | `src/js/player.js` (orquestación) + `ads.js` (el call a initGPT) |

---

## Estructura objetivo de `src/js/`

```
src/js/
├── player.js       ← Triton SDK, now playing, cover art, voting, controles, View Transitions
├── ads.js          ← initGPT, adFallback, initAdFallbackListener, sizeMapping
├── analytics.js    ← comScore beacon por pageview, pageview_candidate.txt
└── related.js      ← ya existe, no cambia
```

> `streaming.js` desaparece y es reemplazado por `player.js` + los archivos extraídos.

---

## Mapa de extracción: `BaseHead.astro`

Crear dos componentes que `BaseHead.astro` importa:

| Bloque actual | Archivo destino |
|---|---|
| `<meta charset>`, `<meta viewport>`, favicons, canonical, OG, robots, sitemap | se queda en `BaseHead.astro` |
| AdSense `<script>` + GPT `<script>` + `window.googletag` init | `src/components/head/AdScripts.astro` |
| comScore init + Hotjar + Metricool + GTM + GTM noscript | `src/components/head/AnalyticsScripts.astro` |

```astro
<!-- BaseHead.astro después de la refactorización -->
<AdScripts />
<AnalyticsScripts />
```

---

## Fases

### Fase 0 — Documentación ✅ COMPLETADA
- [x] Crear specs en `.agents/specs/` para `ads`
- [x] Crear specs en `.agents/specs/` para `streaming`
- [x] Crear specs en `.agents/specs/` para `frontend`
- [x] Crear specs en `.agents/specs/` para `content`
- [x] Crear specs en `.agents/specs/` para `analytics`
- [x] Crear este `ROADMAP.md`

---

### Fase 1 — Delimitadores en `streaming.js` (riesgo: cero) ✅ COMPLETADA
Agregar comentarios de sección dentro de `streaming.js` sin mover nada.
Prepara la extracción en Fase 2 y permite que los agentes identifiquen su sección.

- [x] Agregar `// ===== [PLAYER - GLOBALS + SVG CONSTANTS] =====` en línea 1
- [x] Agregar `// ===== [ADS] =====` en línea 18
- [x] Agregar `// ===== [PLAYER - SDK INIT] =====` en línea 110
- [x] Agregar `// ===== [PLAYER - STATUS + CALLBACKS] =====` en línea 143
- [x] Agregar `// ===== [PLAYER - NOW PLAYING + VOTING] =====` en línea 328
- [x] Agregar `// ===== [PLAYER - PROGRAMACION EN VIVO] =====` en línea 480
- [x] Agregar `// ===== [PLAYER - CONTROLES] =====` en línea 527
- [x] Agregar `// ===== [NAVIGATION - VIEW TRANSITIONS] =====` en línea 634
- [x] Agregar `// ===== [ANALYTICS - COMSCORE BEACON] =====` en línea 716

**Criterio de éxito:** Sin cambio de comportamiento. El sitio funciona igual.

---

## Plan de separación de archivos y orden de carga

### Contexto del player persistente

El sitio usa Astro View Transitions con un player de radio que debe mantenerse activo entre navegaciones (`transition:persist`). Esto significa que `streaming.js` (y sus futuros archivos derivados) se cargan **una sola vez** al inicio, y usan el evento `astro:page-load` para ejecutar lógica en cada navegación SPA.

Al separar en archivos, **cada archivo registra su propio listener `astro:page-load`** de forma independiente. Astro permite múltiples listeners del mismo evento — todos se ejecutan, sin conflicto.

---

### Orden de carga en `Player.astro` (objetivo)

El orden importa porque `player.js` llama a funciones definidas en `ads.js`. La secuencia obligatoria es:

```html
<!-- libs externas (no cambian) -->
<script is:inline src="jquery.js"></script>
<script is:inline src="td-sdk.min.js"></script>
<script is:inline src="...otras libs..."></script>

<!-- nuestros archivos — en este orden exacto -->
<script src="/src/js/ads.js"></script>
<script src="/src/js/analytics.js"></script>
<script src="/src/js/player.js"></script>
```

`ads.js` debe ir primero porque define `initGPT()` y `adFallback()` que `player.js` invoca desde su `astro:page-load`. `analytics.js` no tiene dependencias pero va antes que `player.js` por convención de dominio.

---

### Distribución del listener `astro:page-load`

El listener actual en `streaming.js` (línea ~647) se divide así:

| Bloque dentro de `astro:page-load` | Archivo destino |
|---|---|
| comScore beacon + fetch `pageview_candidate.txt` | `analytics.js` |
| `initGPT()` con guard de `googletag.apiReady` | `ads.js` |
| `playerstatus()` + quitar clase `loading` del preloader | `player.js` |
| Tabs de `/programacion/` (`aria-selected`, paneles) | `player.js` |
| Lógica de `/en-vivo/`: `getInfoProg`, `getInfoMusic`, `playstopRadio`, estilos del `#radiobutton` | `player.js` |
| Botones de sounds (`sounds-love`, `sounds-acoustic-moods`, etc.) | `player.js` |
| Carruseles Flickity (`main-carousel`, `main-carousel-sounds`, `main-carousel-enfoque`) | `player.js` |

**Cada archivo tendrá su propio bloque:**

```js
// ads.js
document.addEventListener('astro:page-load', () => {
    if (window.googletag && googletag.apiReady) {
        initGPT();
    } else {
        window.googletag = window.googletag || { cmd: [] };
        googletag.cmd.push(function() { initGPT(); });
    }
});
```

```js
// analytics.js
document.addEventListener('astro:page-load', () => {
    var ts = Math.round((new Date()).getTime() / 1000 * Math.random() * 10);
    self.COMSCORE && COMSCORE.beacon({ c1: "2", c2: "6906652", options: { ... } });
    fetch('/pageview_candidate.txt?' + ts).then(...);
});
```

```js
// player.js
document.addEventListener('astro:page-load', () => {
    // preloader, tabs, en-vivo, sounds, carruseles
});
```

---

### Inicialización única (fuera del listener)

Estos bloques se ejecutan **una sola vez al cargar el script**, no en cada navegación. Deben quedar en el nivel raíz de cada archivo:

| Código | Archivo |
|---|---|
| `window._adFallbackStates = ...` + `googletag.cmd.push(initAdFallbackListener)` | `ads.js` |
| SVG constants, `var streaming`, `var local_status`, refs DOM globales | `player.js` |
| `initPlayerSDK()` | `player.js` |
| Listeners de `astro:before-preparation` y `astro:after-swap` | `player.js` |

---

### Fase 2 — Extraer `src/js/ads.js` (riesgo: bajo) ✅ COMPLETADA

- [x] Crear `src/js/ads.js` con el bloque `[ADS]` completo:
  - `window._adFallbackStates`
  - `adFallback()`
  - `initAdFallbackListener()`
  - `initGPT()`
  - `googletag.cmd.push(initAdFallbackListener)` (registro único, nivel raíz)
- [x] Agregar en `ads.js` su propio listener `astro:page-load` con la llamada a `initGPT()` (con guard de `googletag.apiReady`)
- [x] Eliminar el bloque `[ADS]` y el call a `initGPT()` del listener de `streaming.js`
- [x] Agregar `<script src="/src/js/ads.js"></script>` en `Player.astro` **antes** que `streaming.js`
- [x] Verificar que los slots rendericen en dev y en build

**Dependencias:** `ads.js` necesita que `googletag` esté disponible (viene de GPT en `BaseHead.astro` — no cambia).

**Criterio de éxito:** Ads renderizan, fallback GPT→AdSense funciona, View Transitions re-inicializan correctamente.

---

### Fase 3 — Extraer `src/js/analytics.js` (riesgo: bajo) ✅ COMPLETADA

- [x] Crear `src/js/analytics.js` con su propio listener `astro:page-load` que contenga:
  - comScore beacon
  - fetch a `pageview_candidate.txt`
- [x] Agregar `<script src="/src/js/analytics.js"></script>` en `Player.astro` entre `ads.js` y `streaming.js`
- [x] Eliminar esas líneas del listener de `streaming.js`
- [x] Verificar en Network tab que `beacon.js` y `pageview_candidate.txt` se siguen disparando en cada navegación

**Criterio de éxito:** comScore sigue registrando pageviews en cada navegación SPA.

---

### Fase 4 — Renombrar `streaming.js` → `player.js` (riesgo: bajo) ✅ COMPLETADA

- [x] Renombrar `src/js/streaming.js` a `src/js/player.js`
- [x] Actualizar el `<script src="...streaming.js">` en `Player.astro` a `player.js`
- [x] Verificar que no haya referencias hardcodeadas al nombre del archivo en el resto del proyecto

**Criterio de éxito:** Build limpio, player funciona, sin errores 404 en Network tab.

---

### Fase 5 — Separar `BaseHead.astro` (riesgo: bajo) ✅ COMPLETADA

- [x] Crear `src/components/head/AdScripts.astro`
  - Mover: script AdSense + script GPT + `window.googletag` init inline
  - Mantener el orden actual (AdSense antes que GPT)
- [x] Crear `src/components/head/AnalyticsScripts.astro`
  - Mover: comScore init + noscript comScore + Hotjar + Metricool + GTM + GTM noscript
- [x] En `BaseHead.astro`: reemplazar los bloques con `<AdScripts />` y `<AnalyticsScripts />`
- [x] Verificar que el orden de scripts en el HTML generado sea idéntico al actual

**Criterio de éxito:** HTML generado en build equivalente en orden de scripts. Ads y analytics funcionan igual.

---

## Estructura final objetivo

```
src/
├── components/
│   ├── head/
│   │   ├── AdScripts.astro          ← GPT + AdSense
│   │   └── AnalyticsScripts.astro   ← GTM + comScore + Hotjar + Metricool
│   ├── BaseHead.astro               ← solo meta, OG, canonical, favicons
│   ├── Player.astro
│   └── ...
├── js/
│   ├── player.js                    ← Triton SDK, now playing, voting, controles
│   ├── ads.js                       ← initGPT, adFallback, sizeMapping
│   ├── analytics.js                 ← comScore beacon por pageview
│   └── related.js                   ← sin cambios
└── ...
```

### Ownership por agente después de la refactorización

| Agente | Archivos exclusivos |
|---|---|
| `.agents/specs/ads.json` | `src/js/ads.js`, `src/components/head/AdScripts.astro`, componentes de ad units, `public/ads.txt` |
| `.agents/specs/streaming.json` | `src/js/player.js`, `src/components/Player.astro` |
| `.agents/specs/analytics.json` | `src/js/analytics.js`, `src/components/head/AnalyticsScripts.astro` |
| `.agents/specs/frontend.json` | `src/components/` (resto), `src/layouts/`, `src/styles/`, `src/components/BaseHead.astro` |
| `.agents/specs/content.json` | `src/lib/`, `src/pages/`, `src/content/`, `astro.config.mjs` |

Ningún archivo pertenece a más de un agente.

---

## Principios de la refactorización

1. **Una fase a la vez** — cada fase tiene su propia validación antes de continuar.
2. **Cero cambios de comportamiento** — solo mover código, nunca reescribirlo mientras se mueve.
3. **El orden de carga importa** — `ads.js` antes que `analytics.js` antes que `player.js`.
4. **Validar en build, no solo en dev** — Astro SSG puede comportarse diferente en `astro build`.
5. **Fase 1 es gratis** — los comentarios de sección se pueden hacer hoy sin ningún riesgo.
