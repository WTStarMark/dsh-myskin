---
name: dsh-myskin
description: DSH 通用皮肤框架 dsh-myskin 0.3.8 的完整说明与操作指向：装载（profile bundle）、皮肤文档字段（tokens/css/text/canvas/layers/content/library）、绘制模式（画布编辑器：选择、样式分组、文字、字体、位置与缩放、动效与性能约束）、皮肤包 .dshskin 的读写格式、皮肤库与导入导出、可逆性红线。Use when the user asks to change the DSH look, apply or manage a dsh-myskin skin, install this plugin into a DSH profile, author or debug a skin document, or read/write the `dsh-myskin` settings entry.
---

# dsh-myskin 技能（包版本 0.3.8）

> 本技能**只陈述功能、契约与指向**，不做美化/配色指导。
> 适配 **DSH 0.1.7-rc.2 与 0.2.0-rc.1**（Web 与 Desktop 共用同一条客户端插件管线）。

## 1. 项目是什么 / 怎么装载

DSH **通用皮肤框架**：可视化自定义 + 实时预览 + 「皮肤管理」设置页。非侵入、完全可逆——不改 DSH 源码/配置，不改 DSH 进程。

- 形态：**profile bundle**。包内 `cordis.patch.yml` 声明条目 `id: dsh-myskin`，由该 profile 的 `dsh.profile.bundles` 选中。
- 目标 profile：Web = `$DSH_HOME/profiles/web`，Desktop = `$DSH_HOME/profiles/desktop`；**两者各装一次，皮肤文档互不共享**。
- **首选装法（界面）**：DSH 的 **设置 → 插件 → 添加插件**，填 **GitHub 仓库地址**（`https://github.com/WTStarMark/dsh-myskin`，可带 `#v0.3.8`）、npm 包名或**本地目录路径**；安装由 **pnpm** 执行，成功后插件管理器会**自动**把包名写进该 profile 的 `dsh.profile.bundles`。界面明确提示：插件**不支持自动更新**，升级要**先卸载再安装**。
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

### 4.4 文字

- 「编辑文字」用 `textHostOf()` 找**真正承载文字**的节点（包裹层、空白、`placeholder`、灰色默认文字都兼容）；**边输入边预览**（250ms 去抖、一次手势一条撤销），回车或「应用文字」写入草稿，改回原文自动撤销。
- 去抖写入在撤回/重选/卸载时取消，写入前核对 host 仍是当初那个元素。

### 4.5 字体

- 「字体」写 `font-family`（受管属性，可直填任意家族栈；建议列表只是建议）。
- 「嵌入字体文件」：`.woff2/.woff/.ttf/.otf`，**上限 30 MB**；按扩展名判定 `format()`（`fontFormat()`）；以 **`css` 里 `selector='@font-face'` 的条目**存入（`fontFaceRule()`；引擎按 `selector { rule }` 渲染，**不要**再套包裹层）。删除该条目即卸载字体。
- **>2 MB 必须给出提示**：字体在文档里是 base64，文档每次编辑整份重发——保存会变慢；导出的 `.dshskin` 里它是原样文件。
- 「应用到整页」写一条 `body` 规则（`body` 无法在画布上点选，所以单给入口）。

### 4.6 位置与缩放

- 值 = `transformValue(x,y,scale)`：恒等分量省略，全恒等返回 `''` → **删除 `transform`**（不留 `transform: none`）；解析用 `parseTransform()`（与生成互逆，有单测）。`transform` 是受管属性，极客模式手写的 transform 会被字段预览接管。
- 画布手势：选中框左上 ✥ 拖动＝双轴移动，右下角手柄＝等比缩放；拖拽 rAF 合并为**每帧一次**草稿写入、一次手势只压一条撤销。
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
| **✕ 关闭** | 有未保存改动时先保存再退出；失败保留编辑器并列出被拒字段 |

工具条显示保存状态（有未保存的更改 / 保存中 / 已保存 / 保存失败：<字段名>）。`ConfigForm.set` 对非 volatile 路径或 schema 不匹配返回 `false`，按字段报出。

### 4.9 动效与性能不变量

动效集中在 `src/client/canvas-ui.ts`（编辑器自有样式表，随挂载/卸载，可逆）：

1. **只允许 `transform`/`opacity`**；禁止动画 width/height/margin/padding（面板宽度驱动整页内缩，动画宽度＝每帧重排整个应用）。
2. **禁止 `backdrop-filter`**（给实时页面做模糊最贵）。
3. 滚动/缩放重绘 **rAF 合并为每帧一次**；悬停命中测试每帧最多一次且只在 edit 模式装载。
4. 必须有 `prefers-reduced-motion` 分支。
5. 颜色只用 `--dsw-alias-*` 令牌（不写死十六进制）。

`tests/canvas-ui.test.mjs` 与 `tests/engine.test.mjs` 钉住这些不变量。

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
- **schema 顶层字段变化**：要重建 bundle 并让 Host 半区重新加载（HMR 或重启）。
- **选择器必须在 portal 里也能匹配**：设置/菜单/弹窗是 `createPortal(…, document.body)`（在 `#root` 之外），一律用 `selectorOf()` 生成；以 `#root` 打头去指设置页元素会静默失效。
- **皮肤不生效**：看 console；看有没有 `<style id="dsh-myskin-rule">`；确认该 profile 真的服务了 `dsh-myskin` 条目。
- **保存失败**：文档太大（大图 / 大字体）。壁纸按最长边 1600 / WebP 0.85 压缩，data URL 超 1.5 MB 逐级降到 1280/960，仍超标拒收；嵌入图按最长边 2048 压缩。
- **启动报 `dsh-myskin (dsh-myskin): failed to import`**：真实异常被 app-boot 吞了。先按第 1 节的 `import()` 命令验证宿主半区，再查 `dsh.profile.bundles` 与目录名。
- **`npm install` 陷阱**：`NODE_ENV=production` 会跳过/清掉 devDependencies（构建、测试、类型检查全失效），请用 `npm install --include=dev`。

## 11. 源码指向（0.3.8）

- `cordis.patch.yml` — bundle 层，声明 `id: dsh-myskin`。
- `src/index.ts` / `src/host-schema.ts` — Host 半区：`Config` + `name`；`Config` 顶层字段全部 `.volatile()`。
- `src/skin-schema.ts` — 数据模型（`SkinSettings` / `parseSkin` / `cloneSkin`）。
- `src/client/index.ts` — 浏览器半区：`configForms.whileServed` + 实时皮肤生命周期（`inject` 只列真正用到的服务：`slots/locale/configForms/theme`，它是**激活门禁**）。
- `src/client/skin-engine.ts` — 可逆引擎 + 画布纯函数（`pickElementAt` / `textHostOf` / `selectorOf` / `withManagedDeclarations` / `sameDeclarations` / `stepValue` / `transformValue` / `parseTransform` / `fontFaceRule` / `fontFormat` / `elementLabel`）。
- `src/client/MySkinSection.tsx` — 「皮肤管理」页 + 画布编辑器（含 `WheelNudge` / `ElementBox` / `Section` / `Field`）。
- `src/client/canvas-ui.ts` — 编辑器外观与动效样式表（`canvasUiRules` / `mountCanvasUi` / `setDrawCursor` / `attachWheelNudge`）。
- `src/client/dshskin.ts` — 皮肤包读写（零依赖 ZIP + 资源抽取/回填）。
- `src/client/desktop.ts` / `icons.ts` / `presets.ts` / `token-catalog.ts` / `locales.ts` — 桌面壳适配 / 图标候选表 / 预设 / 令牌目录 / 中英文案。
- `tests/`（含 `fixtures/xingye-theme.skin.json` 全量主题夹具）、`scripts/`（build / check-compat / check-types）— 改动后跑 `npm test`（64 例）、`npm run check:compat`、`npm run check:types`。
