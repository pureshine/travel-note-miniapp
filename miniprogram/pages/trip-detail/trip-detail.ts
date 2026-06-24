import { addSchedule, deleteSchedule, deleteTrip as removeTrip, getTrip } from "../../services/trip-store";
import { Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    scheduleTouchStartX: 0,
    openScheduleId: "",
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

  editTrip() {
    wx.navigateTo({ url: `/pages/trip-form/trip-form?id=${this.data.tripId}` });
  },

  deleteCurrentTrip() {
    if (!this.data.trip) return;
    wx.showModal({
      title: "删除旅行计划",
      content: `确定删除“${this.data.trip.name}”吗？相关日程、备忘和消费也会删除。`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        removeTrip(this.data.tripId);
        wx.redirectTo({ url: "/pages/trips/trips" });
      }
    });
  },

  onScheduleTouchStart(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    this.setData({
      scheduleTouchStartX: event.changedTouches[0].clientX,
      openScheduleId: this.data.openScheduleId === event.currentTarget.dataset.id ? this.data.openScheduleId : ""
    });
  },

  onScheduleTouchMove(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    const distance = this.data.scheduleTouchStartX - event.changedTouches[0].clientX;
    const scheduleId = event.currentTarget.dataset.id;
    if (distance > 40) {
      this.setData({ openScheduleId: scheduleId });
    } else if (distance < -20 && this.data.openScheduleId === scheduleId) {
      this.setData({ openScheduleId: "" });
    }
  },

  editSchedule(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `/pages/schedule-form/schedule-form?tripId=${this.data.tripId}&scheduleId=${event.currentTarget.dataset.id}` });
  },

  deleteScheduleItem(event: { currentTarget: { dataset: { id: string } } }) {
    const schedule = this.data.trip?.schedules.find((item) => item.id === event.currentTarget.dataset.id);
    if (!schedule) return;
    wx.showModal({
      title: "删除日程",
      content: `确定删除“${schedule.title}”吗？`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        const trip = deleteSchedule(this.data.tripId, schedule.id);
        this.setData({ trip, openScheduleId: "" });
      }
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
