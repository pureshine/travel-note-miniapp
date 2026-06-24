import { createTrip, getDefaultTrip, getExpenseByCategory, getSummary, listTrips } from "../../services/trip-store";
import { Trip, TripSummary } from "../../types/trip";

Page({
  data: {
    trips: [] as Trip[],
    summary: {
      tripCount: 0,
      expenseTotal: 0,
      checklistDone: 0,
      checklistTotal: 0
    } as TripSummary,
    nextTrip: undefined as Trip | undefined,
    scheduleCount: 0,
    memoDone: 0,
    memoTotal: 0,
    topCategory: "暂无"
  },

  onShow() {
    const trips = listTrips();
    const trip = trips[0] || getDefaultTrip();
    const notes = trips.flatMap((item) => item.notes);
    const categories = getExpenseByCategory().filter((item) => item.amount > 0);
    const topCategory = categories.sort((a, b) => b.amount - a.amount)[0];
    this.setData({
      trips,
      nextTrip: trip,
      summary: getSummary(),
      scheduleCount: trip.schedules.length,
      memoDone: notes.filter((item) => item.done).length,
      memoTotal: notes.length,
      topCategory: topCategory ? topCategory.category : "暂无"
    });
  },

  openTrip(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${event.currentTarget.dataset.id}` });
  },

  addTrip() {
    const trip = createTrip();
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${trip.id}` });
  },

  goTrips() {
    wx.switchTab({ url: "/pages/trips/trips" });
  },

  goSchedule() {
    wx.switchTab({ url: "/pages/schedule/schedule" });
  },

  goNotes() {
    wx.switchTab({ url: "/pages/notes/notes" });
  },

  goStats() {
    wx.switchTab({ url: "/pages/stats/stats" });
  }
});
