"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        trip: undefined,
        title: ""
    },
    onLoad(options) {
        if (!options.id)
            return;
        this.setData({ tripId: options.id });
        this.loadTrip(options.id);
    },
    loadTrip(tripId) {
        this.setData({ trip: (0, trip_store_1.getTrip)(tripId) });
    },
    onInput(event) {
        this.setData({ title: event.detail.value });
    },
    addItem() {
        const title = this.data.title.trim();
        if (!title) {
            wx.showToast({ title: "写一个清单项", icon: "none" });
            return;
        }
        const trip = (0, trip_store_1.addChecklistItem)(this.data.tripId, title);
        this.setData({ trip, title: "" });
    },
    toggleItem(event) {
        const trip = (0, trip_store_1.toggleChecklistItem)(this.data.tripId, event.currentTarget.dataset.id);
        this.setData({ trip });
    }
});
