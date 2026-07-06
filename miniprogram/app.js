"use strict";
const CLOUD_ENV_ID = "cloud1-d2gse79u56ad69a8a";
App({
    globalData: {
        appName: "冲鸭去旅行"
    },
    onLaunch() {
        if (wx.cloud) {
            wx.cloud.init({
                env: CLOUD_ENV_ID,
                traceUser: true
            });
        }
        wx.setStorageSync("travel-note-last-opened", Date.now());
    },
    onShow() {
        // 同步仅在「我的」页触发，避免后台拉取把已删除数据 merge 回来
    }
});
