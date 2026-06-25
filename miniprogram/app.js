"use strict";
const CLOUD_ENV_ID = "cloud1-d2gse79u56ad69a8a";
App({
    globalData: {
        appName: "临时出逃"
    },
    onLaunch() {
        if (wx.cloud) {
            wx.cloud.init({
                env: CLOUD_ENV_ID,
                traceUser: true
            });
        }
        wx.setStorageSync("travel-note-last-opened", Date.now());
    }
});
