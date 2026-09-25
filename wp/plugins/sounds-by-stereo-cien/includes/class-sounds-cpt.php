<?php
namespace SOUNDS_SC;

if (!defined('ABSPATH')) { exit; }

class CPT {
    const POST_TYPE = 'sounds_station';

    public static function init() {
        add_action('init', [__CLASS__, 'register_post_type']);
    }

    public static function register_post_type() {
        $labels = [
            'name'               => 'SOUNDS',
            'singular_name'      => 'Estación',
            'menu_name'          => 'SOUNDS',
            'name_admin_bar'     => 'Estación SOUNDS',
            'add_new'            => 'Agregar nueva',
            'add_new_item'       => 'Agregar nueva estación',
            'new_item'           => 'Nueva estación',
            'edit_item'          => 'Editar estación',
            'view_item'          => 'Ver estación',
            'all_items'          => 'Todas las estaciones',
            'search_items'       => 'Buscar estaciones',
            'not_found'          => 'No se encontraron estaciones',
            'not_found_in_trash' => 'No hay estaciones en la papelera',
        ];

        $args = [
            'labels'       => $labels,
            'public'       => true,
            'show_ui'      => true,
            'show_in_menu' => true,
            'menu_icon'    => 'dashicons-format-audio',
            'supports'     => ['title', 'editor', 'thumbnail', 'revisions'],
            'has_archive'  => false,
            'rewrite'      => ['slug' => 'sounds'],
            'show_in_rest' => true,
            'rest_base'    => 'sounds',
        ];

        register_post_type(self::POST_TYPE, $args);
    }
}
