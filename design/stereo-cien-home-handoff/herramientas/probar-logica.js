// Emulates DCLogic enough to exercise renderVals + handlers + lifecycle of a board's script
// (SOUNDS menu: open/close, outside click, Esc, station pick, back to live; tabs; every {{hole}} resolves).
// Usage: node probar-logica.js project/C3-Desktop.dc.html   (also works for C3-Movil-1)
const fs = require('fs');
const file = process.argv[2];
const src = fs.readFileSync(file, 'utf8');
const js = src.split(/<script type="text\/x-dc"[^>]*>/)[1].split('</script>')[0];
const dpm = src.match(/data-props='([^']*)'/) || src.match(/data-props="([^"]*)"/);
const props = JSON.parse(dpm[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
const listeners = {};
global.document = {
  body: { attrs: {}, hasAttribute(n) { return !!this.attrs[n]; } },
  addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
  removeEventListener(t, f) { listeners[t] = (listeners[t] || []).filter(x => x !== f); },
};
class DCLogic { constructor(p) { this.props = p; this.state = undefined; } setState(o) { this.state = Object.assign({}, this.state || {}, o); } }
global.DCLogic = DCLogic;
const Component = eval('(' + js.trim().replace(/^class Component/, 'class') + ')');
const defaults = {}; for (const [k, v] of Object.entries(props)) if (k[0] !== '$' && 'default' in v) defaults[k] = v.default;
const c = new Component(defaults);
c.componentDidMount && c.componentDidMount();
const V = () => c.renderVals();
const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
const el = cls => ({ closest: sel => sel.split(',').some(s => s.trim() === '.' + cls) ? {} : null });
let v = V(), ok = true;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) ok = false; };
if (typeof v.toggleSounds !== 'function') {
  // Boards without the SOUNDS menu (e.g. C3-Movil-2): only check that every template hole resolves.
  console.log('(este tablero no tiene menú SOUNDS: solo se revisan los huecos)');
  const tpl0 = src.split('<script type="text/x-dc"')[0];
  const h0 = [...new Set([...tpl0.matchAll(/\{\{\s*([\w$.]+)\s*\}\}/g)].map(m => m[1].split('.')[0]))].filter(h => !['true','false'].includes(h));
  const miss0 = h0.filter(h => !(h in v)); check(miss0.length === 0, 'all template holes resolve' + (miss0.length ? ' missing: ' + miss0 : ''));
  process.exit(ok ? 0 : 1);
}
check(v.sndExp === 'false' && !/snd-open/.test(v.rootClass), 'starts closed');
check(/ed-menu/.test(v.rootClass) === (defaults.menuSounds !== false), 'ed-menu follows menuSounds default (' + defaults.menuSounds + ')');
v.toggleSounds(); v = V(); check(v.sndExp === 'true' && /snd-open/.test(v.rootClass), 'capsule opens menu');
fire('pointerdown', { type: 'pointerdown', target: el('c3-dd') }); v = V(); check(v.sndExp === 'true', 'click inside panel keeps it open');
fire('pointerdown', { type: 'pointerdown', target: el('elsewhere') }); v = V(); check(v.sndExp === 'false', 'outside click closes');
v.toggleSounds(); v = V(); fire('keydown', { type: 'keydown', key: 'Escape' }); v = V(); check(v.sndExp === 'false', 'Escape closes');
v.toggleSounds(); v = V(); v.putRe(); v = V();
check(v.sndExp === 'false' && v.srcSounds && v.onRe && !v.onBd && v.cRe === 'dd-on' && v.pRe === 'true' && v.playing, 'station pick: closes, plays ROCK ESPAÑOL');
check(v.lRe === 'Rock Español, en la tornamesa' && v.lNw === 'Poner News en la tornamesa', 'row labels');
if ('soundsName' in v) check(v.soundsName === 'ROCK ESPAÑOL', 'capsule shows station name');
check(v.sndBg === '#ffffff' && v.sndInk === '#012169', 'capsule active colors');
v.toggleSounds(); v = V(); v.backLive(); v = V(); check(v.srcLive && v.sndExp === 'false', 'volver al 100.1 closes and goes live');
document.body.attrs['data-dc-editor-on'] = true; v.toggleSounds(); v = V();
fire('pointerdown', { type: 'pointerdown', target: el('elsewhere') }); v = V(); check(v.sndExp === 'true', 'editor mode: outside click does not close');
document.body.attrs = {};
v.pickHist(); v = V(); check(v.tabHist && !v.tabProg, 'tabs still switch');
c.componentWillUnmount(); check(!(listeners.pointerdown || []).length && !(listeners.keydown || []).length, 'listeners removed on unmount');
const tpl = src.split('<script type="text/x-dc"')[0];
const holes = [...new Set([...tpl.matchAll(/\{\{\s*([\w$.]+)\s*\}\}/g)].map(m => m[1].split('.')[0]))].filter(h => !['true','false'].includes(h));
const missing = holes.filter(h => !(h in v)); check(missing.length === 0, 'all template holes resolve' + (missing.length ? ' missing: ' + missing : ''));
process.exit(ok ? 0 : 1);
