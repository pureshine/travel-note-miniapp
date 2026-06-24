import { addNote, getNoteCategories, getTrip } from "../../services/trip-store";
import { NoteCategory, Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    title: "",
    content: "",
    category: "证件" as NoteCategory,
    categories: getNoteCategories()
  },

  onLoad(options: { tripId?: string }) {
    if (!options.tripId) return;
    this.setData({
      tripId: options.tripId,
      trip: getTrip(options.tripId)
    });
  },

  onTitleInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value });
  },

  onContentInput(event: { detail: { value: string } }) {
    this.setData({ content: event.detail.value });
  },

  onCategoryChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    this.setData({ category: this.data.categories[index] });
  },

  saveNote() {
    const title = this.data.title.trim();
    const content = this.data.content.trim();
    if (!title || !content) {
      wx.showToast({ title: "标题和内容都要写", icon: "none" });
      return;
    }
    addNote(this.data.tripId, title, content, this.data.category);
    wx.navigateBack();
  }
});
