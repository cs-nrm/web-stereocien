# wp/

Código de WordPress que alimenta este sitio. **No se compila ni se despliega junto con Astro** —
vive aquí solo para tenerlo versionado y poder editarlo cuando haga falta.

## plugins/sounds-by-stereo-cien

Plugin que administra las estaciones de SOUNDS (CPT `sounds`) y expone sus campos vía REST
(`/wp-json/wp/v2/sounds`), que es de donde el front lee los datos en
[`src/pages/station/[slug].astro`](../src/pages/station/%5Bslug%5D.astro).

### Campos que consume el front

| Campo REST | Uso en el player |
|---|---|
| `sounds_stream_url` | URL del stream en vivo |
| `sounds_mount_url` | Token/mount para la metadata de Zeno.fm |
| `sounds_colors` | Colores del gradiente de fondo |
| `sounds_logo_url` | Logo de la estación / artwork por defecto |
| `sounds_banner_img` | Imagen del banner "Presentado por" (arriba a la derecha) |
| `sounds_banner_url` | Link de destino del banner (opcional) |

`sounds_pub_id` existe pero **el front ya no lo usa**.

### Publicar una actualización

1. Editar los archivos en `plugins/sounds-by-stereo-cien/`.
2. Subir la versión en los 3 lugares: encabezado del plugin, `SOUNDS_SC_VERSION`
   (ambos en `sounds-by-stereo-cien.php`) y `Stable tag` en `readme.txt`.
3. Generar el zip:

   ```sh
   cd wp/plugins
   zip -r sounds-by-stereo-cien-X.Y.Z.zip sounds-by-stereo-cien -x "*.DS_Store"
   ```

4. En WordPress: **Plugins → Añadir nuevo → Subir plugin**, elegir el zip y confirmar
   *"Reemplazar el actual con el subido"*.
