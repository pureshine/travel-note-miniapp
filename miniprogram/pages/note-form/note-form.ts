import { addNote, getNoteCategories, getTrip, updateNote } from "../../services/trip-store";
import { NoteCategory, Trip } from "../../types/trip";

function getCategoryIndex(category: NoteCategory, categories: NoteCategory[]) {
  const index = categories.indexOf(category);
  return index >= 0 ? index : categories.length - 1;
}

Page({
  data: {
    tripId: "",
    noteId: "",
    isEditing: false,
    formTitle: "记录一个提醒",
    saveLabel: "保存备忘",
    trip: undefined as Trip | undefined,
    title: "",
    content: "",
    category: "物品" as NoteCategory,
    categoryIndex: 0,
    categories: getNoteCategories(),
    saving: false
  },

  onLoad(options: { tripId?: string; noteId?: string }) {
    if (!options.tripId) return;
    const trip = getTrip(options.tripId);
    if (!trip) {
      wx.showToast({ title: "旅行不存在", icon: "none" });
      wx.navigateBack();
      return;
    }
    const note = trip?.notes.find((item) => item.id === options.noteId);
    const categories = getNoteCategories();
    const category = note ? note.category : "物品";
    this.setData({
      tripId: options.tripId,
      noteId: options.noteId || "",
      isEditing: Boolean(note),
      formTitle: note ? "调整备忘内容" : "记录一个提醒",
      saveLabel: note ? "保存修改" : "保存备忘",
      trip,
      title: note ? note.title : "",
      content: note ? note.content : "",
      categories,
      category,
      categoryIndex: getCategoryIndex(category, categories)
    });
    if (note) wx.setNavigationBarTitle({ title: "编辑备忘" });
  },

  onTitleInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value });
  },

  onContentInput(event: { detail: { value: string } }) {
    this.setData({ content: event.detail.value });
  },

  onCategorySelect(event: { currentTarget: { dataset: { index: string } } }) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index],
    });
  },

  saveNote() {
    if (this.data.saving) return;
    const title = this.data.title.trim();
    const content = this.data.content.trim();
    if (!title) {
      wx.showToast({ title: "标题要写", icon: "none" });
      return;
    }
    this.setData({ saving: true });
    if (this.data.isEditing) {
      updateNote(this.data.tripId, this.data.noteId, { title, content, category: this.data.category });
    } else {
      addNote(this.data.tripId, title, content, this.data.category);
    }
    wx.navigateBack();
  }
});
