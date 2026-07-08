# 重构基线（Phase 0）

> 记录于重构开始前，用于零回归验收对比。

## 量化指标

| 指标 | 基线值 | Phase 4 目标 |
|------|--------|--------------|
| wxss 文件数 | 18 | ≤ 25（含 styles/ 拆分） |
| wxss 总行数 | 9,623 | 下降 30%+ |
| `!important` 总数 | 569 | 下降 50%+ |
| Shared design refresh 重复块 | 12 份 | 0 |
| 超 3 段类名 | 2 | 0 |
| components 目录 | 无 | ≥ 5 |

### 各文件明细

| 行数 | !important | 文件 |
|-----:|-----------:|------|
| 2655 | 564 | pages/profile/profile.wxss |
| 1630 | 38 | pages/schedule/schedule.wxss |
| 1272 | 227 | pages/notes/notes.wxss |
| 1225 | 112 | pages/stats/stats.wxss |
| 559 | 151 | pages/profile-edit/profile-edit.wxss |
| 281 | 19 | pages/trip-detail/trip-detail.wxss |
| 238 | 19 | pages/expenses/expenses.wxss |
| 222 | 20 | pages/index/index.wxss |
| 188 | 19 | pages/budget-form/budget-form.wxss |
| 183 | 1 | app.wxss |
| 180 | 19 | pages/trips/trips.wxss |
| 155 | 19 | pages/schedule-form/schedule-form.wxss |
| 144 | 19 | pages/settings/settings.wxss |
| 130 | 19 | pages/checklist/checklist.wxss |
| 109 | 19 | pages/trip-form/trip-form.wxss |
| 108 | 19 | pages/note-form/note-form.wxss |
| 108 | 19 | pages/expense-form/expense-form.wxss |
| 53 | 0 | custom-tab-bar/index.wxss（将删除） |

## 核心用户路径验收

- [ ] 新建旅行 → 保存成功 → 回到日程页
- [ ] 编辑/删除计划 → 我的页计划数正确
- [ ] 日程增删改、操作菜单、左滑
- [ ] 备忘勾选、分类筛选
- [ ] 消费录入、预算圆环、日历
- [ ] 清单勾选
- [ ] 资料编辑、云同步
- [ ] 设置页重置

## 视觉基线页面清单

请在微信开发者工具逐页截图存档：

1. Tab：schedule / notes / stats / profile
2. Form：trip-form / schedule-form / note-form / expense-form / budget-form / profile-edit
3. 其他：trip-detail / index

## 不可动区域（逻辑）

- `trip-store.ts`：`createTrip` 先 `setActiveTripId` 再 `writeTrips`；`mergeTrips` 本地优先；`reconcileClearedPlanState`
- `cloud-sync.ts`：`syncTripsWithCloud` upload 后 replace
- `stats-ledger.wxss` ring/duck 定位（page wxss 瘦身后已无层叠冲突，暂不需 !important）

## 违规类名

- `.duck-tabbar-item-active`（4 段，随 custom-tab-bar 删除）
- `.profile-edit-bg-mountain`（4 段，已改为 `.edit-bg-peak`）

## 重构后指标（2026-07-07）

| 指标 | 重构后 |
|------|--------|
| wxss 文件数 | 30（含 styles/ 拆分） |
| Shared design refresh 重复块 | 0 |
| components | 4（brand-nav / form-shell / empty-state / plan-switch） |
| 超 3 段类名 | 0（style:check 通过） |
| custom-tab-bar | 已删除 |

## Phase 5 — 样式层叠治理与逻辑收敛（收尾）

| 项 | 状态 |
|----|------|
| notes.wxss 瘦身为纯骨架（polish 归 notes-memo） | ✅ |
| Tab 页统一 `activeTripBehavior`（schedule/notes/stats） | ✅ |
| notes-memo.wxss 合并重复 hero 层（997→~450 行，0 !important） | ✅ |
| schedule-timeline 去除层叠冲突与冗余 !important | ✅ |
| profile.wxss 瘦身为 setup sheet 骨架 | ✅ |
| profile-dashboard.wxss 合并去重（2159→656 行，0 !important） | ✅ |
| stats.wxss 删除 plan-switch 死代码，瘦身为 calendar/recent 骨架 | ✅ |
| stats-ledger.wxss 合并 budget hero 层（849→594 行） | ✅ |
| profile 统计区 icon+文案排版定稿 | ✅ |
| schedule-form / note-form 接入 form-shell | ✅ |
| profile-edit.wxss 合并去重（487→~270 行，0 !important） | ✅ |
| schedule-timeline.wxss 删除重复 alignment 层 | ✅ |
| schedule.wxss 瘦身为纯骨架，空态拆至 schedule-empty.wxss | ✅ |
| schedule 页扁平化唯一类名（sch-*，0 嵌套选择器） | ✅ |
| 全局 !important 清零（u-hide 替代） | ✅ |
| style:check 增加嵌套选择器检测 | ✅ |
| schedule-form / expense-form 分类 picker 绑定 categoryIndex | ✅ |
| 备忘分类调整为 物品/事项/预订/攻略 | ✅ |
| schedule-empty.wxss 拆分空态/引导样式（205 行） | ✅ |
| profile 僵尸 DOM + syncTip/inviteStatus 死数据清理 | ✅ |
| profile 死数据清理（syncStatus/profileSubtitle/currentTrip*） | ✅ |
| notes legacy-title-row 僵尸 DOM + display:none 清理 | ✅ |
| schedule 计划控件 sch-plan-ops 统一设计 | ✅ |
| shared-secondary 删除与 index.wxss 重复的 .home-page | ✅ |
| 核心路径人工验收清单 | 待本地确认 |
| 超长 tab polish 文件瘦身（>800 行） | ✅ |

**Phase 5 指标（2026-07-08）：**

| 指标 | 基线 | 当前 |
|------|------|------|
| wxss 文件数 | 18 | **33**（含 styles/ 拆分，≤800 行无告警） |
| wxss 总行数 | 9,623 | **~4,850**（约 -50%） |
| `!important` | 569 | **0** |
| profile-dashboard.wxss | 2,655（page 内） | **656** |
| schedule-timeline.wxss | 1,630（page 内） | **~750** + schedule-empty **205** |
| schedule.wxss | 1,630 | **3**（纯 @import 骨架） |

`schedule-timeline.wxss` 日程区 **0 类嵌套**；`schedule.wxss` 使用 `time-duck` / `sch-*` 唯一类名。
