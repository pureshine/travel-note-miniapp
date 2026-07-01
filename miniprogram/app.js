"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_sync_1 = require("./services/cloud-sync");
const CLOUD_ENV_ID = "cloud1-d2gse79u56ad69a8a";
const CLOUD_PULL_INTERVAL = 30 * 1000;
let pullingCloudTrips = false;
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
        pullSharedTripsSilently();
    }
});
function pullSharedTripsSilently() {
    const profile = (0, cloud_sync_1.getSavedProfile)();
    if (!profile || !wx.cloud || pullingCloudTrips)
        return;
    const lastPullAt = wx.getStorageSync("travel-note-last-cloud-pull") || 0;
    if (Date.now() - lastPullAt < CLOUD_PULL_INTERVAL)
        return;
    pullingCloudTrips = true;
    (0, cloud_sync_1.downloadTripsFromCloud)()
        .then(() => {
        wx.setStorageSync("travel-note-last-cloud-pull", Date.now());
    })
        .catch((error) => {
        console.error("共享旅行静默拉取失败", error);
    })
        .finally(() => {
        pullingCloudTrips = false;
    });
}
