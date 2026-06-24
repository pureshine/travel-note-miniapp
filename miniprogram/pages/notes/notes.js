"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
Page({
    data: {
        tripId: "",
        trip: undefined,
        trips: [],
        tripNames: [],
        activeTripIndex: 0,
        categories: (0, trip_store_1.getNoteCategories)(),
        filters: ["全部", ...(0, trip_store_1.getNoteCategories)()],
        selectedFilter: "全部",
        noteTouchStartX: 0,
        openNoteId: "",
        filteredNotes: []
    },
    onLoad(options) {
        if (options.id)
            (0, trip_store_1.setActiveTripId)(options.id);
        this.loadSelectedTrip();
    },
    onShow() {
        this.loadSelectedTrip();
    },
    loadSelectedTrip() {
        const trip = (0, trip_store_1.getDefaultTrip)();
        const trips = (0, trip_store_1.listTrips)();
        this.setData({
            tripId: trip.id,
            trip,
            trips,
            tripNames: trips.map((item) => item.name),
            activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
            filteredNotes: this.filterNotes(trip.notes, this.data.selectedFilter)
        });
    },
    loadTrip(tripId) {
        const trip = (0, trip_store_1.getTrip)(tripId);
        const trips = (0, trip_store_1.listTrips)();
        this.setData({
            tripId,
            trip,
            trips,
            tripNames: trips.map((item) => item.name),
            activeTripIndex: Math.max(trips.findIndex((item) => item.id === tripId), 0),
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
        });
    },
    onTripChange(event) {
        const index = Number(event.detail.value);
        const trip = this.data.trips[index];
        if (!trip)
            return;
        (0, trip_store_1.setActiveTripId)(trip.id);
        this.loadTrip(trip.id);
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
    editNoteItem(event) {
        wx.navigateTo({ url: `/pages/note-form/note-form?tripId=${this.data.tripId}&noteId=${event.currentTarget.dataset.id}` });
    },
    onNoteTouchStart(event) {
        this.setData({
            noteTouchStartX: event.changedTouches[0].clientX,
            openNoteId: this.data.openNoteId === event.currentTarget.dataset.id ? this.data.openNoteId : ""
        });
    },
    onNoteTouchMove(event) {
        const distance = this.data.noteTouchStartX - event.changedTouches[0].clientX;
        const noteId = event.currentTarget.dataset.id;
        if (distance > 40) {
            this.setData({ openNoteId: noteId });
        }
        else if (distance < -20 && this.data.openNoteId === noteId) {
            this.setData({ openNoteId: "" });
        }
    },
    toggleItem(event) {
        if (this.data.openNoteId === event.currentTarget.dataset.id) {
            this.setData({ openNoteId: "" });
            return;
        }
        const trip = (0, trip_store_1.toggleNoteItem)(this.data.tripId, event.currentTarget.dataset.id);
        this.setData({
            trip,
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
        });
    },
    deleteNoteItem(event) {
        const note = this.data.trip?.notes.find((item) => item.id === event.currentTarget.dataset.id);
        if (!note)
            return;
        wx.showModal({
            title: "删除备忘",
            content: `确定删除“${note.title}”吗？`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm)
                    return;
                const trip = (0, trip_store_1.deleteNote)(this.data.tripId, note.id);
                this.setData({
                    trip,
                    openNoteId: "",
                    filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
                });
            }
        });
    },
    filterNotes(notes, selectedFilter) {
        if (selectedFilter === "全部")
            return notes;
        return notes.filter((item) => item.category === selectedFilter);
    }
});
