/**
 * La estación como dato de marca.
 *
 * `estaciones.read` es **público a propósito** en el CMS — el comentario del
 * propio `Estaciones.ts` de `cms-estaciones` lo explica: es el primer request de
 * cada uno de los 4 sitios Astro, antes de tener usuario, y lo que expone ya es
 * información pública (dominio, nombre, color, logo, mount del stream).
 *
 * De aquí sale, entre otras cosas, el `tritonMount` del player. Heredado de
 * web-beat: el mount se lee del CMS y no se escribe en el código, que es lo que
 * hace que el mismo front sirva a las cuatro estaciones cambiando solo
 * `ESTACION_CODIGO`.
 */
import { cmsFetch, type RespuestaLista } from './client';
import { ESTACION_CODIGO } from '@/config/site';
import { REDES_RESPALDO } from '@/config/navegacion';

/**
 * El documento de `estaciones`, con los campos que trae de verdad.
 *
 * Comprobado contra `admin.nrm.com.mx` el 2026-09-28
 * (`/api/estaciones?where[codigo][equals]=stereocien&depth=0`). Los valores de los
 * comentarios son los de Stereo Cien ese día.
 */
export interface Estacion {
  id: number;
  /** Nombre interno, CON frecuencia: "Stereo Cien 100.1". */
  nombre: string;
  /** Identificador corto y estable: `stereocien`. */
  codigo: string;
  /** Nombre público SIN frecuencia: "STEREO CIEN". Es el que va en feeds y SEO. */
  nombrePublicacion: string;
  /** Dominio del front, sin protocolo ni www: `stereociendigital.mx`. */
  dominio: string;
  /** `#2A3B8F`. */
  color?: string | null;
  /** Ruta dentro del CMS, no del front: `/branding/estaciones/stereocien.svg`. */
  logo?: string | null;
  /** En `null`: Stereo Cien todavía no tiene variante para fondo oscuro. */
  logoReversa?: string | null;
  /**
   * Mount de Triton Digital. Para Stereo Cien: `XEOYAM`.
   *
   * No romper: el sufijo AM en una estación FM es CORRECTO, y el propio documento
   * lo explica en `notaStream`. Es el mount de «Stereo Cien Digital», solo música,
   * que es lo que reproduce el sitio; por la frecuencia 100.1 FM se transmite la
   * programación de Enfoque Noticias, que no es lo que el sitio reproduce. No lo
   * «corrijas».
   */
  tritonMount?: string | null;
  /** Aclaración del CMS sobre qué transmite el mount. Ver `tritonMount`. */
  notaStream?: string | null;
  /** Interruptor del preroll de audio. Apagado —lo normal— significa SIN preroll. */
  preroll?: boolean | null;
  /**
   * Las categorías de canción que la bitácora del aire acepta guardar. Es un
   * filtro de la ingesta del CMS, no algo que este front pinte; viene en el
   * documento y por eso está en el tipo. Hoy, vacío.
   */
  categoriasMusicales?: Array<{ categoria: string; id?: string | null }> | null;
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * ¿Hay campaña de preroll?
 *
 * Heredado de web-beat, donde nació el 2026-09-10: allá las campañas de preroll
 * eran esporádicas, así que el ad unit pasaba vacío la mayor parte del año y
 * pedirle un anuncio vacío solo hacía que el aire tardara más en abrir. Con el
 * interruptor apagado, el player ni lo pide. Para Stereo Cien está en `false`
 * (2026-09-28).
 *
 * El fallo de un booleano va del lado caro, y hay que saberlo: olvidado APAGADO
 * con campaña vendida, se dejan de servir impresiones y nadie se entera. Se eligió
 * igual, a sabiendas, porque lo prende y lo apaga una persona que no quiere
 * capturar fechas.
 *
 * Sigue siendo función y no un `estacion.preroll === true` suelto por una razón
 * concreta: la forma de este campo ya cambió una vez en el CMS —era un grupo con
 * fechas—, y esta es la única línea del front que hay que tocar si vuelve a
 * cambiar.
 */
export function prerollActivo(estacion: Estacion): boolean {
  return estacion.preroll === true;
}

/**
 * Datos de marca de la estación. Se memoriza la promesa para el proceso: son
 * datos que cambian casi nunca, y así dos requests concurrentes comparten una
 * sola consulta.
 */
let promesa: Promise<Estacion> | null = null;

export function obtenerEstacion(): Promise<Estacion> {
  if (!promesa) {
    promesa = cmsFetch<RespuestaLista<Estacion>>(
      'estaciones',
      { 'where[codigo][equals]': ESTACION_CODIGO, limit: 1, depth: 0 },
      // Timeout corto: es el primer request de cada arranque y no debe colgar el
      // SSR si el CMS todavía no responde.
      5000,
    )
      .then((r) => {
        const doc = r.docs[0];
        if (!doc) {
          throw new Error(
            `No existe la estación con codigo="${ESTACION_CODIGO}" en el CMS.`,
          );
        }
        return doc;
      })
      .catch((err) => {
        promesa = null; // no memorizar un fallo
        throw err;
      });
  }
  return promesa;
}

/**
 * Redes sociales de la estación, ya filtradas y con su etiqueta.
 *
 * El CMS manda, y `REDES_RESPALDO` solo tapa el hueco RED POR RED: hoy los
 * cinco campos de Stereo Cien en `estaciones` están en `null` (2026-09-28), y sin
 * respaldo el sitio no enseñaría ninguna forma de seguir a la estación. Con el
 * `??`, capturar Facebook en el admin lo hace ganar de inmediato sin tocar las
 * otras cuatro.
 *
 * Se sigue filtrando por verdad: una entrada sin URL en ninguno de los dos
 * lados no se pinta —hoy YouTube, que no tiene cuenta conocida—. Un enlace vacío
 * es peor que una red de menos.
 */
export async function redesEstacion(): Promise<Array<{ red: string; url: string }>> {
  const e = await obtenerEstacion();
  const pares: Array<[string, string | null | undefined]> = [
    ['Facebook', e.facebook ?? REDES_RESPALDO.facebook],
    ['Instagram', e.instagram ?? REDES_RESPALDO.instagram],
    ['X', e.x ?? REDES_RESPALDO.x],
    ['YouTube', e.youtube ?? REDES_RESPALDO.youtube],
    ['TikTok', e.tiktok ?? REDES_RESPALDO.tiktok],
  ];
  return pares
    .filter((p): p is [string, string] => Boolean(p[1]))
    .map(([red, url]) => ({ red, url }));
}
