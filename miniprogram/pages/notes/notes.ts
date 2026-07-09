import {
  deleteNote,
  getActiveTrip,
  getNoteCategories,
  getTrip,
  listTrips,
  setActiveTripId,
  toggleNoteItem,
} from "../../services/trip-store";
import { NoteItem, Trip } from "../../types/trip";
import { pageShellBehavior } from "../../behaviors/page-shell";
import { activeTripBehavior } from "../../behaviors/active-trip";
import { tabCloudSyncBehavior } from "../../behaviors/tab-cloud-sync";

function getNoteProgress(trip?: Trip) {
  const noteCount = trip ? trip.notes.length : 0;
  const noteDoneCount = trip
    ? trip.notes.filter((item) => item.done).length
    : 0;
  const progress =
    noteCount > 0 ? Math.round((noteDoneCount / noteCount) * 100) : 0;

  return {
    noteCount,
    noteDoneCount,
    noteProgressStyle: `width: ${progress}%;`,
  };
}

Page({
  behaviors: [pageShellBehavior, activeTripBehavior, tabCloudSyncBehavior],
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    trips: [] as Trip[],
    categories: getNoteCategories(),
    filters: ["全部", ...getNoteCategories()],
    selectedFilter: "全部",
    noteTouchStartX: 0,
    openNoteId: "",
    noteCount: 0,
    noteDoneCount: 0,
    noteProgressStyle: "width: 0%;",
    filteredNotes: [] as NoteItem[],
  },

  onLoad(options: { id?: string }) {
    if (options.id) setActiveTripId(options.id);
    this.loadSelectedTrip();
  },

  loadSelectedTrip() {
    const trip = getActiveTrip();
    const trips = listTrips();
    this.setData({
      tripId: trip ? trip.id : "",
      trip,
      trips,
      ...getNoteProgress(trip),
      filteredNotes: this.filterNotes(
        trip ? trip.notes : [],
        this.data.selectedFilter,
      ),
    });
  },

  loadTrip(tripId?: string) {
    const activeTrip = tripId ? getTrip(tripId) : getActiveTrip();
    const trips = listTrips();
    this.setData({
      tripId: activeTrip ? activeTrip.id : "",
      trip: activeTrip,
      trips,
      ...getNoteProgress(activeTrip),
      filteredNotes: this.filterNotes(
        activeTrip ? activeTrip.notes : [],
        this.data.selectedFilter,
      ),
    });
  },

  selectFilter(event: { currentTarget: { dataset: { value: string } } }) {
    const selectedFilter = event.currentTarget.dataset.value;
    this.setData({
      selectedFilter,
      filteredNotes: this.filterNotes(
        this.data.trip ? this.data.trip.notes : [],
        selectedFilter,
      ),
    });
  },

  goNoteForm() {
    const trip = getActiveTrip();
    if (!trip) {
      wx.showToast({ title: "请先新建旅行计划", icon: "none" });
      return;
    }
    setActiveTripId(trip.id);
    this.setData({ tripId: trip.id, trip });
    wx.navigateTo({ url: `/pages/note-form/note-form?tripId=${trip.id}` });
  },

  editNoteItem(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({
      url: `/pages/note-form/note-form?tripId=${this.data.tripId}&noteId=${event.currentTarget.dataset.id}`,
    });
  },

  onNoteTouchStart(event: {
    changedTouches: Array<{ clientX: number }>;
    currentTarget: { dataset: { id: string } };
  }) {
    this.setData({
      noteTouchStartX: event.changedTouches[0].clientX,
      openNoteId:
        this.data.openNoteId === event.currentTarget.dataset.id
          ? this.data.openNoteId
          : "",
    });
  },

  onNoteTouchMove(event: {
    changedTouches: Array<{ clientX: number }>;
    currentTarget: { dataset: { id: string } };
  }) {
    const distance =
      this.data.noteTouchStartX - event.changedTouches[0].clientX;
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
    const trip = toggleNoteItem(
      this.data.tripId,
      event.currentTarget.dataset.id,
    );
    this.setData({
      trip,
      ...getNoteProgress(trip),
      filteredNotes: this.filterNotes(
        trip ? trip.notes : [],
        this.data.selectedFilter,
      ),
    });
  },

  deleteNoteItem(event: { currentTarget: { dataset: { id: string } } }) {
    const note = this.data.trip?.notes.find(
      (item) => item.id === event.currentTarget.dataset.id,
    );
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
          ...getNoteProgress(trip),
          filteredNotes: this.filterNotes(
            trip ? trip.notes : [],
            this.data.selectedFilter,
          ),
        });
      },
    });
  },

  filterNotes(notes: NoteItem[], selectedFilter: string): NoteItem[] {
    const filtered =
      selectedFilter === "全部"
        ? notes
        : notes.filter((item) => item.category === selectedFilter);
    return [...filtered].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  },
});
