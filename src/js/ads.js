// ===== [ADS] =====
window._adFallbackStates = window._adFallbackStates || {};

function adFallback(slots, fallbackId) {
    var state = { slots: slots, fallbackId: fallbackId, loaded: {}, rendered: 0 };
    slots.forEach(function(id) { state.loaded[id] = false; });
    window._adFallbackStates[fallbackId] = state;
}

function scheduleAdsensePush(fb) {
    // Eliminar cualquier <ins> previo (por navegación SPA)
    var old = fb.querySelector('ins.adsbygoogle');
    if (old) old.remove();

    // Crear <ins> fresco con las dimensiones del contenedor
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    // Ancho fluido con tope en la medida de escritorio: un ancho fijo (970/728px)
    // desborda el documento en mobile y desfasa todo el layout.
    ins.style.width = '100%';
    ins.style.maxWidth = (fb.dataset.adWidth || '300') + 'px';
    ins.style.height = (fb.dataset.adHeight || '250') + 'px';
    ins.dataset.adClient = fb.dataset.adClient;
    ins.dataset.adSlot = fb.dataset.adSlot;
    ins.dataset.adFormat = fb.dataset.adFormat || 'auto';
    fb.appendChild(ins);

    var attempts = 0;
    var maxAttempts = 10;
    var delay = 80;

    var checkAndPush = function() {
        var insWidth = ins.offsetWidth;
        if (insWidth > 0) {
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
            catch (e) { console.error('adFallback: adsbygoogle push failed', e); }
        } else {
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkAndPush, delay);
            }
        }
    };

    setTimeout(checkAndPush, 50);
}

function initAdFallbackListener() {
    googletag.pubads().addEventListener('slotRenderEnded', function(event) {
        var id = event.slot.getSlotElementId();
        var states = Object.values(window._adFallbackStates);
        for (var i = 0; i < states.length; i++) {
            var state = states[i];
            if (!state.slots.includes(id)) continue;
            if (!event.isEmpty) state.loaded[id] = true;
            state.rendered++;
            if (state.rendered < state.slots.length) break;
            var showGPT = state.slots.every(function(s) { return state.loaded[s]; });
            state.slots.forEach(function(s) {
                var el = document.getElementById(s);
                if (el) el.style.display = showGPT ? '' : 'none';
            });
            var fb = document.getElementById(state.fallbackId);
            if (fb) {
                fb.style.display = showGPT ? 'none' : 'block';
                if (!showGPT) {
                    scheduleAdsensePush(fb);
                }
            }
            break;
        }
    });
}

function initGPT() {
    googletag.cmd.push(function () {
        googletag.destroySlots();
        window._adFallbackStates = {};

        var mappingBillboard   = googletag.sizeMapping().addSize([768, 0], [970, 250]).addSize([0, 0], [320,  50]).build();
        var mappingLeader      = googletag.sizeMapping().addSize([768, 0], [728,  90]).addSize([0, 0], [320,  50]).build();
        var mappingLeader2     = googletag.sizeMapping().addSize([768, 0], [728,  90]).addSize([0, 0], [320,  50]).build();
        var mappingBillboard2  = googletag.sizeMapping().addSize([768, 0], [728,  90]).addSize([0, 0], [320,  50]).build();
        var mappingSuperLeader = googletag.sizeMapping().addSize([768, 0], [970,  90]).addSize([0, 0], [320,  50]).build();
        var mappingBox         = googletag.sizeMapping().addSize([0, 0],   [300, 250]).build();
        var mappingBox2        = googletag.sizeMapping().addSize([0, 0],   [300, 250]).build();
        var mappingDoubleBox   = googletag.sizeMapping().addSize([0, 0],   [300, 600]).build();
        var mappingTakeover    = googletag.sizeMapping().addSize([768, 0],   [600, 800]).addSize([0, 0], [320, 480]).build();
        var mappingSkin        = googletag.sizeMapping().addSize([0, 0],   [1,   1  ]).build();
        var mappingVideoNota   = googletag.sizeMapping().addSize([0, 0],   [400,   311  ]).build();

        window.slotBillboard   = googletag.defineSlot("/23349147378/StereoCien", [[970, 250], [320,  50]], 'ad-slot-billboard').defineSizeMapping(mappingBillboard).addService(googletag.pubads());
        window.slotLeader      = googletag.defineSlot("/23349147378/StereoCien", [[728,  90], [320,  50]], 'ad-slot-leader').defineSizeMapping(mappingLeader).addService(googletag.pubads());
        window.slotLeader2     = googletag.defineSlot("/23349147378/StereoCien", [[728,  90], [320,  50]], 'ad-slot-leader2').defineSizeMapping(mappingLeader2).addService(googletag.pubads());
        window.slotBillboard2  = googletag.defineSlot("/23349147378/StereoCien", [[728,  90], [320,  50]], 'ad-slot-billboard2').defineSizeMapping(mappingBillboard2).addService(googletag.pubads());
        window.slotSuperLeader = googletag.defineSlot("/23349147378/StereoCien", [[970,  90], [320,  50]], 'ad-slot-superleader').defineSizeMapping(mappingSuperLeader).addService(googletag.pubads());
        window.slotBox         = googletag.defineSlot("/23349147378/StereoCien", [300, 250],               'ad-slot-box').defineSizeMapping(mappingBox).addService(googletag.pubads());
        window.slotBox2        = googletag.defineSlot("/23349147378/StereoCien", [300, 250],               'ad-slot-box2').defineSizeMapping(mappingBox2).addService(googletag.pubads());
        window.slotDoubleBox   = googletag.defineSlot("/23349147378/StereoCien", [300, 600],               'ad-slot-doublebox').defineSizeMapping(mappingDoubleBox).addService(googletag.pubads());
        window.slotTakeover    = googletag.defineSlot("/23349147378/StereoCien", [[600, 800], [320, 480]], 'ad-slot-takeover').defineSizeMapping(mappingTakeover).addService(googletag.pubads());
        window.slotSkin        = googletag.defineSlot("/23349147378/StereoCien/SkinLeft", [1, 1],          'ad-slot-skin').defineSizeMapping(mappingSkin).addService(googletag.pubads());
        window.slotVideoNota   = googletag.defineSlot("/23349147378/StereoCien", [400, 311],               'ad-slot-videonota').defineSizeMapping(mappingVideoNota).addService(googletag.pubads());

        googletag.pubads().setTargeting("test", "responsive");
        googletag.enableServices();

        if (document.getElementById('ad-slot-billboard'))   googletag.display('ad-slot-billboard');
        if (document.getElementById('ad-slot-leader'))      googletag.display('ad-slot-leader');
        if (document.getElementById('ad-slot-leader2'))     googletag.display('ad-slot-leader2');
        if (document.getElementById('ad-slot-billboard2'))  googletag.display('ad-slot-billboard2');
        if (document.getElementById('ad-slot-superleader')) googletag.display('ad-slot-superleader');
        if (document.getElementById('ad-slot-box'))         googletag.display('ad-slot-box');
        if (document.getElementById('ad-slot-box2'))        googletag.display('ad-slot-box2');
        if (document.getElementById('ad-slot-doublebox'))   googletag.display('ad-slot-doublebox');
        if (document.getElementById('ad-slot-takeover'))    googletag.display('ad-slot-takeover');
        if (document.getElementById('ad-slot-skin'))        googletag.display('ad-slot-skin');
        if (document.getElementById('ad-slot-videonota'))   googletag.display('ad-slot-videonota');

        if (document.getElementById('ad-slot-billboard'))   adFallback(['ad-slot-billboard'],   'ad-slot-billboard-adsense');
        if (document.getElementById('ad-slot-leader'))      adFallback(['ad-slot-leader'],      'ad-slot-leader-adsense');
        if (document.getElementById('ad-slot-leader2'))     adFallback(['ad-slot-leader2'],     'ad-slot-leader-adsense2');
        if (document.getElementById('ad-slot-billboard2'))  adFallback(['ad-slot-billboard2'],  'ad-slot-billboard2-adsense');
        if (document.getElementById('ad-slot-superleader')) adFallback(['ad-slot-superleader'], 'ad-slot-superleader-adsense');
        if (document.getElementById('ad-slot-box'))         adFallback(['ad-slot-box'],         'ad-slot-box-adsense');
        if (document.getElementById('ad-slot-box2'))        adFallback(['ad-slot-box2'],        'ad-slot-box2-adsense');
        if (document.getElementById('ad-slot-doublebox'))   adFallback(['ad-slot-doublebox'],   'ad-slot-doublebox-adsense');
    });
}

// initAdFallbackListener se registra UNA SOLA VEZ aquí (no dentro de initGPT)
// initGPT() NO se llama aquí — astro:page-load lo maneja en carga inicial y en navegaciones
googletag.cmd.push(initAdFallbackListener);

document.addEventListener('astro:page-load', function () {
    if (window.googletag && googletag.apiReady) {
        initGPT();
    } else {
        window.googletag = window.googletag || { cmd: [] };
        googletag.cmd.push(function() { initGPT(); });
    }
});
