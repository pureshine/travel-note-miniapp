"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        trips: [],
        trip: undefined,
        expenseTotal: 0,
        categories: [],
        expenseCount: 0,
        averageExpense: 0,
        budget: 16800,
        remaining: 0,
        budgetPercent: 0,
        recentExpenses: []
    },
    onShow() {
        const trip = (0, trip_store_1.getDefaultTrip)();
        const expenses = trip.expenses;
        const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
        const categories = getCategories(expenses, expenseTotal);
        const budget = this.data.budget;
        this.setData({
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
    goExpenseForm() {
        if (!this.data.trip)
            return;
        wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}` });
    }
});
function getCategories(expenses, total) {
    const categories = ["餐饮", "交通", "住宿", "购物", "门票", "其他"];
    return categories.map((category) => {
        const amount = expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
        return {
            category,
            amount,
            percent: total > 0 ? Math.round((amount / total) * 100) : 0
        };
    });
}
