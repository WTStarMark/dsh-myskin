# 版本日志

项目：**dsh-myskin —— DSH 通用皮肤框架**（同一套客户端插件管线同时服务 Web 与 Desktop）。
`0.x` 期间小版本可能包含行为调整；每条尽量写清"为什么"，详细推导见 README 对应小节与提交信息。
0.3.0–0.3.3 的逐条变更见 `git log --oneline`，本文件从 0.3.4 起逐版记录。

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
