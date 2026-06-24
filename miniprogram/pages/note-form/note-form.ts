import { addNote, getNoteCategories, getTrip, updateNote } from "../../services/trip-store";
import { NoteCategory, Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    noteId: "",
    isEditing: false,
    formTitle: "新增备忘",
    saveLabel: "保存备忘",
    trip: undefined as Trip | undefined,
    title: "",
    content: "",
    category: "证件" as NoteCategory,
    categories: getNoteCategories()
  },

  onLoad(options: { tripId?: string; noteId?: string }) {
    if (!options.tripId) return;
    const trip = getTrip(options.tripId);
    const note = trip?.notes.find((item) => item.id === options.noteId);
    this.setData({
      tripId: options.tripId,
      noteId: options.noteId || "",
      isEditing: Boolean(note),
      formTitle: note ? "编辑备忘" : "新增备忘",
      saveLabel: note ? "保存修改" : "保存备忘",
      trip,
      title: note ? note.title : "",
      content: note ? note.content : "",
      category: note ? note.category : this.data.category
    });
    if (note) wx.setNavigationBarTitle({ title: "编辑备忘" });
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
    if (!title) {
      wx.showToast({ title: "标题要写", icon: "none" });
      return;
    }
    if (this.data.isEditing) {
      updateNote(this.data.tripId, this.data.noteId, { title, content, category: this.data.category });
    } else {
      addNote(this.data.tripId, title, content, this.data.category);
    }
    wx.navigateBack();
  }
});
