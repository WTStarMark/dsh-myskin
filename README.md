# dsh-myskin (v0.2.0)

DSH Web 皮肤插件：可视化自定义 + 实时预览 + 「皮肤管理」设置页。
非侵入式：不改 DSH 源码 / 配置、不改 DSH 进程；皮肤是完全可逆的覆盖层。

**适配：DSH 0.1.7-rc.2（Web 与 Desktop 共用同一条客户端插件管线）。**

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
- `src/client/MySkinSection.tsx` —— 设置页 + 画布编辑器。绘制模式会先关闭设置弹窗，再把**真实页面内缩**（顶部工具条 + 右侧 340px 面板各占一块，互不覆盖）：编辑模式点击即选中元素，交互模式可正常滚动/操作；实时预览直接作用在真实页面上，退出编辑器即还原页面布局（body 的 margin/height 与 html 内联变量全部还原）。
  - 背景图/嵌入图在提交前会按最长边 2048 自动降采样为 WebP（设置文档写进 profile patch，原图会让每次保存都变慢）。
  - 「应用」只在 Host 接受全部字段后才关闭编辑器；失败会在工具栏就地提示。

## 构建 / 测试 / 自检

```bash
npm install                 # esbuild + jsdom（构建与测试依赖）
npm run build               # 产出 lib/index.js + lib/client.js
npm run watch               # 监听重建
npm test                    # node:test（schema / 令牌 / jsdom 可逆性，共 11 例）
npm run check:compat        # 对着本机 DSH 安装复验 图标 / --dsw-* 令牌 / API
```

`scripts/build.cjs` 不依赖 DSH 仓库：esbuild 依次从 `DSH_MYSKIN_ESBUILD`、本包 `node_modules`、
DSH 安装的 pnpm store 解析。`scripts/check-compat.mjs` 默认读 `/opt/dsh-web`，可用 `--dsh <dir>`
或 `DSH_INSTALL` 覆盖。

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

## 数据与持久化

- 条目 id / 命名空间：`dsh-myskin`（旧 id `myskin` 若仍被 Host 服务，客户端同样会跟随）。
- 设置写入该 profile 的 `cordis.patch.yml`（`dsh-config-editor` 的 `documentPath`），因此
  **web 与 desktop 的皮肤互不共享**——用皮肤库导出/导入搬运。
- 所有顶层字段都是 `volatile`，画布可逐次热改而不重挂载插件。

## 兼容性对照

| 面 | ≤0.1.6 | 0.1.7-rc.2（本包） |
|---|---|---|
| 设置注册 | `settings.register(ns, schema)` | 导出 schemastery `Config`，条目 id 即命名空间 |
| 可编辑标记 | — | 每个顶层字段 `.volatile()` |
| 图标 | `IconCloseOutline16` | `IconCloseOutlineRegular` / `Medium`（运行时候选表兼容两代） |
| 客户端上下文类型 | `@deepseek-ai/dsh-client-runtime/client` | `@deepseek-ai/cordis` |
| 装载 | profile patch 手写 insert 行 | `dsh.bundle.patch` + `dsh.profile.bundles` |
| schemastery | — | ≥3.18.4（`.volatile()` 由该版本提供） |

`npm run check:compat` 在 0.1.7-rc.2 上的实测输出：18 个目录令牌 + 44 个预设令牌全部命中、
`configForms.whileServed` / `ConfigForm.set|unset|getSnapshot` / `settings.section` slot /
`theme.overrideTokens` / `SettingsForms` / schemastery `.volatile()` 全部存在。

## 安全

- 不杀 / 不重启 DSH；不改 DSH 源码与全局配置。
- 应用带快照 + `dispose`，停用即字节级还原：皮肤自有节点（`data-dsh-myskin-layer`）与皮肤自有
  `<style id="dsh-myskin-rule">` 全部移除，`body.outerHTML` 与启用前逐字节一致。
- dispose 后置 `disposed` 守卫：排队中的 MutationObserver 微任务不会再回写（React 重建、晚挂载、
  多窗口场景不会留下残影）。
- 画布是插件自己的透明覆盖层（不深拷贝 DOM），提交/关闭即消失。

## 桌面端（Desktop）

Desktop 渲染的就是同一份 Web 文档，并把 `/plugins/*` 转发给同一个 Host，因此
`dsh.client.platform: "web"` 的客户端插件在桌面端**原样运行**，不需要第二套产物；
只需把本包装进 `profiles/desktop`。上游 Desktop 目前只打包 macOS / Windows。
