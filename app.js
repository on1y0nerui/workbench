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
        <div class="hero__name">${U.todayKey().slice(5)} · 准备好了吗？</div>
        <div class="hero__pills">
          <span class="pill">💚 饮水 ${t.water}/${g.water}</span>
          <span class="pill">👟 ${t.steps} 步</span>
          <span class="pill">📚 打卡 ${streak} 天</span>
        </div>
      </div>

      <div class="grid grid--2" style="margin-bottom:14px">
        <button class="app-tile" data-go="health">
          <div class="app-tile__icon" style="background:linear-gradient(150deg,#2bb673,#57d99a)">💚</div>
          <div class="app-tile__name">记录健康</div>
        </button>
        <button class="app-tile" data-go="korean">
          <div class="app-tile__icon" style="background:linear-gradient(150deg,#e8553e,#ff7a5c)">📚</div>
          <div class="app-tile__name">学韩语</div>
        </button>
        <button class="app-tile" data-go="launcher">
          <div class="app-tile__icon" style="background:linear-gradient(150deg,#4f7cff,#7aa0ff)">📱</div>
          <div class="app-tile__name">打开应用</div>
        </button>
        <button class="app-tile" data-go="relax">
          <div class="app-tile__icon" style="background:linear-gradient(150deg,#1dd1a1,#54a0ff)">🌿</div>
          <div class="app-tile__name">放松</div>
        </button>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">🚀 一键打开应用</div>
          <button class="chip btn--sm" data-go="launcher" style="border:none;background:var(--brand-soft);color:var(--brand)">管理</button>
        </div>
        <div class="chips" id="homeApps"></div>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">💚 今日健康进度</div>
          <button class="chip btn--sm" data-go="health" style="border:none;background:var(--brand-soft);color:var(--brand)">去记录</button>
        </div>
        ${miniBar('💧 饮水', t.water, g.water, pct(t.water, g.water), 'progress__fill--good')}
        ${miniBar('👟 步数', t.steps, g.steps, pct(t.steps, g.steps), '')}
        ${miniBar('🌙 睡眠', t.sleep || 0, g.sleep, pct(t.sleep || 0, g.sleep), '')}
        ${miniBar('🍱 卡路里净值', net, g.calories, pct(Math.abs(net), g.calories), net > g.calories ? 'progress__fill--korea' : 'progress__fill--good')}
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">📚 直接学韩语</div>
          <button class="chip btn--sm" data-go="korean" style="border:none;background:var(--korea);color:#fff">去学习</button>
        </div>
        <div class="row row--between" style="margin-bottom:8px">
          <span class="muted">连续打卡 <b style="color:var(--korea);font-size:18px">${streak}</b> 天</span>
          <span class="pill" style="background:var(--brand-soft);color:var(--brand)">${due} 个待复习</span>
        </div>
        <button class="btn btn--block" id="startKorean">开始今日复习</button>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">✅ 待办</div>
          <button class="chip btn--sm" data-go="more" style="border:none;background:var(--brand-soft);color:var(--brand)">全部</button>
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

  /* ---------- 导航 ---------- */
  function navigate(view) {
    const root = document.getElementById('view');
    const fn = WB.views[view];
    if (!fn) return;
    root.innerHTML = '';
    fn(root);
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
    document.getElementById('appTitle').textContent = TITLES[view] || '工作台';
    root.scrollTop = 0;
    window.scrollTo(0, 0);
    try {
      if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    } catch (e) {
      // file:// 等受限环境忽略 hash 更新
    }
  }

  function boot() {
    document.getElementById('themeToggle').onclick = WB.toggleTheme;
    document.querySelectorAll('.tab').forEach(t => t.onclick = () => navigate(t.dataset.view));
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
