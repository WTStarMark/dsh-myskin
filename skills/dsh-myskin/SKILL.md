---
name: dsh-myskin
description: DSH Web/Desktop 皮肤插件（dsh-myskin）的功能与设置说明：管理 `dsh-myskin` 命名空间（tokens / css / text / canvas / layers / content / library）、装载方式、皮肤库与导入导出，均可逆为非侵入覆盖层。Use when the user asks to change the DSH web look, apply or manage a dsh-myskin skin, install the plugin into a profile, or read/write the `dsh-myskin` settings entry.
---

# dsh-myskin 配置技能（功能 + 详细指向）

> 本技能**只陈述 dsh-myskin 的功能与详细指向**，不做美化/配色指导。
> 适配版本：**DSH 0.1.7-rc.2 与 0.2.0-rc.1**（包版本 0.3.6；Web 与 Desktop 同一套客户端插件管线；
> 桌面壳按上游 `data-platform` / `data-windows-titlebar` 契约适配，见 `src/client/desktop.ts`）。

## 1. 项目是什么

DSH Web 皮肤插件：可视化自定义 + 实时预览 + 「皮肤管理」设置页。非侵入式：不改 DSH 源码/配置、不改 DSH 进程；皮肤是完全可逆的覆盖层。

- 项目目录：`/root/dsh-myskin`（源码里的 `D:Mochen...` 路径是 0.1.6 时期的 Windows 历史路径，已废弃）。
- 装载：作为 **profile bundle** 装进目标 profile —— Web 是 `$DSH_HOME/profiles/web`，Desktop 是 `$DSH_HOME/profiles/desktop`；包内 `cordis.patch.yml` 自带条目 `id: dsh-myskin`，由该 profile 的 `dsh.profile.bundles` 选中。旧的「profiles/node_modules 软链 + 手写 insert 行」是 legacy 路线。
- 写入任何 profile 文件前必须先说明影响并取得用户确认（属工作区外写入）。

## 2. 设置命名空间与数据模型

持久化条目 id / 命名空间：**`dsh-myskin`**（旧 id `myskin` 若仍被 Host 服务，客户端也会跟随）。文档类型 `SkinSettings`，Host 侧 schema 见 `src/host-schema.ts`（schemastery，每个顶层字段 `.volatile()`）。

| 字段 | 类型 | 运行时行为（引擎做什么） |
|---|---|---|
| `enabled` | `boolean` | `false` = 完全还原 DSH 原生 |
| `tokens` | `Record<string,{light,dark}>` | 经 `ctx.theme.overrideTokens` 覆盖语义令牌（`--dsw-*`） |
| `css` | `{selector,rule}[]` | 写入一个皮肤自有 `<style id="dsh-myskin-rule">` |
| `text` | `{selector,before,after}[]` | 文本节点 / placeholder 替换（MutationObserver，React 安全） |
| `canvas` | `{background?,images}` | `background`→body 背景；`images`→容器 `::after` 嵌入图 |
| `layers` | `InjectedLayer[]` | **注入真实 DOM 节点**（`img`/`div`），标记 `data-dsh-myskin-layer`，随 React 重建/晚挂载重注入，dispose 移除 |
| `content` | `{workspaceTree?}` | 内置装饰器：给 workspace/session 树打 `data-maid-*` 标记，CSS 可命中 |
| `library` | `NamedSkin[]` | 命名皮肤库 |

- `InjectedLayer`：`{ id, kind:'img'|'div', url?, selector, attach, x?,y?,w?,h?, opacity?, blend?, css?, pageKey? }`。
- `EmbeddedImage`：`{ id, selector, url, x,y,w,h, opacity?, blend?, fallbackSelector?, pageKey? }`。

## 3. 读取与写入 `dsh-myskin`

0.1.7 的设置模型：**插件条目 id = 命名空间**，文档由 DSH 存储在该 profile 的 `cordis.patch.yml`，`volatile` 字段可原地热改。

- **界面**：打开设置 →「皮肤管理」；浏览器半区通过 `ctx.configForms.get('dsh-myskin')` 订阅与写入（`set(field,value)` / `unset(field)` / `mutate(ops)`），改动实时生效，无需重启。
- **Host 侧调用**：`ctx.settings.describe()` 列出所有条目的 `value`/`base`/`user`/`revision`；`ctx.settings.update(ns, patch)`、`replace(ns, section)`、`mutate(ns, ops)` 写入（带 `expectedRevision` 做冲突保护）。注意 0.1.7 的 `SettingsForms` **没有 `settings.get()`**，读取一律走 `describe()`。
- **直接看/改文档**：`$DSH_HOME/profiles/<profile>/cordis.patch.yml` 里 `id: dsh-myskin` 那一条的 `config`。手改前先备份、先 read；YAML 注释与格式会被 DSH 的写入保留。

## 3.5 画布编辑器流程（0.2 起）

1. 设置 →「皮肤管理」→ **绘制模式**：先关闭设置弹窗，再把真实页面**内缩**——顶部工具条与右侧 340px 面板各占自己的位置，不覆盖 DSH 界面（不再用 iframe 复制一份应用）。退出编辑器自动还原页面布局。
   - **桌面端**：工具条让开 Windows 原生标题栏 / macOS 红绿灯（全屏时红绿灯隐藏、留白收窄），页面内缩改加在 frame 的标题栏内边距上；开/关编辑器后补发上游 `data-window-drag-recall` 脉冲，避免 macOS 窗口拖拽矩形停留在旧几何。2. **元素操作**（右侧面板，「元素操作」一节）：**编辑文字**（自动定位承载文字的节点，画布内即时生效；`text` 字段）、**隐藏控件**（`visibility: hidden !important`，保留占位）、**移除控件**（`display: none !important`，不占位）、**清除该元素自定义**。隐藏/移除按**属性合并**进已有规则，不解构其它自定义；都是纯 CSS，**不删真实 DOM**（避免 React 卸载崩溃）。三者都可一键撤销（取消隐藏 / 恢复显示 / 还原文字）。
3. **保存**：工具条显示保存状态（有未保存的更改 / 保存中 / 已保存 / 保存失败：<字段名>）；点 ✕ 关闭会先自动保存，失败则保留编辑器并列出被 Host 拒绝的字段。`ConfigForm.set` 对非 volatile 路径或 schema 不匹配会返回 false，以前被压成一个布尔值，现在按字段报出来。
4. **背景图体积**：壁纸按最长边 1600 / WebP 0.85 压缩，data URL 超 1.5 MB 逐级降到 1280/960，仍超标就拒收并提示（设置文档每次编辑都整份重发，大图是「保存失败」的常见原因）。桌面端会清掉 `frame` 自身那层不透明底色，否则壁纸被整块盖住、看起来像「加载不了背景图」。
2. **编辑**模式：点击页面任意元素即选中（不会触发原按钮）；**交互**模式：覆盖层不拦截事件，可正常滚动/使用应用。
3. 背景图 = 直接选文件；嵌入图片 = 先选中一个容器，再选文件；拖拽/缩放手柄调整。
4. **应用** → 写入 `dsh-myskin` 条目；Host 接受全部字段才关闭编辑器，失败会就地提示（图片过大/连接中断）。
5. 上传图片会自动降采样（最长边 2048 / WebP 0.9），避免设置文档过大。
6. **背景强度**（右侧面板滑块，默认 0.75，范围 0.35–1）：拖动即时预览、松手自动保存（400ms 去抖）。外壳画布 `--dsw-alias-bg-base` 用该值，面板 `--dsw-alias-bg-layer-1` 用「该值 + 0.15」（保证卡片文字清晰）；`bg-layer-2` / `bg-overlay`（弹窗、菜单）永不改。100% = 不透视。数值越低壁纸越明显。持久化时同时写 `canvas.backgroundOpacity` 与 `css` 里的 `:root { --dsh-myskin-bg-opacity: … }` 标记（旧 schema 下也能往返）。

## 4. 运行时应用生命周期

`applySkin(theme, skin)`（`src/client/skin-engine.ts`）按序应用：

1. **tokens** → `ctx.theme.overrideTokens` + `body` 变量绑定；
2. **css / canvas.background / canvas.images** → 皮肤自有 `<style>`；
3. **layers** → 注入真实节点（`data-dsh-myskin-layer`，MutationObserver 重注入）；
4. **content.workspaceTree** → 装饰 workspace/session 树（`data-maid-*`）；
5. **text** → 文本替换。

返回 `{ dispose }`；dispose 置 `disposed` 守卫并移除全部皮肤自有写入（节点/样式/标记），`body.outerHTML` 字节级还原——引擎**不写 body 内联 style**，艺术变量只放皮肤自有 `<style>`。

## 5. 详细指向（源码位置）

- `cordis.patch.yml` — bundle 层：声明 `id: dsh-myskin` 条目。
- `src/index.ts` — Host 半区：导出 `Config` + `name`（0.1.7 不再有注册调用）。
- `src/host-schema.ts` — schemastery 文档 schema（顶层字段全部 `.volatile()`）。
- `src/skin-schema.ts` — 数据模型（`SkinSettings`、`cloneSkin`/`parseSkin`）。
- `src/client/index.ts` — 浏览器半区：`configForms.whileServed` + 实时皮肤生命周期。
- `src/client/skin-engine.ts` — 可逆应用引擎（含透明桌面壳的 frame 着色兜底 `desktopFrameTint`）。
- `src/client/desktop.ts` — 桌面壳适配（`data-platform` / `data-fullscreen` / `data-windows-titlebar` 检测、编辑器 chrome 规则、拖拽 recall 脉冲）。
- `src/client/icons.ts` — 图标候选表（0.1.7 把 `...16` 改名为 `...Regular`/`Medium`）。
- `src/client/MySkinSection.tsx` — 「皮肤管理」设置页 + 画布编辑器。
- `src/client/presets.ts` / `token-catalog.ts` / `locales.ts` — 预设 / 令牌目录 / 文案。
- `scripts/build.cjs` / `check-compat.mjs` / `check-types.mjs` / `tests/` — 构建 / 字符串级兼容自检 / 类型级兼容自检（拿真实安装的 `.d.ts` 编译 `src/`）/ 测试。
- 类型级 API 依赖一处上游惯例：`ctx.slots` 的类型来自 `@deepseek-ai/dsh-client-ui-renderer/client` 的 **type-only import**（`src/client/index.ts` 里那行），缺少它 `tsc` 会报 `Property 'slots' does not exist on type 'Context'`；它是纯类型导入，不进运行时代码。
- `export const inject` 是**激活门禁**：只列真正使用的服务（现为 `slots` / `locale` / `configForms` / `theme`）。曾经多列的 `connection` / `remote` 已删除——上游改名会让客户端半区永久 pending、设置页静默消失。改这个数组后请跑 `npm run check:types`（`tests/types/inject-services.ts` 会逐个服务名把关）。
- `npm install` 在 `NODE_ENV=production` 下会清掉 devDependencies（npm `omit=dev`）：装依赖请用 `npm install --include=dev`。

## 6. 皮肤库 & 导入/导出

「皮肤管理」页保存/加载/复制/重命名/删除；命名皮肤 = `{id,name,tokens,css,text,canvas,layers}`；导出 `dsh-myskin.json`（完整 `SkinSettings`），导入写回 `dsh-myskin` 条目。**Web 与 Desktop 的 profile 文档互不共享**，跨端搬运靠导出/导入。

## 6.5 Agent 工作流：设计并交付一套主题

1. **只读现状**：`$DSH_HOME/profiles/<profile>/cordis.patch.yml` → `id: dsh-myskin` 的 `config`（该 YAML 含 `!!js` 标签，用 Python 读要先给 `tag:yaml.org,2002:js` 注册构造器，否则 PyYAML 报 `could not determine a constructor`）。
2. **设计**：产出完整 `SkinSettings` JSON（`enabled/tokens/css/text/canvas/layers/library`）。
3. **校验**：每个 `--dsw-*` 必须在当前 DSH 的 `@deepseek-ai/dsh-client-ui-theme` 里存在（未知令牌静默无效）；可跑 `npm run check:compat`。
4. **交付**：JSON 放工作区（如 `examples/`），由用户「皮肤管理 → 导入皮肤」导入。
5. **不要手写 profile patch**：那是 R-001 红线，且单行 170KB+ 的 YAML 极易写坏。
6. **导入 = 整体替换**（`parseSkin(json)` 后覆盖全文档）：不想丢壁纸就在 JSON 里带 `canvas.background`；不想丢皮肤库就带 `library`；导入前先「导出皮肤」备份。
7. 主题若要控制壁纸浓淡，**同时**写 `canvas.backgroundOpacity` 和 `css` 里的 `:root { --dsh-myskin-bg-opacity: … }` 标记（旧 schema 下前者读不回来）。

## 7. 安全 / 可逆

1. **可逆叠加层**：`enabled:false` 或清空即精确还原，无需重启。
2. **不触碰 DSH 本体**：不改 DSH 源码 / 全局配置；不 kill、不重启 DSH（重启交用户）。
3. 皮肤自有节点带 `data-dsh-myskin-layer` / `data-dsh-myskin-owner` 标记，dispose 精确移除；不写 body 内联 style。

## 8. 常见坑（技术层面，非美化）

- **`tokens` 每项必须 `{light,dark}` 成对**；缺 `dark` → `theme.overrideTokens` 抛错，皮肤整体不生效。
- **令牌必须存在于当前 DSH**：0.1.7 已移除 `--dsw-alias-fill-tsp-secondary`、`--dsw-alias-label-error`、`--dsw-alias-label-quaternary`（未知变量静默无效）。跑 `npm run check:compat` 可一次性查全。
- **图标改名**：0.1.7 起 `IconXxxOutline16` → `IconXxxOutlineRegular/Medium`；本包用 `src/client/icons.ts` 候选表兜底，新增图标请走该模块。
- **schema 顶层字段变化**：新增/删除顶层字段要重建 bundle 并让 Host 半区重新加载（HMR 或重启）。
- **直接改 `cordis.patch.yml`**：先备份、先 read；不要把 YAML 键拼到上一行尾。
- `layers` 的 `selector` 应指向安全容器（`body` 或非 React 映射列表的普通包装 `:scope > div`），别插进 React 管理的映射列表中间；`content.workspaceTree` 走内置装饰器（不注入节点，React 安全）。
- **皮肤不生效/回退默认**：看 console 是否报错；看有无 `<style id="dsh-myskin-rule">`；确认该 profile 的插件条目真的被服务（`settings describe` 里应出现 `dsh-myskin`）。
- **导入/加载会整体替换文档**：先「导出皮肤」备份，否则当前壁纸与皮肤库会被覆盖。
- **背景强度滑块**：拖动即时预览、松手 400ms 自动保存，不需要点「应用」。macOS 桌面窗口透明（原生 vibrancy），没有元素画 `bg-base`，此时强度值改为铺在 frame 自身上；Windows 标题栏取色跟随 `--dsw-specific-sidebar-fill`，改这个令牌原生标题栏会跟着变。
- **启动报 `dsh-myskin (dsh-myskin): failed to import`**：app-boot 把 Loader「没拿到 fiber」记成字面量，真实异常被吞。0.3.1 起 `lib/index.js` 自带 schemastery（不再 external），解压/`link:`/拷贝这类没有 node_modules 的装法也能导入；旧包在该装法下必然失败。定位命令：`node --input-type=module -e "await import('<pkg>/lib/index.js')"`（能打印 `Config,apply,name` 即宿主半区没问题）。
- **选择器必须在 portal 里也能匹配**：设置面板/菜单/弹窗是 `createPortal(…, document.body)`（在 `#root` 之外）。选择器统一由 `skin-engine.ts` 的 `selectorOf()` 生成（`#root` 内用 `#root > …`；portal 内优先 `[data-shortcut-modal]…`/`[role="dialog"…]`，最后 `body > …`）。自己拼选择器时若以 `#root` 打头去指设置页里的元素，规则会静默失效。
- **隐藏 vs 移除**：隐藏 = `visibility: hidden !important`（保留占位）；移除 = `display: none !important`（不占位）；两者按属性合并进该元素已有规则，可一键撤销。
- **桌面端壁纸＝染色只施加一次**：`body` 放原图；`[class*="_frame"]` 放 `linear-gradient(<染色>), url(<壁纸>)`（圆角与画布共用同一层）；`[class*="_centerCol"]` 置 `background-color: transparent` 不再二次染色。若把染色同时留在 frame 与对话列上，强度滑块会几乎无效（0.3.5 的实际故障）。`check:compat` 用 `centerCol`/`_frame` 两个 DOM 契约守住这两个类名。
- **不要把 `dsh.client.platform` 改成 `"desktop"`**：Host 只服务 `platform === "web"` 的客户端半区；桌面端装进 `$DSH_HOME/profiles/desktop` 即可（默认端口 19387）。
