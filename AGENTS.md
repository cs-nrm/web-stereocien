# AGENTS.md

La entrada para agentes de este repo es **[CLAUDE.md](CLAUDE.md)**: las trampas, el
mapa de áreas y cómo se escribe aquí. Léelo entero antes de editar. Lo
imprescindible, por si solo lees esto:

- **La rama es `stereocien-v2`** (el sitio nuevo, Astro SSR sobre `cms-estaciones`).
  `main` es la rama por omisión de GitHub y está abandonada: no trabajes sobre ella
  ni le abras PR. Comprueba que estás en la buena con
  `git merge-base --is-ancestor a597927 HEAD && echo bien`.
- **`stereocien` es el sitio viejo, al aire.** No se mezcla con esta rama, y su
  checkout no se toca: su `node_modules` no se puede reproducir, así que ahí no se
  cambia de rama ni se corre `pnpm install`.
- **La puerta es `pnpm build`** (la misma que corre la CI). `pnpm check` no basta.
- **`CMS_URL` es de ejecución.** Sin ella el sitio responde 200 sin contenido y sin
  error. `pnpm dev` carga `.env`; `pnpm preview` no: usa `pnpm preview:cms`.
- **Toda consulta a una colección con estación va por `cmsFetchEstacion`**
  (`src/lib/cms/client.ts`); sin el filtro salen las cuatro estaciones mezcladas.
- **El porqué está en los comentarios del código**: léelos antes de cambiar la
  línea que comentan. Las decisiones están en `docs/decisiones.md` y lo que falta,
  en `docs/pendientes.md`.

Si vienes del sitio viejo: aquí no hay carpeta `.agents/` ni comandos
`npm run agents:*`. Eso era de la rama `stereocien`.
