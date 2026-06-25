import { addSchedule, getScheduleCategories, getTrip, updateSchedule } from "../../services/trip-store";
import { ScheduleCategory, Trip } from "../../types/trip";
import { today } from "../../utils/date";
import { createId } from "../../utils/id";

function getFileExt(filePath: string): string {
  const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : "jpg";
}

function isCloudFile(filePath: string): boolean {
  return filePath.startsWith("cloud://");
}

function uploadImageToCloud(filePath: string, tripId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isCloudFile(filePath)) {
      resolve(filePath);
      return;
    }
    if (!wx.cloud) {
      reject(new Error("云开发未初始化"));
      return;
    }

    wx.cloud.uploadFile({
      cloudPath: `trip-images/${tripId}/${Date.now()}-${createId("img")}.${getFileExt(filePath)}`,
      filePath,
      success: (res) => {
        if (!res.fileID) {
          reject(new Error("图片上传未返回 fileID"));
          return;
        }
        resolve(res.fileID);
      },
      fail: (error) => reject(new Error(error.errMsg || "图片上传失败"))
    });
  });
}

async function uploadImagesToCloud(filePaths: string[], tripId: string): Promise<string[]> {
  const uploaded: string[] = [];
  for (const filePath of filePaths) {
    uploaded.push(await uploadImageToCloud(filePath, tripId));
  }
  return uploaded;
}

Page({
  data: {
    tripId: "",
    scheduleId: "",
    isEditing: false,
    formTitle: "新增日程",
    saveLabel: "保存日程",
    trip: undefined as Trip | undefined,
    title: "",
    day: today(),
    time: "09:00",
    place: "",
    note: "",
    category: "景点" as ScheduleCategory,
    categories: getScheduleCategories(),
    images: [] as string[],
    uploadingImages: false,
    saving: false
  },

  onLoad(options: { tripId?: string; scheduleId?: string }) {
    if (!options.tripId) return;
    const trip = getTrip(options.tripId);
    if (!trip) {
      wx.showToast({ title: "旅行不存在", icon: "none" });
      wx.navigateBack();
      return;
    }
    const schedule = trip?.schedules.find((item) => item.id === options.scheduleId);
    this.setData({
      tripId: options.tripId,
      scheduleId: options.scheduleId || "",
      isEditing: Boolean(schedule),
      formTitle: schedule ? "编辑日程" : "新增日程",
      saveLabel: schedule ? "保存修改" : "保存日程",
      trip,
      title: schedule ? schedule.title : "",
      day: schedule ? schedule.day : trip ? trip.startDate : today(),
      time: schedule ? schedule.time : this.data.time,
      place: schedule ? schedule.place : trip ? trip.destination : "",
      note: schedule ? schedule.note : "",
      category: schedule ? schedule.category : this.data.category,
      images: schedule ? schedule.images : []
    });
    if (schedule) wx.setNavigationBarTitle({ title: "编辑日程" });
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
    if (this.data.uploadingImages) return;
    wx.chooseMedia({
      count: Math.max(3 - this.data.images.length, 1),
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        const selected = res.tempFiles.map((item) => item.tempFilePath).slice(0, Math.max(3 - this.data.images.length, 0));
        if (selected.length === 0) return;
        if (!wx.cloud) {
          wx.showToast({ title: "请先开启云开发", icon: "none" });
          return;
        }
        this.setData({ uploadingImages: true });
        wx.showToast({ title: "图片上传中", icon: "loading" });
        try {
          const uploaded = await uploadImagesToCloud(selected, this.data.tripId);
          this.setData({
            images: [...this.data.images, ...uploaded].slice(0, 3)
          });
          wx.showToast({ title: "上传成功", icon: "success" });
        } catch (error) {
          wx.showToast({ title: "图片上传失败", icon: "none" });
        } finally {
          this.setData({ uploadingImages: false });
        }
      }
    });
  },

  saveSchedule() {
    if (this.data.saving) return;
    const title = this.data.title.trim();
    if (!title) {
      wx.showToast({ title: "先写日程标题", icon: "none" });
      return;
    }
    if (this.data.uploadingImages) {
      wx.showToast({ title: "图片还在上传", icon: "none" });
      return;
    }
    this.setData({ saving: true });
    const input = {
      day: this.data.day,
      time: this.data.time,
      category: this.data.category,
      title,
      place: this.data.place || this.data.trip?.destination || "",
      note: this.data.note,
      images: this.data.images
    };
    if (this.data.isEditing) {
      updateSchedule(this.data.tripId, this.data.scheduleId, input);
    } else {
      addSchedule(this.data.tripId, input);
    }
    wx.navigateBack();
  }
});
