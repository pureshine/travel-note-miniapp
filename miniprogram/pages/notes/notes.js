"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const page_shell_1 = require("../../behaviors/page-shell");
const active_trip_1 = require("../../behaviors/active-trip");
function getNoteProgress(trip) {
    const noteCount = trip ? trip.notes.length : 0;
    const noteDoneCount = trip
        ? trip.notes.filter((item) => item.done).length
        : 0;
    const progress = noteCount > 0 ? Math.round((noteDoneCount / noteCount) * 100) : 0;
    return {
        noteCount,
        noteDoneCount,
        noteProgressStyle: `width: ${progress}%;`,
    };
}
Page({
    behaviors: [page_shell_1.pageShellBehavior, active_trip_1.activeTripBehavior],
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
        noteCount: 0,
        noteDoneCount: 0,
        noteProgressStyle: "width: 0%;",
        filteredNotes: [],
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
        const trip = (0, trip_store_1.getActiveTrip)();
        const trips = (0, trip_store_1.listTrips)();
        this.setData({
            tripId: trip ? trip.id : "",
            trip,
            trips,
            tripNames: trips.map((item) => item.name),
            activeTripIndex: trip
                ? Math.max(trips.findIndex((item) => item.id === trip.id), 0)
                : 0,
            ...getNoteProgress(trip),
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter),
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
            ...getNoteProgress(trip),
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter),
        });
    },
    selectFilter(event) {
        const selectedFilter = event.currentTarget.dataset.value;
        this.setData({
            selectedFilter,
            filteredNotes: this.filterNotes(this.data.trip ? this.data.trip.notes : [], selectedFilter),
        });
    },
    goNoteForm() {
        const trip = (0, trip_store_1.getActiveTrip)();
        if (!trip) {
            wx.showToast({ title: "请先新建旅行计划", icon: "none" });
            return;
        }
        (0, trip_store_1.setActiveTripId)(trip.id);
        this.setData({ tripId: trip.id, trip });
        wx.navigateTo({ url: `/pages/note-form/note-form?tripId=${trip.id}` });
    },
    editNoteItem(event) {
        wx.navigateTo({
            url: `/pages/note-form/note-form?tripId=${this.data.tripId}&noteId=${event.currentTarget.dataset.id}`,
        });
    },
    onNoteTouchStart(event) {
        this.setData({
            noteTouchStartX: event.changedTouches[0].clientX,
            openNoteId: this.data.openNoteId === event.currentTarget.dataset.id
                ? this.data.openNoteId
                : "",
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
            ...getNoteProgress(trip),
            filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter),
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
                    ...getNoteProgress(trip),
                    filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter),
                });
            },
        });
    },
    filterNotes(notes, selectedFilter) {
        const filtered = selectedFilter === "全部"
            ? notes
            : notes.filter((item) => item.category === selectedFilter);
        return [...filtered].sort((a, b) => {
            if (a.done !== b.done)
                return a.done ? 1 : -1;
            return b.createdAt - a.createdAt;
        });
    },
});
