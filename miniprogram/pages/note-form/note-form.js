"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        trip: undefined,
        title: "",
        content: "",
        category: "证件",
        categories: (0, trip_store_1.getNoteCategories)()
    },
    onLoad(options) {
        if (!options.tripId)
            return;
        this.setData({
            tripId: options.tripId,
            trip: (0, trip_store_1.getTrip)(options.tripId)
        });
    },
    onTitleInput(event) {
        this.setData({ title: event.detail.value });
    },
    onContentInput(event) {
        this.setData({ content: event.detail.value });
    },
    onCategoryChange(event) {
        const index = Number(event.detail.value);
        this.setData({ category: this.data.categories[index] });
    },
    saveNote() {
        const title = this.data.title.trim();
        const content = this.data.content.trim();
        if (!title || !content) {
            wx.showToast({ title: "标题和内容都要写", icon: "none" });
            return;
        }
        (0, trip_store_1.addNote)(this.data.tripId, title, content, this.data.category);
        wx.navigateBack();
    }
});
