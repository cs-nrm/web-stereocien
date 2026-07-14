// ===== [PLAYER - GLOBALS + SVG CONSTANTS] =====
var streaming;
var local_status;
const buttonPause = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-pause" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#01216a" fill="#01216a" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /><path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /></svg>';
const buttonPlay = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-play-filled" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#01216a" fill="#01216a" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" stroke-width="0" fill="currentColor" /></svg>';
const bigButtonPause = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-pause" width="35" height="35" viewBox="0 0 24 24" stroke-width="1.5" stroke="#01216a" fill="#01216a" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /><path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /></svg>';
const bigButtonPlay = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-play" width="35" height="35" viewBox="0 0 24 24" stroke-width="1.5" stroke="#01216a" fill="#01216a" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 4v16l13 -8z" /></svg>';
const buttongLoading = '<img width="40" height="40" src="https://storage.googleapis.com/nrm-web/oye/recursos/loading-normal.gif" style="padding:5px;"/>';
const buttonPodcastPlay = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-play" width="80" height="80" viewBox="0 0 24 24" stroke-width="2" stroke="#000" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 4v16l13 -8z" /></svg>';
const buttonPodcastPause = '<svg xmlns="https://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-pause" width="80" height="80" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /><path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /></svg>';
var volume;
var artist;
var cancion;
var hora;
const radioButton = document.getElementById('radiobutton');
const player = document.getElementById('player');
const secchome = document.getElementById('home');


// ===== [PLAYER - SDK INIT] =====
function initPlayerSDK() {
    var tdPlayerConfig = {
        coreModules: [{
            id: 'MediaPlayer',
            playerId: 'td_container',
            audioAdaptive: false,
            plugins: [{ id: "vastAd" }]
        }],
        playerReady: onPlayerReady,
        moduleError: onModuleError,
        audioAdaptive: true,
        analytics: {
            active: true,
            debug: false,
            appInstallerId: 'stereocienpag',
            trackingId: 'G-W7YEMEWBX1',
            trackingEvents: ['play', 'stop', 'pause', 'resume', 'all'],
            sampleRate: 100,
            category: 'Reproduccion Radio Pag'
        }
    };
    streaming = new TDSdk(tdPlayerConfig);
    streaming.addEventListener('stream-status', getStatus);
    streaming.addEventListener('ad-playback-complete', completeAd);
    streaming.addEventListener('ad-playback-start', startAd);
    streaming.addEventListener('ad-playback-error', errorAd);
    streaming.addEventListener('ad-break-cue-point', adBreakCuePoint);
    streaming.addEventListener('autoplay', autoplay);
}

// ===== [PLAYER - STATUS + CALLBACKS] =====
var musicInterval = null;

function getStatus(s) {
    local_status = s.data.code;
    const secchome = document.getElementById('home');
    if (local_status == 'GETTING_STATION_INFORMATION' || local_status == 'LIVE_CONNECTING' || local_status == 'LIVE_BUFFERING') {
        document.getElementById('play-pause').classList.remove('show');
        document.getElementById('play-pause').classList.add('hide');
        document.getElementById('big-play').innerHTML = buttongLoading;
    }
    if (local_status == 'LIVE_PLAYING') {
        document.getElementById('play-pause').innerHTML = buttonPause;
        document.getElementById('play-pause').classList.add('show');
        document.getElementById('play-pause').classList.remove('hide');
        document.getElementById('big-play').innerHTML = bigButtonPause;
        document.querySelector('.text-player').innerHTML = '<div style="font-weight:bold;">Ahora suena...</div><div id="infoMusic" style="line-height:11px; font-size:12px;"></div>';
        document.querySelector('.text-player').classList.add('playing');
        document.getElementById('radiobutton').classList.add('playerplaying');
        if (musicInterval) clearInterval(musicInterval);
        setTimeout(function () {
            getInfoMusic();
        }, 1000);
        musicInterval = setInterval(getInfoMusic, 30000);
    }
    if (local_status == 'LIVE_STOP' || local_status == 'LIVE_PAUSE') {
        document.getElementById('play-pause').classList.add('show');
        document.getElementById('play-pause').classList.remove('hide');
        document.getElementById('play-pause').innerHTML = buttonPlay;
        document.getElementById('big-play').innerHTML = bigButtonPlay;
        document.querySelector('.text-player').classList.remove('playing');
        document.getElementById('radiobutton').classList.remove('playerplaying');
        document.querySelector('.text-player').innerHTML = '';
        setTimeout(function () {
            document.querySelector('.text-player').innerHTML = 'ESCUCHA LA RADIO <span style="color: #df104a;    font-weight: bold;    font-size: 12px;">EN VIVO </span> AHORA';
        }, 1000);
        if (musicInterval) clearInterval(musicInterval);
    }
}


function completeAd(e) {
    streaming.play({
        station: 'XEOYAM',
        trackingParameters: { Dist: 'WebStereocien' }
    });
    document.getElementById('td_container').classList.remove('pub_active');
    document.getElementById('full-cover').style.display = 'none';
}


function adBreakCuePoint(e) {}

function startAd(e) {
    document.getElementById('td_container').classList.add('pub_active');
    document.getElementById('full-cover').style.display = 'block';
    document.getElementById('big-play').innerHTML = buttongLoading;
    document.querySelector('.text-player').innerHTML = '<div style="font-style: italic; line-height:11px; font-weight:bold; font-size:11px;">Iniciamos después del anuncio...</div>';
}

var start = function () {
    streaming.playAd('vastAd', { url: 'https://pubads.g.doubleclick.net/gampad/ads?sz=600x360&iu=/23349147378/StereoCien/VideoVast&ciu_szs=600x360&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&url=[referrer_url]&description_url=[description_url]&correlator=[timestamp]' });
};


function pause() {
    streaming.stop();
}


function play() {
    streaming.play({
        station: 'XEOYAM',
        trackingParameters: { Dist: 'WebStereocien' }
    });
}


function stop() {
    streaming.stop();
}

function errorAd(e) {
    streaming.play({
        station: 'XEOYAM',
        trackingParameters: { Dist: 'WebStereocien' }
    });
    console.log(e);
    console.log('error ad');
}

function onPlayerReady() {
    console.log('streaming ready');
    document.getElementById('play-pause').classList.add('show');
    document.getElementById('play-pause').classList.remove('hide');
    vol = streaming.getVolume();
}


function onConfigurationError(e) {
    console.log(e);
    console.log(e.data.errors);
}

function onModuleError(object) {
    console.log(object);
    console.log(object.data.errors);
}

function onAdBlockerDetected() {
    console.log('AdBlockerDetected');
}

const autoplay = function () {
    streaming.play({
        station: 'XEOYAM',
        trackingParameters: {
            Dist: 'WebStereocien',
            autoplay: 1
        }
    });
};

initPlayerSDK();
volume = document.getElementById('vol');
volume.addEventListener('input', function () {
    streaming.setVolume(volume.value);
});

function detectarNavegador() {
    const ua = navigator.userAgent;

    let navegador = "desconocido";
    if (ua.includes("Chrome")) navegador = "Chrome";
    else if (ua.includes("Firefox")) navegador = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) navegador = "Safari";
    else if (ua.includes("Edge")) navegador = "Edge";
    else if (ua.includes("MSIE") || ua.includes("Trident")) navegador = "IE";

    let so = "desconocido";
    if (ua.includes("Windows")) so = "Windows";
    else if (ua.includes("Mac")) so = "MacOS";
    else if (ua.includes("Linux")) so = "Linux";
    else if (ua.includes("Android")) so = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) so = "iOS";

    return { navegador, sistema: so };
}

// ===== [PLAYER - NOW PLAYING + VOTING] =====
var lastArtist = null;
var lastSong = null;

function getInfoMusic() {
    fetch("https://cdn.nrm.com.mx/cdn/stereociendigital/playlist/cancion.json")
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
        })
        .then((data) => {
            let newArtist = '';
            let newSong = '';
            let newHora = '';

            switch (data.categoria) {
                case 'ST2000':
                case "ST70'S":
                case "ST80'S":
                case "ST90'S":
                case 'STCIEN':
                case 'STCURREN':
                case 'STDISCO':
                case 'STEREO CIEN 2020':
                case 'STEXITOS':
                case 'ST-BEATLES':
                case 'STNAVIDAD':
                    newArtist = data.artista;
                    newSong = data.title;
                    newHora = data.hora_real;
                    break;
                default:
                    newArtist = 'PAUSA COMERCIAL';
                    newSong = '';
                    newHora = '';
                    break;
            }

            if (lastArtist === null || lastSong === null || newArtist !== lastArtist || newSong !== lastSong) {
                lastArtist = newArtist;
                lastSong = newSong;
                artist = newArtist;
                cancion = newSong;
                hora = newHora;

                if (cancion === '') {
                    document.getElementById('infoMusic').innerHTML = artist;
                } else {
                    const secenvivo = document.getElementById('envivo');
                    var cover;
                    var coverbase = "https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=9a371ed9786b7037d2b0b088615b047a&format=json";
                    const codtit = cancion.replace('&', '%26');
                    const codart = artist.replace('&', '%26');
                    console.log('Artista: ' + artist);
                    console.log('Canción: ' + cancion);
                    console.log('escribe');

                    document.getElementById('infoMusic').innerHTML = '<div class="current-song">' + cancion + ' / ' + artist + '</div><div class="share-current"><div class="like"><svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="28" height="28" stroke-width="1"> <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"></path> </svg> </div> <div class="share-wp"><a href="https://api.whatsapp.com/send/?text=Estoy%20escuchando%20' + codtit + '%20de%20' + codart + '%20en%20https://stereociendigital.mx/" target="_blank"> <svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="28" height="28" stroke-width="1"> <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z"></path> </svg> </div></div>';

                    const url = 'https://stereociendigital.com.mx/9xjkftr7/8s4v3f1l3s.php';
                    const colorVotado = '#ef4444';

                    const likeBtn = document.querySelector('.like');
                    if (likeBtn) {
                        likeBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            const btn = this;
                            const svg = btn.querySelector('svg');
                            const fillColor = svg.style.fill?.toLowerCase();

                            if (fillColor === colorVotado) {
                                console.log('Ya votaste por esta canción.');
                                return;
                            }

                            if (!codart || !codtit || btn.disabled) return;

                            btn.disabled = true;

                            function detectarDispositivo() {
                                return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
                            }
                            const { navegador, sistema } = detectarNavegador();

                            fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    artista: codart,
                                    cancion: codtit,
                                    dispositivo: detectarDispositivo(),
                                    navegador,
                                    sistema_operativo: sistema
                                })
                            })
                            .then(res => res.json())
                            .then(resp => {
                                if (resp.status === 'success') {
                                    svg.style.fill = colorVotado;
                                    console.log('Voto registrado con éxito.');
                                } else {
                                    console.log(resp.message || 'Error al votar.');
                                    btn.disabled = false;
                                }
                            })
                            .catch(() => {
                                console.log('No se pudo registrar el voto. Intenta de nuevo.');
                                btn.disabled = false;
                            });
                        });
                    }

                    var linkcover = coverbase + '&track=' + codtit + '&artist=' + codart;
                    fetch(linkcover)
                        .then((res) => {
                            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                            return res.json();
                        })
                        .then((dataalbum) => {
                            var lig = dataalbum.track.album;
                            if (secenvivo) {
                                document.querySelectorAll('.cover-background').forEach(el => el.innerHTML = '');
                                if (!lig || artist == 'PAUSA COMERCIAL') {
                                    cover = '/img/logo-STEREO-pag.png';
                                    document.querySelector('.logo-player img').src = cover;
                                } else {
                                    cover = dataalbum.track.album.image[2]['#text'];
                                    document.querySelector('.logo-player img').src = cover;
                                }
                            } else {
                                if (!lig || artist == 'PAUSA COMERCIAL') {
                                    const bg = document.querySelector('#radiobutton .cover-background');
                                    if (bg) bg.innerHTML = '';
                                } else {
                                    cover = dataalbum.track.album.image[2]['#text'];
                                    const existingBg = document.querySelector('#radiobutton .cover-background');
                                    if (existingBg) existingBg.innerHTML = '';
                                    const div = document.createElement('div');
                                    div.className = 'cover-background';
                                    div.innerHTML = '<img src="' + cover + '" />';
                                    document.getElementById('radiobutton').appendChild(div);
                                }
                            }
                        });
                }
            }
        });
}


// ===== [PLAYER - PROGRAMACION EN VIVO] =====
function getInfoProg() {
    fetch("https://stereociendigital.com.mx/wp-json/wp/v2/posts?_embed&per_page=40&categories=302&_fields[]=_links&_fields[]=_embedded&_fields[]=acf&_fields[]=content")
        .then((res) => {
            if (!res.ok) throw new Error('HTTP error! Status: ${res.status}');
            return res.json();
        })
        .then((data) => {
            const fecha = new Date();
            const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const dia = dias[fecha.getDay()];
            const hora = dayjs(fecha).format('HH:mm:ss');
            let siguientePrograma = null;
            data.map(function (prog, i, el) {
                if (prog.acf[dia] === true) {
                    if (prog.acf.hora_fin >= hora && prog.acf.hora_inicio <= hora) {
                        document.querySelector('.banner-prog img').src = prog._embedded['wp:featuredmedia'][0].media_details.sizes['full'].source_url;
                        document.querySelector('.envivo-prog').innerHTML = prog.acf.programa;
                        document.querySelector('.envivo-now').innerHTML = prog.acf.hora_inicio + ' - ' + prog.acf.hora_fin;
                        document.querySelector('.envivo-prog-tab').innerHTML = prog.acf.programa;
                        document.querySelector('.envivo-desc').innerHTML = prog.content.rendered;
                    }

                    if (prog.acf.hora_inicio > hora) {
                        if (!siguientePrograma || prog.acf.hora_inicio < siguientePrograma.acf.hora_inicio) {
                            siguientePrograma = prog;
                        }
                    }
                }
            });
            if (siguientePrograma) {
                document.querySelector('.envivo-next').innerHTML = siguientePrograma.acf.hora_inicio + ' - ' + siguientePrograma.acf.hora_fin;
                document.querySelector('.envivo-prog-next-tab').innerHTML = siguientePrograma.acf.programa;
            }
        });
}

// ===== [PLAYER - CONTROLES] =====
const radioActive = function () {
    document.getElementById('player-inner').classList.add('active');
    document.getElementById('player-v-podcast').classList.remove('active');
    document.getElementById('player-v-video').classList.remove('active');
    document.querySelector('.player-float').classList.remove('hide');
};

const podcastActive = function () {
    document.getElementById('player-inner').classList.remove('active');
    document.getElementById('player-v-podcast').classList.add('active');
    document.getElementById('player-v-video').classList.remove('active');
    document.querySelector('.player-float').classList.add('hide');
    document.querySelector('.player-float').classList.remove('active');
};

const videoActive = function () {
    document.getElementById('player-inner').classList.remove('active');
    document.getElementById('player-v-podcast').classList.remove('active');
    document.getElementById('player-v-video').classList.add('active');
};

const radioStop = function () {
    transitionPlayer();
    streaming.stop();
    document.getElementById('player').dataset.status = 'init';
    document.getElementById('player-inner').classList.remove('active');
};

const initPlayer = function () {
    transitionPlayer();
    document.getElementById('player-v-podcast').classList.remove('active');
    document.getElementById('player-v-video').classList.remove('active');
    document.querySelector('.player-float').classList.remove('hide');
    document.getElementById('radiobutton').classList.remove('playerplaying');
    document.querySelector('.player-float').classList.add('active');
};

const transitionPlayer = function () {
    document.getElementById('radiobutton').style.width = '0px';
    setTimeout(function () {
        document.getElementById('radiobutton').style.width = '250px';
    }, 500);
};

const playerstatus = function () {
    return document.getElementById('player').dataset.status;
};

const playstopRadio = function () {
    transitionPlayer();
    const getplayingstatus = playerstatus();
    if (getplayingstatus == 'podcast-playing') {
        document.getElementById('iframepodcast').innerHTML = '';
    }

    if (local_status == null || local_status == 'undefined' || local_status == '') {
        start();
        document.getElementById('player').dataset.status = 'radio-playing';
        radioActive();
    } else if (local_status == 'LIVE_STOP') {
        play();
        document.getElementById('player').dataset.status = 'radio-playing';
    } else if (local_status == 'LIVE_PLAYING' || local_status == 'GETTING_STATION_INFORMATION' || local_status == 'LIVE_CONNECTING' || local_status == 'LIVE_BUFFERING') {
        radioStop();
    }
};


document.getElementById('big-play').addEventListener('click', function () {
    playstopRadio();
});

document.getElementById('return-live')?.addEventListener('click', function () {
    playstopRadio();
});

document.querySelectorAll('.radio-link').forEach(function (el) {
    el.addEventListener('click', function () {
        playstopRadio();
    });
});


// ===== [NAVIGATION - VIEW TRANSITIONS] =====
document.addEventListener('astro:before-preparation', ev => {
    document.querySelector('main').classList.add('loading');
    document.querySelector('.preloader').classList.add('showpreloader');
});

document.addEventListener("astro:after-swap", () => {
    if (window.instgrm) window.instgrm.Embeds.process();
});


document.addEventListener('astro:page-load', ev => {
    const getplayingstatus = playerstatus();
    document.querySelector('main').classList.remove('loading');
    document.querySelector('.preloader').classList.remove('showpreloader');

    const secchome = document.getElementById('home');
    const secenvivo = document.getElementById('envivo');
    const secprogramacion = document.getElementById('programacion');

    if (secprogramacion) {
        const tabLinks = document.querySelectorAll('#estacion [role="tab"]');
        const tabPanels = document.querySelectorAll('#estacion [role="tabpanel"]');

        tabLinks.forEach((tab, idx) => {
            tab.addEventListener('click', function (e) {
                e.preventDefault();
                tabLinks.forEach(t => {
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('bg-white', 'text-slate-700');
                    t.classList.add('text-slate-600');
                });
                tabPanels.forEach(panel => {
                    panel.classList.add('hidden', 'opacity-0');
                });
                tab.setAttribute('aria-selected', 'true');
                tab.classList.add('bg-white', 'text-slate-700');
                tab.classList.remove('text-slate-600');
                const panelId = tab.getAttribute('aria-controls');
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.classList.remove('hidden', 'opacity-0');
                }
            });
        });
    }

    if (secenvivo) {
        getInfoProg();
        getInfoMusic();
        setInterval(getInfoProg, 60000);
        document.getElementById('radiobutton').classList.add('en-vivo');
        if (local_status == null || local_status == 'undefined' || local_status == '' || local_status == 'LIVE_STOP') {
            playstopRadio();
        }
        if (local_status == 'LIVE_PLAYING' || local_status == 'GETTING_STATION_INFORMATION' || local_status == 'LIVE_CONNECTING' || local_status == 'LIVE_BUFFERING') {
            document.querySelectorAll('.cover-background').forEach(el => el.innerHTML = '');
        }
        document.querySelector('.logo-player img').src = '/img/logo-STEREO-pag.png';
        document.getElementById('big-play').classList.remove('border-4');
    } else {
        document.querySelector('.logo-player img').src = 'https://storage.googleapis.com/nrm-web/stereocien/stereocien-jul26.svg';
        document.getElementById('radiobutton').classList.remove('en-vivo');
        document.getElementById('big-play').classList.add('border-4');
    }

    const secprogram = document.getElementById('slider-locutores');
    const secprograma = document.getElementById('slider-locutores-enfoque');
    const secsounds = document.getElementById('carrusel-sounds');

    if (secchome || secsounds) {
        console.log(getplayingstatus);

        let soundWin = null;

        const soundButtons = ['sounds-love', 'sounds-acoustic-moods', 'sounds-retro', 'sounds-soundtracks', 'sounds-covers', 'sounds-jazz-blues', 'sounds-world-music', 'sounds-nu-disco', 'sounds-back-to-disco', 'sounds-latin', 'sounds-live', 'sounds-fresh', 'sounds-xmas'];
        soundButtons.forEach(buttonId => {
            const element = document.getElementById(buttonId);
            if (element) {
                element.addEventListener('click', function () {
                    const soundType = buttonId.replace('sounds-', '');
                    const url = `/station/${soundType}?utm_source=stereocien&utm_medium=web&utm_campaign=${soundType}&autoplay=1`;
                    if (!soundWin || soundWin.closed) {
                        soundWin = window.open(url, 'soundPopup', 'width=500,height=900');
                    } else {
                        soundWin.location.href = url;
                        soundWin.focus();
                    }
                    radioStop();
                });
            }
        });
    }


    if (secprogram || secchome || secprograma) {
        var elempod = document.querySelector('.main-carousel');
        var flktypod = new Flickity(elempod, {
            contain: true,
            lazyLoad: 1,
            wrapAround: true,
            cellAlign: 'center',
            pageDots: false,
            autoPlay: 5000,
        });

        var elemsounds = document.querySelector('.main-carousel-sounds');
        var flktysounds = new Flickity(elemsounds, {
            contain: true,
            lazyLoad: 1,
            wrapAround: true,
            cellAlign: 'center',
            pageDots: false,
            autoPlay: 8000,
        });

        var elemenf = document.querySelector('.main-carousel-enfoque');
        var flktyenf = new Flickity(elemenf, {
            contain: true,
            lazyLoad: 1,
            wrapAround: true,
            cellAlign: 'center',
            pageDots: false,
            autoPlay: 5000,
        });

        var elembuenfin = document.querySelector('.carousel-buenfin');
        var flktybuenfin = new Flickity(elembuenfin, {
            cellAlign: 'right',
            prevNextButtons: true,
            pageDots: false,
            pauseAutoPlayOnHover: true,
            freeScroll: true,
            wrapAround: true
        });

        document.querySelectorAll('.panel-stereo').forEach(el => el.addEventListener('click', () => flktypod.resize()));
        document.querySelectorAll('.panel-enf').forEach(el => el.addEventListener('click', () => flktyenf.resize()));

        var swiper = new Swiper(".swiper", {
            effect: "coverflow",
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: "auto",
            coverflowEffect: {
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 3,
                slideShadows: true
            },
            speed: 400,
            autoplay: true,
            spaceBetween: 60,
            loop: true,
            pagination: {
                clickable: true
            }
        });
    }

    const imagenNota = document.getElementById("imagen-nota");
    if (imagenNota) {
        const imgNotaOriginal = imagenNota.getElementsByTagName('img');
        const imgNotaOriginal2 = imgNotaOriginal[0].getAttribute('src');
        imagenNota.style.backgroundImage = "url(" + imgNotaOriginal2 + ")";
    }


    if (getplayingstatus == 'podcast-playing') {
        const containerpodcast = document.getElementById('iframepodcast');
        initPlayer();
    }

    document.querySelectorAll('.audiopod').forEach(function (el) {
        el.addEventListener('click', function () {
            const getstatus = playerstatus();
            const podactive = el.querySelector('.play-pause-podcast');
            const podcaststatus = podactive.getAttribute('data-podcast-status');
            const containerpodcast = document.getElementById('iframepodcast');

            transitionPlayer();
            podcastActive();
            setTimeout(function () {
                document.getElementById('radiobutton').classList.add('playerplaying');
            }, 600);

            if (getstatus == 'radio-playing') {
                radioStop();
            }

            podactive.innerHTML = '<img class="loading-gif" src="https://storage.googleapis.com/nrm-web/oye/recursos/loading-normal.gif" />';

            document.querySelector('.close-podcast').addEventListener('click', function () {
                initPlayer();
                const playerpodcast = document.getElementById('iframepodcast').getElementsByTagName('iframe')[0];
                const ply = new playerjs.Player(playerpodcast);
                ply.on('ready', () => {
                    ply.pause();
                    podactive.setAttribute('data-podcast-status', 'ready');
                });
                document.querySelectorAll('.audiopod').forEach(function (a) {
                    a.querySelector('.play-pause-podcast').innerHTML = buttonPodcastPlay;
                    a.querySelector('.play-pause-podcast').setAttribute('data-podcast-status', 'ready');
                });
            });

            if (getstatus == 'podcast-playing') {
                const playerpodcast = document.getElementById('iframepodcast').getElementsByTagName('iframe')[0];
                const ply = new playerjs.Player(playerpodcast);
                ply.on('ready', () => {
                    ply.pause();
                    podactive.setAttribute('data-podcast-status', 'ready');
                });
                document.querySelectorAll('.audiopod').forEach(function (a) {
                    a.querySelector('.play-pause-podcast').innerHTML = buttonPodcastPlay;
                    a.querySelector('.play-pause-podcast').setAttribute('data-podcast-status', 'ready');
                });
            }

            if (podcaststatus == 'ready') {
                const ifr = el.querySelector('.data-iframe').getAttribute('data-iframe');
                const ifrsrc = ifr.split('src="');
                const src = ifrsrc[1].split('"');
                containerpodcast.innerHTML = '';
                const playerpodcast = document.createElement('iframe');
                playerpodcast.setAttribute('src', src[0] + "?image=0&share=0&download=1&description=0&background=efefef&foreground=2b2b2c&highlight=fff");
                playerpodcast.setAttribute('width', '300');
                playerpodcast.setAttribute('height', '190');
                playerpodcast.setAttribute('frameborder', '0');
                playerpodcast.setAttribute('allow', 'autoplay');
                playerpodcast.setAttribute('transition:persist', '');
                containerpodcast.appendChild(playerpodcast);
                const ply = new playerjs.Player(playerpodcast);

                ply.on('ready', () => {
                    podactive.setAttribute('data-podcast-status', 'active');
                    document.getElementById('player').dataset.status = 'podcast-playing';
                    playerpodcast.classList.add('iframestyle');
                    ply.play();

                    ply.on('play', () => {
                        podactive.innerHTML = buttonPodcastPause;
                    });

                    ply.on('pause', () => {
                        podactive.innerHTML = buttonPodcastPlay;
                    });
                });
            } else if (podcaststatus == 'active') {
                const playerpodcast = document.getElementById('iframepodcast').getElementsByTagName('iframe')[0];
                const ply = new playerjs.Player(playerpodcast);
                ply.on('ready', () => {
                    ply.pause();
                    podactive.setAttribute('data-podcast-status', 'ready');
                });
            }
        });
    });

    document.querySelectorAll('.wp-block-image').forEach(function (el) {
        const img = el.querySelector('img');
        const datasrc = img.getAttribute('data-src');
        if (datasrc) img.src = datasrc;
    });


    const containvideo = document.getElementById('content-w-video');
    if (containvideo) {
        if (navigator.userAgent.indexOf("iPhone") != -1) {
            document.querySelectorAll('.wp-block-embed-youtube .wp-block-embed__wrapper iframe').forEach(function (el) {
                el.addEventListener('click', function () {
                    const getstatus = playerstatus();
                    if (getstatus == 'radio-playing') {
                        radioStop();
                        document.getElementById('player').dataset.status = 'video-playing';
                    }
                });
            });
        } else {
            document.querySelectorAll('.wp-block-embed-youtube .wp-block-embed__wrapper').forEach(function (wrapper) {
                const plyr = new Plyr(wrapper.querySelector('iframe').parentElement, {
                    debug: false,
                    controls: [
                        'play-large',
                        'restart',
                        'rewind',
                        'play',
                        'fast-forward',
                        'progress',
                        'current-time',
                        'duration',
                        'mute',
                        'volume',
                        'captions',
                        'settings',
                        'pip',
                        'airplay',
                        'download',
                        'fullscreen',
                    ],
                    playsinline: true
                });
                plyr.on('playing', function () {
                    const getstatus = playerstatus();
                    if (getstatus == 'radio-playing') {
                        radioStop();
                        document.getElementById('player').dataset.status = 'video-playing';
                    }
                });

                document.getElementById('radiobutton').addEventListener('click', function () {
                    plyr.pause();
                });
            });
        }


        document.querySelectorAll('.voto-pop').forEach(function (el) {
            el.addEventListener('click', function () {
                const id = el.getAttribute('data-voto-id');
                const params = {
                    "item_id": id,
                    "user_id": 15,
                    "type": "post",
                    "user_ip": "0.0.0.0",
                    "status": "like"
                };

                fetch('https://contenido.beatdigital.mx/wp-json/wp-ulike-pro/v1/vote/', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer GoW1bJVNjV3SCoUfVblUJs6ddelYSrGmmadoZglqcWrFELxbvrksHfsIOKeYZcgFN0jKNFtpiJEB7YN8rwUsLONosH06pWU1UZ2zIL10n0kUM26ufABMlqyh',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                })
                .then(res => res.json())
                .then(data => {
                    el.classList.add('voted');
                    el.querySelector('svg').setAttribute('fill', 'white');
                    Toastify({
                        text: "Gracias por tu voto",
                        className: "info",
                        style: {
                            background: "linear-gradient(to right, #ec4899, #a855f7)",
                            'border-radius': '6px',
                            'box-shadow': 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)'
                        },
                        offset: {
                            x: '10rem',
                            y: '20rem'
                        }
                    }).showToast();
                });
            });
        });
    }
});
