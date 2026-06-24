"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        trip: undefined,
        title: "",
        amount: "",
        category: "餐饮",
        paidBy: "我",
        categories: ["交通", "住宿", "餐饮", "门票", "购物", "其他"],
        total: 0
    },
    onLoad(options) {
        if (!options.id)
            return;
        this.setData({ tripId: options.id });
        this.loadTrip(options.id);
    },
    loadTrip(tripId) {
        const trip = (0, trip_store_1.getTrip)(tripId);
        this.setData({
            trip,
            total: trip ? trip.expenses.reduce((sum, item) => sum + item.amount, 0) : 0
        });
    },
    onTitleInput(event) {
        this.setData({ title: event.detail.value });
    },
    onAmountInput(event) {
        this.setData({ amount: event.detail.value });
    },
    onPaidByInput(event) {
        this.setData({ paidBy: event.detail.value });
    },
    onCategoryChange(event) {
        const index = Number(event.detail.value);
        this.setData({ category: this.data.categories[index] });
    },
    addItem() {
        const title = this.data.title.trim();
        const amount = Number(this.data.amount);
        if (!title || !Number.isFinite(amount) || amount <= 0) {
            wx.showToast({ title: "填写消费和金额", icon: "none" });
            return;
        }
        (0, trip_store_1.addExpense)(this.data.tripId, title, amount, this.data.category, this.data.paidBy || "我");
        this.setData({ title: "", amount: "" });
        this.loadTrip(this.data.tripId);
    }
});
