"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        trips: [],
        summary: {
            tripCount: 0,
            expenseTotal: 0,
            checklistDone: 0,
            checklistTotal: 0
        },
        nextTrip: undefined,
        scheduleCount: 0,
        memoDone: 0,
        memoTotal: 0,
        topCategory: "暂无"
    },
    onShow() {
        this.refreshHomeData();
    },
    refreshHomeData() {
        const trips = (0, trip_store_1.listTrips)();
        const trip = trips[0];
        const notes = trips.flatMap((item) => item.notes);
        const categories = (0, trip_store_1.getExpenseByCategory)().filter((item) => item.amount > 0);
        const topCategory = categories.sort((a, b) => b.amount - a.amount)[0];
        this.setData({
            trips,
            nextTrip: trip,
            summary: (0, trip_store_1.getSummary)(),
            scheduleCount: trip ? trip.schedules.length : 0,
            memoDone: notes.filter((item) => item.done).length,
            memoTotal: notes.length,
            topCategory: topCategory ? topCategory.category : "暂无"
        });
    },
    openTrip(event) {
        wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${event.currentTarget.dataset.id}` });
    },
    addTrip() {
        const trip = (0, trip_store_1.createTrip)();
        wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${trip.id}` });
    },
    goTrips() {
        wx.switchTab({ url: "/pages/trips/trips" });
    },
    goSchedule() {
        wx.switchTab({ url: "/pages/schedule/schedule" });
    },
    goNotes() {
        wx.switchTab({ url: "/pages/notes/notes" });
    },
    goStats() {
        wx.switchTab({ url: "/pages/stats/stats" });
    }
});
