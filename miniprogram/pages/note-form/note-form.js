"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        noteId: "",
        isEditing: false,
        formTitle: "新增备忘",
        saveLabel: "保存备忘",
        trip: undefined,
        title: "",
        content: "",
        category: "证件",
        categories: (0, trip_store_1.getNoteCategories)(),
        saving: false
    },
    onLoad(options) {
        if (!options.tripId)
            return;
        const trip = (0, trip_store_1.getTrip)(options.tripId);
        if (!trip) {
            wx.showToast({ title: "旅行不存在", icon: "none" });
            wx.navigateBack();
            return;
        }
        const note = trip?.notes.find((item) => item.id === options.noteId);
        this.setData({
            tripId: options.tripId,
            noteId: options.noteId || "",
            isEditing: Boolean(note),
            formTitle: note ? "编辑备忘" : "新增备忘",
            saveLabel: note ? "保存修改" : "保存备忘",
            trip,
            title: note ? note.title : "",
            content: note ? note.content : "",
            category: note ? note.category : this.data.category
        });
        if (note)
            wx.setNavigationBarTitle({ title: "编辑备忘" });
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
        if (this.data.saving)
            return;
        const title = this.data.title.trim();
        const content = this.data.content.trim();
        if (!title) {
            wx.showToast({ title: "标题要写", icon: "none" });
            return;
        }
        this.setData({ saving: true });
        if (this.data.isEditing) {
            (0, trip_store_1.updateNote)(this.data.tripId, this.data.noteId, { title, content, category: this.data.category });
        }
        else {
            (0, trip_store_1.addNote)(this.data.tripId, title, content, this.data.category);
        }
        wx.navigateBack();
    }
});
