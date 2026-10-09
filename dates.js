(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./vendor/lunar.js') : root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FamilyDates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (library) {
  'use strict';
  const { Lunar, Solar, LunarMonth } = library;
  const DAY = 86400000;
  const pad = n => String(n).padStart(2, '0');
  function key(d) { return `${d.year}-${pad(d.month)}-${pad(d.day)}`; }
  function serial(d) { return Date.UTC(d.year, d.month - 1, d.day) / DAY; }
  function daysBetween(a, b) { return serial(b) - serial(a); }
  function today(now = new Date(), timezone = 'Asia/Shanghai') {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
    return Object.fromEntries(parts.filter(p => ['year', 'month', 'day'].includes(p.type)).map(p => [p.type, Number(p.value)]));
  }
  function solarObject(s) { return { year: s.getYear(), month: s.getMonth(), day: s.getDay() }; }
  function validBirth(b) {
    if (!b || !Number.isInteger(b.year) || b.year < 1901 || b.year > 2099 || !Number.isInteger(b.month) || b.month < 1 || b.month > 12 || !Number.isInteger(b.day) || b.day < 1 || typeof b.leap !== 'boolean') throw new Error('请检查农历生日配置：年份需在 1901–2099，月份 1–12，闰月用 true / false。');
    const m = LunarMonth.fromYm(b.year, b.leap ? -b.month : b.month);
    if (!m || b.day > m.getDayCount()) throw new Error('配置中的农历日期不存在，请核对闰月或日期。');
    return b;
  }
  function birthSolar(b) { validBirth(b); return solarObject(Lunar.fromYmd(b.year, b.leap ? -b.month : b.month, b.day).getSolar()); }
  function birthdayInYear(b, year, options = {}) {
    let month = b.leap ? -b.month : b.month;
    let lm = LunarMonth.fromYm(year, month);
    let adjusted = false;
    if (!lm) {
      if ((options.leapMonthPolicy || 'regular-if-missing') !== 'regular-if-missing') throw new Error('不支持的闰月策略');
      month = b.month; lm = LunarMonth.fromYm(year, month); adjusted = true;
    }
    const day = Math.min(b.day, lm.getDayCount());
    if (day !== b.day && (options.shortMonthPolicy || 'last-day') !== 'last-day') throw new Error('不支持的小月策略');
    return { solar: solarObject(Lunar.fromYmd(year, month, day).getSolar()), lunarYear: year, adjusted: adjusted || day !== b.day };
  }
  function nextBirthday(b, now, options = {}) {
    validBirth(b);
    const year = Solar.fromYmd(now.year, now.month, now.day).getLunar().getYear();
    for (let y = Math.max(year, b.year); y <= Math.max(year, b.year) + 3; y++) {
      const candidate = birthdayInYear(b, y, options);
      const remaining = daysBetween(now, candidate.solar);
      if (remaining >= 0) return { ...candidate, remaining, turns: y - b.year };
    }
    throw new Error('未能计算下次农历生日');
  }
  function monthDays(year, month) { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }
  function addMonths(date, count) {
    const base = new Date(Date.UTC(date.year, date.month - 1 + count, 1));
    const year = base.getUTCFullYear(), month = base.getUTCMonth() + 1;
    return { year, month, day: Math.min(date.day, monthDays(year, month)) };
  }
  // 公历整月按出生日期锚定；月底在较短月份取月末，避免逐月累积漂移。
  function age(birth, now) {
    if (daysBetween(birth, now) < 0) return { years: 0, months: 0, days: 0, future: true };
    let months = (now.year - birth.year) * 12 + now.month - birth.month;
    if (serial(addMonths(birth, months)) > serial(now)) months--;
    return { years: Math.floor(months / 12), months: months % 12, days: daysBetween(addMonths(birth, months), now), future: false };
  }
  function lunarLabel(b) {
    const months = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const days = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    return `${b.leap ? '闰' : ''}${months[b.month - 1]}月${days[b.day - 1]}`;
  }
  function personData(person, now, options = {}) {
    const solar = birthSolar(person.birth), elapsed = daysBetween(solar, now);
    return { ...person, solar, elapsed, ordinal: elapsed + 1, age: age(solar, now), next: nextBirthday(person.birth, now, options), lunarLabel: lunarLabel(person.birth) };
  }
  return { key, today, daysBetween, birthSolar, birthdayInYear, nextBirthday, age, addMonths, lunarLabel, personData };
});
