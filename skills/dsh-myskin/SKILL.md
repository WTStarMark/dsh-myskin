---
name: dsh-myskin
whenToUse: "用户输入 /dsh-myskin（设计自己的主题的入口）或要求给 DSH 换外观、做皮肤、改配色/字体/文字/嵌入图；安装或卸载 dsh-myskin 插件；编写、导入导出、调试 .dshframework 皮肤包；排查皮肤不生效、嵌入图与锚点、回收站、组块编辑与整组间隔、**跨界面改同一个组件（全站作用域）或按界面显示/隐藏（界面显示：对话 vs 设置/插件页）**、绘制模式面板遮挡（其他插件界面被压住、换边停靠）、以及「保存失败：canvas」；或读写 dsh-myskin 的设置条目。"
description: DSH 全兼容皮肤可视化编辑框架 dsh-myskin 0.4.1 的完整说明与操作指向：装载（profile bundle）、皮肤文档字段（tokens/css/text/canvas/layers/content/library）、绘制模式（画布编辑器：选择、样式分组、文字、字体、本机字体列表、位置与缩放、回收站、面板停靠与遮挡诊断、动效与性能约束）、皮肤包 .dshframework 的读写格式、皮肤库与导入导出、可逆性红线。Use when the user asks to change the DSH look, apply or manage a dsh-myskin skin, install this plugin into a DSH profile, author or debug a skin document, or read/write the `dsh-myskin` settings entry.
---

# dsh-myskin 技能（包版本 0.4.1）

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
| 要不要背景图 / 嵌入图 | 决定是否走绘制模式与 `.dshframework` 里的素材 | `canvas` / `layers` |

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

- **路径 A（推荐，可交付文件）**：把皮肤文档打成 `.dshframework` 放到用户工作区，让他在「皮肤管理 → 导入皮肤」里选它。
  纯 Node 可用、零 DOM：`src/client/dshframework.ts` 的 `packSkin(skin, { name, generator })` → 写盘即可；
  参考 `tests/dshframework.test.mjs` 里的最小文档形状（`tokens` / `css` / `text` / `canvas` / `layers`）。
- **路径 B（手把手）**：给一张**可粘贴清单**——令牌表（`--dsw-*` → light / dark 两列）、css 规则、字体栈；
  用户在「皮肤管理」里逐项填（css 走极客模式粘贴，字体走「界面 / 正文 / 代码」三行）。

**红线**：不直接改 profile 的 `cordis.patch.yml`（皮肤文档就存在那里，属 R-001 保护区），不碰 `/opt/dsh-web/**`。

### 0.5 交付前必须过的底线（不达标不许交付）

- 对比度：**正文 / 次级 ≥ 4.5:1**、三级 ≥ 3:1、caption ≥ 2.6、dimmed ≥ 2.2；主按钮文字与填充 ≥ 4.5；品牌色在主背景上 ≥ 3。
- 令牌必须**存在于当前 DSH**，且 `{light, dark}` 成对；不得留下"另一套模式的亮面 + 本模式的暗字"。
- 参考实现：`src/client/presets.ts` 的对比度算法与 `tests/preset-contrast.test.mjs`（改预设时会直接跑红）。

### 0.6 收尾必报四件事

1. 用了哪些令牌与 css 规则（可核对）；2. 对比度怎么算过的；3. 怎么**一键还原**（「还原默认」/ 关「启用皮肤」）；4. 怎么导出 `.dshframework` 备份。

### 0.7 三个起步配方

- **深色 + 青色（技术感）**：起点 `deep`；`--dsw-alias-brand-primary` 明色改青系（如 `#0891b2`）、暗色提亮；背景/表面走蓝黑，边框比表面亮一档。
- **浅色纸质（阅读向）**：起点 `warm`；背景偏米（`#faf6ee` 量级）、正文加深到 ≥ 7:1，圆角收小、阴影减弱。
- **高对比（可读性优先）**：任意起点；正文提到 ≥ 7:1、三级提到 ≥ 4.5:1、边框加深，品牌色只用于交互态。

> 改完必须**自己按 §0.5 算一遍对比度**再交付——预设之所以能"闭眼选"，就是因为这些底线被测试钉着。
## 1. 项目是什么 / 怎么装载

DSH **全兼容皮肤可视化编辑框架**：在真实界面上点选即可改外观、配色、字体与排版，导出 `.dshframework` 皮肤包分发。非侵入、完全可逆——不改 DSH 源码/配置，不改 DSH 进程。

- 形态：**profile bundle**。包内 `cordis.patch.yml` 声明条目 `id: dsh-myskin`，由该 profile 的 `dsh.profile.bundles` 选中。
- 目标 profile：Web = `$DSH_HOME/profiles/web`，Desktop = `$DSH_HOME/profiles/desktop`；**两者各装一次，皮肤文档互不共享**。
- **本技能自身的注册**：技能是**目录包** `$DSH_HOME/skills/<name>/SKILL.md`（frontmatter 写 `name` / `description` / `whenToUse`），
  由 DSH 的 `skill-filesystem` 提供者扫描 + 热监听；包内 `skills/dsh-myskin/` 用一条软链即可注册：
  `ln -sfn <包目录>/skills/dsh-myskin "$DSH_HOME/skills/dsh-myskin"`（**不需要重启**，下一次技能目录刷新即生效；删链即注销）。
- **首选装法（界面）**：DSH 的 **设置 → 插件 → 添加插件**，填 **GitHub 仓库地址**（`https://github.com/WTStarMark/dsh-myskin`，可带 `#v0.4.1`）、npm 包名或**本地目录路径**；安装由 **pnpm** 执行，成功后插件管理器会**自动**把包名写进该 profile 的 `dsh.profile.bundles`。界面明确提示：插件**不支持自动更新**，升级要**先卸载再安装**。
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

设置 →「皮肤管理」→ **绘制模式**：先关闭设置弹窗，再把**真实页面内缩**（顶部工具条 + 一侧 340px 面板各占一块，不覆盖 DSH），**不是 iframe 复制**。退出即还原页面布局。面板可折叠（折叠后页面自动铺满）。上游设置/快捷键弹窗按同一条内缩规则收口（`--dsh-myskin-inset-top` 与 `--dsh-myskin-inset-x`，Windows 再叠 `--dsh-myskin-chrome-top`）。

**停靠侧（左 / 右）**：默认右侧；工具条可一键把面板**连同页面内缩**换到另一侧（`src/client/dock.ts`）。

- 全流程只有**一处状态**：`<html data-dsh-myskin-dock="left|right">`。帧样式表打开时**只写一次**、两个版式都在里面，切换＝改一个属性——不重建样式表，也就没有「只换了一半」的中间态。
- 面板占用的宽度发布为 `--dsh-myskin-inset-x`（指向 `--dsh-myskin-inset-left/right`，编辑器把两侧都写成同一个实测值）；**与侧别无关**的规则（弹窗高度与上限）只读它，只有 `body` 的水平 margin 写两遍。
- 偏好存浏览器 `localStorage`（键 `dsh-myskin.dock`）——**不进皮肤文档、不碰宿主 schema**（所以不需要重启 DSH）；坏值 / 隐私模式 / 存储被拒一律退回默认。切换走 `useLayoutEffect`：属性与面板在同一次提交里翻面，否则会有一帧 340px 跳变。
- **为什么要能换边**：页面内缩用的是 `body` 的 margin，只挪得动应用自己的布局；**`position: fixed` 的第三方插件界面不跟着走**，会正好落在面板底下——既点不中，也看不见改完的样子（本机 DSH 0.2.0-rc.2 的 `_frame` 是 `position: relative; height: 100%`，所以被挡住的必定是「钉在窗口边上」的那一类）。
- **遮挡自诊断**（`src/client/occlusion.ts`）：面板打开时**每 1.5 秒**（不是每帧）在面板区域内按 2×4 网格做命中测试，跳过自有 UI 与 `html/body/#root`，第一个剩下的元素就是「被压住的组件」；工具条第 2 行随即给出 `⚠ 面板挡住了 <元素名> · ⇤ 面板靠左`，点一下即换边。判定与画布选择共用同一个 `isOwnElement`（模块级、按 `ownerDocument` 判定）；没有命中测试能力的环境返回「没被挡住」而不是抛错，结果不变时保持同一个数组引用（不触发重渲染）。它只报出事实与一个可逆入口，不改元素、不猜 z-index。

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
- **>2 MB 必须给出提示**：字体在文档里是 base64，文档每次编辑整份重发——保存会变慢；导出的 `.dshframework` 里它是原样文件。
- **整站字体三作用域**（`src/client/font-roles.ts`，UI 在「文字」分组）：`ui`=`:root { --dsw-font-family }`、
  `code`=`:root { --ds-font-family-code; --dsw-font-markdown-code-font-family }`、`text`=`TEXT_FONT_SELECTOR { font-family }`
  （对话内容槽 + `[class*="_markdown_"]` + 输入框）。要点：
  1. 全部是**普通 `css` 条目**——没有 schema 字段、没有引擎分支；用 `withRoleFont()` 写、`roleFont()` 读，清除即删属性（条目空了才删条目）。
  2. **两个 `:root` 角色（ui/code）必须按属性合并**：同一选择器上还住着背景强度标记（`--dsh-myskin-bg-opacity`）与壁纸锚定标记（`--dsh-myskin-bg-anchor`），
     整条替换会悄悄吞掉先设置的那个角色。读/写都要走 `mergeDeclaration`/`withoutDeclaration`。
  3. **正文不要写 `!important`**：正文是作者级普通规则（皮肤样式表在最后，靠顺序取胜即可），加了 `!important` 会把段落里的行内 code 一起拽出代码脸。
  4. **别用 `body { font-family: … !important }` 代替界面角色**（0.3.8 的「应用到整页」就是这么干的）：它连代码块一起抢走。界面走 `--dsw-font-family`。
  5. 「本机字体」列表是**一个控件四个目标**（当前元素 + 三作用域）；写入作用域时用 `roleStackFor()` 附带同类兜底（`monospace` / `system-ui, sans-serif`），
     因为作用域会随 `.dshframework` 换机器。
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

**层级（z-index）**：「位置与缩放」组里的一个普通字段，写 `z-index: N !important`，**已进 `INSPECTOR_PROPERTIES`**（受管属性）——
清空即从规则里删掉，不会留下清不掉的数字。滚轮 ±1 / Shift ±10；右边一排常用值（0/10/100/1000）。
**看不到变化必须解释**（`src/client/stacking.ts`，`stackingReport`）——三类原因缺一不可：
1. **定位**：z-index 只对已定位元素（与 flex/grid 子项）生效，`static` 时字段下方写明并给「设为 relative」；
2. **层叠上下文**：`nearestStackingContext()` 找出最近的一个（`stackingContextReason()` 给出理由：transform / opacity / 它自己的 z-index…），
   那是**天花板**——诊断要**点名祖先**；
3. **没有重叠**：`stackingReport().neighbours` 为空时必须说「改数字本来就不该有变化」，否则用户分不清「没生效」与「没写进去」。
邻居 = 兄弟 + 父级兄弟里**真正与它重叠**的（排除本插件自己的 UI 与祖先/后代），最多 6 个；
**「置顶（max+1）」/「置底（min-1）」**按真实竞争者算数字——`static` 元素上这两个按钮会顺手 `onAddDeclaration(sel, 'position: relative !important')`，
否则「让它在别人上面」正好产生那种「什么都没有发生」。

### 4.7 画面

- **壁纸**：`canvas.background`（data URL 或 CSS 背景值）+ **背景强度**滑块（0.35–1，默认 0.75；拖动即时预览、松手 400ms 自动保存）。强度 = 每个像素上的画布覆盖度；持久化时**同时**写 `canvas.backgroundOpacity` 与 `css` 里的 `:root { --dsh-myskin-bg-opacity: … }` 标记（旧 schema 下也能往返）。
  **可选的「壁纸跟随对话区」**（`BackgroundAnchor`，默认 `viewport`）：默认整页壁纸用 `background-attachment: fixed`，以**窗口**为参照——
  侧边栏一收，对话区挪了而图没动；勾上后**对话区列**自己再画一份同样的图并锚在**它自己的框**上（`background-attachment: scroll`，**不是 fixed**），
  于是列一有新的框就重新居中，**纯 CSS、零脚本**（不要为它加 resize 监听）。代价是侧边栏仍是整页那份、两边取景不同——所以是**可选项**，面板里也这么写。
  **两条容易踩的坑（都踩过）**：①**引擎的 apply 路径必须把锚定传进 `wallpaperRules()`**——只改编辑器预览会造成「绘制模式像是对的、交互模式毫无变化」，
  而交互模式正是唯一能收起/展开侧边栏的地方（引擎级测试专门钉住这个调用点）；②开关**必须有自己的 `<label>`**：
  套在滑块的 label 里时，点那一行会去激活滑块（label 的第一个可标记控件），开关根本不会被切换。开关还要**当场落盘**
  （`schedulePersistStrength`，与强度滑块同路），否则切到交互模式（只认已提交文档）时改动消失。
  存储是 `css` 里的标记 `--dsh-myskin-bg-anchor: conversation`（`viewport` = 不写该声明），**不要**为它新增 `canvas` 字段：
  `css` 从第一版就在 schema 里，新字段要等 Host 重启才存得住。`:root` 上的所有标记（强度 / 锚定 / 两个字体角色）**必须合并写入**（`withRootMarker`），
  整条替换会静默丢掉别人；`css.find(selector === ':root')` 是各处读法，所以文档里**永远只能有一条 `:root`**（有测试钉住）。
  **动图（GIF）必须保留动画**：canvas 只有一帧，重编码即等于删掉动画。判据在 `src/client/gif.ts`（`isGif` / `isAnimatedGif`）：
  按 GIF89a 块结构走一遍（不解码像素、全程边界检查），**≥2 帧或有 NETSCAPE/ANIMEXTS 循环块**才算动图；
  判据看**字节**而不是扩展名（静止 GIF 重编码成 WebP 更小，应该走静止那条路）。
  动图走 `readPickedImage()`：`image/gif` 原样 data URL（`bytesToDataUrl`），**不缩放不重编码**，预算 `MAX_ANIMATED_URL_LENGTH`（约 3 MB）；
  超预算才退回静止图，并且**必须在状态行说明只保留第一帧**（静默丢动画看起来像 bug）。壁纸共用同一函数，所以动图壁纸同样成立。
  非 GIF 只读文件头 16 字节再决定是否整份读入（别把大照片读两遍）；新嵌入的尺寸用 `embedSizeFor()` 按自身比例算（320×240 内，不放大小图）。
  **嵌入图片的位置/大小**：一个轴一行（`X` / `Y` / `宽` / `高`）——两个输入并排会撑破面板（`Input` 自带最小宽度）；
  数值显示与写入都只到 **0.1**（`round1`/`formatOne`），拖动产生的 `12.340000000000001` 是噪声。
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
- **渲染（组件嵌入）**：锚定只决定「标记打在哪个元素上」，CSS 依旧打在 `[data-dsh-myskin-embed="<id>"]` 上。
  **层级由混合模式决定**（`embedPaintsAbove()`，引擎与编辑器预览共用同一份判断——预览不能讲另一个故事）：
  - `normal` → 宿主 `{ position: relative; isolation: isolate; }` + `::after { z-index: -1 }`：画在**容器背景之上、内容之下**，
    不挡工作区行与按钮。`isolation` 是配套的：负数只有宿主自成层叠上下文时才留在容器内，否则会掉到容器背景后面（图直接不见）。
  - 任何真实混合模式 → 宿主 `{ position: relative; }` + `::after { z-index: 1; mix-blend-mode: <mode> }`：画在**内容之上**。
    因为 `isolation` **会隔离混合组**：`mix-blend-mode` 只能和同一组内画在它下面的东西混，隔离后只剩容器自己的背景
    （通常还是透明的）——四种模式就都变成「和什么都没有混」，肉眼一模一样（这就是 0.4.0 的回归）。
    要和背后的页面混，就必须画在内容之上；两者不可能同时成立，所以由混合模式来选，面板在字段旁写明。
  **不要**为了让锚点生效去改样式表——那会把「跨 React 重建的重新解析」这条能力绕过去。
- **层级必须让用户能改**（`ImageLayer` / `readImageLayer` / `withImageLayer`）：`自动` = 由混合模式决定（见上），
  `above` / `below` 是显式覆盖，存成 `css` 里 `[data-dsh-myskin-embed="<id>"] { --dsh-myskin-layer: … }` 标记（**不新增文档字段**）。
  为什么必须有这个开关：「内容之下」在**子元素透明**的容器里正确（侧边栏列表），在**子元素不透明**的容器里就是把图藏起来
  （设置页卡片——据反馈确认）。别再把层级写死成只看混合模式。
- **边缘晕染**（`ImageFeather` / `readImageFeather` / `withImageFeather` / `featherStyle` / `embedAfterRule`）：`--dsh-myskin-feather{,-blur,-shape}` 与层级同一条标记规则。
  **几何（踩过坑，照抄这两条）**：① `::after` 用 `inset: -bleed px` 长出去（`bleed = 宽度 × FEATHER_BLEED(0.25)`），此处**坐标已经位移**，
  所以 `background-position` 必须保持用户自己的 `x, y`、只把 `background-size` 加 `2×bleed`——早期版本又减了一次 bleed，图片被二次位移到左上（据反馈）；
  ② 坡道总长 = `宽度 + bleed`，于是**完全不透明点落在用户图框内 `宽度` px 处**，图片自己的硬边才会落在 10–20% 不透明度上；
  坡道若正好在硬边处到达 100%，等于没羽化。
  **「柔化」是坡道曲线（0–100，直线 → smoothstep），不是 blur**：`filter: blur()` 会模糊整张图（据反馈已改掉），
  边缘的柔和度只该由 mask 的停靠点表达（5 个采样点）。形状只保留**四边衰减**（两种渐变的 `mask-composite: intersect`），椭圆/矩形选项已按反馈去掉。
  衰减若停在硬边，硬边依旧可见（这是这个功能的全部意义）。遮罩用 px 写，`featherStyle()` 一份实现同时供样式表与锚定层的行内样式消费。
  **渲染只有一处实现**：编辑器预览调用引擎的 `embedAfterRule` / `embedHostRule`，别再内联复制那段 CSS（历史上复制过两次，预览与保存结果都漂了）。
- **看不见要能解释**（`src/client/image-diag.ts`，`diagnoseEmbeddedImage`）：四种成因分开报——锚点解析不到 / 按设置页作用域收起
  （`pageKey` ≠ 当前 `currentSettingsPageKey`）/ 被容器内容盖住（`z-index: -1` 且命中宿主**后代**）/ 被容器裁剪（图比宿主大，`::after` 是 `inset: 0`）。
  jsdom 没有布局，测试里桩掉 `getBoundingClientRect` 与 `elementsFromPoint`——这是**故意**的，别改成依赖真实布局。
- **图片选中与组件选中互斥**（`selectedImage`）：图片是**真正的选中对象**，不是画在页面上的一个框。
  点图片框即选中（拖动照旧）；选中期间**元素的选中框 / 两个变换手柄 / 整组描边 / 悬停框全部让位**
  （`elementChrome = mode==='edit' && selectedImage===undefined`），页面上只留图片那一个框（选中＝实线，未选中＝虚线）；
  面板顶部换成图片头卡，元素 Inspector 期间不显示；列表对应行高亮，并有「选中 / 取消选择」按钮。
  **Esc 的优先级必须与选择层级一致**：先退图片 → 再退组件 → 再退编辑器（`selectedImageRef` 给文档级 key handler 用）。
  **元素的选中不要清掉**（只是让位）：它仍是「用选中元素 / 取选中文字」的对象，否则编辑图片时锚定就废了。
  图片被删除/撤销消失时**必须自动清除选中**，否则元素 chrome 会为一个不存在的框一直让位——页面上一个选中框都没有。
- **每张图一个面板**（`EmbedImages`，编辑模式下常驻，**不依赖当前选中**）：**不要**把它们再塞回一张共享卡里——
  一张卡装 N 张图时，每张图的字段都把别人的往下推，用户看不出「正在改的是哪一张」（已按此重构）。
  每张图是 `.dsh-myskin-card` + 可折叠标题行（`.dsh-myskin-head` + `.dsh-myskin-chev` + `.dsh-myskin-body`）；
  标题行 = 宿主标签 + ✓/⚠ + 「选中/取消选择」 + 「移除」（**按钮放在 head 按钮之外**——按钮不能嵌在按钮里），
  字数多时标题可收缩、动作按钮 `flex: none`。**展开 = 选中**（`toggleImagePanel` 里同时 `onSelectImage`），
  画布选中一张图时用 effect 自动展开它；`images.length === 1` 时默认展开，多张默认收起。每张图一块，含锚点、✓/⚠、
  **「选中容器」**（把画布带到宿主身上——用户不必自己去找图嵌在哪儿）、呈现方式、不透明度、混合模式、
  以及**位置/大小数值框**（`onGeometry` → `updateEmbed(id, {x|y|w|h})`，滚轮微调）。
  **不要再把它塞回 Inspector**：Inspector 只在有选中时存在，而这正是「找不到就改不了」的根源。
  「用选中元素 / 取选中文字」在没有选中时置灰即可（`target` 可为 `undefined`，别假设一定有）。
- **标记会随 React 重建消失，两处都必须有重试循环**：标记是真实节点上的属性，收起/展开侧边栏这类重建会把它抹掉，
  而渲染**只认标记**。引擎那处负责已提交的皮肤；编辑器打开期间引擎的重试被**故意跳过**（否则会复活草稿里删掉的图），
  所以**编辑器自己也要有**：rAF 合并的 `MutationObserver`（**只监听 `childList`/`subtree`**——它自己只写属性，不会自激），
  每次按**草稿**重新 `resolveImageTargets` 并重打标记。少了它，图会在「收起再展开」后静默消失（容器还在，所以框还在）。
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
4. **类名识别三种 CSS-module 形态**：0.1.x `_row_1abc2_34`、0.2.x `bhn1Oq_projectRow`（哈希在前）与**本机在用的 `pI_x6G_frame`（双哈希段）**；都优先于裸类名，避免把工具类带进选择器（状态类 `is-*`/`has-*`/`active`… 永不进标识）。
5. **范围要看得见**：整组时画布给其余成员逐个描虚线框，选中标签追加「整组 N」——用户改之前就得知道这次编辑会覆盖谁。

**整组间隔**（`gapSelectorFor` / `withGapRule` / `gapOf` / `gapLength`）写成 `组选择器 + 组选择器 { margin-top }`：
只动成员**彼此之间**、不碰首成员与容器顶，且**与 DSH 自己的分行方式同构**（`[role=treeitem]+[role=treeitem]` / `groupSection > * + *`）。
成员不是**相邻兄弟**时（例如分属不同工作区的对话行）`gapSelectorFor` 返回 `undefined`：UI 说明原因，而不是给一个点了没反应的字段。
裸数字按像素、带单位的原样写入（`gapLength`）；一次编辑一个快照。

**切换范围要迁移声明**（`moveRuleToBlock`）：面板只在字段变化时写规则，所以"切到整组"必须顺手把该元素已有声明搬到组规则并删掉单元素规则
（一次快照、可撤销）；否则用户切过去会看到"整组开了但别的行没变"。

配套：Inspector 的字段/变换/隐藏/移除/清除都走 `activeSelector`；**文字替换始终单元素**（每行名字不同）；
画布拖动在整组时也作用于整块（与在 X 字段改数字等价）；切换选择时 `scope` 保持，但组不可用时自动回落到单元素。

### 4.13.1 区域（`src/client/regions.ts`）

六个具名表面：对话区 / 左侧栏 / **右侧侧边栏** / 输入区 / 设置弹窗 / 消息区。

右侧栏（DSH 原生 `@deepseek-ai/dsh-client-ui-sidebar-right`）**不是一个元素**，所以锚点有三个：

- `[data-sidebar-right-panel][data-sidebar-right-open]` —— 用户看到的那张卡；「开始」引导态**没有任何 pane**，
  只有这一个锚点能命中（踩过：只锚 pane ⇒ 引导态命中 0 ⇒「圆角改不动」）。
  ⚠️ `[data-sidebar-right-open]` 那半截不是装饰：面板容器**关闭时仍挂在布局里**（只把子元素 `visibility:hidden`），
  裸锚会让关闭状态留一块板子。壁纸引擎自己的样式表里写着同一个坑并做了同样的护栏。
- `[data-dockkit-pane]` / `[data-dockkit-float]` —— 已停靠的 pane（自己画 `--dsw-alias-bg-base`）与被拖出成浮层的 pane；
  它们必须与面板拿到**同一个圆角**，否则方角子元素会盖住面板的圆角。

三个都是发布过的 `data-*` 钩子（`data-dockkit-*` 只在该包出现，对着安装核对过），不写 CSS-module 哈希。
变体的质感与底色都覆盖这个区域。
**圆角四角可分开**：统一值走 `border-radius`（字段 `radius`），四角走 `border-top-left-radius` 等长属性
（字段 `radiusTL/TR/BR/BL`，都带 `refines: 'border-radius'`）。
⚠️ **顺序即语义**：简写会一次性设置四个角，所以角必须写在简写**之后**。`writeRegionStyle` 对带 `refines` 的字段
先把简写**提到块首**（`hoistShorthand`，只重排不改写），再追加该角——这样统一值与单角值同时存在、都能读回。
新增"某一角"这类字段时照抄这个模式，不要自己往块尾怼声明。

写区域样式一律走 `writeRegionStyle()`：它会在规则带底色时打上 `--dsh-myskin-panel` 标记，
兼容模式据此在绘制期摘掉底色（见 §4.20）。

### 4.14 全站作用域（`src/client/site-scope.ts`）

「编辑范围」的第三档：**只用元素自身的标识写选择器，不带任何祖先路径**。存在的唯一理由：
有些插件的界面**每个界面都出现一份**（对话里在 `#root` 内，插件页/设置页是 portal 在 `#root` 旁边），
而结构化选择器（`#root > div:nth-of-type(3) > …` / `body > div:nth-of-type(n) > …`）一份只能覆盖一处，
`body > :nth-of-type(n)` 还会因为多开一个弹窗而整体错位。整组对这种形状是**故意拒绝**的（散落各处的类不成组），
所以这类组件此前没有"改一次、到处生效"的办法。

标识原子（**只有这三种**，其余一律不用）：

1. **生成的类名**（`stableClasses`）：三种形态都认——0.1.x `_row_1abc2_34`、0.2.x `bhn1Oq_projectRow`、
   **本机正在用的 `pI_x6G_frame`（双哈希段）**。认不出双哈希段就会退回"全部类名"，把 `is-active` 这类状态类写进选择器 →
   选择器在别的实例上永不匹配（静默失效）。状态类（`is-*` / `has-*` / `active` / `selected`…）永不进标识。
2. **共享的 `data-*`**：同名值命中 > 1 个元素才算"组件标识"；只有一个命中时，只有在**没有任何类名**可用时才用它
   （否则形如 `data-key="…"` 的实例值会把选择器锁死在单个元素上）。本插件自己的 `data-dsh-myskin-*` 一律跳过，
   `data-index`/`data-key`/`data-state`… 这些按实例分配的属性名直接排除。
3. **`role`**（仅在既无类名、又只有它可用时兜底）。

两条底线，都是"说出来"而不是"悄悄做"：

- **没有标识就说没有**：只有标签名（`div`）→ `{ ok:false, reason:'no-identity' }`，按钮不可用并说明原因；
- **太泛就拒绝**：候选命中 > `SITE_SCOPE_MAX`(64) → `reason:'too-generic'` 并报出命中数，**绝不写入**——
  那不是一个组件，而是一个布局/工具类。

候选顺序（先命中先赢）：`tag.类[共享data]` → `tag.类[role]` → `tag.类` → `tag[data]` → `[data]` →（无类名时）`tag[role]` / `[role]`。
范围始终可见：按钮上写 **命中 N 处**，画布给命中的其余元素描虚线框（最多 `PEER_OUTLINE_MAX`=24 个），
面板照常显示"将写入"的完整选择器；**只命中 1 处时会说明"这是这个组件，不是只有这一个"**。
切换作用域时已有声明跟着搬到新选择器（`moveRuleToBlock`，一次快照可撤销）。

它写的仍然是**普通 `css` 条目**：没有 schema 字段、没有引擎分支，极客模式可见、可单独清除。

**只在设置/插件页出现的元素**怎么选：切「交互」把设置弹窗打开，再切回「选择」——弹窗遵守同一条内缩规则，落在应用区里，可以直接点选。
### 4.15 界面显示（`src/client/views.ts`）

**按界面**控制同一个组件的显示 / 隐藏——「全站」（§4.14）的反面用法：那边是「到处一起改」，这里是「只在某个界面改」。

- **界面推导出来，不写死**：
  1. **设置弹窗**：上游 `data-shortcut-modal`（设置对话框 + 快捷键编辑器，portal 到 `<body>`；帧规则与 `check:compat` 本来就依赖它）；
  2. **当前页面**：主区域槽位 `[data-slot="main"]`（shell 的 `MainPanel` 把每个主面板渲染进这里）里**当前活动的那一页**，
     用它自己的**语义标记**描述——沿首个子元素链向下找第一个 `data-slot="…"` 或其它 `data-*`，例如插件页的 `[data-plugin-panel]`、
     对话页的 `[data-conversation-region]`。标记一律**锚定在主槽位下**：`[data-slot="main"] [data-plugin-panel]`。
- ⚠️ **踩过的坑（务必别再犯）**：最初把界面写成「设置弹窗开着 / 没开」两个桶，于是"在插件页隐藏"**根本不生效**——
  上游的插件页**不是设置弹窗的一页**，它是主区域里的另一个面板（`PANEL_ID = "plugins"` 注册在 `main` 槽位），
  插件页在屏幕上时设置弹窗压根没挂载。**任何"某个界面"都必须由那个界面自己的标记表达。**
- **规则形状**：`body:has(<界面标记>) <组件标识> { display: none !important }`，标识取自 `siteScopeFor()`（§4.14）。
  主语是**组件自己**，所以两种插件形态都覆盖：每个界面各渲染一份的、和一个全局节点盖在所有界面上的。
- **只在 `display` 上动手**（`mergeDeclaration` / `withoutDeclaration`）：同一选择器上别的声明原样保留，删空了整条消失；
  规则天然出现在回收站里（`removedControls`），「恢复」与「开关切回显示」是**同一次编辑**（测试断言两者结果相等）。
- **常用预设**（整状态按钮）：`withOnlySurface(css, surface, identity, surfaces)`（反向规则 `body:not(:has(<标记>))`，
  覆盖没打开过的页面；另给 `overlay` 类界面补一条——设置弹窗能在本页仍挂载时盖在上面）、`withHiddenEverywhere(css, identity)`（写在标识上的钝规则）、
  `withAllHiddenRestored`（全部恢复）。
- **访问过的页面会被记住**（`readRememberedSurfaces` / `rememberSurface`，localStorage 键 `dsh-myskin.surfaces`，上限 `MAX_REMEMBERED_SURFACES`=8）：
  标记只能从**真正挂载过的页面**推导，记住它才能形成固定清单。读回时**只接受本插件能产出的标记形状**（`[data-` 开头、长度上限）——存储值是用户可写的。
- **每一行说真话**：`hiddenWhile(css, surface, identity, surfaces)` 同时看本界面规则、钝规则、**别的界面的反向规则**；
  行的「显示」= `withVisibleWhile`（删掉所有让它在**这里**消失的规则，别的界面不动）。
- **后悔药**：`hiddenRulesFor(css, identity)` 找出所有隐藏该组件的规则，`withAllHiddenRestored(css, identity)` 一次全恢复
  （连**旧版本写下的** `body:not(:has(...))` 也清）；卡片在每个界面都隐藏时就地警告「画布上已点不中它」，并指向回收站。
- **没有第二份状态**：开关选中态由 `hiddenInSurface(draft.css, …)` 从文档推出；「当前界面」由遮挡扫描的同一条 1.5 秒节拍刷新
  （换页 / 开弹窗都是上游状态，不会让编辑器重渲染）。
- **拒绝猜测**：页面没有语义标记（只有构建期类哈希）时 `currentPageSurface()` 返回 `undefined`，卡片**不显示那一行**并说明原因；
  「某个具体设置页」同理不提供——设置导航各页只有**标签文字**，CSS 匹配不了。表达不了的就不表达。
### 4.16 对话排版（markdown）

`src/client/markdown.ts` + 面板「对话」页签里的「对话排版」卡：**唯一**专门面向 DSH 生成式 markdown 的入口。

- **锚点 = 渲染器自己的根元素**（源码在 `@deepseek-ai/dsh-client-ui-primitives` 的 `MarkdownText`）：
  `jsx("div", { className: clsx(markdownCss.markdown, variant === "compact" && markdownCss.compact),
  "data-markdown-variant": variant === "compact" ? variant : void 0 })`。
  所以正文选择器是 `[class*="_markdown"]:not([data-markdown-variant="compact"])`（类名语义半截，**绝不写哈希**）。
  **不要用 `_markdownPayload`/`_markdownPreview`**：那是 trajectory 表格自己的外壳类，会话正文里根本不存在——
  0.4.0 第一版就是这么写错的，卡片「完全没有效果」（已修）。同理不要要求 `> div` 这一层：`.markdown` 自己就是正文块。
- **compact 变体（工具预览、折叠的思考）必须排除**：同元素多一个 `compact` 类 + `data-markdown-variant="compact"`；
  测试里有正向对照（给 compact 单独写规则并断言仍生效），改选择器时别删。
- **类型走令牌、间距走规则**：`MarkdownText.module.css` 写的是 `font: var(--dsw-font-markdown-base)`，
  而设计系统把该简写拆成分量令牌（`--dsw-font-markdown-{base,h1..h4,code,code-block,…}-{font-size,line-height,font-weight}`）——
  改分量=整块字号/行高/字重一起动，比写死声明稳；间距/内边距/圆角/边框没有令牌，才用规则（`MARKDOWN_FIELDS`）。
  `MARKDOWN_TOKENS` 里写的是**已核对过 0.2.0-rc.2 产物**的令牌名，加新令牌前先 grep 安装目录确认它真的存在。
- 令牌值落在文档 `tokens`（亮暗同值，分开设交给令牌面板）；规则落在 `css`；两者都由面板**读回**，无第二份状态。
- 范围（全部 markdown / 仅对话正文）= `css` 里的标记 `--dsh-myskin-md-scope`（默认 `all`；早期值 `assistant` 仍按 `conversation` 读）；
  **不要**为它新增文档字段。「恢复默认」= `clearMarkdownStyles` + `clearMarkdownTokens`，只动这张卡写的东西。
- 卡片顶部指示器数的是**当前选择器的真实命中数**（`markdownSurfaceCount`）：锚点写错时它会显示 0，而不是静默。
- **必须显示「当前生效值」**（`readEffectiveMarkdown` + 每个字段的 `probe`）：卡片只显示皮肤覆盖过的值时，
  用户看到满屏空白而页面明明有字号——会被理解成「没有读到我的配置」（据反馈）。空字段的占位符要显示从真实
  markdown 元素上读回的计算值（px 四舍五入到 0.1；读不到就不显示，不编造）。加字段时记得配 `probe`。

### 4.18 变体（`src/client/variants.ts`）

**五个维度**：质感 frame（模糊 / 边框 / 阴影）、底色 fill（`background-color`）、圆角、密度、强调色；
外加四个整套与**作用对象**（全部区域，或单独一处）。全部点选、零 CSS，页签放在面板第一位。

- **四角是四个子轴**（`radiusTL/TR/BR/BL`，带 `subOf: 'radius'`，面板里折进「四角单独调」）：每个只写自己的长属性，
  统一值继续管没点过的角。标记 / 作用对象 / 撤销 / 恢复默认对它们与普通轴完全一致，**不需要任何特殊分支**——加"某一角"这类维度时照抄即可。
- **质感与底色必须是两个轴**：绑在一起时"有玻璃边缘但不盖背景"无法表达，而这正是与壁纸插件共存的正解。
  加维度时先想清楚「它拥有哪些属性」，然后一个不漏地写全。
- **作用对象只约束区域写入**：`applyVariantOption(skin, axis, option, scope)`。排版令牌与品牌令牌没有分区形态，
  始终全局——卡片里必须写明，否则"只改输入框"会连着字体一起改。
- **选择必须幂等**：选项把它拥有的属性**整套写下**（含 `''`＝清除、`0px`、`transparent`），否则「玻璃→无」会留下上一次的边框与阴影。
- ⚠️ **模糊值写裸数字**：区域字段自带 `template: 'blur({value})'`，写 `blur(18px)` 会变成 `blur(blur(18px))`（无效 CSS＝没有模糊，0.4.1 修过一次）；
  关闭模糊写 `''`（清掉声明），**不是** `none`（那会写成 `blur(none)`）。
- 它**只调用既有机制**：`writeRegionStyle`（区域）+ `writeMarkdownToken`（排版）+ 品牌令牌——**不要再写第二份实现**。
- 当前选择存在 `:root` 的**一个标记** `--dsh-myskin-variant`：条目形如 `axis=option` 或 `axis=option@scope`，
  **分隔符只能用逗号**（用 `;` 会在 CSS 里截断声明，踩过：只剩第一对生效）。
  读回用 `readVariantChoices` + `choicesFor(scope)`：**全局打底、本处覆盖**，与页面真实的层叠一致。
- 旧文档的 `material=…` 由 `LEGACY_MATERIAL` 映射到 frame/fill，那张表不要删。
- 「恢复默认」= `clearVariant`：清掉变体拥有的区域属性、排版令牌、品牌令牌；手写规则与其它令牌不许动。
- 与「区域」「对话」页签写同一批属性，**后改的覆盖先改的**——卡片里必须写明这一点，否则用户会以为面板坏了。

### 4.19 编辑器必须预览 draft.tokens（不只是 css）

**踩过**：编辑器只预览 `draft.css`，于是所有**令牌类**改动（markdown 字号/行高、变体强调色与密度、令牌面板颜色）
在绘制模式里毫无反应，用户会以为「改了没用」（据反馈）。绘制模式必须同时预览令牌，照引擎的两条路：

1. `theme.overrideTokens(PLUGIN_ID, draft.tokens)`；
2. 把变量写到 `document.body.style` 上（立刻生效 + 跟随亮暗切换）。

**清理时必须交还而不是删除**：引擎把已提交的令牌绑在同一批内联属性上，`removeProperty` 会把已保存的皮肤抹白——
写入前记下旧值，只有在旧值本来为空时才 `removeProperty`。

- **令牌行要读「计算值」**：`readEffectiveMarkdown(..., tokenValue)` 读的是 CSS 自定义属性的计算值（任何 markdown 元素上都能读），
  元素探针只作兜底——否则「这页没有 h1」会被误读成「没识别到配置」。
- `tokenValue` 是**注入**的：jsdom 不实现自定义属性的计算值（浏览器实现），注入才能把「令牌为空」与「引擎读不到」区分开。

### 4.19 面板页签（`src/client/panel-tabs.ts`）

七个页签，按「编辑对象的种类」分，`variant` 排第一（唯一不需要 CSS 知识的入口）：
`variant` / `component`（元素 Inspector + 回收站）/ `image`（每张图一个面板）/ `text`（所有文案改动）/
`markdown`（对话排版）/ `region`（整块改一个面）/ `look`（壁纸 + 令牌）。

- 页签状态存 localStorage（`dsh-myskin.panel`），未知值回落**第一个**页签（现在是 `variant`）；storage 抛错也不能把编辑器带崩。
- **画布选择要跟着切页签**：选中图片 → `image`；在画布上选元素（`selectElement`）→ `component`。
- 交互模式下不显示页签（也没有 Inspector），只留一句 `interactHint`。


## 6. 皮肤库与导入导出

- 皮肤库：「保存为皮肤」把当前文档存成命名条目；支持重命名/上移下移/复制/加载/删除。
- **导出**：`.dshframework`（第 5 节）。**导入**：接受 `.dshframework`、旧名 `.dshskin`（manifest 的 `format: dshskin` 与 `dshskin:assets/…` 引用都认）以及旧 `.json`。
- **导入/加载 = 整体替换文档**：先「导出皮肤」备份；不想丢壁纸就带 `canvas.background`，不想丢皮肤库就带 `library`。

## 7. 运行时生命周期（`applySkin`）

按序应用：**tokens** → `ctx.theme.overrideTokens` + body 变量绑定；**css / canvas.background / canvas.images** → 皮肤自有 `<style>`；**layers** → 注入真实节点；**content.workspaceTree** → 打 `data-maid-*`；**text** → 文本替换（共享 MutationObserver，React 重建后重贴）。

返回 `{ dispose }`：置 `disposed` 守卫并移除全部皮肤自有写入，`body.outerHTML` **字节级还原**——引擎不写 body 内联 style（`src/client/skin-engine.ts`）。

## 8. Agent 工作流：设计并交付一套主题

> §0 是**面向用户的对话流程**（`/dsh-myskin` 进入），本节是把它的产物落到文件、校验与交付上的**工程步骤**。两者配合使用。

1. **只读现状**：读该 profile 的 `cordis.patch.yml` → `id: dsh-myskin` 的 `config`（注意 `!!js` 标签）。
2. **设计**：产出完整 `SkinSettings`。
3. **校验**：每个 `--dsw-*` 必须存在于当前 DSH 的 `@deepseek-ai/dsh-client-ui-theme`（未知令牌静默无效）；`tokens` 每项 `{light,dark}` 成对。仓库内可跑 `npm run check:compat` / `npm test`。
4. **交付**：写成 `.dshframework`（或用 JSON），由用户「皮肤管理 → 导入皮肤」导入；也可存进 `library` 交给用户点「加载」。
5. **不要手写 profile patch**（红线，且单行 170 KB+ 的 YAML 极易写坏）。

## 9. 安全 / 可逆（红线）

1. `enabled:false` 或清空文档 = 精确还原，无需重启。「还原默认」写入的是**保留皮肤库**的空文档（`resetSkin`）：只清外观，不删用户保存的命名皮肤。
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

### 4.20 兼容模式（`--dsh-myskin-compat`，不接管背景）

「皮肤管理」页的开关，**不是** `SkinSettings` 的顶层字段，而是文档 `css` 里 `:root` 规则上的一条标记
（与背景强度 / 壁纸锚点 / 字体作用域共用同一条 `:root`；用 `readCompatMode` / `withCompatMode` 读写）。
这样旧的宿主 schema 也能保存它，不需要重启 DSH。

开启后（`readCompatMode(skin) === true`）：

| 层 | 行为 |
|---|---|
| `canvas.background` 与表面透明规则 | **不写**（`applySkin` 里与"对方壁纸在台"同一条分支） |
| 背景类令牌 `--dsw-alias-bg-*`、`--dsw-specific-sidebar-fill` | **不写**（`paintableTokens` 过滤；值仍留在文档里） |
| 区域 / 面板底色 | **不写**（区域卡写下的 `background-color` 带 `--dsh-myskin-panel` 标记，`paintableRules` 只摘这条声明与该标记，同一规则里的圆角 / 模糊 / 边框 / 内边距照常；**手写规则不动**） |
| `html[data-dsh-skin]` 互操作标记 | **不发布**（不要求壁纸插件让路——让路会清掉用户的壁纸） |
| 前景令牌 / `css` / 文字 / 图层 / 嵌入图 | 照常 |

绘制模式的实时预览遵守同一套规则（背景、背景类令牌、区域底色都不预览），令牌面板把被跳过的条目标为「兼容模式：不写」，
**自动开启**：`readCompatChoice(skin)` 给出 `on` / `off` / `auto`；
`auto`（文档里从没出现过标记）时，由 `wallpaperEngineInstalled(document)` 决定——
它读对方常挂的 `data-we-glass-page` / `data-we-adapter` / `data-we-wallpaper`（见 `interop.ts` 的 `WALLPAPER_ENGINE_MARKERS`）。
`resolveCompatMode(choice, installed)` 是**唯一**的判定入口：引擎、绘制模式预览、令牌面板、区域卡、变体卡都必须用它，
否则界面会说自己没开的模式开了、或反过来。

⚠️ 关闭开关写的是**明确的** `--dsh-myskin-compat: 0`，**绝不能写成"删除标记"**：删掉等于回到 `auto`，
装了壁纸插件时下一次 apply 立刻把模式翻回开启，用户会觉得开关坏了。
画面页顶部在开启时显示原因。判断"背景类"用 `isBackgroundToken()`：页面 / 面板 / 侧栏 / 浮层这类**会被别人背景盖到**的表面算，
按钮、气泡、输入框、滚动条等组件级填充不算。

## 10.1 已声明兼容适配 dsh-wallpaper-engine（`src/client/interop.ts`）

上游仓库：<https://github.com/elysia395/dsh-wallpaper-engine>（对照版本 1.3.0-r2）。本项目**声明兼容适配**它：
装了壁纸引擎就自动进入兼容模式、不发布让路标记、并读它的在台标记；两边各管各的（它管背景与毛玻璃，本项目管配色/字体/边框/圆角/规则/文字/图层）。
改互操作代码时不要违背上面三条，也不要去写它的任何标记。


两个插件画同一片像素时按 DOM 标记协作，双向都不 import 对方：

- **我们发布**：皮肤在台上时 `html[data-dsh-skin="dsh-myskin"]`（停用 / 还原 / 卸载即摘掉）。
  `dsh-plugin-wallpaper-engine` 1.3.0-r2 观察该标记后让路：清壁纸层 + 摘玻璃整族，
  并记住用户选的壁纸以便放回（对方 450ms 进场 / 2.6s 复位两道滞回）。别的皮肤插件写的同名标记只读不写。
- **我们读取**：`body[data-we-wallpaper]` 在场时不画自己的画布壁纸与表面透明层（其余令牌 / 规则 / 文字 / 图层照常），
  并观察其变化，对方让出画布后壁纸自动回来。

改 `applySkin` 时不要绕过这两条，也不要替对方写它的标记。

## 11. 源码指向（0.4.1）

- `cordis.patch.yml` — bundle 层，声明 `id: dsh-myskin`。
- `src/index.ts` / `src/host-schema.ts` — Host 半区：`Config` + `name`；`Config` 顶层字段全部 `.volatile()`。
- `src/skin-schema.ts` — 数据模型（`SkinSettings` / `parseSkin` / `cloneSkin`）。
- `src/client/index.ts` — 浏览器半区：`configForms.whileServed` + 实时皮肤生命周期（`inject` 只列真正用到的服务：`slots/locale/configForms/theme`，它是**激活门禁**）。
- `src/client/interop.ts` — 与壁纸插件的 DOM 标记契约（`publishSkinMarker` / `wallpaperEngineOnStage` / `observeWallpaperEngine`）。
- `src/client/skin-engine.ts` — 可逆引擎 + 画布纯函数（含兼容模式 `readCompatMode` / `withCompatMode` / `isBackgroundToken` / `paintableTokens`）（`pickElementAt` / `textHostOf` / `selectorOf` / `withManagedDeclarations` / `sameDeclarations` / `stepValue` / `transformValue` / `parseTransform` / `transformEdit` / `transformPreview` / `fontFaceRule` / `fontFormat` / `elementLabel` /
  `declarationOf` / `removedControls` / `isRemovedRule` / `withControlRestored` / `withAllControlsRestored` / `naturalDisplayOf` / `keepStylesheetLast` /
  `resolveImageAnchor` / `anchorTextOf`）。
- `src/client/MySkinSection.tsx` — 「皮肤管理」页 + 画布编辑器（含 `WheelNudge` / `ElementBox` / `Section` / `Field` / `RecycleBin`）。
- `src/client/anchors.ts` — 嵌入图锚定目录（`ANCHOR_COMPONENTS` / `anchorOf` / `anchorKey` / `anchorLabel` / `componentById`）。
- `src/client/save-report.ts` — 保存失败诊断（`diagnoseCanvas` / `canvasLooksOversized` / `CANVAS_LARGE_BYTES`）。
- `src/client/groups.ts` — 组块编辑（`elementGroupFor` / `stableClasses` / `groupLabelKey` / `WORKSPACE_ROW_SELECTOR` / `SESSION_ROW_SELECTOR` / `EditScope`（`single` / `group` / `site`））。
- `src/client/site-scope.ts` — 全站作用域（`siteScopeFor` / `siteCandidates` / `SITE_SCOPE_MAX` / `SiteScopeOutcome`）：只用元素自身标识（生成的类名 / 共享 `data-*` / `role`）写跨界面选择器，不带祖先路径。
- `src/client/stacking.ts` — 叠放诊断（`stackingReport` / `stackingContextReason` / `nearestStackingContext` / `MAX_STACKING_NEIGHBOURS`）：为什么 z-index 看不到变化（定位 / 层叠上下文 / 没有重叠），以及置顶置底的数字。
- `src/client/views.ts` — 按界面显示 / 隐藏（`Surface`（含 `overlay`）/ `settingsSurface` / `settingsOpen` / `currentPageSurface` / `currentSurface` / `surfaceMarkers` / `surfaceRuleSelector` / `onlySurfaceRuleSelector` / `hiddenInSurface` / `hiddenWhile` / `withSurfaceHidden` / `withVisibleWhile` / `withOnlySurface` / `withHiddenEverywhere` / `hiddenRulesFor` / `withAllHiddenRestored` / `readRememberedSurfaces` / `rememberSurface`）：界面 = 设置弹窗的 `data-shortcut-modal` 或主槽位里当前页自己的语义标记。
- `src/client/gif.ts` — 动图识别（`isGif` / `isAnimatedGif`）：按 GIF89a 块结构走一遍（不解码像素、全程边界检查），≥2 帧或有 NETSCAPE/ANIMEXTS 循环块才算动图。
- `src/client/markdown.ts` — 对话排版（`MD_CONTAINERS` / `MD_ASSISTANT` / `MARKDOWN_FIELDS` / `MARKDOWN_GROUPS` / `MARKDOWN_PRESETS` / `markdownBody` / `markdownSelector` / `readMarkdownStyles` / `writeMarkdownStyle` / `applyMarkdownPreset` / `clearMarkdownStyles` / `readMarkdownScope` / `withMarkdownScope` / `markdownSurfaceCount` / `declarationValue`）：容器锚点取类名语义半截、正文块排除 compact 变体，值从 `css` 读回。
- `src/client/font-roles.ts` — 整站字体三作用域（`FONT_ROLES` / `roleFont` / `withRoleFont` / `roleStackFor` / `TEXT_FONT_SELECTOR`）。
- `src/client/fonts.ts` — 本机字体枚举（`scanFonts` / `queryLocalFonts` / `detectFamilies` / `normalizeFamilies` / `filterFamilies` / `quoteFamily` / `FONT_CANDIDATES`）。
- `src/client/canvas-ui.ts` — 编辑器外观与动效样式表（`canvasUiRules` / `mountCanvasUi` / `setDrawCursor` / `attachWheelNudge`；左停靠的镜像动效也在里面）。
- `src/client/dock.ts` — 面板停靠侧（`DockSide` / `DOCK_ATTRIBUTE` / `DOCK_STORAGE_KEY` / `DEFAULT_DOCK` / `otherDock` / `isDockSide` / `browserStorage` / `readDockSide` / `writeDockSide` / `applyDockAttribute` / `clearDockAttribute`）。
- `src/client/occlusion.ts` — 面板遮挡诊断（`SampleRect` / `panelSamplePoints` / `occludingElement` / `sameElements` / `occludedBehindPanel`；纯函数与 DOM 包装分开）。
- `src/client/dshframework.ts` — 皮肤包（.dshframework）读写：零依赖 ZIP + 资源抽取/回填，兼容旧的 .dshskin。
- `src/client/desktop.ts` / `icons.ts` / `presets.ts` / `token-catalog.ts` / `locales.ts` — 桌面壳适配 / 图标候选表 / 预设 / 令牌目录 / 中英文案。
- `tests/`（含 `fixtures/xingye-theme.skin.json` 全量主题夹具）、`scripts/`（build / check-compat / check-types）— 改动后跑 `npm test`（166 例）、`npm run check:types`。
  **注意**：`npm run check:compat` 在本机（0.3.8 起）会崩在 `RangeError: Invalid string length`——它的第 5 节把整个 pnpm store
  的源码拼成一个字符串，已超过 V8 上限；需要那一节时用**逐包分块匹配**代替（19 条 DOM 契约照常判定），别以为是自己改坏了。
