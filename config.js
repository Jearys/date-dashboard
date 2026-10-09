/* 编辑此文件即可更新家人的日期。公开部署时，本文件和所有日期都会公开。 */
(function (root) {
  const config = {
    title: '把日子，过成纪念。',
    timezone: 'Asia/Shanghai',
    // 闰月生日：当年有对应闰月时用闰月；没有时用同名普通月。
    leapMonthPolicy: 'regular-if-missing',
    // 农历三十遇到小月：在该月最后一天庆祝。
    shortMonthPolicy: 'last-day',
    people: [
      { id: 'me', name: '我', role: '每一岁，都值得庆祝', birth: { year: 1995, month: 9, day: 18, leap: false } },
      { id: 'daughter', name: '女儿', role: '慢慢长大，日日可爱', featured: true, birth: { year: 2025, month: 2, day: 13, leap: false } }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.DASHBOARD_CONFIG = config;
})(typeof globalThis !== 'undefined' ? globalThis : this);
