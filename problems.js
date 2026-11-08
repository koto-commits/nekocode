/* =========================================================
   ねこコード：問題データ
   各問題は3段階：fill（穴埋め）→ look（見て書く）→ blind（見ないで書く）
   JS   : expect（表示される行）で判定。must は「この書き方を使ってね」のチェック
   HTML : checks（ページの中身）で判定
   CSS  : html（固定）＋ 書いたCSS の見た目で判定
   ========================================================= */
(function(){
const m = (re, ja, en) => ({ re, ja, en });
const USE_FOR = m('\\bfor\\s*\\(', 'for を使ってね', 'Use a for loop.');
const USE_IF  = m('\\bif\\s*\\(', 'if を使ってね', 'Use an if statement.');
const range = (a,b,s=1) => { const r=[]; for(let i=a; s>0? i<=b : i>=b; i+=s) r.push(String(i)); return r; };

const JS = [
/* ---------- 変数と計算 ---------- */
{ id:'j01', course:'js', unit:'変数と計算', title:'値段 × 個数',
  point:'値段と個数は別々の箱に入れる。あとで数を変えるときに1か所直すだけですむ。',
  kata:"const nedan = 100;\nconst kosu = 3;\nconsole.log(nedan * kosu);",
  memo:"// 値段の箱を作る\n// 個数の箱を作る\n// 値段 × 個数 を表示する",
  exp:"const a = 2;\nconst b = 5;\nconsole.log(a * b);",
  stages:[
    { kind:'fill', task:'120円のおにぎりを4個買いました。？を埋めて、合計を表示しよう。',
      starter:"const nedan = ？;\nconst kosu = ？;\nconsole.log(nedan ？ kosu);\n", expect:['480'],
      answer:"const nedan = 120;\nconst kosu = 4;\nconsole.log(nedan * kosu);" },
    { kind:'look', task:'150円のジュースを3本買いました。値段と本数を別々の箱に入れて、合計を表示しよう。',
      starter:"", expect:['450'], must:[m('\\*','かけ算の * を使ってね','Use the * operator.')],
      answer:"const nedan = 150;\nconst hon = 3;\nconsole.log(nedan * hon);" },
    { kind:'blind', task:'1冊200円のノートを5冊。税込み（10%）の合計を、Math.round で整数にして表示しよう。',
      starter:"", expect:['1100'], must:[m('Math\\.round','Math.round を使ってね','Use Math.round().')],
      answer:"const nedan = 200;\nconst kosu = 5;\nconsole.log(Math.round(nedan * kosu * 1.1));" }
  ]},

/* ---------- if ---------- */
{ id:'j02', course:'js', unit:'if', title:'if と else',
  point:'( ) の条件が当てはまれば1つ目の { }、当てはまらなければ else の { }。',
  kata:"if (score >= 80) {\n  console.log('合格');\n} else {\n  console.log('不合格');\n}",
  memo:"// 箱を作る\n// もし 条件 なら → 1つ目を表示\n// そうでなければ → 2つ目を表示",
  exp:"console.log(85 >= 80);  // true か false が出る",
  stages:[
    { kind:'fill', task:'score が 80 以上なら「合格」、そうでなければ「不合格」。？を埋めよう。',
      starter:"const score = 85;\n？ (score ？ 80) {\n  console.log('合格');\n} ？ {\n  console.log('不合格');\n}\n", expect:['合格'],
      answer:"const score = 85;\nif (score >= 80) {\n  console.log('合格');\n} else {\n  console.log('不合格');\n}" },
    { kind:'look', task:'temp（気温）が 30。25 以上なら「暑い」、そうでなければ「すずしい」と表示しよう。',
      starter:"const temp = 30;\n", expect:['暑い'], must:[USE_IF],
      answer:"const temp = 30;\nif (temp >= 25) {\n  console.log('暑い');\n} else {\n  console.log('すずしい');\n}" },
    { kind:'blind', task:'age が 17。18 以上なら「おとな」、そうでなければ「こども」と表示しよう。',
      starter:"", expect:['こども'], must:[USE_IF],
      answer:"const age = 17;\nif (age >= 18) {\n  console.log('おとな');\n} else {\n  console.log('こども');\n}" }
  ]},

{ id:'j03', course:'js', unit:'if', title:'else if',
  point:'上から順にチェックして、当てはまったところで止まる。順番が大事。',
  kata:"if (age <= 12) {\n  …\n} else if (isMember) {\n  …\n} else {\n  …\n}",
  memo:"// 1つ目の条件をチェック\n// ちがったら、2つ目の条件をチェック（else if）\n// どれでもなければ else",
  exp:"const isMember = true;\nconsole.log(isMember);  // 箱の中身を先に見てみよう",
  stages:[
    { kind:'fill', task:'12歳以下は500円、会員は1000円、それ以外は1800円。？を埋めよう。',
      starter:"const age = 15;\nconst isMember = true;\nif (age <= 12) {\n  console.log('500円');\n} ？ (isMember) {\n  console.log('1000円');\n} else {\n  console.log('1800円');\n}\n", expect:['1000円'],
      answer:"const age = 15;\nconst isMember = true;\nif (age <= 12) {\n  console.log('500円');\n} else if (isMember) {\n  console.log('1000円');\n} else {\n  console.log('1800円');\n}" },
    { kind:'look', task:'score が 72。80 以上なら「A」、60 以上なら「B」、それ以外は「C」と表示しよう。',
      starter:"const score = 72;\n", expect:['B'], must:[m('else\\s+if','else if を使ってね','Use else if.')],
      answer:"const score = 72;\nif (score >= 80) {\n  console.log('A');\n} else if (score >= 60) {\n  console.log('B');\n} else {\n  console.log('C');\n}" },
    { kind:'blind', task:'hour が 14。12 より小さいなら「おはよう」、18 より小さいなら「こんにちは」、それ以外は「こんばんは」。',
      starter:"", expect:['こんにちは'], must:[m('else\\s+if','else if を使ってね','Use else if.')],
      answer:"const hour = 14;\nif (hour < 12) {\n  console.log('おはよう');\n} else if (hour < 18) {\n  console.log('こんにちは');\n} else {\n  console.log('こんばんは');\n}" }
  ]},

{ id:'j04', course:'js', unit:'if', title:'&& と ||',
  point:'&& は「かつ（両方とも）」、|| は「または（どちらか1つでも）」。',
  kata:"if (age >= 60 && isMember) {\n  …\n}",
  memo:"// 条件1 と 条件2 を書く\n// 両方なら && 、どちらかなら || でつなぐ",
  exp:"console.log(true && false);\nconsole.log(true || false);",
  stages:[
    { kind:'fill', task:'60歳以上 かつ 会員なら「シニア割引あり」。？を埋めよう。',
      starter:"const age = 65;\nconst isMember = true;\nif (age >= 60 ？ isMember) {\n  console.log('シニア割引あり');\n} else {\n  console.log('割引なし');\n}\n", expect:['シニア割引あり'],
      answer:"const age = 65;\nconst isMember = true;\nif (age >= 60 && isMember) {\n  console.log('シニア割引あり');\n} else {\n  console.log('割引なし');\n}" },
    { kind:'look', task:'hp が 40、hasPotion が true。hp が 50 より小さい かつ hasPotion なら「回復する」、それ以外は「がまん」。',
      starter:"const hp = 40;\nconst hasPotion = true;\n", expect:['回復する'], must:[m('&&','&& を使ってね','Use the && operator.')],
      answer:"const hp = 40;\nconst hasPotion = true;\nif (hp < 50 && hasPotion) {\n  console.log('回復する');\n} else {\n  console.log('がまん');\n}" },
    { kind:'blind', task:"day が '土'。'土' または '日' なら「おやすみ」、それ以外は「がっこう」と表示しよう。",
      starter:"", expect:['おやすみ'], must:[m('\\|\\|','|| を使ってね','Use the || operator.')],
      answer:"const day = '土';\nif (day === '土' || day === '日') {\n  console.log('おやすみ');\n} else {\n  console.log('がっこう');\n}" }
  ]},

/* ---------- for ---------- */
{ id:'j05', course:'js', unit:'for', title:'for で増やす',
  point:'( ) の中は3つのパーツ：スタート ; 続ける条件 ; 1回ごとの変え方。',
  kata:"for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
  memo:"// i を 〇 からスタート\n// i が 〇 以下の間くり返す\n// 1回ごとに i を増やす\n//   i を表示",
  exp:"for (let i = 1; i <= 2; i++) {\n  console.log('今は ' + i);\n}",
  stages:[
    { kind:'fill', task:'1 から 5 まで表示しよう。？を埋めてね。',
      starter:"for (let i = ？; i ？ 5; i++) {\n  console.log(i);\n}\n", expect:range(1,5),
      answer:"for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}" },
    { kind:'look', task:'1 から 10 まで、1行ずつ表示しよう。', starter:"", expect:range(1,10), must:[USE_FOR],
      answer:"for (let i = 1; i <= 10; i++) {\n  console.log(i);\n}" },
    { kind:'blind', task:'0 から 20 まで、5 ずつ増やして表示しよう（0 5 10 15 20）。', starter:"", expect:range(0,20,5), must:[USE_FOR],
      answer:"for (let i = 0; i <= 20; i = i + 5) {\n  console.log(i);\n}" }
  ]},

{ id:'j06', course:'js', unit:'for', title:'for で減らす',
  point:'減らすときは3つセットで変える：スタートは大きい数、条件は >= 、変え方は i--。',
  kata:"for (let i = 3; i >= 1; i--) {\n  console.log(i);\n}",
  memo:"// i を 大きい数 からスタート\n// i が 〇 以上の間くり返す\n// 1回ごとに i を減らす",
  exp:"let i = 3;\ni--;\nconsole.log(i);  // いくつになる？",
  stages:[
    { kind:'fill', task:'「あと3日」「あと2日」「あと1日」と表示しよう。？を埋めてね。',
      starter:"for (let i = 3; i ？ 1; i？) {\n  console.log('あと' + i + '日');\n}\n", expect:['あと3日','あと2日','あと1日'],
      answer:"for (let i = 3; i >= 1; i--) {\n  console.log('あと' + i + '日');\n}" },
    { kind:'look', task:'10 から 1 まで、1 ずつ減らして表示しよう。', starter:"", expect:range(10,1,-1), must:[USE_FOR],
      answer:"for (let i = 10; i >= 1; i--) {\n  console.log(i);\n}" },
    { kind:'blind', task:'10 から 0 まで、2 ずつ減らして表示しよう。', starter:"", expect:range(10,0,-2), must:[USE_FOR],
      answer:"for (let i = 10; i >= 0; i = i - 2) {\n  console.log(i);\n}" }
  ]},

{ id:'j07', course:'js', unit:'for ＋ if', title:'倍数と FizzBuzz',
  point:'% は「わった余り」。余りが 0 なら、その数の倍数。いちばんせまい条件を上に書く。',
  kata:"for (let i = 1; i <= 15; i++) {\n  if (i % 3 === 0) {\n    …\n  } else {\n    …\n  }\n}",
  memo:"// 1から〇までくり返す\n//   もし 〇の倍数 なら 文字を表示\n//   そうでなければ 数字を表示",
  exp:"console.log(9 % 3);\nconsole.log(10 % 3);",
  stages:[
    { kind:'fill', task:'1 から 6 まで。3 の倍数のときだけ「サァン！」と表示しよう。？を埋めてね。',
      starter:"for (let i = 1; i <= 6; i++) {\n  if (i ？ 3 === 0) {\n    console.log('サァン！');\n  } else {\n    console.log(？);\n  }\n}\n",
      expect:['1','2','サァン！','4','5','サァン！'],
      answer:"for (let i = 1; i <= 6; i++) {\n  if (i % 3 === 0) {\n    console.log('サァン！');\n  } else {\n    console.log(i);\n  }\n}" },
    { kind:'look', task:'1 から 10 まで。2 の倍数なら「にゃん」、それ以外は数字を表示しよう。', starter:"",
      expect:range(1,10).map(s=> (+s%2===0)?'にゃん':s), must:[USE_FOR, USE_IF],
      answer:"for (let i = 1; i <= 10; i++) {\n  if (i % 2 === 0) {\n    console.log('にゃん');\n  } else {\n    console.log(i);\n  }\n}" },
    { kind:'blind', task:'FizzBuzz：1 から 15 まで。15 の倍数は FizzBuzz、3 の倍数は Fizz、5 の倍数は Buzz、それ以外は数字。', starter:"",
      expect:range(1,15).map(s=>{const i=+s; return i%15===0?'FizzBuzz':i%3===0?'Fizz':i%5===0?'Buzz':s;}), must:[USE_FOR, USE_IF],
      answer:"for (let i = 1; i <= 15; i++) {\n  if (i % 15 === 0) {\n    console.log('FizzBuzz');\n  } else if (i % 3 === 0) {\n    console.log('Fizz');\n  } else if (i % 5 === 0) {\n    console.log('Buzz');\n  } else {\n    console.log(i);\n  }\n}" }
  ]},

/* ---------- 配列 ---------- */
{ id:'j08', course:'js', unit:'配列', title:'配列の基本',
  point:'番号は 0 から。.length は中身の数。全部見るときの条件は < （<= ではない）。',
  kata:"const cats = ['茶マル', 'ミケ'];\nfor (let i = 0; i < cats.length; i++) {\n  console.log(cats[i]);\n}",
  memo:"// 配列を作る\n// i を 0 からスタート、i が 配列.length より小さい間\n//   配列[i] を表示",
  exp:"const a = ['あ', 'い', 'う'];\nconsole.log(a[0]);\nconsole.log(a.length);",
  stages:[
    { kind:'fill', task:'「ミケ」と「3」を表示しよう。？を埋めてね。',
      starter:"const cats = ['茶マル', 'ミケ', 'クロ'];\nconsole.log(cats[？]);\nconsole.log(cats.？);\n", expect:['ミケ','3'],
      answer:"const cats = ['茶マル', 'ミケ', 'クロ'];\nconsole.log(cats[1]);\nconsole.log(cats.length);" },
    { kind:'look', task:"fruits = ['りんご', 'バナナ', 'みかん'] を作って、for で全部表示しよう。", starter:"",
      expect:['りんご','バナナ','みかん'], must:[USE_FOR, m('\\.length','.length を使ってね','Use .length.')],
      answer:"const fruits = ['りんご', 'バナナ', 'みかん'];\nfor (let i = 0; i < fruits.length; i++) {\n  console.log(fruits[i]);\n}" },
    { kind:'blind', task:"空っぽの配列 todos に push で「洗濯」「買い物」「動画編集」を入れて、for で全部表示しよう。", starter:"",
      expect:['洗濯','買い物','動画編集'], must:[USE_FOR, m('\\.push\\s*\\(','push を使ってね','Use .push().')],
      answer:"const todos = [];\ntodos.push('洗濯');\ntodos.push('買い物');\ntodos.push('動画編集');\nfor (let i = 0; i < todos.length; i++) {\n  console.log(todos[i]);\n}" }
  ]},

{ id:'j09', course:'js', unit:'配列', title:'合計と平均',
  point:'① 0 の箱を for の外に作る ② for の中で中身を足す ③ for の外で使う。',
  kata:"let total = 0;\nfor (let i = 0; i < nums.length; i++) {\n  total = total + nums[i];\n}",
  memo:"// 配列を作る\n// 合計の箱を 0 で作る（for の外）\n// for で1つずつ見て、合計に 配列[i] を足す\n// for の外で表示",
  exp:"let total = 0;\ntotal = total + 3;\ntotal = total + 5;\nconsole.log(total);",
  stages:[
    { kind:'fill', task:'nums の合計を表示しよう。？を埋めてね。',
      starter:"const nums = [3, 5, 2];\nlet total = ？;\nfor (let i = 0; i < nums.length; i++) {\n  total = total + ？;\n}\nconsole.log(total);\n", expect:['10'],
      answer:"const nums = [3, 5, 2];\nlet total = 0;\nfor (let i = 0; i < nums.length; i++) {\n  total = total + nums[i];\n}\nconsole.log(total);" },
    { kind:'look', task:'prices = [100, 250, 80] の合計を表示しよう。', starter:"", expect:['430'], must:[USE_FOR],
      answer:"const prices = [100, 250, 80];\nlet total = 0;\nfor (let i = 0; i < prices.length; i++) {\n  total = total + prices[i];\n}\nconsole.log(total);" },
    { kind:'blind', task:'scores = [72, 85, 60, 91, 78] の平均を表示しよう（.length を使う）。', starter:"", expect:['77.2'],
      must:[USE_FOR, m('\\.length','人数は .length で出してね','Use .length for the count.')],
      answer:"const scores = [72, 85, 60, 91, 78];\nlet total = 0;\nfor (let i = 0; i < scores.length; i++) {\n  total = total + scores[i];\n}\nconsole.log(total / scores.length);" }
  ]},

{ id:'j10', course:'js', unit:'配列', title:'数える',
  point:'数えるときは「当てはまったら 1 を足す」。合計は「中身を足す」。',
  kata:"let count = 0;\nfor (let i = 0; i < nums.length; i++) {\n  if (nums[i] >= 60) {\n    count = count + 1;\n  }\n}",
  memo:"// 数える箱を 0 で作る\n// for で1つずつ見る\n//   もし 配列[i] が 条件 なら\n//     数える箱に 1 を足す\n// 表示",
  exp:"let count = 0;\ncount = count + 1;\ncount = count + 1;\nconsole.log(count);",
  stages:[
    { kind:'fill', task:'60 点以上の人数を表示しよう。？を埋めてね。',
      starter:"const scores = [80, 45, 90, 60, 30];\nlet count = 0;\nfor (let i = 0; i < scores.length; i++) {\n  if (？ >= 60) {\n    count = count + ？;\n  }\n}\nconsole.log(count);\n", expect:['3'],
      answer:"const scores = [80, 45, 90, 60, 30];\nlet count = 0;\nfor (let i = 0; i < scores.length; i++) {\n  if (scores[i] >= 60) {\n    count = count + 1;\n  }\n}\nconsole.log(count);" },
    { kind:'look', task:'views = [1200, 800, 3500, 500, 2000]。1000 以上の数を数えて「1000回以上の動画は3本」と表示しよう。', starter:"",
      expect:['1000回以上の動画は3本'], must:[USE_FOR, USE_IF],
      answer:"const views = [1200, 800, 3500, 500, 2000];\nlet count = 0;\nfor (let i = 0; i < views.length; i++) {\n  if (views[i] >= 1000) {\n    count = count + 1;\n  }\n}\nconsole.log('1000回以上の動画は' + count + '本');" },
    { kind:'blind', task:'nums = [10, 3, 8, 2, 7]。5 以上の数の「個数」と「合計」を、1行ずつ表示しよう（3 と 25）。', starter:"",
      expect:['3','25'], must:[USE_FOR, USE_IF],
      answer:"const nums = [10, 3, 8, 2, 7];\nlet count = 0;\nlet total = 0;\nfor (let i = 0; i < nums.length; i++) {\n  if (nums[i] >= 5) {\n    count = count + 1;\n    total = total + nums[i];\n  }\n}\nconsole.log(count);\nconsole.log(total);" }
  ]},

{ id:'j11', course:'js', unit:'配列', title:'いちばん大きい数',
  point:'「今のチャンピオン」の箱を作って、もっと大きいのが来たら入れ替える。',
  kata:"let max = 0;\nfor (let i = 0; i < nums.length; i++) {\n  if (nums[i] > max) {\n    max = nums[i];\n  }\n}",
  memo:"// チャンピオンの箱を作る\n// for で1つずつ見る\n//   もし 配列[i] が チャンピオンより大きい なら 入れ替える\n// 表示",
  exp:"let max = 40;\nif (90 > max) {\n  max = 90;\n}\nconsole.log(max);",
  stages:[
    { kind:'fill', task:'いちばん高い点数を表示しよう。？を埋めてね。',
      starter:"const scores = [40, 90, 70];\nlet max = 0;\nfor (let i = 0; i < scores.length; i++) {\n  if (scores[i] ？ max) {\n    max = ？;\n  }\n}\nconsole.log(max);\n", expect:['90'],
      answer:"const scores = [40, 90, 70];\nlet max = 0;\nfor (let i = 0; i < scores.length; i++) {\n  if (scores[i] > max) {\n    max = scores[i];\n  }\n}\nconsole.log(max);" },
    { kind:'look', task:'heights = [150, 172, 165, 180, 158] の中でいちばん大きい数を表示しよう。', starter:"", expect:['180'], must:[USE_FOR, USE_IF],
      answer:"const heights = [150, 172, 165, 180, 158];\nlet tallest = 0;\nfor (let i = 0; i < heights.length; i++) {\n  if (heights[i] > tallest) {\n    tallest = heights[i];\n  }\n}\nconsole.log(tallest);" },
    { kind:'blind', task:'temps = [12, 18, 9, 21, 15] の中でいちばん「小さい」数を表示しよう。チャンピオンの最初の中身に気をつけて。', starter:"", expect:['9'], must:[USE_FOR, USE_IF],
      answer:"const temps = [12, 18, 9, 21, 15];\nlet min = temps[0];\nfor (let i = 0; i < temps.length; i++) {\n  if (temps[i] < min) {\n    min = temps[i];\n  }\n}\nconsole.log(min);" }
  ]},

/* ---------- 二重for ---------- */
{ id:'j12', course:'js', unit:'二重for', title:'for の中に for',
  point:'外側が1回進むごとに、内側が全部回る。外側は i、内側は j。',
  kata:"for (let i = 1; i <= 2; i++) {\n  for (let j = 1; j <= 3; j++) {\n    console.log(i + '-' + j);\n  }\n}",
  memo:"// まず内側の for だけ書いて動かす\n// それを外側の for で包む\n// 内側の箱を j に、固定の数字を i に変える",
  exp:"for (let j = 1; j <= 3; j++) {\n  console.log('1-' + j);\n}",
  stages:[
    { kind:'fill', task:'1-1, 1-2, 1-3, 2-1, 2-2, 2-3 と表示しよう。？を埋めてね。',
      starter:"for (let i = 1; i <= 2; i++) {\n  for (let ？ = 1; j <= 3; j++) {\n    console.log(i + '-' + ？);\n  }\n}\n", expect:['1-1','1-2','1-3','2-1','2-2','2-3'],
      answer:"for (let i = 1; i <= 2; i++) {\n  for (let j = 1; j <= 3; j++) {\n    console.log(i + '-' + j);\n  }\n}" },
    { kind:'look', task:'九九の2の段と3の段を「2 × 1 = 2」の形で表示しよう。', starter:"",
      expect:[2,3].flatMap(i=>range(1,9).map(j=>i+' × '+j+' = '+(i*+j))), must:[USE_FOR],
      answer:"for (let i = 2; i <= 3; i++) {\n  for (let j = 1; j <= 9; j++) {\n    console.log(i + ' × ' + j + ' = ' + (i * j));\n  }\n}" },
    { kind:'blind', task:'1年1組, 1年2組, 2年1組 … 3年2組 と表示しよう（3学年 × 2クラス）。', starter:"",
      expect:[1,2,3].flatMap(i=>[1,2].map(j=>i+'年'+j+'組')), must:[USE_FOR],
      answer:"for (let i = 1; i <= 3; i++) {\n  for (let j = 1; j <= 2; j++) {\n    console.log(i + '年' + j + '組');\n  }\n}" }
  ]},

{ id:'j13', course:'js', unit:'二重for', title:'★をならべる',
  point:"空っぽの文字 '' に、+ で ★ をくっつけていく。行ごとに '' からやり直す。",
  kata:"let line = '';\nfor (let j = 1; j <= 3; j++) {\n  line = line + '★';\n}\nconsole.log(line);",
  memo:"// 外側：1行目から〇行目まで\n//   line を '' でスタート\n//   内側：★ を 〇 回くっつける\n//   1行できたら表示",
  exp:"let line = '';\nline = line + '★';\nline = line + '★';\nconsole.log(line);",
  stages:[
    { kind:'fill', task:'★★★ を1行表示しよう。？を埋めてね。',
      starter:"let line = '';\nfor (let j = 1; j <= 3; j++) {\n  line = ？ + '★';\n}\nconsole.log(line);\n", expect:['★★★'],
      answer:"let line = '';\nfor (let j = 1; j <= 3; j++) {\n  line = line + '★';\n}\nconsole.log(line);" },
    { kind:'look', task:'★★★ を3行表示しよう（四角）。', starter:"", expect:['★★★','★★★','★★★'], must:[USE_FOR],
      answer:"for (let i = 1; i <= 3; i++) {\n  let line = '';\n  for (let j = 1; j <= 3; j++) {\n    line = line + '★';\n  }\n  console.log(line);\n}" },
    { kind:'blind', task:'1行目に1個、2行目に2個 … 5行目に5個の三角形を表示しよう。', starter:"",
      expect:['★','★★','★★★','★★★★','★★★★★'], must:[USE_FOR],
      answer:"for (let i = 1; i <= 5; i++) {\n  let line = '';\n  for (let j = 1; j <= i; j++) {\n    line = line + '★';\n  }\n  console.log(line);\n}" }
  ]},

/* ---------- 関数 ---------- */
{ id:'j14', course:'js', unit:'関数', title:'関数と return',
  point:'function 名前(材料) { return 答え; } で作って、名前(材料) で使う。',
  kata:"function double(n) {\n  return n * 2;\n}\nconsole.log(double(5));",
  memo:"// function で名前と材料を決める\n// 中で答えを return する\n// 名前(材料) で呼んで表示",
  exp:"function hi() {\n  return 'やあ';\n}\nconsole.log(hi());",
  stages:[
    { kind:'fill', task:'「ゆずさん、こんにちは！」と表示しよう。？を埋めてね。',
      starter:"？ hello(name) {\n  ？ name + 'さん、こんにちは！';\n}\nconsole.log(hello('ゆず'));\n", expect:['ゆずさん、こんにちは！'],
      answer:"function hello(name) {\n  return name + 'さん、こんにちは！';\n}\nconsole.log(hello('ゆず'));" },
    { kind:'look', task:'n を2倍にする関数 double を作って、double(7) を表示しよう。', starter:"", expect:['14'],
      must:[m('function\\s+double','double という関数を作ってね','Define a function named double.'), m('return','return を使ってね','Use return.')],
      answer:"function double(n) {\n  return n * 2;\n}\nconsole.log(double(7));" },
    { kind:'blind', task:'底辺 w と高さ h から三角形の面積を返す関数 triangleArea を作って、triangleArea(3, 10) を表示しよう。', starter:"", expect:['15'],
      must:[m('function\\s+triangleArea','triangleArea という関数を作ってね','Define a function named triangleArea.'), m('return','return を使ってね','Use return.')],
      answer:"function triangleArea(w, h) {\n  return w * h / 2;\n}\nconsole.log(triangleArea(3, 10));" }
  ]},

{ id:'j15', course:'js', unit:'関数', title:'関数 ＋ for',
  point:'関数は1回作れば何回でも呼べる。for の i をそのまま材料に渡す。',
  kata:"for (let i = 1; i <= 3; i++) {\n  console.log(double(i));\n}",
  memo:"// 関数を作る\n// for でくり返す\n//   関数(i) を表示",
  exp:"function double(n) {\n  return n * 2;\n}\nconsole.log(double(1));\nconsole.log(double(2));",
  stages:[
    { kind:'fill', task:'2, 4, 6 と表示しよう。？を埋めてね。',
      starter:"function double(n) {\n  return n * 2;\n}\nfor (let i = 1; i <= 3; i++) {\n  console.log(？);\n}\n", expect:['2','4','6'],
      answer:"function double(n) {\n  return n * 2;\n}\nfor (let i = 1; i <= 3; i++) {\n  console.log(double(i));\n}" },
    { kind:'look', task:'3倍にする関数 triple を作って、1 〜 5 の3倍を表示しよう。', starter:"", expect:['3','6','9','12','15'],
      must:[m('function\\s+triple','triple という関数を作ってね','Define a function named triple.'), USE_FOR],
      answer:"function triple(n) {\n  return n * 3;\n}\nfor (let i = 1; i <= 5; i++) {\n  console.log(triple(i));\n}" },
    { kind:'blind', task:'税込み価格を Math.round で返す関数 tax を作って、100円・200円・300円を「100円の税込みは110円」の形で表示しよう。', starter:"",
      expect:['100円の税込みは110円','200円の税込みは220円','300円の税込みは330円'],
      must:[m('function\\s+tax','tax という関数を作ってね','Define a function named tax.'), USE_FOR],
      answer:"function tax(price) {\n  return Math.round(price * 1.1);\n}\nfor (let i = 100; i <= 300; i = i + 100) {\n  console.log(i + '円の税込みは' + tax(i) + '円');\n}" }
  ]},

/* ---------- オブジェクト ---------- */
{ id:'j16', course:'js', unit:'オブジェクト', title:'オブジェクトの基本',
  point:'{ 名前: 中身, 名前: 中身 } で作る。取り出すときは 箱.名前（. は「〜の」）。',
  kata:"const cat = {\n  name: '茶マル',\n  age: 11\n};\nconsole.log(cat.name);",
  memo:"// { } でオブジェクトを作る\n// 名前: 中身 を , で区切る\n// 箱.名前 で取り出してつなげる",
  exp:"const a = { x: 1 };\nconsole.log(a.x);",
  stages:[
    { kind:'fill', task:'「茶マルは11歳です」と表示しよう。？を埋めてね。',
      starter:"const cat = ？\n  name？ '茶マル',\n  age: 11\n？;\nconsole.log(cat？name + 'は' + cat.age + '歳です');\n", expect:['茶マルは11歳です'],
      answer:"const cat = {\n  name: '茶マル',\n  age: 11\n};\nconsole.log(cat.name + 'は' + cat.age + '歳です');" },
    { kind:'look', task:"dog（name は 'ポチ'、age は 3）を作って「ポチは3歳です」と表示しよう。", starter:"", expect:['ポチは3歳です'],
      must:[m('dog\\.name','dog.name を使ってね','Use dog.name.')],
      answer:"const dog = {\n  name: 'ポチ',\n  age: 3\n};\nconsole.log(dog.name + 'は' + dog.age + '歳です');" },
    { kind:'blind', task:"book（title は 'ねこの本'、price は 800）を作って、price を 100 上げてから「ねこの本は900円です」と表示しよう。", starter:"", expect:['ねこの本は900円です'],
      must:[m('book\\.price\\s*=','book.price を書きかえてね','Update book.price.')],
      answer:"const book = {\n  title: 'ねこの本',\n  price: 800\n};\nbook.price = book.price + 100;\nconsole.log(book.title + 'は' + book.price + '円です');" }
  ]},

{ id:'j17', course:'js', unit:'オブジェクト', title:'中に関数を入れる',
  point:'名前: function() { } で入れる。中で自分を使うときは オブジェクト名.〇〇。',
  kata:"const bank = {\n  coins: 10,\n  save: function() {\n    bank.coins = bank.coins + 5;\n  }\n};\nbank.save();",
  memo:"// オブジェクトに 数字の箱 と 関数 を入れる\n// 関数の中で 数字の箱 を書きかえる\n// 関数を呼ぶ\n// 表示",
  exp:"const a = {\n  n: 1,\n  up: function() { a.n = a.n + 1; }\n};\na.up();\nconsole.log(a.n);",
  stages:[
    { kind:'fill', task:'save を2回呼んで 20 と表示しよう。？を埋めてね。',
      starter:"const piggyBank = {\n  coins: 10,\n  save: ？() {\n    piggyBank.coins = ？ + 5;\n  }\n};\npiggyBank.？();\npiggyBank.？();\nconsole.log(piggyBank.coins);\n", expect:['20'],
      answer:"const piggyBank = {\n  coins: 10,\n  save: function() {\n    piggyBank.coins = piggyBank.coins + 5;\n  }\n};\npiggyBank.save();\npiggyBank.save();\nconsole.log(piggyBank.coins);" },
    { kind:'look', task:"player（name '太郎'、hp 100、hp を 30 減らす damage）を作って、damage を3回呼び「太郎の残りHPは10」と表示しよう。", starter:"",
      expect:['太郎の残りHPは10'], must:[m('damage\\s*:\\s*function','damage という関数を入れてね','Add a damage function.')],
      answer:"const player = {\n  name: '太郎',\n  hp: 100,\n  damage: function() {\n    player.hp = player.hp - 30;\n  }\n};\nplayer.damage();\nplayer.damage();\nplayer.damage();\nconsole.log(player.name + 'の残りHPは' + player.hp);" },
    { kind:'blind', task:"nyanko（name 'ゆず'、food 5、food を1減らす eat、3増やす buy）を作り、eat を2回・buy を1回呼んで「ゆずのごはんは残り6個」と表示しよう。", starter:"",
      expect:['ゆずのごはんは残り6個'], must:[m('eat\\s*:\\s*function','eat という関数を入れてね','Add an eat function.'), m('buy\\s*:\\s*function','buy という関数を入れてね','Add a buy function.')],
      answer:"const nyanko = {\n  name: 'ゆず',\n  food: 5,\n  eat: function() {\n    nyanko.food = nyanko.food - 1;\n  },\n  buy: function() {\n    nyanko.food = nyanko.food + 3;\n  }\n};\nnyanko.eat();\nnyanko.eat();\nnyanko.buy();\nconsole.log(nyanko.name + 'のごはんは残り' + nyanko.food + '個');" }
  ]},

/* ---------- 再帰 ---------- */
{ id:'j18', course:'js', unit:'再帰', title:'自分を呼ぶ関数',
  point:'関数の中で自分自身を呼ぶ。最初に「ここで止める」条件を必ず書く。',
  kata:"function countDown(n) {\n  if (n === 0) {\n    console.log('発射！');\n  } else {\n    console.log(n);\n    countDown(n - 1);\n  }\n}",
  memo:"// もし n が 0 なら 最後のことばを表示（終了条件）\n// そうでなければ n を表示して、n を減らして自分を呼ぶ",
  exp:"function f(n) {\n  console.log(n);\n  if (n > 1) {\n    f(n - 1);\n  }\n}\nf(2);",
  stages:[
    { kind:'fill', task:'3, 2, 1, 発射！と表示しよう。？を埋めてね。',
      starter:"function countDown(n) {\n  if (n === ？) {\n    console.log('発射！');\n  } else {\n    console.log(n);\n    ？(n - 1);\n  }\n}\ncountDown(3);\n", expect:['3','2','1','発射！'],
      answer:"function countDown(n) {\n  if (n === 0) {\n    console.log('発射！');\n  } else {\n    console.log(n);\n    countDown(n - 1);\n  }\n}\ncountDown(3);" },
    { kind:'look', task:'再帰関数 dayCount を作って、dayCount(3) で「あと3日」「あと2日」「あと1日」「当日！」と表示しよう。', starter:"",
      expect:['あと3日','あと2日','あと1日','当日！'], must:[m('function\\s+dayCount','dayCount という関数を作ってね','Define a function named dayCount.')],
      answer:"function dayCount(n) {\n  if (n === 0) {\n    console.log('当日！');\n  } else {\n    console.log('あと' + n + '日');\n    dayCount(n - 1);\n  }\n}\ndayCount(3);" },
    { kind:'blind', task:'再帰関数 rocket を作って、rocket(10) で 10, 8, 6, 4, 2, 発射！と表示しよう。', starter:"",
      expect:['10','8','6','4','2','発射！'], must:[m('function\\s+rocket','rocket という関数を作ってね','Define a function named rocket.')],
      answer:"function rocket(n) {\n  if (n === 0) {\n    console.log('発射！');\n  } else {\n    console.log(n);\n    rocket(n - 2);\n  }\n}\nrocket(10);" }
  ]}
];

/* =========================================================
   HTML
   ========================================================= */
const HTML = [
{ id:'h01', course:'html', unit:'HTML', title:'見出しと段落',
  point:'<h1> は大きい見出し、<p> は文章のまとまり。開きタグと閉じタグ（/）でかこむ。',
  kata:"<h1>見出し</h1>\n<p>文章</p>",
  memo:"<!-- 見出しを h1 でかこむ -->\n<!-- 文章を p でかこむ -->",
  exp:"<h1>テスト</h1>",
  stages:[
    { kind:'fill', task:'見出しに「ねこコード」、段落に「毎日すこしずつ」と書こう。？を埋めてね。',
      starter:"<h1>？</h1>\n<？>毎日すこしずつ</p>\n",
      checks:[{sel:'h1',text:'ねこコード'},{sel:'p',text:'毎日すこしずつ'}],
      answer:"<h1>ねこコード</h1>\n<p>毎日すこしずつ</p>" },
    { kind:'look', task:'h1 に「わたしの好きなもの」、h2 に「ねこ」、p に「ふわふわでかわいい」と書こう。', starter:"",
      checks:[{sel:'h1',text:'わたしの好きなもの'},{sel:'h2',text:'ねこ'},{sel:'p',text:'ふわふわでかわいい'}],
      answer:"<h1>わたしの好きなもの</h1>\n<h2>ねこ</h2>\n<p>ふわふわでかわいい</p>" },
    { kind:'blind', task:'h1 に「プロフィール」、その下に p を2つ（何を書いてもOK）。', starter:"",
      checks:[{sel:'h1',text:'プロフィール'},{sel:'p',count:2}],
      answer:"<h1>プロフィール</h1>\n<p>ねこが好きです</p>\n<p>プログラミングを勉強中です</p>" }
  ]},

{ id:'h02', course:'html', unit:'HTML', title:'リスト',
  point:'<ul> は点のリスト、<ol> は番号つきリスト。中の1つずつは <li>。',
  kata:"<ul>\n  <li>りんご</li>\n  <li>バナナ</li>\n</ul>",
  memo:"<!-- ul（または ol）で全体をかこむ -->\n<!-- 1つずつを li でかこむ -->",
  exp:"<ul>\n  <li>1つ目</li>\n</ul>",
  stages:[
    { kind:'fill', task:'「ねこ」「いぬ」「うさぎ」の3つのリストにしよう。？を埋めてね。',
      starter:"<？>\n  <li>ねこ</li>\n  <li>いぬ</li>\n  <？>うさぎ</li>\n</ul>\n",
      checks:[{sel:'ul',exists:true},{sel:'ul > li',count:3},{sel:'li:nth-child(3)',text:'うさぎ'}],
      answer:"<ul>\n  <li>ねこ</li>\n  <li>いぬ</li>\n  <li>うさぎ</li>\n</ul>" },
    { kind:'look', task:'好きな食べ物を3つ、ul のリストで書こう。', starter:"",
      checks:[{sel:'ul',exists:true},{sel:'ul > li',count:3}],
      answer:"<ul>\n  <li>カレー</li>\n  <li>おすし</li>\n  <li>プリン</li>\n</ul>" },
    { kind:'blind', task:'カップラーメンの作り方を、番号つきリスト（ol）で3ステップ書こう。', starter:"",
      checks:[{sel:'ol',exists:true},{sel:'ol > li',count:3}],
      answer:"<ol>\n  <li>ふたをあける</li>\n  <li>お湯を入れる</li>\n  <li>3分まつ</li>\n</ol>" }
  ]},

{ id:'h03', course:'html', unit:'HTML', title:'リンク',
  point:'<a href="行き先">文字</a>。href の中に URL を書く。',
  kata:"<a href=\"https://www.google.com/\">Google</a>",
  memo:"<!-- a タグを書く -->\n<!-- href=\"\" の中に行き先 -->\n<!-- タグの間に表示する文字 -->",
  exp:"<a href=\"https://example.com/\">ためし</a>",
  stages:[
    { kind:'fill', task:'「Google」という文字で https://www.google.com/ へのリンクを作ろう。？を埋めてね。',
      starter:"<a ？=\"https://www.google.com/\">？</a>\n",
      checks:[{sel:'a',attr:['href','https://www.google.com/']},{sel:'a',text:'Google'}],
      answer:"<a href=\"https://www.google.com/\">Google</a>" },
    { kind:'look', task:'「YouTube」という文字で https://www.youtube.com/ へのリンクを作ろう。', starter:"",
      checks:[{sel:'a',attr:['href','https://www.youtube.com/']},{sel:'a',text:'YouTube'}],
      answer:"<a href=\"https://www.youtube.com/\">YouTube</a>" },
    { kind:'blind', task:'ul のリストの中に、Google と YouTube へのリンクを1つずつ入れよう。', starter:"",
      checks:[{sel:'ul > li',count:2},{sel:'li a',count:2},{sel:'a[href="https://www.google.com/"]',exists:true},{sel:'a[href="https://www.youtube.com/"]',exists:true}],
      answer:"<ul>\n  <li><a href=\"https://www.google.com/\">Google</a></li>\n  <li><a href=\"https://www.youtube.com/\">YouTube</a></li>\n</ul>" }
  ]},

{ id:'h04', course:'html', unit:'HTML', title:'画像',
  point:'<img src="画像" alt="説明">。閉じタグはいらない。alt は画像が見えない人のための説明。',
  kata:"<img src=\"neko.png\" alt=\"ねこ\">",
  memo:"<!-- img タグを書く -->\n<!-- src に画像のファイル名 -->\n<!-- alt に説明 -->",
  exp:"<img src=\"a.png\" alt=\"ためし\">",
  stages:[
    { kind:'fill', task:'neko.png を表示して、説明（alt）を「ねこ」にしよう。？を埋めてね。',
      starter:"<img ？=\"neko.png\" alt=\"？\">\n",
      checks:[{sel:'img',attr:['src','neko.png']},{sel:'img',attr:['alt','ねこ']}],
      answer:"<img src=\"neko.png\" alt=\"ねこ\">" },
    { kind:'look', task:'cat.png を、alt「ねこの写真」、width 200 で表示しよう。', starter:"",
      checks:[{sel:'img',attr:['src','cat.png']},{sel:'img',attr:['alt','ねこの写真']},{sel:'img',attr:['width','200']}],
      answer:"<img src=\"cat.png\" alt=\"ねこの写真\" width=\"200\">" },
    { kind:'blind', task:'h2「うちのねこ」の下に、yuzu.png（alt「ゆず」）を表示しよう。', starter:"",
      checks:[{sel:'h2',text:'うちのねこ'},{sel:'img',attr:['src','yuzu.png']},{sel:'img',attr:['alt','ゆず']}],
      answer:"<h2>うちのねこ</h2>\n<img src=\"yuzu.png\" alt=\"ゆず\">" }
  ]},

{ id:'h05', course:'html', unit:'HTML', title:'class と id',
  point:'class は「グループの名前」（何回でも使える）。id は「1つだけの名前」。',
  kata:"<h1 id=\"title\">タイトル</h1>\n<p class=\"note\">メモ</p>",
  memo:"<!-- タグの中に class=\"名前\" または id=\"名前\" を書く -->",
  exp:"<p class=\"a\">ためし</p>",
  stages:[
    { kind:'fill', task:'p に class「note」を付けよう。？を埋めてね。',
      starter:"<p ？=\"note\">あしたは雨</p>\n",
      checks:[{sel:'p.note',exists:true}],
      answer:"<p class=\"note\">あしたは雨</p>" },
    { kind:'look', task:'h1「ねこコード」に id「title」を付けよう。', starter:"",
      checks:[{sel:'h1#title',text:'ねこコード'}],
      answer:"<h1 id=\"title\">ねこコード</h1>" },
    { kind:'blind', task:'ul の中に li を3つ作り、3つとも class「item」を付けよう。', starter:"",
      checks:[{sel:'ul > li.item',count:3}],
      answer:"<ul>\n  <li class=\"item\">1</li>\n  <li class=\"item\">2</li>\n  <li class=\"item\">3</li>\n</ul>" }
  ]},

{ id:'h06', course:'html', unit:'HTML', title:'入力とボタン',
  point:'<input> は入力欄（閉じタグなし）。<button> はボタン。placeholder は入力前のうすい文字。',
  kata:"<input type=\"text\" placeholder=\"なまえ\">\n<button>送る</button>",
  memo:"<!-- input を書いて type と placeholder を付ける -->\n<!-- button でかこんでボタンの文字を書く -->",
  exp:"<button>ためし</button>",
  stages:[
    { kind:'fill', task:'「送る」ボタンを作ろう。？を埋めてね。',
      starter:"<？>送る</button>\n",
      checks:[{sel:'button',text:'送る'}],
      answer:"<button>送る</button>" },
    { kind:'look', task:'placeholder が「なまえ」の入力欄（type="text"）を作ろう。', starter:"",
      checks:[{sel:'input',attr:['type','text']},{sel:'input',attr:['placeholder','なまえ']}],
      answer:"<input type=\"text\" placeholder=\"なまえ\">" },
    { kind:'blind', task:'placeholder「メッセージ」の入力欄と、「送信」ボタンを並べよう。', starter:"",
      checks:[{sel:'input',attr:['placeholder','メッセージ']},{sel:'button',text:'送信'}],
      answer:"<input type=\"text\" placeholder=\"メッセージ\">\n<button>送信</button>" }
  ]}
];

/* =========================================================
   CSS（HTML は固定。CSS だけ書く）
   ========================================================= */
const BASE_HTML = "<h1 id=\"title\">ねこコード</h1>\n<p class=\"note\">毎日すこしずつ</p>\n<p>ねことがんばる</p>\n<div class=\"box\">はこ</div>";
const CSS = [
{ id:'c01', course:'css', unit:'CSS', title:'文字の色',
  point:'セレクタ { プロパティ: 値; }。文字の色は color。',
  kata:"h1 {\n  color: red;\n}",
  memo:"/* 変えたいタグの名前を書く */\n/* { } の中に color: 色; */",
  exp:"h1 { color: blue; }",
  stages:[
    { kind:'fill', task:'h1 の文字を赤（red）にしよう。？を埋めてね。', html:BASE_HTML,
      starter:"h1 {\n  ？: red;\n}\n", checks:[{sel:'h1',style:['color','rgb(255, 0, 0)']}],
      answer:"h1 {\n  color: red;\n}" },
    { kind:'look', task:'p の文字をすべて青（blue）にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'p',style:['color','rgb(0, 0, 255)'],all:true}],
      answer:"p {\n  color: blue;\n}" },
    { kind:'blind', task:'h1 を緑（green）、p をグレー（gray）にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'h1',style:['color','rgb(0, 128, 0)']},{sel:'p',style:['color','rgb(128, 128, 128)'],all:true}],
      answer:"h1 {\n  color: green;\n}\np {\n  color: gray;\n}" }
  ]},

{ id:'c02', course:'css', unit:'CSS', title:'文字の大きさ',
  point:'文字の大きさは font-size。数字のうしろに px を付ける。',
  kata:"h1 {\n  font-size: 32px;\n}",
  memo:"/* セレクタを書く */\n/* font-size: 数字px; */",
  exp:"p { font-size: 10px; }",
  stages:[
    { kind:'fill', task:'h1 の文字の大きさを 32px にしよう。？を埋めてね。', html:BASE_HTML,
      starter:"h1 {\n  font-size: ？;\n}\n", checks:[{sel:'h1',style:['font-size','32px']}],
      answer:"h1 {\n  font-size: 32px;\n}" },
    { kind:'look', task:'p の文字の大きさを 20px にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'p',style:['font-size','20px'],all:true}],
      answer:"p {\n  font-size: 20px;\n}" },
    { kind:'blind', task:'h1 を 40px、p を 18px にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'h1',style:['font-size','40px']},{sel:'p',style:['font-size','18px'],all:true}],
      answer:"h1 {\n  font-size: 40px;\n}\np {\n  font-size: 18px;\n}" }
  ]},

{ id:'c03', course:'css', unit:'CSS', title:'背景と余白',
  point:'背景の色は background-color。内側の余白は padding、外側の余白は margin。',
  kata:".box {\n  background-color: yellow;\n  padding: 16px;\n}",
  memo:"/* .box を書く */\n/* 背景の色と余白を1行ずつ */",
  exp:".box { background-color: pink; }",
  stages:[
    { kind:'fill', task:'.box の背景を黄色（yellow）にしよう。？を埋めてね。', html:BASE_HTML,
      starter:".box {\n  ？: yellow;\n}\n", checks:[{sel:'.box',style:['background-color','rgb(255, 255, 0)']}],
      answer:".box {\n  background-color: yellow;\n}" },
    { kind:'look', task:'.box の背景をピンク（pink）、内側の余白を 16px にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'.box',style:['background-color','rgb(255, 192, 203)']},{sel:'.box',style:['padding-top','16px']}],
      answer:".box {\n  background-color: pink;\n  padding: 16px;\n}" },
    { kind:'blind', task:'.box の内側の余白を 20px、外側の余白を 10px にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'.box',style:['padding-top','20px']},{sel:'.box',style:['margin-top','10px']}],
      answer:".box {\n  padding: 20px;\n  margin: 10px;\n}" }
  ]},

{ id:'c04', course:'css', unit:'CSS', title:'class で選ぶ',
  point:'class は . （ドット）で選ぶ。class="note" なら .note。',
  kata:".note {\n  color: red;\n}",
  memo:"/* . のあとに class の名前 */\n/* { } の中に変えたいこと */",
  exp:".note { color: orange; }",
  stages:[
    { kind:'fill', task:'class が note の段落だけ赤（red）にしよう。？を埋めてね。', html:BASE_HTML,
      starter:"？note {\n  color: red;\n}\n", checks:[{sel:'.note',style:['color','rgb(255, 0, 0)']},{sel:'p:not(.note)',style:['color','rgb(0, 0, 0)']}],
      answer:".note {\n  color: red;\n}" },
    { kind:'look', task:'class が note の段落をオレンジ（orange）、太字（font-weight: bold）にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'.note',style:['color','rgb(255, 165, 0)']},{sel:'.note',style:['font-weight','700']}],
      answer:".note {\n  color: orange;\n  font-weight: bold;\n}" },
    { kind:'blind', task:'.note の文字をピンク（pink）、.box の背景を黒（black）、文字を白（white）にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'.note',style:['color','rgb(255, 192, 203)']},{sel:'.box',style:['background-color','rgb(0, 0, 0)']},{sel:'.box',style:['color','rgb(255, 255, 255)']}],
      answer:".note {\n  color: pink;\n}\n.box {\n  background-color: black;\n  color: white;\n}" }
  ]},

{ id:'c05', course:'css', unit:'CSS', title:'id で選ぶ',
  point:'id は # で選ぶ。id="title" なら #title。',
  kata:"#title {\n  color: blue;\n}",
  memo:"/* # のあとに id の名前 */\n/* { } の中に変えたいこと */",
  exp:"#title { color: pink; }",
  stages:[
    { kind:'fill', task:'id が title の見出しを青（blue）にしよう。？を埋めてね。', html:BASE_HTML,
      starter:"？title {\n  color: blue;\n}\n", checks:[{sel:'#title',style:['color','rgb(0, 0, 255)']}],
      answer:"#title {\n  color: blue;\n}" },
    { kind:'look', task:'#title の背景を黄色（yellow）、文字の大きさを 36px にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'#title',style:['background-color','rgb(255, 255, 0)']},{sel:'#title',style:['font-size','36px']}],
      answer:"#title {\n  background-color: yellow;\n  font-size: 36px;\n}" },
    { kind:'blind', task:'#title を緑（green）、.note を赤（red）にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'#title',style:['color','rgb(0, 128, 0)']},{sel:'.note',style:['color','rgb(255, 0, 0)']}],
      answer:"#title {\n  color: green;\n}\n.note {\n  color: red;\n}" }
  ]},

{ id:'c06', course:'css', unit:'CSS', title:'線と角丸',
  point:'線は border: 太さ 種類 色;。角を丸くするのは border-radius。',
  kata:".box {\n  border: 2px solid black;\n  border-radius: 8px;\n}",
  memo:"/* .box を書く */\n/* border: 太さ solid 色; */\n/* border-radius: 数字px; */",
  exp:".box { border: 1px solid red; }",
  stages:[
    { kind:'fill', task:'.box に 2px の黒い実線を付けよう。？を埋めてね。', html:BASE_HTML,
      starter:".box {\n  border: ？ solid black;\n}\n", checks:[{sel:'.box',style:['border-top-width','2px']},{sel:'.box',style:['border-top-style','solid']},{sel:'.box',style:['border-top-color','rgb(0, 0, 0)']}],
      answer:".box {\n  border: 2px solid black;\n}" },
    { kind:'look', task:'.box に 3px の青い実線を付けて、角を 8px 丸くしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'.box',style:['border-top-width','3px']},{sel:'.box',style:['border-top-color','rgb(0, 0, 255)']},{sel:'.box',style:['border-top-left-radius','8px']}],
      answer:".box {\n  border: 3px solid blue;\n  border-radius: 8px;\n}" },
    { kind:'blind', task:'.box に 4px のピンクの点線（dashed）を付けて、角を 16px 丸く、内側の余白を 12px にしよう。', html:BASE_HTML, starter:"",
      checks:[{sel:'.box',style:['border-top-width','4px']},{sel:'.box',style:['border-top-style','dashed']},{sel:'.box',style:['border-top-color','rgb(255, 192, 203)']},{sel:'.box',style:['border-top-left-radius','16px']},{sel:'.box',style:['padding-top','12px']}],
      answer:".box {\n  border: 4px dashed pink;\n  border-radius: 16px;\n  padding: 12px;\n}" }
  ]}
];

window.NekoProblems = { ALL: JS.concat(HTML, CSS), JS, HTML, CSS, BASE_HTML };
})();
