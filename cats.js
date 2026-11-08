/* =========================================================
   ねこコード：ドット絵ねこ
   ・形（ポーズ）は文字で定義。1文字が1ドット
     . = なし / o = 線 / b = 体 / w = おなか・口まわり / e = 目 / n = 鼻 / c = 首輪
   ・ねこの種類は「色」と「もよう」の組み合わせで作る
   ========================================================= */
(function(){
  /* すわっているねこ（しおんさんの参考イラストをもとにしたドット絵）
     . なし / o 線 / b 体 / d かげ・しま / l 明るいところ / p 耳の中 / n 鼻 / e 目 / m 口 / y チャーム */
  const SIT = [
    "..............oo......o....",
    ".............obbo....obo...",
    ".............oppdoooodpo...",
    ".............oppbdbddbpo...",
    ".............obbbdbddbbo...",
    "............obbbbbbbbbbbo..",
    "............oddbeebbbeeddo.",
    "...........obbbbbblnlbbbo..",
    "............oddbllmlmllddo.",
    "..oo.......oddllllllllllo..",
    ".ollo.....odbbddlllllldo...",
    "ollllo...oddbbbbdddyddlo...",
    ".ollo...odbddbblllyyylllo..",
    "obddbo..oddbdbbbllyyylllo..",
    ".odbo..odbdbbbbbbllllllo...",
    "..oddo.oddbdbbdbbllllldo...",
    "..odbdoobdbbbbdbbbblldbo...",
    "...oddbddbbbbbboddbobbo....",
    "....obbdbddbbbdobbbobdo....",
    ".....obddbbbddlbolloblo....",
    "......oooobbllobolllollo...",
    "..........oooooooooooooo..."
  ];
  const POSES = { sit: SIT };

  /* ---- 横向きの小さいねこ（ホームで歩く用） ---- */
  const MW = 22;
  function legs(centers){
    const r9=[...'.'.repeat(MW)], r10=[...'.'.repeat(MW)], r11=[...'.'.repeat(MW)];
    for (let x=3; x<=20; x++) r9[x]='o';
    centers.forEach(c=>{ r9[c]='w'; r10[c-1]='o'; r10[c]='w'; r10[c+1]='o'; r11[c-1]='o'; r11[c]='o'; r11[c+1]='o'; });
    return [r9.join(''), r10.join(''), r11.join('')];
  }
  const MTOP = [
    ".............o....o...",
    "............obo..obo..",
    ".o..........obbbbbbo..",
    ".o..........obebbebo..",
    "..o.........obbwnwbo..",
    "..o.ooooooooocccccco..",
    "...obbbbbbbbbbbbbbbbo.",
    "...obbbbbbbbbbbbbbbbo.",
    "...owwwwwwwwwwwwwwwwo.",
  ];
  const MINI = {
    walkA: MTOP.concat(legs([5,9,14,18])),
    walkB: MTOP.concat(legs([4,8,15,19])),
    loaf: [
      "...........o....o...",
      "..........obo..obo..",
      "..........obbbbbbo..",
      "...oooooooobobbobo..",
      "..obbbbbbbobbwnwbo..",
      ".obbbbbbbbbcccccco..",
      ".obbbbbbbbbbbbbbbo..",
      ".owwwwwwwwwwwwwwwo..",
      "..oooooooooooooooo..",
    ],
    minisit: [
      "...o....o.....",
      "..obo..obo....",
      "..obbbbbbo....",
      "..obebbebo....",
      "..obbwnwbo....",
      "..occcccco....",
      "..obbbbbbo..o.",
      ".obbbbbbbbo.o.",
      ".obbbbbbbbo.o.",
      ".obwwbbwwbooo.",
      ".obwwbbwwbo...",
      "..oooooooo....",
    ]
  };
  function miniColor(cat, ch, x, y, w, h, pose){
    const u = x / w, v = y / h, P = cat.pat, B = cat.body, Wc = cat.belly || cat.body;
    if (ch === 'w') { if (P === 'socks' && v > 0.7) return '#ffffff'; if (P === 'point' && v > 0.75) return cat.p1; return Wc; }
    switch (P) {
      case 'tabby': return (x % 3 === 0) ? cat.p1 : B;
      case 'rainbow': { const cs = ['#ff9aa2','#ffdac1','#fff1a8','#b5ead7','#a0d8ef','#c7b8ea']; return cs[Math.floor(x / 3) % cs.length]; }
      case 'spots': if ((u > 0.28 && u < 0.48 && v > 0.42 && v < 0.62) || (u > 0.62 && v < 0.26)) return cat.p1; return B;
      case 'calico': if (u > 0.28 && u < 0.48 && v > 0.42 && v < 0.66) return cat.p1; if ((u > 0.5 && u < 0.62 && v > 0.45 && v < 0.62) || (u > 0.7 && v < 0.22)) return cat.p2; return B;
      case 'hachi': if (v < 0.3 && u > 0.5) return cat.p1; if (v > 0.45 && v < 0.62) return cat.p1; return B;
      case 'point': if (v < 0.14) return cat.p1; if (pose !== 'minisit' && pose !== 'loaf' && u < 0.18) return cat.p1; return B;
      case 'stars': if ((x * 7 + y * 5) % 13 === 0) return cat.p1; return B;
      case 'back': if (v > 0.42 && v < 0.55) return cat.p1; return B;
      default: return B;
    }
  }
  function drawMini(canvas, cat, pose, scale, flip){
    const g = MINI[pose];
    const h = g.length, w = Math.max(...g.map(r=>r.length));
    canvas.width = w * scale; canvas.height = h * scale;
    canvas.style.width = (w * scale) + 'px'; canvas.style.height = (h * scale) + 'px';
    const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let y=0; y<h; y++) for (let x=0; x<g[y].length; x++){
      const ch = g[y][x]; if (ch === '.') continue;
      let col;
      if (ch === 'o') col = cat.miniLine || cat.line || '#1f3b45';
      else if (ch === 'e') col = cat.miniLine || cat.eye || cat.line || '#1f3b45';
      else if (ch === 'n') col = cat.nose || '#f19bb0';
      else if (ch === 'c') col = cat.charm || '#5cc6d8';
      else col = miniColor(cat, ch, x, y, w, h, pose);
      ctx.fillStyle = col; ctx.fillRect((flip ? w-1-x : x)*scale, y*scale, scale, scale);
    }
    return canvas;
  }


  function mix(hex, to, t){
    const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    const r = Math.round(((a>>16)&255)*(1-t) + ((b>>16)&255)*t), g = Math.round(((a>>8)&255)*(1-t) + ((b>>8)&255)*t), bl = Math.round((a&255)*(1-t) + (b&255)*t);
    return '#' + ((1<<24) + (r<<16) + (g<<8) + bl).toString(16).slice(1);
  }

  const blob = (x, y, cx, cy, r) => ((x-cx)*(x-cx) + (y-cy)*(y-cy)*1.3) <= r*r;
  /* ---- もよう ---- */
  function bodyColor(cat, ch, x, y, w, h){
    const u = x / w, v = y / h, P = cat.pat;
    const B = cat.body, D = cat.shade || mix(cat.body, cat.line || '#1f3b45', 0.22);
    const Lc = cat.belly || mix(cat.body, '#ffffff', 0.6);
    if (ch === 'l') {
      if (P === 'point' && v > 0.82) return cat.p1;
      return Lc;
    }
    const base = ch === 'd' ? D : B;
    switch (P) {
      case 'tabby':   return ch === 'd' ? cat.p1 : B;
      case 'rainbow': { const cs = ['#ffb3ba','#ffd9b0','#fff1a8','#c8f0d8','#b5dcf5','#d8c8f0']; return ch === 'd' ? mix(cs[Math.floor(x/4)%cs.length], '#1f3b45', .12) : cs[Math.floor(x/4)%cs.length]; }
      case 'spots':   if (blob(x,y,12,15,3.2) || blob(x,y,17,3,2.6) || blob(x,y,3,12,1.8)) return cat.p1; return base;
      case 'calico':  if (blob(x,y,12,15,3.4) || blob(x,y,23,3,2.4)) return cat.p1; if (blob(x,y,16,2,2.4) || blob(x,y,7,17,2.2) || blob(x,y,3,11,1.6)) return cat.p2; return base;
      case 'hachi':   if (v < 0.45 && !(u > 0.6 && u < 0.86 && v > 0.27)) return ch === 'd' ? mix(cat.p1,'#000000',.1) : cat.p1; if (v > 0.45 && u < 0.45) return cat.p1; return base;
      case 'point':   if (v < 0.16 || u < 0.22) return cat.p1; return base;
      case 'stars':   if ((x * 7 + y * 5) % 11 === 0) return cat.p1; return base;
      case 'back':    if (ch === 'd' || (u < 0.55 && v > 0.5)) return cat.p1; return B;
      case 'socks':   if (v > 0.86) return '#ffffff'; return base;
      default:        return base;
    }
  }

  /* ---- 描く ---- */
  function drawCat(canvas, cat, pose, scale, flip){
    scale = scale || 4;
    if (MINI[pose]) return drawMini(canvas, cat, pose, scale, flip);
    const g = SIT;
    const h = g.length, w = Math.max(...g.map(r=>r.length));
    canvas.width = w * scale; canvas.height = h * scale;
    canvas.style.width = (w * scale) + 'px';
    canvas.style.height = (h * scale) + 'px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let y=0; y<h; y++){
      const row = g[y];
      for (let x=0; x<row.length; x++){
        const ch = row[x];
        if (ch === '.') continue;
        let col;
        if (ch === 'o') col = cat.line || '#1f3b45';
        else if (ch === 'e') col = cat.eye || cat.line || '#1f3b45';
        else if (ch === 'm') col = cat.mouth || cat.line || '#1f3b45';
        else if (ch === 'n') col = cat.nose || '#f19bb0';
        else if (ch === 'p') col = cat.ear || '#f7b8c2';
        else if (ch === 'y') col = cat.charm || '#f6c945';
        else col = bodyColor(cat, ch, x, y, w, h);
        ctx.fillStyle = col;
        const dx = flip ? (w - 1 - x) : x;
        ctx.fillRect(dx*scale, y*scale, scale, scale);
      }
    }
    if (cat.ribbon) { ctx.fillStyle = cat.ribbon; const rx = flip ? w-1-21 : 21; ctx.fillRect(rx*scale, 1*scale, scale, scale); ctx.fillRect((flip?rx-1:rx+1)*scale, 2*scale, scale, scale); }
    return canvas;
  }

  /* ---- ねこ図鑑（30匹） ---- */
  const L = '#1f3b55';
  const CATS = [
    {id:'shiro',  name:'しろねこ',        price:0,  miniLine:'#1f3b45', body:'#f4f8fb', shade:'#cfdfec', belly:'#ffffff', line:'#9fb2c2', eye:'#9fb2c2', mouth:'#9fb2c2', charm:'#f2a93b'},
    {id:'sora',   name:'そらねこ',        price:5,  body:'#cfe3f5', p1:'#8fb6dc', pat:'tabby', belly:'#eef6fc', line:L, charm:'#f6c945'},
    {id:'kuro',   name:'くろねこ',        price:5,  body:'#30363f', shade:'#22272e', belly:'#454c57', line:'#14181d', eye:'#f6c945', mouth:'#8b96a3', nose:'#d98a9d', ear:'#a2687a', charm:'#7fd37a'},
    {id:'yuzu',   name:'ゆずねこ',        price:5,  body:'#ffe48a', shade:'#f5cd5a', belly:'#fff7d6', line:'#6b5418', charm:'#7fd37a'},
    {id:'kinako', name:'きなこねこ',      price:8,  body:'#f0d7a8', shade:'#dcbb84', belly:'#fbf0da', line:'#5a4630', charm:'#8fc7e8'},
    {id:'soda',   name:'ソーダねこ',      price:8,  body:'#bfe8f7', shade:'#8fd2ea', belly:'#ffffff', line:'#25586b', charm:'#f6c945'},
    {id:'ramune', name:'ラムネねこ',      price:10, body:'#c9f1e0', shade:'#9addc3', belly:'#ffffff', line:'#24594a', charm:'#7aa7e8'},
    {id:'ichigo', name:'いちごみるくねこ', price:10, body:'#ffd6e2', shade:'#f5b3c7', belly:'#fff5f8', line:'#7a3b4b', charm:'#ff6f91', ribbon:'#ff6f91'},
    {id:'mitea',  name:'ミルクティーねこ', price:12, body:'#dcc0a3', shade:'#c4a07f', belly:'#f6ebe0', line:'#4d3628', charm:'#ffffff'},
    {id:'hai',    name:'はいいろねこ',    price:12, body:'#b4bec6', shade:'#8f9ba5', belly:'#e3e8ec', line:'#2d3940', charm:'#f19bb0'},
    {id:'azuki',  name:'あずきねこ',      price:14, body:'#a8665d', shade:'#874c45', belly:'#dcb7ae', line:'#3b1f1b', charm:'#f6c945'},
    {id:'mike',   name:'みけねこ',        price:15, body:'#fbfaf6', shade:'#e3ddd2', p1:'#f0a04b', p2:'#3a3f46', pat:'calico', belly:'#ffffff', line:'#3a3f46', charm:'#e85a5a'},
    {id:'buchi',  name:'ぶちねこ',        price:15, body:'#fbfaf6', shade:'#e3e3e3', p1:'#3a3f46', pat:'spots', belly:'#ffffff', line:'#2a2f35', charm:'#5cc6d8'},
    {id:'hachi',  name:'ハチワレ',        price:16, body:'#fbfaf6', shade:'#e6e6e6', p1:'#30363f', pat:'hachi', belly:'#ffffff', line:'#14181d', charm:'#e85a5a'},
    {id:'kutsu',  name:'くつしたねこ',    price:16, body:'#97a1aa', shade:'#7b858f', pat:'socks', belly:'#e3e8ec', line:'#2d3940', charm:'#f6c945'},
    {id:'tuxedo', name:'タキシードねこ',  price:18, body:'#30363f', shade:'#22272e', belly:'#ffffff', line:'#14181d', eye:'#9be38f', mouth:'#8b96a3', ear:'#a2687a', charm:'#e85a5a'},
    {id:'chatora',name:'ちゃトラ',        price:18, body:'#f7c483', p1:'#e08a3c', pat:'tabby', belly:'#fdecd6', line:'#5a3416', charm:'#5cc6d8'},
    {id:'kijitora',name:'キジトラ',       price:20, body:'#b8976f', p1:'#6b5038', pat:'tabby', belly:'#ece2d0', line:'#2f2216', charm:'#7fd37a'},
    {id:'sabatora',name:'サバトラ',       price:20, body:'#bfc8ce', p1:'#68737c', pat:'tabby', belly:'#f0f3f5', line:'#2d3940', charm:'#f19bb0'},
    {id:'hojicha',name:'ほうじ茶ねこ',    price:22, body:'#c49a70', p1:'#8e6440', pat:'back', belly:'#f1e4d4', line:'#3e2a19', charm:'#d9e8a2'},
    {id:'matcha', name:'まっちゃねこ',    price:24, body:'#d3e6af', shade:'#b3cf86', belly:'#f4f9e8', line:'#3c4d22', charm:'#f6c945', ribbon:'#fdf0b8'},
    {id:'sumire', name:'すみれねこ',      price:24, body:'#dccdf2', shade:'#bba6e3', belly:'#f6f1fd', line:'#3e2f5c', charm:'#f6c945'},
    {id:'momiji', name:'もみじねこ',      price:26, body:'#f4a77a', p1:'#d9623a', pat:'back', belly:'#fde6d8', line:'#5a2412', charm:'#f6c945'},
    {id:'lemon',  name:'レモンねこ',      price:26, body:'#fff09a', p1:'#ffffff', pat:'tabby', belly:'#fffbe3', line:'#5a5016', charm:'#7fd37a'},
    {id:'watame', name:'わたあめねこ',    price:28, body:'#ffe6f0', shade:'#f5c9dc', p1:'#d8c8f0', pat:'spots', belly:'#ffffff', line:'#6a4a62', charm:'#a0d8ef', ribbon:'#a0d8ef'},
    {id:'komugi', name:'こむぎねこ',      price:30, body:'#ebcb90', shade:'#d6ad66', belly:'#fff6e1', line:'#4d3a1a', charm:'#e85a5a'},
    {id:'siam',   name:'シャムねこ',      price:35, body:'#f5ead9', shade:'#e2d1b8', p1:'#6a4c39', pat:'point', belly:'#fbf5ec', line:'#3a2a1f', eye:'#3a2a1f', charm:'#4fa3e0'},
    {id:'yozora', name:'よぞらねこ',      price:40, body:'#33427e', shade:'#26315f', p1:'#ffe48a', pat:'stars', belly:'#4a5a99', line:'#141a36', eye:'#ffe48a', mouth:'#a9b4e0', ear:'#8a7ab8', charm:'#ffe48a'},
    {id:'yuki',   name:'ゆきねこ',        price:50, miniLine:'#5f7f99', body:'#ffffff', shade:'#e2edf6', belly:'#ffffff', line:'#9cb6cc', eye:'#7fa6c8', mouth:'#9cb6cc', charm:'#a0d8ef', ribbon:'#cfe8f7'},
    {id:'hidamari',name:'ひだまりねこ',   price:60, body:'#ffd775', p1:'#f5ab45', pat:'tabby', belly:'#fff4cc', line:'#6a4a10', charm:'#ffffff', ribbon:'#ff8fa3'},
    {id:'niji',   name:'にじねこ',        price:80, body:'#ffffff', pat:'rainbow', belly:'#ffffff', line:L, charm:'#ffffff'}
  ];
  const RARITY = p => p >= 50 ? 'とってもレア' : p >= 30 ? 'レア' : p >= 15 ? 'ちょっとレア' : 'ふつう';

  window.NekoCats = { CATS, POSES, drawCat, RARITY };
})();
