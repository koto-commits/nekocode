/* =========================================================
   ねこコード：実行と答え合わせ
   ・JS：ワーカーで実行 → 表示された行 or エラー（Chrome と同じ英語の形＋何行目か）
   ・HTML/CSS：プレビューに表示して、決めた条件をチェック
   ========================================================= */
(function(){
  const RESERVED = new Set(['if','else','for','while','do','return','function','const','let','var','new','typeof','in','of','break','continue','switch','case','default','class','true','false','null','undefined','this']);

  /* ---- 文法エラー（acorn）→ Chrome と同じ言い方に ---- */
  function syntaxCheck(code){
    if (!window.acorn) return null;
    try {
      acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowReturnOutsideFunction: false });
      return null;
    } catch (e) {
      const raw = String(e.message || '').replace(/\s*\(\d+:\d+\)\s*$/, '');
      const pos = typeof e.pos === 'number' ? e.pos : 0;
      const line = e.loc ? e.loc.line : null;
      const rest = code.slice(pos);
      let msg = raw;
      if (/^Unexpected token/.test(raw) || /^Unexpected keyword/.test(raw)) {
        if (!rest.trim()) msg = 'Unexpected end of input';
        else {
          const ch = rest[0];
          const word = (rest.match(/^[A-Za-z_$][\w$]*/) || [])[0];
          if (word) msg = RESERVED.has(word) ? `Unexpected token '${word}'` : `Unexpected identifier '${word}'`;
          else if (/[0-9]/.test(ch)) msg = 'Unexpected number';
          else if (ch === '"' || ch === "'") msg = 'Unexpected string';
          else msg = `Unexpected token '${ch}'`;
        }
      } else if (/^Unexpected character/.test(raw) || /^Unterminated string/.test(raw)) {
        msg = 'Invalid or unexpected token';
      } else if (/^Assigning to rvalue/.test(raw)) {
        msg = 'Invalid left-hand side in assignment';
      } else if (/^Unterminated template/.test(raw)) {
        msg = 'Unterminated template literal';
      } else if (/^Unterminated regular expression/.test(raw)) {
        msg = 'Invalid regular expression: missing /';
      }
      return { name: 'SyntaxError', msg, line };
    }
  }

  /* ---- Safari などの言い方を Chrome の言い方にそろえる ---- */
  function normalize(name, msg){
    let m;
    msg = String(msg || '');
    if ((m = msg.match(/^Can't find variable: (.+)$/))) return { name: 'ReferenceError', msg: `${m[1]} is not defined` };
    if (/^Cannot access uninitialized variable/.test(msg)) return { name: 'ReferenceError', msg: 'Cannot access a variable before initialization' };
    if (/Attempted to assign to readonly property/.test(msg)) return { name: 'TypeError', msg: 'Assignment to constant variable.' };
    if ((m = msg.match(/^.+ is not a function\. \(In '.*', '(.+)' is .+\)$/))) return { name: 'TypeError', msg: `${m[1]} is not a function` };
    if ((m = msg.match(/^(undefined|null) is not an object \(evaluating '.*\.([\w$]+)'\)$/))) return { name: 'TypeError', msg: `Cannot read properties of ${m[1]} (reading '${m[2]}')` };
    if ((m = msg.match(/^Cannot declare a (?:let|const) variable twice: '(.+)'\.?$/))) return { name: 'SyntaxError', msg: `Identifier '${m[1]}' has already been declared` };
    if (/Maximum call stack size exceeded/.test(msg)) return { name: 'RangeError', msg: 'Maximum call stack size exceeded' };
    return { name: name || 'Error', msg };
  }

  /* ---- 日本語にする（1〜2行） ---- */
  function explainJa(msg){
    let m;
    if ((m = msg.match(/Identifier '(.+?)' has already been declared/))) return `「${m[1]}」という箱を2回作っています。2回目の let / const を消すか、名前を変えよう。`;
    if (/Assignment to constant/.test(msg)) return 'const の箱は中身を入れ替えられません。あとで変えるなら let で作ろう。';
    if ((m = msg.match(/^(\S+) is not defined/))) return `「${m[1]}」という箱（関数）が見つかりません。作り忘れ・つづりちがい・作る前に使っていないか見てみよう。`;
    if (/before initialization/.test(msg)) return '箱を作る行より前で使っています。let / const の行を上に動かそう。';
    if ((m = msg.match(/(\S+) is not a function/))) return `「${m[1]}」は関数ではありません。つづりや、( ) を付ける相手を見てみよう。`;
    if (/Cannot read properties of (undefined|null)/.test(msg)) return '中身が空っぽのものの中を . で見ようとしています。配列の番号（< と <=）や名前を見てみよう。';
    if (/Unexpected end of input/.test(msg)) return 'コードが途中で終わっています。} や ) が足りないかも。';
    if (/Invalid or unexpected token/.test(msg)) return '読めない文字があります。？ が残っていないか、全角の （ ） ； や全角スペースがないか見てみよう。';
    if (/Invalid left-hand side in assignment/.test(msg)) return '= の左に箱じゃないものがあります。比べるなら === を使おう。';
    if ((m = msg.match(/Unexpected identifier '(.+?)'/))) return `「${m[1]}」の前に , や ; や + が足りないか、言葉の順番がちがうかも。`;
    if ((m = msg.match(/Unexpected token '(.+?)'/))) return `その場所に「${m[1]}」が来るのはおかしい、という意味。( ) と { の間の ; や、, の書き忘れを見てみよう。`;
    if (/Unexpected string/.test(msg)) return '文字と文字の間の + か , が抜けているかも。';
    if (/Unexpected number/.test(msg)) return '数字の前の + か , が抜けているかも。';
    if (/Maximum call stack/.test(msg)) return '再帰が止まりません。終了条件（if）にちゃんとたどりつくか見てみよう。';
    if (/Timeout/.test(msg)) return 'くり返しが終わりません。続ける条件と、i の変え方（++ / --）を見てみよう。';
    return 'エラーが出た行のまわりを、1文字ずつ見てみよう。';
  }

  /* ---- JS を実行 ---- */
  let current = null;
  function runJS(code, onUpdate){
    if (current) { current.stop(); current = null; }
    return new Promise((resolve) => {
      const lines = []; let pending = null;
      const hasTimer = /set(Interval|Timeout)\s*\(/.test(code);
      const syn = syntaxCheck(code);
      if (syn) { resolve({ lines: [], error: Object.assign(syn, { ja: explainJa(syn.msg) }) }); return; }
      let worker;
      try { worker = new Worker('js/runner-worker.js'); }
      catch (e) { resolve({ lines: [], error: { name: 'Error', msg: 'Could not start the runner.', ja: 'このブラウザでは実行できませんでした。' } }); return; }
      let done = false;
      const flush = () => { if (pending !== null) { lines.push(pending); pending = null; } };
      const view = () => pending !== null ? lines.concat([pending]) : lines.slice();
      function finish(res){
        if (done) return; done = true;
        clearTimeout(timer); worker.terminate(); current = null;
        flush();
        resolve(Object.assign({ lines: lines.slice() }, res));
      }
      worker.onmessage = (e) => {
        const d = e.data;
        if (d.t === 'log') { flush(); lines.push(d.s); onUpdate && onUpdate(view()); }
        else if (d.t === 'app') { pending = (pending || '') + d.s; onUpdate && onUpdate(view()); }
        else if (d.t === 'br') { lines.push(pending || ''); pending = null; onUpdate && onUpdate(view()); }
        else if (d.t === 'err') {
          const n = normalize(d.name, d.msg);
          finish({ error: { name: n.name, msg: n.msg, line: (d.line != null && d.line > 0) ? d.line : null, ja: explainJa(n.msg) } });
        }
        else if (d.t === 'done') { if (!hasTimer) finish({}); }
      };
      worker.onerror = (e) => { e.preventDefault(); const n = normalize('Error', e.message); finish({ error: { name: n.name, msg: n.msg, line: null, ja: explainJa(n.msg) } }); };
      const timer = setTimeout(() => {
        if (hasTimer) finish({ note: 'setInterval / setTimeout は 3秒で止めています。' });
        else finish({ timeout: true, error: { name: 'Timeout', msg: 'The code did not finish within 2 seconds (infinite loop?).', line: null, ja: explainJa('Timeout') } });
      }, hasTimer ? 3000 : 2000);
      current = { stop: () => finish({ stopped: true }) };
      worker.postMessage(code);
    });
  }

  /* ---- JS の答え合わせ ---- */
  function same(a, b){
    a = String(a).trim(); b = String(b).trim();
    if (a === b) return true;
    const na = Number(a), nb = Number(b);
    return a !== '' && b !== '' && !isNaN(na) && !isNaN(nb) && Math.abs(na - nb) < 1e-6;
  }
  function judgeJS(stage, code, res){
    if (res.error) return { ok: false, kind: 'error' };
    const got = res.lines.map(s => String(s).trim()); while (got.length && got[got.length-1] === '') got.pop();
    const exp = stage.expect;
    for (let i = 0; i < Math.max(got.length, exp.length); i++) {
      if (!(i < got.length && i < exp.length && same(got[i], exp[i]))) {
        return { ok: false, kind: 'output', line: i, want: i < exp.length ? exp[i] : '（ここで終わり）', have: i < got.length ? got[i] : '（表示なし）' };
      }
    }
    const clean = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const mu of (stage.must || [])) {
      if (!new RegExp(mu.re).test(clean)) return { ok: false, kind: 'must', ja: mu.ja, en: mu.en };
    }
    return { ok: true };
  }

  /* ---- HTML / CSS ---- */
  function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function buildDoc(html, css){
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>body{font-family:-apple-system,"Hiragino Sans",sans-serif;margin:12px;color:#000;background:#fff}img{max-width:100%;min-width:24px;min-height:24px;background:#eee}</style>' +
      '<style>' + (css || '') + '</style></head><body>' + (html || '') + '</body></html>';
  }
  function renderPreview(iframe, html, css){
    return new Promise((resolve) => {
      iframe.onload = () => resolve(iframe);
      iframe.srcdoc = buildDoc(html, css);
    });
  }
  const STYLE_JA = { 'color':'文字の色', 'font-size':'文字の大きさ', 'background-color':'背景の色', 'padding-top':'内側の余白（padding）', 'margin-top':'外側の余白（margin）',
    'font-weight':'文字の太さ', 'border-top-width':'線の太さ', 'border-top-style':'線の種類', 'border-top-color':'線の色', 'border-top-left-radius':'角の丸さ' };
  function checkDoc(iframe, checks){
    const doc = iframe.contentDocument, win = iframe.contentWindow;
    const fails = [];
    for (const c of checks) {
      let els = [];
      try { els = Array.from(doc.querySelectorAll(c.sel)); } catch (e) { els = []; }
      const tag = c.sel;
      if (c.count != null) {
        if (els.length !== c.count) fails.push({ en: `Expected ${c.count} element(s) matching "${tag}", but found ${els.length}.`, ja: `「${tag}」は ${c.count}こ必要です（いまは ${els.length}こ）。` });
        continue;
      }
      if (!els.length) { fails.push({ en: `Expected to find "${tag}", but it was not found.`, ja: `「${tag}」が見つかりません。タグの名前や閉じタグを見てみよう。` }); continue; }
      if (c.exists) continue;
      const targets = c.all ? els : [els[0]];
      for (const el of targets) {
        if (c.text != null) {
          const t = el.textContent.trim();
          if (t !== c.text) { fails.push({ en: `Expected the text of "${tag}" to be "${c.text}", but got "${t}".`, ja: `「${tag}」の中の文字が「${c.text}」になっていません（いまは「${t}」）。` }); break; }
        }
        if (c.attr) {
          const v = el.getAttribute(c.attr[0]);
          if (v !== c.attr[1]) { fails.push({ en: `Expected "${tag}" to have ${c.attr[0]}="${c.attr[1]}", but got ${v == null ? 'nothing' : '"' + v + '"'}.`, ja: `「${tag}」の ${c.attr[0]} が「${c.attr[1]}」になっていません。` }); break; }
        }
        if (c.style) {
          const v = win.getComputedStyle(el).getPropertyValue(c.style[0]).trim();
          if (v !== c.style[1]) { fails.push({ en: `Expected ${c.style[0]} of "${tag}" to be ${c.style[1]}, but got ${v || 'nothing'}.`, ja: `「${tag}」の${STYLE_JA[c.style[0]] || c.style[0]}が、お題とちがいます。` }); break; }
        }
      }
    }
    return fails;
  }

  window.NekoEngine = { runJS, judgeJS, renderPreview, checkDoc, explainJa, syntaxCheck, buildDoc, esc };
})();
