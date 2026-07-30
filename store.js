/* 数据层：基于 localStorage 的轻量存储 + 通用工具 */
window.WB = window.WB || {};

WB.store = (function () {
  const PREFIX = 'wb.';
  function get(key, def) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? def : JSON.parse(v);
    } catch (e) {
      return def;
    }
  }
  function set(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
  }
  function remove(key) { localStorage.removeItem(PREFIX + key); }
  return { get, set, remove };
})();

/* 通用工具 */
WB.util = {
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  // 返回从今天往前 n 天的日期 key 数组（含今天），从旧到新
  lastDays(n) {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`);
    }
    return out;
  },
  weekdayLabel(key) {
    const names = ['日', '一', '二', '三', '四', '五', '六'];
    const [y, m, d] = key.split('-').map(Number);
    return names[new Date(y, m - 1, d).getDay()];
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
  greet() {
    const h = new Date().getHours();
    if (h < 5) return '夜深了';
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  },
  escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};

/* 全局提示 */
WB.toast = function (msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(WB._t);
  WB._t = setTimeout(() => el.classList.remove('show'), 1800);
};
