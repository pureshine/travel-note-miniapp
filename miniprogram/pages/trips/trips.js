"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        trips: []
    },
    onShow() {
        this.setData({ trips: (0, trip_store_1.listTrips)() });
    },
    openTrip(event) {
        wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${event.currentTarget.dataset.id}` });
    },
    editTrip(event) {
        wx.navigateTo({ url: `/pages/trip-form/trip-form?id=${event.currentTarget.dataset.id}` });
    },
    deleteTrip(event) {
        const trip = this.data.trips.find((item) => item.id === event.currentTarget.dataset.id);
        if (!trip)
            return;
        wx.showModal({
            title: "删除旅行计划",
            content: `确定删除“${trip.name}”吗？相关日程、备忘和消费也会删除。`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm)
                    return;
                (0, trip_store_1.deleteTrip)(trip.id);
                this.setData({ trips: (0, trip_store_1.listTrips)() });
            }
        });
    },
    addTrip() {
        const trip = (0, trip_store_1.createTrip)();
        wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${trip.id}` });
    }
});
