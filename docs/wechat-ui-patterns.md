# 微信小程序 UI 踩坑与标准解法

> 记录真机/开发者工具表现与 CSS 计算不一致的场景，避免重复排查。

## 1. 原生 `<button>` 宽度/样式不生效

### 现象

- Devtools 里 `width: 148rpx` 已计算生效，但视觉上按钮仍偏宽、像没改
- 给 `button` 设 `width: auto` 反而被父级撑满
- 左对齐设置了 `align-self: flex-start` 仍看起来居中

### 根因

1. 微信自动给 `<button>` 注入基础类 `btn`，带**内置最小宽度、padding、绘制规则**
2. 布局盒宽度 ≠ 可见胶囊背景宽度；改 `width` 只影响盒模型，不保证视觉缩窄
3. `open-type="share"` 等原生能力必须用 `<button>`，无法换成 `<view>`

### 标准解法：视觉层 + 透明点击层

**视觉由 `view` 控制，分享/登录等能力由透明 `button` 覆盖。**

```xml
<view class="pf-share-wrap">
  <view class="pf-share-face">分享给好友</view>
  <button class="pf-share-hit" open-type="share" hover-class="none">分享给好友</button>
</view>
```

```css
.pf-share-wrap {
  position: relative;
  display: inline-flex;
  align-self: flex-start;
}

.pf-share-face {
  display: inline-flex;
  align-items: center;
  height: 66rpx;
  padding: 0 22rpx; /* 宽度由文字 + padding 决定 */
  border-radius: 999rpx;
  pointer-events: none;
  /* 背景、字号、颜色写在这里 */
}

.pf-share-hit {
  position: absolute;
  inset: 0;
  z-index: 2;
  margin: 0;
  padding: 0;
  opacity: 0;
  background: transparent;
  border: 0;
}

.pf-share-hit::after {
  border: 0;
}
```

### 本项目落地

| 页面 | 类名 | 说明 |
|------|------|------|
| profile 邀请区 | `pf-share-wrap` / `pf-share-face` / `pf-share-hit` | 生成邀请后的「分享给好友」 |

### 禁止做法

- ❌ 仅调 `button` 的 `width` / `min-width` 期望视觉变窄
- ❌ 对 `button` 使用 `width: auto` 指望贴合文字（常被撑满父级）
- ❌ 用 `!important` 硬压（仍可能视觉不一致）

### 同类场景

凡需**自定义外观**且保留 `open-type`（`share` / `getPhoneNumber` / `chooseAvatar` 等）的按钮，一律用本模式。

---

## 2. `createInvite` 与页面 `syncing` 互斥

### 现象

点「生成邀请」总提示「正在同步，请稍后」。

### 根因

`onShow` → `reconcileWithCloud()` 将 `syncing: true`；`createInvite` 用全局 `syncing` 拦截。而 `createInvite` 内部本就会 `await syncTripsWithCloud()`，拦截多余。

### 解法

`createInvite` **不要**检查全局 `syncing`；仅用 `inviteLoading` 防重复点击。

---

## 3. 排查清单（同类问题 5 分钟定位）

1. 元素是否为微信原生组件（`button` / `picker` / `scroll-view`）？
2. Devtools 选中节点是否带系统类 `btn`？
3. 视觉宽度问题：改 `view` 是否生效？若生效则是 button 绘制问题 → 用双层结构
4. 逻辑拦截：是否有多处共用一个 `syncing` 布尔值？
5. 改 TS 后是否执行 `npm run build` 同步 `profile.js`？
