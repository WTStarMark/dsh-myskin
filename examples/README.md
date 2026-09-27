# 示例主题：星夜 · 原神（Xingye）

按「二次元-原神-星夜」壁纸配的一套完整皮肤（43 个 `--dsw-*` 令牌 + 9 条 CSS）。

| 文件 | 内容 | 大小 | 用途 |
|---|---|---|---|
| `xingye-theme.skin.json` | 完整文档：配色 + 极光/滚动条等 CSS + **壁纸**（WebP data URL）+ 你原有的 `fufu` 皮肤库条目 | ~350 KB | 直接导入，一步到位 |
| `xingye-theme.tokens-only.json` | 只有配色 + CSS（不含壁纸/皮肤库） | ~5 KB | 想保留/自己重选壁纸时用 |

## 导入

1. 先备份：皮肤管理 → **导出皮肤**（存下当前的 `dsh-myskin.json`）；
2. **导入皮肤** → 选 `xingye-theme.skin.json`；
3. 建议把 DSH 外观切到**深色**（推荐的配色是深色侧；浅色侧是配套的「雪境」）。

> 导入是**整体替换**：不想丢壁纸就必须带上 `canvas.background`，不想丢皮肤库就带上 `library`——本文件两者都带了。

## 配色

| 角色 | 深色（星夜） | 浅色（雪境） |
|---|---|---|
| 外壳画布 `bg-base` | `#060f1d` | `#eaf1fa` |
| 面板 `bg-layer-1/2/3` | `#0c1c2f` / `#112741` / `#16314f` | `#f7fbff` / `#e6eefa` / `#dbe6f6` |
| 悬浮层 `bg-overlay` | `#132a45` | `#ffffff` |
| 侧栏 `specific-sidebar-fill` | `#081625` | `#e4edf8` |
| 边框 `border-l1/2/3` | `#1b3553` / `#27496f` / `#37628f` | `#ccdcf0` / `#b3c9e4` / `#97b3d6` |
| 品牌 / 星辉 | `#7cc4ff` | `#2f6fb8` |
| 主文字 / 次 / 三级 | `#e9f3ff` / `#a7c2e0` / `#7c9abc` | `#0c1e34` / `#3c5674` / `#6b87a6` |
| 主按钮 | 底 `#3f8fd8`，悬停 `#5aa9f0` | 底 `#2f6fb8`，悬停 `#3f88d6` |

## 设计说明

- **背景强度 68%**：壁纸深蓝、中央有角色，68% 让星夜清晰可见又保住正文对比度。想更通透就拖滑块到 55–60%，想更清晰就 80%+；拖动即时预览、松手自动保存。
- **只软化两层**：外壳画布 `--dsw-alias-bg-base` 与面板 `--dsw-alias-bg-layer-1`（后者比前者高 15 个百分点）。菜单、弹窗（`bg-layer-2`、`bg-overlay`）保持不透明，所以文字不会被壁纸冲淡。
- **夜景调色**：`body { background-color:#7d94b4; background-blend-mode: multiply }` 给壁纸压一层冷调，正文更稳。
- **极光顶线**：`body::before` 一条 2px 渐变光带，`pointer-events:none`、`z-index:9998`（低于编辑器覆盖层 9999）。
- **细节**：选区、`:focus-visible` 焦点环、WebKit 滚动条都换成星辉色。
- 主题同时写 `canvas.backgroundOpacity` 与 `css` 里的 `:root { --dsh-myskin-bg-opacity: 0.68 }` 标记：旧 schema 的 Host 读不回前者时用后者兜底。

## 校验

43 个令牌全部存在于 DSH 0.1.7-rc.2 的 `@deepseek-ai/dsh-client-ui-theme`（未知令牌会静默无效）。
`npm test` 里的 `tests/theme.test.mjs` 会把这个主题真正跑一遍引擎，并断言可逆性。
