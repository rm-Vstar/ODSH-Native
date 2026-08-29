# QUICKSTART (中文)
本地跑通 ODSH-Native 插件。

## 前置
- Node 22.6+（24/25 推荐；`--experimental-strip-types` 需要 ≥ 22.6）
- 一个 OpenClaw 宿主（提供 `openclaw` peer 包）
- （可选）`cua-driver` 供 `odsh.cua`

## 本地验证（无需宿主 OpenClaw）
```bash
npm install --no-save openclaw@2026.7.1-2
npm run check
npm test
node scripts/build.mjs
```

## 安装进 OpenClaw
见 docs/INTEGRATIONS（宿主侧安装 + /tools 验证）。

## 获得的能力
- odsh.exec / odsh.cua / odsh.visual / odsh.serve