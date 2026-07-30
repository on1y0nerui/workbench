/* 健康模块：饮水 / 步数 / 睡眠 / 运动 / 心情 / 卡路里 + 一周趋势 */
(function () {
  const S = WB.store, U = WB.util;

  function getHealth() {
    return S.get('health', {
      goals: { steps: 8000, water: 8, sleep: 8, exercise: 30, calories: 2000 },
      days: {}
    });
  }
  function save(h) { S.set('health', h); }
  function today(h) {
    const k = U.todayKey();
    if (!h.days[k]) h.days[k] = { steps: 0, water: 0, sleep: 0, exercise: 0, mood: null, calories: { consumed: 0, burned: 0, foods: [] } };
    if (!h.days[k].calories) h.days[k].calories = { consumed: 0, burned: 0, foods: [] };
    return h.days[k];
  }

  const MOODS = [
    { e: '😣', v: 1, t: '很差' }, { e: '😕', v: 2, t: '不佳' },
    { e: '😐', v: 3, t: '一般' }, { e: '🙂', v: 4, t: '不错' },
    { e: '😄', v: 5, t: '很好' }
  ];

  function render(root) {
    const h = getHealth();
    const t = today(h);
    const g = h.goals;
    const c = t.calories;

    const pct = (v, goal) => Math.max(0, Math.min(100, Math.round((v / goal) * 100)));
    const net = c.consumed - c.burned;

    root.innerHTML = `
      <div class="card">
        <div class="card__head">
          <div class="card__title">💚 今日健康</div>
          <div class="card__sub">${U.todayKey()}</div>
        </div>

        <div class="grid grid--2">
          <div class="stat">
            <div class="stat__icon">💧</div>
            <div class="stat__num" id="hWater">${t.water}</div>
            <div class="stat__label">杯水 / 目标 ${g.water}</div>
          </div>
          <div class="stat">
            <div class="stat__icon">👟</div>
            <div class="stat__num" id="hSteps">${t.steps}</div>
            <div class="stat__label">步 / 目标 ${g.steps}</div>
          </div>
          <div class="stat">
            <div class="stat__icon">🌙</div>
            <div class="stat__num" id="hSleep">${t.sleep || 0}</div>
            <div class="stat__label">小时睡眠 / ${g.sleep}</div>
          </div>
          <div class="stat">
            <div class="stat__icon">🔥</div>
            <div class="stat__num" id="hEx">${t.exercise}</div>
            <div class="stat__label">分钟运动 / ${g.exercise}</div>
          </div>
        </div>

        <div class="spacer"></div>
        <div class="progress"><div class="progress__fill progress__fill--good" id="pWater" style="width:${pct(t.water, g.water)}%"></div></div>
        <div class="spacer"></div>
        <div class="progress"><div class="progress__fill" id="pSteps" style="width:${pct(t.steps, g.steps)}%"></div></div>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">🍱 今日卡路里</div>
          <div class="card__sub">目标 ${g.calories} kcal</div>
        </div>
        <div class="grid grid--3">
          <div class="stat">
            <div class="stat__icon">🍔</div>
            <div class="stat__num" id="hIn">${c.consumed}</div>
            <div class="stat__label">摄入</div>
          </div>
          <div class="stat">
            <div class="stat__icon">🏃</div>
            <div class="stat__num" id="hOut">${c.burned}</div>
            <div class="stat__label">消耗</div>
          </div>
          <div class="stat">
            <div class="stat__icon">⚖️</div>
            <div class="stat__num" id="hNet" style="color:${net > g.calories ? 'var(--danger)' : 'var(--good)'}">${net}</div>
            <div class="stat__label">净值</div>
          </div>
        </div>
        <div class="spacer"></div>
        <div class="progress"><div class="progress__fill progress__fill--good" id="pCal" style="width:${pct(c.consumed, g.calories)}%"></div></div>

        <div class="divider"></div>
        <div class="row" style="gap:8px;margin-bottom:10px">
          <input class="input" id="foodName" placeholder="食物，如 米饭" style="flex:1.5" />
          <input class="input" id="foodKcal" type="number" placeholder="kcal" style="flex:1;max-width:80px" />
          <button class="btn btn--soft" id="bAddFood">+</button>
        </div>
        <div class="list" id="foodList">
          ${c.foods.length ? c.foods.map((f, i) => `
            <div class="list__item">
              <div class="grow">${U.escape(f.name)}</div>
              <div class="faint">${f.kcal} kcal</div>
              <button class="chip chip--emoji" data-delfood="${i}">🗑️</button>
            </div>`).join('') : '<div class="empty">还没记录食物</div>'}
        </div>

        <div class="divider"></div>
        <div class="grid grid--2">
          <button class="btn btn--soft btn--block" id="bBurn">+100 运动消耗</button>
          <button class="btn btn--soft btn--block" id="bBurnCustom">自定义消耗</button>
        </div>
      </div>

      <div class="card">
        <div class="card__title" style="margin-bottom:10px">⚡ 快速记录</div>
        <div class="grid grid--2">
          <button class="btn btn--soft btn--block" id="bWater">+1 杯水</button>
          <button class="btn btn--soft btn--block" id="bSteps">+500 步</button>
          <button class="btn btn--soft btn--block" id="bEx">+5 分钟运动</button>
          <button class="btn btn--soft btn--block" id="bSleep">记录睡眠</button>
        </div>
        <div class="divider"></div>
        <div class="muted" style="font-size:13px;margin-bottom:8px">今天心情如何？</div>
        <div class="chips" id="moodChips">
          ${MOODS.map(m => `<button class="chip chip--emoji ${t.mood === m.v ? 'active' : ''}" data-m="${m.v}">${m.e}</button>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">📈 近 7 天趋势</div>
          <div class="card__sub">饮水(杯) · 步数(千)</div>
        </div>
        <div class="bars" id="bars"></div>
        <div class="divider"></div>
        <div class="muted" style="font-size:13px;margin-bottom:8px">⚙️ 每日目标</div>
        <div class="grid grid--2">
          <label class="row" style="gap:6px"><span class="faint" style="font-size:13px">饮水</span><input class="input" type="number" id="gWater" value="${g.water}" style="padding:6px 8px"></label>
          <label class="row" style="gap:6px"><span class="faint" style="font-size:13px">步数</span><input class="input" type="number" id="gSteps" value="${g.steps}" style="padding:6px 8px"></label>
          <label class="row" style="gap:6px"><span class="faint" style="font-size:13px">睡眠</span><input class="input" type="number" id="gSleep" value="${g.sleep}" style="padding:6px 8px"></label>
          <label class="row" style="gap:6px"><span class="faint" style="font-size:13px">运动</span><input class="input" type="number" id="gEx" value="${g.exercise}" style="padding:6px 8px"></label>
          <label class="row" style="gap:6px;grid-column:1/-1"><span class="faint" style="font-size:13px;white-space:nowrap">卡路里目标</span><input class="input" type="number" id="gCal" value="${g.calories}" style="padding:6px 8px"></label>
        </div>
      </div>
    `;

    drawBars(root, h);
    wire(root, h);
  }

  function drawBars(root, h) {
    const days = U.lastDays(7);
    const maxW = Math.max(8, ...days.map(k => (h.days[k]?.water) || 0));
    const maxS = Math.max(8, ...days.map(k => Math.round((h.days[k]?.steps || 0) / 1000)));
    const maxAll = Math.max(maxW, maxS);
    root.querySelector('#bars').innerHTML = days.map(k => {
      const w = h.days[k]?.water || 0;
      const s = Math.round((h.days[k]?.steps || 0) / 1000);
      const wh = Math.round((w / maxAll) * 100);
      const sh = Math.round((s / maxAll) * 100);
      const isToday = k === U.todayKey();
      return `
        <div class="bar">
          <div class="bar__col" title="饮水 ${w} 杯"><i style="height:${wh}%"></i></div>
          <div class="bar__col bar__col--good" title="步数 ${s} 千"><i style="height:${sh}%"></i></div>
          <div class="bar__day" style="${isToday ? 'color:var(--brand);font-weight:700' : ''}">${U.weekdayLabel(k)}</div>
        </div>`;
    }).join('');
  }

  function wire(root, h) {
    const t = today(h);
    const c = t.calories;
    const refresh = () => { render(root); };

    root.querySelector('#bWater').onclick = () => { t.water++; save(h); WB.toast('已记录 1 杯水 💧'); refresh(); };
    root.querySelector('#bSteps').onclick = () => { t.steps += 500; save(h); refresh(); };
    root.querySelector('#bEx').onclick = () => { t.exercise += 5; save(h); WB.toast('运动 +5 分钟 🔥'); refresh(); };
    root.querySelector('#bSleep').onclick = () => {
      const v = prompt('昨晚睡了几个小时？', t.sleep || h.goals.sleep);
      if (v !== null && !isNaN(v) && v >= 0) { t.sleep = Math.round(Number(v) * 10) / 10; save(h); refresh(); }
    };

    root.querySelectorAll('#moodChips .chip').forEach(ch => {
      ch.onclick = () => { t.mood = Number(ch.dataset.m); save(h); refresh(); };
    });

    root.querySelector('#bAddFood').onclick = () => {
      const name = root.querySelector('#foodName').value.trim();
      const kcal = Number(root.querySelector('#foodKcal').value);
      if (!name || isNaN(kcal) || kcal <= 0) { WB.toast('请填写食物和热量'); return; }
      c.foods.push({ name, kcal, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) });
      c.consumed += kcal;
      save(h); WB.toast('已记录 ' + kcal + ' kcal'); refresh();
    };

    root.querySelectorAll('#foodList [data-delfood]').forEach(b => {
      b.onclick = () => {
        const i = Number(b.dataset.delfood);
        const f = c.foods[i];
        if (f) { c.consumed = Math.max(0, c.consumed - f.kcal); c.foods.splice(i, 1); }
        save(h); refresh();
      };
    });

    root.querySelector('#bBurn').onclick = () => { c.burned += 100; save(h); WB.toast('运动消耗 +100 kcal'); refresh(); };
    root.querySelector('#bBurnCustom').onclick = () => {
      const v = prompt('消耗了多少 kcal？', '200');
      if (v !== null && !isNaN(v) && v >= 0) { c.burned += Number(v); save(h); refresh(); }
    };

    const saveGoals = () => {
      h.goals = {
        water: Number(root.querySelector('#gWater').value) || 8,
        steps: Number(root.querySelector('#gSteps').value) || 8000,
        sleep: Number(root.querySelector('#gSleep').value) || 8,
        exercise: Number(root.querySelector('#gEx').value) || 30,
        calories: Number(root.querySelector('#gCal').value) || 2000
      };
      save(h); WB.toast('目标已保存'); refresh();
    };
    ['#gWater', '#gSteps', '#gSleep', '#gEx', '#gCal'].forEach(s => {
      root.querySelector(s).addEventListener('change', saveGoals);
    });
  }

  WB.views = WB.views || {};
  WB.views.health = render;
})();
