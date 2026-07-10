# 冲鸭去旅行交接与 Vibe Building 指南

> 更新时间：2026-07-09
> 用途：开启新 Codex 对话、交给其他 AI/开发者接手，或复用到下一个微信小程序快速搭建。

## 1. 项目一句话

`travel-note-miniapp` 是微信原生小程序，核心功能是旅行计划、日程时间轴、备忘清单、消费预算和个人中心。用户希望保留功能不变，持续以“冲鸭去旅行”的 3D 鸭子、橙色品牌色、玻璃拟态卡片风格做高质量 UI/交互打磨。

技术栈：

- 微信原生小程序：WXML + WXSS + TypeScript
- 本地状态：`wx.setStorageSync` / `wx.getStorageSync`
- 云开发：`login`、`syncTrips`、`uploadImage` 云函数
- 构建：`tsc` 将 `miniprogram/**/*.ts` 编译为同目录 `.js`

常用命令：

```bash
npm run build
npm run typecheck
npm run format:check
npm run style:check
npm run lint
```

## 2. 新对话接手顺序

新对话开始后，先读这些文件：

1. `README.md`：目录约定、构建流程、样式规范。
2. `docs/cloud-development.md`：云环境、集合、云函数、图片上传和同步策略。
3. `docs/refactor-baseline.md`：样式重构边界、不可动逻辑、已知技术债。
4. `docs/vibe-building-handoff.md`：本文件，包含审美要求和历史坑位。
5. 涉及具体页面时再读对应 `pages/**`、`styles/tab/**`、`components/**`。

不要只看截图就重写页面结构。这个项目已有完整业务逻辑，原则是增量修改、保持功能。

## 3. 关键目录

```text
miniprogram/
  app.json                       # 页面路由、TabBar、窗口样式
  app.ts / app.wxss              # 入口；app.wxss 聚合 styles/
  assets/
    brand/                       # 导航 Logo
    design3d/                    # 3D 鸭子、场景、透明 PNG
    illustrations/               # 小插画、小图标
    tabbar/                      # TabBar 图片
  behaviors/
    active-trip.ts               # Tab 页当前旅行同步 behavior
    page-shell.ts                # 页面壳层辅助
  components/
    brand-nav/                   # 自定义品牌导航
    empty-state/                 # 空状态
    form-shell/                  # 表单页面壳
    plan-switch/                 # 计划切换
  constants/
    routes.ts                    # 路由常量
    storage-keys.ts              # storage key 与 reset version
  pages/
    schedule/                    # 日程 Tab
    notes/                       # 备忘 Tab
    stats/                       # 消费 Tab
    profile/                     # 我的 Tab
    *-form/                      # 新增/编辑表单
  services/
    trip-store.ts                # 本地核心状态、增删改、自动同步触发
    cloud-sync.ts                # 登录、上传/下载、邀请
    trip-sync-notify.ts          # 页面刷新通知
  styles/
    tokens.wxss                  # 品牌色、半径、阴影 token
    tab/*.wxss                   # Tab 页主要视觉样式
```

云函数：

```text
cloudfunctions/
  login/
  syncTrips/
  uploadImage/
```

## 4. 产品页面与核心功能

Tab 页面：

- `schedule`：旅行计划卡、当前计划操作、日程时间轴、左滑编辑/删除、图片预览。
- `notes`：旅行清单/备忘，分类筛选、完成状态、写备忘。
- `stats`：消费统计、预算使用率、日历、分类概览、记一笔、设置预算。
- `profile`：个人资料、旅行/记录/同步数据、共享旅行、菜单入口。

表单页面：

- `trip-form`：新建/编辑旅行计划。开始日期不能晚于结束日期。
- `schedule-form`：新增/编辑日程，支持图片上传到云端。
- `note-form`：新增/编辑备忘。
- `expense-form`：新增/编辑消费。
- `budget-form`：设置预算。
- `profile-edit`：编辑个人资料。

## 5. 视觉方向

整体风格关键词：

- 轻冷灰背景：`#F7FAFE`，必要时叠加很淡的暖橙光晕。
- 品牌橙：优先 `#FF6500` / `#FF7A00`，按钮可用 `linear-gradient(135deg, #ff9a1f, #ff5a00)`。
- 文本深色：`#111827`；辅助文字 `#7D8593` / `#8A93A3`。
- 大圆角玻璃卡片：主卡 `32rpx` 到 `42rpx`，字段 `24rpx` 到 `30rpx`。
- 阴影基调：`0 8rpx 32rpx rgba(0,0,0,.03), 0 16rpx 64rpx rgba(255,122,0,.05)`。
- 主按钮：大胶囊、橙色渐变、柔和橙色投影。
- 尽量使用真实/生成的透明 PNG，不要用突兀底色的图片。

全局 token 当前在 `miniprogram/styles/tokens.wxss`：

```css
--color-brand: #ff6500;
--color-brand-light: #ff9a1f;
--color-text: #111827;
--color-muted: #7d8593;
--color-bg: #f7fafe;
--radius-card: 36rpx;
--shadow-panel: 0 8rpx 32rpx rgba(0, 0, 0, 0.03), 0 16rpx 64rpx rgba(255, 122, 0, 0.05);
```

## 6. 设计参考图

本轮主要设计参考保存在本机：

- `/Users/pureshine/Pictures/冲鸭/已生成图像 1.png`：日程页，时间轴、竖线节点、鸭子压住第一张卡片左上角、右侧图片。
- `/Users/pureshine/Pictures/冲鸭/已生成图像 2.png`：备忘页，顶部大标题、铅笔鸭、进度条、分类胶囊、清单卡。
- `/Users/pureshine/Pictures/冲鸭/已生成图像 3.png`：消费页，大金额、圆环进度、金币鸭、分类/日历/交易列表。
- `/Users/pureshine/Pictures/冲鸭/已生成图像 4.png`：我的页，大鸭子、个人资料、统计卡、邀请好友、菜单。

已切/已生成资源：

- `miniprogram/assets/brand/nav-logo.png`
- `miniprogram/assets/design3d/memo-wordmark-transparent.png`
- `miniprogram/assets/design3d/memo-duck-pencil-transparent.png`
- `miniprogram/assets/design3d/expense-duck-coin-full.png`
- `miniprogram/assets/design3d/profile-duck-camera-full.png`
- `miniprogram/assets/design3d/profile-invite-scene-crop.png`
- `miniprogram/assets/design3d/schedule-plan-duck.png`
- `miniprogram/assets/design3d/timeline-duck-right.png`
- `miniprogram/assets/design3d/app-avatar-duck-transparent-300.png`

图片要求：

- 后续新生成复杂 3D 图片默认透明背景，不加底色。
- 用于小程序认证头像的图片要清晰、无文字、无水印、主体完整。
- 截图资源若出现缺角、白边、割裂感，要重新切图或重新生成，不要靠硬遮盖。

## 7. 用户审美与交互偏好

用户非常在意：

- 严格对齐设计图，不能文字重叠、乱码、溢出、被刘海遮挡。
- 兼容 iOS/Android、小屏和大屏；底部注意 `env(safe-area-inset-bottom)`。
- 页面第一屏要高级、干净、有呼吸感，不能空、不能像测试 Demo。
- 自定义导航要展示“冲鸭去旅行”品牌图，且避开胶囊按钮和状态栏。
- 不要出现重复标题：页面顶部导航已有标题时，内容区标题要换成更轻的说明或胶囊。
- 空状态要有可执行动作，但文案不能让用户困惑。
- 备忘/消费/日程没有旅行计划时，不要跳到不匹配的页面；点击“写备忘”“记一笔”应提示先新建旅行。
- 列表左滑按钮不滑动时不能漏出影子；滑开后卡片右侧应与编辑/删除按钮自然连接。
- 已完成状态要明显，但不能廉价；可用暖橙背景、勾选圆点、删除线。
- 消费预算卡要显示本次花费、总预算、预算剩余、使用率；圆环文字必须垂直居中。

## 8. 样式落地规则

- 优先改 WXSS；除非需要新增/删除元素或绑定事件，否则不要大改 WXML。
- 页面结构已有逻辑时，只做增量修改。
- 页面 wxss 不要继续堆重复大块 polish；Tab 视觉尽量放在：
  - `styles/tab/schedule-timeline.wxss`
  - `styles/tab/notes-memo.wxss`
  - `styles/tab/stats-ledger.wxss`
  - `styles/tab/profile-dashboard.wxss`
- 表单统一看 `styles/form-base.wxss` 和 `components/form-shell/`。
- CSS 类名 kebab-case，最多 3 段；跑 `npm run style:check`。
- `!important` 只在层叠冲突无法快速拆除时使用，并尽量集中在 tab partial 末尾。
- 不要使用页面内可见文字解释功能如何使用，界面应自解释。
- 卡片不要套卡片；页面区块尽量是自然布局或全宽带。
- 所有按钮内的图标/符号和文字必须垂直居中：统一用 `display: flex; align-items: center; justify-content: center; gap: ...`，不要靠 `line-height` 或 padding 硬凑。
- 已有 HTML 原型时，后续 WXML/WXSS 调整必须以原型为基准一比一还原布局、交互层级、卡片结构、按钮形态和间距；新增日程同步备忘/预算功能当前以 `prototypes/schedule-form-sync-prototype.html` 为准。

## 9. 状态与数据流红线

`trip-store.ts` 是本地旅行数据的唯一核心来源。不要绕过它直接改 storage。

重点 storage 状态：

- trips：旅行列表
- activeTripId：当前旅行 ID
- activeTripCleared：本地清空/无计划状态标记
- deletedTrips：已删除旅行 ID，用于云同步删除
- deletedItems：已删除日程/备忘/消费等子项
- profile：微信登录和同步信息
- dataResetVersion：本地测试数据清理版本

关键原则：

- 删除计划后，必须从源头清理/重置 `activeTripId`，不能只刷新 UI。
- 如果最后一个计划被删除，页面应进入“还没有旅行计划”的空状态。
- `createTrip` 会设置 active trip；`deleteTrip` 会 mark deleted 并重新选择或清空 active trip。
- 云同步前要保留 deleted IDs；同步成功后再清理。
- `activeTripBehavior` 用于 schedule/notes/stats 当前计划一致性，不要在单页各写一套状态缓存。
- 新增日程/备忘/消费/预算前必须确认有 active trip，没有则提示，不要跳错页面。

曾反复出现的问题：

- 删除计划后卡片仍显示旧计划：根因通常不是 UI 没刷新，而是全局 activeTripId 或页面缓存恢复时又塞回旧数据。
- 电脑模拟器和手机体验版不同步：要确认已微信登录、云函数已部署、集合权限正确、`syncTripsWithCloud` 上传下载链路跑通。
- 上传图片失败：如果客户端无云存储权限，走 `uploadImage` 云函数；还要确认云函数部署和存储权限。

## 10. 云开发与图片同步

云环境 ID：

```txt
cloud1-d2gse79u56ad69a8a
```

集合：

- `shared_trips`
- `trip_invitations`

云函数：

- `login`：获取 openid。
- `syncTrips`：上传/下载共享旅行、生成邀请、接受邀请、清空我的云端数据。
- `uploadImage`：客户端没有云存储权限时，由云函数代写入云存储。

图片上传要求：

- 日程图片应上传到云端，日程数据保存云文件 ID，邀请好友才能同步看到。
- 存储路径类似 `trip-images/旅行ID/时间戳-图片ID.jpg`。
- 若 Console 报 `STORAGE_EXCEED_AUTHORITY` 或 `Have no access right to the storage`，优先检查存储权限和 `uploadImage` 云函数是否已部署。

## 11. 已处理的重要需求记录

截至 2026-07-07，已处理/已沉淀：

- 清空测试数据，`seedTrips()` 返回空数组。
- 旅行计划跨设备同步，依赖微信登录和云同步。
- 删除计划需要从 activeTripId 源头处理。
- 日程删除/新增后页面通过同步通知刷新。
- 表单标题弱化，避免与顶部导航重复。
- 旅行表单开始日期不能晚于结束日期。
- 备忘页顶部按设计图切图，使用透明背景大标题和铅笔鸭。
- 备忘页不展示“当前计划”或计划名称，只按当前选中计划加载数据。
- 预算页不展示“当前计划”或计划切换入口，只按当前选中计划加载数据；后续调整不要再加回计划选择 UI。
- 消费页预算卡增加设置预算入口，展示预算使用率、总预算和剩余预算。
- 我的页按设计图调整个人中心、统计卡、邀请好友卡和菜单。
- 自定义品牌导航使用 `nav-logo.png`，兼容胶囊和刘海。
- 备案备注和隐私用途曾讨论过，可复用下方文本。

## 12. 备案与隐私文本参考

备案备注可用：

```text
本小程序为旅行计划与记录工具，提供旅行行程安排、出行备忘清单、消费预算记录、同行共享及云端同步等服务，帮助用户管理个人或同行旅行信息。
```

剪切板用途可写：

```text
用于在用户主动粘贴邀请码、同步码或分享口令时识别并填入对应内容，便于加入同行旅行或恢复相关数据。
```

照片/视频用途可写：

```text
用于用户主动上传旅行日程相关图片或凭证，展示在行程记录中，并同步给已授权的同行成员查看。
```

如果实际只调用 `wx.chooseImage`，隐私指引中建议只写“照片”，不要写“视频”。

## 13. 下一个小程序 Vibe Building 可复用提示

新项目开局可以直接给 AI：

```text
这是一个微信原生小程序，请以 750rpx 为设计基准，优先使用 WXML + WXSS + TS 原生能力。整体做成轻冷灰背景、橙色品牌色、圆角玻璃卡片、柔和多层阴影、3D 透明 PNG 角色的高级移动端 UI。功能先跑通，但所有页面从第一版就要兼容 iOS/Android、小屏/大屏、刘海屏和安全区，不能文字重叠、溢出或乱码。

请先建立：
1. 全局 tokens.wxss（品牌色、背景、文字、圆角、阴影）
2. form-shell / brand-nav / empty-state 等基础组件
3. 页面级 tab partial wxss，避免每页复制大块样式
4. 本地 store 作为唯一数据源，不要让页面各自缓存关键状态
5. 所有新增/编辑表单在保存入口做校验，不能只靠 UI 限制

图片资源若是复杂 3D 元素，默认生成 transparent background、no text、no watermark；简单图标优先 SVG/CSS。
```

## 14. 交接提醒

- 新对话若继续改 UI，先让它查看当前页面真实截图和设计参考图，不要凭想象重写。
- 新对话若修数据 bug，必须从 `trip-store.ts`、`activeTripBehavior`、云同步和 storage key 源头排查。
- 新对话若改图片，优先检查 PNG 透明通道、主体是否完整、是否有白边/缺角/底色。
- 每次完成代码修改后，至少跑：

```bash
npm run format:check
npm run typecheck
npm run build
```

涉及样式类名时再跑：

```bash
npm run style:check
```
