/* 启动台：连接手机里不同 APP 的快捷入口（URL Scheme / 深链唤起原生应用） */
(function () {
  const S = WB.store, U = WB.util;

  const DEFAULT_APPS = [
    { id: 'a_threads', name: 'Threads', icon: '🧵', color: '#e8e6e1', scheme: 'barcelona://', url: 'https://www.threads.net' },
    { id: 'a_music', name: '音乐', icon: '🎵', color: '#e8e6e1', scheme: 'music://', url: 'https://music.apple.com' },
    { id: 'a_xhs', name: '小红书', icon: '📕', color: '#e8e6e1', scheme: 'xhsdiscover://', url: 'https://www.xiaohongshu.com' },
    { id: 'a_douyin', name: '抖音', icon: '🎵', color: '#e8e6e1', scheme: 'snssdk1128://', url: 'https://www.douyin.com' },
    { id: 'a_duo', name: '多邻国', icon: '🦉', color: '#e8e6e1', scheme: 'duolingo://', url: 'https://www.duolingo.com' },
    { id: 'a_notes', name: '备忘录', icon: '📝', color: '#e8e6e1', scheme: 'mobilenotes://', url: '' },
    { id: 'a_168', name: '168轻断食', icon: '⏱️', color: '#e8e6e1', scheme: 'leaphealth168://', url: 'https://apps.apple.com/cn/app/id1498018285' }
  ];

  function getApps() {
    let a = S.get('apps', null);
    if (!a) { a = DEFAULT_APPS.slice(); S.set('apps', a); }
    return a;
  }
  function save(a) { S.set('apps', a); }

  function launch(app) {
    // iOS Safari / PWA 里最可靠的唤起方式：直接用 window.location.href 跳 scheme
    if (app.scheme) {
      WB.toast('正在打开 ' + app.name + ' …');
      const start = Date.now();
      window.location.href = app.scheme;
      // 若 scheme 没唤起 App（页面仍停留），1.2s 后回退到网页 / 应用商店
      if (app.url) {
        setTimeout(() => {
          // 如果 App 成功打开，页面会被挂起，setTimeout 实际触发时已经过去很久
          if (Date.now() - start < 2500) {
            window.location.href = app.url;
          }
        }, 1200);
      }
      return;
    }
    if (app.url) {
      window.open(app.url, '_blank', 'noopener');
      WB.toast('已打开 ' + app.name);
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
          提示：iOS 应用需提前安装并支持 URL Scheme；安卓可改用 App Links。若无法直接唤起，会退回到网页版或应用商店页面。
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
        <div class="card__title" style="margin-bottom:10px">🗑️ 管理 / 编辑 Scheme</div>
        <div class="faint" style="font-size:12px;margin-bottom:8px;line-height:1.6">
          如果某个 App 唤起失败，点「编辑」把正确的 URL Scheme 填进去。
        </div>
        <div class="list" id="manageList">
          ${apps.map(a => `
            <div class="list__item">
              <div class="app-tile__icon" style="background:${a.color};width:36px;height:36px;font-size:18px;border-radius:10px">${a.icon}</div>
              <div class="grow">${U.escape(a.name)}</div>
              <button class="btn btn--ghost btn--sm" data-edit="${a.id}">编辑</button>
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

    root.querySelectorAll('#manageList [data-edit]').forEach(b => {
      b.onclick = () => {
        const a = apps.find(x => x.id === b.dataset.edit);
        if (!a) return;
        const scheme = prompt('修改 ' + a.name + ' 的 URL Scheme（留空则只走兜底网页）：', a.scheme || '');
        if (scheme === null) return;
        const url = prompt('修改兜底网页 / App Store 地址（留空则无兜底）：', a.url || '');
        if (url === null) return;
        a.scheme = scheme.trim(); a.url = url.trim();
        save(apps); WB.toast('已更新 ' + a.name); render(root);
      };
    });

    root.querySelectorAll('#manageList [data-del]').forEach(b => {
      b.onclick = () => { apps = apps.filter(a => a.id !== b.dataset.del); save(apps); render(root); };
    });
  }

  function randColor() {
    const c = ['#e8e6e1', '#dddad4', '#d2cfc9', '#e2dfda', '#e5e2dc', '#d8d5cf'];
    return c[Math.floor(Math.random() * c.length)];
  }

  WB.views = WB.views || {};
  WB.views.launcher = render;

  WB.launchApp = launch;
  WB.getApps = function () { return getApps(); };
})();
