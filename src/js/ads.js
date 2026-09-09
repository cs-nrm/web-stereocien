// ===== [ADS] =====
// ===== [ADS] initGPT =====
function initGPT() {
  googletag.cmd.push(function () {
    googletag.destroySlots(); // dentro de cmd.push: GPT siempre está listo aquí

    // Responsive mappings: addSize([viewport_w, viewport_h], [ad_w, ad_h])
    // Formatos estandarizados: leaderboard (728x90) y box (300x250).
    var mappingLeaderboard = googletag.sizeMapping().addSize([768, 0], [728, 90]).addSize([0, 0], [320, 50]).build();
    var mappingBox         = googletag.sizeMapping().addSize([0, 0], [300, 250]).build();
    var mappingdoublebox   = googletag.sizeMapping().addSize([0, 0], [300, 600]).build();
    var mapping14          = googletag.sizeMapping().addSize([768, 0], [600, 800]).addSize([0, 0], [320, 480]).build();
    var mappingVideoNota   = googletag.sizeMapping().addSize([0, 0], [400, 311]).build();

    window.slotLeaderboard1 = googletag.defineSlot("/23349147378/StereoCien", [[728, 90], [320, 50]], 'ad-slot-leaderboard1').defineSizeMapping(mappingLeaderboard).addService(googletag.pubads());
    window.slotLeaderboard2 = googletag.defineSlot("/23349147378/StereoCien", [[728, 90], [320, 50]], 'ad-slot-leaderboard2').defineSizeMapping(mappingLeaderboard).addService(googletag.pubads());
    window.slotLeaderboard3 = googletag.defineSlot("/23349147378/StereoCien", [[728, 90], [320, 50]], 'ad-slot-leaderboard3').defineSizeMapping(mappingLeaderboard).addService(googletag.pubads());
    window.slotLeaderboard4 = googletag.defineSlot("/23349147378/StereoCien", [[728, 90], [320, 50]], 'ad-slot-leaderboard4').defineSizeMapping(mappingLeaderboard).addService(googletag.pubads());
    window.slotLeaderboard5 = googletag.defineSlot("/23349147378/StereoCien", [[728, 90], [320, 50]], 'ad-slot-leaderboard5').defineSizeMapping(mappingLeaderboard).addService(googletag.pubads());
    window.slotdoublebox  = googletag.defineSlot("/23349147378/StereoCien", [300, 600], 'ad-slot-doublebox').defineSizeMapping(mappingdoublebox).addService(googletag.pubads());
    window.slot14 = googletag.defineSlot("/23349147378/StereoCien", [[600, 800], [320, 480]], 'ad-slot14').defineSizeMapping(mapping14).addService(googletag.pubads());
    window.slotBoxbanner1 = googletag.defineSlot("/23349147378/StereoCien", [300, 250], 'ad-slot-boxbanner1').defineSizeMapping(mappingBox).addService(googletag.pubads());
    window.slotBoxbanner2 = googletag.defineSlot("/23349147378/StereoCien/Box", [300, 250], 'ad-slot-boxbanner2').defineSizeMapping(mappingBox).addService(googletag.pubads());
    window.slotBoxbanner3 = googletag.defineSlot("/23349147378/StereoCien/Box2", [300, 250], 'ad-slot-boxbanner3').defineSizeMapping(mappingBox).addService(googletag.pubads());
    window.slotBoxbanner4 = googletag.defineSlot("/23349147378/StereoCien/Box3", [300, 250], 'ad-slot-boxbanner4').defineSizeMapping(mappingBox).addService(googletag.pubads());
    window.slotBoxbanner5 = googletag.defineSlot("/23349147378/StereoCien/Box4", [300, 250], 'ad-slot-boxbanner5').defineSizeMapping(mappingBox).addService(googletag.pubads());
    window.slotBoxbanner6 = googletag.defineSlot("/23349147378/StereoCien/Box5", [300, 250], 'ad-slot-boxbanner6').defineSizeMapping(mappingBox).addService(googletag.pubads());
    if (document.getElementById('ad-slot-videonota')) {
      window.slotVideoNota = googletag.defineSlot("/23349147378/StereoCien", [400, 311], 'ad-slot-videonota').defineSizeMapping(mappingVideoNota).addService(googletag.pubads());
    }

    // Migrado de `pubads().setTargeting("test", "responsive")`, que GPT marcó
    // como deprecado (aviso `goo.gle/gpt-message#170`). Mismo alcance: con un
    // solo servicio, el targeting de servicio ya era targeting de página.
    // La llave se llama literalmente "test". Readback a mano:
    // `googletag.getConfig('targeting')` — sin la llave devuelve {} y avisa #96.
    googletag.setConfig({ targeting: { test: "responsive" } });

    // 🔴 Vista de página NUEVA para GAM. initGPT() vuelve a correr en cada
    // navegación de View Transitions; sin renovar el correlator, TODAS comparten
    // el de la primera carga y para Ad Manager el lector nunca sale de la misma
    // vista. No solo subcuenta vistas de página: dentro de una vista GAM aplica
    // exclusión competitiva, roadblocks y frecuencia como si fuera una sola
    // página, así que esas reglas se aplican a la sesión entera del lector.
    // Va DESPUÉS de destroySlots() + defineSlot y ANTES de display(), como pide
    // la doc de GPT para single-page apps.
    // No se llama en la PRIMERA vista: GPT ya generó su correlator al cargar.
    // Verificación: navegar 3 veces => 3 correlators distintos en /gampad/ads.
    if (window._gptHuboPrimeraVista) googletag.pubads().updateCorrelator();
    window._gptHuboPrimeraVista = true;

    googletag.enableServices();
    if (document.getElementById('ad-slot-leaderboard1')) googletag.display('ad-slot-leaderboard1');
    if (document.getElementById('ad-slot-leaderboard2')) googletag.display('ad-slot-leaderboard2');
    if (document.getElementById('ad-slot-leaderboard3')) googletag.display('ad-slot-leaderboard3');
    if (document.getElementById('ad-slot-leaderboard4')) googletag.display('ad-slot-leaderboard4');
    if (document.getElementById('ad-slot-leaderboard5')) googletag.display('ad-slot-leaderboard5');
    if (document.getElementById('ad-slot-doublebox'))  googletag.display('ad-slot-doublebox');
    if (document.getElementById('ad-slot14')) googletag.display('ad-slot14');
    if (document.getElementById('ad-slot-boxbanner1')) googletag.display('ad-slot-boxbanner1');
    if (document.getElementById('ad-slot-boxbanner2')) googletag.display('ad-slot-boxbanner2');
    if (document.getElementById('ad-slot-boxbanner3')) googletag.display('ad-slot-boxbanner3');
    if (document.getElementById('ad-slot-boxbanner4')) googletag.display('ad-slot-boxbanner4');
    if (document.getElementById('ad-slot-boxbanner5')) googletag.display('ad-slot-boxbanner5');
    if (document.getElementById('ad-slot-boxbanner6')) googletag.display('ad-slot-boxbanner6');
    if (document.getElementById('ad-slot-videonota')) googletag.display('ad-slot-videonota');

    googletag.pubads().refresh([window.slotBoxbanner1]);

    // Limpiar intervalo anterior si existe (por navegación SPA)
    if (window.slotBoxbanner1RefreshInterval) {
      clearInterval(window.slotBoxbanner1RefreshInterval);
    }

    // Crear intervalo para refresh cada 2 minutos (120000 ms)
    window.slotBoxbanner1RefreshInterval = setInterval(function(){
      googletag.pubads().refresh([window.slotBoxbanner1]);
    }, 120000);
  });
}
// initGPT() NO se llama aquí — astro:page-load dispara en carga inicial Y en navegaciones,
// así que centralizar ahí evita la doble inicialización que destruía el anuncio del modal.

// initGPT() NO se llama aquí — astro:page-load lo maneja en carga inicial y en navegaciones
document.addEventListener('astro:page-load', function () {
    if (window.googletag && googletag.apiReady) {
        initGPT();
    } else {
        window.googletag = window.googletag || { cmd: [] };
        googletag.cmd.push(function() { initGPT(); });
    }
});
