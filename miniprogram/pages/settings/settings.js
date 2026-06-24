"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    resetData() {
        wx.showModal({
            title: "重置示例数据",
            content: "会恢复到初始示例旅行，方便重新体验功能。",
            confirmColor: "#167C70",
            success: (res) => {
                if (!res.confirm)
                    return;
                (0, trip_store_1.resetDemoData)();
                wx.showToast({ title: "已重置", icon: "success" });
            }
        });
    }
});
