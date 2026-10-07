# 墨笈 · 字母雨

> 文字洗礼，沐浴辉光，沉心敛气

「墨笈 · 字母雨」是一款薄荷绿主题UI的**独立可运行**网页组件。动画算法包含尾迹渐变、逐列字符、帧延迟，按 S 退出全屏，并在此基础上扩展了文本源、字体、颜色、速度等可配置项。

- 核心零依赖：纯原生 HTML / CSS / JavaScript，无框架
- 字体（霞鹜文楷 / 朱雀仿宋）按需从 CDN 加载，其余资源完全自包含
- 控制台采用清新薄荷色系（区别于深色终端风）

---

## 文件树

```
fo/
├── index.html                    # 入口页：薄荷风控制台（所有设置项 + 开始按钮）
├── .htaccess                     # Apache/cPanel 配置：静态资源缓存 1 天、gzip、MIME
├── README.md                     # 本文件
│
├── styles/
│   ├── style.css                 # 独立样式：薄荷主题、控制台布局、自定义下拉/色盘浮窗
│   └── fonts.css                 # 网络字体引入：霞鹜文楷 / 朱雀仿宋（CDN 分片 woff2）
│
├── scripts/
│   └── matrix-rain.js            # 动画核心
│
└── data/
    ├── daodejing.txt             # 字符源：道德经（默认）
    ├── xinjing.txt                # 字符源：般若波罗蜜多心经幽赞
    └── manifest.json             # 文本清单：控制台"文本"下拉的选项来源（{file, label}）
```

### 各文件职责

| 文件 | 职责 |
|---|---|
| `index.html` | 入口与控制台：字符集、文本、字号、字体、速度、颜色（含自定义色盘）、全屏开关；启动/退出逻辑绑定 |
| `styles/style.css` | 薄荷主题样式：卡片、滑杆、分段选择、自定义下拉菜单、色盘浮窗、Toast、响应式 |
| `scripts/matrix-rain.js` | 字母雨动画：canvas 全屏覆盖、尾迹渐变、逐列字符下落、S/Esc 退出、Konami 彩蛋、resize 自适应；`window.MatrixRain` API |
| `data/manifest.json` | 文本下拉选项清单，格式 `[{"file":"xxx.txt","label":"显示名"}]` |
| `styles/fonts.css` | 引入霞鹜文楷 / 朱雀仿宋两款网络字体（jsDelivr CDN 分片 woff2），非阻塞加载 |
| `.htaccess` | Apache/cPanel 静态托管配置：js/txt/css/json 等资源缓存 1 天、gzip 压缩、MIME、关闭目录列表 |
| `data/*.txt` | 字符源文本，放在这里即可被"文本"下拉识别（需同步更新 `manifest.json`，见下） |

---

## 使用说明

### 运行

- 需通过 HTTP 访问（文本走 `fetch` 加载，`file://` 下会被浏览器拦截）。本地预览：

```bash
# 在 fo/ 目录下
python -m http.server 8000
# 浏览器访问 http://127.0.0.1:8000/index.html
```

### 操作

- 选择字符集：🌿 中文（使用所选 txt 文本）／⚡ ASCII（经典字符集）
- 中文模式下可切换**文本源**（自动识别 `data/` 下的 txt）、**字体**（等宽/宋体/黑体/楷体/霞鹜文楷/朱雀仿宋/雅黑）、**字号**、**速度**
- 颜色：经典绿 / 薄荷 / 青蓝 / 琥珀 / **鎏金**（自带金色光晕）/ **自定义**（色盘或 HEX/RGB 输入）
- 点击「▶ 开始字母雨」进入动画；**按 `S` 退出全屏**

---

## 小提示

1. **必须通过 HTTP 运行**：文本由前端 `fetch('data/xxx.txt')` 加载，`file://` 下浏览器会拦截该请求，请使用本地或线上 HTTP 服务（`python -m http.server`、nginx、cPanel 静态托管等）。页面采用「先渲染、空闲后依次（串行）预取 txt」策略，静态资源由 `.htaccess` 缓存 1 天。

2. **新增字符源 txt 的步骤**：把 txt 放入 `data/`，再更新 `manifest.json` 清单即可（文本内容运行时直接 fetch，无需打包）。

3. **鎏金色的实现**：选中鎏金（`#D4AF37`）时 canvas 会开启金色光晕（`shadowColor` + `shadowBlur`），字体呈现金光流动效果；背景填充前会先清除阴影，避免光晕污染画面。

4. **隐藏彩蛋**：Konami 码 `↑ ↑ ↓ ↓ ← → ← → B A` 可直接触发字母雨（提示栏已隐藏此彩蛋，保留功能）。

5. **自定义颜色格式**：支持 `#RGB`、`#RRGGBB`、`rgb(r,g,b)`、`r,g,b` 四种写法，输入即时联动色盘。

6. **独立运行**：除霞鹜文楷 / 朱雀仿宋两款网络字体从 jsDelivr CDN 按需加载外，本包不引用 fo 目录以外的任何资源，整个 `fo/` 文件夹拷走即用。

---

## 版权

版权 © 2026 LynxStation | 聆息工作室
