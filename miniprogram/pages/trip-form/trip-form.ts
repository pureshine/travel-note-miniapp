import { createTrip } from "../../services/trip-store";
import { today } from "../../utils/date";

Page({
  data: {
    name: "",
    destination: "",
    startDate: today(),
    endDate: today()
  },

  onNameInput(event: { detail: { value: string } }) {
    this.setData({ name: event.detail.value });
  },

  onDestinationInput(event: { detail: { value: string } }) {
    this.setData({ destination: event.detail.value });
  },

  onStartDateChange(event: { detail: { value: string } }) {
    this.setData({ startDate: event.detail.value });
  },

  onEndDateChange(event: { detail: { value: string } }) {
    this.setData({ endDate: event.detail.value });
  },

  saveTrip() {
    const destination = this.data.destination.trim();
    const name = this.data.name.trim() || `${destination || "新的"}旅行`;
    if (!destination) {
      wx.showToast({ title: "先写目的地", icon: "none" });
      return;
    }
    createTrip({
      name,
      destination,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    });
    wx.navigateBack();
  }
});
