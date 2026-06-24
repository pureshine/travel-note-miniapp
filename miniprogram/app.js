"use strict";
App({
    globalData: {
        appName: "旅小记"
    },
    onLaunch() {
        wx.setStorageSync("travel-note-last-opened", Date.now());
    }
});
