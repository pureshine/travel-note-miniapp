import { getDefaultTrip, listTrips, setActiveTripId } from "../../services/trip-store";
import { ScheduleItem, Trip } from "../../types/trip";

type ScheduleStatus = "已完成" | "进行中" | "待进行";
type ScheduleView = ScheduleItem & { status: ScheduleStatus; statusClass: string; active: boolean };

Page({
  data: {
    trip: undefined as Trip | undefined,
    trips: [] as Trip[],
    tripNames: [] as string[],
    activeTripIndex: 0,
    schedules: [] as ScheduleView[]
  },

  onShow() {
    this.loadTrip();
  },

  loadTrip() {
    const trip = getDefaultTrip();
    const trips = listTrips();
    this.setData({
      trip,
      trips,
      tripNames: trips.map((item) => item.name),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
      schedules: this.toScheduleViews(trip.schedules)
    });
  },

  onTripChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    const trip = this.data.trips[index];
    if (!trip) return;
    setActiveTripId(trip.id);
    this.loadTrip();
  },

  goTripForm() {
    wx.navigateTo({ url: "/pages/trip-form/trip-form" });
  },

  goScheduleForm() {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}` });
  },

  toScheduleViews(items: ScheduleItem[]): ScheduleView[] {
    return items.map((item) => {
      const status = getScheduleStatus(item);
      return {
        ...item,
        status,
        statusClass: getStatusClass(status),
        active: status === "进行中"
      };
    });
  }
});

function getScheduleStatus(item: ScheduleItem): ScheduleStatus {
  const scheduleTime = new Date(`${item.day}T${item.time || "00:00"}:00`).getTime();
  const now = Date.now();
  if (Number.isNaN(scheduleTime)) return "待进行";
  if (now >= scheduleTime) return "已完成";
  if (scheduleTime - now <= 30 * 60 * 1000) return "进行中";
  return "待进行";
}

function getStatusClass(status: ScheduleStatus): string {
  if (status === "已完成") return "done";
  if (status === "进行中") return "active";
  return "pending";
}
