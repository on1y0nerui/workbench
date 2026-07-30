/* 我的：专注计时 / 随手笔记 / 待办清单 / 数据导出 */
(function () {
  const S = WB.store, U = WB.util;

  /* ---------- 专注计时 ---------- */
  function focusSection(root) {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.innerHTML = `
      <div class="card__head"><div class="card__title">⏱️ 专注计时</div></div>
      <div class="timer">
        <div class="timer__clock" id="clock">25:00</div>
        <div class="timer__modes">
          <button class="chip" data-min="25">专注 25</button>
          <button class="chip" data-min="5">休息 5</button>
          <button class="chip" data-min="15">小憩 15</button>
        </div>
        <div class="grid grid--2">
          <button class="btn" id="fStart">开始</button>
          <button class="btn btn--soft" id="fReset">重置</button>
        </div>
      </div>`;
    let total = 25 * 60, left = total, timer = null, running = false;

    const clock = () => wrap.querySelector('#clock');
    const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const tick = () => {
      left--; clock().textContent = fmt(left);
      if (left <= 0) { clearInterval(timer); running = false; wrap.querySelector('#fStart').textContent = '开始';
        WB.toast('时间到！休息一下 ☕'); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
    };
    wrap.querySelector('#fStart').onclick = () => {
      if (running) { clearInterval(timer); running = false; wrap.querySelector('#fStart').textContent = '继续'; }
      else { running = true; wrap.querySelector('#fStart').textContent = '暂停'; timer = setInterval(tick, 1000); }
    };
    wrap.querySelector('#fReset').onclick = () => { clearInterval(timer); running = false; left = total; clock().textContent = fmt(left); wrap.querySelector('#fStart').textContent = '开始'; };
    wrap.querySelectorAll('[data-min]').forEach(b => b.onclick = () => {
      clearInterval(timer); running = false; total = Number(b.dataset.min) * 60; left = total;
      clock().textContent = fmt(left); wrap.querySelector('#fStart').textContent = '开始';
    });
    return wrap;
  }

  /* ---------- 待办清单 ---------- */
  function todoSection(root) {
    const wrap = document.createElement('div'); wrap.className = 'card';
    let list = S.get('todo', []);
    const draw = () => {
      wrap.innerHTML = `
        <div class="card__head"><div class="card__title">✅ 待办清单</div><div class="card__sub">${list.filter(t => t.done).length}/${list.length}</div></div>
        <div class="row" style="gap:8px;margin-bottom:10px">
          <input class="input" id="todoIn" placeholder="添加一件要做的事…" />
          <button class="btn btn--sm" id="todoAdd">添加</button>
        </div>
        <div class="list" id="todoList">${list.length ? '' : '<div class="empty">还没有待办，添加一件吧</div>'}</div>`;
      const ul = wrap.querySelector('#todoList');
      list.forEach((t, i) => {
        const it = document.createElement('div'); it.className = 'list__item' + (t.done ? ' done' : '');
        it.innerHTML = `<div class="grow">${U.escape(t.text)}</div><button class="chip chip--emoji" data-d="${i}">${t.done ? '✅' : '○'}</button><button class="chip chip--emoji" data-x="${i}">🗑️</button>`;
        ul.appendChild(it);
      });
      wrap.querySelector('#todoAdd').onclick = add;
      wrap.querySelector('#todoIn').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
      ul.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { list[Number(b.dataset.d)].done = !list[Number(b.dataset.d)].done; S.set('todo', list); draw(); });
      ul.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { list.splice(Number(b.dataset.x), 1); S.set('todo', list); draw(); });
    };
    const add = () => {
      const v = wrap.querySelector('#todoIn').value.trim();
      if (!v) return; list.unshift({ text: v, done: false }); S.set('todo', list); draw();
    };
    draw();
    return wrap;
  }

  /* ---------- 随手笔记 ---------- */
  function notesSection(root) {
    const wrap = document.createElement('div'); wrap.className = 'card';
    let notes = S.get('notes', []);
    const draw = () => {
      wrap.innerHTML = `
        <div class="card__head"><div class="card__title">📝 随手笔记</div></div>
        <textarea class="textarea" id="noteIn" placeholder="随时记下想法…"></textarea>
        <button class="btn btn--soft btn--block" id="noteAdd" style="margin:8px 0 12px">保存这条笔记</button>
        <div class="list" id="noteList">${notes.length ? '' : '<div class="empty">还没有笔记</div>'}</div>`;
      const ul = wrap.querySelector('#noteList');
      notes.forEach((n, i) => {
        const it = document.createElement('div'); it.className = 'list__item';
        it.innerHTML = `<div class="grow"><div>${U.escape(n.text)}</div><div class="faint" style="font-size:11px">${n.time}</div></div><button class="chip chip--emoji" data-x="${i}">🗑️</button>`;
        ul.appendChild(it);
      });
      wrap.querySelector('#noteAdd').onclick = () => {
        const v = wrap.querySelector('#noteIn').value.trim(); if (!v) return;
        notes.unshift({ text: v, time: new Date().toLocaleString('zh-CN', { hour12: false }) });
        S.set('notes', notes); draw();
      };
      ul.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { notes.splice(Number(b.dataset.x), 1); S.set('notes', notes); draw(); });
    };
    draw();
    return wrap;
  }

  function render(root) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const barStyle = S.get('topBarStyle', 'journal');
    root.innerHTML = `<div class="card">
        <div class="card__head"><div class="card__title">⚙️ 我的工作台</div></div>
        <div class="row row--between" style="margin-bottom:10px">
          <span class="muted">深色模式</span>
          <button class="btn btn--ghost btn--sm" id="themeBtn">${isDark ? '🌙 深色' : '☀️ 浅色'} 切换</button>
        </div>
        <div class="row row--between" style="margin-bottom:10px;align-items:flex-start">
          <span class="muted">顶部栏样式</span>
          <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
            <button class="chip ${barStyle === 'journal' ? 'active' : ''}" id="barJournal">📒 日记式</button>
            <button class="chip ${barStyle === 'nav' ? 'active' : ''}" id="barNav">☰ 导航式</button>
          </div>
        </div>
        <div class="faint" style="font-size:12px;margin-bottom:12px;line-height:1.6">
          日记式：左侧图标、中间日期问候、右侧设置；导航式：左侧汉堡、中间标题、右侧主题切换。
        </div>
        <div class="divider"></div>
        <button class="btn btn--soft btn--block" id="exportBtn">⬇️ 导出全部数据 (JSON)</button>
        <button class="btn btn--soft btn--block" id="clearBtn" style="margin-top:8px;color:var(--danger)">🧹 清空所有本地数据</button>
        <div class="faint" style="font-size:12px;margin-top:12px;line-height:1.6">
          所有数据仅保存在本机浏览器（localStorage），不会上传到任何服务器。把本页面「添加到主屏幕」即可像 App 一样使用。
        </div>
      </div>`;

    root.appendChild(focusSection(root));
    root.appendChild(todoSection(root));
    root.appendChild(notesSection(root));

    root.querySelector('#themeBtn').onclick = () => { WB.toggleTheme(); render(root); };
    root.querySelector('#barJournal').onclick = () => { S.set('topBarStyle', 'journal'); if (WB.renderAppBar) WB.renderAppBar(); WB.toast('已切换为日记式顶部栏'); render(root); };
    root.querySelector('#barNav').onclick = () => { S.set('topBarStyle', 'nav'); if (WB.renderAppBar) WB.renderAppBar(); WB.toast('已切换为导航式顶部栏'); render(root); };
    root.querySelector('#exportBtn').onclick = exportData;
    root.querySelector('#clearBtn').onclick = () => {
      if (confirm('确定清空所有本地数据？此操作不可恢复。')) {
        Object.keys(localStorage).filter(k => k.startsWith('wb.')).forEach(k => localStorage.removeItem(k));
        WB.toast('已清空'); location.reload();
      }
    };
  }

  function exportData() {
    const data = {};
    Object.keys(localStorage).filter(k => k.startsWith('wb.')).forEach(k => {
      try { data[k.replace('wb.', '')] = JSON.parse(localStorage.getItem(k)); } catch (e) { data[k] = localStorage.getItem(k); }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `workbench-backup-${U.todayKey()}.json`;
    a.click();
    WB.toast('已导出备份');
  }

  WB.views = WB.views || {};
  WB.views.more = render;
})();
