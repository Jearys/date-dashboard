# 日子有光 · 家庭纪念日

纯静态中文家庭日期看板，显示农历生日倒计时与成长天数。HTML / CSS / JavaScript，无需构建；农历库随项目打包，无运行时外部请求。

## 使用

GitHub Pages 从 main 分支根目录发布。也可以下载后直接打开 index.html，或运行 python3 -m http.server 8000。

编辑 config.js 可修改标题、家人和农历出生日期。时区为 Asia/Shanghai。页面每分钟以及返回标签页时刷新，使用设备当前时间。

生日按农历计算；闰月生日无对应闰月时回退普通月，三十遇小月使用二十九。年龄按公历出生日期计算，成长天数按北京时间自然日差计算。

## 隐私

这是公开网站。config.js 包含真实出生日期，访问者可以查看和下载。网站没有登录或访问控制。个人信息不因源码许可而授权另行传播。

## 许可

项目代码采用 MIT License；农历库许可见 vendor/LICENSE-lunar-javascript，来源见 THIRD_PARTY_NOTICES.md。
