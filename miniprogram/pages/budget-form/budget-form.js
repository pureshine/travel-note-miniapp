"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        trip: undefined,
        budget: "",
        saving: false,
        presets: [3000, 5000, 8000, 12000, 16800, 30000]
    },
    onLoad(options) {
        if (!options.tripId)
            return;
        const trip = (0, trip_store_1.getTrip)(options.tripId);
        if (!trip) {
            wx.showToast({ title: "旅行不存在", icon: "none" });
            wx.navigateBack();
            return;
        }
        this.setData({
            tripId: trip.id,
            trip,
            budget: String(trip.budget || 16800)
        });
    },
    onBudgetInput(event) {
        this.setData({ budget: event.detail.value });
    },
    choosePreset(event) {
        this.setData({ budget: String(event.currentTarget.dataset.value) });
    },
    saveBudget() {
        if (this.data.saving)
            return;
        const budget = Number(this.data.budget);
        if (!Number.isFinite(budget) || budget <= 0) {
            wx.showToast({ title: "请输入预算金额", icon: "none" });
            return;
        }
        this.setData({ saving: true });
        (0, trip_store_1.updateTripBudget)(this.data.tripId, Math.round(budget));
        wx.showToast({ title: "预算已保存", icon: "success" });
        wx.navigateBack();
    }
});
