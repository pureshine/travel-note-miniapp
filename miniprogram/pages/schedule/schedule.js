"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const trip_view_1 = require("../../utils/trip-view");
const schedule_view_1 = require("../../utils/schedule-view");
const active_trip_1 = require("../../behaviors/active-trip");
const page_shell_1 = require("../../behaviors/page-shell");
const tab_cloud_sync_1 = require("../../behaviors/tab-cloud-sync");
Page({
    behaviors: [page_shell_1.pageShellBehavior, active_trip_1.activeTripBehavior, tab_cloud_sync_1.tabCloudSyncBehavior],
    data: {
        trip: null,
        trips: [],
        tripOptions: [],
        activeTripIndex: 0,
        showTripOptions: false,
        tripStatus: "待出发",
        tripStatusClass: "upcoming",
        scheduleTouchStartX: 0,
        openScheduleId: "",
        clipScheduleId: "",
        schedules: [],
        filteredSchedules: [],
        scheduleGroups: [],
        dateFilterOptions: [{ label: "全部日期", value: "all" }],
        dateFilterLabels: ["全部日期"],
        dateFilterIndex: 0,
        statusFilters: ["全部", "待出发", "进行中", "已完成"],
        statusFilterIndex: 0,
        activeStatusFilter: "全部",
        categoryFilterOptions: ["全部类型"],
        categoryFilterIndex: 0,
        activeCategoryFilter: "全部类型",
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
        },
    },
    onReady() {
        this.measureFilterAnchor();
    },
    onPageScroll(event) {
        if (!this.data.trip || this.data.schedules.length === 0)
            return;
        const shouldDock = this.data.filterDockTop > 0 && event.scrollTop >= this.data.filterDockTop;
        if (shouldDock !== this.data.filterDocked) {
            this.setData({ filterDocked: shouldDock });
        }
    },
    loadTrip() {
        (0, trip_store_1.reconcileClearedPlanState)();
        this.clearClipTimer();
        const trips = (0, trip_store_1.listTrips)();
        const trip = (0, trip_store_1.getActiveTrip)();
        if (!trip) {
            this.setData({
                ...this.getEmptyScheduleState(),
                trips,
            });
            return;
        }
        const schedules = (0, schedule_view_1.sortScheduleViews)((0, schedule_view_1.createScheduleViews)(trip ? trip.schedules : []));
        const dateFilterOptions = (0, schedule_view_1.createDateFilterOptions)(schedules);
        const categoryFilterOptions = (0, schedule_view_1.createCategoryFilterOptions)(schedules);
        const nextDateFilterIndex = Math.max(dateFilterOptions.findIndex((item) => item.value === this.data.dateFilterOptions[this.data.dateFilterIndex]?.value), 0);
        const nextCategoryFilterIndex = Math.max(categoryFilterOptions.findIndex((item) => item === this.data.activeCategoryFilter), 0);
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(schedules, dateFilterOptions[nextDateFilterIndex]?.value || "all", this.data.activeStatusFilter, categoryFilterOptions[nextCategoryFilterIndex] || "全部类型");
        const tripStatus = trip ? (0, trip_view_1.getTripStatus)(trip) : "待出发";
        this.setData({
            trip,
            trips,
            tripOptions: trips.map((item) => (0, trip_view_1.formatTripOption)(item)),
            activeTripIndex: trip
                ? Math.max(trips.findIndex((item) => item.id === trip.id), 0)
                : 0,
            showTripOptions: false,
            tripStatus,
            tripStatusClass: (0, trip_view_1.getTripStatusClass)(tripStatus),
            openScheduleId: "",
            clipScheduleId: "",
            schedules,
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
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
            const wxApi = wx;
            const query = wxApi.createSelectorQuery?.();
            if (!query)
                return;
            query
                .select(".sch-filter-anchor")
                .boundingClientRect((rect) => {
                if (!rect)
                    return;
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
        if (!trip)
            return;
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
                if (res.tapIndex === 2)
                    this.confirmDeleteTrip(trip);
            },
        });
    },
    confirmDeleteTrip(trip) {
        const hasOnlyOneTrip = this.data.trips.length <= 1;
        wx.showModal({
            title: "删除计划",
            content: hasOnlyOneTrip
                ? `确定删除“${trip.name}”吗？删除后会回到无计划状态。`
                : `确定删除“${trip.name}”吗？里面的日程、备忘和消费都会一起删除。`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm)
                    return;
                (0, trip_store_1.deleteTrip)(trip.id, { clearActive: true });
                this.loadTrip();
                wx.showToast({ title: "已删除", icon: "success" });
            },
        });
    },
    goScheduleForm() {
        const trip = this.data.trip || (0, trip_store_1.getActiveTrip)();
        if (!trip) {
            wx.showToast({ title: "请先新建旅行计划", icon: "none" });
            return;
        }
        (0, trip_store_1.setActiveTripId)(trip.id);
        wx.navigateTo({
            url: `/pages/schedule-form/schedule-form?tripId=${trip.id}`,
        });
    },
    previewScheduleImage(event) {
        const schedule = this.data.schedules.find((item) => item.id === event.currentTarget.dataset.id);
        if (!schedule || schedule.images.length === 0)
            return;
        const index = Number(event.currentTarget.dataset.index) || 0;
        wx.previewImage({
            urls: schedule.images,
            current: schedule.images[Math.min(Math.max(index, 0), schedule.images.length - 1)],
        });
    },
    onScheduleTouchStart(event) {
        const scheduleId = event.currentTarget.dataset.id;
        if (this.data.openScheduleId &&
            this.data.openScheduleId !== scheduleId) {
            this.closeScheduleSwipe();
        }
        this.setData({
            scheduleTouchStartX: event.changedTouches[0].clientX,
        });
    },
    onScheduleTouchMove(event) {
        const distance = this.data.scheduleTouchStartX - event.changedTouches[0].clientX;
        const scheduleId = event.currentTarget.dataset.id;
        if (distance > 40) {
            this.openScheduleSwipe(scheduleId);
        }
        else if (distance < -20 && this.data.openScheduleId === scheduleId) {
            this.closeScheduleSwipe();
        }
    },
    openScheduleSwipe(scheduleId) {
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
    editSchedule(event) {
        if (!this.data.trip)
            return;
        this.clearScheduleSwipe();
        wx.navigateTo({
            url: `/pages/schedule-form/schedule-form?tripId=${this.data.trip.id}&scheduleId=${event.currentTarget.dataset.id}`,
        });
    },
    deleteScheduleItem(event) {
        if (!this.data.trip)
            return;
        const schedule = this.data.trip.schedules.find((item) => item.id === event.currentTarget.dataset.id);
        if (!schedule)
            return;
        wx.showModal({
            title: "删除日程",
            content: `确定删除“${schedule.title}”吗？`,
            confirmText: "删除",
            confirmColor: "#dc2626",
            success: (result) => {
                if (!result.confirm || !this.data.trip)
                    return;
                (0, trip_store_1.deleteSchedule)(this.data.trip.id, schedule.id);
                this.clearScheduleSwipe();
                this.loadTrip();
            },
        });
    },
    toggleTripOptions() {
        this.setData({ showTripOptions: !this.data.showTripOptions });
    },
    onTripOptionTap(event) {
        const index = Number(event.currentTarget.dataset.index);
        this.onTripChangeByIndex(index);
        this.setData({ showTripOptions: false });
    },
    onTripChange(event) {
        this.onTripChangeByIndex(Number(event.detail.value));
    },
    onTripChangeByIndex(index) {
        const trip = this.data.trips[index];
        if (!trip)
            return;
        (0, trip_store_1.setActiveTripId)(trip.id);
        this.loadTrip();
    },
    toggleFilterMenu(event) {
        const key = event.currentTarget.dataset.key || "";
        this.setData({
            openFilterKey: this.data.openFilterKey === key ? "" : key,
        });
    },
    onDateFilterSelect(event) {
        const dateFilterIndex = Number(event.currentTarget.dataset.index);
        this.applyDateFilter(dateFilterIndex);
    },
    onDateFilterChange(event) {
        this.applyDateFilter(Number(event.detail.value));
    },
    applyDateFilter(dateFilterIndex) {
        const dateValue = this.data.dateFilterOptions[dateFilterIndex]?.value || "all";
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(this.data.schedules, dateValue, this.data.activeStatusFilter, this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            dateFilterIndex,
            openFilterKey: "",
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
        });
    },
    clearDateFilter() {
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(this.data.schedules, "all", this.data.activeStatusFilter, this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            dateFilterIndex: 0,
            openFilterKey: "",
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
        });
    },
    onCategoryFilterSelect(event) {
        const categoryFilterIndex = Number(event.currentTarget.dataset.index);
        this.applyCategoryFilter(categoryFilterIndex);
    },
    onCategoryFilterChange(event) {
        this.applyCategoryFilter(Number(event.detail.value));
    },
    applyCategoryFilter(categoryFilterIndex) {
        const activeCategoryFilter = this.data.categoryFilterOptions[categoryFilterIndex] || "全部类型";
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(this.data.schedules, dateValue, this.data.activeStatusFilter, activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            categoryFilterIndex,
            activeCategoryFilter,
            openFilterKey: "",
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
        });
    },
    clearCategoryFilter() {
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(this.data.schedules, dateValue, this.data.activeStatusFilter, "全部类型");
        this.closeScheduleSwipe();
        this.setData({
            categoryFilterIndex: 0,
            activeCategoryFilter: "全部类型",
            openFilterKey: "",
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
        });
    },
    onStatusFilterSelect(event) {
        const statusFilterIndex = Number(event.currentTarget.dataset.index);
        this.applyStatusFilter(statusFilterIndex);
    },
    onStatusFilterChange(event) {
        this.applyStatusFilter(Number(event.detail.value));
    },
    applyStatusFilter(statusFilterIndex) {
        const activeStatusFilter = this.data.statusFilters[statusFilterIndex] || "全部";
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(this.data.schedules, dateValue, activeStatusFilter, this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            statusFilterIndex,
            activeStatusFilter,
            openFilterKey: "",
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
        });
    },
    clearStatusFilter() {
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = (0, schedule_view_1.filterSchedules)(this.data.schedules, dateValue, "全部", this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            statusFilterIndex: 0,
            activeStatusFilter: "全部",
            openFilterKey: "",
            filteredSchedules,
            scheduleGroups: (0, schedule_view_1.groupSchedulesByYear)(filteredSchedules),
        });
    },
    getEmptyScheduleState() {
        return {
            trip: null,
            trips: [],
            tripOptions: [],
            activeTripIndex: 0,
            showTripOptions: false,
            tripStatus: "待出发",
            tripStatusClass: "upcoming",
            openScheduleId: "",
            clipScheduleId: "",
            schedules: [],
            filteredSchedules: [],
            scheduleGroups: [],
            dateFilterOptions: [{ label: "全部日期", value: "all" }],
            dateFilterLabels: ["全部日期"],
            dateFilterIndex: 0,
            statusFilters: ["全部", "待出发", "进行中", "已完成"],
            statusFilterIndex: 0,
            activeStatusFilter: "全部",
            categoryFilterOptions: ["全部类型"],
            categoryFilterIndex: 0,
            activeCategoryFilter: "全部类型",
            openFilterKey: "",
            filterDocked: false,
            travelTip: createEmptyTravelTip(),
        };
    },
});
function getFilterDockTop() {
    const wxApi = wx;
    const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
    const menuBottom = wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
    return Math.ceil(menuBottom + 8);
}
function createTravelTip(trip, scheduleCount) {
    const destination = trip.destination || "待定目的地";
    const dateText = trip.startDate === trip.endDate
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
function createEmptyTravelTip() {
    return {
        icon: "鸭",
        title: "准备冲鸭",
        subtitle: "先新建一个旅行计划",
        metaTop: "0 项日程",
        metaBottom: "从 0 开始",
    };
}
