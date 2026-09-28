// Static render of a Design canvas board (.dc.html) for review outside the canvas.
//
// Usage:
//   node render-estatico.js <board.dc.html> <salida.html> ['<json>'] [--editor]
//   <json> (optional): state keys for renderVals, plus an optional "props" object, e.g.
//     '{"playing":true,"src":"nd","sndOpen":true}'
//     '{"props":{"seccion":"Autos","menuSounds":false}}' --editor
//
// What it does:
//   - runs the board's `class Component extends DCLogic` (renderVals) with that state and the
//     data-props defaults (props in the JSON override them);
//   - resolves <sc-if>, fills {{holes}}, drops event attributes (the output is static: no clicks);
//   - mounts <image-slot> the way the editor does (a host div that takes only the slot's inline
//     style); empty slots get a hatched placeholder with their id;
//   - rewrites /_blob/<id> to the matching file in ../assets/blobs/ (relative to the board);
//   - --editor emulates edit mode (body[data-dc-editor-on], no animations, page does not scroll).
// CSS scroll-driven animations still run in browsers that support them (Chromium).
// Fonts come from the Google Fonts link in each board (needs internet).
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const pos = args.filter(a => !a.startsWith('--'));
const [inFile, outFile, jsonArg] = pos;
if (!inFile || !outFile) {
  console.error('usage: node render-estatico.js <board.dc.html> <salida.html> [json] [--editor]');
  process.exit(2);
}
const editor = flags.includes('--editor');
const src = fs.readFileSync(inFile, 'utf8');
const extra = jsonArg ? JSON.parse(jsonArg) : {};
const propOverrides = extra.props || {};
delete extra.props;

// ---- logic ---------------------------------------------------------------------------------
const js = src.split(/<script type="text\/x-dc"[^>]*>/)[1].split('</script>')[0];
const dpm = src.match(/data-props='([^']*)'/) || src.match(/data-props="([^"]*)"/);
const propsDecl = dpm ? JSON.parse(dpm[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')) : {};
const props = {};
for (const [k, v] of Object.entries(propsDecl)) if (k[0] !== '$' && v && 'default' in v) props[k] = v.default;
Object.assign(props, propOverrides);
global.document = { body: { hasAttribute: () => editor }, addEventListener() {}, removeEventListener() {} };
class DCLogic { constructor(p) { this.props = p; this.state = undefined; } setState(o) { this.state = Object.assign({}, this.state || {}, o); } forceUpdate() {} }
global.DCLogic = DCLogic;
const Component = eval('(' + js.trim().replace(/^class Component/, 'class') + ')');
const c = new Component(props);
if (Object.keys(extra).length) c.state = Object.assign({}, extra);
const vals = c.renderVals();
const lookup = p => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), vals);
const fromHole = h => (h === 'true' ? true : h === 'false' ? false : /^\d+(\.\d+)?$/.test(h) ? Number(h) : lookup(h));

// ---- template ------------------------------------------------------------------------------
const head = src.split('<helmet>')[1].split('</helmet>')[0];
const title = (src.match(/<title>([^<]*)<\/title>/) || [, 'Tablero'])[1];
let markup = src.split('</helmet>')[1].split('</x-dc>')[0];
markup = markup.replace(/\son[A-Z]\w*="\{\{[^}]*\}\}"/g, '');
const IF = /<sc-if value="\{\{\s*([\w$.]+)\s*\}\}"[^>]*>((?:(?!<sc-if)[\s\S])*?)<\/sc-if>/;
while (IF.test(markup)) markup = markup.replace(IF, (m, k, body) => (fromHole(k) ? body : ''));
const missing = new Set();
markup = markup.replace(/\{\{\s*([^}]*?)\s*\}\}/g, (m, h) => {
  const v = fromHole(h);
  if (v === undefined) { missing.add(h); return ''; }
  return typeof v === 'boolean' ? String(v) : String(v);
});
const EMPTY = 'position:absolute;inset:0;box-sizing:border-box;padding:8px;display:flex;align-items:flex-end;'
  + 'background:#dfe3ea repeating-linear-gradient(135deg,rgba(1,33,105,.08) 0 1px,transparent 1px 12px);'
  + "font:700 11px/1.2 'Roboto',system-ui,sans-serif;letter-spacing:1px;color:#5b6e9a";
markup = markup.replace(/<image-slot([^>]*)>([\s\S]*?)<\/image-slot>/g, (m, attrs, inner) => {
  const st = /\sstyle="([^"]*)"/.exec(attrs);
  const id = /\sid="([^"]*)"/.exec(attrs);
  const sid = id ? id[1] : '';
  const body = inner.trim() ? inner : `<span style="${EMPTY}">${sid}</span>`;
  return `<div class="sc-host-x" style="${st ? st[1] : 'display: contents'}"><image-slot id="${sid}" style="display:block;position:relative;width:100%;height:100%">${body}</image-slot></div>`;
});

// ---- assets --------------------------------------------------------------------------------
const blobDir = path.resolve(path.dirname(inFile), '../assets/blobs');
const blobs = {};
if (fs.existsSync(blobDir)) for (const f of fs.readdirSync(blobDir)) blobs[f.split('.')[0]] = path.join(blobDir, f);
const outDir = path.dirname(path.resolve(outFile));
const noBlob = new Set();
const rewrite = s => s.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => {
  if (!blobs[id]) { noBlob.add(id); return m; }
  return path.relative(outDir, blobs[id]).split(path.sep).join('/');
});

const editorCss = editor
  ? '<style>html[data-dc-canvas]{overflow:hidden}body[data-dc-editor-on] *{animation:none!important;transition:none!important}</style>'
  : '';
const html = `<!doctype html>
<html lang="es"${editor ? ' data-dc-canvas' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} (vista estática)</title>
<style>image-slot{display:block}</style>
${rewrite(head)}
${editorCss}
</head>
<body${editor ? ' data-dc-editor-on' : ''}>
${rewrite(markup)}
</body>
</html>
`;
fs.writeFileSync(outFile, html);
if (missing.size) console.warn('holes without value:', [...missing].join(', '));
if (noBlob.size) console.warn('assets not found in assets/blobs:', [...noBlob].join(', '));
console.log('ok', outFile);
