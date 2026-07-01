"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeTopStyle = void 0;
function getSafeTopStyle(extra = 22) {
    const wxApi = wx;
    const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
    const menuBottom = wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
    return `padding-top:${Math.ceil(menuBottom + extra)}px;`;
}
exports.getSafeTopStyle = getSafeTopStyle;
