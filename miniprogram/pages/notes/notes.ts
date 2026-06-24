import { getDefaultTrip, getNoteCategories, getTrip, toggleNoteItem } from "../../services/trip-store";
import { NoteItem, Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    categories: getNoteCategories(),
    filters: ["全部", ...getNoteCategories()],
    selectedFilter: "全部",
    filteredNotes: [] as NoteItem[]
  },

  onLoad(options: { id?: string }) {
    const trip = options.id ? getTrip(options.id) : getDefaultTrip();
    if (!trip) return;
    this.setData({
      tripId: trip.id,
      trip,
      filteredNotes: this.filterNotes(trip.notes, this.data.selectedFilter)
    });
  },

  onShow() {
    const trip = getDefaultTrip();
    this.setData({
      tripId: trip.id,
      trip,
      filteredNotes: this.filterNotes(trip.notes, this.data.selectedFilter)
    });
  },

  loadTrip(tripId: string) {
    const trip = getTrip(tripId);
    this.setData({
      trip,
      filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
    });
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

  toggleItem(event: { currentTarget: { dataset: { id: string } } }) {
    const trip = toggleNoteItem(this.data.tripId, event.currentTarget.dataset.id);
    this.setData({
      trip,
      filteredNotes: this.filterNotes(trip ? trip.notes : [], this.data.selectedFilter)
    });
  },

  filterNotes(notes: NoteItem[], selectedFilter: string): NoteItem[] {
    if (selectedFilter === "全部") return notes;
    return notes.filter((item) => item.category === selectedFilter);
  }
});
