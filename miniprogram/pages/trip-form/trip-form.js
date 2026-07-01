"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const cloud_sync_1 = require("../../services/cloud-sync");
const date_1 = require("../../utils/date");
Page({
    data: {
        tripId: "",
        isEditing: false,
        formTitle: "新建旅行计划",
        formSubtitle: "比如：厦门三日游，后续日程、备忘和消费都会归到这个计划里。",
        saveLabel: "保存旅行",
        name: "",
        destination: "",
        startDate: (0, date_1.today)(),
        endDate: (0, date_1.today)(),
        saving: false
    },
    onLoad(options) {
        if (!options.id)
            return;
        const trip = (0, trip_store_1.getTrip)(options.id);
        if (!trip)
            return;
        wx.setNavigationBarTitle({ title: "编辑旅行计划" });
        this.setData({
            tripId: trip.id,
            isEditing: true,
            formTitle: "编辑旅行计划",
            formSubtitle: `${trip.destination} · ${trip.startDate} - ${trip.endDate}`,
            saveLabel: "保存修改",
            name: trip.name,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate
        });
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
    async saveTrip() {
        if (this.data.saving)
            return;
        const destination = this.data.destination.trim();
        const name = this.data.name.trim() || `${destination || "新的"}旅行`;
        if (!destination) {
            wx.showToast({ title: "先写目的地", icon: "none" });
            return;
        }
        this.setData({ saving: true });
        const input = {
            name,
            destination,
            startDate: this.data.startDate,
            endDate: this.data.endDate
        };
        if (this.data.isEditing) {
            (0, trip_store_1.updateTripInfo)(this.data.tripId, input);
        }
        else {
            (0, trip_store_1.createTrip)(input);
        }
        if ((0, cloud_sync_1.getSavedProfile)()) {
            try {
                await (0, cloud_sync_1.syncTripsWithCloud)();
            }
            catch (error) {
                console.error("旅行同步失败", error);
            }
        }
        wx.navigateBack();
    }
});
