# dsh-myskin (v0.3.8)

**DSH 通用皮肤框架**：可视化自定义 + 实时预览 + 「皮肤管理」设置页，Web 与 Desktop 共用同一套客户端插件管线。

皮肤是一层**完全可逆的覆盖层**：不改 DSH 源码、不动 DSH 进程；关掉开关或点「还原默认」即回到原生外观。

> 适配 **DSH 0.1.7-rc.2** 与 **0.2.0-rc.1**（Web 与 Desktop）。

---

## 目录

- [这是什么](#这是什么)
- [能做什么](#能做什么)
- [安装（最新版 DSH）](#安装最新版-dsh)
- [快速上手](#快速上手)
- [皮肤包 .dshskin](#皮肤包-dshskin)
- [数据与持久化](#数据与持久化)
- [常见问题](#常见问题)
- [兼容性](#兼容性)
- [许可](#许可)

---

## 这是什么

一句话：**把 DSH 变成你自己的样子，而且随时能变回去。**

- **不侵入**：所有改动都写在插件自己的条目里（皮肤文档 + 一个自有 `<style>`），不碰 DSH 的源码、配置与进程。
- **可逆**：每个字段都能逐项清除，「还原默认」或关掉「启用皮肤」即精确还原。
- **可视化**：内置「绘制模式」画布编辑器——在**真实页面**上点选元素改样式、改文字、换字体、挪位置，边改边看。
- **可搬运**：整套皮肤连同图片、字体打包成 `.dshskin`（类 zip 容器），换机器/换 profile 一键导入。

---

## 能做什么

### 皮肤管理页（设置 →「皮肤管理」）

| 能力 | 说明 |
|---|---|
| 启用 / 停用 | 一键开关整套皮肤；停用即完全还原 |
| 预设主题 | 深海 / 暖阳 / 极夜等一键换肤（走官方令牌通道） |
| 实时预览 | 不写入文档也能先看效果 |
| 绘制模式 | 在真实页面上可视化编辑（见下节） |
| 皮肤库 | 保存 / 重命名 / 上移下移 / 复制 / 加载 / 删除多个命名皮肤 |
| 导出 / 导入 | 皮肤包 `.dshskin` |

### 绘制模式（画布编辑器）

进入方式：**设置 →「皮肤管理」→ 绘制模式**。设置弹窗会关闭，真实页面内缩，顶部出现工具条、右侧出现面板——**不是复制一份界面，就在真实页面上改**。

**选中元素**

- **选择**模式：悬停即显示虚线框与标签（`button#go.btn · 发送`），点击选中；**交互**模式：正常使用页面（滚动、点按钮不会误选）。
- 面板顶部 **↑ 父级 / ↓ 子级**（Alt+↑ / Alt+↓）按真实 DOM 一次走一级。
- 快捷键：`Esc` 取消选择（再按退出并保存）、`Ctrl/Cmd+Z` 撤销、`Ctrl/Cmd+Shift+Z` 重做——在输入框里不会抢键。

**改样式**（右侧面板，可折叠）

- 分组：**文字 / 盒子 / 外观 / 位置与缩放 / 元素操作**，标题带「自定义 N」计数。
- 每个已生效的字段都能**单独清除**（×），不用为改一个属性去清空整个元素。
- 字段改动**即时预览**；隐藏控件（保留占位）/ 移除控件（不占位）都是纯 CSS，不删除真实节点。
- 值一律走 `--dsw-*` 令牌与真实 CSS，深浅色主题自动跟随。

**位置与缩放**

- **X / Y 位移**、**等比缩放**（带滑块）；数值框上**滚轮微调**（X/Y ±1px、缩放 ±0.05，按住 `Shift` 步长 ×5/×10）。
- 画布上选中框**左上角 ✥ 拖动＝双轴移动**，**右下角手柄拖动＝等比缩放**。
- **每个轴独立重置**（↺），也可以一次「重置变换（三轴）」。
- **对齐线（低敏吸附）**：移动或缩放时，元素与**同级/父级元素的边与中线**、以及**视口中线**在 4px 内会自动吸附，
  并在画布上画出对齐线；磁力很小（4px）且只在已经接近时生效，按住 **Alt** 可临时关闭，工具条「对齐」可整体开关。
- 只做视觉位移/缩放，**不改变布局流**；归零即删除 `transform`，不留 `transform: none`。

**文字与字体**

- 「编辑文字」：自动定位真正承载文字的节点（含灰色的默认占位文字），**边输入边预览**，回车或「应用文字」写入草稿。
- 「字体」：可直接填任意字体栈（含系统字体），或用建议列表（PingFang SC / Microsoft YaHei / Noto Sans CJK SC / HarmonyOS Sans / JetBrains Mono …）。
- **嵌入字体文件**：`.woff2/.woff/.ttf/.otf`（≤ 30 MB）随皮肤保存；超过 2 MB 会明确提示代价（见下）。
- **应用到整页**：把当前字体写到 `body`，整站生效（`body` 无法在画布上点选，所以单给一个入口）。

**画面**

- **背景图**（壁纸）+ **背景强度**滑块（拖动即时预览、松手自动保存）。
- **嵌入图片**：先选中一个容器，再选图；可拖动、缩放、调不透明度与混合模式。
- **令牌**面板：按背景 / 边框 / 品牌色 / 文字 / 按钮 / 交互分组，逐项覆盖 `--dsw-*`。
- 工具条可**收起右侧面板**看整页；所有面板、工具条、选中框都是插件自有层，退出即消失。

**保存 / 应用 / 关闭**

| 按钮 | 行为 |
|---|---|
| **保存** | 写入皮肤文档并**留在绘制模式**继续编辑（不改变皮肤的启用状态） |
| **应用** | 写入 + 启用，并**退出绘制模式** |
| **✕ 关闭** | 有未保存改动时**先保存再退出**；保存失败会保留编辑器并说明原因 |

### 皮肤包 `.dshskin`

「导出皮肤」产出的是一个**标准 ZIP**（任何解压工具都能打开），把"配置"和"素材"分开存：

| 条目 | 内容 |
|---|---|
| `manifest.json` | 完整配置：令牌、CSS、文字替换、画布（背景/图片）、图层、皮肤库，以及格式版本、生成器、时间戳与资源清单（路径/类型/MIME/字节数） |
| `assets/…` | **原样的图片与字体文件**（不是 base64） |
| `README.txt` | 包内说明 |

- **省体积**：base64 变二进制文件。一份实测主题：351 KB 的 JSON → **141 KB** 的皮肤包（−59.8%）。
- **可换素材**：解开 zip，把 `assets/` 里的图/字体换成同名同格式的文件，重新打包即可导入。
- **兼容**：旧版 `.json` 导出仍可导入；包内资源缺失或损坏会**明确报错**，不会导入半个皮肤。

---

## 安装（最新版 DSH）

> 目标是给**已经装好并能启动**的 DSH 加一个第三方插件。本插件以 **profile bundle** 形态装载：包放进 profile 的 `node_modules`，再在 profile 的 `package.json` 里声明一次。

### 0. 前置

- DSH 已安装并可启动（`dsh web` 或桌面版）。
- 知道你的 **DSH_HOME**：默认 `~/.dsh`（可用环境变量 `DSH_HOME` 覆盖）。
- 选目标 profile：
  - Web：`$DSH_HOME/profiles/web`
  - Desktop：`$DSH_HOME/profiles/desktop`
  - **两个 profile 各装一次**（Web 与 Desktop 的皮肤互不共享）。

### 1. 拿到并解压插件包

从 Releases 下载 `dsh-myskin-0.3.8.zip`，解压后是一个 `dsh-myskin-0.3.8/` 目录。

```bash
mkdir -p ~/dsh-plugins && cd ~/dsh-plugins
# 有 unzip 就用 unzip；没有就用 python3（zip 是标准格式）
unzip ~/Downloads/dsh-myskin-0.3.8.zip -d .
# 或：
python3 -c "import zipfile; zipfile.ZipFile('$HOME/Downloads/dsh-myskin-0.3.8.zip').extractall('.')"
```

### 2. 放进 profile（目录名必须是 `dsh-myskin`）

```bash
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE="$DSH_HOME/profiles/web"        # 桌面版改成 profiles/desktop
mkdir -p "$PROFILE/node_modules"

# 拷贝（稳定，改包后需重新拷贝）
cp -r ~/dsh-plugins/dsh-myskin-0.3.8 "$PROFILE/node_modules/dsh-myskin"

# 或者软链到源码/解压目录（改包即时生效，适合长期维护）
# ln -sfn ~/dsh-plugins/dsh-myskin-0.3.8 "$PROFILE/node_modules/dsh-myskin"
```

### 3. 在 profile 里声明 bundle

编辑 `$PROFILE/package.json`，在 `dsh.profile.bundles` 数组**末尾追加** `"dsh-myskin"`（**不要删掉原有条目**）：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-myskin"
      ],
      "patchReload": "live"
    }
  }
}
```

### 4. 生效

- `patchReload: live`（Web profile 默认）：保存 `package.json` 后 Host 会重新读取，通常**刷新页面**即可看到。
- 没反应就**重启 DSH**（由你操作；本插件从不重启 DSH）。

### 5. 确认装好了

1. 打开 **设置**，左侧出现 **「皮肤管理」** → 成功。
2. 想只用命令行确认宿主半区没问题：

```bash
node --input-type=module -e "const m = await import('$PROFILE/node_modules/dsh-myskin/lib/index.js'); console.log(Object.keys(m))"
# 期望输出：[ 'Config', 'apply', 'name' ]
```

### 其它安装方式

- **用包管理器装进 profile**（等价于上面 2 步，顺便记进依赖）：
  ```bash
  pnpm --dir "$PROFILE" add "file:$HOME/dsh-plugins/dsh-myskin-0.3.8"
  # 或指向本机目录（改包即时生效）：pnpm --dir "$PROFILE" add "link:/path/to/dsh-myskin"
  ```
  第 3 步的 `dsh.profile.bundles` 仍需手动追加。
- **Web 侧栏的 Plugins 页**：按界面提示安装 bundle。

### 卸载 / 回滚

1. 从 `dsh.profile.bundles` 移除 `"dsh-myskin"`；
2. 删除 `$PROFILE/node_modules/dsh-myskin`（或解除软链）；
3. 刷新页面或重启 DSH。

皮肤文档仍留在该 profile 的 `cordis.patch.yml` 里；想彻底清干净，可在移除插件前先「导出皮肤」备份，再删掉该条目。

---

## 快速上手

1. **设置 →「皮肤管理」**：选一个预设主题 → 点 **应用**。
2. 点 **绘制模式**：在真实页面上点选一个元素，右侧改颜色/字号，或直接在「编辑文字」里改文案（边打边变）。
3. **保存**（继续调）或 **应用**（写入并退出绘制模式）。
4. **导出皮肤**：得到 `.dshskin` 备份，换机器或换 profile 时 **导入皮肤** 即可。

---

## 数据与持久化

- 皮肤文档保存在**该 profile 的** `cordis.patch.yml`（插件条目 `dsh-myskin` 的 `config`）。
- 由于文档跟着 profile 走，**Web 与 Desktop 的皮肤互不共享**——用 `.dshskin` 导出/导入搬运。
- 「皮肤库」可以存多套命名皮肤，随时切换。
- 关掉「启用皮肤」= 页面完全还原（文档仍保留，随时再打开）。

---

## 常见问题

**Q：启动时报 `dsh-myskin (dsh-myskin): failed to import`？**
这句由 DSH 的启动器在"Loader 没拿到 fiber"时记下，**真实异常被吞掉了**。按顺序排查：

1. 目录名/位置对不对：必须是 `$PROFILE/node_modules/dsh-myskin`，里面能看到 `lib/index.js` 与 `cordis.patch.yml`；
2. 宿主半区能否独立导入：`node --input-type=module -e "await import('<pkg>/lib/index.js')"` —— 能打印 `Config,apply,name` 就没问题（本包的 `lib/index.js` 自带依赖，**解压/拷贝/软链三种装法都不需要 `node_modules`**）；
3. 该 profile 的 `dsh.profile.bundles` 里是否真的写了 `dsh-myskin`；
4. 还不行就重启 DSH（`patchReload: live` 才热更）。

**Q：点「应用」提示保存失败？**
多半是文档太大。壁纸/嵌入图会按最长边自动压缩，但**嵌入字体是原样保存的**：超过 2 MB 就会让每次保存都变慢，太大可能直接被拒绝。建议整站字体用系统字体名，或使用子集化后的 `.woff2`。

**Q：改了没效果？**
确认「启用皮肤」是打开的；再看当前是哪个 profile（Web 里改的不会出现在 Desktop）；用「实时预览」先确认改动本身有效。

**Q：绘制模式里设置弹窗位置怪怪的？**
这是有意的：绘制模式下真实页面会内缩，设置弹窗遵守同一条内缩规则，所以它落在应用区里居中，而不是被工具条/面板盖住。

**Q：怎么把皮肤带回原生？**
「皮肤管理 → 还原默认」清空整套皮肤；或关掉「启用皮肤」。两者都不影响 DSH 自身。

---

## 兼容性

| 项目 | 状态 |
|---|---|
| DSH `0.1.7-rc.2` | 已适配 |
| DSH `0.2.0-rc.1` | 已适配 |
| 平台 | DSH Web 与 DSH Desktop（Windows / macOS / Linux 上的桌面壳同理） |
| DSH `< 0.1.7` | 不支持（0.1.7 起才有本包使用的 `Config` + profile bundle 形态） |

---

## 许可

MIT © WTStarMark · 仓库：<https://github.com/WTStarMark/dsh-myskin>
