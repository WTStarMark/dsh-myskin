---
name: dsh-myskin
description: DSH Web 皮肤插件（dsh-myskin）的功能与设置说明：管理 `myskin` 命名空间（tokens / css / text / canvas / layers / content）、读写设置、皮肤库与导入导出，均可逆为非侵入覆盖层。Use when the user asks to change DSH web look, apply or manage a dsh-myskin skin, or read/write the `myskin` settings namespace.
---

# dsh-myskin 配置技能（功能 + 详细指向）

> 本技能**只陈述 dsh-myskin 的功能与详细指向**，不做美化/配色指导。

## 1. 项目是什么

DSH Web 皮肤插件：可视化自定义 + 实时预览 + 「皮肤管理」设置页。非侵入式：不改 DSH 源码/配置、不改 DSH 进程；皮肤是完全可逆的覆盖层。

- 项目目录：`D:\Mochen\Project\dsh-myskin\`
- 装载：`~/.dsh/profiles/web/cordis.patch.yml`（用户 patch 层，绝对路径指向本包；DSH 通过 HMR 热更该层，无需重启进程）。

## 2. 设置命名空间与数据模型

持久化命名空间：`myskin`（文档类型 `SkinSettings`）。字段及**运行时行为**：

| 字段 | 类型 | 运行时行为（引擎做什么） |
|---|---|---|
| `enabled` | `boolean` | `false` = 完全还原 DSH 原生 |
| `tokens` | `Record<string,{light,dark}>` | 经 `ctx.theme.overrideTokens` 覆盖语义令牌（`--dsw-*`） |
| `css` | `{selector,rule}[]` | 写入一个皮肤自有 `<style id="dsh-myskin-rule">`（`rule` 仅声明） |
| `text` | `{selector,before,after}[]` | 文本节点 / placeholder 替换（MutationObserver，React 安全） |
| `canvas` | `{background?,images}` | `background`→body 背景；`images`→容器 `::after` 嵌入图 |
| `layers` | `InjectedLayer[]` | **注入真实 DOM 节点**（`img`/`div`），标记 `data-dsh-myskin-layer`，随 React 重建/晚挂载重注入，dispose 移除 |
| `content` | `{workspaceTree?}` | 内置装饰器：给 workspace/session 树打 `data-maid-*` 标记，CSS 可命中 |
| `library` | `NamedSkin[]` | 命名皮肤库 |

- `InjectedLayer`：`{ id, kind:'img'|'div', url?, selector, attach, x?,y?,w?,h?, opacity?, blend?, css?, pageKey? }`。
- `EmbeddedImage`：`{ id, selector, url, x,y,w,h, opacity?, blend?, fallbackSelector?, pageKey? }`。

## 3. 读取与写入 `myskin`

- **读取**：`settings.describe()` 列命名空间；`settings.get('myskin')` 取文档（含 `value`/`user`/`base`/`revision`）。
- **写入**：`settings.update('myskin', patch)` 合并顶层字段；`settings.replace('myskin', section)` 整体替换；`settings.mutate('myskin', [{op:'set',path:[...],value:...}])` 路径编辑；`expectedRevision` 可做冲突保护。
- **改动实时生效**：浏览器端订阅 `myskin`，接受变更即重新应用/还原，无需重启。

## 4. 运行时应用生命周期

`applySkin(theme, skin)`（`src/client/skin-engine.ts`）按序应用：

1. **tokens** → `ctx.theme.overrideTokens` + body 变量绑定；
2. **css** → `<style id="dsh-myskin-rule">`；
3. **canvas.background** → body 背景；**canvas.images** → 容器 `::after`；
4. **layers** → 注入真实节点（`data-dsh-myskin-layer`，MutationObserver 重注入）；
5. **content.workspaceTree** → 装饰 workspace/session 树（`data-maid-*`）；
6. **text** → 文本替换。

返回 `{ dispose }`；dispose 移除全部皮肤自有写入（节点/样式/标记均清除），字节级还原——引擎**不写 body 内联 style**，艺术变量放皮肤自有 `<style>`。

## 5. 详细指向（源码位置）

- `src/index.ts` — Host 半区：注册 `myskin` 命名空间 schema。
- `src/host-schema.ts` — Host 侧 schema（normalize / toJSON）。
- `src/skin-schema.ts` — 浏览器侧数据模型（`SkinSettings` 与各类型、`cloneSkin`/`parseSkin`）。
- `src/client/index.ts` — 浏览器半区：注册「皮肤管理」设置节 + 实时皮肤生命周期。
- `src/client/skin-engine.ts` — 可逆应用引擎（tokens / css / text / canvas / layers / content）。
- `src/client/MySkinSection.tsx` — 「皮肤管理」设置页 + 画布编辑器（透明覆盖真实 DSH DOM + 实时预览）。
- `src/client/presets.ts` — 内置 token 预设（默认 / 深海 / 暖阳 / 极夜）。
- `src/client/token-catalog.ts` — 令牌面板分组目录。
- `src/client/locales.ts` — 中/英文案。
- `scripts/build.cjs` — 产出 `lib/client.js` + `lib/index.js`（esbuild）。
- `skills/dsh-myskin/SKILL.md` — 本文。

## 6. 皮肤库 & 导入/导出

「皮肤管理」页保存/加载/复制/重命名/上下移；命名皮肤 = `{id,name,tokens,css,text,canvas,layers}`；导出 `dsh-myskin.json`（完整 `SkinSettings`），导入 `settings.replace('myskin', parsed)`。

## 7. 安全 / 可逆

1. **可逆叠加层**：`enabled:false` 或清空即精确还原，无需重启。
2. **不触碰 DSH 本体**：不改 DSH 源码 / cordis.yml / 配置；不 kill、不重启 DSH（涉及 3080 的重启交用户）。
3. 皮肤自有节点带 `data-dsh-myskin-layer` / `data-dsh-myskin-owner` 标记，dispose 精确移除；引擎不写 body 内联 style（字节级还原）。

## 8. 常见坑（技术层面，非美化）

- **`tokens` 每项必须 `{light,dark}` 成对**；缺 `dark` → `theme.overrideTokens` 抛 “Uncaught (in promise)”，皮肤整体不生效。
- **直接改 `~/.dsh/settings.yaml`**：先备份；改前用 read 重新读；别把 YAML 键拼到上一行尾（曾致 YAML 损坏、皮肤静默消失）。
- **Host schema 只读进程启动时的字段**：新增顶层字段（如 `layers`/`content`）需重启 DSH 后才会被读到（重启交用户）。
- `layers` 的 `selector` 应指向安全容器（`body` 或非 React 映射列表的普通包装 `:scope > div`），别插进 React 管理的映射列表中间；`content.workspaceTree` 走内置装饰器（不注入节点，React 安全）。
- **皮肤不生效/回退默认**：看 console 是否 `Uncaught (in promise)`（常是缺 `dark`）；看有无 `<style id="dsh-myskin-rule">` 及其内容。
