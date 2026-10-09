(function () {
  'use strict';
  const D = FamilyDates, config = DASHBOARD_CONFIG;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateText = d => `${d.year} 年 ${d.month} 月 ${d.day} 日`;
  const number = n => new Intl.NumberFormat('en-US').format(n);
  const illustration = `<svg class="garden" viewBox="0 0 330 290" role="img" aria-label="小花、太阳和缓缓生长的枝叶"><defs><pattern id="stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)"><path d="M0 0v6" stroke="#f9f5e8" stroke-width="2"/></pattern></defs><ellipse cx="162" cy="257" rx="136" ry="17" fill="#d6d7bb"/><path d="M206 40a48 48 0 1 0 55 72 53 53 0 0 1-55-72" fill="#d8a252"/><path d="M86 241c1-63 19-104 50-137M144 242c-7-40-5-83 17-120" fill="none" stroke="#5e7351" stroke-width="4" stroke-linecap="round"/><path d="M96 191c-38 4-50-15-47-37 28-7 49 6 47 37M110 158c32 4 49-10 48-30-25-9-45 5-48 30M140 216c39 4 61-11 65-32-33-13-58 3-65 32M144 176c-30 0-43-14-40-34 27-4 43 9 40 34" fill="#82936b"/><path d="M218 245c-8-39-9-66-5-83" fill="none" stroke="#627651" stroke-width="4"/><g fill="#eee4bf" stroke="#b89158" stroke-width="1.2"><ellipse cx="213" cy="137" rx="13" ry="23"/><ellipse cx="213" cy="177" rx="13" ry="23"/><ellipse cx="192" cy="158" rx="23" ry="13" transform="rotate(30 192 158)"/><ellipse cx="234" cy="158" rx="23" ry="13" transform="rotate(-30 234 158)"/></g><circle cx="213" cy="157" r="12" fill="#b08a49"/><path d="M75 234h92l-12 36H88z" fill="#b77c5c"/><path d="M75 234h92l-12 36H88z" fill="url(#stripes)" opacity=".6"/><path d="M39 87h12m-6-6v12m118-49h10m-5-5v10m107 162h12m-6-6v12" stroke="#87906a" stroke-width="2" stroke-linecap="round"/><circle cx="68" cy="114" r="3" fill="#af8155"/><circle cx="276" cy="133" r="3" fill="#af8155"/></svg>`;
  function birthday(p) {
    return `<div class="birthday-top"><span class="small-icon">${p.featured ? '✿' : '✧'}</span><span class="tag">农历生日</span></div><div class="birthday-heading"><h3>${escape(p.name)}的生日</h3><span>${escape(p.role)}</span></div><div class="lunar-date">${escape(p.lunarLabel)}<span>${p.birth.year} 年${p.birth.leap ? ' · 闰月' : ' · 非闰月'}</span></div><div class="countdown"><span class="countdown-label">${p.next.remaining === 0 ? '今天就是生日' : '距离下一次生日'}</span><div><strong>${p.next.remaining === 0 ? '今天' : p.next.remaining}</strong><span>${p.next.remaining === 0 ? '生日快乐 ♡' : '天'}</span></div></div><div class="next-date"><span>下次生日</span><strong>${dateText(p.next.solar)}</strong></div><div class="birthday-bottom"><span>公历出生 <b>${D.key(p.solar).replaceAll('-', '.')}</b></span><span>已满 ${p.age.years} 周岁</span></div>${p.next.adjusted ? '<p class="adjustment">本次已按闰月／小月规则调整。</p>' : ''}`;
  }
  function render() {
    try {
      const now = D.today(new Date(), config.timezone);
      if (now.year < 1901 || now.year > 2099) throw new Error('当前日期超出本项目已验证的 1901–2099 年范围。');
      const people = config.people.map(p => D.personData(p, now, config));
      if (!people.length) throw new Error('请在 config.js 中添加家人。');
      const featured = people.find(p => p.featured) || people[0];
      if (people.some(p => p.age.future)) throw new Error('出生日期晚于今天，请检查配置或设备时间。');
      document.getElementById('title').textContent = config.title;
      document.getElementById('today-solar').textContent = `${now.year}.${String(now.month).padStart(2, '0')}.${String(now.day).padStart(2, '0')}`;
      const lunar = Solar.fromYmd(now.year, now.month, now.day).getLunar();
      const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: config.timezone }).format(new Date());
      document.getElementById('today-lunar').textContent = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} · ${weekday}`;
      document.getElementById('dashboard').innerHTML = `<section class="growth" aria-labelledby="growth-title"><div class="growth-main"><p class="eyebrow">GROWING TOGETHER</p><h2 id="growth-title">${escape(featured.name)}来到世界，已经</h2><div class="growth-number"><strong>${number(featured.elapsed)}</strong><span>天</span></div><p class="growth-caption">这是与你相伴的<span>第 ${number(featured.ordinal)} 天</span></p><div class="growth-rule"></div><div class="growth-details"><div><span>现在的你</span><strong>${featured.age.years} 岁 <em>${featured.age.months}</em> 个月 <em>${featured.age.days}</em> 天</strong><small>公历已满周岁 / 整月</small></div><div><span>故事的起点</span><strong>${dateText(featured.solar)}</strong><small>农历${escape(featured.lunarLabel)} · ${featured.birth.year} 年</small></div></div></div><div class="growth-art">${illustration}<p>一天天长大，<br>一点点把世界照亮。</p><span class="art-seal">小日子 · 慢慢来</span></div></section><div class="section-heading"><h2>下一次，值得期待</h2><span>把重要的人，放在心上 <i>↙</i></span></div><section class="birthdays" aria-label="家人的农历生日">${people.map(p => `<article class="birthday ${p.featured ? 'peach' : 'cream'}">${birthday(p)}</article>`).join('')}</section>`;
      document.getElementById('error').hidden = true;
    } catch (e) {
      document.getElementById('error').textContent = `暂时无法计算：${e.message}`;
      document.getElementById('error').hidden = false;
      document.getElementById('dashboard').innerHTML = '';
    }
  }
  render();
  // 自动跨北京时间午夜更新；从休眠、后台标签页返回时也立即刷新。
  setInterval(render, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
