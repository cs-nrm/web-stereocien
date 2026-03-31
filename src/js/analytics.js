// ===== [ANALYTICS - COMSCORE BEACON] =====
document.addEventListener('astro:page-load', function () {
    var ts = Math.round((new Date()).getTime() / 1000 * Math.random() * 10);
    self.COMSCORE && COMSCORE.beacon({
        c1: "2", c2: "6906652",
        options: {
            enableFirstPartyCookie: true,
            bypassUserConsentRequirementFor1PCookie: true
        }
    });

    fetch('/pageview_candidate.txt?' + ts)
        .then(function (resp) {
            console.log(resp);
        });
});
