"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const date_1 = require("../../utils/date");
Page({
    data: {
        tripId: "",
        trip: undefined,
        title: "",
        day: (0, date_1.today)(),
        time: "09:00",
        place: "",
        note: "",
        category: "景点",
        categories: (0, trip_store_1.getScheduleCategories)(),
        images: []
    },
    onLoad(options) {
        if (!options.tripId)
            return;
        const trip = (0, trip_store_1.getTrip)(options.tripId);
        this.setData({
            tripId: options.tripId,
            trip,
            day: trip ? trip.startDate : (0, date_1.today)(),
            place: trip ? trip.destination : ""
        });
    },
    onTitleInput(event) {
        this.setData({ title: event.detail.value });
    },
    onDayChange(event) {
        this.setData({ day: event.detail.value });
    },
    onTimeChange(event) {
        this.setData({ time: event.detail.value });
    },
    onPlaceInput(event) {
        this.setData({ place: event.detail.value });
    },
    onNoteInput(event) {
        this.setData({ note: event.detail.value });
    },
    onCategoryChange(event) {
        const index = Number(event.detail.value);
        this.setData({ category: this.data.categories[index] });
    },
    chooseImages() {
        wx.chooseMedia({
            count: 3,
            mediaType: ["image"],
            sourceType: ["album", "camera"],
            success: (res) => {
                this.setData({
                    images: [...this.data.images, ...res.tempFiles.map((item) => item.tempFilePath)].slice(0, 3)
                });
            }
        });
    },
    saveSchedule() {
        const title = this.data.title.trim();
        if (!title) {
            wx.showToast({ title: "先写日程标题", icon: "none" });
            return;
        }
        (0, trip_store_1.addSchedule)(this.data.tripId, {
            day: this.data.day,
            time: this.data.time,
            category: this.data.category,
            title,
            place: this.data.place || this.data.trip?.destination || "",
            note: this.data.note,
            images: this.data.images
        });
        wx.navigateBack();
    }
});
