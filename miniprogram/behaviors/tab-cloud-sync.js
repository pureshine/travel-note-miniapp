"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabCloudSyncBehavior = void 0;
const cloud_sync_1 = require("../services/cloud-sync");
function refreshTabPage(page) {
    if (typeof page.loadTrip === "function") {
        page.loadTrip();
        return;
    }
    if (typeof page.loadSelectedTrip === "function") {
        page.loadSelectedTrip();
        return;
    }
    if (typeof page.refreshLocalStats === "function") {
        page.refreshLocalStats();
    }
}
exports.tabCloudSyncBehavior = Behavior({
    pageLifetimes: {
        show() {
            const page = this;
            refreshTabPage(page);
            if (!(0, cloud_sync_1.getSavedProfile)()?.loggedIn)
                return;
            void (0, cloud_sync_1.syncTripsOnForeground)()
                .finally(() => {
                refreshTabPage(page);
            })
                .catch((error) => {
                console.error("Tab 云端同步失败", error);
            });
        }
    },
    methods: {
        pullCloudAndRefresh() {
            const page = this;
            refreshTabPage(page);
            if (!(0, cloud_sync_1.getSavedProfile)()?.loggedIn)
                return;
            void (0, cloud_sync_1.syncTripsOnForeground)()
                .finally(() => {
                refreshTabPage(page);
            })
                .catch((error) => {
                console.error("Tab 云端同步失败", error);
            });
        },
        refreshAfterCloudSync() {
            refreshTabPage(this);
        }
    }
});
