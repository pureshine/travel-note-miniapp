"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        trip: undefined,
        trips: [],
        tripNames: [],
        activeTripIndex: 0,
        schedules: []
    },
    onShow() {
        this.loadTrip();
    },
    loadTrip() {
        const trip = (0, trip_store_1.getDefaultTrip)();
        const trips = (0, trip_store_1.listTrips)();
        this.setData({
            trip,
            trips,
            tripNames: trips.map((item) => item.name),
            activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
            schedules: this.toScheduleViews(trip.schedules)
        });
    },
    onTripChange(event) {
        const index = Number(event.detail.value);
        const trip = this.data.trips[index];
        if (!trip)
            return;
        (0, trip_store_1.setActiveTripId)(trip.id);
        this.loadTrip();
    },
    goTripForm() {
        wx.navigateTo({ url: "/pages/trip-form/trip-form" });
    },
    goScheduleForm() {
        if (!this.data.trip)
            return;
        wx.navigateTo({ url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}` });
    },
    toScheduleViews(items) {
        return items.map((item) => {
            const status = getScheduleStatus(item);
            return {
                ...item,
                status,
                statusClass: getStatusClass(status),
                active: status === "进行中"
            };
        });
    }
});
function getScheduleStatus(item) {
    const scheduleTime = new Date(`${item.day}T${item.time || "00:00"}:00`).getTime();
    const now = Date.now();
    if (Number.isNaN(scheduleTime))
        return "待进行";
    if (now >= scheduleTime)
        return "已完成";
    if (scheduleTime - now <= 30 * 60 * 1000)
        return "进行中";
    return "待进行";
}
function getStatusClass(status) {
    if (status === "已完成")
        return "done";
    if (status === "进行中")
        return "active";
    return "pending";
}
