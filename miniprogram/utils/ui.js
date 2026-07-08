"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeTopStyle = getSafeTopStyle;
exports.getCustomNavStyle = getCustomNavStyle;
function getSafeTopStyle(extra = 22) {
    const wxApi = wx;
    const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
    const menuBottom = wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
    return `padding-top:${Math.ceil(menuBottom + extra)}px;`;
}
function getCustomNavStyle() {
    const wxApi = wx;
    const systemInfo = wxApi.getSystemInfoSync?.() || {};
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const menu = wxApi.getMenuButtonBoundingClientRect?.() || {};
    const top = menu.top || statusBarHeight + 7;
    return `top:${Math.ceil(top)}px;`;
}
