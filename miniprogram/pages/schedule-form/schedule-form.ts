import { addSchedule, getScheduleCategories, getTrip } from "../../services/trip-store";
import { ScheduleCategory, Trip } from "../../types/trip";
import { today } from "../../utils/date";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    title: "",
    day: today(),
    time: "09:00",
    place: "",
    note: "",
    category: "景点" as ScheduleCategory,
    categories: getScheduleCategories(),
    images: [] as string[]
  },

  onLoad(options: { tripId?: string }) {
    if (!options.tripId) return;
    const trip = getTrip(options.tripId);
    this.setData({
      tripId: options.tripId,
      trip,
      day: trip ? trip.startDate : today(),
      place: trip ? trip.destination : ""
    });
  },

  onTitleInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value });
  },

  onDayChange(event: { detail: { value: string } }) {
    this.setData({ day: event.detail.value });
  },

  onTimeChange(event: { detail: { value: string } }) {
    this.setData({ time: event.detail.value });
  },

  onPlaceInput(event: { detail: { value: string } }) {
    this.setData({ place: event.detail.value });
  },

  onNoteInput(event: { detail: { value: string } }) {
    this.setData({ note: event.detail.value });
  },

  onCategoryChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    this.setData({ category: this.data.categories[index] });
  },

  chooseImages() {
    wx.chooseMedia({
      count: 3,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.setData({
          images: [...this.data.images, ...res.tempFiles.map((item) => item.tempFilePath)].slice(0, 3)
        });
      }
    });
  },

  saveSchedule() {
    const title = this.data.title.trim();
    if (!title) {
      wx.showToast({ title: "先写日程标题", icon: "none" });
      return;
    }
    addSchedule(this.data.tripId, {
      day: this.data.day,
      time: this.data.time,
      category: this.data.category,
      title,
      place: this.data.place || this.data.trip?.destination || "",
      note: this.data.note,
      images: this.data.images
    });
    wx.navigateBack();
  }
});
