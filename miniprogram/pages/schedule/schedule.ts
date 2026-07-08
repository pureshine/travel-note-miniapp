import {
  deleteSchedule,
  deleteTrip as removeTrip,
  getActiveTrip,
  listTrips,
  reconcileClearedPlanState,
  setActiveTripId,
} from "../../services/trip-store";
import { Trip } from "../../types/trip";
import {
  formatTripOption,
  getTripStatus,
  getTripStatusClass,
  TripStatus,
} from "../../utils/trip-view";
import {
  createCategoryFilterOptions,
  createDateFilterOptions,
  createScheduleViews,
  DateFilterOption,
  filterSchedules,
  groupSchedulesByYear,
  ScheduleCategoryFilter,
  ScheduleStatusFilter,
  ScheduleView,
  ScheduleYearGroup,
  sortScheduleViews,
} from "../../utils/schedule-view";
import { activeTripBehavior } from "../../behaviors/active-trip";
import { pageShellBehavior } from "../../behaviors/page-shell";
import { tabCloudSyncBehavior } from "../../behaviors/tab-cloud-sync";

type TripStatusView = TripStatus;
type TravelTipView = {
  icon: string;
  title: string;
  subtitle: string;
  metaTop: string;
  metaBottom: string;
};
type SelectorRect = {
  top: number;
};
Page({
  behaviors: [pageShellBehavior, activeTripBehavior, tabCloudSyncBehavior],
  data: {
    trip: null,
    trips: [] as Trip[],
    tripOptions: [] as string[],
    activeTripIndex: 0,
    showTripOptions: false,
    tripStatus: "待出发" as TripStatusView,
    tripStatusClass: "upcoming",
    scheduleTouchStartX: 0,
    openScheduleId: "",
    clipScheduleId: "",
    schedules: [] as ScheduleView[],
    filteredSchedules: [] as ScheduleView[],
    scheduleGroups: [] as ScheduleYearGroup[],
    dateFilterOptions: [{ label: "全部日期", value: "all" }] as DateFilterOption[],
    dateFilterLabels: ["全部日期"] as string[],
    dateFilterIndex: 0,
    statusFilters: ["全部", "待出发", "进行中", "已完成"] as ScheduleStatusFilter[],
    statusFilterIndex: 0,
    activeStatusFilter: "全部" as ScheduleStatusFilter,
    categoryFilterOptions: ["全部类型"] as ScheduleCategoryFilter[],
    categoryFilterIndex: 0,
    activeCategoryFilter: "全部类型" as ScheduleCategoryFilter,
    openFilterKey: "",
    filterDocked: false,
    filterDockTop: 0,
    filterDockStyle: "",
    travelTip: {
      icon: "鸭",
      title: "准备冲鸭",
      subtitle: "先添加一个旅行计划",
      metaTop: "0 项",
      metaBottom: "待规划",
    } as TravelTipView,
  },

  onReady() {
    this.measureFilterAnchor();
  },

  onPageScroll(event: { scrollTop: number }) {
    if (!this.data.trip || this.data.schedules.length === 0) return;
    const shouldDock = this.data.filterDockTop > 0 && event.scrollTop >= this.data.filterDockTop;
    if (shouldDock !== this.data.filterDocked) {
      this.setData({ filterDocked: shouldDock });
    }
  },

  loadTrip() {
    reconcileClearedPlanState();
    this.clearClipTimer();
    const trips = listTrips();
    const trip = getActiveTrip();
    if (!trip) {
      this.setData({
        ...this.getEmptyScheduleState(),
        trips,
      });
      return;
    }
    const schedules = sortScheduleViews(createScheduleViews(trip ? trip.schedules : []));
    const dateFilterOptions = createDateFilterOptions(schedules);
    const categoryFilterOptions = createCategoryFilterOptions(schedules);
    const nextDateFilterIndex = Math.max(
      dateFilterOptions.findIndex(
        (item) => item.value === this.data.dateFilterOptions[this.data.dateFilterIndex]?.value,
      ),
      0,
    );
    const nextCategoryFilterIndex = Math.max(
      categoryFilterOptions.findIndex(
        (item) => item === this.data.activeCategoryFilter,
      ),
      0,
    );
    const filteredSchedules = filterSchedules(
      schedules,
      dateFilterOptions[nextDateFilterIndex]?.value || "all",
      this.data.activeStatusFilter,
      categoryFilterOptions[nextCategoryFilterIndex] || "全部类型",
    );
    const tripStatus = trip ? getTripStatus(trip) : "待出发";
    this.setData({
      trip,
      trips,
      tripOptions: trips.map((item) => formatTripOption(item)),
      activeTripIndex: trip
        ? Math.max(
            trips.findIndex((item) => item.id === trip.id),
            0,
          )
        : 0,
      showTripOptions: false,
      tripStatus,
      tripStatusClass: getTripStatusClass(tripStatus),
      openScheduleId: "",
      clipScheduleId: "",
      schedules,
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
      dateFilterOptions,
      dateFilterLabels: dateFilterOptions.map((item) => item.label),
      dateFilterIndex: nextDateFilterIndex,
      categoryFilterOptions,
      categoryFilterIndex: nextCategoryFilterIndex,
      activeCategoryFilter: categoryFilterOptions[nextCategoryFilterIndex] || "全部类型",
      openFilterKey: "",
      travelTip: trip
        ? createTravelTip(trip, schedules.length)
        : createEmptyTravelTip(),
    }, () => {
      this.measureFilterAnchor();
    });
  },

  measureFilterAnchor() {
    setTimeout(() => {
      const wxApi = wx as WechatMiniprogram.Wx & {
        createSelectorQuery?: () => {
          select: (selector: string) => {
            boundingClientRect: (
              callback: (rect?: SelectorRect) => void,
            ) => { exec: () => void };
          };
        };
      };
      const query = wxApi.createSelectorQuery?.();
      if (!query) return;
      query
        .select(".sch-filter-anchor")
        .boundingClientRect((rect) => {
          if (!rect) return;
          const dockTop = getFilterDockTop();
          this.setData({
            filterDockTop: Math.max(rect.top - dockTop, 0),
            filterDockStyle: `top:${dockTop}px;`,
          });
        })
        .exec();
    }, 0);
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
      },
    });
  },

  confirmDeleteTrip(trip: Trip) {
    const hasOnlyOneTrip = this.data.trips.length <= 1;
    wx.showModal({
      title: "删除计划",
      content: hasOnlyOneTrip
        ? `确定删除“${trip.name}”吗？删除后会回到无计划状态。`
        : `确定删除“${trip.name}”吗？里面的日程、备忘和消费都会一起删除。`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        removeTrip(trip.id, { clearActive: true });
        this.loadTrip();
        wx.showToast({ title: "已删除", icon: "success" });
      },
    });
  },

  goScheduleForm() {
    const trip = this.data.trip || getActiveTrip();
    if (!trip) {
      wx.showToast({ title: "请先新建旅行计划", icon: "none" });
      return;
    }
    setActiveTripId(trip.id);
    wx.navigateTo({
      url: `/pages/schedule-form/schedule-form?tripId=${trip.id}`,
    });
  },

  previewScheduleImage(event: {
    currentTarget: { dataset: { id: string; index: string | number } };
  }) {
    const schedule = this.data.schedules.find(
      (item) => item.id === event.currentTarget.dataset.id,
    );
    if (!schedule || schedule.images.length === 0) return;
    const index = Number(event.currentTarget.dataset.index) || 0;
    wx.previewImage({
      urls: schedule.images,
      current:
        schedule.images[
          Math.min(Math.max(index, 0), schedule.images.length - 1)
        ],
    });
  },

  onScheduleTouchStart(event: {
    changedTouches: Array<{ clientX: number }>;
    currentTarget: { dataset: { id: string } };
  }) {
    const scheduleId = event.currentTarget.dataset.id;
    if (
      this.data.openScheduleId &&
      this.data.openScheduleId !== scheduleId
    ) {
      this.closeScheduleSwipe();
    }
    this.setData({
      scheduleTouchStartX: event.changedTouches[0].clientX,
    });
  },

  onScheduleTouchMove(event: {
    changedTouches: Array<{ clientX: number }>;
    currentTarget: { dataset: { id: string } };
  }) {
    const distance =
      this.data.scheduleTouchStartX - event.changedTouches[0].clientX;
    const scheduleId = event.currentTarget.dataset.id;
    if (distance > 40) {
      this.openScheduleSwipe(scheduleId);
    } else if (distance < -20 && this.data.openScheduleId === scheduleId) {
      this.closeScheduleSwipe();
    }
  },

  openScheduleSwipe(scheduleId: string) {
    this.clearClipTimer();
    this.setData({
      openScheduleId: scheduleId,
      clipScheduleId: scheduleId,
    });
  },

  closeScheduleSwipe() {
    this.clearClipTimer();
    const closingId = this.data.clipScheduleId || this.data.openScheduleId;
    this.setData({ openScheduleId: "" });
    if (!closingId) {
      this.setData({ clipScheduleId: "" });
      return;
    }
    this.setData({ clipScheduleId: closingId });
    this._clipTimer = setTimeout(() => {
      this.setData({ clipScheduleId: "" });
      this._clipTimer = null;
    }, 200);
  },

  clearClipTimer() {
    if (this._clipTimer) {
      clearTimeout(this._clipTimer);
      this._clipTimer = null;
    }
  },

  clearScheduleSwipe() {
    this.clearClipTimer();
    this.setData({
      openScheduleId: "",
      clipScheduleId: "",
    });
  },

  editSchedule(event: { currentTarget: { dataset: { id: string } } }) {
    if (!this.data.trip) return;
    this.clearScheduleSwipe();
    wx.navigateTo({
      url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}&scheduleId=${event.currentTarget.dataset.id}`,
    });
  },

  deleteScheduleItem(event: { currentTarget: { dataset: { id: string } } }) {
    if (!this.data.trip) return;
    const schedule = this.data.trip.schedules.find(
      (item) => item.id === event.currentTarget.dataset.id,
    );
    if (!schedule) return;
    wx.showModal({
      title: "删除日程",
      content: `确定删除“${schedule.title}”吗？`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm || !this.data.trip) return;
        deleteSchedule(this.data.trip.id, schedule.id);
        this.clearScheduleSwipe();
        this.loadTrip();
      },
    });
  },

  toggleTripOptions() {
    this.setData({ showTripOptions: !this.data.showTripOptions });
  },

  onTripOptionTap(event: { currentTarget: { dataset: { index: string } } }) {
    const index = Number(event.currentTarget.dataset.index);
    this.onTripChangeByIndex(index);
    this.setData({ showTripOptions: false });
  },

  onTripChange(event: { detail: { value: string } }) {
    this.onTripChangeByIndex(Number(event.detail.value));
  },

  onTripChangeByIndex(index: number) {
    const trip = this.data.trips[index];
    if (!trip) return;
    setActiveTripId(trip.id);
    this.loadTrip();
  },

  toggleFilterMenu(event: { currentTarget: { dataset: { key: string } } }) {
    const key = event.currentTarget.dataset.key || "";
    this.setData({
      openFilterKey: this.data.openFilterKey === key ? "" : key,
    });
  },

  onDateFilterSelect(event: { currentTarget: { dataset: { index: string } } }) {
    const dateFilterIndex = Number(event.currentTarget.dataset.index);
    this.applyDateFilter(dateFilterIndex);
  },

  onDateFilterChange(event: { detail: { value: string } }) {
    this.applyDateFilter(Number(event.detail.value));
  },

  applyDateFilter(dateFilterIndex: number) {
    const dateValue = this.data.dateFilterOptions[dateFilterIndex]?.value || "all";
    const filteredSchedules = filterSchedules(
      this.data.schedules,
      dateValue,
      this.data.activeStatusFilter,
      this.data.activeCategoryFilter,
    );
    this.closeScheduleSwipe();
    this.setData({
      dateFilterIndex,
      openFilterKey: "",
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
    });
  },

  clearDateFilter() {
    const filteredSchedules = filterSchedules(
      this.data.schedules,
      "all",
      this.data.activeStatusFilter,
      this.data.activeCategoryFilter,
    );
    this.closeScheduleSwipe();
    this.setData({
      dateFilterIndex: 0,
      openFilterKey: "",
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
    });
  },

  onCategoryFilterSelect(event: { currentTarget: { dataset: { index: string } } }) {
    const categoryFilterIndex = Number(event.currentTarget.dataset.index);
    this.applyCategoryFilter(categoryFilterIndex);
  },

  onCategoryFilterChange(event: { detail: { value: string } }) {
    this.applyCategoryFilter(Number(event.detail.value));
  },

  applyCategoryFilter(categoryFilterIndex: number) {
    const activeCategoryFilter =
      this.data.categoryFilterOptions[categoryFilterIndex] || "全部类型";
    const dateValue =
      this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
    const filteredSchedules = filterSchedules(
      this.data.schedules,
      dateValue,
      this.data.activeStatusFilter,
      activeCategoryFilter,
    );
    this.closeScheduleSwipe();
    this.setData({
      categoryFilterIndex,
      activeCategoryFilter,
      openFilterKey: "",
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
    });
  },

  clearCategoryFilter() {
    const dateValue =
      this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
    const filteredSchedules = filterSchedules(
      this.data.schedules,
      dateValue,
      this.data.activeStatusFilter,
      "全部类型",
    );
    this.closeScheduleSwipe();
    this.setData({
      categoryFilterIndex: 0,
      activeCategoryFilter: "全部类型" as ScheduleCategoryFilter,
      openFilterKey: "",
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
    });
  },

  onStatusFilterSelect(event: { currentTarget: { dataset: { index: string } } }) {
    const statusFilterIndex = Number(event.currentTarget.dataset.index);
    this.applyStatusFilter(statusFilterIndex);
  },

  onStatusFilterChange(event: { detail: { value: string } }) {
    this.applyStatusFilter(Number(event.detail.value));
  },

  applyStatusFilter(statusFilterIndex: number) {
    const activeStatusFilter = this.data.statusFilters[statusFilterIndex] || "全部";
    const dateValue =
      this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
    const filteredSchedules = filterSchedules(
      this.data.schedules,
      dateValue,
      activeStatusFilter,
      this.data.activeCategoryFilter,
    );
    this.closeScheduleSwipe();
    this.setData({
      statusFilterIndex,
      activeStatusFilter,
      openFilterKey: "",
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
    });
  },

  clearStatusFilter() {
    const dateValue =
      this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
    const filteredSchedules = filterSchedules(
      this.data.schedules,
      dateValue,
      "全部",
      this.data.activeCategoryFilter,
    );
    this.closeScheduleSwipe();
    this.setData({
      statusFilterIndex: 0,
      activeStatusFilter: "全部" as ScheduleStatusFilter,
      openFilterKey: "",
      filteredSchedules,
      scheduleGroups: groupSchedulesByYear(filteredSchedules),
    });
  },

  getEmptyScheduleState() {
    return {
      trip: null,
      trips: [] as Trip[],
      tripOptions: [] as string[],
      activeTripIndex: 0,
      showTripOptions: false,
      tripStatus: "待出发" as TripStatusView,
      tripStatusClass: "upcoming",
      openScheduleId: "",
      clipScheduleId: "",
      schedules: [] as ScheduleView[],
      filteredSchedules: [] as ScheduleView[],
      scheduleGroups: [] as ScheduleYearGroup[],
      dateFilterOptions: [{ label: "全部日期", value: "all" }] as DateFilterOption[],
      dateFilterLabels: ["全部日期"] as string[],
      dateFilterIndex: 0,
      statusFilters: ["全部", "待出发", "进行中", "已完成"] as ScheduleStatusFilter[],
      statusFilterIndex: 0,
      activeStatusFilter: "全部" as ScheduleStatusFilter,
      categoryFilterOptions: ["全部类型"] as ScheduleCategoryFilter[],
      categoryFilterIndex: 0,
      activeCategoryFilter: "全部类型" as ScheduleCategoryFilter,
      openFilterKey: "",
      filterDocked: false,
      travelTip: createEmptyTravelTip(),
    };
  },
});

function getFilterDockTop(): number {
  const wxApi = wx as WechatMiniprogram.Wx & {
    getSystemInfoSync?: () => { statusBarHeight?: number };
    getMenuButtonBoundingClientRect?: () => { bottom?: number };
  };
  const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
  const menuBottom =
    wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
  return Math.ceil(menuBottom + 8);
}

function createTravelTip(trip: Trip, scheduleCount: number): TravelTipView {
  const destination = trip.destination || "待定目的地";
  const dateText =
    trip.startDate === trip.endDate
      ? trip.startDate
      : `${trip.startDate} - ${trip.endDate}`;
  return {
    icon: "鸭",
    title: `${destination}冲鸭计划`,
    subtitle: dateText,
    metaTop: `${scheduleCount} 项日程`,
    metaBottom: trip.destination ? "目的地已定" : "轻松规划",
  };
}

function createEmptyTravelTip(): TravelTipView {
  return {
    icon: "鸭",
    title: "准备冲鸭",
    subtitle: "先新建一个旅行计划",
    metaTop: "0 项日程",
    metaBottom: "从 0 开始",
  };
}
