"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const cloud_sync_1 = require("../../services/cloud-sync");
function getDefaultPaidBy() {
    return (0, cloud_sync_1.getSavedProfile)()?.nickname?.trim() || "我";
}
function formatDateKey(date) {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}
function dateToCreatedAt(date) {
    return new Date(`${date}T12:00:00`).getTime();
}
Page({
    data: {
        tripId: "",
        expenseId: "",
        isEditing: false,
        trip: undefined,
        formTitle: "新增消费",
        saveLabel: "保存消费",
        title: "",
        amount: "",
        date: formatDateKey(new Date()),
        category: "餐饮",
        paidBy: "我",
        categories: ["餐饮", "交通", "住宿", "购物", "门票", "其他"],
        saving: false
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
        const expense = trip?.expenses.find((item) => item.id === options.expenseId);
        this.setData({
            tripId: options.tripId,
            expenseId: options.expenseId || "",
            isEditing: Boolean(expense),
            trip,
            formTitle: expense ? "编辑消费" : "新增消费",
            saveLabel: expense ? "保存修改" : "保存消费",
            title: expense ? expense.title : "",
            amount: expense ? String(expense.amount) : "",
            date: expense ? formatDateKey(new Date(expense.createdAt)) : options.date || formatDateKey(new Date()),
            category: expense ? expense.category : this.data.category,
            paidBy: expense ? expense.paidBy : getDefaultPaidBy()
        });
        if (expense)
            wx.setNavigationBarTitle({ title: "编辑消费" });
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
    onDateChange(event) {
        this.setData({ date: event.detail.value });
    },
    onCategoryChange(event) {
        const index = Number(event.detail.value);
        this.setData({ category: this.data.categories[index] });
    },
    saveExpense() {
        if (this.data.saving)
            return;
        const title = this.data.title.trim();
        const amount = Number(this.data.amount);
        if (!title || !Number.isFinite(amount) || amount <= 0) {
            wx.showToast({ title: "填写消费和金额", icon: "none" });
            return;
        }
        this.setData({ saving: true });
        const paidBy = this.data.paidBy.trim() || getDefaultPaidBy();
        const createdAt = dateToCreatedAt(this.data.date);
        if (this.data.isEditing) {
            (0, trip_store_1.updateExpense)(this.data.tripId, this.data.expenseId, { title, amount, category: this.data.category, paidBy, createdAt });
        }
        else {
            (0, trip_store_1.addExpense)(this.data.tripId, title, amount, this.data.category, paidBy, createdAt);
        }
        wx.navigateBack();
    }
});
