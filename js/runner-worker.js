/* ねこコード：JavaScript を別の場所（ワーカー）で動かす
   ・終わらないくり返しがあっても、アプリ本体は固まらない
   ・書いたコードは2行目から始まる形でファイルにするので、行番号がずれない */
function fmt(v){
  if (typeof v === 'string') return v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()';
  if (Array.isArray(v)) { try { return '[' + v.map(x => typeof x === 'string' ? "'" + x + "'" : fmt(x)).join(', ') + ']'; } catch(e) { return String(v); } }
  if (v && typeof v === 'object') { try { return JSON.stringify(v); } catch(e) { return String(v); } }
  return String(v);
}
const BR = { __br: true };
const fakeConsole = {
  log:   (...a) => postMessage({ t: 'log', s: a.map(fmt).join(' ') }),
  error: (...a) => postMessage({ t: 'log', s: a.map(fmt).join(' ') }),
  warn:  (...a) => postMessage({ t: 'log', s: a.map(fmt).join(' ') }),
  info:  (...a) => postMessage({ t: 'log', s: a.map(fmt).join(' ') })
};
const fakeDocument = {
  createElement: (tag) => tag === 'br' ? BR : { tag: tag },
  body: { append: (...a) => { for (const x of a) { if (x === BR) postMessage({ t: 'br' }); else postMessage({ t: 'app', s: fmt(x) }); } } },
  getElementById: () => null
};
function lineFrom(err){
  if (!err) return null;
  if (typeof err.line === 'number') return err.line - 1;           // Safari
  const st = String(err.stack || '');
  const m = st.match(/blob:[^\s)]*?:(\d+):(\d+)/);
  return m ? (parseInt(m[1], 10) - 1) : null;
}
let codeURL = null;
self.addEventListener('error', (e) => {
  e.preventDefault();
  const line = (e.filename && codeURL && e.filename === codeURL && e.lineno) ? e.lineno - 1 : lineFrom(e.error);
  postMessage({ t: 'err', name: (e.error && e.error.name) || 'Error', msg: (e.error && e.error.message) || String(e.message || '').replace(/^Uncaught\s+\w*:\s*/, ''), line: line });
});
onmessage = (e) => {
  const src = 'self.__run = function (console, document, confirm, alert, prompt) {\n' + e.data + '\n};';
  try {
    codeURL = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    importScripts(codeURL);
  } catch (err) {
    postMessage({ t: 'err', name: err.name, msg: err.message, line: lineFrom(err), syntax: true });
    return;
  }
  try {
    self.__run(fakeConsole, fakeDocument, () => true, (m) => fakeConsole.log(m), () => '');
    postMessage({ t: 'done' });
  } catch (err) {
    postMessage({ t: 'err', name: err && err.name, msg: err && err.message ? err.message : String(err), line: lineFrom(err) });
  }
};
