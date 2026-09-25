<?php
/**
 * Plugin Name:       SOUNDS (by Stereo Cien)
 * Plugin URI:        https://stereociendigital.mx/
 * Description:       Administra estaciones de SOUNDS (stream + branding) y expone campos vía REST (wp-json).
 * Version:           1.2.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            nrm
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       sounds-by-stereo-cien
 */

if (!defined('ABSPATH')) { exit; }

define('SOUNDS_SC_VERSION', '1.2.0');
define('SOUNDS_SC_PLUGIN_FILE', __FILE__);
define('SOUNDS_SC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SOUNDS_SC_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once SOUNDS_SC_PLUGIN_DIR . 'includes/class-sounds-cpt.php';
require_once SOUNDS_SC_PLUGIN_DIR . 'includes/class-sounds-meta.php';
require_once SOUNDS_SC_PLUGIN_DIR . 'includes/class-sounds-rest.php';

function sounds_sc_bootstrap() {
    \SOUNDS_SC\CPT::init();
    \SOUNDS_SC\Meta::init();
    \SOUNDS_SC\REST::init();
}
add_action('init', 'sounds_sc_bootstrap', 5);

function sounds_sc_activate() {
    sounds_sc_bootstrap();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'sounds_sc_activate');

function sounds_sc_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'sounds_sc_deactivate');
