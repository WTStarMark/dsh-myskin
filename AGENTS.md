# dsh-myskin 工作约定（项目内）

> 只记录**用户明确指示过**的约定，供后续会话直接遵守。要改这些约定，先问用户。

## 工作区

- `/root/dsh-myskin` 是用户点名审阅/修改的项目目录，**可读写**（含 `src/`、`tests/`、`scripts/`、`lib/`、文档与技能文件）。
- 仍然只读：`/opt/dsh-web/**`、`**/node_modules/@deepseek-ai/**`、`/root/.dsh/profiles/**/cordis.patch.yml`（皮肤文档就在里面）。
- 皮肤文档属于用户数据：不得替用户执行「还原默认」「停用皮肤」等会改写它的动作，只能在用户明确要求时进行。

## 打包产物固定放 /home/share（用户指示：「放，以后每次都放」）

- 命令：`npm run pack:share`（先 `node scripts/build.cjs` 重建 `lib/`，再 `node scripts/pack-share.mjs` 打包）。
- 产物：`/home/share/dsh-myskin-<version>-r<N>.zip`（N 从 1 递增，**绝不覆盖**同名文件；先写 `.part` 再原子改名）。
- 内容：仓库镜像，**含预构建 `lib/`**（因此解包即可运行，不需要 `npm install`），排除 `node_modules/`、`.git/`、`.tmp/`、锁文件与临时文件。顶层目录 `dsh-myskin-<version>/`。
- 用途：用户手动测试；同一版本重复打包自动变 `-r2`、`-r3`…
- 这是对"写工作区外先申报"的**常驻授权**，仅覆盖 `/home/share` 下的这些 zip；其它工作区外路径仍需先申报。

## 每次改动后必须过的门

1. `npm test`（`node --test tests/*.test.mjs`）
2. `npm run check:types`
3. `npm run check:compat`

三条都要 exit 0；改了 `src/` 必须重建 `lib/`（`node scripts/build.cjs`），否则发布物与源码不一致。版本号、`CHANGELOG.md`、`README.md`、`skills/dsh-myskin/SKILL.md` 里的版本串要同步。
