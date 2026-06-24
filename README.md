# 旅小记 travel-note-miniapp

旅小记是一款微信小程序，用来管理旅行日程、出行清单、备忘记录和消费统计。

## 当前版本

- 原生微信小程序
- TypeScript
- TypeScript 源码会编译成同目录 `.js` 文件，兼容未启用 TypeScript 插件的微信开发者工具
- 本地缓存数据存储
- 首页、旅行列表、旅行详情、清单、消费、备忘、统计、设置
- 内置一组示例数据，方便第一次打开就能体验

## 使用方式

1. 安装并打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择本仓库根目录。
4. 没有真实 AppID 时，在导入页选择“无 AppID 模式”，后端服务选择“不使用云服务”。注册好小程序后，再把真实 AppID 填入 `project.private.config.json`。
5. 进入后编译预览。

如果修改了 `.ts` 文件，可以运行：

```bash
npm run build
```

这会重新生成微信开发者工具实际加载的 `.js` 文件。

## 目录结构

```text
miniprogram/
  app.json
  app.ts
  app.wxss
  pages/
  services/
  types/
  utils/
project.config.json
tsconfig.json
```

## 后续建议

1. 接入微信云开发，实现多设备同步。
2. 增加旅行编辑页，支持修改目的地和日期。
3. 增加同行人、分账、人均统计。
4. 增加数据导出和行程分享。
