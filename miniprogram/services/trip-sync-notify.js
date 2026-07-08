"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyTripDataChanged = notifyTripDataChanged;
const storage_keys_1 = require("../constants/storage-keys");
const routes_1 = require("../constants/routes");
function notifyTripDataChanged() {
    wx.setStorageSync(storage_keys_1.STORAGE_KEYS.dataUpdatedAt, Date.now());
    const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
    pages.forEach((page) => {
        const route = typeof page.route === "string" ? page.route : "";
        if (route === routes_1.PAGE_ROUTES.index && typeof page.refreshHomeData === "function") {
            page.refreshHomeData();
            return;
        }
        if (route === routes_1.PAGE_ROUTES.trips && typeof page.refreshTripList === "function") {
            page.refreshTripList();
            return;
        }
        if (route === routes_1.PAGE_ROUTES.schedule && typeof page.loadTrip === "function") {
            page.loadTrip();
            return;
        }
        if ((route === routes_1.PAGE_ROUTES.notes ||
            route === routes_1.PAGE_ROUTES.stats ||
            route === routes_1.PAGE_ROUTES.expenses) &&
            typeof page.loadSelectedTrip === "function") {
            page.loadSelectedTrip();
            return;
        }
        if (route === routes_1.PAGE_ROUTES.profile && typeof page.refreshLocalStats === "function") {
            page.refreshLocalStats();
        }
    });
}
