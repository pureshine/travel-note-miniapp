"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_1 = require("./config/cloud");
const storage_keys_1 = require("./constants/storage-keys");
App({
    globalData: {
        appName: "冲鸭去旅行"
    },
    onLaunch() {
        if (wx.cloud) {
            wx.cloud.init({
                env: cloud_1.CLOUD_ENV_ID,
                traceUser: true
            });
        }
        wx.setStorageSync(storage_keys_1.STORAGE_KEYS.lastOpened, Date.now());
    },
    onShow() {
        // 同步仅在「我的」页触发，避免后台拉取把已删除数据 merge 回来
    }
});
