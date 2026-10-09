const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../dates');
const config = require('../config');
const { Lunar, LunarMonth } = require('../vendor/lunar');
const date = (year, month, day) => ({ year, month, day });
const chinese = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Asia/Shanghai' });
function intlLunar(d) {
  const p = Object.fromEntries(chinese.formatToParts(new Date(`${D.key(d)}T12:00:00+08:00`)).map(x => [x.type, x.value]));
  return { year: Number(p.relatedYear), month: parseInt(p.month), day: Number(p.day), leap: p.month.includes('bis') };
}
test('three birth dates: pinned values and independent ICU Chinese calendar', () => {
  for (const [p, expected] of [[config.people[0], '1995-11-10'], [config.people[1], '2025-03-12'], [config.people[2], '1995-11-23']]) {
    const solar = D.birthSolar(p.birth);
    assert.equal(D.key(solar), expected);
    assert.deepEqual(intlLunar(solar), p.birth);
  }
});
test('next birthdays and growth values on 2026-10-09', () => {
  const [me, child, wife] = config.people.map(p => D.personData(p, date(2026, 10, 9), config));
  assert.equal(D.key(me.next.solar), '2026-10-27'); assert.equal(me.next.remaining, 18);
  assert.equal(D.key(child.next.solar), '2027-03-20'); assert.equal(child.next.remaining, 162);
  assert.equal(child.elapsed, 576); assert.equal(child.ordinal, 577);
  assert.deepEqual(child.age, { years: 1, months: 6, days: 27, future: false });
  assert.equal(D.key(wife.next.solar), '2026-11-10'); assert.equal(wife.next.remaining, 32);
  for (const p of [me, child, wife]) assert.deepEqual(intlLunar(p.next.solar), { ...p.birth, year: p.next.lunarYear });
});
test('birthday today is zero; next day advances to next lunar year', () => {
  const b = config.people[0].birth;
  assert.equal(D.nextBirthday(b, date(2026, 10, 27)).remaining, 0);
  const next = D.nextBirthday(b, date(2026, 10, 28));
  assert.equal(next.lunarYear, 2027); assert.ok(next.remaining > 300);
  assert.deepEqual(intlLunar(next.solar), { ...b, year: 2027 });
});
test('solar new year before lunar new year selects correct lunar year', () => {
  const b = { year: 1995, month: 12, day: 20, leap: false };
  const next = D.nextBirthday(b, date(2027, 1, 1));
  assert.equal(next.lunarYear, 2026);
  assert.deepEqual(intlLunar(next.solar), { ...b, year: 2026 });
});
test('Shanghai midnight does not depend on host timezone', () => {
  assert.deepEqual(D.today(new Date('2026-10-08T15:59:59Z')), date(2026, 10, 8));
  assert.deepEqual(D.today(new Date('2026-10-08T16:00:00Z')), date(2026, 10, 9));
  assert.deepEqual(D.today(new Date('2026-12-31T16:00:00Z')), date(2027, 1, 1));
});
test('birth day and leap-day elapsed arithmetic', () => {
  const p = D.personData(config.people[1], date(2025, 3, 12));
  assert.equal(p.elapsed, 0); assert.equal(p.ordinal, 1); assert.equal(p.next.remaining, 0);
  assert.equal(D.daysBetween(date(2024, 2, 28), date(2024, 3, 1)), 2);
  assert.equal(D.daysBetween(date(2025, 2, 28), date(2025, 3, 1)), 1);
});
test('completed solar months clamp month ends and leap birthday', () => {
  assert.deepEqual(D.age(date(2024, 2, 29), date(2025, 2, 28)), { years: 1, months: 0, days: 0, future: false });
  assert.deepEqual(D.age(date(2025, 1, 31), date(2025, 2, 28)), { years: 0, months: 1, days: 0, future: false });
  assert.deepEqual(D.age(date(2025, 1, 31), date(2025, 3, 30)), { years: 0, months: 1, days: 30, future: false });
});
test('leap lunar birthday uses leap month if present, ordinary month otherwise', () => {
  const b = { year: 2023, month: 2, day: 10, leap: true };
  assert.equal(intlLunar(D.birthdayInYear(b, 2023).solar).leap, true);
  const fallback = D.birthdayInYear(b, 2024);
  assert.equal(fallback.adjusted, true);
  assert.deepEqual(intlLunar(fallback.solar), { year: 2024, month: 2, day: 10, leap: false });
  const ordinary = D.birthdayInYear({ ...b, leap: false }, 2023);
  assert.equal(intlLunar(ordinary.solar).leap, false);
});
test('day 30 in a short lunar month becomes day 29', () => {
  let year;
  for (let y = 2026; y < 2040; y++) if (LunarMonth.fromYm(y, 1).getDayCount() === 29) { year = y; break; }
  assert.ok(year);
  const result = D.birthdayInYear({ year: 2023, month: 1, day: 30, leap: false }, year);
  assert.equal(result.adjusted, true);
  // ICU disagrees on 2030 new moon; official HKO table confirms Mar 3 = lunar 1/29.
  // https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2030e.pdf
  assert.equal(year, 2030); assert.equal(D.key(result.solar), '2030-03-03');
});
test('invalid dates and invalid leap months fail visibly', () => {
  assert.throws(() => D.birthSolar({ year: 2025, month: 2, day: 31, leap: false }));
  assert.throws(() => D.birthSolar({ year: 2025, month: 2, day: 13, leap: true }));
  assert.throws(() => D.birthSolar({ year: 1890, month: 2, day: 13, leap: false }));
});
test('independent ICU verification of all three recurring birthdays, 2025–2045', () => {
  for (const p of config.people) for (let year = 2025; year <= 2045; year++) {
    const next = D.birthdayInYear(p.birth, year);
    assert.deepEqual(intlLunar(next.solar), { ...p.birth, year });
  }
});

test('wife birthday today and next-day rollover', () => {
  const wife = config.people.find(p => p.id === 'wife');
  assert.equal(wife.name, '媳妇');
  assert.equal(D.nextBirthday(wife.birth, date(2026, 11, 10)).remaining, 0);
  const next = D.nextBirthday(wife.birth, date(2026, 11, 11));
  assert.equal(next.lunarYear, 2027);
  assert.deepEqual(intlLunar(next.solar), { ...wife.birth, year: 2027 });
});
