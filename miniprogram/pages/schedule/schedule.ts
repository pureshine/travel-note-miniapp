import { deleteSchedule, deleteTrip as removeTrip, getDefaultTrip, listTrips, setActiveTripId } from "../../services/trip-store";
import { ScheduleItem, Trip } from "../../types/trip";

type ScheduleStatus = "已完成" | "进行中" | "待进行";
type TripStatus = "待出发" | "已完成";
type ScheduleView = ScheduleItem & {
  year: string;
  monthDay: string;
  status: ScheduleStatus;
  statusClass: string;
  active: boolean;
};
type ScheduleYearGroup = {
  year: string;
  items: ScheduleView[];
};
type TravelTipView = {
  icon: string;
  title: string;
  subtitle: string;
  metaTop: string;
  metaBottom: string;
};
Page({
  data: {
    trip: undefined as Trip | undefined,
    trips: [] as Trip[],
    tripOptions: [] as string[],
    activeTripIndex: 0,
    tripStatus: "待出发" as TripStatus,
    tripStatusClass: "upcoming",
    scheduleTouchStartX: 0,
    openScheduleId: "",
    schedules: [] as ScheduleView[],
    scheduleGroups: [] as ScheduleYearGroup[],
    travelTip: {
      icon: "鸭",
      title: "准备冲鸭",
      subtitle: "先添加一个旅行计划",
      metaTop: "0 项",
      metaBottom: "待规划"
    } as TravelTipView
  },

  onShow() {
    this.loadTrip();
  },

  loadTrip() {
    const trips = listTrips();
    const trip = getDefaultTrip();
    const schedules = this.toScheduleViews(trip.schedules);
    const tripStatus = getTripStatus(trip);
    this.setData({
      trip,
      trips,
      tripOptions: trips.map((item) => formatTripOption(item)),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
      tripStatus,
      tripStatusClass: getTripStatusClass(tripStatus),
      schedules,
      scheduleGroups: this.groupSchedulesByYear(schedules),
      travelTip: createTravelTip(trip, schedules.length)
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

  manageTrip() {
    const trip = this.data.trip;
    if (!trip) return;
    wx.showActionSheet({
      itemList: ["新建计划", "编辑计划", "删除计划"],
      alertText: trip.name,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.goTripForm();
          return;
        }
        if (res.tapIndex === 1) {
          wx.navigateTo({ url: `/pages/trip-form/trip-form?id=${trip.id}` });
          return;
        }
        if (res.tapIndex === 2) this.confirmDeleteTrip(trip);
      }
    });
  },

  confirmDeleteTrip(trip: Trip) {
    const hasOnlyOneTrip = this.data.trips.length <= 1;
    wx.showModal({
      title: "删除计划",
      content: hasOnlyOneTrip ? `确定删除“${trip.name}”吗？删除后会自动创建一个新的空计划。` : `确定删除“${trip.name}”吗？里面的日程、备忘和消费都会一起删除。`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        removeTrip(trip.id);
        this.loadTrip();
        wx.showToast({ title: "已删除", icon: "success" });
      }
    });
  },

  goScheduleForm() {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}` });
  },

  onScheduleTouchStart(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    this.setData({
      scheduleTouchStartX: event.changedTouches[0].clientX,
      openScheduleId: this.data.openScheduleId === event.currentTarget.dataset.id ? this.data.openScheduleId : ""
    });
  },

  onScheduleTouchMove(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    const distance = this.data.scheduleTouchStartX - event.changedTouches[0].clientX;
    const scheduleId = event.currentTarget.dataset.id;
    if (distance > 40) {
      this.setData({ openScheduleId: scheduleId });
    } else if (distance < -20 && this.data.openScheduleId === scheduleId) {
      this.setData({ openScheduleId: "" });
    }
  },

  editSchedule(event: { currentTarget: { dataset: { id: string } } }) {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}&scheduleId=${event.currentTarget.dataset.id}` });
  },

  deleteScheduleItem(event: { currentTarget: { dataset: { id: string } } }) {
    if (!this.data.trip) return;
    const schedule = this.data.trip.schedules.find((item) => item.id === event.currentTarget.dataset.id);
    if (!schedule) return;
    wx.showModal({
      title: "删除日程",
      content: `确定删除“${schedule.title}”吗？`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm || !this.data.trip) return;
        deleteSchedule(this.data.trip.id, schedule.id);
        this.setData({ openScheduleId: "" });
        this.loadTrip();
      }
    });
  },

  toScheduleViews(items: ScheduleItem[]): ScheduleView[] {
    return items.map((item) => {
      const status = getScheduleStatus(item);
      return {
        ...item,
        ...formatScheduleDate(item.day),
        status,
        statusClass: getStatusClass(status),
        active: status === "进行中"
      };
    });
  },

  groupSchedulesByYear(items: ScheduleView[]): ScheduleYearGroup[] {
    const groups: ScheduleYearGroup[] = [];
    items.forEach((item) => {
      let group = groups.find((entry) => entry.year === item.year);
      if (!group) {
        group = { year: item.year, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
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

function getTripStatus(trip: Trip): TripStatus {
  const endTime = new Date(`${trip.endDate}T23:59:59`).getTime();
  if (Number.isNaN(endTime)) return "待出发";
  return Date.now() > endTime ? "已完成" : "待出发";
}

function getTripStatusClass(status: TripStatus): string {
  return status === "已完成" ? "done" : "upcoming";
}

function formatTripOption(trip: Trip): string {
  return `${trip.name} · ${getTripStatus(trip)}`;
}

function formatScheduleDate(day: string): { year: string; monthDay: string } {
  const parts = day.split("-");
  if (parts.length !== 3) return { year: "", monthDay: day };
  return {
    year: parts[0],
    monthDay: `${Number(parts[1])}.${Number(parts[2])}`
  };
}

function createTravelTip(trip: Trip, scheduleCount: number): TravelTipView {
  const destination = trip.destination || "待定目的地";
  const dateText = trip.startDate === trip.endDate ? trip.startDate : `${trip.startDate} - ${trip.endDate}`;
  return {
    icon: "鸭",
    title: `${destination}冲鸭计划`,
    subtitle: dateText,
    metaTop: `${scheduleCount} 项日程`,
    metaBottom: trip.destination ? "目的地已定" : "轻松规划"
  };
}
