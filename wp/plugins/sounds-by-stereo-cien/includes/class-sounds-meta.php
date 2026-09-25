<?php
namespace SOUNDS_SC;

if (!defined('ABSPATH')) { exit; }

class Meta {

    const META_PUB_ID     = '_sounds_pub_id';
    const META_STREAM_URL = '_sounds_stream_url';
    const META_MOUNT_URL  = '_sounds_mount_url';
    const META_LOGO_ID    = '_sounds_logo_id';
    const META_IS_ACTIVE  = '_sounds_is_active';
    const META_ORDER      = '_sounds_order';

    // Banner "Presentado por" (opcional, por estación).
    const META_BANNER_ID  = '_sounds_banner_id';
    const META_BANNER_URL = '_sounds_banner_url';

    const META_COLOR1 = '_sounds_color1';
    const META_COLOR2 = '_sounds_color2';
    const META_COLOR3 = '_sounds_color3';
    const META_COLOR4 = '_sounds_color4';
    const META_COLOR5 = '_sounds_color5';

    public static function init() {
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_boxes']);
        add_action('save_post_' . CPT::POST_TYPE, [__CLASS__, 'save_meta'], 10, 2);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_admin_assets']);
        add_action('init', [__CLASS__, 'register_meta'], 20);
    }

    public static function register_meta() {
        $common_string = [
            'type'         => 'string',
            'single'       => true,
            'show_in_rest' => ['schema' => ['type' => 'string']],
            'auth_callback' => '__return_true',
        ];

        register_post_meta(CPT::POST_TYPE, self::META_PUB_ID, array_merge($common_string, [
            'sanitize_callback' => 'sanitize_text_field',
            'default' => '',
        ]));

        register_post_meta(CPT::POST_TYPE, self::META_STREAM_URL, array_merge($common_string, [
            'sanitize_callback' => 'esc_url_raw',
            'default' => '',
        ]));

        register_post_meta(CPT::POST_TYPE, self::META_MOUNT_URL, array_merge($common_string, [
            'sanitize_callback' => 'esc_url_raw',
            'default' => '',
        ]));

        foreach ([self::META_COLOR1, self::META_COLOR2, self::META_COLOR3, self::META_COLOR4, self::META_COLOR5] as $k) {
            register_post_meta(CPT::POST_TYPE, $k, array_merge($common_string, [
                'sanitize_callback' => 'sanitize_hex_color',
                'default' => '',
            ]));
        }

        register_post_meta(CPT::POST_TYPE, self::META_LOGO_ID, [
            'type'         => 'integer',
            'single'       => true,
            'show_in_rest' => ['schema' => ['type' => 'integer']],
            'sanitize_callback' => 'absint',
            'default' => 0,
            'auth_callback' => '__return_true',
        ]);

        register_post_meta(CPT::POST_TYPE, self::META_IS_ACTIVE, [
            'type'         => 'boolean',
            'single'       => true,
            'show_in_rest' => ['schema' => ['type' => 'boolean']],
            'sanitize_callback' => function($v) { return (bool) $v; },
            'default' => true,
            'auth_callback' => '__return_true',
        ]);

        register_post_meta(CPT::POST_TYPE, self::META_ORDER, [
            'type'         => 'integer',
            'single'       => true,
            'show_in_rest' => ['schema' => ['type' => 'integer']],
            'sanitize_callback' => 'absint',
            'default' => 0,
            'auth_callback' => '__return_true',
        ]);

        register_post_meta(CPT::POST_TYPE, self::META_BANNER_ID, [
            'type'         => 'integer',
            'single'       => true,
            'show_in_rest' => ['schema' => ['type' => 'integer']],
            'sanitize_callback' => 'absint',
            'default' => 0,
            'auth_callback' => '__return_true',
        ]);

        register_post_meta(CPT::POST_TYPE, self::META_BANNER_URL, array_merge($common_string, [
            'sanitize_callback' => 'esc_url_raw',
            'default' => '',
        ]));
    }

    public static function add_meta_boxes() {
        add_meta_box(
            'sounds_station_meta',
            'SOUNDS — Configuración',
            [__CLASS__, 'render_meta_box'],
            CPT::POST_TYPE,
            'normal',
            'high'
        );
    }

    public static function enqueue_admin_assets() {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== CPT::POST_TYPE) { return; }

        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_media();

        wp_enqueue_style(
            'sounds-sc-admin',
            SOUNDS_SC_PLUGIN_URL . 'assets/css/admin.css',
            [],
            SOUNDS_SC_VERSION
        );

        wp_enqueue_script(
            'sounds-sc-admin',
            SOUNDS_SC_PLUGIN_URL . 'assets/js/admin-media.js',
            ['jquery', 'wp-color-picker'],
            SOUNDS_SC_VERSION,
            true
        );
    }

    public static function render_meta_box($post) {
        wp_nonce_field('sounds_sc_save_meta', 'sounds_sc_nonce');

        $pub_id     = get_post_meta($post->ID, self::META_PUB_ID, true);
        $stream_url = get_post_meta($post->ID, self::META_STREAM_URL, true);
        $mount_url  = get_post_meta($post->ID, self::META_MOUNT_URL, true);

        $color1 = get_post_meta($post->ID, self::META_COLOR1, true);
        $color2 = get_post_meta($post->ID, self::META_COLOR2, true);
        $color3 = get_post_meta($post->ID, self::META_COLOR3, true);
        $color4 = get_post_meta($post->ID, self::META_COLOR4, true);
        $color5 = get_post_meta($post->ID, self::META_COLOR5, true);

        $logo_id   = (int) get_post_meta($post->ID, self::META_LOGO_ID, true);
        $is_active = (bool) get_post_meta($post->ID, self::META_IS_ACTIVE, true);
        $order     = (int) get_post_meta($post->ID, self::META_ORDER, true);

        $banner_id   = (int) get_post_meta($post->ID, self::META_BANNER_ID, true);
        $banner_link = get_post_meta($post->ID, self::META_BANNER_URL, true);

        $logo_url   = $logo_id ? wp_get_attachment_image_url($logo_id, 'medium') : '';
        $banner_img = $banner_id ? wp_get_attachment_image_url($banner_id, 'medium') : '';
        ?>
        <div class="sounds-sc-grid">
            <div class="sounds-sc-field">
                <label for="sounds_pub_id"><strong>Pub Id</strong></label>
                <input type="text" id="sounds_pub_id" name="sounds_pub_id" value="<?php echo esc_attr($pub_id); ?>" class="widefat" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_stream_url"><strong>Stream URL</strong></label>
                <input type="url" id="sounds_stream_url" name="sounds_stream_url" value="<?php echo esc_attr($stream_url); ?>" placeholder="https://..." class="widefat" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_mount_url"><strong>Mount URL</strong></label>
                <input type="url" id="sounds_mount_url" name="sounds_mount_url" value="<?php echo esc_attr($mount_url); ?>" placeholder="https://..." class="widefat" />
            </div>

            <div class="sounds-sc-field">
                <label><strong>Activo</strong></label>
                <label class="sounds-sc-switch">
                    <input type="checkbox" name="sounds_is_active" value="1" <?php checked($is_active, true); ?> />
                    <span class="sounds-sc-slider"></span>
                </label>
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_order"><strong>Orden</strong></label>
                <input type="number" id="sounds_order" name="sounds_order" value="<?php echo esc_attr($order); ?>" class="small-text" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_color1"><strong>Color 1</strong></label>
                <input type="text" id="sounds_color1" name="sounds_color1" value="<?php echo esc_attr($color1); ?>" class="sounds-sc-color" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_color2"><strong>Color 2</strong></label>
                <input type="text" id="sounds_color2" name="sounds_color2" value="<?php echo esc_attr($color2); ?>" class="sounds-sc-color" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_color3"><strong>Color 3</strong></label>
                <input type="text" id="sounds_color3" name="sounds_color3" value="<?php echo esc_attr($color3); ?>" class="sounds-sc-color" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_color4"><strong>Color 4</strong></label>
                <input type="text" id="sounds_color4" name="sounds_color4" value="<?php echo esc_attr($color4); ?>" class="sounds-sc-color" />
            </div>

            <div class="sounds-sc-field">
                <label for="sounds_color5"><strong>Color 5</strong></label>
                <input type="text" id="sounds_color5" name="sounds_color5" value="<?php echo esc_attr($color5); ?>" class="sounds-sc-color" />
            </div>

            <div class="sounds-sc-field sounds-sc-logo sounds-sc-media"
                 data-title="Elegir logo" data-button="Usar este logo" data-empty="Sin logo">
                <label><strong>Logo</strong></label>
                <div class="sounds-sc-logo-row">
                    <div class="sounds-sc-logo-preview sounds-sc-media-preview">
                        <?php if ($logo_url): ?>
                            <img src="<?php echo esc_url($logo_url); ?>" alt="" />
                        <?php else: ?>
                            <div class="sounds-sc-logo-placeholder">Sin logo</div>
                        <?php endif; ?>
                    </div>
                    <div>
                        <input type="hidden" name="sounds_logo_id" id="sounds_logo_id" class="sounds-sc-media-id" value="<?php echo esc_attr($logo_id); ?>" />
                        <button type="button" class="button sounds-sc-media-pick" id="sounds_logo_pick">Elegir logo</button>
                        <button type="button" class="button sounds-sc-media-clear" id="sounds_logo_clear">Quitar</button>
                    </div>
                </div>
            </div>

            <div class="sounds-sc-field sounds-sc-logo sounds-sc-media"
                 data-title="Elegir banner" data-button="Usar este banner" data-empty="Sin banner">
                <label><strong>Presentado por — Banner</strong></label>
                <p class="sounds-sc-help">
                    Se muestra arriba a la derecha del player, con la leyenda &laquo;Presentado por:&raquo;.
                    Si no eliges imagen, no se muestra nada.
                </p>
                <div class="sounds-sc-logo-row">
                    <div class="sounds-sc-logo-preview sounds-sc-media-preview">
                        <?php if ($banner_img): ?>
                            <img src="<?php echo esc_url($banner_img); ?>" alt="" />
                        <?php else: ?>
                            <div class="sounds-sc-logo-placeholder">Sin banner</div>
                        <?php endif; ?>
                    </div>
                    <div>
                        <input type="hidden" name="sounds_banner_id" class="sounds-sc-media-id" value="<?php echo esc_attr($banner_id); ?>" />
                        <button type="button" class="button sounds-sc-media-pick">Elegir banner</button>
                        <button type="button" class="button sounds-sc-media-clear">Quitar</button>
                    </div>
                </div>

                <p class="sounds-sc-sublabel">
                    <label for="sounds_banner_url"><strong>Link del banner</strong> (opcional)</label>
                </p>
                <input type="url" id="sounds_banner_url" name="sounds_banner_url" value="<?php echo esc_attr($banner_link); ?>" placeholder="https://..." class="widefat" />
            </div>
        </div>
        <?php
    }

    public static function save_meta($post_id) {
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) { return; }
        if (!isset($_POST['sounds_sc_nonce']) || !wp_verify_nonce($_POST['sounds_sc_nonce'], 'sounds_sc_save_meta')) { return; }
        if (!current_user_can('edit_post', $post_id)) { return; }

        if (isset($_POST['sounds_pub_id'])) {
            update_post_meta($post_id, self::META_PUB_ID, sanitize_text_field(wp_unslash($_POST['sounds_pub_id'])));
        }

        if (isset($_POST['sounds_stream_url'])) {
            update_post_meta($post_id, self::META_STREAM_URL, esc_url_raw(wp_unslash($_POST['sounds_stream_url'])));
        }

        if (isset($_POST['sounds_mount_url'])) {
            update_post_meta($post_id, self::META_MOUNT_URL, esc_url_raw(wp_unslash($_POST['sounds_mount_url'])));
        }

        $color_map = [
            'sounds_color1' => self::META_COLOR1,
            'sounds_color2' => self::META_COLOR2,
            'sounds_color3' => self::META_COLOR3,
            'sounds_color4' => self::META_COLOR4,
            'sounds_color5' => self::META_COLOR5,
        ];

        foreach ($color_map as $field => $meta_key) {
            if (isset($_POST[$field])) {
                $v = sanitize_hex_color(wp_unslash($_POST[$field]));
                update_post_meta($post_id, $meta_key, $v ? $v : '');
            }
        }

        if (isset($_POST['sounds_logo_id'])) {
            update_post_meta($post_id, self::META_LOGO_ID, absint($_POST['sounds_logo_id']));
        }

        $is_active = isset($_POST['sounds_is_active']) && $_POST['sounds_is_active'] === '1';
        update_post_meta($post_id, self::META_IS_ACTIVE, (bool) $is_active);

        if (isset($_POST['sounds_order'])) {
            update_post_meta($post_id, self::META_ORDER, absint($_POST['sounds_order']));
        }

        if (isset($_POST['sounds_banner_id'])) {
            update_post_meta($post_id, self::META_BANNER_ID, absint($_POST['sounds_banner_id']));
        }

        if (isset($_POST['sounds_banner_url'])) {
            update_post_meta($post_id, self::META_BANNER_URL, esc_url_raw(wp_unslash($_POST['sounds_banner_url'])));
        }
    }
}
