// ===== [ADS] Video intersticial en el Inicio (modal del takeover) =====
//
// Pide un anuncio de video (VAST) al bloque de StereoCien con el IMA SDK y lo muestra a
// pantalla completa dentro de #modal. Sirve deals de video in-stream (p. ej. KIA, deal
// 4368307, 600x360v) fuera del Play de la radio, que hasta ahora era el único lugar donde
// se pedía un VAST. El modal solo se abre si llega un anuncio; si GAM responde vacío no
// se muestra nada.
//
// Lo dispara ads.js desde slotRenderEnded del takeover de display (ad-slot14) cuando ese
// espacio NO trae una línea de GAM: el takeover vendido directo tiene prioridad.
//
// plcmt=3: intersticial (video a pantalla completa sin contenido alrededor). Declararlo
// bien evita que los DSP invaliden la impresión. vpa y vpmute los agrega IMA según
// setAdWillAutoPlay y setAdWillPlayMuted.
//
// Portado de web-oye (src/js/videoIntersticial.js); cambia el bloque de StereoCien.

var VI_AD_UNIT = '/23349147378/StereoCien/VideoVast';
var VI_IMA_SRC = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';

var viState = { loader: null, manager: null, activo: false };

function viBuildTag() {
  var pageUrl = encodeURIComponent(location.href);
  // Solo en local: ?vitest=1 usa el tag de muestra público de Google para probar el flujo
  // con anuncio sin depender de que el deal tenga pujas.
  if (location.hostname === 'localhost' && /[?&]vitest=1/.test(location.search)) {
    return 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=' + Date.now();
  }
  return 'https://pubads.g.doubleclick.net/gampad/ads?iu=' + VI_AD_UNIT +
    '&sz=600x360&gdfp_req=1&env=vp&output=vast&impl=s&unviewed_position_start=1&plcmt=3' +
    '&url=' + pageUrl + '&description_url=' + pageUrl + '&correlator=' + Date.now();
}

function viCargarIma() {
  if (window.google && google.ima) return Promise.resolve();
  if (window._viImaPromise) return window._viImaPromise;
  window._viImaPromise = new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = VI_IMA_SRC;
    s.async = true;
    s.onload = function () { resolve(); };
    s.onerror = function () { window._viImaPromise = null; reject(new Error('IMA no cargó')); };
    document.head.appendChild(s);
  });
  return window._viImaPromise;
}

function viCerrar() {
  var modal = document.getElementById('modal');
  if (modal) modal.classList.remove('con-video');
  try { if (viState.manager) viState.manager.destroy(); } catch (e) {}
  try { if (viState.loader) viState.loader.destroy(); } catch (e) {}
  viState.manager = null;
  viState.loader = null;
  viState.activo = false;
}

// Mismo cálculo que el CSS de #vi-wrap en Modal.astro: min(92vw, 800px) a 16:9.
function viTamano() {
  var w = Math.min(window.innerWidth * 0.92, 800);
  return { w: Math.round(w), h: Math.round(w * 9 / 16) };
}

function startVideoIntersticial() {
  var modal = document.getElementById('modal');
  var adEl = document.getElementById('vi-ad');
  var videoEl = document.getElementById('vi-video');
  if (!modal || !adEl || !videoEl) return;
  if (viState.activo) return;
  viState.activo = true;

  viCargarIma().then(function () {
    var ima = google.ima;
    try { ima.settings.setDisableCustomPlaybackForIOS10Plus(true); } catch (e) {}

    var display = new ima.AdDisplayContainer(adEl, videoEl);
    display.initialize();
    var loader = new ima.AdsLoader(display);
    viState.loader = loader;

    // Sin anuncio (VAST vacío, error 1009) o cualquier falla: no se abre el modal.
    loader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, function () { viCerrar(); });

    loader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, function (ev) {
      // Si el lector ya cambió de página, no abrir nada.
      if (!document.body.contains(adEl)) { viCerrar(); return; }
      var manager = ev.getAdsManager(videoEl);
      viState.manager = manager;
      var fin = function () { viCerrar(); };
      manager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, fin);
      manager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, fin);
      manager.addEventListener(ima.AdEvent.Type.SKIPPED, fin);

      // Mostrar el modal antes de arrancar para que la impresión cuente visible.
      modal.classList.add('con-video');
      var t = viTamano();
      manager.init(t.w, t.h, ima.ViewMode.NORMAL);
      manager.setVolume(0);
      manager.start();
    });

    var req = new ima.AdsRequest();
    req.adTagUrl = viBuildTag();
    var t = viTamano();
    req.linearAdSlotWidth = t.w;
    req.linearAdSlotHeight = t.h;
    req.nonLinearAdSlotWidth = t.w;
    req.nonLinearAdSlotHeight = Math.round(t.h / 3);
    req.setAdWillAutoPlay(true);
    req.setAdWillPlayMuted(true);
    loader.requestAds(req);
  }).catch(function () { viCerrar(); });
}

// Botón de sonido y cierre, delegados: el modal es otro nodo en cada navegación de Astro.
document.addEventListener('click', function (e) {
  if (e.target && e.target.closest && e.target.closest('#vi-sonido')) {
    if (viState.manager) viState.manager.setVolume(1);
    var b = document.getElementById('vi-sonido');
    if (b) b.style.display = 'none';
  }
});
document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'cerrar' && e.target.checked) viCerrar();
});
// Al salir de la página con el router de Astro, cortar el anuncio.
document.addEventListener('astro:before-swap', function () { viCerrar(); });

window.startVideoIntersticial = startVideoIntersticial;
