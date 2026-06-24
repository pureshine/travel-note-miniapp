"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const date_1 = require("../../utils/date");
Page({
    data: {
        tripId: "",
        scheduleId: "",
        isEditing: false,
        formTitle: "新增日程",
        saveLabel: "保存日程",
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
        const schedule = trip?.schedules.find((item) => item.id === options.scheduleId);
        this.setData({
            tripId: options.tripId,
            scheduleId: options.scheduleId || "",
            isEditing: Boolean(schedule),
            formTitle: schedule ? "编辑日程" : "新增日程",
            saveLabel: schedule ? "保存修改" : "保存日程",
            trip,
            title: schedule ? schedule.title : "",
            day: schedule ? schedule.day : trip ? trip.startDate : (0, date_1.today)(),
            time: schedule ? schedule.time : this.data.time,
            place: schedule ? schedule.place : trip ? trip.destination : "",
            note: schedule ? schedule.note : "",
            category: schedule ? schedule.category : this.data.category,
            images: schedule ? schedule.images : []
        });
        if (schedule)
            wx.setNavigationBarTitle({ title: "编辑日程" });
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
        const input = {
            day: this.data.day,
            time: this.data.time,
            category: this.data.category,
            title,
            place: this.data.place || this.data.trip?.destination || "",
            note: this.data.note,
            images: this.data.images
        };
        if (this.data.isEditing) {
            (0, trip_store_1.updateSchedule)(this.data.tripId, this.data.scheduleId, input);
        }
        else {
            (0, trip_store_1.addSchedule)(this.data.tripId, input);
        }
        wx.navigateBack();
    }
});
