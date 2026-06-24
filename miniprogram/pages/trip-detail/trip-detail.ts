import { addSchedule, getTrip } from "../../services/trip-store";
import { Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    scheduleTitle: "",
    scheduleTime: "09:00",
    schedulePlace: ""
  },

  onLoad(options: { id?: string }) {
    if (!options.id) return;
    this.setData({ tripId: options.id });
    this.loadTrip(options.id);
  },

  onShow() {
    if (this.data.tripId) this.loadTrip(this.data.tripId);
  },

  loadTrip(tripId: string) {
    const trip = getTrip(tripId);
    if (!trip) {
      wx.showToast({ title: "旅行不存在", icon: "none" });
      return;
    }
    wx.setNavigationBarTitle({ title: trip.name });
    this.setData({ trip });
  },

  onScheduleTitleInput(event: { detail: { value: string } }) {
    this.setData({ scheduleTitle: event.detail.value });
  },

  onScheduleTimeInput(event: { detail: { value: string } }) {
    this.setData({ scheduleTime: event.detail.value });
  },

  onSchedulePlaceInput(event: { detail: { value: string } }) {
    this.setData({ schedulePlace: event.detail.value });
  },

  addScheduleItem() {
    const title = this.data.scheduleTitle.trim();
    if (!title || !this.data.trip) {
      wx.showToast({ title: "先写一个日程", icon: "none" });
      return;
    }
    const trip = addSchedule(this.data.trip.id, {
      day: this.data.trip.startDate,
      time: this.data.scheduleTime || "09:00",
      category: "其他",
      title,
      place: this.data.schedulePlace || this.data.trip.destination,
      note: "",
      images: []
    });
    this.setData({
      trip,
      scheduleTitle: "",
      schedulePlace: ""
    });
  },

  goChecklist() {
    wx.navigateTo({ url: `/pages/checklist/checklist?id=${this.data.tripId}` });
  },

  goExpenses() {
    wx.navigateTo({ url: `/pages/expenses/expenses?id=${this.data.tripId}` });
  },

  goNotes() {
    wx.navigateTo({ url: `/pages/notes/notes?id=${this.data.tripId}` });
  }
});
