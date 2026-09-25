=== SOUNDS (by Stereo Cien) ===
Contributors: nrm
Requires at least: 5.9
Requires PHP: 7.4
Stable tag: 1.3.0
License: GPLv2 or later

== Changelog ==

= 1.3.0 =
* Nuevo: imagen "Patrocinado por" por estación, para el slider de SOUNDS.
  - Campo "Patrocinador Slider": selector de imagen (biblioteca de medios).
  - Campo "Link del patrocinador" (opcional): URL de destino al hacer click.
  - Si no se elige imagen, no se muestra nada en el front.
* REST: se agregan los campos `sounds_sponsor_id` (int), `sounds_sponsor_img`
  (URL de la imagen) y `sounds_sponsor_url` (URL de destino).

= 1.2.0 =
* Nuevo: banner "Presentado por" por estación. Se muestra arriba a la derecha del
  player en /station/{slug}.
  - Campo "Presentado por — Banner": selector de imagen (biblioteca de medios).
  - Campo "Link del banner" (opcional): URL de destino al hacer click.
  - Si no se elige imagen, el banner no se muestra en el front.
* REST: se agregan los campos `sounds_banner_id` (int), `sounds_banner_img`
  (URL de la imagen) y `sounds_banner_url` (URL de destino).
* Admin: el selector de imagen ahora es genérico y soporta varios campos
  (logo y banner) de forma independiente.

= 1.1.5 =
* Versión previa.
