# 版本日志

项目：**dsh-myskin —— DSH 通用皮肤框架**（同一套客户端插件管线同时服务 Web 与 Desktop）。
`0.x` 期间小版本可能包含行为调整；每条尽量写清"为什么"，详细推导见 README 对应小节与提交信息。
0.3.0–0.3.3 的逐条变更见 `git log --oneline`，本文件从 0.3.4 起逐版记录。

## [0.3.8] — 2026-09-29

这一版把「绘制模式」从"能用"做到"顺手"（选择、字体、位置缩放、动效与性能），把皮肤从一份 JSON 变成可搬运的
**皮肤包 `.dshskin`**，并修掉两个"点了没反应"的真问题。

### 修复 · 新对话页那行灰色默认文字点不中（连带「文字改不动」）
- 空 composer 的占位文字是上游的 `<div data-composer-placeholder>`，CSS 为
  `position:absolute; inset:4px 8px auto 14px; pointer-events:none`。`elementsFromPoint()` **不返回**不接受
  指针事件的元素，所以点击那行灰字拿到的是它背后**空的** `[contenteditable]`（没有任何文字节点），
  「编辑文字」因此永远报「没有可直接编辑的文字」。
- 选择器改为引擎里的纯函数 `pickElementAt()`：自有 UI 穿透 → 最近交互祖先优先 → **指针不可见的文字浮层
  优先于背后容器**（先认 `[data-composer-placeholder]` 标记，再退回「`pointer-events:none` + 直接文字 +
  位于指针下」的通用判定；浏览器里 `display:none` 的候选因无几何被拒，无布局的 jsdom 跳过覆盖面判定，
  因此该逻辑可单测）。选中后面板标注「灰色默认文字」，改色/隐藏/改文案都作用在它自己身上。

### 修复 · 编辑文字不能靠猜
- 文字以前只由「编辑文字」按钮写入，而输入框的标签与按钮同名——在输入框里打字页面上毫无反馈，读起来就是
  「无法修改文字」。现在**边输入边预览**（250ms 去抖，沿用样式字段「一次手势一条历史」的规则，不会每个
  按键发一条 undo），**回车**或点「应用文字」写入草稿；改回原文即自动撤销该条覆盖。
- 去抖写入在撤回/重选/卸载时取消，并在写入前核对 host 仍是当初那个元素。

### 绘制模式 · 选择与信息
- **悬停虚线框 + 标签胶囊**（`tag#id.class · 文字片段`）：与点击**共用同一个 `pickElementAt()`**，
  预选与实际选中不可能不一致；选中框改实线 + 同款胶囊，落点有一次性动效。
- 面板顶部 **↑ 父级 / ↓ 子级**（Alt+↑/↓）：按真实 DOM **一次一级**（`parentTarget` / `childTargetIn`），
  点错一级往上退即可。
- 工具条分组：选择/交互改**分段控件**、撤销/重做带快捷键提示、**保存状态胶囊**（灰/琥珀/红，悬停显示失败
  字段）、提示文案移入**独立第二行**（超长省略号）不再挤按钮；**右侧面板可折叠**（折叠后真实页面自动铺满，
  内缩由 ResizeObserver 复算）；**「还原默认」二次确认**（它紧挨「应用」，误点会丢整个草稿）。

### 绘制模式 · 字段与编辑
- 16 个样式字段拆成 **文字 / 盒子 / 外观 / 位置与缩放 / 元素操作** 可折叠分组（标题带「自定义 N」计数）；
  中文标签全部走 i18n（英文界面不再半中半英）；每个生效字段可 **×** 单独清除。
- **预览只重写自己拥有的属性**（引擎 `withManagedDeclarations` + `INSPECTOR_PROPERTIES`）：以前整条规则
  替换，导致"隐藏控件"后一改字号元素又冒出来；现在 `visibility/display` 与极客模式手写的声明都保留。
- **没变就不写**（引擎 `sameDeclarations`，忽略顺序与 `!important`）：选中带规则的元素不再把草稿标成
  "有未保存的更改"，也不再往撤销栈塞空步。极客模式仍是"整条替换"（用户自己写了整条规则）。
- 快捷键：Esc（先取消选择，再按退出并保存）、Ctrl/Cmd+Z、Ctrl/Cmd+Shift+Z；输入框/可编辑区与上游弹窗优先。

### 绘制模式 · 字体
- 「字体」字段写 `font-family`（受管属性）：可直填任意家族栈/系统字体，或用建议列表（PingFang SC /
  Microsoft YaHei / Noto Sans CJK SC / HarmonyOS Sans / JetBrains Mono …）。
- **嵌入字体文件**：`.woff2/.woff/.ttf/.otf`，按扩展名判定 `format()`，以 **`css` 里
  `selector='@font-face'` 的条目**存入（引擎的 `selector { rule }` 渲染天然成立，**没有新增 schema 字段**；
  删除该条目即卸载字体）。
- **上限 400 KB → 30 MB**：允许整份 CJK 字体，但 **>2 MB 明确提示代价**（文档里是 base64、每次编辑整份重发、
  保存会变慢；导出的 `.dshskin` 里它是原样文件）。
- **应用到整页**：把当前字体写成一条 `body` 规则（`body` 无法在画布上点选，所以单给一个入口）。

### 绘制模式 · 位置与缩放
- 新分组「位置与缩放」：**X / Y 位移 + 等比缩放**（带滑块）。值由 `transformValue()` 生成——恒等分量省略、
  全恒等返回 `''` 即**删除 `transform`**（不留 `transform: none`）；`parseTransform()` 反向解析供面板回显
  （二者互逆，有单测）。只做视觉位移/缩放，**不改变布局流**。
- 画布手势：选中框**左上角 ✥ 拖动＝双轴移动**、**右下角手柄拖动＝等比缩放**；拖拽 rAF 合并为**每帧一次**
  草稿写入、**一次手势只压一条撤销**，面板数字跟随（正在输入时不覆盖）。
- **滚轮微调**：X/Y ±1px（Shift ±10px）、缩放 ±0.05（Shift ±0.25，夹 0.2–3）。监听器必须**原生
  `{ passive: false }`**——React 的 `onWheel` 挂在 root 上是 passive 的，`preventDefault()` 被忽略、
  面板会在改数值的同时跟着滚；单测直接断言 `defaultPrevented === true`（`attachWheelNudge`）。
- **每个轴独立重置**：X / Y / 缩放各一个 `↺`（无值时禁用），另有「重置变换（三轴）」；步进/取整/夹取统一走
  引擎 `stepValue()`。

### 绘制模式 · 对齐线（低敏吸附）
- 移动 / 缩放时把元素的**三条边**（起、中、末）与**同级元素、父级容器、视口中线**比对，4px 内吸附并画出对齐线；
  磁力刻意做小（`SNAP_THRESHOLD = 4`）——10px 的磁铁没法精确定位，1px 又在触控板上看不见。
- 几何全部是引擎里的纯函数：`snapAxis()`（单轴最近候选）、`snapMove()`（双轴平移修正 + 要画的线）、
  `snapScale()`（绕中心等比缩放时让某条边落到线上，取像素误差最小的候选）；`snapTargetsFor()` **每个手势只采集一次**
  ——元素是用 `transform` 移动的，不会 reflow，目标线在拖动期间不可能动。三个函数都有单测（含阈值边界、
  最近候选、中心另一侧的线不算候选、退化盒不产生 NaN/Infinity）。
- 交互：工具条「对齐」总开关（默认开），拖动时按住 **Alt** 临时关闭；对齐线是 1–2 个 fixed 的 1px div，
  淡入 90ms、reduced-motion 下不淡入，拖拽结束即清除。

### 绘制模式 · 保存 / 应用 / 关闭
- **保存** = 写入皮肤文档并**留在**绘制模式（不改 `enabled`，不会把故意停用的皮肤偷偷打开）；
  **应用** = 写入 + `enabled: true` 并**退出**绘制模式；**✕ 关闭** 有未保存改动时先保存再退出。
  在此之前只有"写入即退出"两条路，无法"先存下再继续调"，这是本次拆分的直接动因。

### 绘制模式 · 动效与性能
- 新增 `src/client/canvas-ui.ts`（编辑器自有样式表，随编辑器挂载/卸载，可逆）：工具条入场、面板滑入、
  悬停/选中框落点、分组手风琴（只转箭头）、保存点（仅写入中呼吸）、提示行淡入；卡片表面、胶囊、分隔线、
  细滚动条、滑杆与折叠标记的原生表面风格、空状态卡片、`:focus-visible` 焦点环；颜色只用 `--dsw-alias-*`。
- **性能与动效同等重要**：①动效**只动 `transform`/`opacity`**（CSS-only，无 JS 逐帧回调）；
  ②**禁止 `backdrop-filter`**（给实时页面做模糊最贵）；③**面板折叠不动画宽度**（宽度经 ResizeObserver
  驱动整页内缩，动画宽度＝每帧重排整个应用）；④滚动/缩放重绘 **rAF 合并为每帧一次**（原来每个 scroll
  事件都重渲染编辑器）；⑤悬停命中测试每帧最多一次、仅 edit 模式装载；⑥`prefers-reduced-motion` 全关。
  新测试把这些不变量钉死（关键帧只允许 opacity/transform、禁 `backdrop-filter`、禁 `transition: all`、
  必须有 reduced-motion 分支、颜色不得写死十六进制）。

### 皮肤包 · `.dshskin`（类 zip 容器）
- 「导出皮肤」改产 **`.dshskin`**：标准 ZIP（**STORE** 写入，7-Zip/unzip/Python `zipfile` 都能打开）。
  `manifest.json` = **完整配置**（`format`/`formatVersion`/`generator`/`name`/`createdAt`/`assets`/
  `stats` + `skin` 全量文档）；`assets/<kind>-<n>.<ext>` = **原样字节**（壁纸 / 嵌入图 / 嵌入字体）；
  `README.txt` = 包内说明。文档里的引用写成 `dshskin:assets/…`，**只在包内存在**——运行时文档永远是
  真 data URL，因此**没有 schema 变更**、没有新的应用路径。
- 收益（实测）：一份主题 351 KB JSON → **141 KB** 包（−59.8%），壁纸按原字节还原；同一图片被引用 3 次只存
  1 份；解开 zip 换掉 `assets/` 里的同名文件即可再导入。
- 读写策略：**只写 STORE，读兼容 DEFLATE**（普通 zip 工具重打包过的包照样导入）；逐条目 CRC 校验；
  缺资源**点名报错**而不是导入半个皮肤；旧版 `.json` 导出继续支持；包名与下载名取自「保存为皮肤」的命名输入。
- 零依赖：ZIP 写/读、CRC-32、data URL 编解码全部手写在 `src/client/dshskin.ts`；`toArrayBuffer()` 供
  `Blob` 使用（子数组的 `buffer` 会带上切片外的字节）。产物另用 Python `zipfile` 交叉验证过是合法 zip。

### 工程
- 测试 37 → **64**：灰字选择器（命中 / 按钮优先 / 无标记的 pointer-events 浮层 / 自有 UI 与无文字装饰不选）、
  灰字替换的字节级可逆、React 重建后重贴、`withManagedDeclarations`（隐藏不被样式预览抹掉）、
  `sameDeclarations`（没变不写）、`elementLabel`、父/子层级遍历、`transformValue`/`parseTransform` 互逆、
  `fontFormat`/`fontFaceRule`、`stepValue`、`wheelStep`+`attachWheelNudge`（阻止滚动/可卸载）、
  `snapMove`/`snapScale`（阈值边界 / 最近候选 / 中心对侧不算候选 / 退化盒安全）、
  编辑器样式表不变量、`.dshskin` 六例（往返/去重/DEFLATE 外部重打包/CRC/缺资源/旧 JSON）。
- `check:compat` 新增 DOM 契约 `data-composer-input`、`data-composer-placeholder`；0.1.7-rc.2 与 0.2.0-rc.1
  两代安装全绿；`check:types` 两代 **0 诊断**。
- 仓库整理：`examples/` 移除（全量主题夹具移入 `tests/fixtures/`），`.gitignore` 重写（忽略依赖、
  `.tmp`、打包产物、日志、编辑器与凭据文件），README 重写为面向使用者的介绍 + **最新版 DSH 安装教程**，
  技能文档整体重写以覆盖 0.3.8 的全部契约。
- `lib/index.js`（宿主半区）与 0.3.7 **逐字节相同**；`lib/client.js` 重建。

## [0.3.7] — 2026-09-29

### 定位
- 项目定位由「DSH Web 皮肤插件」改为「**DSH 通用皮肤框架**」：Web 与 Desktop 共用同一条客户端插件管线。
  `package.json` description、README 标题与首段、技能描述、设置页 intro（中/英）同步调整。

### 修复 · 桌面壁纸的圆角切割与三处同一不透明度
- Windows 下壁纸改画在**对话列**上（`[class*="_centerCol"]`，染色作为 gradient 压在壁纸之上）：列自己的
  `border-radius` + `overflow:hidden` 把壁纸切在 16px 圆角内；frame 不再画图，保留 DSH 自己的
  `--dsw-specific-sidebar-fill` 去填那 16px 缺口——既不再露原生窗口底色（0.3.2 的黑块），
  也不会把圆角糊掉（0.3.6 的副作用）。
- 列内只保留**唯一画布层**：`--dsw-alias-bg-base` 在列内被置为 `transparent`，只有内容槽
  （`[data-slot="conversation.session"]` / `[data-slot^="conversation.view"]`）与 composer 座位里的卡片
  把 token 拿回去；composerSeat 自身 `background: none`，去掉发送栏多出来的那层渐变。
- 依据是实测反解：一张截图 + 壁纸原图，逐像素解 `observed = α·surface + (1-α)·wallpaper`
  （映射按 cover+fixed+center 拟合，残差 0.2/255）。修前同一个「背景强度」下：顶栏 0.94、
  对话区 0.75、发送栏 ≈1.00；修后三处是同一个 α，滑块语义变直白（0.5 = 壁纸透出 50%）。

### 修复 · 绘制模式下打开设置，弹窗被工具条/面板遮挡
- 上游设置界面是 portal 到 `body` 的整层全视口浮层（`position:fixed;inset:0`，z-index 1000），
  而绘制画布层是 9999，弹窗因此被压在工具条与右侧面板之下。
- 修法：让弹窗遵守**和主界面同一条内缩规则**——模态浮层按 `--dsh-myskin-inset-top/right`
  （Windows 再叠加 `--dsh-myskin-chrome-top`）内缩，并按同一组内缩收口面板尺寸，弹窗落在应用区里居中。
- 曾试过"模态一开就隐藏画布层"，被否：用户仍在绘制，工具条与面板正是要用的东西。上游
  `useModalLayer` 只圈 Tab 与 Escape、不锁鼠标，所以内缩后两边都能用。

### 修复 · 侧栏收起/展开后嵌入图消失
- 嵌入图靠瞬态属性 `[data-dsh-myskin-embed]` 定位，React 重建节点会把它抹掉。补打标现在：
  多匹配时取**可见**者（不再"不唯一就放弃"，侧栏收放时 rail 与 panel 可能同时挂着）；节点被重建时按
  **祖先链指纹**（`TAG.class` 逐级到 `body`，刻意不含兄弟序号）在文档里重找，且**只认唯一命中**；
  观察器同时盯 `class`/`hidden`（收起可能只换布局 class、不卸载节点）。
- 结构回退选择器**故意不**直接进样式表：位置型路径在兄弟位移后会命中"长得像"的节点，等于把图打到
  别人身上；身份判定交给引擎，样式表只画瞬态标记。

### 工程
- `check:compat` 新增契约：`data-slot`、`data-composer-seat`、`composerSeat`、
  `--dsh-windows-content-radius`、`data-shortcut-modal`，以及"模态层是全视口 fixed 层"。
  0.1.7-rc.2 与 0.2.0-rc.1 两代安装全绿；`check:types` 两代 0 诊断。
- 测试 33 → **37**：嵌入图重打标（重建 / 多匹配 / 不直接绘制）+ 级联级"每像素只有一个画布层"断言。
- 宿主半区未改动（`lib/index.js` 与 0.3.6 逐字节相同）。

## [0.3.6] — 2026-09-28
- 桌面壁纸改为**染色只施加一次**（修"不受透明度管理"）：0.3.5 把壁纸同时画在 `body` 与 frame 上，但染色层
  仍在对话列上又叠一次，壁纸被"叠两层"、强度滑块几乎看不出变化。现在染色移到 frame 且只施加一次，单测
  钉死整套 skin CSS 里 `linear-gradient(rgba(` **恰好出现 1 次**。

## [0.3.5] — 2026-09-28
- **portal 里的元素选不中 → 隐藏/移除/编辑文字全部静默无效**：设置面板、菜单、弹窗都是
  `createPortal(…, document.body)`（挂在 `#root` **旁边**），原 `selectorOf()` 一律以 `#root` 打头，
  生成的选择器永远匹配不到。现在 portal 内优先稳定锚点（`[data-shortcut-modal]`、
  `[role="dialog"|"menu"|"listbox"]`），最后退化为 `body > …`；单测要求生成的选择器必须能
  `querySelector` 回该元素本身。
- **桌面端对话区左上角圆角出现黑块**：圆角缺口露出的是父级 frame 背景，而 0.3.2 为让壁纸透出把 frame
  底色强制成 `transparent`，于是直接露出 Electron 原生窗口底色（`#1b1b1c` 深色 / `#f9fafb` 浅色）。
  当时改为把同一张壁纸画到 frame 上兜住；0.3.7 用"壁纸画在对话列"从根上解决。

## [0.3.4] — 2026-09-28
- **`inject` 里带着从未使用的服务**（曾列 `connection` / `remote`）：`inject` 是 cordis 的激活门禁，
  上游一旦改名/移除，客户端半区会永久 pending、设置页静默消失。改为只列真正使用的服务，并由
  `check:types` 的探针逐代复验。
- **`ctx.slots` 一直没有类型**：补上游惯例那一行 type-only 导入（纯类型，不进产物）。
- **保存皮肤库时 `NamedSkin` 少了必填的 `layers`**：会把已注入的图层从皮肤库里静默丢掉。
- **`npm install` 陷阱**：shell 里 `NODE_ENV=production` 时 npm 的 `omit=dev` 会跳过并清掉
  devDependencies，构建/测试因此失败——写进 README 与技能文档。
- 全线审计：图标候选表、`--dsw-*` 令牌、配置表单 API、桌面壳契约（`data-platform` /
  `data-windows-titlebar` / drag-recall）、渲染层 DOM 契约（`_frame`、`centerCol`、`role=tree`、
  `aria-current`、`#root`）与客户端模块协议逐项核对。
