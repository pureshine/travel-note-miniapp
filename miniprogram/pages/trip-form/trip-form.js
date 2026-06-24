"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const date_1 = require("../../utils/date");
Page({
    data: {
        name: "",
        destination: "",
        startDate: (0, date_1.today)(),
        endDate: (0, date_1.today)()
    },
    onNameInput(event) {
        this.setData({ name: event.detail.value });
    },
    onDestinationInput(event) {
        this.setData({ destination: event.detail.value });
    },
    onStartDateChange(event) {
        this.setData({ startDate: event.detail.value });
    },
    onEndDateChange(event) {
        this.setData({ endDate: event.detail.value });
    },
    saveTrip() {
        const destination = this.data.destination.trim();
        const name = this.data.name.trim() || `${destination || "新的"}旅行`;
        if (!destination) {
            wx.showToast({ title: "先写目的地", icon: "none" });
            return;
        }
        (0, trip_store_1.createTrip)({
            name,
            destination,
            startDate: this.data.startDate,
            endDate: this.data.endDate
        });
        wx.navigateBack();
    }
});
