/* =========================================================
   ねこコード：画面とデータ
   ========================================================= */
(function(){
'use strict';
const { CATS, drawCat, RARITY } = window.NekoCats;
const { ALL: PROBS } = window.NekoProblems;
const E = window.NekoEngine;

/* ---------- 小さな道具 ---------- */
const $ = (s, r=document) => r.querySelector(s);
function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs){
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) { if (k == null || k === false) continue; e.append(k.nodeType ? k : document.createTextNode(String(k))); }
  return e;
}
const pad = n => String(n).padStart(2,'0');
const dkey = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
const today = () => dkey(new Date());
const addDays = (key, n) => { const [y,m,d] = key.split('-').map(Number); return dkey(new Date(y, m-1, d+n)); };
const DOW = ['日','月','火','水','木','金','土'];
const fmtDay = key => { const [y,m,d] = key.split('-').map(Number); const dt = new Date(y,m-1,d); return (m)+'月'+d+'日（'+DOW[dt.getDay()]+'）'; };
const fmtTime = sec => { const m = Math.floor(sec/60); return m < 60 ? m + '分' : Math.floor(m/60) + '時間' + (m%60 ? (m%60) + '分' : ''); };
const pick = a => a[Math.floor(Math.random()*a.length)];

const STAGE = ['穴埋め','見て書く','見ないで書く'];
const REWARD = [1,2,3];
const COURSE = { js:'JavaScript', html:'HTML', css:'CSS' };
const PMAP = {}; PROBS.forEach(p => PMAP[p.id] = p);
const KEY = (pid, si) => pid + ':' + si;
const parseKey = k => { const [pid, si] = k.split(':'); return { p: PMAP[pid], pid, si: +si }; };
const ORDER = []; PROBS.forEach(p => p.stages.forEach((s,i) => ORDER.push(KEY(p.id, i))));

/* ---------- 保存 ---------- */
const SAVE_KEY = 'nekocode-v1';
function fresh(){
  return { v:1, katsuo:0, goal:3,
    cats:{ owned:{ shiro:{ name:'しろねこ', got: today() } }, partner:'shiro' },
    prog:{}, review:{}, days:{}, miss:{}, daily:null, drafts:{},
    free:{ mode:'js', js:"// 自由に書いて「実行」してみよう\nconsole.log('こんにちは');\n", html:"<h1>こんにちは</h1>\n<p>ねこコードで練習中</p>\n", css:"h1 {\n  color: #2f8f9d;\n}\n" },
    ui:{ course:'js' } };
}
let S;
try { S = JSON.parse(localStorage.getItem(SAVE_KEY)) || fresh(); } catch(e) { S = fresh(); }
S = Object.assign(fresh(), S);
function save(quiet){
  if (!quiet) S.updatedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch(e){}
  if (!quiet) cloudPushSoon();
}
/* ---- クラウド同期 ---- */
let cloudUser = null, pushT = null;
const cloudOn = () => !!(window.NekoCloud && window.NekoCloud.enabled);
function cloudPushSoon(){ if (!cloudUser || !cloudOn()) return; clearTimeout(pushT); pushT = setTimeout(cloudPush, 1500); }
async function cloudPush(){
  if (!cloudUser || !cloudOn()) return;
  try { S.syncUid = cloudUser.uid; await window.NekoCloud.save(cloudUser.uid, { data: JSON.stringify(S), updatedAt: S.updatedAt || Date.now() }); }
  catch(e) {}
}
function adopt(remote, uid){
  try {
    const d = JSON.parse(remote.data);
    S = Object.assign(fresh(), d); S.syncUid = uid; S.updatedAt = remote.updatedAt;
    save(true); setKatsuo(S.katsuo); buddyRender();
    if (UI.screen !== 'task') go(UI.tab);
  } catch(e) {}
}
function hasProgress(){ return S.katsuo > 0 || Object.keys(S.prog).length > 0 || Object.keys(S.cats.owned).length > 1; }
async function cloudCheck(){
  if (!cloudUser || !cloudOn()) return;
  const uid = cloudUser.uid;
  let remote = null;
  try { remote = await window.NekoCloud.load(uid); } catch(e) { return; }
  if (!remote) { S.syncUid = uid; save(); await cloudPush(); toast('記録をクラウドに保存しました'); return; }
  if (S.syncUid === uid) {
    if ((remote.updatedAt || 0) > (S.updatedAt || 0)) { adopt(remote, uid); toast('ほかの端末の記録を読み込みました'); }
    else if ((S.updatedAt || 0) > (remote.updatedAt || 0)) cloudPush();
    return;
  }
  if (!hasProgress()) { adopt(remote, uid); toast('クラウドの記録を読み込みました'); return; }
  let r = null; try { r = JSON.parse(remote.data); } catch(e) {}
  openSheet(h('div', { class:'h', text:'どちらの記録を使いますか？' }),
    h('p', { class:'sub', text:'この端末にも、クラウド（ほかの端末）にも記録があります。使わないほうは上書きされます。' }),
    h('div', { class:'mini-stats' },
      h('div', { class:'stat' }, h('b', { text: S.katsuo }), h('span', { text:'この端末のかつおぶし' })),
      h('div', { class:'stat' }, h('b', { text: r ? r.katsuo : '?' }), h('span', { text:'クラウドのかつおぶし' })),
      h('div', { class:'stat' }, h('b', { text: r ? Object.keys(r.prog || {}).length : '?' }), h('span', { text:'クラウドのクリア数' }))),
    h('div', { class:'btns' },
      h('button', { class:'btn', type:'button', onclick: () => { S.syncUid = uid; save(); cloudPush(); closeSheet(); toast('この端末の記録を使います'); } }, 'この端末'),
      h('button', { class:'btn primary', type:'button', onclick: () => { adopt(remote, uid); closeSheet(); toast('クラウドの記録を使います'); } }, 'クラウド')));
}
function cloudInit(){
  if (!window.NekoCloud || !window.NekoCloud.enabled) { if (UI.tab === 'shop' && UI.screen === 'shop') go('shop'); return; }
  window.NekoCloud.onUser((u) => { cloudUser = u; if (u) cloudCheck(); if (UI.screen === 'shop') go('shop'); });
}
if (window.NekoCloud) setTimeout(cloudInit, 0); else window.addEventListener('nekocloud', cloudInit, { once:true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && cloudUser) cloudCheck(); });
function dayRec(k){ k = k || today(); if (!S.days[k]) S.days[k] = { sec:0, items:[] }; return S.days[k]; }
function setKatsuo(n){ S.katsuo = n; $('#katsuoNum').textContent = S.katsuo; }

/* ---------- 下から出るシート・お知らせ ---------- */
function openSheet(...kids){
  const sh = $('#sheet'); sh.innerHTML = ''; kids.flat().forEach(k => k && sh.append(k));
  sh.hidden = false; $('#sheetBack').hidden = false;
}
function closeSheet(){ $('#sheet').hidden = true; $('#sheetBack').hidden = true; }
$('#sheetBack').addEventListener('click', closeSheet);
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(()=> t.hidden = true, 2400); }

/* ---------- ねこ ---------- */
const catDef = id => CATS.find(c => c.id === id) || CATS[0];
const catName = id => (S.cats.owned[id] && S.cats.owned[id].name) || catDef(id).name;
function catCanvas(id, pose, scale){ const c = document.createElement('canvas'); drawCat(c, catDef(id), pose, scale); return c; }
const SAY = {
  walk:['＼いいかんじにゃ／','＼その調子にゃ／','＼ゆっくり行こうにゃ／','＼いっしょに歩くにゃ／'],
  sleep:['＼zzz…／','＼まだねてるにゃ…／','＼1問やったら起きるにゃ／'],
  done:['＼今日もがんばったにゃ／','＼目標たっせいにゃ！／','＼なでてほしいにゃ／'],
  tap:['＼にゃ？／','＼ごろごろ…／','＼もっとなでてにゃ／','＼かつおぶし食べたいにゃ／','＼エラーはこわくないにゃ／','＼休けいもだいじにゃ／','＼< と <= に気をつけるにゃ／'],
  ok:['＼やったにゃ！／','＼天才にゃ／','＼いい色にゃ／'],
  ng:['＼おしいにゃ／','＼もう1回にゃ／','＼ゆっくりでいいにゃ／']
};

/* ---------- 相棒ねこ（どの画面でも上にいる） ---------- */
let buddyT;
function buddyRender(){ const cv = $('#buddyCv'); if (cv) drawCat(cv, catDef(S.cats.partner), 'sit', 2); }
function buddySay(text, mood){
  const b = $('#buddy'), say = $('#buddySay'); if (!b) return;
  say.textContent = text; say.hidden = false;
  b.classList.remove('hop','shake'); void b.offsetWidth; if (mood) b.classList.add(mood);
  clearTimeout(buddyT); buddyT = setTimeout(() => { say.hidden = true; b.classList.remove('hop','shake'); }, 2600);
}
$('#buddy').addEventListener('click', () => buddySay(pick(SAY.tap), 'hop'));
/* ---------- 画面の切りかえ ---------- */
const UI = { tab:'home', screen:'home', month:null, free:null };
let session = null;
let homeTimer = null;
function go(tab){
  leaveTask();
  if (KB.el) { KB.el.hidden = true; document.body.classList.remove('kb-on'); }
  UI.tab = tab; UI.screen = tab;
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  clearInterval(homeTimer);
  const v = $('#view'); v.innerHTML = '';
  ({ home:renderHome, practice:renderPractice, free:renderFree, record:renderRecord, shop:renderShop })[tab](v);
  window.scrollTo(0,0);
}
document.querySelectorAll('#tabbar button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));

/* ---------- 今日の1問 ---------- */
function ensureDaily(){
  const t = today();
  if (S.daily && S.daily.date === t && PMAP[S.daily.key.split(':')[0]]) return S.daily;
  let key = null, type = 'new';
  const rv = Object.entries(S.review);
  const due = rv.filter(([k,r]) => r.status === 'active' && r.nextDue <= t).sort((a,b) => a[1].nextDue.localeCompare(b[1].nextDue));
  if (due.length) { key = due[0][0]; type = 'review'; }
  if (!key) { const chk = rv.filter(([k,r]) => r.status === 'cleared' && r.nextDue <= t).sort((a,b) => a[1].nextDue.localeCompare(b[1].nextDue)); if (chk.length) { key = chk[0][0]; type = 'check'; } }
  if (!key) { key = ORDER.find(k => !(S.prog[k] && S.prog[k].cleared)); type = 'new'; }
  if (!key) { key = pick(ORDER); type = 'again'; }
  S.daily = { date:t, key, type, done:false }; save();
  return S.daily;
}
const DAILY_LABEL = { review:'復習', check:'ひさしぶりの確認', new:'つぎの問題', again:'もう一度' };

/* =========================================================
   ホーム
   ========================================================= */
function renderHome(v){
  const t = today(), rec = dayRec(t);
  const solved = rec.items.filter(i => i.ok).length;
  const goal = S.goal, ratio = Math.min(1, solved / goal);
  const partner = S.cats.partner;

  const card = h('section', { class:'card today' },
    h('div', { class:'spread' },
      h('div', null, h('div', { class:'label', text:'TODAY' }), h('div', { class:'date', text: fmtDay(t) })),
      h('span', { class:'chip y', text: catName(partner) + 'と練習中' })
    )
  );
  const walk = h('div', { class:'walk' },
    h('div', { class:'label', text:'きょう といた問題' }),
    h('div', { class:'spread' },
      h('div', { class:'count' }, String(solved), h('small', { text:'問' }), h('span', { class:'of', text:'/ ' + goal + '問' })),
      h('div', { class:'row' }, solved >= goal ? h('span', { class:'chip y', text:'目標たっせい' }) : h('span', { class:'chip s', text: solved ? '練習中' : 'これから' }))
    )
  );
  const stage = h('div', { class:'stage' });
  const track = h('div', { class:'track' }, h('i', { style:'width:' + (ratio*100) + '%' }));
  const ticks = h('div', { class:'ticks' }, h('span', { text:'0' }), h('span', { text: goal + '問' }));
  const pose = solved === 0 ? 'sleep' : solved >= goal ? 'done' : 'walk';
  const cv = catCanvas(partner, pose === 'sleep' ? 'loaf' : pose === 'done' ? 'minisit' : 'walkA', 3);
  const bubble = h('div', { class:'bubble', text: pick(solved === 0 ? SAY.sleep : solved >= goal ? SAY.done : SAY.walk) });
  stage.append(bubble, cv, track, ticks);
  walk.append(stage, h('p', { class:'sub', style:'text-align:center;margin-top:4px', text: solved >= goal ? '今日がんばった自分とねこをなでなでしよう。' : 'ねこをタップすると、なでられます。' }));
  card.append(walk);

  const stats = h('div', { class:'stats' },
    h('div', { class:'stat' }, h('b', { text: streak() + '日' }), h('span', { text:'れんぞく' })),
    h('div', { class:'stat' }, h('b', { id:'todayTime', text: fmtTime(rec.sec) }), h('span', { text:'今日の勉強' })),
    h('div', { class:'stat' }, h('b', { text: Object.values(S.review).filter(r=>r.status==='active').length + '問' }), h('span', { text:'復習まち' }))
  );
  card.append(stats);
  v.append(card);

  // 歩かせる
  function place(){
    const w = stage.clientWidth - cv.clientWidth;
    const x = Math.max(0, Math.min(w, ratio * w));
    cv.style.left = x + 'px'; bubble.style.left = Math.max(0, Math.min(stage.clientWidth - bubble.offsetWidth, x - 10)) + 'px';
  }
  requestAnimationFrame(place);
  if (pose === 'walk') { let f = 0; homeTimer = setInterval(() => { f ^= 1; drawCat(cv, catDef(partner), f ? 'walkB' : 'walkA', 3); }, 420); }
  cv.addEventListener('click', () => { bubble.textContent = pick(SAY.tap); place(); cv.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)'},{transform:'translateY(0)'}], {duration:300}); });

  // 今日の1問
  const d = ensureDaily(); const k = parseKey(d.key);
  const dc = h('section', { class:'card daily' },
    h('div', { class:'spread' }, h('div', { class:'label', text:'今日の1問' }), h('span', { class: 'chip ' + (d.type === 'new' ? 'm' : 'p'), text: DAILY_LABEL[d.type] })),
    h('div', { class:'ttl', text: k.p.title }),
    h('div', { class:'row' }, h('span', { class:'chip line', text: COURSE[k.p.course] }), h('span', { class:'chip line', text: STAGE[k.si] }), h('span', { class:'chip line', text:'ボーナス かつおぶし +2' })),
    d.done ? h('div', { class:'say', text:'＼今日の1問クリアにゃ／' })
           : h('button', { class:'btn primary wide', type:'button', onclick: () => openTask(k.pid, k.si, d.type === 'review' || d.type === 'check' ? 'review' : 'normal', true) }, 'はじめる')
  );
  v.append(dc);

  // 仲間のねこ
  const owned = Object.keys(S.cats.owned).filter(id => id !== partner).slice(-2);
  if (owned.length) {
    const g = h('div', { class:'ground' });
    owned.forEach((id, i) => {
      const c = catCanvas(id, i ? 'loaf' : 'minisit', 3); c.style.left = (i ? 62 : 14) + '%';
      const s = h('div', { class:'gsay', style:'left:' + (i ? 58 : 8) + '%', text: pick(['＼' + catName(id) + 'だにゃ／','＼がんばれにゃ／','＼のんびりにゃ／']) });
      g.append(s, c);
    });
    v.append(g);
  }
}
function streak(){
  let n = 0, k = today();
  if (!(S.days[k] && S.days[k].items.some(i=>i.ok))) k = addDays(k, -1);
  while (S.days[k] && S.days[k].items.some(i => i.ok)) { n++; k = addDays(k, -1); }
  return n;
}

/* =========================================================
   練習
   ========================================================= */
function stageDone(pid, si){ const r = S.prog[KEY(pid, si)]; return !!(r && r.cleared); }
function renderPractice(v){
  const mode = UI.pmode || 'course';
  const activeN = Object.values(S.review).filter(r => r.status === 'active').length;
  const seg = h('div', { class:'seg', role:'tablist' },
    h('button', { type:'button', class: mode==='course'?'on':'', onclick: () => { UI.pmode='course'; go('practice'); } }, 'コース'),
    h('button', { type:'button', class: mode==='review'?'on':'', onclick: () => { UI.pmode='review'; go('practice'); } }, '復習', activeN ? h('span', { class:'badge', text: activeN }) : null)
  );
  v.append(seg);
  if (mode === 'review') return renderReview(v);

  const course = S.ui.course || 'js';
  const cseg = h('div', { class:'seg' }, Object.keys(COURSE).map(c =>
    h('button', { type:'button', class: c===course?'on':'', onclick: () => { S.ui.course = c; save(); go('practice'); } }, COURSE[c])));
  v.append(cseg);

  const list = PROBS.filter(p => p.course === course);
  let lastUnit = null, box = null;
  list.forEach((p, idx) => {
    if (p.unit !== lastUnit) { lastUnit = p.unit; box = h('div', { class:'unit' }, h('div', { class:'unit-name', text: p.unit })); v.append(box); }
    const done = [0,1,2].map(i => stageDone(p.id, i));
    const next = done.indexOf(false);
    const btn = h('button', { class:'prob', type:'button', onclick: () => openTask(p.id, next === -1 ? 2 : next, 'normal') },
      h('div', { class:'pt' }, h('b', { text: p.title }), h('small', { text: next === -1 ? '3段階クリア' : 'つぎは「' + STAGE[next] + '」' })),
      h('div', { class:'dots', 'aria-label': done.filter(Boolean).length + '/3' }, done.map((d,i) => h('i', { class: d ? 'on' + (i===2?' s3':'') : '' })))
    );
    box.append(btn);
  });
}
function reviewHist(r){
  const first = '1回目：' + (r.firstAnswer ? '答えを見た・' : '') + 'ミス' + r.firstMiss + '回';
  const rest = (r.history || []).map((x, i) => '復習' + (i+1) + '：' + (x.answer ? '答えを見た・' : '') + (x.miss ? 'ミス' + x.miss + '回で成功' : 'ミスなしで成功'));
  return [first].concat(rest).join(' → ');
}
function renderReview(v){
  const all = Object.entries(S.review);
  const act = all.filter(([k,r]) => r.status === 'active').sort((a,b) => a[1].nextDue.localeCompare(b[1].nextDue));
  const done = all.filter(([k,r]) => r.status === 'cleared').sort((a,b) => (b[1].history.slice(-1)[0]||{}).date > (a[1].history.slice(-1)[0]||{}).date ? 1 : -1);
  const why = { answer:'答えを見た', miss:'ミス3回以上', self:'自分で入れた' };
  v.append(h('div', { class:'unit-name', text:'復習する問題' }));
  if (!act.length) v.append(h('div', { class:'card soft empty', text:'いまは復習する問題はないにゃ' }));
  act.forEach(([k,r]) => {
    const x = parseKey(k);
    v.append(h('button', { class:'rv', type:'button', onclick: () => openTask(x.pid, x.si, 'review') },
      h('div', { class:'spread' }, h('b', { style:'font-weight:400', text: x.p.title }), h('span', { class:'chip p', text: why[r.reason] || '復習' })),
      h('div', { class:'row' }, h('span', { class:'chip line', text: COURSE[x.p.course] }), h('span', { class:'chip line', text: STAGE[x.si] }), r.nextDue > today() ? h('span', { class:'chip line', text: r.nextDue.slice(5).replace('-','/') + 'から' }) : null),
      h('div', { class:'hist', text: reviewHist(r) })));
  });
  if (done.length) {
    v.append(h('div', { class:'unit-name', text:'復習でクリアした問題（記録として残しています）' }));
    done.forEach(([k,r]) => {
      const x = parseKey(k);
      v.append(h('button', { class:'rv done', type:'button', onclick: () => openTask(x.pid, x.si, 'review') },
        h('div', { class:'spread' }, h('b', { style:'font-weight:400', text: x.p.title }), h('span', { class:'chip m', text:'クリア' })),
        h('div', { class:'row' }, h('span', { class:'chip line', text: COURSE[x.p.course] }), h('span', { class:'chip line', text: STAGE[x.si] })),
        h('div', { class:'hist', text: reviewHist(r) })));
    });
  }
}

/* =========================================================
   問題の画面
   ========================================================= */
/* ---- 入力をらくにする道具 ---- */
const SYMBOLS = {
  js:   ['{','}','(',')','[',']',';','=',"'",'"','+','-','*','/','%','<','>','!','&','|','.',',',':','?','`','_'],
  html: ['<','>','/','=','"',"'",'!','-','.','#',':',';','{','}','(',')','&'],
  css:  ['{','}',':',';','.','#','-','(',')','"',"'",',','%','/','*','!','>']
};
// ¦ はカーソルの位置
const WORDS = {
  js: ['const ¦','let ¦','function ¦','return ¦','if (¦)','else','else if (¦)','for (¦)','console.log(¦)','.length','.push(¦)','Math.round(¦)','true','false','null','=== ','!== ','>= ','<= ','&& ','|| ','i++','i--','document.body.append(¦)'],
  html: ['<h1>¦</h1>','<h2>¦</h2>','<p>¦</p>','<ul>¦</ul>','<ol>¦</ol>','<li>¦</li>','<a href="¦"></a>','<img src="¦" alt="">','<div>¦</div>','<button>¦</button>','<input type="text" placeholder="¦">','class="¦"','id="¦"','<br>'],
  css: ['color: ¦;','background-color: ¦;','font-size: ¦px;','font-weight: bold;','padding: ¦px;','margin: ¦px;','border: ¦px solid ;','border-radius: ¦px;','width: ¦px;','height: ¦px;','text-align: center;','px','red','blue','green','black','white','gray','pink','yellow']
};
const TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const PAIRS = { '(':')', '[':']', '{':'}', "'":"'", '"':'"', '`':'`' };
const CLOSERS = { ')':1, ']':1, '}':1, "'":1, '"':1, '`':1 };

function putText(ta, text){
  const cut = text.indexOf('¦');
  const s = ta.selectionStart, e = ta.selectionEnd;
  const clean = text.replace('¦', '');
  ta.setRangeText(clean, s, e, 'end');
  if (cut >= 0) { const p = s + cut; ta.setSelectionRange(p, p); }
  ta.dispatchEvent(new Event('input'));
}
/* ( を打ったら ) も、などの自動入力 */
const SMART = { '\u2019':"'", '\u2018':"'", '\u201C':'"', '\u201D':'"', '\uFF07':"'", '\uFF02':'"' };
function typeChar(ta, ch, kind){
  if (SMART[ch]) ch = SMART[ch];
  const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd, next = v[s] || '';
  const pairOK = kind !== 'html' || ch === '"' || ch === "'";
  if (s === e && CLOSERS[ch] && next === ch) { ta.setSelectionRange(s+1, s+1); ta.dispatchEvent(new Event('input')); return true; }
  if (PAIRS[ch] && pairOK) {
    const isQuote = ch === "'" || ch === '"' || ch === '`';
    if (isQuote && s === e && /[\w$]/.test(v[s-1] || '')) return false;  // don't のようなとき
    const sel = v.slice(s, e);
    ta.setRangeText(ch + sel + PAIRS[ch], s, e, 'end');
    ta.setSelectionRange(s + 1, s + 1 + sel.length);
    ta.dispatchEvent(new Event('input'));
    return true;
  }
  return false;
}
function newLine(ta){
  const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  const lineStart = v.lastIndexOf('\n', s - 1) + 1;
  const indent = (v.slice(lineStart, s).match(/^[ \t]*/) || [''])[0];
  const prev = v[s-1], next = v[e];
  if ((prev === '{' && next === '}') || (prev === '(' && next === ')') || (prev === '[' && next === ']')) {
    ta.setRangeText('\n' + indent + '  ' + '\n' + indent, s, e, 'end');
    const p = s + 1 + indent.length + 2; ta.setSelectionRange(p, p);
  } else {
    const extra = (prev === '{' || prev === '(' || prev === '[') ? '  ' : '';
    ta.setRangeText('\n' + indent + extra, s, e, 'end');
  }
  ta.dispatchEvent(new Event('input'));
}
function backDelete(ta){
  const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  if (s === e && s > 0 && PAIRS[v[s-1]] && v[s] === PAIRS[v[s-1]]) {
    ta.setRangeText('', s-1, s+1, 'end'); ta.dispatchEvent(new Event('input')); return true;
  }
  return false;
}
/* カーソルを動かす */
function moveCaret(ta, dir){
  const v = ta.value; let p = ta.selectionEnd;
  if (dir === 'left') p = Math.max(0, (ta.selectionStart !== ta.selectionEnd ? ta.selectionStart : p - 1));
  else if (dir === 'right') p = Math.min(v.length, p + 1);
  else {
    const lineStart = v.lastIndexOf('\n', p - 1) + 1, col = p - lineStart;
    if (dir === 'up') {
      if (lineStart === 0) p = 0;
      else { const prevStart = v.lastIndexOf('\n', lineStart - 2) + 1; p = Math.min(prevStart + col, lineStart - 1); }
    } else {
      const nl = v.indexOf('\n', p);
      if (nl === -1) p = v.length;
      else { const nextEnd = v.indexOf('\n', nl + 1); p = Math.min(nl + 1 + col, nextEnd === -1 ? v.length : nextEnd); }
    }
  }
  ta.setSelectionRange(p, p);
  // カーソルが見えるように
  const lines = v.slice(0, p).split('\n').length - 1, lh = parseFloat(getComputedStyle(ta).lineHeight) || 27;
  const y = lines * lh;
  if (y < ta.scrollTop) ta.scrollTop = y; else if (y + lh * 2 > ta.scrollTop + ta.clientHeight) ta.scrollTop = y - ta.clientHeight + lh * 2;
  ta.dispatchEvent(new Event('scroll'));
}
/* タップ（指が動いたらスクロールあつかいで入力しない） */
function tapButton(label, onTap, cls, aria){
  const b = h('button', { type:'button', class: cls || '', 'aria-label': aria || label, text: label, tabindex:'-1' });
  let sx = 0, sy = 0, moved = false, timer = null, rep = null;
  b.addEventListener('mousedown', (ev) => ev.preventDefault());
  b.addEventListener('pointerdown', (ev) => { sx = ev.clientX; sy = ev.clientY; moved = false;
    if (b.dataset.repeat) { timer = setTimeout(() => { rep = setInterval(onTap, 70); }, 380); } });
  b.addEventListener('pointermove', (ev) => { if (Math.abs(ev.clientX - sx) > 8 || Math.abs(ev.clientY - sy) > 8) { moved = true; clearTimeout(timer); clearInterval(rep); rep = null; } });
  const stop = () => { clearTimeout(timer); clearInterval(rep); rep = null; };
  b.addEventListener('pointercancel', () => { moved = true; stop(); });
  b.addEventListener('pointerup', () => { const repeated = !!rep; stop(); if (!moved && !repeated) onTap(); });
  b.addEventListener('pointerleave', stop);
  b.addEventListener('click', (ev) => { if (ev.detail === 0) onTap(); });
  return b;
}

/* ---- キーボードのすぐ上にくっつく道具（スマホだけ） ---- */
const QUICK = {
  js:   ['(',')','{','}','[',']',';','=',"'",'.','+','<','>','!',','],
  html: ['<','>','/','=','"',"'",'!','-'],
  css:  ['{','}',':',';','.','#','-','(',')']
};
const KB = { ta:null, kind:'js', open:false, mode:'sym', hideT:null, el:null };
function kbEnsure(){
  if (KB.el) return KB.el;
  const el = h('div', { class:'kbar', id:'kbar', hidden:true, role:'toolbar', 'aria-label':'入力の道具' });
  el.addEventListener('mousedown', (ev) => { if (ev.target.closest('button')) ev.preventDefault(); });
  document.body.append(el);
  KB.el = el;
  if (window.visualViewport) { visualViewport.addEventListener('resize', kbPlace); visualViewport.addEventListener('scroll', kbPlace); }
  window.addEventListener('scroll', kbPlace, { passive:true });
  return el;
}
function kbAct(fn){
  return () => {
    const ta = KB.ta; if (!ta) return;
    const s = ta._sel || [ta.selectionStart, ta.selectionEnd];
    if (document.activeElement !== ta) { ta.focus({ preventScroll:true }); ta.setSelectionRange(s[0], s[1]); }
    fn(ta);
    ta._sel = [ta.selectionStart, ta.selectionEnd];
    keepCaretVisible(ta);
  };
}
function kbBuild(){
  const el = kbEnsure(), kind = KB.kind;
  el.innerHTML = '';
  const row = h('div', { class:'kb-row' });
  ['left','right','up','down'].forEach(d => { const b = tapButton({left:'←',up:'↑',down:'↓',right:'→'}[d], kbAct(ta => moveCaret(ta, d)), 'arrow', {left:'左へ',up:'上の行へ',down:'下の行へ',right:'右へ'}[d]); b.dataset.repeat = '1'; row.append(b); });
  row.append(tapButton('⇥', kbAct(ta => putText(ta, '  ')), 'arrow', '字下げ'));
  QUICK[kind].forEach(k => row.append(tapButton(k, kbAct(ta => { if (!typeChar(ta, k, kind)) putText(ta, k); }))));
  const more = tapButton(KB.open ? '▼' : '▲', () => { KB.open = !KB.open; kbBuild(); kbPlace(); }, 'more', KB.open ? 'たたむ' : 'もっと見る');
  const wrap = h('div', { class:'kb-top' }, h('div', { class:'kb-scroll' }, row), more);
  el.append(wrap);
  if (KB.suggest && KB.suggest.length) setTimeout(() => kbSuggest(KB.suggest), 0);
  if (KB.open) {
    const tabs = h('div', { class:'kb-tabs' },
      tapButton('記号', () => { KB.mode = 'sym'; kbBuild(); kbPlace(); }, KB.mode === 'sym' ? 'on' : ''),
      tapButton('ことば', () => { KB.mode = 'word'; kbBuild(); kbPlace(); }, KB.mode === 'word' ? 'on' : ''));
    const grid = h('div', { class:'kb-grid ' + KB.mode });
    if (KB.mode === 'sym') SYMBOLS[kind].forEach(k => grid.append(tapButton(k, kbAct(ta => { if (!typeChar(ta, k, kind)) putText(ta, k); }))));
    else WORDS[kind].forEach(w => grid.append(tapButton(w.replace('¦',''), kbAct(ta => putText(ta, w)), 'word')));
    el.append(tabs, grid);
  }
}
function kbPlace(){
  const el = KB.el; if (!el || el.hidden) return;
  const vv = window.visualViewport;
  const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  el.style.top = Math.max(0, bottom - el.offsetHeight) + 'px';
}
function kbShow(ta, kind){
  if (!TOUCH) return;
  clearTimeout(KB.hideT);
  const changed = KB.ta !== ta || KB.kind !== kind;
  KB.ta = ta; KB.kind = kind;
  const el = kbEnsure();
  if (changed || el.hidden) kbBuild();
  el.hidden = false; document.body.classList.add('kb-on');
  kbPlace(); setTimeout(kbPlace, 120); setTimeout(kbPlace, 400);
}
function kbHideSoon(){
  clearTimeout(KB.hideT);
  KB.hideT = setTimeout(() => { if (KB.el && !(document.activeElement && document.activeElement.classList.contains('code'))) { KB.el.hidden = true; document.body.classList.remove('kb-on'); } }, 250);
}
/* 打っているところがキーボードや道具に隠れないように */
function keepCaretVisible(ta){
  const v = ta.value, p = ta.selectionEnd;
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 27;
  const line = v.slice(0, p).split('\n').length - 1;
  const r = ta.getBoundingClientRect();
  const caretTop = r.top + 12 + line * lh - ta.scrollTop;
  const vv = window.visualViewport;
  const viewTop = vv ? vv.offsetTop : 0;
  const barTop = (KB.el && !KB.el.hidden) ? KB.el.getBoundingClientRect().top : (vv ? vv.offsetTop + vv.height : window.innerHeight);
  if (caretTop + lh + 8 > barTop) window.scrollBy(0, caretTop + lh + 8 - barTop);
  else if (caretTop < viewTop + 70) window.scrollBy(0, caretTop - viewTop - 70);
}
/* 書いた行の数に合わせて入力欄をのばす */
function autoGrow(ta){
  const min = parseFloat(ta.dataset.min || '0') || 0;
  ta.style.height = 'auto';
  ta.style.height = Math.max(min, ta.scrollHeight + 4) + 'px';
}


/* ---- 予測変換（VS Code の候補みたいなもの） ---- */
const AC_WORDS = {
  js: ['const','let','var','function','return','if','else','for','while','do','break','continue','switch','case','default','true','false','null','undefined','new','typeof','class','this','try','catch','finally','of','in',
       'console','document','Math','window','JSON','Date','Number','String','Array','Object','parseInt','parseFloat','isNaN','setInterval','setTimeout','clearInterval','clearTimeout','alert','confirm','prompt'],
  member: ['log','error','warn','length','push','pop','shift','unshift','slice','splice','indexOf','includes','join','split','map','filter','forEach','reduce','find','sort','reverse','toFixed','toString','toUpperCase','toLowerCase','trim','replace',
       'round','floor','ceil','random','max','min','abs','sqrt','pow','now','getTime','getFullYear','getMonth','getDate','getHours','getMinutes','getSeconds','keys','values','stringify','parse',
       'getElementById','querySelector','querySelectorAll','createElement','appendChild','append','remove','innerText','textContent','innerHTML','setAttribute','getAttribute','addEventListener','removeEventListener','classList','add','toggle','contains','style','value','body','focus','click'],
  html: ['h1','h2','h3','h4','p','ul','ol','li','a','img','div','span','button','input','br','hr','table','tr','th','td','form','label','section','header','footer','main','nav','strong','em','script','link','style'],
  attr: ['href','src','alt','class','id','type','placeholder','width','height','value','name','style','title','target','rel'],
  css: ['color','background-color','background','font-size','font-weight','font-family','padding','padding-top','padding-left','margin','margin-top','margin-left','border','border-radius','border-color','width','height','max-width','text-align','display','flex','justify-content','align-items','gap','line-height','letter-spacing','opacity','position','top','left','right','bottom','box-shadow','cursor','transition','transform'],
  cssval: ['red','blue','green','black','white','gray','pink','yellow','orange','purple','transparent','none','solid','dashed','dotted','bold','normal','center','left','right','block','inline-block','flex','grid','auto','absolute','relative','fixed','pointer','px','em','rem','%']
};
function acSource(ta, kind){
  const v = ta.value, p = ta.selectionStart;
  if (p !== ta.selectionEnd) return null;
  const before = v.slice(0, p);
  const lineStart = before.lastIndexOf('\n') + 1, line = before.slice(lineStart);
  const wordRe = kind === 'css' ? /[A-Za-z-][\w-]*$/ : /[A-Za-z_$][\w$]*$/;
  const m = line.match(wordRe);
  if (!m) return null;
  const prefix = m[0], start = p - prefix.length;
  const prevCh = v[start - 1] || '';
  // 文字列やコメントの中では出さない
  const head = line.slice(0, line.length - prefix.length);
  if (kind === 'js' && (/\/\//.test(head) || ((head.match(/'/g) || []).length % 2) || ((head.match(/"/g) || []).length % 2) || ((head.match(/`/g) || []).length % 2))) return null;
  let pool = [];
  if (kind === 'js') {
    const names = new Set();
    let r; const re1 = /\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g; while ((r = re1.exec(v))) names.add(r[1]);
    const re2 = /function\s*[\w$]*\s*\(([^)]*)\)/g; while ((r = re2.exec(v))) r[1].split(',').forEach(x => { x = x.trim(); if (/^[A-Za-z_$][\w$]*$/.test(x)) names.add(x); });
    if (prevCh === '.') {
      const keys = new Set(); const re3 = /([A-Za-z_$][\w$]*)\s*:/g; while ((r = re3.exec(v))) keys.add(r[1]);
      pool = [...keys].map(w => ({ w, k:'prop' })).concat(AC_WORDS.member.map(w => ({ w, k:'member' })));
    } else {
      pool = [...names].map(w => ({ w, k:'mine' })).concat(AC_WORDS.js.map(w => ({ w, k:'word' })));
    }
  } else if (kind === 'html') {
    const inTag = /<[^>]*$/.test(line);
    if (!inTag) return null;
    pool = (/<\/?[A-Za-z0-9]*$/.test(line) ? AC_WORDS.html : AC_WORDS.attr).map(w => ({ w, k:'word' }));
  } else {
    const inValue = /:[^;{}]*$/.test(line);
    pool = (inValue ? AC_WORDS.cssval : AC_WORDS.css).map(w => ({ w, k:'word' }));
  }
  const seen = new Set(); const lower = prefix.toLowerCase();
  const list = pool.filter(o => { if (seen.has(o.w)) return false; seen.add(o.w); return o.w.toLowerCase().startsWith(lower) && o.w !== prefix; });
  const rank = { mine:0, prop:0, word:1, member:1 };
  list.sort((a, b) => (rank[a.k] - rank[b.k]) || a.w.localeCompare(b.w));
  return list.length ? { prefix, start, list: list.slice(0, 8) } : null;
}
const AC = { ta:null, data:null, sel:0, box:null };
function acAccept(ta, word){
  const d = AC.data; if (!d) return;
  const p = ta.selectionStart;
  ta.setRangeText(word, d.start, p, 'end');
  acClose();
  ta.dispatchEvent(new Event('input'));
  ta._sel = [ta.selectionStart, ta.selectionEnd];
}
function acClose(){ AC.data = null; if (AC.box) AC.box.hidden = true; kbSuggest(null); }
function caretXY(ta){
  const v = ta.value.slice(0, ta.selectionStart);
  const lines = v.split('\n'), line = lines.length - 1, col = lines[line];
  const cs = getComputedStyle(ta);
  const c = caretXY.c || (caretXY.c = document.createElement('canvas').getContext('2d'));
  c.font = cs.fontSize + ' ' + cs.fontFamily;
  const lh = parseFloat(cs.lineHeight) || 27;
  return { x: parseFloat(cs.paddingLeft) + c.measureText(col).width - ta.scrollLeft, y: parseFloat(cs.paddingTop) + (line + 1) * lh - ta.scrollTop };
}
function acUpdate(ta, kind){
  const d = acSource(ta, kind);
  AC.ta = ta; AC.data = d; AC.sel = 0;
  if (!d) { acClose(); return; }
  if (TOUCH) { kbSuggest(d.list.map(o => o.w)); return; }
  const wrap = ta.closest('.hl-wrap'); if (!wrap) return;
  if (!AC.box || AC.box.parentNode !== wrap) { if (AC.box) AC.box.remove(); AC.box = h('div', { class:'ac', role:'listbox' }); wrap.append(AC.box); }
  acPaint();
  const xy = caretXY(ta);
  AC.box.style.left = Math.min(xy.x, wrap.clientWidth - 200) + 'px';
  AC.box.style.top = (xy.y + 2) + 'px';
  AC.box.hidden = false;
}
function acPaint(){
  const d = AC.data, box = AC.box; if (!d || !box) return;
  box.innerHTML = '';
  d.list.forEach((o, i) => {
    const it = h('div', { class:'ac-it' + (i === AC.sel ? ' on' : ''), role:'option' },
      h('span', { class:'ac-ico ' + o.k, text: o.k === 'mine' ? '箱' : o.k === 'prop' || o.k === 'member' ? '.' : '語' }),
      h('b', { text: o.w.slice(0, d.prefix.length) }), o.w.slice(d.prefix.length));
    it.addEventListener('mousedown', (e) => { e.preventDefault(); acAccept(AC.ta, o.w); });
    box.append(it);
  });
}
function acKeys(ta, e){
  if (!AC.data || AC.ta !== ta || TOUCH || !AC.box || AC.box.hidden) return false;
  const n = AC.data.list.length;
  if (e.key === 'ArrowDown') { AC.sel = (AC.sel + 1) % n; acPaint(); return true; }
  if (e.key === 'ArrowUp') { AC.sel = (AC.sel - 1 + n) % n; acPaint(); return true; }
  if (e.key === 'Enter' || e.key === 'Tab') { acAccept(ta, AC.data.list[AC.sel].w); return true; }
  if (e.key === 'Escape') { acClose(); return true; }
  return false;
}
function kbSuggest(words){
  KB.suggest = words;
  const el = KB.el; if (!el) return;
  let strip = el.querySelector('.kb-sug');
  if (!words || !words.length) { if (strip) strip.hidden = true; kbPlace(); return; }
  if (!strip) { strip = h('div', { class:'kb-sug' }); el.prepend(strip); }
  strip.hidden = false; strip.innerHTML = '';
  words.forEach(w => strip.append(tapButton(w, () => { const ta = KB.ta; if (!ta) return; if (document.activeElement !== ta) { const s = ta._sel || [ta.selectionStart, ta.selectionEnd]; ta.focus({ preventScroll:true }); ta.setSelectionRange(s[0], s[1]); } acAccept(ta, w); keepCaretVisible(ta); }, 'sug')));
  kbPlace();
}

function keyBar(ta, kind){
  // ふつうのキーボードで打ったときも、カッコを自動で閉じる
  ta.addEventListener('beforeinput', (e) => {
    if (e.inputType === 'insertText' && e.data && e.data.length === 1) { if (typeChar(ta, e.data, kind)) e.preventDefault(); else if (SMART[e.data]) { e.preventDefault(); putText(ta, SMART[e.data]); } }
    else if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') {
      e.preventDefault();
      // 候補が出ているときは、改行のかわりに1番上の候補を入れる
      if (AC.data && AC.ta === ta && AC.data.list.length) acAccept(ta, AC.data.list[AC.sel].w);
      else newLine(ta);
      keepCaretVisible(ta);
    }
    else if (e.inputType === 'deleteContentBackward') { if (backDelete(ta)) e.preventDefault(); }
  });
  const remember = () => { ta._sel = [ta.selectionStart, ta.selectionEnd]; };
  ['keyup','click','select','input'].forEach(ev => ta.addEventListener(ev, remember));
  ta.addEventListener('focus', () => kbShow(ta, kind));
  ta.addEventListener('blur', () => { remember(); kbHideSoon(); });
  // 自動でのびる
  requestAnimationFrame(() => { ta.dataset.min = String(ta.offsetHeight || 160); autoGrow(ta); });
  ta.addEventListener('input', () => { autoGrow(ta); if (TOUCH && document.activeElement === ta) keepCaretVisible(ta); acUpdate(ta, kind); });
  ta.addEventListener('keydown', (e) => { if (acKeys(ta, e)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  ta.addEventListener('click', () => acClose());
  ta.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== ta && !TOUCH) acClose(); }, 150));
  return null;
}
function editorKeys(ta, run){
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
}
const LANG = { js:'javascript', html:'markup', css:'css' };
function hlText(code, kind){
  const P = window.Prism, grammar = P && P.languages[LANG[kind] || 'javascript'];
  if (!grammar) return E.esc(code);
  try {
    const consts = new Set();
    if (kind === 'js') { const re = /\bconst\s+([A-Za-z_$][\w$]*)/g; let m; while ((m = re.exec(code))) consts.add(m[1]); }
    const ctx = { depth:0, afterConst:false, afterDot:false, js: kind === 'js', css: kind === 'css', consts };
    return renderTokens(P.tokenize(code, grammar), ctx);
  } catch(e) { return E.esc(code); }
}
/* VS Code のように：const のあとの名前・. のあとの名前に色、カッコは重なるたびに 黄→ピンク→青 */
const OPEN = { '(':1, '[':1, '{':1 }, CLOSE = { ')':1, ']':1, '}':1 };
function cssValues(s){
  return s.replace(/(#[0-9a-fA-F]{3,8}\b)|(-?\d*\.?\d+(?:px|%|em|rem|vh|vw|vmin|vmax|s|ms|deg|fr)?)|([A-Za-z][\w-]*)|([^#\dA-Za-z-]+|[\s\S])/g, (all, hex, num, word, other) => {
    if (hex) return '<span class="token css cval">' + E.esc(hex) + '</span>';
    if (num) return '<span class="token css cnum">' + E.esc(num) + '</span>';
    if (word) return '<span class="token css cval">' + E.esc(word) + '</span>';
    return E.esc(all);
  });
}
const BUILTIN_BLUE = new Set(['console','document','Math','window','JSON','Date','Number','String','Array','Object']);
function plainText(s, ctx){
  if (ctx.css) return cssValues(s);
  if (!ctx.js) return E.esc(s);
  let out = '';
  s.replace(/([A-Za-z_$][\w$]*)|(\s+)|([^A-Za-z_$\s]+)/g, (all, id, sp, other) => {
    if (sp) { out += sp; return; }
    if (id) {
      let cls = null;
      if (ctx.afterDot) cls = 'prop';
      else if (ctx.afterConst || ctx.consts.has(id) || BUILTIN_BLUE.has(id)) cls = 'const-name';
      out += cls ? '<span class="token ' + cls + '">' + E.esc(id) + '</span>' : E.esc(id);
      ctx.afterConst = false; ctx.afterDot = false; return;
    }
    out += E.esc(other); ctx.afterConst = false; ctx.afterDot = false;
  });
  return out;
}
function renderTokens(list, ctx){
  let out = '';
  for (const tk of list) {
    if (typeof tk === 'string') { out += plainText(tk, ctx); continue; }
    const content = tk.content;
    let cls = 'token ' + tk.type;
    if (tk.alias) cls += ' ' + (Array.isArray(tk.alias) ? tk.alias.join(' ') : tk.alias);
    if (ctx.css) cls += ' css';
    if (tk.type === 'punctuation' && typeof content === 'string' && (OPEN[content] || CLOSE[content])) {
      if (CLOSE[content]) ctx.depth = Math.max(0, ctx.depth - 1);
      cls += ' bp' + (ctx.depth % 3 + 1);
      if (OPEN[content]) ctx.depth++;
      ctx.afterDot = false;
      out += '<span class="' + cls + '">' + E.esc(content) + '</span>';
      continue;
    }
    if (ctx.js) {
      if (tk.type === 'keyword') ctx.afterConst = (content === 'const');
      else if (!(typeof content === 'string' && !content.trim())) ctx.afterConst = false;
      ctx.afterDot = (tk.type === 'punctuation' && content === '.');
    }
    const inner = typeof content === 'string' ? E.esc(content)
                : Array.isArray(content) ? renderTokens(content, ctx)
                : renderTokens([content], ctx);
    out += '<span class="' + cls + '">' + inner + '</span>';
  }
  return out;
}
function hlPre(code, kind, cls){ return h('pre', { class: (cls || 'code') + ' hlc', html: hlText(code, kind) }); }
function guides(html){
  return html.split('\n').map(l => l.replace(/^( +)/, (sp) => {
    let o = ''; for (let i = 0; i < sp.length; i += 2) o += '<span class="ig">' + sp.slice(i, i+2) + '</span>'; return o;
  })).join('\n');
}
function wrapHL(ta, kind){
  const pre = h('pre', { class:'hl-under', 'aria-hidden':'true' });
  const gut = h('div', { class:'gutter', 'aria-hidden':'true' });
  const wrap = h('div', { class:'hl-wrap' }, gut, pre, ta);
  ta.classList.add('hl-ta');
  let mark = 0, lastN = 0;
  const nums = () => {
    const n = ta.value.split('\n').length;
    if (n === lastN && !gut.dataset.dirty) return; lastN = n; gut.dataset.dirty = '';
    let o = ''; for (let i = 1; i <= n; i++) o += '<span' + (i === mark ? ' class="bad"' : '') + '>' + i + '</span>';
    gut.innerHTML = o; gut.scrollTop = ta.scrollTop;
  };
  const paint = () => { let v = ta.value; if (v.endsWith('\n') || v === '') v += ' '; pre.innerHTML = guides(hlText(v, kind)); pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; nums(); };
  ta.addEventListener('input', () => { if (mark) { mark = 0; gut.dataset.dirty = '1'; } paint(); });
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; });
  if (window.ResizeObserver) new ResizeObserver(() => { pre.style.height = ta.offsetHeight + 'px'; gut.style.height = ta.offsetHeight + 'px'; }).observe(ta);
  ta.markLine = (n) => { mark = n || 0; gut.dataset.dirty = '1'; nums(); };
  paint();
  return wrap;
}
function codeArea(value, ph){
  return h('textarea', { class:'code', spellcheck:'false', autocapitalize:'off', autocomplete:'off', autocorrect:'off', placeholder: ph || '', html: null }, value || '');
}

function openTask(pid, si, mode, isDaily){
  leaveTask();
  const p = PMAP[pid];
  session = { pid, si, mode, daily: !!isDaily, miss:0, answer:false, last:null, hint:0, solved:false };
  UI.screen = 'task';
  clearInterval(homeTimer);
  const v = $('#view'); v.innerHTML = '';
  renderTask(v);
  window.scrollTo(0,0);
}
function leaveTask(){
  if (session && !session.solved && session.miss > 0) {
    const p = PMAP[session.pid];
    dayRec().items.push({ key: KEY(session.pid, session.si), miss: session.miss, answer: session.answer, ok:false, mode: session.mode, t: Date.now() });
    save();
  }
  session = null;
}
function renderTask(v){
  const s = session, p = PMAP[s.pid], st = p.stages[s.si], key = KEY(s.pid, s.si);
  const kind = p.course;
  const top = h('div', { class:'taskbar' },
    h('button', { class:'back', type:'button', 'aria-label':'もどる', onclick: () => go(UI.tab === 'home' ? 'home' : UI.tab) }),
    h('div', { class:'tt' }, h('div', { class:'label', text: COURSE[kind] + ' ・ ' + p.unit }), h('b', { text: p.title })),
    s.mode === 'review' ? h('span', { class:'chip p', text:'復習' }) : s.daily ? h('span', { class:'chip y', text:'今日の1問' }) : null
  );
  const stages = h('div', { class:'stages' }, [0,1,2].map(i => {
    const unlocked = i === 0 || stageDone(s.pid, i-1) || stageDone(s.pid, i) || s.mode === 'review';
    return h('button', { type:'button', class: (i === s.si ? 'on ' : '') + (stageDone(s.pid, i) ? 'clear' : ''), disabled: !unlocked || null,
      onclick: () => { if (i !== s.si) openTask(s.pid, i, s.mode === 'review' ? 'normal' : s.mode, false); } }, STAGE[i]);
  }));
  v.append(top, stages);

  const card = h('section', { class:'card', style:'display:grid;gap:10px' },
    h('div', { class:'label', text:'お題 ・ ' + STAGE[s.si] }),
    h('p', { class:'task-text', text: st.task }));
  if (st.kind !== 'blind') card.append(h('p', { class:'point', text: p.point }));
  if (st.kind === 'look') card.append(h('div', { class:'kata' }, h('div', { class:'label', text:'見本の型' }), hlPre(p.kata, kind)));
  if (kind === 'css') card.append(h('details', { class:'fixed' }, h('summary', { text:'この HTML に CSS を当てます（タップで見る）' }), hlPre(st.html, 'html')));
  v.append(card);

  // 入力
  const draft = S.drafts[key];
  const ta = codeArea(draft != null ? draft : st.starter, kind === 'js' ? '// ここに書いてみよう' : kind === 'html' ? '<!-- ここに HTML を書こう -->' : '/* ここに CSS を書こう */');
  ta.addEventListener('input', () => { S.drafts[key] = ta.value; saveSoon(); });
  const fname = kind === 'js' ? 'main.js' : kind === 'html' ? 'index.html' : 'style.css';
  const ed = h('div', { class:'editor' }, h('div', { class:'ed-head' }, h('span', { text: fname }), h('span', { text: st.kind === 'fill' ? '？を埋めてね' : '' })), keyBar(ta, kind), wrapHL(ta, kind));
  editorKeys(ta, () => run());
  v.append(ed);

  const misses = h('div', { class:'misses' });
  const runBtn = h('button', { class:'btn primary', type:'button', onclick: () => run() }, '▶ 実行');
  const hintBtn = h('button', { class:'btn', type:'button', onclick: () => { if (s.hint < 3) { s.hint++; drawHints(); } } }, 'ヒント');
  const resetBtn = h('button', { class:'btn', type:'button', onclick: () => {
    openSheet(h('div', { class:'h', text:'最初の状態に戻しますか？' }), h('p', { class:'sub', text:'いま書いているコードは消えます。' }),
      h('div', { class:'btns' }, h('button', { class:'btn', type:'button', onclick: closeSheet }, 'やめる'),
        h('button', { class:'btn primary', type:'button', onclick: () => { ta.value = st.starter; ta.dispatchEvent(new Event('input')); S.drafts[key] = st.starter; save(); closeSheet(); } }, '戻す')));
  } }, '戻す');
  v.append(h('div', { class:'actions' }, runBtn, hintBtn, resetBtn), misses);

  const outWrap = h('div', { style:'display:grid;gap:10px' });
  const hintsBox = h('div', { class:'hints' });
  v.append(outWrap, hintsBox);
  updateMisses();

  function updateMisses(){
    misses.innerHTML = '';
    hintBtn.textContent = 'ヒント ' + s.hint + '/3';
    if (s.miss) misses.append('ミス ' + s.miss + '回');
    if (s.miss >= 5 && !s.solved) {
      misses.append(' ・ ', h('button', { class:'btn small pink', type:'button', onclick: showAnswer }, '答えを見る'));
    }
  }
  function showAnswer(){
    openSheet(h('div', { class:'h', text:'答えを見ますか？' }),
      h('p', { class:'sub', text:'見た問題は「復習」に入ります。この段階のかつおぶしはもらえません。' }),
      h('div', { class:'btns' }, h('button', { class:'btn', type:'button', onclick: closeSheet }, 'まだがんばる'),
        h('button', { class:'btn primary', type:'button', onclick: () => {
          s.answer = true;
          openSheet(h('div', { class:'h', text:'答え' }), hlPre(st.answer, kind),
            h('p', { class:'sub', text:'見たら閉じて、自分の手で打ってみよう。コピーはしないのがおすすめ。' }),
            h('button', { class:'btn wide', type:'button', onclick: closeSheet }, '閉じる'));
        } }, '見る')));
  }
  function drawHints(){
    hintsBox.innerHTML = '';
    if (s.hint >= 1) {
      let txt = 'まず「実行」してみよう。結果を見てから考えよう。';
      const L = s.last;
      if (L) {
        if (L.error) txt = (L.error.line ? L.error.line + '行目のまわりを見てみよう。' : '') + L.error.ja;
        else if (L.kind === 'output') txt = (L.line+1) + '行目がちがいます。お題は「' + L.want + '」、いまは「' + L.have + '」。';
        else if (L.kind === 'must') txt = L.ja;
        else if (L.kind === 'checks') txt = L.fails[0].ja;
      }
      hintsBox.append(h('div', { class:'hint' }, h('div', { class:'hl', text:'ヒント1 ・ どこがちがう？' }), h('p', { text: txt })));
    }
    if (s.hint >= 2) hintsBox.append(h('div', { class:'hint' }, h('div', { class:'hl', text:'ヒント2 ・ 考える手順' }), hlPre(p.memo, kind, 'mini')));
    if (s.hint >= 3) hintsBox.append(h('div', { class:'hint' }, h('div', { class:'hl', text:'ヒント3 ・ 小さい実験コード（自由で動かせる）' }), hlPre(p.exp, kind, 'mini'),
      h('button', { class:'btn small', type:'button', style:'margin-top:6px', onclick: () => { tryFree(kind, p.exp); } }, '自由で動かす')));
    updateMisses();
  }

  async function run(){
    runBtn.disabled = true;
    outWrap.innerHTML = '';
    let result;
    if (kind === 'js') {
      const out = h('div', { class:'out' }, h('div', { class:'lab', text:'結果（コンソール）' }));
      const lines = h('div'); out.append(lines); outWrap.append(out);
      const paint = (arr) => { lines.innerHTML = ''; if (!arr.length) lines.append(h('div', { class:'none', text:'（何も表示されませんでした）' })); arr.forEach((x,i) => lines.append(h('div', { class:'ln', 'data-i': i, text: x === '' ? ' ' : x }))); };
      paint([]);
      const res = await E.runJS(ta.value, paint);
      paint(res.lines);
      if (res.error) out.append(errBox(res.error));
      if (ta.markLine) ta.markLine(res.error && res.error.line);
      if (res.note) out.append(h('div', { class:'none', style:'font-family:var(--f-ui);font-size:13px', text: res.note }));
      const j = E.judgeJS(st, ta.value, res);
      result = Object.assign({}, j, { error: res.error });
      if (j.kind === 'output') { const ln = lines.querySelector('[data-i="' + j.line + '"]'); if (ln) ln.classList.add('bad'); }
    } else {
      const frame = h('iframe', { class:'preview', title:'プレビュー', sandbox:'allow-same-origin' });
      outWrap.append(h('div', { class:'label', text:'プレビュー' }), frame);
      const html = kind === 'html' ? ta.value : st.html;
      const css = kind === 'css' ? ta.value : '';
      await E.renderPreview(frame, html, css);
      const fails = E.checkDoc(frame, st.checks);
      result = fails.length ? { ok:false, kind:'checks', fails } : { ok:true };
      if (fails.length) {
        const box = h('div', { class:'out' }, h('div', { class:'lab', text:'チェック結果' }));
        fails.slice(0,3).forEach(f => box.append(checkBox(f)));
        outWrap.append(box);
      }
    }
    s.last = result;
    runBtn.disabled = false;
    if (result.ok) solved(); else failed(result);
  }
  function errBox(err){
    const ja = h('div', { class:'ja', text: err.ja, hidden:true });
    const btn = h('button', { type:'button', onclick: () => { ja.hidden = !ja.hidden; btn.textContent = ja.hidden ? '日本語にする' : '英語だけにする'; } }, '日本語にする');
    return h('div', { class:'err' },
      h('div', { class:'en', text: (err.name === 'Timeout' ? '' : 'Uncaught ') + err.name + ': ' + err.msg }),
      err.line ? h('div', { class:'where', text: '（' + err.line + '行目）' }) : null, ja, btn);
  }
  function checkBox(f){
    const ja = h('div', { class:'ja', text: f.ja, hidden:true });
    const btn = h('button', { type:'button', onclick: () => { ja.hidden = !ja.hidden; btn.textContent = ja.hidden ? '日本語にする' : '英語だけにする'; } }, '日本語にする');
    return h('div', { class:'err' }, h('div', { class:'en', text: '✗ ' + f.en }), ja, btn);
  }
  function failed(r){
    s.miss++;
    const type = r.error ? (r.error.name + ': ' + r.error.msg.replace(/'[^']*'/g, "'…'").replace(/^\S+ is not defined/, '… is not defined').replace(/^\S+ is not a function/, '… is not a function'))
               : r.kind === 'output' ? '表示がお題とちがう' : r.kind === 'must' ? '使う書き方がちがう' : 'HTML/CSS のチェック';
    S.miss[type] = (S.miss[type] || 0) + 1; save();
    buddySay(r.error ? pick(['＼エラーにゃ…／','＼英語のとこ見てみるにゃ／','＼'+ (r.error.line ? r.error.line + '行目にゃ' : 'もう1回にゃ') +'／']) : pick(SAY.ng), 'shake');
    let msg = '';
    if (r.kind === 'output') msg = (r.line+1) + '行目がちがいます';
    else if (r.kind === 'must') msg = r.ja;
    else if (r.kind === 'checks') msg = 'チェックに ' + r.fails.length + 'こ 合っていないところがあります';
    if (!r.error) outWrap.append(h('div', { class:'verdict ng' }, h('div', { class:'vb', text: 'おしい！ ' + msg }),
      r.kind === 'output' ? h('div', { class:'vd', html: 'お題：<code></code>　あなた：<code></code>' }) : null));
    if (r.kind === 'output') { const cs = outWrap.querySelectorAll('.verdict code'); cs[0].textContent = r.want; cs[1].textContent = r.have; }
    if (s.hint >= 1) drawHints();
    updateMisses();
  }
  function solved(){
    if (s.solved) { outWrap.append(h('div', { class:'verdict ok' }, h('div', { class:'vb', text:'正解！（もうクリア済み）' }))); return; }
    s.solved = true;
    const prev = S.prog[key] || {};
    let reward = 0;
    const first = !prev.cleared;
    if (!s.answer) {
      if (first) reward += REWARD[s.si];
      if (s.daily && !S.daily.done) reward += 2;
      if (s.mode === 'review') reward += 2;
    }
    if (first) S.prog[key] = { cleared:true, clearedAt: today(), firstMiss: s.miss, firstAnswer: s.answer };
    if (s.daily && S.daily && S.daily.key === key) S.daily.done = true;
    dayRec().items.push({ key, miss: s.miss, answer: s.answer, ok:true, mode: s.mode, t: Date.now() });
    setKatsuo(S.katsuo + reward);

    // 復習
    let note = '';
    const r = S.review[key];
    if (s.mode === 'review' && r) {
      r.history.push({ date: today(), miss: s.miss, answer: s.answer });
      if (!s.answer && s.miss < 3) { r.status = 'cleared'; r.nextDue = addDays(today(), 7); note = '復習クリア！記録は「復習でクリアした問題」に残します。'; }
      else { r.status = 'active'; r.nextDue = addDays(today(), 1); note = 'まだ少しむずかしそう。あしたもう一度出すね。'; }
    } else if (s.answer || s.miss >= 3) {
      addReview(key, s.answer ? 'answer' : 'miss', s.miss, s.answer); note = '復習に入れました（' + (s.answer ? '答えを見た' : 'ミス' + s.miss + '回') + '）。';
    }
    save();

    const nextBtn = s.si < 2 ? h('button', { class:'btn primary', type:'button', onclick: () => openTask(s.pid, s.si + 1, 'normal') }, 'つぎの段階へ') : null;
    outWrap.append(h('div', { class:'verdict ok' },
      h('div', { class:'vb', text: '正解！' }),
      h('div', { class:'vd', text: (reward ? 'かつおぶし +' + reward + '　' : '') + (s.miss ? 'ミス ' + s.miss + '回' : 'ミスなし') }),
      note ? h('div', { class:'vd', text: note }) : null));
    outWrap.append(h('div', { class:'row' }, nextBtn, h('button', { class:'btn', type:'button', onclick: () => go(UI.tab) }, 'もどる')));
    updateMisses();
    if (s.mode !== 'review' && !s.answer && s.miss >= 1 && s.miss <= 2 && !S.review[key]) askReview(key, s.miss);
    if (reward) toast('かつおぶし +' + reward);
    buddySay(reward ? '＼正解にゃ！かつおぶし+' + reward + '／' : '＼正解にゃ！／', 'hop');
  }
}
function addReview(key, reason, miss, answer){
  const r = S.review[key];
  if (r) { r.status = 'active'; r.nextDue = addDays(today(), 1); r.reason = reason; return; }
  S.review[key] = { addedAt: today(), reason, firstMiss: miss, firstAnswer: !!answer, status:'active', nextDue: addDays(today(), 1), history: [] };
}
function askReview(key, miss){
  openSheet(h('div', { class:'h', text:'この問題を復習に入れますか？' }),
    h('p', { class:'sub', text:'ミスは ' + miss + '回でした。打ちまちがいだけなら、入れなくて大丈夫。' }),
    h('div', { class:'btns' },
      h('button', { class:'btn', type:'button', onclick: closeSheet }, '入れない'),
      h('button', { class:'btn primary', type:'button', onclick: () => { addReview(key, 'self', miss, false); save(); closeSheet(); toast('復習に入れました'); } }, '入れる')));
}

/* =========================================================
   自由
   ========================================================= */
function tryFree(kind, code){
  if (kind === 'js') { S.free.mode = 'js'; S.free.js = code; }
  else if (kind === 'html') { S.free.mode = 'web'; S.free.html = code; }
  else { S.free.mode = 'web'; S.free.css = code; }
  save(); go('free');
}
function renderFree(v){
  const mode = S.free.mode === 'web' ? 'web' : 'js';
  v.append(h('div', { class:'seg' },
    h('button', { type:'button', class: mode==='js'?'on':'', onclick: () => { S.free.mode = 'js'; save(); go('free'); } }, 'JavaScript'),
    h('button', { type:'button', class: mode==='web'?'on':'', onclick: () => { S.free.mode = 'web'; save(); go('free'); } }, 'HTML ＋ CSS')));
  v.append(h('p', { class:'sub', text:'お題なしで、自由に書いて動かせます。書いたものは自動で保存されます。' }));
  const out = h('div', { style:'display:grid;gap:10px' });
  if (mode === 'js') {
    const ta = codeArea(S.free.js);
    ta.addEventListener('input', () => { S.free.js = ta.value; saveSoon(); });
    const run = async () => {
      out.innerHTML = '';
      const box = h('div', { class:'out' }, h('div', { class:'lab', text:'結果（コンソール）' })); const lines = h('div'); box.append(lines); out.append(box);
      const paint = arr => { lines.innerHTML = ''; if (!arr.length) lines.append(h('div', { class:'none', text:'（何も表示されませんでした）' })); arr.forEach(x => lines.append(h('div', { class:'ln', text: x === '' ? ' ' : x }))); };
      paint([]);
      const res = await E.runJS(ta.value, paint); paint(res.lines);
      if (ta.markLine) ta.markLine(res.error && res.error.line);
      if (res.error) {
        const ja = h('div', { class:'ja', text: res.error.ja, hidden:true });
        const b = h('button', { type:'button', onclick: () => { ja.hidden = !ja.hidden; b.textContent = ja.hidden ? '日本語にする' : '英語だけにする'; } }, '日本語にする');
        box.append(h('div', { class:'err' }, h('div', { class:'en', text:(res.error.name === 'Timeout' ? '' : 'Uncaught ') + res.error.name + ': ' + res.error.msg }), res.error.line ? h('div', { class:'where', text:'（' + res.error.line + '行目）' }) : null, ja, b));
      }
      if (res.note) box.append(h('div', { class:'none', style:'font-family:var(--f-ui);font-size:13px', text: res.note }));
    };
    editorKeys(ta, run);
    v.append(h('div', { class:'editor' }, h('div', { class:'ed-head' }, h('span', { text:'jiyuu.js' })), keyBar(ta, 'js'), wrapHL(ta, 'js')));
    v.append(h('button', { class:'btn primary wide', type:'button', onclick: run }, '▶ 実行'), out);
  } else {
    const th = codeArea(S.free.html), tc = codeArea(S.free.css);
    th.style.minHeight = '150px'; tc.style.minHeight = '130px';
    th.addEventListener('input', () => { S.free.html = th.value; saveSoon(); });
    tc.addEventListener('input', () => { S.free.css = tc.value; saveSoon(); });
    const frame = h('iframe', { class:'preview', title:'プレビュー', sandbox:'allow-same-origin' });
    const run = () => E.renderPreview(frame, th.value, tc.value);
    editorKeys(th, run); editorKeys(tc, run);
    v.append(h('div', { class:'editor' }, h('div', { class:'ed-head' }, h('span', { text:'index.html' })), keyBar(th, 'html'), wrapHL(th, 'html')));
    v.append(h('div', { class:'editor' }, h('div', { class:'ed-head' }, h('span', { text:'style.css' })), keyBar(tc, 'css'), wrapHL(tc, 'css')));
    v.append(h('button', { class:'btn primary wide', type:'button', onclick: run }, '▶ 表示する'), h('div', { class:'label', text:'プレビュー' }), frame);
    run();
  }
}
let saveT; function saveSoon(){ clearTimeout(saveT); saveT = setTimeout(save, 400); }

/* =========================================================
   記録
   ========================================================= */
function renderRecord(v){
  const now = new Date();
  if (!UI.month) UI.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const M = UI.month, y = M.getFullYear(), m = M.getMonth();
  const t = today();
  const card = h('section', { class:'card' });
  card.append(h('div', { class:'cal-head' },
    h('button', { class:'cal-nav', type:'button', 'aria-label':'前の月', onclick: () => { UI.month = new Date(y, m-1, 1); go('record'); } }),
    h('div', { style:'text-align:center' }, h('div', { class:'label', text:'MONTH' }), h('div', { class:'h', text: y + '年' + (m+1) + '月' })),
    h('button', { class:'cal-nav next', type:'button', 'aria-label':'次の月', onclick: () => { UI.month = new Date(y, m+1, 1); go('record'); } })));
  card.append(h('p', { class:'sub', style:'text-align:center;margin-top:6px', text:'日付を押すと、その日にやったことが見られます。' }));
  const grid = h('div', { class:'cal' });
  ['月','火','水','木','金','土','日'].forEach((d,i) => grid.append(h('div', { class:'dow' + (i===5?' sat':i===6?' sun':''), text:d })));
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  for (let i = 0; i < firstDow; i++) grid.append(h('div', { class:'day blank' }));
  const days = new Date(y, m+1, 0).getDate();
  let mSolved = 0, mSec = 0;
  for (let d = 1; d <= days; d++) {
    const k = y + '-' + pad(m+1) + '-' + pad(d);
    const rec = S.days[k]; const n = rec ? rec.items.filter(i=>i.ok).length : 0; const sec = rec ? rec.sec : 0;
    mSolved += n; mSec += sec;
    const lv = n === 0 ? (sec >= 60 ? 'l1' : '') : n <= 2 ? 'l1' : n <= 4 ? 'l2' : 'l3';
    const cls = 'day ' + lv + (k > t ? ' future' : '') + (k === t ? ' today' : '');
    grid.append(h('button', { class: cls, type:'button', onclick: () => daySheet(k) }, String(d), n ? h('small', { text: n + '問' }) : sec >= 60 ? h('small', { text: fmtTime(sec) }) : null));
  }
  card.append(grid);
  card.append(h('div', { class:'legend' }, 'すくない', h('i', { style:'background:#cfeef5' }), h('i', { style:'background:var(--sky)' }), h('i', { style:'background:var(--teal)' }), 'たくさん'));
  v.append(card);

  v.append(h('section', { class:'card' },
    h('div', { class:'label', text:'この月のまとめ' }),
    h('div', { class:'mini-stats', style:'margin-top:8px' },
      h('div', { class:'stat' }, h('b', { text: mSolved + '問' }), h('span', { text:'といた数' })),
      h('div', { class:'stat' }, h('b', { text: fmtTime(mSec) }), h('span', { text:'勉強時間' })),
      h('div', { class:'stat' }, h('b', { text: streak() + '日' }), h('span', { text:'いまの連続' })))));

  // つまずきランキング（目立たない場所に）
  const rank = Object.entries(S.miss).sort((a,b) => b[1]-a[1]).slice(0,5);
  if (rank.length) v.append(h('details', { class:'card soft' },
    h('summary', { class:'sub', style:'cursor:pointer', text:'よくやるミス（タップで開く）' }),
    h('div', { class:'rank', style:'margin-top:8px' }, rank.map(([k,n]) => h('div', null, h('code', { text:k }), h('span', { text: n + '回' }))))));
}
function daySheet(k){
  const rec = S.days[k] || { sec:0, items:[] };
  const items = rec.items.slice().sort((a,b) => a.t - b.t);
  const list = h('div', { class:'list' });
  if (!items.length) list.append(h('div', { class:'empty', text:'この日の記録はありません' }));
  items.forEach(it => {
    const x = parseKey(it.key); if (!x.p) return;
    const tm = new Date(it.t); const hhmm = pad(tm.getHours()) + ':' + pad(tm.getMinutes());
    list.append(h('div', { class:'li' },
      h('div', { class:'lt' }, x.p.title + '（' + STAGE[x.si] + '）',
        h('small', { text: hhmm + ' ・ ' + COURSE[x.p.course] + ' ・ ' + (it.miss ? 'ミス' + it.miss + '回' : 'ミスなし') + (it.mode === 'review' ? ' ・ 復習' : '') })),
      it.answer ? h('span', { class:'chip p', text:'答え' }) : null,
      h('span', { class: 'chip ' + (it.ok ? 'm' : 'line'), text: it.ok ? 'クリア' : 'とちゅう' })));
  });
  openSheet(h('div', { class:'label', text:'DAY' }), h('div', { class:'h', text: fmtDay(k) }),
    h('div', { class:'mini-stats' },
      h('div', { class:'stat' }, h('b', { text: fmtTime(rec.sec) }), h('span', { text:'勉強時間' })),
      h('div', { class:'stat' }, h('b', { text: items.filter(i=>i.ok).length + '問' }), h('span', { text:'クリア' })),
      h('div', { class:'stat' }, h('b', { text: items.reduce((a,i)=>a+i.miss,0) + '回' }), h('span', { text:'ミス' }))),
    list, h('button', { class:'btn wide', type:'button', onclick: closeSheet }, '閉じる'));
}

/* =========================================================
   ねこ屋さん ＋ 設定
   ========================================================= */
function renderShop(v){
  const ownedN = Object.keys(S.cats.owned).length;
  v.append(h('section', { class:'card' },
    h('div', { class:'label', text:'CAT SHOP' }), h('div', { class:'h', text:'ねこ屋さん' }),
    h('p', { class:'sub', text:'かつおぶしでねこを仲間にできます。仲間のねこには名前をつけられます。（' + ownedN + ' / ' + CATS.length + '匹）' })));
  const grid = h('div', { class:'cats' });
  CATS.forEach(c => {
    const own = !!S.cats.owned[c.id], partner = S.cats.partner === c.id;
    const pic = h('div', { class:'pic' }, catCanvas(c.id, 'sit', 3));
    let btn;
    if (partner) btn = h('span', { class:'chip y', text:'いまの相棒' });
    else if (own) btn = h('button', { class:'btn', type:'button', onclick: () => { S.cats.partner = c.id; save(); buddyRender(); buddySay('＼よろしくにゃ／', 'hop'); toast(catName(c.id) + 'が相棒になりました'); go('shop'); } }, '相棒にする');
    else btn = h('button', { class:'btn', type:'button', disabled: S.katsuo < c.price || null, onclick: () => buyCat(c) }, 'かつおぶし ' + c.price);
    grid.append(h('div', { class:'catc' + (partner ? ' partner' : '') + (own ? '' : ' locked') },
      pic,
      h('button', { type:'button', class:'nm', style:'border:0;background:none;padding:0;justify-content:center;width:100%', onclick: own ? () => nameCat(c.id) : null, 'aria-label': own ? '名前を変える' : null },
        own ? catName(c.id) + ' ✎' : c.name),
      h('div', { class:'pr', text: own ? c.name : RARITY(c.price) }), btn));
  });
  v.append(grid);

  // 設定
  const goalNum = h('b', { style:'font-weight:400;font-size:18px;min-width:2.5em;text-align:center', text: S.goal + '問' });
  v.append(h('section', { class:'card' },
    h('div', { class:'label', text:'SETTINGS' }), h('div', { class:'h', text:'設定' }),
    h('div', { class:'setting' }, h('span', { text:'1日の目標' }),
      h('div', { class:'stepper' },
        h('button', { type:'button', 'aria-label':'へらす', onclick: () => { S.goal = Math.max(1, S.goal-1); save(); goalNum.textContent = S.goal + '問'; } }, '−'), goalNum,
        h('button', { type:'button', 'aria-label':'ふやす', onclick: () => { S.goal = Math.min(20, S.goal+1); save(); goalNum.textContent = S.goal + '問'; } }, '＋'))),
    h('div', { class:'setting' }, h('div', null, h('div', { text:'データを書き出す' }), h('div', { class:'sub', text:'機種変更やPCに移すとき用' })), h('button', { class:'btn small', type:'button', onclick: exportData }, '書き出す')),
    h('div', { class:'setting' }, h('div', null, h('div', { text:'データを読み込む' }), h('div', { class:'sub', text:'書き出したデータで上書きします' })), h('button', { class:'btn small', type:'button', onclick: importData }, '読み込む')),
    accountRow()));
}
const AUTH_JA = {
  'auth/invalid-email':'メールアドレスの形がちがいます。',
  'auth/user-not-found':'そのメールアドレスのアカウントがありません。',
  'auth/wrong-password':'パスワードがちがいます。',
  'auth/invalid-credential':'メールアドレスかパスワードがちがいます。',
  'auth/invalid-login-credentials':'メールアドレスかパスワードがちがいます。',
  'auth/email-already-in-use':'そのメールアドレスはもう使われています。「ログイン」から入ってください。',
  'auth/weak-password':'パスワードは6文字以上にしてください。',
  'auth/missing-password':'パスワードを入れてください。',
  'auth/network-request-failed':'ネットにつながっていないみたいです。',
  'auth/too-many-requests':'何回も失敗したので、少し時間をおいてからためしてください。'
};
function accountRow(){
  if (!window.NekoCloud) return h('div', { class:'setting' }, h('div', { class:'sub', text:'ログイン機能を読み込み中…' }));
  if (!cloudOn()) return h('div', { class:'setting' }, h('div', null, h('div', { text:'ログインと同期' }),
    h('div', { class:'sub', text: window.NekoCloud.reason === 'config' ? 'まだ準備中です（Firebase の設定が必要）。記録はこの端末の中にだけ保存されます。' : 'ネットにつながっていないので、いまはログインできません。' })));
  if (cloudUser) return h('div', { class:'setting' },
    h('div', null, h('div', { text:'ログイン中' }), h('div', { class:'sub', text: cloudUser.email + '（ほかの端末と同期しています）' })),
    h('button', { class:'btn small', type:'button', onclick: () => {
      openSheet(h('div', { class:'h', text:'ログアウトしますか？' }), h('p', { class:'sub', text:'この端末の記録は残ります。もう一度ログインすれば、また同期されます。' }),
        h('div', { class:'btns' }, h('button', { class:'btn', type:'button', onclick: closeSheet }, 'やめる'),
          h('button', { class:'btn primary', type:'button', onclick: async () => { await window.NekoCloud.signOut(); closeSheet(); toast('ログアウトしました'); } }, 'ログアウト')));
    } }, 'ログアウト'));
  return h('div', { class:'setting' },
    h('div', null, h('div', { text:'ログインして同期' }), h('div', { class:'sub', text:'スマホと PC で、かつおぶし・記録・ねこが同じになります。' })),
    h('button', { class:'btn small primary', type:'button', onclick: loginSheet }, 'ログイン'));
}
function loginSheet(mode){
  mode = mode === 'signup' ? 'signup' : 'login';
  const em = h('input', { type:'email', id:'loginEmail', autocomplete:'email', placeholder:'メールアドレス', 'aria-label':'メールアドレス', style:'width:100%;border:2px solid var(--ink);border-radius:10px;padding:10px 12px;font-size:16px' });
  const pw = h('input', { type:'password', id:'loginPw', autocomplete: mode === 'signup' ? 'new-password' : 'current-password', placeholder:'パスワード（6文字以上）', 'aria-label':'パスワード', style:'width:100%;border:2px solid var(--ink);border-radius:10px;padding:10px 12px;font-size:16px' });
  const msg = h('p', { class:'sub', style:'color:var(--ng)', hidden:true });
  const go1 = h('button', { class:'btn primary wide', type:'button', onclick: async () => {
    msg.hidden = true; go1.disabled = true;
    try {
      if (mode === 'signup') await window.NekoCloud.signUp(em.value.trim(), pw.value);
      else await window.NekoCloud.signIn(em.value.trim(), pw.value);
      closeSheet(); toast(mode === 'signup' ? 'アカウントを作りました' : 'ログインしました');
      buddySay('＼おかえりにゃ／', 'hop');
    } catch(e) { msg.textContent = AUTH_JA[e.code] || ('うまくいきませんでした（' + (e.code || e.message) + '）'); msg.hidden = false; }
    go1.disabled = false;
  } }, mode === 'signup' ? 'アカウントを作る' : 'ログイン');
  openSheet(h('div', { class:'h', text: mode === 'signup' ? 'アカウントを作る' : 'ログイン' }),
    h('p', { class:'sub', text: mode === 'signup' ? 'ほかで使っているパスワードとは、ちがうものにしてください。' : 'スマホと PC で同じアカウントに入ると、記録がそろいます。' }),
    em, pw, msg, go1,
    h('div', { class:'btns' },
      h('button', { class:'btn small', type:'button', onclick: () => loginSheet(mode === 'signup' ? 'login' : 'signup') }, mode === 'signup' ? 'ログインにもどる' : '新しく作る'),
      h('button', { class:'btn small', type:'button', onclick: async () => {
        if (!em.value.trim()) { msg.textContent = '先にメールアドレスを入れてください。'; msg.hidden = false; return; }
        try { await window.NekoCloud.reset(em.value.trim()); toast('パスワードの再設定メールを送りました'); } catch(e) { msg.textContent = AUTH_JA[e.code] || 'メールを送れませんでした。'; msg.hidden = false; }
      } }, 'パスワードを忘れた')));
  setTimeout(() => em.focus(), 50);
}
function buyCat(c){
  openSheet(h('div', { class:'pic', style:'display:grid;place-items:center' }, catCanvas(c.id, 'sit', 6)),
    h('div', { class:'h', style:'text-align:center', text: c.name + 'を仲間にしますか？' }),
    h('p', { class:'sub', style:'text-align:center', text:'かつおぶし ' + c.price + 'こ（いま ' + S.katsuo + 'こ）' }),
    h('div', { class:'btns' }, h('button', { class:'btn', type:'button', onclick: closeSheet }, 'やめる'),
      h('button', { class:'btn primary', type:'button', onclick: () => {
        if (S.katsuo < c.price) return;
        setKatsuo(S.katsuo - c.price);
        S.cats.owned[c.id] = { name: c.name, got: today() }; save();
        nameCat(c.id, true);
      } }, '仲間にする')));
}
function nameCat(id, isNew){
  const inp = h('input', { type:'text', id:'catNameInput', maxlength:'12', value: catName(id), 'aria-label':'ねこの名前' });
  openSheet(h('div', { class:'pic', style:'display:grid;place-items:center' }, catCanvas(id, 'sit', 6)),
    h('div', { class:'h', style:'text-align:center', text: isNew ? '仲間になったにゃ！名前をつけよう' : '名前を変える' }), inp,
    h('div', { class:'btns' },
      h('button', { class:'btn', type:'button', onclick: () => { closeSheet(); go('shop'); } }, isNew ? 'このままでいい' : 'やめる'),
      h('button', { class:'btn primary', type:'button', onclick: () => { const n = inp.value.trim(); if (n) S.cats.owned[id].name = n; save(); closeSheet(); go('shop'); } }, '決める')));
  setTimeout(() => inp.focus(), 50);
}
function exportData(){
  const text = JSON.stringify(S);
  const ta = h('textarea', { readonly:true }, text);
  const name = 'nekocode-' + today() + '.json';
  openSheet(h('div', { class:'h', text:'データを書き出す' }),
    h('p', { class:'sub', text:'ファイルで保存するか、下の文字を全部コピーして、移したい先の「読み込む」に貼り付けてください。' }),
    ta,
    h('div', { class:'btns' },
      h('button', { class:'btn', type:'button', onclick: async () => {
        try { await navigator.clipboard.writeText(text); toast('コピーしました'); } catch(e) { ta.select(); toast('選択しました。コピーしてください'); }
      } }, 'コピー'),
      h('button', { class:'btn primary', type:'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([text], { type:'application/json' })), download: name }); document.body.append(a); a.click(); a.remove();
      } }, 'ファイルで保存')),
    h('button', { class:'btn wide', type:'button', onclick: closeSheet }, '閉じる'));
}
function importData(){
  const ta = h('textarea', { placeholder:'ここに書き出したデータを貼り付け' });
  const file = h('input', { type:'file', accept:'.json,application/json', style:'font-size:14px' });
  file.addEventListener('change', () => { const f = file.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = r.result; }; r.readAsText(f); });
  openSheet(h('div', { class:'h', text:'データを読み込む' }),
    h('p', { class:'sub', text:'いまの記録は、読み込んだデータで上書きされます。' }), file, ta,
    h('div', { class:'btns' }, h('button', { class:'btn', type:'button', onclick: closeSheet }, 'やめる'),
      h('button', { class:'btn primary', type:'button', onclick: () => {
        try {
          const d = JSON.parse(ta.value);
          if (!d || d.v !== 1 || !d.cats) throw new Error('bad');
          S = Object.assign(fresh(), d); save(); setKatsuo(S.katsuo); buddyRender(); closeSheet(); toast('読み込みました'); go('home');
        } catch(e) { toast('読み込めませんでした。データ全部を貼り付けたか確認してね'); }
      } }, '読み込む')));
}

/* =========================================================
   勉強時間（練習・自由の画面を開いている間だけ）
   ========================================================= */
let lastInput = Date.now(), tick = 0;
['pointerdown','keydown','input','scroll','touchstart'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, { passive:true, capture:true }));
setInterval(() => {
  const counting = (UI.screen === 'task' || UI.screen === 'free') && !document.hidden && (Date.now() - lastInput) < 120000;
  if (!counting) return;
  dayRec().sec++;
  if (++tick % 15 === 0) save();
}, 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

/* ---------- はじめる ---------- */
setKatsuo(S.katsuo);
buddyRender();
go('home');
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
