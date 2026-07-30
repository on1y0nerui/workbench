/* 启动 / 导航 / 主页总览 */
(function () {
  const S = WB.store, U = WB.util;

  const TITLES = { home: '工作台', health: '健康', korean: '韩语', launcher: '启动台', relax: '放松', more: '我的' };

  /* 主题 */
  WB.toggleTheme = function () {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    S.set('theme', cur);
  };
  (function initTheme() {
    const t = S.get('theme', 'light');
    document.documentElement.setAttribute('data-theme', t);
  })();

  /* ---------- 顶部栏渲染 ---------- */
  function topBarStyle() { return S.get('topBarStyle', 'journal'); }

  WB.renderAppBar = function () {
    const bar = document.getElementById('appBar');
    const style = topBarStyle();
    bar.className = 'app-bar app-bar--' + style;

    if (style === 'journal') {
      // 日记式：左图标（开抽屉）、中状态、右设置（跳我的）
      const dateStr = U.todayKey().slice(5).replace('-', '/');
      const status = `${dateStr} · ${U.greet()}`;
      bar.innerHTML = `
        <div class="app-bar__left"><button class="icon-btn" id="menuBtn" aria-label="菜单">📒</button></div>
        <div class="app-bar__status" id="appStatus">${U.escape(status)}</div>
        <div class="app-bar__right"><button class="icon-btn" id="settingsBtn" aria-label="设置">⚙️</button></div>
      `;
    } else {
      // 导航式：左汉堡、中标题、右主题
      bar.innerHTML = `
        <button class="icon-btn" id="menuBtn" aria-label="菜单">☰</button>
        <div class="app-bar__title" id="appTitle">工作台</div>
        <button class="icon-btn" id="themeToggle" aria-label="切换主题">🌗</button>
      `;
    }
    wireAppBar();
    updateNavTitle();
  };

  function wireAppBar() {
    const tgl = document.getElementById('themeToggle');
    if (tgl) tgl.onclick = WB.toggleTheme;
    const menu = document.getElementById('menuBtn');
    if (menu) menu.onclick = openDrawer;
    const settings = document.getElementById('settingsBtn');
    if (settings) settings.onclick = () => navigate('more');
  }

  function updateNavTitle(view) {
    const v = view || currentView();
    const titleEl = document.getElementById('appTitle');
    if (titleEl) titleEl.textContent = TITLES[v] || '工作台';
  }

  function currentView() {
    return location.hash.replace('#', '') || 'home';
  }

  /* ---------- 主页 ---------- */
  function home(root) {
    const h = S.get('health', { goals: { steps: 8000, water: 8, sleep: 8, exercise: 30, calories: 2000 }, days: {} });
    const k = S.get('korean', null);
    const tk = U.todayKey();
    const t = (h.days && h.days[tk]) || { steps: 0, water: 0, sleep: 0, exercise: 0, mood: null, calories: { consumed: 0, burned: 0 } };
    const g = h.goals || { steps: 8000, water: 8, sleep: 8, exercise: 30, calories: 2000 };
    const streak = k ? k.streak : 0;
    const due = k ? k.words.filter(w => w.due <= Date.now()).length : 0;
    const todo = S.get('todo', []);
    const todoTop = todo.slice(0, 3);
    const net = (t.calories?.consumed || 0) - (t.calories?.burned || 0);

    const pct = (v, goal) => Math.max(0, Math.min(100, Math.round((v / goal) * 100)));

    root.innerHTML = `
      <div class="hero">
        <div class="hero__hi">${U.greet()} 👋</div>
        <div class="hero__name">${U.todayKey().slice(5)} · 今天想做点什么？</div>
        <div class="hero__pills">
          <span class="pill">饮水 ${t.water}/${g.water}</span>
          <span class="pill">${t.steps} 步</span>
          <span class="pill">打卡 ${streak} 天</span>
        </div>
      </div>

      <div class="grid grid--2" style="margin-bottom:14px">
        <button class="app-tile" data-go="health">
          <div class="app-tile__icon" style="background:#8fd460">💚</div>
          <div class="app-tile__name">记录健康</div>
        </button>
        <button class="app-tile" data-go="korean">
          <div class="app-tile__icon" style="background:#ff8a6a">📚</div>
          <div class="app-tile__name">学韩语</div>
        </button>
        <button class="app-tile" data-go="launcher">
          <div class="app-tile__icon" style="background:#f5a623">📱</div>
          <div class="app-tile__name">打开应用</div>
        </button>
        <button class="app-tile" data-go="relax">
          <div class="app-tile__icon" style="background:#7ec8e3">🌿</div>
          <div class="app-tile__name">放松</div>
        </button>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">🚀 一键打开应用</div>
          <button class="chip btn--sm" data-go="launcher">管理</button>
        </div>
        <div class="chips" id="homeApps"></div>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">💚 今日健康进度</div>
          <button class="chip btn--sm" data-go="health">去记录</button>
        </div>
        ${miniBar('💧 饮水', t.water, g.water, pct(t.water, g.water), 'progress__fill--good')}
        ${miniBar('👟 步数', t.steps, g.steps, pct(t.steps, g.steps), '')}
        ${miniBar('🌙 睡眠', t.sleep || 0, g.sleep, pct(t.sleep || 0, g.sleep), '')}
        ${miniBar('🍱 卡路里净值', net, g.calories, pct(Math.abs(net), g.calories), net > g.calories ? 'progress__fill--korea' : 'progress__fill--good')}
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">📚 直接学韩语</div>
          <button class="chip btn--sm" data-go="korean" style="background:var(--korea-soft);color:var(--korea)">去学习</button>
        </div>
        <div class="row row--between" style="margin-bottom:8px">
          <span class="muted">连续打卡 <b style="color:var(--korea);font-size:18px">${streak}</b> 天</span>
          <span class="pill">${due} 个待复习</span>
        </div>
        <button class="btn btn--block" id="startKorean">开始今日复习</button>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">✅ 待办</div>
          <button class="chip btn--sm" data-go="more">全部</button>
        </div>
        ${todoTop.length ? '<div class="list">' + todoTop.map(x => `<div class="list__item ${x.done ? 'done' : ''}"><div class="grow">${U.escape(x.text)}</div>${x.done ? '✅' : '○'}</div>`).join('') + '</div>' : '<div class="empty">暂无待办，去「我的」添加</div>'}
      </div>
    `;

    root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => navigate(b.dataset.go));
    root.querySelector('#startKorean').onclick = () => navigate('korean');

    const apps = (WB.getApps && WB.getApps()) || [];
    const ha = root.querySelector('#homeApps');
    if (ha) {
      ha.innerHTML = apps.map(a => `<button class="chip" data-app="${a.id}">${a.icon} ${U.escape(a.name)}</button>`).join('');
      ha.querySelectorAll('[data-app]').forEach(b => b.onclick = () => {
        const app = apps.find(x => x.id === b.dataset.app);
        if (app && WB.launchApp) WB.launchApp(app);
      });
    }
  }

  function miniBar(label, v, goal, p, cls) {
    return `<div style="margin-bottom:10px">
      <div class="row row--between" style="font-size:13px;margin-bottom:4px"><span class="muted">${label}</span><span class="faint">${v} / ${goal}</span></div>
      <div class="progress"><div class="progress__fill ${cls}" style="width:${p}%"></div></div>
    </div>`;
  }

  WB.views = WB.views || {};
  WB.views.home = home;

  /* ---------- 抽屉导航 ---------- */
  function openDrawer() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('backdrop').classList.add('open');
  }
  function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('backdrop').classList.remove('open');
  }

  /* ---------- 导航 ---------- */
  function navigate(view) {
    const root = document.getElementById('view');
    const fn = WB.views[view];
    if (!fn) return;
    root.innerHTML = '';
    fn(root);
    document.querySelectorAll('.drawer__item').forEach(t => t.classList.toggle('active', t.dataset.view === view));
    updateNavTitle(view);
    root.scrollTop = 0;
    window.scrollTo(0, 0);
    closeDrawer();
    try {
      if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    } catch (e) {
      // file:// 等受限环境忽略 hash 更新
    }
  }

  function boot() {
    WB.renderAppBar();
    document.getElementById('drawerClose').onclick = closeDrawer;
    document.getElementById('backdrop').onclick = closeDrawer;
    document.querySelectorAll('.drawer__item').forEach(t => t.onclick = () => navigate(t.dataset.view));
    window.addEventListener('hashchange', () => {
      const v = location.hash.replace('#', '');
      if (v && WB.views[v]) navigate(v);
    });
    const initial = location.hash.replace('#', '');
    navigate(WB.views[initial] ? initial : 'home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
