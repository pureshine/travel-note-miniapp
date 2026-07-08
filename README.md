# 冲鸭去旅行 travel-note-miniapp

冲鸭去旅行是一款微信小程序，用来管理旅行日程、出行清单、备忘记录和消费统计。

## 开发流程

1. 修改 `miniprogram/**/*.ts` 源码（逻辑唯一来源）。
2. 运行 `npm run build` 生成同目录 `.js` 文件。
3. 微信开发者工具编译预览。

```bash
npm run build
npm run typecheck
npm run lint
npm run style:check
npm run format:check
```

## 交接文档

- `docs/vibe-building-handoff.md`：本项目的设计风格、核心数据流、云同步坑位、图片资源要求，以及开启新 Codex 对话或复用到下一个小程序 vibe building 的快速上下文。

## 目录约定

```text
miniprogram/
  app.ts / app.wxss          # 入口，app.wxss 通过 @import 聚合 styles/
  styles/                    # 设计系统（tokens / layout / components / tab partials）
  components/                # 复用 UI（brand-nav / form-shell / empty-state / plan-switch）
  behaviors/                 # 页面公共 behavior（page-shell / active-trip）
  constants/                 # storage key、路由常量
  pages/
  services/                  # trip-store、cloud-sync、trip-sync-notify
  types/
  utils/
```

## 样式规范

- 全局原子样式只在 `styles/components.wxss` 定义，页面禁止复制 `Shared design refresh` 块。
- CSS 类名 kebab-case，最多 3 段（`-` 分割 ≤ 3）。
- 类选择器嵌套**最多 2 层**（如 `.page .card`、`.card.is-done .title` 允许；再深需用唯一类名或 `.is-*` 状态修饰）。
- 已扁平化的 Tab（日程 `sch-*`、我的 `pf-*`）不再改动；其余页面优先控嵌套层数，不必强行零嵌套。
- 共用样式可抽成同一类（如 `panel`、`u-hide`），但避免多层选择器叠加以压优先级。
- Tab 大页 polish 放在 `styles/tab/*.wxss`，页面 wxss 只保留布局骨架并 `@import`。
- `npm run style:check` 会检查类名段数、嵌套选择器、`!important` 与超长文件。

## 新增组件 checklist

- [ ] 组件 wxss 使用独立前缀（如 `c-plan-`），类名 ≤ 3 段
- [ ] 组件内不直接调用 `trip-store`，数据由 Page 传入
- [ ] 在 2+ 页面复用后再提交
- [ ] `npm run build` 与开发者工具编译通过

## 使用方式

1. 安装并打开微信开发者工具。
2. 选择“导入项目”，目录选择本仓库根目录。
3. 无真实 AppID 时选择“无 AppID 模式”；有云开发环境时配置 `config/cloud.ts`。
4. 编译预览。
