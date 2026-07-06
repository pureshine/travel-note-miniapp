import { createTrip, getTrip, updateTripInfo } from "../../services/trip-store";
import { getSavedProfile, syncTripsWithCloud } from "../../services/cloud-sync";
import { today } from "../../utils/date";

Page({
  data: {
    tripId: "",
    isEditing: false,
    formTitle: "新建旅行计划",
    formSubtitle: "比如：厦门三日游，后续日程、备忘和消费都会归到这个计划里。",
    saveLabel: "保存旅行",
    name: "",
    destination: "",
    startDate: today(),
    endDate: today(),
    saving: false
  },

  onLoad(options: { id?: string }) {
    if (!options.id) return;
    const trip = getTrip(options.id);
    if (!trip) return;
    wx.setNavigationBarTitle({ title: "编辑旅行计划" });
    this.setData({
      tripId: trip.id,
      isEditing: true,
      formTitle: "编辑旅行计划",
      formSubtitle: `${trip.destination} · ${trip.startDate} - ${trip.endDate}`,
      saveLabel: "保存修改",
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate
    });
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
    if (this.data.saving) return;
    const destination = this.data.destination.trim();
    const name = this.data.name.trim() || `${destination || "新的"}旅行`;
    if (!destination) {
      wx.showToast({ title: "先写目的地", icon: "none" });
      return;
    }
    this.setData({ saving: true });
    const input = {
      name,
      destination,
      startDate: this.data.startDate,
      endDate: this.data.endDate
    };
    let saved = false;
    if (this.data.isEditing) {
      saved = Boolean(updateTripInfo(this.data.tripId, input));
    } else {
      createTrip(input);
      saved = true;
    }
    if (!saved) {
      this.setData({ saving: false });
      wx.showToast({ title: "保存失败", icon: "none" });
      return;
    }
    if (getSavedProfile()) {
      syncTripsWithCloud().catch((error) => console.error("旅行同步失败", error));
    }
    this.setData({ saving: false });
    wx.showToast({ title: "已保存", icon: "success" });
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/schedule/schedule" });
  }
});
