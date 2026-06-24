import { createTrip, deleteTrip as removeTrip, listTrips } from "../../services/trip-store";
import { Trip } from "../../types/trip";

Page({
  data: {
    trips: [] as Trip[]
  },

  onShow() {
    this.setData({ trips: listTrips() });
  },

  openTrip(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${event.currentTarget.dataset.id}` });
  },

  editTrip(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `/pages/trip-form/trip-form?id=${event.currentTarget.dataset.id}` });
  },

  deleteTrip(event: { currentTarget: { dataset: { id: string } } }) {
    const trip = this.data.trips.find((item) => item.id === event.currentTarget.dataset.id);
    if (!trip) return;
    wx.showModal({
      title: "删除旅行计划",
      content: `确定删除“${trip.name}”吗？相关日程、备忘和消费也会删除。`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        removeTrip(trip.id);
        this.setData({ trips: listTrips() });
      }
    });
  },

  addTrip() {
    const trip = createTrip();
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${trip.id}` });
  }
});
