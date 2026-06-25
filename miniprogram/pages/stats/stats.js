"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        trips: [],
        tripNames: [],
        activeTripIndex: 0,
        trip: undefined,
        expenseTotal: 0,
        categories: [],
        expenseCount: 0,
        averageExpense: 0,
        budget: 16800,
        remaining: 0,
        budgetPercent: 0,
        expenseTouchStartX: 0,
        openExpenseId: "",
        recentExpenses: []
    },
    onShow() {
        this.loadSelectedTrip();
    },
    loadSelectedTrip() {
        const trip = (0, trip_store_1.getDefaultTrip)();
        const trips = (0, trip_store_1.listTrips)();
        const expenses = trip.expenses;
        const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
        const categories = getCategories(expenses, expenseTotal);
        const budget = this.data.budget;
        this.setData({
            trips,
            tripNames: trips.map((item) => item.name),
            activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
            trip,
            expenseTotal,
            categories,
            expenseCount: expenses.length,
            averageExpense: expenses.length > 0 ? Math.round(expenseTotal / expenses.length) : 0,
            remaining: Math.max(budget - expenseTotal, 0),
            budgetPercent: Math.min(Math.round((expenseTotal / budget) * 100), 100),
            recentExpenses: expenses.slice(0, 4)
        });
    },
    onTripChange(event) {
        const index = Number(event.detail.value);
        const trip = this.data.trips[index];
        if (!trip)
            return;
        (0, trip_store_1.setActiveTripId)(trip.id);
        this.loadSelectedTrip();
    },
    goExpenseForm() {
        if (!this.data.trip)
            return;
        wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}` });
    },
    editExpense(event) {
        if (!this.data.trip)
            return;
        wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}&expenseId=${event.currentTarget.dataset.id}` });
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
    deleteExpense(event) {
        const expense = this.data.trip?.expenses.find((item) => item.id === event.currentTarget.dataset.id);
        if (!expense || !this.data.trip)
            return;
        wx.showModal({
            title: "删除消费",
            content: `确定删除“${expense.title}”吗？`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm || !this.data.trip)
                    return;
                (0, trip_store_1.deleteExpense)(this.data.trip.id, expense.id);
                this.setData({ openExpenseId: "" });
                this.loadSelectedTrip();
            }
        });
    }
});
function getCategories(expenses, total) {
    const categories = ["餐饮", "交通", "住宿", "购物", "门票", "其他"];
    let usedPercent = 0;
    return categories.map((category, index) => {
        const amount = expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
        const percent = total > 0 ? (index === categories.length - 1 ? Math.max(100 - usedPercent, 0) : Math.round((amount / total) * 100)) : 0;
        usedPercent += percent;
        return {
            category,
            amount,
            percent
        };
    });
}
