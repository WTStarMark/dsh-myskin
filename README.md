# dsh-myskin

DSH Web 皮肤插件：可视化自定义 + 实时预览 + 「皮肤管理」设置页。
非侵入式：不修改 DSH 源码/配置，不改 DSH 进程；皮肤是完全可逆的覆盖层。

## 结构
- src/index.ts          —— Host 半区：注册 settings 命名空间（schema）。
- src/skin-schema.ts    —— 皮肤数据模型（tokens / css / text / canvas / layers）。
- src/client/index.ts   —— 浏览器半区：注册「皮肤管理」设置节 + 实时皮肤生命周期。
- src/client/skin-engine.ts —— 可逆应用引擎（ctx.theme 令牌 + style 标签 + 文本替换 + 图片图层 + **真实节点图层注入**）。
- src/client/MySkinSection.tsx —— 设置页 + 画布编辑器（透明覆盖真实 DSH DOM + 实时预览）。

## 构建
在本包内用 esbuild 直接产出运行时产物（无需 DSH 仓库的 tsdown/类型发射）：
  node scripts/build.cjs              # 产出 lib/client.js + lib/index.js
  node scripts/build.cjs --watch      # 监听源码变更自动重建
等价 npm script：`npm run bundle`（构建）/ `npm run watch`（监听）。

> 说明：`tsdown.config.ts` 走 DSH 仓库的 clientBundle 预设，要求 DSH 构建管线先
> 发射 `lib/types/index.js`（本包 `tsconfig.json` 为 `noEmit`，且依赖 DSH workspace 的
> `@deepseek-ai/*`，无法脱离 DSH 仓库单独生成），因此日常开发以 `scripts/build.cjs` 为准。

## 装载（仅用户 patch 层，不动 DSH）
在 ~/.dsh/profiles/web/cordis.patch.yml 追加一行 insert，用绝对路径指向本包；
DSH 通过 HMR 热更该用户层，无需重启进程。此步骤为 guarded，执行前先确认。

## 安全
- 不杀/不重启 DSH；不改 DSH 源码与 cordis.yml。
- 皮肤应用带快照 + dispose，退出编辑/停用即精确还原（字节级：`layers` 注入的皮肤自有节点与自有的 `<style>` 全部移除；引擎不写 `<body>` 内联 style，艺术变量放皮肤自有 `<style>`，不残留 `style=""`）。
- 画布为插件自己的透明全屏覆盖层（不深拷贝），编辑态通过独立 style 标签实时预览，
  覆盖层移除或提交即消失/进入正式皮肤。
