"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        trip: undefined,
        categories: (0, trip_store_1.getNoteCategories)(),
        filters: ["全部", ...(0, trip_store_1.getNoteCategories)()],
        selectedFilter: "全部",
        filteredNotes: []
    },
    onLoad(options) {
        const trip = options.id ? (0, trip_store_1.getTrip)(options.id) : (0, trip_store_1.getDefaultTrip)();
        if (!trip)
            return;
        this.setData({
            tripId: trip.id,
            trip,
            filteredNotes: this.filterNotes(trip.notes, this.data.selectedFilter)
        });
    },
    onShow() {
        const trip = (0, trip_store_1.getDefaultTrip)();
        this.setData({
            tripId: trip.id,
            trip,
            filteredNotes: this.filterNotes(trip.notes, this.data.selectedFilter)
        });
    },
    loadTrip(tripId) {
        const trip = (0, trip_store_1.getTrip)(tripId);
        this.setData({
            trip,
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
        });
    },
    selectFilter(event) {
        const selectedFilter = event.currentTarget.dataset.value;
        this.setData({
            selectedFilter,
            filteredNotes: this.filterNotes(this.data.trip ? this.data.trip.notes : [], selectedFilter)
        });
    },
    goNoteForm() {
        wx.navigateTo({ url: `/pages/note-form/note-form?tripId=${this.data.tripId}` });
    },
    toggleItem(event) {
        const trip = (0, trip_store_1.toggleNoteItem)(this.data.tripId, event.currentTarget.dataset.id);
        this.setData({
            trip,
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
        });
    },
    filterNotes(notes, selectedFilter) {
        if (selectedFilter === "全部")
            return notes;
        return notes.filter((item) => item.category === selectedFilter);
    }
});
