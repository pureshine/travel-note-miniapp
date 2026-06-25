import {
  deleteNote,
  getDefaultTrip,
  getNoteCategories,
  getTrip,
  listTrips,
  setActiveTripId,
  toggleNoteItem
} from "../../services/trip-store";
import { NoteItem, Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    trips: [] as Trip[],
    tripNames: [] as string[],
    activeTripIndex: 0,
    categories: getNoteCategories(),
    filters: ["全部", ...getNoteCategories()],
    selectedFilter: "全部",
    noteTouchStartX: 0,
    openNoteId: "",
    filteredNotes: [] as NoteItem[]
  },

  onLoad(options: { id?: string }) {
    if (options.id) setActiveTripId(options.id);
    this.loadSelectedTrip();
  },

  onShow() {
    this.loadSelectedTrip();
  },

  loadSelectedTrip() {
    const trip = getDefaultTrip();
    const trips = listTrips();
    this.setData({
      tripId: trip.id,
      trip,
      trips,
      tripNames: trips.map((item) => item.name),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
      filteredNotes: this.filterNotes(trip.notes, this.data.selectedFilter)
    });
  },

  loadTrip(tripId: string) {
    const trip = getTrip(tripId);
    const trips = listTrips();
    this.setData({
      tripId,
      trip,
      trips,
      tripNames: trips.map((item) => item.name),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === tripId), 0),
      filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
    });
  },

  onTripChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    const trip = this.data.trips[index];
    if (!trip) return;
    setActiveTripId(trip.id);
    this.loadTrip(trip.id);
  },

  selectFilter(event: { currentTarget: { dataset: { value: string } } }) {
    const selectedFilter = event.currentTarget.dataset.value;
    this.setData({
      selectedFilter,
      filteredNotes: this.filterNotes(this.data.trip ? this.data.trip.notes : [], selectedFilter)
    });
  },

  goNoteForm() {
    wx.navigateTo({ url: `/pages/note-form/note-form?tripId=${this.data.tripId}` });
  },

  editNoteItem(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `/pages/note-form/note-form?tripId=${this.data.tripId}&noteId=${event.currentTarget.dataset.id}` });
  },

  onNoteTouchStart(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    this.setData({
      noteTouchStartX: event.changedTouches[0].clientX,
      openNoteId: this.data.openNoteId === event.currentTarget.dataset.id ? this.data.openNoteId : ""
    });
  },

  onNoteTouchMove(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    const distance = this.data.noteTouchStartX - event.changedTouches[0].clientX;
    const noteId = event.currentTarget.dataset.id;
    if (distance > 40) {
      this.setData({ openNoteId: noteId });
    } else if (distance < -20 && this.data.openNoteId === noteId) {
      this.setData({ openNoteId: "" });
    }
  },

  toggleItem(event: { currentTarget: { dataset: { id: string } } }) {
    if (this.data.openNoteId === event.currentTarget.dataset.id) {
      this.setData({ openNoteId: "" });
      return;
    }
    const trip = toggleNoteItem(this.data.tripId, event.currentTarget.dataset.id);
    this.setData({
      trip,
      filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
    });
  },

  deleteNoteItem(event: { currentTarget: { dataset: { id: string } } }) {
    const note = this.data.trip?.notes.find((item) => item.id === event.currentTarget.dataset.id);
    if (!note) return;
    wx.showModal({
      title: "删除备忘",
      content: `确定删除“${note.title}”吗？`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        const trip = deleteNote(this.data.tripId, note.id);
        this.setData({
          trip,
          openNoteId: "",
          filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
        });
      }
    });
  },

  filterNotes(notes: NoteItem[], selectedFilter: string): NoteItem[] {
    const filtered = selectedFilter === "全部" ? notes : notes.filter((item) => item.category === selectedFilter);
    return [...filtered].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }
});
