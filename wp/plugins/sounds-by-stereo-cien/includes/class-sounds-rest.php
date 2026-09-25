<?php
namespace SOUNDS_SC;

if (!defined('ABSPATH')) { exit; }

class REST {
    public static function init() {
        add_filter('rest_' . CPT::POST_TYPE . '_collection_params', [__CLASS__, 'collection_params']);
        add_filter('rest_' . CPT::POST_TYPE . '_query', [__CLASS__, 'collection_query'], 10, 2);
        add_action('rest_api_init', [__CLASS__, 'register_fields']);
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function collection_params($params) {
        if (isset($params['orderby']['enum']) && is_array($params['orderby']['enum'])) {
            $params['orderby']['enum'][] = 'sounds_order';
        }
        return $params;
    }

    public static function collection_query($args, $request) {
        if ($request->get_param('orderby') === 'sounds_order') {
            $args['meta_key'] = Meta::META_ORDER;
            $args['orderby'] = 'meta_value_num';
        }
        return $args;
    }

    public static function register_fields() {
        register_rest_field(CPT::POST_TYPE, 'sounds_pub_id', [
            'get_callback' => [__CLASS__, 'get_pub_id'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_stream_url', [
            'get_callback' => [__CLASS__, 'get_stream_url'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_mount_url', [
            'get_callback' => [__CLASS__, 'get_mount_url'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_colors', [
            'get_callback' => [__CLASS__, 'get_colors'],
            'schema' => ['type' => 'object'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_order', [
            'get_callback' => [__CLASS__, 'get_order'],
            'schema' => ['type' => 'integer'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_is_active', [
            'get_callback' => [__CLASS__, 'get_is_active'],
            'schema' => ['type' => 'boolean'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_logo_id', [
            'get_callback' => [__CLASS__, 'get_logo_id'],
            'schema' => ['type' => 'integer'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_logo_url', [
            'get_callback' => [__CLASS__, 'get_logo_url'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_logo_srcset', [
            'get_callback' => [__CLASS__, 'get_logo_srcset'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_banner_id', [
            'get_callback' => [__CLASS__, 'get_banner_id'],
            'schema' => ['type' => 'integer'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_banner_img', [
            'get_callback' => [__CLASS__, 'get_banner_img'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_banner_url', [
            'get_callback' => [__CLASS__, 'get_banner_url'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_sponsor_id', [
            'get_callback' => [__CLASS__, 'get_sponsor_id'],
            'schema' => ['type' => 'integer'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_sponsor_img', [
            'get_callback' => [__CLASS__, 'get_sponsor_img'],
            'schema' => ['type' => 'string'],
        ]);

        register_rest_field(CPT::POST_TYPE, 'sounds_sponsor_url', [
            'get_callback' => [__CLASS__, 'get_sponsor_url'],
            'schema' => ['type' => 'string'],
        ]);
    }

    public static function register_routes() {
        register_rest_route('sounds/v1', '/itunes', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'itunes_proxy'],
            'permission_callback' => '__return_true',
            'args' => [
                'term' => ['required' => true],
                'country' => ['required' => false],
                'limit' => ['required' => false],
            ],
        ]);
    }

    public static function itunes_proxy($request) {
        $term = sanitize_text_field($request->get_param('term'));
        if (!$term) {
            return new \WP_REST_Response(['error' => 'missing_term'], 400);
        }

        $country = sanitize_text_field($request->get_param('country')) ?: 'MX';
        $limit = absint($request->get_param('limit')) ?: 1;

        $qs = [
            'term' => $term,
            'entity' => 'song',
            'limit' => $limit,
            'country' => $country,
            'media' => 'music',
        ];

        $url = 'https://itunes.apple.com/search?' . http_build_query($qs, '', '&', PHP_QUERY_RFC3986);

        $resp = wp_remote_get($url, [
            'timeout' => 8,
            'redirection' => 3,
            'headers' => [
                'Accept' => 'application/json',
                'User-Agent' => 'SOUNDS-SC/' . SOUNDS_SC_VERSION,
            ],
        ]);

        if (is_wp_error($resp)) {
            return new \WP_REST_Response(['error' => 'request_failed'], 502);
        }

        $code = wp_remote_retrieve_response_code($resp);
        $body = wp_remote_retrieve_body($resp);

        if ($code < 200 || $code >= 300) {
            return new \WP_REST_Response(['error' => 'bad_status', 'status' => $code], 502);
        }

        $json = json_decode($body, true);
        if (!is_array($json)) {
            return new \WP_REST_Response(['error' => 'bad_json'], 502);
        }

        return new \WP_REST_Response($json, 200);
    }

    public static function get_pub_id($obj) { return (string) get_post_meta((int) $obj['id'], Meta::META_PUB_ID, true); }
    public static function get_stream_url($obj) { return (string) get_post_meta((int) $obj['id'], Meta::META_STREAM_URL, true); }
    public static function get_mount_url($obj) { return (string) get_post_meta((int) $obj['id'], Meta::META_MOUNT_URL, true); }

    public static function get_colors($obj) {
        $id = (int) $obj['id'];
        return [
            'color1' => (string) get_post_meta($id, Meta::META_COLOR1, true),
            'color2' => (string) get_post_meta($id, Meta::META_COLOR2, true),
            'color3' => (string) get_post_meta($id, Meta::META_COLOR3, true),
            'color4' => (string) get_post_meta($id, Meta::META_COLOR4, true),
            'color5' => (string) get_post_meta($id, Meta::META_COLOR5, true),
        ];
    }

    public static function get_order($obj) { return (int) get_post_meta((int) $obj['id'], Meta::META_ORDER, true); }
    public static function get_is_active($obj) { return (bool) get_post_meta((int) $obj['id'], Meta::META_IS_ACTIVE, true); }
    public static function get_logo_id($obj) { return (int) get_post_meta((int) $obj['id'], Meta::META_LOGO_ID, true); }

    public static function get_logo_url($obj) {
        $logo_id = (int) get_post_meta((int) $obj['id'], Meta::META_LOGO_ID, true);
        if (!$logo_id) { return ''; }
        $url = wp_get_attachment_image_url($logo_id, 'full');
        return $url ? (string) $url : '';
    }

    public static function get_logo_srcset($obj) {
        $logo_id = (int) get_post_meta((int) $obj['id'], Meta::META_LOGO_ID, true);
        if (!$logo_id) { return ''; }
        $srcset = wp_get_attachment_image_srcset($logo_id, 'full');
        return $srcset ? (string) $srcset : '';
    }

    public static function get_banner_id($obj) { return (int) get_post_meta((int) $obj['id'], Meta::META_BANNER_ID, true); }
    public static function get_banner_url($obj) { return (string) get_post_meta((int) $obj['id'], Meta::META_BANNER_URL, true); }

    public static function get_banner_img($obj) {
        $banner_id = (int) get_post_meta((int) $obj['id'], Meta::META_BANNER_ID, true);
        if (!$banner_id) { return ''; }
        $url = wp_get_attachment_image_url($banner_id, 'full');
        return $url ? (string) $url : '';
    }

    public static function get_sponsor_id($obj) { return (int) get_post_meta((int) $obj['id'], Meta::META_SPONSOR_ID, true); }
    public static function get_sponsor_url($obj) { return (string) get_post_meta((int) $obj['id'], Meta::META_SPONSOR_URL, true); }

    public static function get_sponsor_img($obj) {
        $sponsor_id = (int) get_post_meta((int) $obj['id'], Meta::META_SPONSOR_ID, true);
        if (!$sponsor_id) { return ''; }
        $url = wp_get_attachment_image_url($sponsor_id, 'full');
        return $url ? (string) $url : '';
    }
}
