"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
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
        category: "餐饮",
        paidBy: "我",
        categories: ["餐饮", "交通", "住宿", "购物", "门票", "其他"]
    },
    onLoad(options) {
        if (!options.tripId)
            return;
        const trip = (0, trip_store_1.getTrip)(options.tripId);
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
            category: expense ? expense.category : this.data.category,
            paidBy: expense ? expense.paidBy : this.data.paidBy
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
    onCategoryChange(event) {
        const index = Number(event.detail.value);
        this.setData({ category: this.data.categories[index] });
    },
    saveExpense() {
        const title = this.data.title.trim();
        const amount = Number(this.data.amount);
        if (!title || !Number.isFinite(amount) || amount <= 0) {
            wx.showToast({ title: "填写消费和金额", icon: "none" });
            return;
        }
        if (this.data.isEditing) {
            (0, trip_store_1.updateExpense)(this.data.tripId, this.data.expenseId, { title, amount, category: this.data.category, paidBy: this.data.paidBy || "我" });
        }
        else {
            (0, trip_store_1.addExpense)(this.data.tripId, title, amount, this.data.category, this.data.paidBy || "我");
        }
        wx.navigateBack();
    }
});
