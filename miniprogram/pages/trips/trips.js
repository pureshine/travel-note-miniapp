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
    addTrip() {
        const trip = (0, trip_store_1.createTrip)();
        wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${trip.id}` });
    }
});
