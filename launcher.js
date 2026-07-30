/* 启动台：连接手机里不同 APP 的快捷入口（URL Scheme / 深链唤起原生应用） */
(function () {
  const S = WB.store, U = WB.util;

  const DEFAULT_APPS = [
    { id: 'a_duo', name: '多邻国', icon: '🦉', color: '#58cc02', scheme: 'duolingo://', url: 'https://www.duolingo.com' },
    { id: 'a_168', name: '168轻断食', icon: '⏱️', color: '#ff7a59', scheme: '', url: 'https://apps.apple.com/cn/app/168%E8%BD%BB%E6%96%AD%E9%A3%9F-%E9%97%B4%E6%AD%87%E6%80%A7%E6%96%AD%E9%A3%9F%E8%BF%BD%E8%B8%AA%E5%99%A8/id1498018285' },
    { id: 'a_wx', name: '微信', icon: '💬', color: '#2aae67', scheme: 'weixin://', url: 'https://weixin.qq.com' },
    { id: 'a_cal', name: '日历', icon: '📅', color: '#ff9f43', scheme: 'calshow://', url: '' },
    { id: 'a_note', name: '备忘录', icon: '📝', color: '#54a0ff', scheme: 'mobilenotes://', url: '' },
    { id: 'a_map', name: '地图', icon: '🗺️', color: '#1dd1a1', scheme: 'maps://', url: 'https://maps.google.com' },
    { id: 'a_music', name: '音乐', icon: '🎵', color: '#ee5253', scheme: 'music://', url: 'https://music.apple.com' },
    { id: 'a_health', name: '健康', icon: '❤️', color: '#ff6b81', scheme: 'x-apple-health://', url: '' },
    { id: 'a_browser', name: '浏览器', icon: '🌐', color: '#5f27cd', scheme: '', url: 'https://www.bing.com' },
    { id: 'a_camera', name: '相机', icon: '📷', color: '#576574', scheme: 'camera://', url: '' }
  ];

  function getApps() {
    let a = S.get('apps', null);
    if (!a) { a = DEFAULT_APPS.slice(); S.set('apps', a); }
    return a;
  }
  function save(a) { S.set('apps', a); }

  function launch(app) {
    if (app.url && /^https?:/i.test(app.url)) {
      window.open(app.url, '_blank', 'noopener');
      WB.toast('已打开 ' + app.name);
      return;
    }
    if (app.scheme) {
      WB.toast('正在尝试唤起 ' + app.name + ' …');
      const ifr = document.createElement('iframe');
      ifr.style.display = 'none';
      ifr.src = app.scheme;
      document.body.appendChild(ifr);
      setTimeout(() => ifr.remove(), 2500);
      if (app.url) setTimeout(() => window.open(app.url, '_blank', 'noopener'), 900);
      return;
    }
    WB.toast('该快捷方式未设置打开地址');
  }

  function render(root) {
    const apps = getApps();
    root.innerHTML = `
      <div class="hero">
        <div class="hero__hi">📱 启动台</div>
        <div class="hero__name" style="font-size:18px">一键唤起你手机里的应用</div>
        <div class="hero__pills">
          <span class="pill">⚡ 快速开始</span>
          <span class="pill">🔗 深链唤起</span>
        </div>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:12px">我的应用 (${apps.length})</div>
        <div class="grid grid--3" id="appGrid">
          ${apps.map(a => `
            <div class="app-tile" data-id="${a.id}">
              <div class="app-tile__icon" style="background:${a.color}">${a.icon}</div>
              <div class="app-tile__name">${U.escape(a.name)}</div>
            </div>`).join('')}
        </div>
        <div class="faint" style="font-size:12px;margin-top:12px;line-height:1.6">
          提示：iOS 应用需提前安装并支持 URL Scheme；安卓可改用 App Links。若无法直接唤起，将退回到网页版或应用商店页面。
        </div>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:10px">➕ 添加快捷方式</div>
        <div class="row" style="gap:8px;margin-bottom:8px">
          <input class="input" id="nName" placeholder="名称，如 钉钉" style="flex:2" />
          <input class="input" id="nIcon" placeholder="图标 emoji" style="flex:1;max-width:64px;text-align:center" />
        </div>
        <input class="input" id="nScheme" placeholder="URL Scheme（如 dingtalk://）可留空" style="margin-bottom:8px" />
        <input class="input" id="nUrl" placeholder="网页地址（https://…）作为兜底，可留空" style="margin-bottom:10px" />
        <button class="btn btn--soft btn--block" id="addApp">添加</button>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:10px">🗑️ 管理</div>
        <div class="list" id="manageList">
          ${apps.map(a => `
            <div class="list__item">
              <div class="app-tile__icon" style="background:${a.color};width:36px;height:36px;font-size:18px;border-radius:10px">${a.icon}</div>
              <div class="grow">${U.escape(a.name)}</div>
              <button class="btn btn--danger btn--sm" data-del="${a.id}">删除</button>
            </div>`).join('')}
        </div>
      </div>
    `;
    wire(root, apps);
  }

  function wire(root, apps) {
    root.querySelector('#appGrid').querySelectorAll('.app-tile').forEach(t => {
      t.onclick = () => {
        const app = apps.find(a => a.id === t.dataset.id);
        if (app) launch(app);
      };
    });

    root.querySelector('#addApp').onclick = () => {
      const name = root.querySelector('#nName').value.trim();
      const icon = root.querySelector('#nIcon').value.trim() || '📲';
      const scheme = root.querySelector('#nScheme').value.trim();
      const url = root.querySelector('#nUrl').value.trim();
      if (!name) { WB.toast('请填写名称'); return; }
      apps.push({ id: U.uid(), name, icon, color: randColor(), scheme, url });
      save(apps); WB.toast('已添加 ' + name); render(root);
    };

    root.querySelectorAll('#manageList [data-del]').forEach(b => {
      b.onclick = () => { apps = apps.filter(a => a.id !== b.dataset.del); save(apps); render(root); };
    });
  }

  function randColor() {
    const c = ['#4f7cff', '#2bb673', '#f5a623', '#ef5b6b', '#9b59b6', '#1dd1a1', '#ee5253', '#576574'];
    return c[Math.floor(Math.random() * c.length)];
  }

  WB.views = WB.views || {};
  WB.views.launcher = render;

  /* 供主页「一键打开」复用 */
  WB.launchApp = launch;
  WB.getApps = function () { return getApps(); };
})();
