# dsh-myskin · POC — 用 whale 美术素材证明「可逆注入 + 状态钩子」可行

> 目的：回答「本项目的通用皮肤架构，只要有相关美术素材，能否做到 whale 那样的完整形态？」
> 结论：**可以，前提是给 dsh-myskin 的引擎补「图层注入」与「状态钩子」两种能力；而这与「可逆、非破坏」并不冲突——本 POC 用 whale 的真实美术素材，在浏览器里跑通并证明字节级可逆。**

## 交付物

| 文件 | 说明 |
|---|---|
| `prototype/reversible-inject.mjs` | **可复用的引擎原型**（零依赖）：`installDemoSkin()` 注入图层 + `runReversibilityCheck()` 自检可逆性 |
| `prototype/README.md` | 本文档 |
| （临时演示）`%TEMP%\dsh-poc\demo.html` + `assets/*.webp` | 用 whale 真实素材的即时演示，已通过静态服务在浏览器中运行并截图验证 |

## `reversible-inject.mjs` 做了什么

对照 whale 的 `client/index.ts`（602 行）+ `maid-atelier.module.css`（2591 行），本原型在**不占用 whale 源码**的前提下复刻了其核心机制：

1. **图层注入（真实 DOM 节点，非 ::after）**
   - `[data-poc-skin="character-stage"]`：女仆左右角色 `<img>`，前面插入 `<body>`；
   - `[data-poc-skin="sidebar-corners"]`：侧栏四角；
   - `[data-poc-skin="style"]`：皮肤自有 `<style>`（含全部 `--poc-*` 美术变量，作用域限定在 `body[data-poc-atelier]`）；
   - favicon / 文档标题。
2. **九宫格装饰框**：`[data-poc-composer]::before` 用 `border-image-slice/width/repeat` 把 whale 的蕾丝框切成动态边框。
3. **亮/暗背景**：随 `body[data-ds-dark-theme]` 切换御用宫殿 day/night 素材。
4. **状态钩子**：`MutationObserver` 读 DSH 状态（`data-phase` / `data-chat-flow`），但**只写皮肤自己的输出**（`data-poc-composer-motion` 过渡 + 随状态移动角色），并做自环防护。

## 可逆性 = 本 POC 的核心断言

自检 `runReversibilityCheck()` 在真实 DOM 上跑：安装 → 翻转状态（触发钩子）→ dispose → 对比。结果全绿：

```
✔ injected skin-owned nodes: 9
✔ state hook motion attr: dock
✔ PASS body.outerHTML byte-exact (incl. app state restored)
✔ PASS title restored
✔ PASS inline style restored
✔ PASS no leftover skin nodes
✔ PASS no leftover body data-poc attrs
✔ ALL CHECKS PASS — skin is fully reversible & non-destructive
```

**关键设计（这正是 dsh-myskin 的「可逆、非破坏」本心）：**
- 所有美术自定义变量只写进**皮肤自有 `<style>`**，**绝不碰 `<body>` 的内联 style** —— 从而避免 Chrome 删 CSS 变量后残留 `style=""`（这是最容易导致"不可逆"的坑，本 POC 已踩掉并修复）。
- 每个注入节点打 owner 标记（`data-poc-skin`），dispose 只移除命中自身标记的节点，绝不误伤皮肤外节点。
- 状态钩子**只读** DSH 状态、**只写**皮肤自己的输出，并把观察器 disconnect、把 body 临时 data 属性删除。
- `runReversibilityCheck` 本身会翻转 DSH 状态（`data-phase`）来验证钩子，但它会**先快照、后还原**被它翻转的应用状态，所以最终对比仍是字节级一致。

> 严格说，本项目当前是「平面叠加」：只靠令牌 + 元素 CSS + `::after` 背景 + 文案替换。这套引擎**承载不了** DOM 注入/状态跟随。本 POC 证明的是：**给引擎补上「图层注入 + 状态钩子」两件事，就能在保持字节级可逆的前提下，把 dsh-myskin 的产物推到 whale 的形态。**

## 复现（临时演示）

演示在 `%TEMP%\dsh-poc\`，用 whale 的 `assets/*.webp`（仅临时使用，未入库）。启动静态服务后访问 `demo.html`：

```powershell
# 把下面路径换成实际路径
$tmp = Join-Path $env:TEMP 'dsh-poc'
Copy-Item 'D:\Mochen\Project\dsh-myskin\prototype\reversible-inject.mjs' $tmp
# 复制 whale 素材
Copy-Item 'D:\Mochen\Project\dsh-deep-whale\maid-atelier\assets\*.webp' (Join-Path $tmp 'assets')
# 起一个静态服务（ES module 需 http，不能用 file://）
Push-Location $tmp; $env:POC_PORT='3797'; node serve.cjs
# 打开 http://127.0.0.1:3797/demo.html
```

演示页自带按钮：`切到对话`（状态钩子 dock）、`回首页`（rise）、`切换深色`（夜宫）、`还原皮肤`（dispose，观察 whale 素材全部消失、应用 UI 完好）。

## 对 dsh-myskin 的意义（下一步）

要把这套能力接进 dsh-myskin，需在 `SkinSettings` 数据模型 + `skin-engine.ts` 里新增两件事，且都**可以做成可逆**：
1. **图层注入模型**：`canvas.images` 从「只能 `::after`」升级为「可注入真实 `<img>/<div>` 节点 + dock/位置策略」，并配上 owner 标记 + dispose 移除 + MutationObserver 应对 React 重建/晚挂载。
2. **状态钩子**：至少能按 DSH 真实状态属性写规则（现有 css 层已支持 `[data-phase]` 等）；更强的几何/动画钩子用 ResizeObserver + 皮肤自有 CSSOM 规则实现，同样在 dispose 里断连并还原。

这两步不破坏「可逆、非破坏」的本心——重点是把所有写操作收进「皮肤自有节点/样式表/observable」并在 dispose 时精确移除，且用测试断言字节级还原。
