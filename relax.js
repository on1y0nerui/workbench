/* 放松模块：X/Twitter、呼吸练习、推荐文章、私密链接 */
(function () {
  const S = WB.store, U = WB.util;

  const ARTICLES = [
    { title: '为什么我们应该多无聊一点', url: 'https://www.bbc.com/ideas/play/why-boredom-is-good-for-you' },
    { title: '生活是一幅画，但你只活在像素里', url: 'https://waitbutwhy.com/2013/11/life-is-picture-but-you-live-in-pixel.html' },
    { title: '十年学会编程', url: 'http://norvig.com/21-days.html' },
    { title: 'Paul Graham：如何做自己喜欢的事', url: 'http://paulgraham.com/love.html' },
    { title: '睡眠科学：为什么你需要它', url: 'https://www.nih.gov/news-events/nih-research-matters/brain-may-flush-out-toxins-during-sleep' }
  ];

  function getRelax() {
    return S.get('relax', { links: [] });
  }
  function save(r) { S.set('relax', r); }

  function openTwitter() {
    if (WB.launchApp) {
      const apps = WB.getApps ? WB.getApps() : [];
      const t = apps.find(a => a.id === 'a_threads');
      if (t) WB.launchApp(t); else window.open('https://x.com', '_blank', 'noopener');
    } else { window.open('https://x.com', '_blank', 'noopener'); }
  }

  function openMusic() {
    if (WB.launchApp) {
      const apps = WB.getApps ? WB.getApps() : [];
      const m = apps.find(a => a.id === 'a_music');
      if (m) WB.launchApp(m); else window.open('https://music.apple.com', '_blank', 'noopener');
    } else { window.open('https://music.apple.com', '_blank', 'noopener'); }
  }

  function render(root) {
    const r = getRelax();
    root.innerHTML = `
      <div class="hero">
        <div class="hero__hi">🌿 放松</div>
        <div class="hero__name" style="font-size:18px">休息一下，清空大脑</div>
        <div class="hero__pills">
          <span class="pill">🐦 X/Twitter</span>
          <span class="pill">🌬️ 呼吸</span>
          <span class="pill">🔒 私密链接</span>
        </div>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:12px">⚡ 快速打开</div>
        <div class="grid grid--2">
          <button class="app-tile" id="openX">
            <div class="app-tile__icon" style="background:#000">𝕏</div>
            <div class="app-tile__name">X / Twitter</div>
          </button>
          <button class="app-tile" id="openMusic">
            <div class="app-tile__icon" style="background:#ff2d55">🎵</div>
            <div class="app-tile__name">音乐</div>
          </button>
        </div>
      </div>

      <div class="card" style="text-align:center">
        <div class="card__title" style="margin-bottom:12px">🌬️ 盒式呼吸</div>
        <div id="breathBox" style="width:120px;height:120px;border-radius:50%;background:linear-gradient(150deg,var(--brand),#7aa0ff);margin:0 auto 14px;display:grid;place-items:center;color:#fff;font-weight:700;transition:transform 4s ease-in-out,opacity 4s">吸气</div>
        <button class="btn btn--soft" id="breathBtn">开始 4 分钟呼吸</button>
        <div class="faint" style="font-size:12px;margin-top:10px">吸气 4 秒 → 屏息 4 秒 → 呼气 4 秒 → 屏息 4 秒</div>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:10px">📖 推荐文章</div>
        <div class="list" id="articleList"></div>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">🔒 我的私密链接</div>
          <div class="card__sub">仅存在你手机里</div>
        </div>
        <div class="row" style="gap:8px;margin-bottom:10px">
          <input class="input" id="linkName" placeholder="名称" style="flex:1.5" />
          <input class="input" id="linkUrl" placeholder="https://…" style="flex:2" />
          <button class="btn btn--soft" id="addLink">+</button>
        </div>
        <div class="list" id="linkList">
          ${r.links.length ? '' : '<div class="empty">这里可以放任何只属于你的链接</div>'}
        </div>
      </div>
    `;

    wire(root, r);
  }

  function wire(root, r) {
    root.querySelector('#openX').onclick = openTwitter;
    root.querySelector('#openMusic').onclick = openMusic;

    // 推荐文章
    const al = root.querySelector('#articleList');
    ARTICLES.forEach(a => {
      const it = document.createElement('a');
      it.className = 'list__item'; it.href = a.url; it.target = '_blank'; it.rel = 'noopener';
      it.style.textDecoration = 'none'; it.style.color = 'inherit';
      it.innerHTML = `<div class="grow">${U.escape(a.title)}</div><div class="faint">↗</div>`;
      al.appendChild(it);
    });

    // 呼吸练习
    const box = root.querySelector('#breathBox');
    let running = false, timer = null;
    const cycle = ['吸气', '屏息', '呼气', '屏息'];
    let step = 0;
    const next = () => {
      box.textContent = cycle[step];
      if (step === 0) { box.style.transform = 'scale(1.5)'; box.style.opacity = '1'; }
      else if (step === 1) { box.style.transform = 'scale(1.5)'; box.style.opacity = '1'; }
      else if (step === 2) { box.style.transform = 'scale(1)'; box.style.opacity = '0.6'; }
      else { box.style.transform = 'scale(1)'; box.style.opacity = '0.6'; }
      step = (step + 1) % 4;
    };
    root.querySelector('#breathBtn').onclick = () => {
      if (running) { clearInterval(timer); running = false; box.style.transform = 'scale(1)'; box.style.opacity = '1'; box.textContent = '吸气'; root.querySelector('#breathBtn').textContent = '开始 4 分钟呼吸'; return; }
      running = true; next(); root.querySelector('#breathBtn').textContent = '停止';
      timer = setInterval(next, 4000);
    };

    // 私密链接
    const ll = root.querySelector('#linkList');
    const drawLinks = () => {
      ll.innerHTML = r.links.length ? '' : '<div class="empty">这里可以放任何只属于你的链接</div>';
      r.links.forEach((l, i) => {
        const it = document.createElement('div'); it.className = 'list__item';
        it.innerHTML = `<a class="grow" href="${U.escape(l.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">${U.escape(l.name)} <span class="faint" style="font-size:12px">${U.escape(l.url)}</span></a><button class="chip chip--emoji" data-dellink="${i}">🗑️</button>`;
        ll.appendChild(it);
      });
      ll.querySelectorAll('[data-dellink]').forEach(b => b.onclick = () => { r.links.splice(Number(b.dataset.dellink), 1); save(r); drawLinks(); });
    };
    drawLinks();

    root.querySelector('#addLink').onclick = () => {
      const name = root.querySelector('#linkName').value.trim();
      let url = root.querySelector('#linkUrl').value.trim();
      if (!name || !url) { WB.toast('请填写名称和链接'); return; }
      if (!/^https?:/i.test(url)) url = 'https://' + url;
      r.links.push({ name, url }); save(r); WB.toast('已添加');
      root.querySelector('#linkName').value = ''; root.querySelector('#linkUrl').value = '';
      drawLinks();
    };
  }

  WB.views = WB.views || {};
  WB.views.relax = render;
})();
