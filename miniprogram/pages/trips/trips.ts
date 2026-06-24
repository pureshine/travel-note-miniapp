import { createTrip, listTrips } from "../../services/trip-store";
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

  addTrip() {
    const trip = createTrip();
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${trip.id}` });
  }
});
