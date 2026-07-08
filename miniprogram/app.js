"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_1 = require("./config/cloud");
const storage_keys_1 = require("./constants/storage-keys");
const cloud_sync_1 = require("./services/cloud-sync");
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
        (0, cloud_sync_1.syncTripsOnForeground)(true).catch((error) => {
            console.error("前台自动同步失败", error);
        });
    }
});
