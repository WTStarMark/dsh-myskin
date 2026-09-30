---
name: dsh-myskin
whenToUse: "用户输入 /dsh-myskin（设计自己的主题的入口）或要求给 DSH 换外观、做皮肤、改配色/字体/文字/嵌入图；安装或卸载 dsh-myskin 插件；编写、导入导出、调试 .dshskin 皮肤包；排查皮肤不生效、嵌入图与锚点、回收站、组块编辑与整组间隔、以及「保存失败：canvas」；或读写 dsh-myskin 的设置条目。"
description: DSH 通用皮肤框架 dsh-myskin 0.3.9 的完整说明与操作指向：装载（profile bundle）、皮肤文档字段（tokens/css/text/canvas/layers/content/library）、绘制模式（画布编辑器：选择、样式分组、文字、字体、本机字体列表、位置与缩放、回收站、动效与性能约束）、皮肤包 .dshskin 的读写格式、皮肤库与导入导出、可逆性红线。Use when the user asks to change the DSH look, apply or manage a dsh-myskin skin, install this plugin into a DSH profile, author or debug a skin document, or read/write the `dsh-myskin` settings entry.
---

# dsh-myskin 技能（包版本 0.3.9）

> 本技能**只陈述功能、契约与指向**，不做美化/配色指导。
> 适配 **DSH 0.1.7-rc.2 与 0.2.0-rc.1**（Web 与 Desktop 共用同一条客户端插件管线）。

## 0. 设计向导（`/dsh-myskin`）

用户输入 **`/dsh-myskin [描述]`** 时，宿主插件会把一段引导交给模型（见 `src/command-brief.ts`），
本节就是那份引导指向的**完整流程**——照它做，就是"让 AI 设计主题"这件事本身。

### 0.1 先问清（一轮问完，最多四问）

| 问什么 | 为什么要问 | 影响哪个字段 |
|---|---|---|
| 明暗偏好：跟随系统 / 固定深 / 固定浅 | 决定令牌是**明暗成对**写还是只写一套 | `tokens[*].light/dark` |
| 主色或氛围（给色值或形容词） | 品牌色牵动按钮、选中态、链接 | `--dsw-alias-brand-primary` 等 |
| 字体偏好：界面 / 正文 / 代码 | 三档作用域互不干扰，代码字体最常被忽略 | `font-roles` |
| 要不要背景图 / 嵌入图 | 决定是否走绘制模式与 `.dshskin` 里的素材 | `canvas` / `layers` |

用户没给方向时**先问，不要直接动手**；用户已经说清的方向不要重复问。

### 0.2 选起点：从最接近的预设改，而不是从零发明

三套预设（`src/client/presets.ts`）各 41–45 个令牌、明暗成对、**已过对比度底线**：

| 预设 | 气质 | 明色基准 | 品牌色（明色） |
|---|---|---|---|
| `deep` 深海 | 冷、技术感 | `--dsw-alias-bg-base: #f4f7fb` | `#1d4ed8` |
| `warm` 暖阳 | 暖、阅读向 | `#fbf7f0` | `#b45309` |
| `rose` 粉黛 | 柔、粉调 | `#fdf5f7` | `#be123c` |

**在预设基础上改令牌**比从零拼一套更快、更不容易漏项；要新增令牌前先确认它存在于当前 DSH（`src/client/token-catalog.ts` 是分组目录）。

### 0.3 给方案：1–2 套，必须写到令牌级

每套方案至少说清：**背景 / 表面 / 边框 / 文字档位（primary·secondary·tertiary·caption）/ 品牌色**的具体取值（明暗两列），
以及必要的 `css` 规则（选择器 + 声明）。**不要**只给"科技感、简约"这类形容词，也**不要**一上来甩 200 行 css。

### 0.4 落地：两条路，都不需要改 DSH 配置

- **路径 A（推荐，可交付文件）**：把皮肤文档打成 `.dshskin` 放到用户工作区，让他在「皮肤管理 → 导入皮肤」里选它。
  纯 Node 可用、零 DOM：`src/client/dshskin.ts` 的 `packSkin(skin, { name, generator })` → 写盘即可；
  参考 `tests/dshskin.test.mjs` 里的最小文档形状（`tokens` / `css` / `text` / `canvas` / `layers`）。
- **路径 B（手把手）**：给一张**可粘贴清单**——令牌表（`--dsw-*` → light / dark 两列）、css 规则、字体栈；
  用户在「皮肤管理」里逐项填（css 走极客模式粘贴，字体走「界面 / 正文 / 代码」三行）。

**红线**：不直接改 profile 的 `cordis.patch.yml`（皮肤文档就存在那里，属 R-001 保护区），不碰 `/opt/dsh-web/**`。

### 0.5 交付前必须过的底线（不达标不许交付）

- 对比度：**正文 / 次级 ≥ 4.5:1**、三级 ≥ 3:1、caption ≥ 2.6、dimmed ≥ 2.2；主按钮文字与填充 ≥ 4.5；品牌色在主背景上 ≥ 3。
- 令牌必须**存在于当前 DSH**，且 `{light, dark}` 成对；不得留下"另一套模式的亮面 + 本模式的暗字"。
- 参考实现：`src/client/presets.ts` 的对比度算法与 `tests/preset-contrast.test.mjs`（改预设时会直接跑红）。

### 0.6 收尾必报四件事

1. 用了哪些令牌与 css 规则（可核对）；2. 对比度怎么算过的；3. 怎么**一键还原**（「还原默认」/ 关「启用皮肤」）；4. 怎么导出 `.dshskin` 备份。

### 0.7 三个起步配方

- **深色 + 青色（技术感）**：起点 `deep`；`--dsw-alias-brand-primary` 明色改青系（如 `#0891b2`）、暗色提亮；背景/表面走蓝黑，边框比表面亮一档。
- **浅色纸质（阅读向）**：起点 `warm`；背景偏米（`#faf6ee` 量级）、正文加深到 ≥ 7:1，圆角收小、阴影减弱。
- **高对比（可读性优先）**：任意起点；正文提到 ≥ 7:1、三级提到 ≥ 4.5:1、边框加深，品牌色只用于交互态。

> 改完必须**自己按 §0.5 算一遍对比度**再交付——预设之所以能"闭眼选"，就是因为这些底线被测试钉着。
## 1. 项目是什么 / 怎么装载

DSH **通用皮肤框架**：可视化自定义 + 实时预览 + 「皮肤管理」设置页。非侵入、完全可逆——不改 DSH 源码/配置，不改 DSH 进程。

- 形态：**profile bundle**。包内 `cordis.patch.yml` 声明条目 `id: dsh-myskin`，由该 profile 的 `dsh.profile.bundles` 选中。
- 目标 profile：Web = `$DSH_HOME/profiles/web`，Desktop = `$DSH_HOME/profiles/desktop`；**两者各装一次，皮肤文档互不共享**。
- **本技能自身的注册**：技能是**目录包** `$DSH_HOME/skills/<name>/SKILL.md`（frontmatter 写 `name` / `description` / `whenToUse`），
  由 DSH 的 `skill-filesystem` 提供者扫描 + 热监听；包内 `skills/dsh-myskin/` 用一条软链即可注册：
  `ln -sfn <包目录>/skills/dsh-myskin "$DSH_HOME/skills/dsh-myskin"`（**不需要重启**，下一次技能目录刷新即生效；删链即注销）。
- **首选装法（界面）**：DSH 的 **设置 → 插件 → 添加插件**，填 **GitHub 仓库地址**（`https://github.com/WTStarMark/dsh-myskin`，可带 `#v0.3.9`）、npm 包名或**本地目录路径**；安装由 **pnpm** 执行，成功后插件管理器会**自动**把包名写进该 profile 的 `dsh.profile.bundles`。界面明确提示：插件**不支持自动更新**，升级要**先卸载再安装**。
- **离线装法**：把包放进 `<profile>/node_modules/dsh-myskin`（拷贝或软链，**目录名必须是包名**），再把 `"dsh-myskin"` 追加进 `dsh.profile.bundles`；`patchReload: live` 时保存即热加载（否则重启 DSH，重启交给用户）。
- `lib/index.js` **自带 schemastery**（0.3.1 起不再 external），所以「解压/拷贝/软链」三种装法都不需要 node_modules。宿主半区自检：`node --input-type=module -e "const m = await import('<pkg>/lib/index.js'); console.log(Object.keys(m))"` → `[ 'Config', 'apply', 'name' ]`。
- **写 profile 文件属工作区外写入**：动手前先说明影响并取得用户确认。

## 2. 数据模型（`SkinSettings`）

持久化条目 id / 命名空间 = **`dsh-myskin`**（旧 id `myskin` 若仍被服务，客户端也会跟随）。Host 侧 schema 见 `src/host-schema.ts`（schemastery，**每个顶层字段 `.volatile()`**，所以可原地热改）。

| 字段 | 类型 | 运行时行为 |
|---|---|---|
| `enabled` | `boolean` | `false` = 完全还原 DSH 原生 |
| `tokens` | `Record<string,{light,dark}>` | 经 `ctx.theme.overrideTokens` 覆盖语义令牌（`--dsw-*`）；**每项必须成对** |
| `css` | `{selector,rule}[]` | 写进皮肤自有 `<style id="dsh-myskin-rule">`；渲染成 `selector { rule }`（因此 `@font-face` 条目天然成立） |
| `text` | `{selector,before,after}[]` | 文本节点 / placeholder 替换（MutationObserver，React 安全） |
| `canvas` | `{background?,backgroundOpacity?,images}` | `background`→壁纸；`images`→容器 `::after` 嵌入图 |
| `layers` | `InjectedLayer[]` | **注入真实节点**（`img`/`div`），标记 `data-dsh-myskin-layer`，随 React 重建重注入，dispose 移除 |
| `content` | `{workspaceTree?}` | 内置装饰器：给 workspace/session 树打 `data-maid-*`（不注入节点） |
| `library` | `NamedSkin[]` | 命名皮肤库：`{id,name,tokens,css,text,canvas,layers}` |

`EmbeddedImage` = `{id,selector,url,x,y,w,h,opacity?,blend?,fallbackSelector?,pageKey?}`；
`InjectedLayer` = `{id,kind:'img'|'div',url?,selector,attach,x?,y?,w?,h?,opacity?,blend?,css?,pageKey?}`。

## 3. 读写皮肤文档

- **界面**：设置 →「皮肤管理」。浏览器半区用 `ctx.configForms.get('dsh-myskin')` 订阅与写入（`set(field,value)` / `unset(field)` / `mutate(ops)`），改动实时生效。
- **Host 侧**：`ctx.settings.describe()` 列出条目的 `value/base/user/revision`；`ctx.settings.update(ns,patch)` / `replace(ns,section)` / `mutate(ns,ops)` 写入（带 `expectedRevision` 冲突保护）。0.1.7 的 `SettingsForms` **没有 `settings.get()`**，读取一律 `describe()`。
- **直接改 YAML**：`$DSH_HOME/profiles/<profile>/cordis.patch.yml` 里 `id: dsh-myskin` 的 `config`。该 YAML 含 `!!js` 标签，Python 读要先注册 `tag:yaml.org,2002:js` 构造器，否则 PyYAML 报 `could not determine a constructor`。**手改前先备份、先 read**。
- 皮肤文档跟 profile 走 → **Web 与 Desktop 不共享**；跨端搬运用皮肤包（第 5 节）。

## 4. 绘制模式（画布编辑器）

### 4.1 进入与布局

设置 →「皮肤管理」→ **绘制模式**：先关闭设置弹窗，再把**真实页面内缩**（顶部工具条 + 右侧 340px 面板各占一块，不覆盖 DSH），**不是 iframe 复制**。退出即还原页面布局。面板可折叠（折叠后页面自动铺满）。上游设置/快捷键弹窗按同一条内缩规则收口（`--dsh-myskin-inset-top/right`，Windows 再叠 `--dsh-myskin-chrome-top`）。

### 4.2 选中元素

- **选择**模式点击即选；**交互**模式不拦截事件（可正常滚动/使用应用）。
- 悬停画**虚线框 + 标签胶囊**（`tag#id.class · 文字片段`），与点击共用 `pickElementAt()`——预选与实际选中不可能不一致。
- `pickElementAt()` 顺序：自有 UI 穿透 → 最近交互祖先优先（按钮胜过内部图标）→ **指针不可见的文字浮层优先于背后容器**（新对话页那行灰色默认文字 `[data-composer-placeholder]` 是 `pointer-events:none`，`elementsFromPoint` 永远不返回它，只能靠这里解析）→ 命中元素本身。
- 面板「↑ 父级 / ↓ 子级」（Alt+↑/↓）按真实 DOM 一次一级（`parentTarget` / `childTargetIn`）。
- 快捷键：Esc（先取消选择，再按退出并保存）、Ctrl/Cmd+Z、Ctrl/Cmd+Shift+Z；输入框/可编辑区与上游弹窗优先。

### 4.3 样式字段

- 分组：**文字 / 盒子 / 外观 / 位置与缩放 / 元素操作**，标题带「自定义 N」；每个生效字段可 **×** 单独清除。
- 预览**按属性合并**（`withManagedDeclarations` + `INSPECTOR_PROPERTIES`）：只重写面板拥有的属性，`visibility/display` 与极客模式手写的其它声明保留。**别改回整条替换**——那会让"隐藏控件"后改一次字号就把元素变回来。
- 「没变就不写」（`sameDeclarations`，忽略顺序与 `!important`）：选中带规则的元素不会把草稿标脏、也不会往撤销栈塞空步。极客模式（用户自己写整条 CSS）走 `applyStyle()` **整条替换**。
- 隐藏 = `visibility: hidden !important`（保留占位）；移除 = `display: none !important`（不占位）；都是纯 CSS，**不删真实 DOM**。
- **恢复必须走回收站**（第 4.10 节）：被移除的元素不再参与命中测试，画布上选不中它，只靠"再选一次"是回不来的。

### 4.4 文字

- 「编辑文字」用 `textHostOf()` 找**真正承载文字**的节点（包裹层、空白、`placeholder`、灰色默认文字都兼容）；**边输入边预览**（250ms 去抖、一次手势一条撤销），回车或「应用文字」写入草稿，改回原文自动撤销。
- 去抖写入在撤回/重选/卸载时取消，写入前核对 host 仍是当初那个元素。

### 4.5 字体

- 「字体」写 `font-family`（受管属性，可直填任意家族栈；建议列表只是建议）。
- 「嵌入字体文件」：`.woff2/.woff/.ttf/.otf`，**上限 30 MB**；按扩展名判定 `format()`（`fontFormat()`）；以 **`css` 里 `selector='@font-face'` 的条目**存入（`fontFaceRule()`；引擎按 `selector { rule }` 渲染，**不要**再套包裹层）。删除该条目即卸载字体。
- **>2 MB 必须给出提示**：字体在文档里是 base64，文档每次编辑整份重发——保存会变慢；导出的 `.dshskin` 里它是原样文件。
- **整站字体三作用域**（`src/client/font-roles.ts`，UI 在「文字」分组）：`ui`=`:root { --dsw-font-family }`、
  `code`=`:root { --ds-font-family-code; --dsw-font-markdown-code-font-family }`、`text`=`TEXT_FONT_SELECTOR { font-family }`
  （对话内容槽 + `[class*="_markdown_"]` + 输入框）。要点：
  1. 全部是**普通 `css` 条目**——没有 schema 字段、没有引擎分支；用 `withRoleFont()` 写、`roleFont()` 读，清除即删属性（条目空了才删条目）。
  2. **两个 `:root` 角色（ui/code）必须按属性合并**：同一选择器上还住着背景强度标记（`--dsh-myskin-bg-opacity`），
     整条替换会悄悄吞掉先设置的那个角色。读/写都要走 `mergeDeclaration`/`withoutDeclaration`。
  3. **正文不要写 `!important`**：正文是作者级普通规则（皮肤样式表在最后，靠顺序取胜即可），加了 `!important` 会把段落里的行内 code 一起拽出代码脸。
  4. **别用 `body { font-family: … !important }` 代替界面角色**（0.3.8 的「应用到整页」就是这么干的）：它连代码块一起抢走。界面走 `--dsw-font-family`。
  5. 「本机字体」列表是**一个控件四个目标**（当前元素 + 三作用域）；写入作用域时用 `roleStackFor()` 附带同类兜底（`monospace` / `system-ui, sans-serif`），
     因为作用域会随 `.dshskin` 换机器。
  6. 这两个变量是**兼容契约**：`check:compat` 的「font roles resolve」会校验该代 DSH 仍在读它们（失效时字体"看起来应用了却没效果"，且没有任何报错）。
- **本机字体列表**：「本机字体」按钮 → `scanFonts(document, window)`（`src/client/fonts.ts`）。主路径是 Chromium 的
  Local Font Access API（`queryLocalFonts`，**需要一次用户手势 + 授权**，所以只在点击里调用，绝不在挂载时自动跑）；
  拿不到就退化为 `detectFamilies()`（canvas 文本度量逐个探测 `FONT_CANDIDATES`）。返回的 `source`（`local`/`detected`）与
  `denied` **必须显示在列表顶部**——两种来源的可信度不同，不能混为一谈。`scanFonts` 永不抛错（无 canvas 的 jsdom、
  被拒绝的授权、坏掉的 API 都只是列表短一点）。本机字体列表**不进皮肤文档**：皮肤里永远只存 `font-family` 字符串。

### 4.6 位置与缩放

- 值 = `transformValue(x,y,scale)`：恒等分量省略，全恒等返回 `''` → **删除 `transform`**（不留 `transform: none`）；解析用 `parseTransform()`（与生成互逆，有单测）。`transform` 是受管属性，极客模式手写的 transform 会被字段预览接管。
- 画布手势：选中框左上 ✥ 拖动＝双轴移动，右下角手柄＝等比缩放；拖拽 rAF 合并为**每帧一次**草稿写入、一次手势只压一条撤销。
- **写入必须用 `transformEdit(existing, x, y, scale)`**，不要用 `withManagedDeclarations`：后者会丢掉元素身上**全部受管属性**
  （宽高/内边距/字号……）只把 `transform` 加回来，面板预览又每帧补回去——这就是"拖动抽搐"的一半成因。`transformEdit` 只替换
  `transform` 一个属性，其余逐字节保留；恒等时**删属性**而不是写 `transform: none`；写的形态与面板一致（带 `!important`）。
- **面板字段是只读镜像**：`transformPreview(rule, fields, transformAuthored)` 决定这次预览该发什么。`transformAuthored=false`
  （画布手势进行中、或只是镜像）时**原样重发规则里那条 `transform`**，绝不拿慢一帧的字段值回写；只有用户真在面板里
  改过（输入 / 滚轮 / 滑块 / ↺ 重置）才是 `true`。改回"字段永远是事实来源"就会重新引入新旧坐标来回跳。
- **两个写者都不许用渲染闭包里的 `draft`**：`liveTransform` / `liveApply` 一律 `setDraft(prev => …)`。一次手势跨好几帧，
  旧基准会把别人（面板预览、文字、其它字段）刚写的改动悄悄回滚。
- **草稿样式表必须始终排在 `<head>` 最后**（`keepStylesheetLast()` + 一个 head 的 MutationObserver）：`applySkin` 每次接受
  设置变更都**新建并追加**一张样式表，选择器相同的规则按文档顺序决胜——"保存"之后已提交的**旧坐标**会压过草稿的**新坐标**，
  一拖就弹回去。退出编辑器时草稿样式表随卸载移除，一切照旧。
- 数值框滚轮微调：`stepValue()`（步进/两位小数/夹取）+ `attachWheelNudge()`（**必须原生 `{passive:false}`**——React 的 `onWheel` 是 passive，`preventDefault` 无效，面板会跟着滚）。X/Y ±1px（Shift ±10）、缩放 ±0.05（Shift ±0.25，夹 0.2–3）。
- X / Y / 缩放各有独立 `↺`，另有「重置变换（三轴）」。
- **对齐线（低敏吸附）**：移动/缩放时元素的三条边（起/中/末）与同级元素、父级容器、视口中线比对，
  `SNAP_THRESHOLD = 4`（px）内吸附并画对齐线。纯函数 `snapAxis()` / `snapMove()` / `snapScale()`（绕中心缩放时
  取像素误差最小的候选；中心对侧的线不算候选；退化盒不产生 NaN/Infinity），`snapTargetsFor()` **每个手势只采集一次**
  （transform 不 reflow，目标线不会动）。工具条「对齐」总开关，拖动时 **Alt** 临时关闭；对齐线是 1–2 个 fixed
  1px div，结束即清除。**别**把阈值调大（>6px 会让人没法精确定位），也别每帧重新采集目标。

### 4.7 画面

- **壁纸**：`canvas.background`（data URL 或 CSS 背景值）+ **背景强度**滑块（0.35–1，默认 0.75；拖动即时预览、松手 400ms 自动保存）。强度 = 每个像素上的画布覆盖度；持久化时**同时**写 `canvas.backgroundOpacity` 与 `css` 里的 `:root { --dsh-myskin-bg-opacity: … }` 标记（旧 schema 下也能往返）。
- **嵌入图片**：先在画布上选中容器，再选文件；可拖动/缩放/调不透明度与混合模式。
- **令牌面板**：按背景/边框/品牌色/文字/按钮/交互分组逐项覆盖 `--dsw-*`。

### 4.8 保存 / 应用 / 关闭

| 按钮 | 行为 |
|---|---|
| **保存** | 写入皮肤文档并**留在**绘制模式；不改 `enabled` |
| **应用** | 写入 + `enabled: true`，成功后**退出**绘制模式 |
| **✕ 关闭** | **直接关闭并舍弃未保存的改动**（第二次 Esc 同义）。写入只有 保存 / 应用 两条路 |
| **卸载收尾** | 必须把**嵌入标记交还已提交文档**：草稿里被移走/删除/换锚的图片标记收回，已提交图片按自己的锚点重标记。✕ 之后页面必须等于"文档说了什么" |

工具条显示保存状态（有未保存的更改 / 保存中 / 已保存 / 保存失败：<字段名>）。`ConfigForm.set` 对非 volatile 路径或 schema 不匹配返回 `false`，按字段报出。

**`保存失败：canvas` 的两种含义**（`src/client/save-report.ts` 负责把它们分开写进提示）：

1. **宿主 schema 比客户端旧**——最常见的那个。装了新版本但**没重启 DSH**：客户端已经会写新字段（例如锚点 `kind: 'group'`），
   运行中的宿主仍用旧 union 校验，**整个 `canvas` 字段**被拒（`css` 是自由文本所以照样成功）。判定依据：源码 schema 有
   `tests/schema.test.mjs` 钉着"整组锚点能存住"，因此"运行中的宿主拒了它"⇔"运行中的宿主是旧的"。
   **改过 `src/host-schema.ts` / `src/skin-schema.ts` 的版本必须重启 DSH**（客户端半区 `patchReload: live` 可热更；宿主半区不行）。
2. **画布数据过大**：图片以 data URL 内嵌在 `canvas` 里，面板会显示约多少 KB，换小图即可。

### 4.9 动效与性能不变量

动效集中在 `src/client/canvas-ui.ts`（编辑器自有样式表，随挂载/卸载，可逆）：

1. **只允许 `transform`/`opacity`**；禁止动画 width/height/margin/padding（面板宽度驱动整页内缩，动画宽度＝每帧重排整个应用）。
2. **禁止 `backdrop-filter`**（给实时页面做模糊最贵）。
3. 滚动/缩放重绘 **rAF 合并为每帧一次**；悬停命中测试每帧最多一次且只在 edit 模式装载。
4. 必须有 `prefers-reduced-motion` 分支。
5. 颜色只用 `--dsw-alias-*` 令牌（不写死十六进制）。

6. **flex 子项 + `overflow: hidden` = 自动最小尺寸 0**：面板里任何"可滚动列表"都**不能**是高度受限 flex 容器里的 flex 子项——
   会被压到只剩 padding 高度，再被自己的 `overflow: hidden`（为省略号而设）裁掉整行。本机字体列表 224 行就是这样"整列表消失"的
   （显示「本机字体 · 224」+ 空列表 + 两条滚动条）。约定：**列表行** `flex: none` + `min-height` + `box-sizing: border-box`；
   **列表容器**用定高**块级**滚动区；**卡片/编辑列** `flex: none`，滚动交给面板。

`tests/canvas-ui.test.mjs` 与 `tests/engine.test.mjs` 钉住这些不变量。

### 4.10 回收站（移除的组件）

- **列表是派生的，不是第二份状态**：`removedControls(css)` 扫出所有带 `display: none` 的规则 = 回收站内容；
  `isRemovedRule()` 按解析后的属性/值判断（不是对整个规则块做正则），`!important` 与无空格写法都算数。
  **不要**新增 schema 字段来存"被移除的组件"——那会多出一份可能与真实文档不同步的状态，还得处理旧文档迁移。
- **恢复**：`withControlRestored(css, selector)` 只删 `display`；删空了就整条规则消失（不留空壳）；`withAllControlsRestored(css)` = 全部恢复。
  入口只有两处，且**都在绘制模式里**：Inspector 的「恢复显示」（当前选中元素）与右侧面板的「回收站」（单项 / 全部）。
  **不要**在皮肤管理页再放一份（0.3.9 短暂放过，已按需求撤掉）：回收站是"把东西拿回来"的动作，属于编辑态；
  皮肤管理页是只读总览，恢复操作应当回到绘制模式里做。
- **恢复必须"立刻可见"**：草稿里删掉 `display` 只够用于从未保存过的移除。已保存的那份皮肤是**另一张同选择器的样式表**，
  它还会 `display: none !important`。做法：`naturalDisplayOf(el)` 把两张皮肤样式表**同步摘出文档**（`<head>` 里不可能
  发生绘制）量出元素本来该用的 `display`，再**按原位置放回**——用 `sheet.disabled` 不行（jsdom 不实现该 IDL 属性，
  而且留在文档里的样式表照样生效）。量到的值进 `restoredLive`，由编辑器的草稿层以 `!important` 发出；撤销、重新移除、
  保存、应用、还原都会清掉它。**它绝不进皮肤文档**。
- 元素仍在 DOM 里（`display:none` 只是不渲染），所以列表项用 `elementLabel()` 给出人类可读的名字，选择器退居 `title`。

### 4.11 嵌入图片的锚定

- **数据**：`EmbeddedImage.anchor = { kind: 'element'|'text'|'component'|'group', value, label? }`（`src/skin-schema.ts`）；
  **旧文档没有这个字段**，统一由 `anchorOf(img)` 归一化为"元素锚 = `fallbackSelector`"，所以 `0.3.8` 的皮肤/皮肤包照常工作。
  这个字段**必须同时在 `src/host-schema.ts` 里**（`imageAnchor`）：DSH 每次写入都过一遍 schema，Host 不认识的字段会被**静默丢掉**。
  `cloneSkin` 要**深拷贝** anchor（嵌套对象，浅拷贝会让编辑穿透到持久化文档）。
- **整组锚点（`kind: 'group'`）**：值为**组选择器**，`resolveImageTargets()` 取**全部命中**并给每一个打 `data-dsh-myskin-embed` 标记 ——
  一张图因此出现在**每一条工作区行**上，**之后新建的行**由共享的重标记循环补标记；成员离开组时**收回标记**（`previous` 与 `targets` 求差集），dispose 收回全部。
  重标记循环必须监听 `aria-expanded`/`aria-selected`——它们正是侧栏"种类"的语义标记，折叠/展开会改变组成员。**别**退回单点 `querySelector`（只会摘第一个标记）。
- **解析**：`resolveImageTargets(img, doc)`（单点锚返回 1 个；整组锚返回 N 个）→ 内部 `resolveImageAnchor(img, doc)` —— 锚点优先 → 冻结的 `fallbackSelector` → 上次命中的节点/祖先指纹（在 applySkin 的重标记循环里）。
  文字锚用 `findByText()`：**精确匹配优先于包含匹配，最深的元素优先于祖先**，`INPUT/TEXTAREA` 走 `placeholder`；
  `anchorTextOf(el)` 是"取选中文字"用的取值口（走 `textHostOf`，与 Inspector 的「编辑文字」看到的是同一个字符串）。
- **目录**：`src/client/anchors.ts` 的 `ANCHOR_COMPONENTS` **只收本包已在别处依赖、且被 check:compat / 引擎盯住的标记**
  （`#root` / `_frame` / `_centerCol` / `data-slot="conversation.session"` / `data-composer-seat|input|placeholder` / `[role="tree"]`）。
  加新部位前先确认它在两个 DSH 代次上都存在——目录里一个会漂移的选择器，表现是"图片静默消失"。
- **两种呈现**（`EmbeddedImage.mode`，缺省 `embed`）：`embed` = **组件嵌入**，锚点元素上的 `::after`（在组件内、被组件裁剪，0.3.8 行为）；
  `anchor` = **组件锚定**，`mountImageOverlay()` 的皮肤自有覆盖层（`position: fixed; inset: 0; pointer-events: none; z-index: 900`，
  每个图一个 `position: absolute` 的节点，left/top = 锚点 rect + x/y）。**绝不要**为了"显示到组件外"去改宿主的 `overflow`/`position`——
  那是在改应用自身的布局，锚定层的存在就是为了不用这么做。锚定层的矩形在 scroll(capture)/resize/DOM 变更时重算并 rAF 合并；
  解析不到锚点就 `display: none`（宁可暂时不显示，也不能贴错节点）；`sync()` 只在值变化时写样式，且 observer 会忽略覆盖层自身的 mutation（否则自激循环）。
- **渲染不变（组件嵌入）**：锚定只决定"标记打在哪个元素上"，CSS 依旧打在 `[data-dsh-myskin-embed="<id>"]` 上（`position: relative` + `::after`）。
  **不要**为了让锚点生效去改样式表——那会把"跨 React 重建的重新解析"这条能力绕过去。
- **编辑器独占标记**：编辑器打开期间，引擎的嵌入标记循环会跳过（`[data-dsh-myskin-canvas="1"]` 存在即跳过）——它预览的是草稿，
  引擎按已提交文档重标记会在一次 DOM 变更后把"草稿里刚删掉的图"复活。关闭（保存或舍弃）时由编辑器把标记交还已提交文档。
- **编辑器**：打开绘制模式时按草稿里的锚点重新标记真实页面（`imageAnchorSignature` 驱动的 effect，换锚点=旧元素摘标记、新元素打标记），
  所以改锚点**即时可见**、不必先保存；面板用 `anchorResolves` 显示 `✓ 已锚定` / `⚠ 找不到锚点`。
- **dispose 必须摘掉标记**：`data-dsh-myskin-embed` 是本包自己打上去的，随皮肤一起撤（只摘本皮肤图片 id 的那些）。
  留着它会让"关掉皮肤"之后页面仍带标记，并让下一次 apply 跟过期 id 抢位置。

## 4.12 预设主题（`src/client/presets.ts`）

三套内置调色板（`deep` 深海 / `warm` 暖阳 / `rose` 粉黛，外加 `default` = 空覆盖）走**官方令牌通道**
（`ctx.theme.overrideTokens` + body 变量绑定），每个令牌都是 `{ light, dark }` 成对。改预设必须同时满足三条不变量
（`tests/preset-contrast.test.mjs` 全都会跑红）：

1. **文字对比度**：`label-primary` / `label-secondary` 在其实际落面上 ≥ 4.5；`label-tertiary` ≥ 3；`caption` ≥ 2.6；
   `dimmed` ≥ 2.2（DSH 自带的 dimmed 只有 1.07–1.9，只能更好不能更差）；品牌色在 `bg-base` / `bg-layer-1` 上 ≥ 3。
   ⚠️ **`button-primary-fill` 在 DSH 里就等于 `brand-primary`，它的文字是 `label-primary-foreground`**——三者必须一起看
   （0.3.9 之前暗色只有 2.84:1）。
2. **令牌名必须真的存在**：写错的 `--dsw-*` 不会报错，只会变成没人读的变量
   （本次抓到 `--dsw-alias-menu-surface-fill`，真名是 `--dsw-menu-surface-fill`）。校对用 `tests/helpers/dsh-tokens.mjs`：
   它从安装的 DSH 主题包解析浅/深两套默认值，并解析 `var()` 链。
3. **不得留下另一套模式的面/字**：三套现在都**跟随应用的明暗模式**（浅色列＝浅色界面，深色列＝深色界面），所以 DSH 自己的面天然一致。
   如果将来要再加“强制某一模式”的预设（旧版 `night` 极夜就是：两个列都写深色），它**必须**额外覆盖 DSH 只在另一模式下才解析的那批面，
   否则就是“深色界面里一块白底 + 白字”：
   `bg-document-preview` / `bg-multi-select` / `button-ghost-active-fill` / `file-diff-*-bg` / `specific-bubble(-highlight)` /
   `specific-login-input` / `specific-tip` / `--dsw-menu-surface-fill` / `menu-group-header-fill` /
   `specific-sidebar-nav-item-active-accent` / `menu-icon` / `label-document-preview` / `label-primary-bluish` / `label-primary-dimmed`。
   测试的允许列表只放“故意反色”的令牌（toast / tooltip / skeleton / `*-inverted` / 选择遮罩），第 3 条不变量对任何预设都会跑。
4. **品牌推导面要一起改**：DSH 用自家蓝色推导出 `specific-bubble`（用户自己的消息气泡）、`specific-bubble-highlight`、`specific-sidebar-nav-item-active-accent`、
   `label-primary-bluish`。换色相却不改这几项，界面上就会留一块“别家的蓝”——三套预设统一走 `brandTinted()`。

## 4.13 组块编辑（`src/client/groups.ts`）

面板顶部「编辑范围：仅此元素 / 整组」。整组时 Inspector 写入的不是 `selectorOf(target)`，而是**同类元素的公共选择器**——
因此**天然覆盖之后新建的实例**。它是普通 `css` 条目：无 schema、无引擎分支，极客模式可见、可单独清除。三份契约：

1. **按 ARIA 语义分组，不靠 class 哈希**：侧栏树 `[role="tree"]`；工作区行 `[role="treeitem"][aria-expanded]`；
   对话行 `[role="treeitem"]:not([aria-expanded])`（= 引擎树装饰器与 `check:compat` 已在依赖的契约）。
   **绝不在树内放宽作用域**：宁可返回"无组"，也不能给出一个同时命中工作区与会话的选择器。
2. **会话行嵌在工作区行内部**，所以块选择器 = `行选择器 + 行内相对路径`（`… [aria-expanded] > button.icon_hash[aria-label="…"]`）。
   用后代选择器会把对话行的按钮一起吞掉——有回归测试专门断言"任何会话行按钮都不得匹配工作区块"。
   行内图标按钮常共用组件类，用**可访问名**（`aria-label` / `title`）区分——**但该属性必须命中 ≥ 2 个才算组键**：
   DSH 的行内按钮标签是按实例插值的（`t("actions.workspace.aria", { name })` → "…cy-nav 的操作"），
   若接受 1 命中的候选，就会得到一个"只有一个成员的组"——面板写着整组、实际一行不动（正是用户实测到的现象）。
3. **识别到的"种类"即使只有一个成员也成组**（工作区行 / 对话行 / 侧栏树）：需求是"改一个，**之后新建的**也跟着变"，
   若按"命中数 > 1"把关，用户在只有一个工作区时就用不了这个功能。**只有**"同类元素"（`peers`，靠重复推断出来的）才要求 ≥ 2；
   散落在无关父节点之间的类仍然直接拒绝——**绝不给出一个会悄悄改掉半个界面的选择器**。
4. **类名识别两种 CSS-module 形态**：0.1.x `_row_1abc2_34` 与 0.2.x `bhn1Oq_projectRow`（哈希在前）；都优先于裸类名，避免把工具类带进选择器。
5. **范围要看得见**：整组时画布给其余成员逐个描虚线框，选中标签追加「整组 N」——用户改之前就得知道这次编辑会覆盖谁。

**整组间隔**（`gapSelectorFor` / `withGapRule` / `gapOf` / `gapLength`）写成 `组选择器 + 组选择器 { margin-top }`：
只动成员**彼此之间**、不碰首成员与容器顶，且**与 DSH 自己的分行方式同构**（`[role=treeitem]+[role=treeitem]` / `groupSection > * + *`）。
成员不是**相邻兄弟**时（例如分属不同工作区的对话行）`gapSelectorFor` 返回 `undefined`：UI 说明原因，而不是给一个点了没反应的字段。
裸数字按像素、带单位的原样写入（`gapLength`）；一次编辑一个快照。

**切换范围要迁移声明**（`moveRuleToBlock`）：面板只在字段变化时写规则，所以"切到整组"必须顺手把该元素已有声明搬到组规则并删掉单元素规则
（一次快照、可撤销）；否则用户切过去会看到"整组开了但别的行没变"。

配套：Inspector 的字段/变换/隐藏/移除/清除都走 `activeSelector`；**文字替换始终单元素**（每行名字不同）；
画布拖动在整组时也作用于整块（与在 X 字段改数字等价）；切换选择时 `scope` 保持，但组不可用时自动回落到单元素。

## 5. 皮肤包 `.dshskin`

- **形态**：标准 ZIP，**STORE**（未压缩）写入。`manifest.json` = 完整配置（`format`/`formatVersion`/`generator`/`name`/`createdAt`/`assets`/`stats` + `skin` 全量文档）；`assets/<kind>-<n>.<ext>` = 原样字节（壁纸/嵌入图/嵌入字体）；`README.txt` = 包内说明。
- **引用**：包内文档把 data URL 换成 `dshskin:assets/image-1.webp`；这类引用**只允许存在于包内**，运行时文档永远是 data URL（引擎/样式表不认识 `dshskin:`）。
- **兼容**：读支持 STORE + DEFLATE（普通 zip 工具重打包后仍可导入）；逐条目 CRC 校验；缺资源**点名报错**；旧 `.json` 导出仍可导入；`formatVersion` 高于本包时拒绝并提示升级。
- **实现**：`src/client/dshskin.ts`（零依赖：ZIP 写/读、CRC-32、data URL 编解码、`toArrayBuffer()`）。**不要**改成 DEFLATE 写入（浏览器半区不想背 codec），也**不要**把 `dshskin:` 引用泄漏进运行时文档。
- 体积：实测一份主题 JSON 351 KB → 包 141 KB（−59.8%）；同一资源多处引用只存一份。

## 6. 皮肤库与导入导出

- 皮肤库：「保存为皮肤」把当前文档存成命名条目；支持重命名/上移下移/复制/加载/删除。
- **导出**：`.dshskin`（第 5 节）。**导入**：接受 `.dshskin` 与旧 `.json`。
- **导入/加载 = 整体替换文档**：先「导出皮肤」备份；不想丢壁纸就带 `canvas.background`，不想丢皮肤库就带 `library`。

## 7. 运行时生命周期（`applySkin`）

按序应用：**tokens** → `ctx.theme.overrideTokens` + body 变量绑定；**css / canvas.background / canvas.images** → 皮肤自有 `<style>`；**layers** → 注入真实节点；**content.workspaceTree** → 打 `data-maid-*`；**text** → 文本替换（共享 MutationObserver，React 重建后重贴）。

返回 `{ dispose }`：置 `disposed` 守卫并移除全部皮肤自有写入，`body.outerHTML` **字节级还原**——引擎不写 body 内联 style（`src/client/skin-engine.ts`）。

## 8. Agent 工作流：设计并交付一套主题

> §0 是**面向用户的对话流程**（`/dsh-myskin` 进入），本节是把它的产物落到文件、校验与交付上的**工程步骤**。两者配合使用。

1. **只读现状**：读该 profile 的 `cordis.patch.yml` → `id: dsh-myskin` 的 `config`（注意 `!!js` 标签）。
2. **设计**：产出完整 `SkinSettings`。
3. **校验**：每个 `--dsw-*` 必须存在于当前 DSH 的 `@deepseek-ai/dsh-client-ui-theme`（未知令牌静默无效）；`tokens` 每项 `{light,dark}` 成对。仓库内可跑 `npm run check:compat` / `npm test`。
4. **交付**：写成 `.dshskin`（或用 JSON），由用户「皮肤管理 → 导入皮肤」导入；也可存进 `library` 交给用户点「加载」。
5. **不要手写 profile patch**（红线，且单行 170 KB+ 的 YAML 极易写坏）。

## 9. 安全 / 可逆（红线）

1. `enabled:false` 或清空文档 = 精确还原，无需重启。
2. 不改 DSH 源码 / 全局配置；不 kill、不重启 DSH（重启交给用户）。
3. 皮肤自有节点带 `data-dsh-myskin-layer` / `data-dsh-myskin-owner` / `data-dsh-myskin-ui` 标记，dispose 精确移除；不写 body 内联 style。
4. 写 profile 文件、写工作区外文件前先申报并取得确认。

## 10. 常见坑

- **令牌**：必须存在于当前 DSH，且 `{light,dark}` 成对；0.1.7 已移除 `--dsw-alias-fill-tsp-secondary`、`--dsw-alias-label-error`、`--dsw-alias-label-quaternary`。
- **图标**：0.1.7 起 `IconXxxOutline16` → `...Regular/Medium`，统一走 `src/client/icons.ts` 候选表。
- **schema 顶层字段变化**：要重建 bundle 并让 Host 半区重新加载——**客户端半区可热更，宿主半区只能靠重启 DSH**。
  症状很具体：客户端写新字段、宿主用旧 schema 校验 → **整个 `canvas` 被拒**，工具条显示 `保存失败：canvas`（而 `css` 成功）。详见 §4.8。
- **选择器必须在 portal 里也能匹配**：设置/菜单/弹窗是 `createPortal(…, document.body)`（在 `#root` 之外），一律用 `selectorOf()` 生成；以 `#root` 打头去指设置页元素会静默失效。
- **皮肤不生效**：看 console；看有没有 `<style id="dsh-myskin-rule">`；确认该 profile 真的服务了 `dsh-myskin` 条目。
- **保存失败**：文档太大（大图 / 大字体）。壁纸按最长边 1600 / WebP 0.85 压缩，data URL 超 1.5 MB 逐级降到 1280/960，仍超标拒收；嵌入图按最长边 2048 压缩。
- **启动报 `dsh-myskin (dsh-myskin): failed to import`**：真实异常被 app-boot 吞了。先按第 1 节的 `import()` 命令验证宿主半区，再查 `dsh.profile.bundles` 与目录名。
- **本机字体读不到**：`queryLocalFonts` 只有 Chromium 内核有，且需要一次用户手势 + 授权；被拒或没有该接口时走候选探测，
  面板顶部会写明来源。别把枚举放到挂载时自动跑（没有手势会被拒），也别把列表当成皮肤文档的一部分。
- **`npm install` 陷阱**：`NODE_ENV=production` 会跳过/清掉 devDependencies（构建、测试、类型检查全失效），请用 `npm install --include=dev`。

## 11. 源码指向（0.3.9）

- `cordis.patch.yml` — bundle 层，声明 `id: dsh-myskin`。
- `src/index.ts` / `src/host-schema.ts` — Host 半区：`Config` + `name`；`Config` 顶层字段全部 `.volatile()`。
- `src/skin-schema.ts` — 数据模型（`SkinSettings` / `parseSkin` / `cloneSkin`）。
- `src/client/index.ts` — 浏览器半区：`configForms.whileServed` + 实时皮肤生命周期（`inject` 只列真正用到的服务：`slots/locale/configForms/theme`，它是**激活门禁**）。
- `src/client/skin-engine.ts` — 可逆引擎 + 画布纯函数（`pickElementAt` / `textHostOf` / `selectorOf` / `withManagedDeclarations` / `sameDeclarations` / `stepValue` / `transformValue` / `parseTransform` / `transformEdit` / `transformPreview` / `fontFaceRule` / `fontFormat` / `elementLabel` /
  `declarationOf` / `removedControls` / `isRemovedRule` / `withControlRestored` / `withAllControlsRestored` / `naturalDisplayOf` / `keepStylesheetLast` /
  `resolveImageAnchor` / `anchorTextOf`）。
- `src/client/MySkinSection.tsx` — 「皮肤管理」页 + 画布编辑器（含 `WheelNudge` / `ElementBox` / `Section` / `Field` / `RecycleBin`）。
- `src/client/anchors.ts` — 嵌入图锚定目录（`ANCHOR_COMPONENTS` / `anchorOf` / `anchorKey` / `anchorLabel` / `componentById`）。
- `src/client/save-report.ts` — 保存失败诊断（`diagnoseCanvas` / `canvasLooksOversized` / `CANVAS_LARGE_BYTES`）。
- `src/client/groups.ts` — 组块编辑（`elementGroupFor` / `groupLabelKey` / `WORKSPACE_ROW_SELECTOR` / `SESSION_ROW_SELECTOR` / `EditScope`）。
- `src/client/font-roles.ts` — 整站字体三作用域（`FONT_ROLES` / `roleFont` / `withRoleFont` / `roleStackFor` / `TEXT_FONT_SELECTOR`）。
- `src/client/fonts.ts` — 本机字体枚举（`scanFonts` / `queryLocalFonts` / `detectFamilies` / `normalizeFamilies` / `filterFamilies` / `quoteFamily` / `FONT_CANDIDATES`）。
- `src/client/canvas-ui.ts` — 编辑器外观与动效样式表（`canvasUiRules` / `mountCanvasUi` / `setDrawCursor` / `attachWheelNudge`）。
- `src/client/dshskin.ts` — 皮肤包读写（零依赖 ZIP + 资源抽取/回填）。
- `src/client/desktop.ts` / `icons.ts` / `presets.ts` / `token-catalog.ts` / `locales.ts` — 桌面壳适配 / 图标候选表 / 预设 / 令牌目录 / 中英文案。
- `tests/`（含 `fixtures/xingye-theme.skin.json` 全量主题夹具）、`scripts/`（build / check-compat / check-types）— 改动后跑 `npm test`（132 例）、`npm run check:types`。
  **注意**：`npm run check:compat` 在本机（0.3.8 起）会崩在 `RangeError: Invalid string length`——它的第 5 节把整个 pnpm store
  的源码拼成一个字符串，已超过 V8 上限；需要那一节时用**逐包分块匹配**代替（19 条 DOM 契约照常判定），别以为是自己改坏了。
