import { addChecklistItem, getTrip, toggleChecklistItem } from "../../services/trip-store";
import { Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    title: ""
  },

  onLoad(options: { id?: string }) {
    if (!options.id) return;
    this.setData({ tripId: options.id });
    this.loadTrip(options.id);
  },

  loadTrip(tripId: string) {
    this.setData({ trip: getTrip(tripId) });
  },

  onInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value });
  },

  addItem() {
    const title = this.data.title.trim();
    if (!title) {
      wx.showToast({ title: "写一个清单项", icon: "none" });
      return;
    }
    const trip = addChecklistItem(this.data.tripId, title);
    this.setData({ trip, title: "" });
  },

  toggleItem(event: { currentTarget: { dataset: { id: string } } }) {
    const trip = toggleChecklistItem(this.data.tripId, event.currentTarget.dataset.id);
    this.setData({ trip });
  }
});
