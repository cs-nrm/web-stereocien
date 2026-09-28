/**
 * Las categorías de la estación.
 *
 * Se filtra por `slug`, nunca por id. El sitio viejo pedía cada sección por el id
 * numérico de su categoría de WordPress —`getArticles(169)` en
 * `src/pages/autos/[slug].astro` de la rama `stereocien`, y así las 19 secciones—,
 * y ese id no sobrevive la migración: en `cms-estaciones` cada categoría nace con su
 * propio id y guarda el de WordPress aparte, en `wpId`. El slug sí se conserva, y
 * es único por estación (índice `(estacion, slug)` en `Categorias.ts` del CMS).
 *
 * Hoy Stereo Cien no tiene NINGUNA categoría en el CMS (2026-09-28): llegan con la
 * migración del WordPress, con su mismo slug. Mientras tanto `obtenerCategoria`
 * devuelve `null` para todas, y quien la llama tiene que tratar ese `null` como
 * «sección vacía», nunca como «sin filtro». Ver `obtenerNotas` en `./noticias`.
 */
import { cmsFetchEstacion, type RespuestaLista } from './client';
import type { Categoria } from '@/types/payload';

/**
 * Una categoría por slug.
 *
 * Es la consulta que resuelve UNA vez el id que luego filtra los listados, y va
 * cacheada como todo lo que pasa por el cliente. Ver `obtenerNotas` para por qué
 * el listado filtra por ese id y no por `categorias.slug`.
 */
export async function obtenerCategoria(slug: string): Promise<Categoria | null> {
  try {
    const r = await cmsFetchEstacion<RespuestaLista<Categoria>>('categorias', {
      'where[slug][equals]': slug,
      depth: 0,
      limit: 1,
    });
    return r.docs[0] ?? null;
  } catch {
    return null;
  }
}
