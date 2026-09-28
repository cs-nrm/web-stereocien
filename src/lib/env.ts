/**
 * Lectura de variables de entorno de SERVIDOR en tiempo de EJECUCIÓN.
 *
 * Por qué existe este archivo: `import.meta.env.FOO` **se sustituye por su
 * valor al compilar**, no se lee al arrancar. Pasó tal cual en el primer
 * despliegue del beta de `web-enfoque` (31 jul 2026): su imagen de Docker se
 * construía sin `.env`, `import.meta.env.CMS_URL` compilaba a cadena vacía y el
 * proceso ignoraba el `CMS_URL` que le pasaban al arrancar. El sitio respondía 200
 * y **cero noticias**.
 *
 * Verificado aquí el 2026-09-28 con Astro 7.2.10: en un build, `import.meta.env`
 * ni siquiera trae las variables SIN prefijo, aunque el `.env` esté presente al
 * compilar. Solo trae las `PUBLIC_*` y las de Astro. O sea que en un build las de
 * servidor salen SOLO del entorno del proceso.
 * Heredado de web-beat; no lo repitamos.
 *
 * `process.env` sí se lee al arrancar, que es lo que queremos para la config del
 * servidor: el MISMO build sirve para un staging y para producción, cambiando solo
 * el entorno.
 *
 * Esto vale solo para variables **sin** prefijo `PUBLIC_`. Las `PUBLIC_*` van
 * también al JavaScript del navegador, donde `process.env` no existe: esas tienen
 * que seguir siendo de build (tienen que estar en el entorno de `pnpm build`).
 */

/**
 * `@types/node` no está instalado a propósito (el proyecto compila para navegador
 * y para SSR), así que se declara solo lo que se usa de `process`.
 */
declare const process: { env?: Record<string, string | undefined> };

/**
 * Valor de una variable de servidor. Prioriza `process.env` (ejecución) y cae a
 * `import.meta.env`, que solo sirve en `astro dev` (ahí sí trae el `.env`). En un
 * build las variables sin `PUBLIC_` tienen que estar en el entorno del proceso.
 */
export function envServidor(clave: string, porDefecto = ''): string {
  // `typeof process` en vez de `process` a secas: si este módulo acabara
  // arrastrado a un bundle de cliente, `process` no existe y tiraría un
  // ReferenceError en el navegador.
  const enEjecucion =
    typeof process !== 'undefined' && process.env ? process.env[clave] : undefined;
  if (enEjecucion !== undefined && enEjecucion !== '') return enEjecucion;

  const enBuild = (import.meta.env as Record<string, unknown>)[clave];
  if (typeof enBuild === 'string' && enBuild !== '') return enBuild;

  return porDefecto;
}
