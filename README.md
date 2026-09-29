# dsh-myskin (v0.3.7)

DSH **通用皮肤框架**：可视化自定义 + 实时预览 + 「皮肤管理」设置页（Web 与 Desktop 同一套客户端管线）。
非侵入式：不改 DSH 源码 / 配置、不改 DSH 进程；皮肤是完全可逆的覆盖层。

**适配：DSH 0.1.7-rc.2 与 0.2.0-rc.1（截至 2026-09-28 的 `next`，上游 `master` 同一提交）；
Web 与 Desktop 共用同一条客户端插件管线。**

逐版变更见 **[CHANGELOG.md](CHANGELOG.md)**；本 README 保留每个版本"为什么这么改"的推导。

DSH ≥0.1.7 移除了命令式 `settings.register(ns, schema)`。本包随之改为官方形态：
**profile bundle + 导出 schemastery `Config`**，命名空间 = 插件条目 id = `dsh-myskin`。

## 结构

- `cordis.patch.yml` —— bundle 层：声明自己的插件条目（`id: dsh-myskin`）。
- `src/index.ts` —— Host 半区：导出 `Config` + `name`，无服务、无 DOM、无注册调用。
- `src/host-schema.ts` —— schemastery 皮肤文档 schema（每个顶层字段 `.volatile()`）。
- `src/skin-schema.ts` —— 皮肤数据模型（tokens / css / text / canvas / layers / content / library）。
- `src/client/index.ts` —— 浏览器半区：`configForms.whileServed` 绑定命名空间 + 实时皮肤生命周期。
- `src/client/skin-engine.ts` —— 可逆应用引擎（官方令牌通道 + 皮肤自有 `<style>` + 真实节点图层注入 + 文本替换）。
- `src/client/icons.ts` —— 图标候选表（跨 0.1.6/0.1.7 两代命名，缺失时降级为空渲染）。
- `src/client/desktop.ts` —— 桌面壳适配：读 Electron 预加载写在根元素上的 `data-platform` /
  `data-fullscreen` / `data-windows-titlebar`，据此给画布编辑器算窗口 chrome 几何（Windows 原生标题栏、
  macOS 红绿灯、全屏），并在编辑器开合后补发上游 Web 外壳自己的 `data-window-drag-recall` 脉冲
  （Electron 只在 app-region 计算值变化时重算窗口拖拽矩形）。
- `src/client/MySkinSection.tsx` —— 设置页 + 画布编辑器。绘制模式会先关闭设置弹窗，再把**真实页面内缩**（顶部工具条 + 右侧 340px 面板各占一块，互不覆盖）：编辑模式点击即选中元素，交互模式可正常滚动/操作；实时预览直接作用在真实页面上，退出编辑器即还原页面布局（body 的 margin/height 与 html 内联变量全部还原）。
  - 背景图/嵌入图在提交前会按最长边 2048 自动降采样为 WebP（设置文档写进 profile patch，原图会让每次保存都变慢）。
  - 「应用」只在 Host 接受全部字段后才关闭编辑器；失败会在工具栏就地提示。
  - 桌面端：工具条改从窗口 chrome 之下开始（Windows 标题栏 / 全屏），页面内缩改成加在 frame 的标题栏内边距上，原生按钮位置不动；插件自己的覆盖层统一声明 `-webkit-app-region: no-drag`（上游只在 darwin 用 `body > :not(#root)` 兜底，Windows 没有）。
  - 背景强度只作用一次：**对话列拥有唯一的画布表面**（Windows 下壁纸 + 染色画在 `[class*="_centerCol"]` 上，被列自身的圆角裁剪；macOS 仍画在 frame 上），列内 chrome 的 `--dsw-alias-bg-base` 被置为 `transparent`，只有 `[data-slot="conversation.session"]` / `[data-slot^="conversation.view"]` 里的卡片保留它；卡片面板 `--dsw-alias-bg-layer-1` 比画布高 15 个百分点，保证卡片上的文字清晰；**菜单/弹窗层 `bg-layer-2`、`bg-overlay` 永不改**。macOS 桌面窗口是透明的（原生 vibrancy），没有任何元素画 `bg-base`，此时改在 frame 自身上铺同色半透明层，强度滑块才在桌面端有效。强度滑块在右侧面板（35%–100%，100% = 完全不透视）；**拖动即实时预览，松手后自动保存**（400ms 去抖，无需点「应用」）。强度同时镜像进一条 `:root { --dsh-myskin-bg-opacity: … }` 标记规则（写在 `css` 里），因此即使 Host 半区还没重载到带 `backgroundOpacity` 字段的 schema，数值也能存取往返。

## 画布编辑器：元素操作与保存（0.3.2）

在「绘制模式」里点选任意元素后，右侧面板的**元素操作**是：

| 操作 | 写入字段 | 效果 / 撤销 |
|---|---|---|
| 编辑文字 | `text` | 自动定位该元素内**真正承载文字**的节点（包裹层、空白、`placeholder` 都兼容），画布内**即时生效**，点「应用」后持久化；「还原文字」撤销 |
| 隐藏控件 | `css` → `visibility: hidden !important` | 不可见但**保留占位**；「取消隐藏」撤销 |
| 移除控件 | `css` → `display: none !important` | 不可见且**不再占位**；「恢复显示」撤销 |
| 清除该元素自定义 | 删除该 selector 的 `css`/`text` | 该元素回到原生样式 |

- 隐藏/移除都是**按属性合并**进该元素已有规则（以前是整条替换，会把元素上其它自定义静默丢掉）。
- 两者都是纯 CSS，**不删除真实 DOM 节点**：删 React 管理的节点可能让 React 卸载时抛错，皮肤不该冒这个风险。
- **保存状态**就显示在工具条上（有未保存的更改 / 保存中… / 已保存 / 保存失败：<字段名>）；直接点 ✕ 关闭会**先自动保存**，写失败则保留编辑器并显示原因，不再静默丢弃草稿。
- **背景图**：桌面端外壳 `frame` 自身那层不透明底色会被清掉，壁纸才能真正透出（Windows 的 `--dsw-specific-sidebar-fill` 原来把壁纸整块盖住了）；图片会按最长边 1600（WebP 0.85）压缩，data URL 超过 1.5 MB 时逐级降到 1280/960，仍超标就拒收并提示——设置文档每次编辑都要整份重发，超大的图片正是「保存失败」的常见原因。
## 构建 / 测试 / 自检

```bash
npm install                 # esbuild + jsdom（构建与测试依赖）
npm run build               # 产出 lib/index.js + lib/client.js
npm run watch               # 监听重建
npm test                    # node:test（schema / 令牌 / jsdom 可逆性 / 桌面壳，共 30 例）
npm run check:compat        # 复验 图标 / --dsw-* 令牌 / API / 桌面契约 / 自身清单
npm run check:types         # 用两代 DSH 的真实 .d.ts 编译 src/（类型级兼容，需 devDeps）
```

`scripts/build.cjs` 不依赖 DSH 仓库：esbuild 依次从 `DSH_MYSKIN_ESBUILD`、本包 `node_modules`、
> ⚠️ **`npm install` 陷阱**：若 shell 里是 `NODE_ENV=production`（npm 的 `omit=dev` 生效），`npm install` 会**跳过并清掉 devDependencies**，构建 / 测试 / 类型检查随即全部失效。请用 `npm install --include=dev`（或 `NODE_ENV=development npm install`）恢复。

`scripts/check-types.mjs` 把 `src/` 交给真实安装的 `.d.ts` 编译：它给每个安装建一个 `.tmp/typecheck/<version>/` 符号链接shim（`@deepseek-ai/*`），再用本包 `node_modules/typescript` 跑 `tsc --noEmit`，只对 `src/**` 的报错判失败。`--dsh` 同样可重复；缺 typescript 时打印 SKIP 而不是失败。

`scripts/check-compat.mjs` 默认读 `/opt/dsh-web`，可用可重复的
`--dsh <dir>`（逐个安装各跑一遍，累计退出码）或 `DSH_INSTALL=a,b` 覆盖。想同时验最新版，可以先把
`@deepseek-ai/dsh@<version>` 装进工作区里的临时目录再指过去，例如
`pnpm --dir .tmp/probe020 add @deepseek-ai/dsh@0.2.0-rc.1` → `node scripts/check-compat.mjs --dsh /opt/dsh-web --dsh .tmp/probe020`。

## 装载（Web 与 Desktop 各装一次）

DSH 0.1.7 的第三方插件形态是 **profile bundle**：包内自带 `cordis.patch.yml`，由该 profile 的
`dsh.profile.bundles` 选中（旧的「profiles/node_modules 软链 + 手写 insert 行」是 legacy 路线）。

- Web profile：`$DSH_HOME/profiles/web`
- Desktop profile：`$DSH_HOME/profiles/desktop`（Desktop = Electron 壳 + 同一个 Host + 同一个 Web 文档）

每个 profile 各做一次：

1. 把本包放进该 profile 的依赖（`link:<绝对路径>` 或 npm tarball）；
2. 在该 profile 的 `package.json` 的 `dsh.profile.bundles` 追加 `dsh-myskin`；
3. HMR（`patchReload: live`）即时生效，否则重启。

也可以用 Web 侧栏 **Plugins** 页或 `plugin_manager` 工具安装 bundle。

> 本仓库**只交付产物**：没有替你写任何 profile 文件、没有改动 DSH 安装。

### 启动报 `dsh-myskin (dsh-myskin): failed to import`

这句来自 `dsh-app-boot`：cordis 的 Loader **根本没拿到 fiber**（`fiber === undefined`），而它把这个结果
记成了字面量 `'failed to import'`，**真实异常被吞掉了**。最常见的原因是宿主半区的依赖没被解析到：

- 本包的 `lib/index.js` **自带 schemastery**（0.3.1 起不再 external），所以「解压 zip 后 `link:`」、
  「直接把目录拷进 `profiles/<p>/node_modules/`」这类没有 node_modules 的装法也能导入。
  0.3.0 及更早的包在这个装法下**必然**报这句（`ERR_MODULE_NOT_FOUND: @deepseek-ai/schemastery`），
  而 `link:/root/dsh-myskin` 这种 link 目标自带 node_modules 的装法能跑——所以会出现「Web 行、Desktop 不行」。
- 一条命令定位（把 `<pkg>` 换成实际安装目录）：`node --input-type=module -e "await import('<pkg>/lib/index.js')"`。
  能打印 `Config,apply,name` 说明宿主半区没问题；报 `ERR_MODULE_NOT_FOUND` 就是解析/安装问题。
- 宿主半区 OK 但仍不激活，再查：该 profile 的 `dsh.profile.bundles` 里有没有 `dsh-myskin`、
  `profiles/<p>/node_modules/dsh-myskin` 是否真的指向本包、以及 Host 是否需要重启（`patchReload: live` 才热更）。

## 数据与持久化

- 条目 id / 命名空间：`dsh-myskin`（旧 id `myskin` 若仍被 Host 服务，客户端同样会跟随）。
- 设置写入该 profile 的 `cordis.patch.yml`（`dsh-config-editor` 的 `documentPath`），因此
  **web 与 desktop 的皮肤互不共享**——用皮肤库导出/导入搬运。
- 所有顶层字段都是 `volatile`，画布可逐次热改而不重挂载插件。

## 兼容性对照

| 面 | ≤0.1.6 | 0.1.7-rc.2 | 0.2.0-rc.1（本包） |
|---|---|---|---|
| 设置注册 | `settings.register(ns, schema)` | 导出 schemastery `Config`，条目 id 即命名空间 | 同 0.1.7 |
| 可编辑标记 | — | 每个顶层字段 `.volatile()` | 同 0.1.7 |
| 图标 | `IconCloseOutline16` | `IconCloseOutlineRegular` / `Medium`（运行时候选表兼容两代） | 图标表与 0.1.7 逐名一致（289 个） |
| 客户端上下文类型 | `@deepseek-ai/dsh-client-runtime/client` | `@deepseek-ai/cordis` | 同 0.1.7 |
| 装载 | profile patch 手写 insert 行 | `dsh.bundle.patch` + `dsh.profile.bundles` | 同 0.1.7（bundle 契约未变） |
| 客户端插件门禁 | — | — | Host 只服务 `dsh.client.platform === "web"` 的客户端半区 |
| 桌面 chrome 变量 | — | `--dsh-windows-titlebar-height` | 追加 `--dsh-frame-chrome-top` / `--dsh-frame-overlay-top`（全屏归零）；本包只用带兜底的标题栏高度，两代几何一致 |
| 类型级 API | — | `npm run check:types --dsh /opt/dsh-web` → 0 诊断 | `--dsh <0.2.0 探针>` → 0 诊断（本包） |
| schemastery | — | ≥3.18.4（`.volatile()` 由该版本提供） | 同 0.1.7 |

`npm run check:compat --dsh /opt/dsh-web --dsh <0.2.0 探针>` 同时跑两代，全部命中：4 个图标候选、41 个
`--dsw-*` 令牌、`configForms.whileServed` / `ConfigForm.getSnapshot|unset` / `settings.section` slot /
`theme.overrideTokens` / `SettingsForms` / schemastery `.volatile()`、桌面契约（`data-window-drag-recall`、
darwin 覆盖层 `no-drag` 约定、`data-platform`、Windows 标题栏标记与高度）、**渲染层 DOM 契约**
（`body[data-ds-dark-theme]`、`[class*="_frame"]`、`button[aria-current]`、`[role='tree']`、
`aria-selected/expanded`、`#root`）与**客户端模块协议**（`window.__ModuleLoader__`）。
`npm run check:types` 再用两代真实的 `.d.ts` 编译 `src/`，0 诊断；`tests/types/inject-services.ts`
逐个验证 `inject` 里的服务名仍然存在（服务名是字符串，只有类型能替它把关）。

### 0.3.7 DSH 通用皮肤框架（本次优化）

定位由「DSH Web 皮肤插件」改为「**DSH 通用皮肤框架**」（Web 与 Desktop 同一套客户端管线），并修掉三件实测问题。
逐版日志与完整推导见 **[CHANGELOG.md](CHANGELOG.md)**；这里只留当前设计的事实。

| 问题 | 现状 |
|---|---|
| 桌面壁纸越过对话列圆角；同一「背景强度」在顶栏 / 对话区 / 发送栏表现不同（实测反解 0.94 / 0.75 / ≈1.00） | Windows 下壁纸 + 染色画在**对话列**上（列自己的 `border-radius` + `overflow:hidden` 把图切在 16px 圆角内），frame 不再画图、保留 DSH 自己的 `--dsw-specific-sidebar-fill` 填缺口；列内 chrome 一律 `--dsw-alias-bg-base: transparent`，只有内容槽（`[data-slot="conversation.session"]` / `[data-slot^="conversation.view"]`）与 composer 座位里的卡片拿回 token，composerSeat 自身 `background: none`。**每像素只有一个画布层**，强度值 = 实际 alpha（三处一致） |
| 绘制模式下打开设置，弹窗被工具条 / 面板盖住 | 设置浮层按**和主界面同一条内缩规则**布局：`body > :not(#root):not([data-dsh-myskin-ui]):has([data-shortcut-modal])` 内缩 `--dsh-myskin-inset-top/right`（Windows 再叠 `--dsh-myskin-chrome-top`），面板的 `height`/`max-width` 同步收口；工具条与面板保持可见可点（上游 `useModalLayer` 只圈 Tab 与 Escape、不锁鼠标） |
| 侧栏收起 / 展开后嵌入图消失 | 补打标容忍多匹配（优先取可见者）、节点被重建时按**祖先链指纹**（`TAG.class` 逐级到 `body`，不含兄弟序号）重找且**只认唯一命中**，观察器同时盯 `class`/`hidden`；结构回退选择器**不**直接进样式表（位置型路径会命中"长得像"的节点） |

已知取舍：Windows 下壁纸只画在对话列，右栏等透明列改为露出 frame 自身表面色（可用 `--dsw-specific-sidebar-fill` 控制）；
「轨迹」页仍按上游语义用 panel 层 `bg-layer-1`（比画布高 15 个百分点）。想要原来顶栏那种更白的观感，把强度滑块调高（0.9 左右）。

### 0.3.6 桌面壁纸：染色只施加一次（修"不受透明度管理"）

0.3.5 为了填掉圆角黑块，把壁纸同时画在 `body` 和 `[class*="_frame"]` 上，但**染色层仍在对话列上又叠了一次**
——壁纸被"叠两层"，强度滑块几乎看不出变化。0.3.6 把染色移到 frame 上并**只施加一次**：

| 层 | 内容 |
|---|---|
| `body` | 壁纸原图（不变） |
| `[class*="_frame"]` | `background-image: linear-gradient(<染色>, <染色>), url(<壁纸>)` —— 染色压在壁纸之上，圆角与画布共用同一层合成结果 |
| `[class*="_centerCol"]` | `background-color: transparent !important` —— 对话列不再自己染一遍 |

于是滑块改变的就是 **frame 那层的 alpha**：强度立即生效；圆角不再露原生窗口底色；两者本来就是同一张合成层，不会再出现"画布暗、圆角亮"的割裂。
`--dsw-alias-bg-base` 的覆盖保留给其它消费该令牌的表面。单测把这条不变量钉死：整套 skin CSS 里
`linear-gradient(rgba(` **恰好出现 1 次**；`check:compat` 另加 `centerCol` 契约，防止上游改名后该规则静默失效。

### 0.3.5 修掉的两个真问题（都来自桌面端实测反馈）

- **portal 里的元素选不中 → 隐藏/移除/编辑文字全部静默无效**。设置面板、菜单、弹窗都是
  `createPortal(…, document.body)`（挂在 `#root` **旁边**，见上游 `SettingsRoot` 与 `base.css` 的
  `body > :not(#root)` 约定）。原 `selectorOf()` 一律以 `#root` 打头，对这类元素生成的是
  `#root > … > body > …`——**永远匹配不到任何节点**，所以在「设置 → 模型 → 模型列表」里点隐藏/移除/改文字
  都是"点了没反应"。现在：`#root` 内仍是 `#root > …`；portal 内优先用稳定锚点
  （`[data-shortcut-modal="settings"]`、`[role="dialog"|"menu"|"listbox"]`），最后退化为 `body > …` 全路径。
  真值由单测钉住：生成的 selector 必须能 `querySelector` 回该元素本身。
- **桌面端对话区左上角圆角出现黑块**。Windows 的对话列有 16px 圆角
  （`--dsh-windows-content-radius`），圆角缺口露出的是父级 frame 的背景；0.3.2 为了让壁纸透出把 frame
  底色强制成 `transparent`，缺口于是直接露出 Electron 原生窗口底色（`chromeFallbackFill()` =
  `#1b1b1c` 深色 / `#f9fafb` 浅色）——就是你看到的黑块。现在改为**把同一张壁纸画到 frame 上**
  （frame 自己的底色保留为兜底、不再透明）：圆角被壁纸填满，画布上的「背景强度」照常生效。
- 顺带说明操作语义：**隐藏控件 = `visibility: hidden`（保留占位）**，**移除控件 = `display: none`（不占位）**。
  想让"整行消失"就用「移除控件」，或先选中行容器再隐藏/移除；两者都可一键撤销（取消隐藏 / 恢复显示）。

### 0.3.4 全线审计找到并修掉的问题

- **`inject` 里带着从未使用的服务**：曾列 `connection` / `remote`，而代码从不读它们。`inject` 是
  cordis 的**激活门禁**——上游一旦改名/移除，客户端半区会永久 pending，设置页静默消失。已改为只列真正
  使用的 `slots` / `locale` / `configForms` / `theme`，并由 `check:types` 的探针逐代复验。
- **`ctx.slots` 一直没有类型**：缺的是上游惯例那一行 **type-only** 导入
  `import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'`（纯类型，不进产物）。
- **保存皮肤库时 `NamedSkin` 少了必填的 `layers`**：会把已注入的图层从皮肤库里静默丢掉。
- **`npm install` 陷阱**：shell 里 `NODE_ENV=production` 时 npm 的 `omit=dev` 会**跳过并清掉**
  devDependencies，构建 / 测试 / 类型检查随即全废——请用 `npm install --include=dev`。

## 安全

- 不杀 / 不重启 DSH；不改 DSH 源码与全局配置。
- 应用带快照 + `dispose`，停用即字节级还原：皮肤自有节点（`data-dsh-myskin-layer`）与皮肤自有
  `<style id="dsh-myskin-rule">` 全部移除，`body.outerHTML` 与启用前逐字节一致。
- dispose 后置 `disposed` 守卫：排队中的 MutationObserver 微任务不会再回写（React 重建、晚挂载、
  多窗口场景不会留下残影）。
- 画布是插件自己的透明覆盖层（不深拷贝 DOM），提交/关闭即消失。

## 桌面端（Desktop）

上游 Desktop（`apps/desktop` + `apps/desktop-host`）是**同一个 Host、同一份 Web 文档**的 Electron 壳：
它用 `profile: 'desktop'` 启动同一个 launcher（默认端口 `19387`，与 Web 的 `3080` 分开），把 `/plugins/*`
转发给同一个 Host，因此 `dsh.client.platform: "web"` 的客户端插件在桌面端原样运行——**不需要第二套产物**，
也**不能**改成 `"desktop"`：Host 只服务 `platform === "web"` 的客户端半区。只要把本包装进
`$DSH_HOME/profiles/desktop`（Desktop 的设置里也有同一个 Plugins 页/Plugin Manager，用的是它自带的 pnpm）。

桌面端与 Web 的两点差别，本包按上游契约适配（`src/client/desktop.ts`）：

- **窗口 chrome 的位置**。Electron 预加载在根元素上写 `data-platform`（`darwin`/`win32`/`linux`）、
  `data-fullscreen`，Windows 还写 `data-windows-titlebar` 与 `--dsh-windows-titlebar-height`。画布编辑器的
  工具条据此让开原生标题栏（Windows）与红绿灯（macOS，全屏时红绿灯隐藏、留白收窄）；Windows 上页面内缩
  加在 frame 自己的标题栏内边距上，原生最小化/最大化/关闭按钮位置不动。
- **窗口拖拽矩形**。Electron 只在 app-region 计算值变化时重算窗口拖拽区域（electron#32341）；上游 Web 外壳
  的 watcher 只看 `body` 子树变化和拖拽行尺寸变化，而编辑器改的是 `<head>` 里的 `<style>` 与 `<html>` 上的
  变量——两边都看不到。所以编辑器开/关后本包补发上游自己的 `data-window-drag-recall` 脉冲，退出编辑器时同样
  还原到原布局。

其它事实（只陈述，未在本机验证）：macOS 窗口透明 + 侧栏 vibrancy，Windows 标题栏取色跟随
`--dsw-specific-sidebar-fill` / `--dsw-alias-label-primary`（皮肤改这两个令牌时原生标题栏会自动跟着变）；
Desktop 内嵌的 Platform 文档是独立 WebContentsView，不会套用本皮肤；上游 Desktop 目前只打包 macOS / Windows。
本仓库只交付产物，**没有替你写任何 profile 文件**。
