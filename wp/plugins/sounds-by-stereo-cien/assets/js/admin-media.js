(function($){
  function initColorPickers(){ $('.sounds-sc-color').wpColorPicker(); }

  // Cada .sounds-sc-media es un selector de imagen independiente (logo, banner, ...).
  // Guarda su propio wp.media frame para no compartir estado entre campos.
  function initMediaPicker(){
    $('.sounds-sc-media').each(function(){
      var $field   = $(this);
      var $input   = $field.find('.sounds-sc-media-id');
      var $preview = $field.find('.sounds-sc-media-preview');
      var frame;

      var title  = $field.data('title')  || 'Elegir imagen';
      var button = $field.data('button') || 'Usar esta imagen';
      var empty  = $field.data('empty')  || 'Sin imagen';

      $field.find('.sounds-sc-media-pick').on('click', function(e){
        e.preventDefault();
        if (frame) { frame.open(); return; }
        frame = wp.media({
          title: title,
          button: { text: button },
          library: { type: 'image' },
          multiple: false
        });
        frame.on('select', function(){
          var a = frame.state().get('selection').first().toJSON();
          $input.val(a.id);
          var url = (a.sizes && a.sizes.medium) ? a.sizes.medium.url : a.url;
          $preview.html($('<img>', { src: url, alt: '' }));
        });
        frame.open();
      });

      $field.find('.sounds-sc-media-clear').on('click', function(e){
        e.preventDefault();
        $input.val('');
        $preview.html($('<div>', { 'class': 'sounds-sc-logo-placeholder', text: empty }));
      });
    });
  }

  $(document).ready(function(){ initColorPickers(); initMediaPicker(); });
})(jQuery);
