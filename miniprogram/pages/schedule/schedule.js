"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        trip: undefined,
        trips: [],
        tripNames: [],
        activeTripIndex: 0,
        scheduleTouchStartX: 0,
        openScheduleId: "",
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
    onScheduleTouchStart(event) {
        this.setData({
            scheduleTouchStartX: event.changedTouches[0].clientX,
            openScheduleId: this.data.openScheduleId === event.currentTarget.dataset.id ? this.data.openScheduleId : ""
        });
    },
    onScheduleTouchMove(event) {
        const distance = this.data.scheduleTouchStartX - event.changedTouches[0].clientX;
        const scheduleId = event.currentTarget.dataset.id;
        if (distance > 40) {
            this.setData({ openScheduleId: scheduleId });
        }
        else if (distance < -20 && this.data.openScheduleId === scheduleId) {
            this.setData({ openScheduleId: "" });
        }
    },
    editSchedule(event) {
        if (!this.data.trip)
            return;
        wx.navigateTo({ url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}&scheduleId=${event.currentTarget.dataset.id}` });
    },
    deleteScheduleItem(event) {
        if (!this.data.trip)
            return;
        const schedule = this.data.trip.schedules.find((item) => item.id === event.currentTarget.dataset.id);
        if (!schedule)
            return;
        wx.showModal({
            title: "删除日程",
            content: `确定删除“${schedule.title}”吗？`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm || !this.data.trip)
                    return;
                (0, trip_store_1.deleteSchedule)(this.data.trip.id, schedule.id);
                this.setData({ openScheduleId: "" });
                this.loadTrip();
            }
        });
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
