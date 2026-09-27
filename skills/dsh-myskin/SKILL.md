---
name: dsh-myskin
description: DSH Web/Desktop 皮肤插件（dsh-myskin）的功能与设置说明：管理 `dsh-myskin` 命名空间（tokens / css / text / canvas / layers / content / library）、装载方式、皮肤库与导入导出，均可逆为非侵入覆盖层。Use when the user asks to change the DSH web look, apply or manage a dsh-myskin skin, install the plugin into a profile, or read/write the `dsh-myskin` settings entry.
---

# dsh-myskin 配置技能（功能 + 详细指向）

> 本技能**只陈述 dsh-myskin 的功能与详细指向**，不做美化/配色指导。
> 适配版本：**DSH 0.1.7-rc.2**（Web 与 Desktop 同一套客户端插件管线）。

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
- `src/client/skin-engine.ts` — 可逆应用引擎。
- `src/client/icons.ts` — 图标候选表（0.1.7 把 `...16` 改名为 `...Regular`/`Medium`）。
- `src/client/MySkinSection.tsx` — 「皮肤管理」设置页 + 画布编辑器。
- `src/client/presets.ts` / `token-catalog.ts` / `locales.ts` — 预设 / 令牌目录 / 文案。
- `scripts/build.cjs` / `check-compat.mjs` / `tests/` — 构建 / 兼容自检 / 测试。

## 6. 皮肤库 & 导入/导出

「皮肤管理」页保存/加载/复制/重命名/删除；命名皮肤 = `{id,name,tokens,css,text,canvas,layers}`；导出 `dsh-myskin.json`（完整 `SkinSettings`），导入写回 `dsh-myskin` 条目。**Web 与 Desktop 的 profile 文档互不共享**，跨端搬运靠导出/导入。

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
