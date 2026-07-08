"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExpenseToTrip = addExpenseToTrip;
exports.updateExpenseInTrip = updateExpenseInTrip;
exports.deleteExpenseFromTrip = deleteExpenseFromTrip;
exports.getExpenseByCategoryFromTrips = getExpenseByCategoryFromTrips;
function addExpenseToTrip(trip, title, amount, category, paidBy, id, createdAt) {
    return {
        ...trip,
        expenses: [{ id, title, amount, category, paidBy, createdAt }, ...trip.expenses]
    };
}
function updateExpenseInTrip(trip, expenseId, input) {
    return {
        ...trip,
        expenses: trip.expenses.map((item) => item.id === expenseId
            ? {
                ...item,
                title: input.title,
                amount: input.amount,
                category: input.category,
                paidBy: input.paidBy,
                createdAt: input.createdAt || item.createdAt
            }
            : item)
    };
}
function deleteExpenseFromTrip(trip, expenseId) {
    return {
        ...trip,
        expenses: trip.expenses.filter((item) => item.id !== expenseId)
    };
}
function getExpenseByCategoryFromTrips(trips) {
    const categories = ["交通", "住宿", "餐饮", "门票", "购物", "其他"];
    const expenses = trips.flatMap((trip) => trip.expenses);
    return categories.map((category) => ({
        category,
        amount: expenses
            .filter((item) => item.category === category)
            .reduce((total, item) => total + item.amount, 0)
    }));
}
