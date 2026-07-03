type WxWithMenu = WechatMiniprogram.Wx & {
  getSystemInfoSync?: () => { statusBarHeight?: number; windowWidth?: number };
  getMenuButtonBoundingClientRect?: () => { top?: number; bottom?: number; left?: number; height?: number };
};

export function getSafeTopStyle(extra = 22): string {
  const wxApi = wx as WxWithMenu;
  const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
  const menuBottom = wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
  return `padding-top:${Math.ceil(menuBottom + extra)}px;`;
}

export function getCustomNavStyle(): string {
  const wxApi = wx as WxWithMenu;
  const systemInfo = wxApi.getSystemInfoSync?.() || {};
  const statusBarHeight = systemInfo.statusBarHeight || 0;
  const menu = wxApi.getMenuButtonBoundingClientRect?.() || {};
  const top = menu.top || statusBarHeight + 7;
  return `top:${Math.ceil(top)}px;`;
}
