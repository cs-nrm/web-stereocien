/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/**
 * La regla de oro de este repo, y la fuente de un bug de producción ya pagado
 * en `web-enfoque` (ver `src/lib/env.ts`):
 *
 *   · `PUBLIC_*`  → se INCRUSTAN al compilar. Tienen que estar en el entorno del
 *                   BUILD. Se leen con `import.meta.env`. Cambiarlas obliga a
 *                   reconstruir.
 *   · sin prefijo → se leen en EJECUCIÓN, con `envServidor()` de `src/lib/env.ts`.
 *                   Tienen que estar en el entorno del proceso de Node. El mismo
 *                   build sirve para un staging y para producción.
 *
 * Aquí se declaran exactamente las `PUBLIC_*` que el código lee. Una `PUBLIC_*`
 * nueva entra aquí y en `.env.example` el mismo día, con su porqué.
 */
interface ImportMetaEnv {
  // ---------- Build (llegan al navegador) ----------
  /** URL pública del sitio, sin barra final. Decide la indexación. */
  readonly PUBLIC_SITE_URL: string;
  /** Origen PÚBLICO del CMS: la media que carga el navegador. */
  readonly PUBLIC_CMS_URL?: string;
  /**
   * Los cuatro contenedores de medición que emite el layout. Sin valor no se emite
   * el snippet, y fuera del dominio canónico tampoco: así ningún staging ensucia la
   * propiedad real —y comScore, que es lo que NRM reporta a anunciantes, no infla
   * una cifra certificada con tráfico de revisión.
   */
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_COMSCORE_C2?: string;
  readonly PUBLIC_HOTJAR_ID?: string;
  readonly PUBLIC_METRICOOL_HASH?: string;

  // ---------- Runtime (solo servidor) ----------
  // Se leen con `envServidor()`, que cae a `import.meta.env` en `astro dev`; por
  // eso también se declaran aquí.
  /** Origen INTERNO del CMS (API), sin `/api`. Puede ser una IP privada. */
  readonly CMS_URL?: string;
  /** `codigo` de la estación en la colección `estaciones` del CMS. Para este repo: `stereocien`. */
  readonly ESTACION_CODIGO?: string;
  /** TTL de la caché de respuestas del CMS, en ms. `0` la apaga (conserva el dedup). */
  readonly CACHE_CMS_MS?: string;
  /** Escape hatch de indexación: `1` fuerza noindex, `0` fuerza indexar. */
  readonly SITIO_NOINDEX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
