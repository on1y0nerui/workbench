/* 韩语模块：闪卡背单词 + 间隔复习 + 连续打卡 */
(function () {
  const S = WB.store, U = WB.util;

  const DECK = [
    { ko: '안녕하세요', rom: 'annyeonghaseyo', zh: '你好', ex: '안녕하세요, 반갑습니다. (你好，很高兴认识你。)' },
    { ko: '감사합니다', rom: 'gamsahamnida', zh: '谢谢', ex: '도와주셔서 감사합니다. (谢谢你帮忙。)' },
    { ko: '사랑해요', rom: 'saranghaeyo', zh: '我爱你', ex: '제가 당신을 사랑해요. (我爱你。)' },
    { ko: '밥', rom: 'bap', zh: '饭', ex: '밥 먹었어요? (吃饭了吗？)' },
    { ko: '물', rom: 'mul', zh: '水', ex: '물 한 잔 주세요. (请给我一杯水。)' },
    { ko: '친구', rom: 'chingu', zh: '朋友', ex: '그는 제 친구예요. (他是我的朋友。)' },
    { ko: '학교', rom: 'hakgyo', zh: '学校', ex: '학교에 가요. (去学校。)' },
    { ko: '집', rom: 'jip', zh: '家', ex: '집에 가고 싶어요. (想回家。)' },
    { ko: '시간', rom: 'sigan', zh: '时间', ex: '시간이 있어요? (有时间吗？)' },
    { ko: '오늘', rom: 'oneul', zh: '今天', ex: '오늘 날씨 좋아요. (今天天气真好。)' },
    { ko: '내일', rom: 'naeil', zh: '明天', ex: '내일 만나요. (明天见。)' },
    { ko: '이름', rom: 'ireum', zh: '名字', ex: '이름이 뭐예요? (你叫什么名字？)' },
    { ko: '좋아요', rom: 'joayo', zh: '好 / 喜欢', ex: '이 영화 좋아요. (这部电影很好看。)' },
    { ko: '미안해요', rom: 'mianhaeyo', zh: '对不起', ex: '늦어서 미안해요. (抱歉迟到了。)' },
    { ko: '도서관', rom: 'doseogwan', zh: '图书馆', ex: '도서관에서 공부해요. (在图书馆学习。)' },
    { ko: '커피', rom: 'keopi', zh: '咖啡', ex: '커피 한 잔 할래요? (来杯咖啡吗？)' },
    { ko: '운동', rom: 'undong', zh: '运动', ex: '매일 운동해요. (每天运动。)' },
    { ko: '음악', rom: 'eumak', zh: '音乐', ex: '음악 들어요. (听音乐。)' },
    { ko: '행복', rom: 'haengbok', zh: '幸福', ex: '행복하세요. (祝你幸福。)' },
    { ko: '꿈', rom: 'kkum', zh: '梦 / 梦想', ex: '꿈을 꿔요. (做梦 / 有梦想。)' },
    { ko: '일', rom: 'il', zh: '工作 / 事', ex: '일이 많아요. (事情很多。)' },
    { ko: '쉬다', rom: 'swida', zh: '休息', ex: '잠깐 쉬어요. (休息一下吧。)' },
    { ko: '맛있어요', rom: 'masisseoyo', zh: '好吃', ex: '정말 맛있어요! (真好吃！)' },
    { ko: '아파요', rom: 'apayo', zh: '疼 / 不舒服', ex: '머리가 아파요. (头疼。)' },
    { ko: '예쁘다', rom: 'yeppeuda', zh: '漂亮', ex: '예쁜 꽃이에요. (漂亮的花。)' },
    { ko: '크다', rom: 'keuda', zh: '大', ex: '집이 커요. (房子很大。)' },
    { ko: '작다', rom: 'jakda', zh: '小', ex: '손이 작아요. (手很小。)' },
    { ko: '많다', rom: 'manhda', zh: '多', ex: '사람이 많아요. (人很多。)' },
    { ko: '빨리', rom: 'ppalli', zh: '快', ex: '빨리 가요! (快走！)' },
    { ko: '천천히', rom: 'cheoncheonhi', zh: '慢', ex: '천천히 말해요. (慢慢说。)' }
  ];

  /* ---------- 发音（Web Speech API TTS） ---------- */
  let koVoice = null;
  function pickVoice() {
    if (koVoice) return koVoice;
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    koVoice = vs.find(v => /ko[-_]KR/i.test(v.lang)) || vs.find(v => /^ko/i.test(v.lang)) || null;
    return koVoice;
  }
  // 部分浏览器 getVoices() 初始为空，需要等 voiceschanged 事件
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  WB.speakKo = function (text) {
    if (!window.speechSynthesis || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 0.9;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  };

  function getK() {
    let k = S.get('korean', null);
    if (!k) {
      k = {
        words: DECK.map((w, i) => ({ id: 'w' + i, ...w, box: 0, due: 0, last: 0, known: false })),
        streak: 0, lastStudy: null, learnedToday: 0
      };
      S.set('korean', k);
    }
    return k;
  }
  function save(k) { S.set('korean', k); }

  // 间隔复习：box 越大复习间隔越长；未知则回到 box 0
  const BOX_DAYS = [0, 1, 3, 7, 16, 30];
  function dueWords(k) {
    const now = Date.now();
    return k.words.filter(w => w.due <= now);
  }

  function render(root) {
    const k = getK();
    const due = dueWords(k);
    const knownCount = k.words.filter(w => w.known).length;
    const total = k.words.length;

    root.innerHTML = `
      <div class="card">
        <div class="card__head">
          <div class="card__title">📚 韩语学习</div>
          <div class="card__sub">连续打卡 <b style="color:var(--korea)">${k.streak}</b> 天</div>
        </div>
        <div class="grid grid--3">
          <div class="stat"><div class="stat__icon">🔁</div><div class="stat__num">${due.length}</div><div class="stat__label">待复习</div></div>
          <div class="stat"><div class="stat__icon">✅</div><div class="stat__num">${knownCount}</div><div class="stat__label">已掌握</div></div>
          <div class="stat"><div class="stat__icon">📖</div><div class="stat__num">${total}</div><div class="stat__label">词库</div></div>
        </div>
        <div class="spacer"></div>
        <button class="btn btn--block" id="startStudy">${due.length ? '开始复习 (' + due.length + ')' : '自由练习'}</button>
      </div>

      <div class="card" id="studyCard" style="display:none">
        <div class="flash" id="flash">
          <button class="flash__speak" id="speakKo" title="朗读发音">🔊</button>
          <div class="flash__ko" id="fKo">안녕하세요</div>
          <div class="flash__rom" id="fRom">annyeonghaseyo</div>
          <div class="flash__zh" id="fZh" style="display:none"></div>
          <div class="flash__ex" id="fEx" style="display:none"></div>
          <div class="flash__hint" id="fHint">点击卡片看释义</div>
        </div>
        <div class="grid grid--2" style="margin-top:12px">
          <button class="btn btn--ghost" id="markNo">😵 还不熟</button>
          <button class="btn" id="markYes">😎 记住了</button>
        </div>
        <div class="faint" style="text-align:center;font-size:12px;margin-top:8px" id="studyProgress"></div>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:10px">➕ 添加我的生词</div>
        <div class="row" style="gap:8px;margin-bottom:8px">
          <input class="input" id="addKo" placeholder="韩文 (예: 행복)" />
          <input class="input" id="addZh" placeholder="中文" style="max-width:42%" />
        </div>
        <input class="input" id="addRom" placeholder="罗马音 (haengbok，可留空)" style="margin-bottom:8px" />
        <button class="btn btn--soft btn--block" id="addWord">添加到词库</button>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:10px">📋 全部单词</div>
        <div class="list" id="wordList"></div>
      </div>
    `;

    renderWordList(root, k);
    wire(root, k);
  }

  function renderWordList(root, k) {
    const el = root.querySelector('#wordList');
    if (!el) return;
    el.innerHTML = k.words.map(w => `
      <div class="list__item ${w.known ? 'done' : ''}">
        <button class="chip chip--emoji" data-speak="${w.id}" title="朗读发音">🔊</button>
        <div class="grow">
          <div style="font-weight:700">${U.escape(w.ko)} <span class="faint" style="font-weight:400;font-size:12px">${U.escape(w.rom || '')}</span></div>
          <div class="faint" style="font-size:12px">${U.escape(w.zh)}</div>
        </div>
        <button class="chip chip--emoji" data-toggle="${w.id}" title="标记掌握">${w.known ? '✅' : '○'}</button>
        <button class="chip chip--emoji" data-del="${w.id}" title="删除">🗑️</button>
      </div>`).join('');

    el.querySelectorAll('[data-speak]').forEach(b => b.onclick = () => {
      const w = k.words.find(x => x.id === b.dataset.speak);
      if (w) { WB.speakKo(w.ko); WB.toast('🔊 ' + w.ko); }
    });
    el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const w = k.words.find(x => x.id === b.dataset.toggle);
      w.known = !w.known; if (w.known) w.box = Math.max(w.box, 3);
      save(k); render(root);
    });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (confirm('从词库删除这个单词？')) { k.words = k.words.filter(x => x.id !== b.dataset.del); save(k); render(root); }
    });
  }

  function startStudy(root, k) {
    let queue = dueWords(k).length ? dueWords(k).slice() : k.words.slice();
    if (!queue.length) queue = k.words.slice();
    let idx = 0, flipped = false;

    root.querySelector('#studyCard').style.display = 'block';
    root.querySelector('#startStudy').textContent = '复习中…';

    const flash = root.querySelector('#flash');
    const show = () => {
      const w = queue[idx];
      flipped = false;
      root.querySelector('#fKo').textContent = w.ko;
      root.querySelector('#fRom').textContent = w.rom || '';
      root.querySelector('#fZh').style.display = 'none';
      root.querySelector('#fEx').style.display = 'none';
      root.querySelector('#fZh').textContent = w.zh;
      root.querySelector('#fEx').textContent = w.ex || '';
      root.querySelector('#fHint').textContent = '点击卡片看释义 · 🔊 听发音';
      root.querySelector('#studyProgress').textContent = `第 ${idx + 1} / ${queue.length} 个`;
      WB.speakKo(w.ko);
    };

    flash.querySelector('#speakKo').onclick = (e) => {
      e.stopPropagation();
      const w = queue[idx];
      WB.speakKo(w.ko);
    };

    flash.onclick = () => {
      flipped = true;
      root.querySelector('#fZh').style.display = 'block';
      root.querySelector('#fEx').style.display = 'block';
      root.querySelector('#fHint').textContent = '记住了就点 😎，否则点 😵';
    };

    const advance = (remembered) => {
      const w = queue[idx];
      w.last = Date.now();
      if (remembered) { w.known = true; w.box = Math.min(5, w.box + 1); }
      else { w.box = 0; w.known = false; }
      w.due = Date.now() + BOX_DAYS[w.box] * 86400000;
      // 打卡逻辑
      const tk = U.todayKey();
      if (k.lastStudy !== tk) { k.streak = (k.lastStudy === prevDay(tk)) ? k.streak + 1 : 1; k.lastStudy = tk; k.learnedToday = 0; }
      k.learnedToday++;
      save(k);
      idx++;
      if (idx >= queue.length) {
        root.querySelector('#studyCard').style.display = 'none';
        WB.toast(`完成！本次复习 ${queue.length} 个 👏`);
        render(root);
      } else { show(); }
    };

    root.querySelector('#markYes').onclick = () => advance(true);
    root.querySelector('#markNo').onclick = () => advance(false);
    show();
    const sc = root.querySelector('#studyCard');
    if (sc.scrollIntoView) sc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function prevDay(key) {
    const [y, m, d] = key.split('-').map(Number);
    const x = new Date(y, m - 1, d); x.setDate(x.getDate() - 1);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  function wire(root, k) {
    root.querySelector('#startStudy').onclick = () => startStudy(root, k);

    root.querySelector('#addWord').onclick = () => {
      const ko = root.querySelector('#addKo').value.trim();
      const zh = root.querySelector('#addZh').value.trim();
      const rom = root.querySelector('#addRom').value.trim();
      if (!ko || !zh) { WB.toast('请填写韩文和中文'); return; }
      k.words.push({ id: U.uid(), ko, rom, zh, ex: '', box: 0, due: 0, last: 0, known: false });
      save(k); WB.toast('已加入词库 📚'); render(root);
    };
  }

  WB.views = WB.views || {};
  WB.views.korean = render;
})();
