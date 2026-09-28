# Lint for Design canvas boards (.dc.html): tag balance, quoted attrs, data-props JSON, root size = $preview,
# {{holes}} are plain lookups that exist in renderVals(), exact support.js line, no emoji, no red text under 24px.
# Usage: python3 lint.py project/C3-Desktop.dc.html project/C3-Movil-1.dc.html ...
import re, json, sys, glob
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
# SVG self-closing is not used; we close all svg children explicitly
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.stack=[]; s.errs=[]
    def handle_starttag(s,tag,attrs):
        if tag not in VOID: s.stack.append((tag,s.getpos()))
    def handle_startendtag(s,tag,attrs):
        if tag not in VOID: s.errs.append(f"self-closed non-void <{tag}> at {s.getpos()}")
    def handle_endtag(s,tag):
        if tag in VOID: s.errs.append(f"end tag for void </{tag}> at {s.getpos()}"); return
        if not s.stack: s.errs.append(f"stray </{tag}> at {s.getpos()}"); return
        t,pos=s.stack.pop()
        if t!=tag: s.errs.append(f"mismatch: opened <{t}> at {pos}, closed </{tag}> at {s.getpos()}")
ok=True
files=sys.argv[1:] or sorted(glob.glob('*.dc.html'))
for f in files:
    src=open(f,encoding='utf-8').read()
    p=P(); p.feed(src); p.close()
    errs=list(p.errs)
    if p.stack: errs.append(f"unclosed: {[(t,pos) for t,pos in p.stack]}")
    # unquoted attributes inside tags
    for m in re.finditer(r'<[a-zA-Z][^<>]*>', src):
        tag=m.group(0)
        if tag.startswith('<!'): continue
        inner=re.sub(r'"[^"]*"|\'[^\']*\'','',tag)
        um=re.search(r'\s[\w:-]+=[^\s>]', inner)
        if um: errs.append(f"unquoted attr in {tag[:80]}")
    # data-props JSON
    # data-props: single-quoted JSON (as written by Claude) or double-quoted with &quot; (as re-saved by the editor)
    dp=re.search(r"data-props='([^']*)'", src) or re.search(r'data-props="([^"]*)"', src)
    try:
        raw=dp.group(1).replace('&quot;','"').replace('&#39;',"'").replace('&amp;','&')
        props=json.loads(raw); pv=props['$preview']
    except Exception as e:
        errs.append(f"data-props JSON error {e}"); pv=None
    # root size equals preview
    after=src.split('</helmet>',1)[1]
    first=re.search(r'<div(?: class="[^"]*")? style="([^"]*)"', after)
    st=first.group(1) if first else ''
    if not first: errs.append('root not found')
    elif st.startswith('width: 100%;'):
        hh=re.search(r'(?:^|;\s*)height: (\d+)px;', st)
        if hh and pv and int(hh.group(1))!=pv['height']: errs.append(f"fluid root height {hh.group(1)} != preview {pv}")
    else:
        root=re.match(r'width: (\d+)px; height: (\d+)px;', st)
        if not root: errs.append('root size not found')
        elif pv and (int(root.group(1)),int(root.group(2)))!=(pv['width'],pv['height']): errs.append(f"root {root.groups()} != preview {pv}")
    # holes are simple lookups and exist in renderVals keys
    script=src.split('data-dc-script',1)[1]
    ret=script.split('return',1)[1] if 'return' in script else ''
    keys=set(re.findall(r'([A-Za-z_$][\w$]*)\s*:', ret))
    markup=src.split('<script type="text/x-dc"',1)[0]
    for h in re.findall(r'\{\{\s*([^}]*?)\s*\}\}', markup):
        if not re.fullmatch(r'[A-Za-z_$][\w$]*(\.[\w$]+)*|true|false|\d+', h): errs.append(f"non-lookup hole {{{{{h}}}}}")
        elif h not in ('true','false') and not h.isdigit() and h.split('.')[0] not in keys: errs.append(f"hole {h} missing in renderVals")
    # support.js line exact
    if '<script src="./support.js"></script>' not in src: errs.append('support.js line missing')
    # emoji check
    if re.search('[\U0001F300-\U0001FAFF☀-➿]', src): errs.append('emoji-like char found')
    # rojo usage in text color below 24px
    for m in re.finditer(r'style="([^"]*)"', markup):
        st=m.group(1)
        if re.search(r'(^|;\s*)color:\s*#ef4444', st):
            fs=re.search(r'font-size:\s*([\d.]+)px', st)
            if not fs or float(fs.group(1))<24: errs.append(f"rojo text <24px: {st[:90]}")
    print(f"{f}: {'OK' if not errs else 'ERRORS'} ({len(src)} bytes, {len(keys)} keys)")
    for e in errs: print('   -', e); ok=False
sys.exit(0 if ok else 1)
