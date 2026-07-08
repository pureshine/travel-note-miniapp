import {
  addSchedule,
  getScheduleCategories,
  getTrip,
  updateSchedule,
} from "../../services/trip-store";
import { ScheduleCategory, Trip } from "../../types/trip";
import { CLOUD_ENV_ID } from "../../config/cloud";
import { today } from "../../utils/date";
import { createId } from "../../utils/id";

function getCategoryIndex(category: ScheduleCategory, categories: ScheduleCategory[]) {
  const index = categories.indexOf(category);
  return index >= 0 ? index : 0;
}

let cloudReady = false;

function getFileExt(filePath: string): string {
  const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : "jpg";
}

function isCloudFile(filePath: string): boolean {
  return filePath.startsWith("cloud://");
}

function ensureCloudReady(): boolean {
  if (!wx.cloud) return false;
  if (!cloudReady) {
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      traceUser: true,
    });
    cloudReady = true;
  }
  return true;
}

function getSafeCloudPath(filePath: string, tripId: string): string {
  const safeTripId = tripId.replace(/[^a-zA-Z0-9_-]/g, "_") || "trip";
  const safeExt = getFileExt(filePath).replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  return `trip-images/${safeTripId}/${Date.now()}-${createId("img")}.${safeExt}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "errMsg" in error) {
    return String((error as { errMsg?: string }).errMsg || "图片上传失败");
  }
  return "图片上传失败";
}

function shouldFallbackToCloudFunction(error: unknown): boolean {
  const message = getErrorMessage(error);
  return /STORAGE_EXCEED_AUTHORITY|Have no access right|access right|authority/i.test(
    message,
  );
}

function readFileAsBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: "base64",
      success: (res) => resolve(String(res.data)),
      fail: (error) => reject(new Error(error.errMsg || "读取图片失败")),
    });
  });
}

function uploadImageByCloudFunction(
  filePath: string,
  tripId: string,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (!ensureCloudReady() || !wx.cloud) {
      reject(new Error("云开发未初始化"));
      return;
    }
    try {
      const fileContent = await readFileAsBase64(filePath);
      wx.cloud.callFunction({
        name: "uploadImage",
        data: {
          cloudPath: getSafeCloudPath(filePath, tripId),
          fileContent,
        },
        success: (res) => {
          const result = res.result as { fileID?: string; error?: string };
          if (!result?.fileID) {
            reject(new Error(result?.error || "云函数上传未返回 fileID"));
            return;
          }
          resolve(result.fileID);
        },
        fail: (error) => reject(new Error(error.errMsg || "云函数上传失败")),
      });
    } catch (error) {
      reject(error);
    }
  });
}

function uploadImageToCloud(filePath: string, tripId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isCloudFile(filePath)) {
      resolve(filePath);
      return;
    }
    if (!ensureCloudReady() || !wx.cloud) {
      reject(new Error("云开发未初始化"));
      return;
    }

    wx.cloud.uploadFile({
      cloudPath: getSafeCloudPath(filePath, tripId),
      filePath,
      success: (res) => {
        if (!res.fileID) {
          reject(new Error("图片上传未返回 fileID"));
          return;
        }
        resolve(res.fileID);
      },
      fail: (error) => {
        const uploadError = new Error(error.errMsg || "图片上传失败");
        if (!shouldFallbackToCloudFunction(uploadError)) {
          reject(uploadError);
          return;
        }
        uploadImageByCloudFunction(filePath, tripId)
          .then(resolve)
          .catch(reject);
      },
    });
  });
}

async function uploadImagesToCloud(
  filePaths: string[],
  tripId: string,
): Promise<string[]> {
  const uploaded: string[] = [];
  for (const filePath of filePaths) {
    uploaded.push(await uploadImageToCloud(filePath, tripId));
  }
  return uploaded;
}

function hasLocalImage(filePaths: string[]): boolean {
  return filePaths.some((filePath) => !isCloudFile(filePath));
}

Page({
  data: {
    tripId: "",
    scheduleId: "",
    isEditing: false,
    formTitle: "安排一段行程",
    saveLabel: "保存日程",
    trip: undefined as Trip | undefined,
    title: "",
    day: today(),
    time: "09:00",
    endTime: "10:00",
    place: "",
    note: "",
    category: "景点" as ScheduleCategory,
    categoryIndex: 0,
    categories: getScheduleCategories(),
    images: [] as string[],
    uploadingImages: false,
    saving: false,
  },

  onLoad(options: { tripId?: string; scheduleId?: string }) {
    if (!options.tripId) return;
    const trip = getTrip(options.tripId);
    if (!trip) {
      wx.showToast({ title: "旅行不存在", icon: "none" });
      wx.navigateBack();
      return;
    }
    const schedule = trip?.schedules.find(
      (item) => item.id === options.scheduleId,
    );
    const categories = getScheduleCategories();
    const category = schedule ? schedule.category : this.data.category;
    this.setData({
      tripId: options.tripId,
      scheduleId: options.scheduleId || "",
      isEditing: Boolean(schedule),
      formTitle: schedule ? "调整行程内容" : "安排一段行程",
      saveLabel: schedule ? "保存修改" : "保存日程",
      trip,
      title: schedule ? schedule.title : "",
      day: schedule ? schedule.day : trip ? trip.startDate : today(),
      time: schedule ? schedule.time : this.data.time,
      endTime: schedule ? schedule.endTime || schedule.time : this.data.endTime,
      place: schedule ? schedule.place : trip ? trip.destination : "",
      note: schedule ? schedule.note : "",
      categories,
      category,
      categoryIndex: getCategoryIndex(category, categories),
      images: schedule ? schedule.images : [],
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

  onEndTimeChange(event: { detail: { value: string } }) {
    this.setData({ endTime: event.detail.value });
  },

  onPlaceInput(event: { detail: { value: string } }) {
    this.setData({ place: event.detail.value });
  },

  onNoteInput(event: { detail: { value: string } }) {
    this.setData({ note: event.detail.value });
  },

  onCategoryChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index],
    });
  },

  chooseImages() {
    if (this.data.uploadingImages) return;
    wx.chooseImage({
      count: Math.max(3 - this.data.images.length, 1),
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        const selected = res.tempFilePaths.slice(
          0,
          Math.max(3 - this.data.images.length, 0),
        );
        if (selected.length === 0) return;
        if (!ensureCloudReady()) {
          wx.showToast({ title: "云开发不可用，无法上传", icon: "none" });
          return;
        }
        this.setData({ uploadingImages: true });
        wx.showToast({ title: "图片上传中", icon: "loading" });
        try {
          const uploaded = await uploadImagesToCloud(
            selected,
            this.data.tripId,
          );
          this.setData({
            images: [...this.data.images, ...uploaded].slice(0, 3),
          });
          wx.showToast({ title: "上传成功", icon: "success" });
        } catch (error) {
          const message = getErrorMessage(error);
          console.error("图片上传失败", { message, selected, error });
          wx.showToast({
            title: message.slice(0, 18),
            icon: "none",
            duration: 2600,
          });
        } finally {
          this.setData({ uploadingImages: false });
        }
      },
      fail: (error) => {
        if (error.errMsg && !error.errMsg.includes("cancel")) {
          console.error("选择图片失败", error);
          wx.showToast({ title: "选择图片失败", icon: "none" });
        }
      },
    });
  },

  async saveSchedule() {
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
    if (this.data.endTime && this.data.endTime < this.data.time) {
      wx.showToast({ title: "结束时间需晚于开始", icon: "none" });
      return;
    }
    this.setData({ saving: true });
    let images = this.data.images;
    if (hasLocalImage(images)) {
      if (!ensureCloudReady()) {
        this.setData({ saving: false });
        wx.showToast({ title: "图片需上传云端后才能保存", icon: "none" });
        return;
      }
      try {
        wx.showToast({ title: "同步图片中", icon: "loading" });
        images = await uploadImagesToCloud(images, this.data.tripId);
        this.setData({ images });
      } catch (error) {
        const message = getErrorMessage(error);
        console.error("保存前上传图片失败", { message, error });
        this.setData({ saving: false });
        wx.showToast({
          title: message.slice(0, 18),
          icon: "none",
          duration: 2600,
        });
        return;
      }
    }
    const input = {
      day: this.data.day,
      time: this.data.time,
      endTime: this.data.endTime,
      category: this.data.category,
      title,
      place: this.data.place || this.data.trip?.destination || "",
      note: this.data.note,
      images,
    };
    if (this.data.isEditing) {
      updateSchedule(this.data.tripId, this.data.scheduleId, input);
    } else {
      addSchedule(this.data.tripId, input);
    }
    wx.navigateBack();
  },
});
