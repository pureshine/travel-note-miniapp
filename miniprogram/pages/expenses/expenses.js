"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const cloud_sync_1 = require("../../services/cloud-sync");
function getDefaultPaidBy() {
    return (0, cloud_sync_1.getSavedProfile)()?.nickname?.trim() || "我";
}
Page({
    data: {
        tripId: "",
        trip: undefined,
        trips: [],
        tripNames: [],
        activeTripIndex: 0,
        expenseTouchStartX: 0,
        openExpenseId: "",
        title: "",
        amount: "",
        category: "餐饮",
        paidBy: "我",
        categories: ["交通", "住宿", "餐饮", "门票", "购物", "其他"],
        total: 0
    },
    onLoad(options) {
        if (options.id)
            (0, trip_store_1.setActiveTripId)(options.id);
        this.loadSelectedTrip();
    },
    onShow() {
        this.loadSelectedTrip();
    },
    loadSelectedTrip() {
        const trip = (0, trip_store_1.getDefaultTrip)();
        this.loadTrip(trip.id);
    },
    loadTrip(tripId) {
        const trip = (0, trip_store_1.getTrip)(tripId);
        const trips = (0, trip_store_1.listTrips)();
        this.setData({
            tripId,
            trip,
            trips,
            tripNames: trips.map((item) => item.name),
            activeTripIndex: Math.max(trips.findIndex((item) => item.id === tripId), 0),
            paidBy: this.data.paidBy.trim() || getDefaultPaidBy(),
            total: trip ? trip.expenses.reduce((sum, item) => sum + item.amount, 0) : 0
        });
    },
    onTripChange(event) {
        const index = Number(event.detail.value);
        const trip = this.data.trips[index];
        if (!trip)
            return;
        (0, trip_store_1.setActiveTripId)(trip.id);
        this.loadTrip(trip.id);
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
        (0, trip_store_1.addExpense)(this.data.tripId, title, amount, this.data.category, this.data.paidBy.trim() || getDefaultPaidBy());
        this.setData({ title: "", amount: "" });
        this.loadTrip(this.data.tripId);
    },
    onExpenseTouchStart(event) {
        this.setData({
            expenseTouchStartX: event.changedTouches[0].clientX,
            openExpenseId: this.data.openExpenseId === event.currentTarget.dataset.id ? this.data.openExpenseId : ""
        });
    },
    onExpenseTouchMove(event) {
        const distance = this.data.expenseTouchStartX - event.changedTouches[0].clientX;
        const expenseId = event.currentTarget.dataset.id;
        if (distance > 40) {
            this.setData({ openExpenseId: expenseId });
        }
        else if (distance < -20 && this.data.openExpenseId === expenseId) {
            this.setData({ openExpenseId: "" });
        }
    },
    editExpense(event) {
        wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.tripId}&expenseId=${event.currentTarget.dataset.id}` });
    },
    deleteExpense(event) {
        const expense = this.data.trip?.expenses.find((item) => item.id === event.currentTarget.dataset.id);
        if (!expense)
            return;
        wx.showModal({
            title: "删除消费",
            content: `确定删除“${expense.title}”吗？`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm)
                    return;
                (0, trip_store_1.deleteExpense)(this.data.tripId, expense.id);
                this.setData({ openExpenseId: "" });
                this.loadTrip(this.data.tripId);
            }
        });
    }
});
