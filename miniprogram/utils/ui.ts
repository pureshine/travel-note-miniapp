type WxWithMenu = WechatMiniprogram.Wx & {
  getSystemInfoSync?: () => { statusBarHeight?: number };
  getMenuButtonBoundingClientRect?: () => { bottom?: number };
};

export function getSafeTopStyle(extra = 22): string {
  const wxApi = wx as WxWithMenu;
  const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
  const menuBottom = wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
  return `padding-top:${Math.ceil(menuBottom + extra)}px;`;
}
