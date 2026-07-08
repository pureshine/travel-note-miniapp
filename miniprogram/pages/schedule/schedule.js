"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trip_store_1 = require("../../services/trip-store");
const trip_view_1 = require("../../utils/trip-view");
const active_trip_1 = require("../../behaviors/active-trip");
const page_shell_1 = require("../../behaviors/page-shell");
Page({
    behaviors: [page_shell_1.pageShellBehavior, active_trip_1.activeTripBehavior],
    data: {
        trip: null,
        trips: [],
        tripOptions: [],
        activeTripIndex: 0,
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
    onShow() {
        this.loadTrip();
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
        const schedules = this.sortScheduleViews(this.toScheduleViews(trip ? trip.schedules : []));
        const dateFilterOptions = createDateFilterOptions(schedules);
        const categoryFilterOptions = createCategoryFilterOptions(schedules);
        const nextDateFilterIndex = Math.max(dateFilterOptions.findIndex((item) => item.value === this.data.dateFilterOptions[this.data.dateFilterIndex]?.value), 0);
        const nextCategoryFilterIndex = Math.max(categoryFilterOptions.findIndex((item) => item === this.data.activeCategoryFilter), 0);
        const filteredSchedules = this.filterSchedules(schedules, dateFilterOptions[nextDateFilterIndex]?.value || "all", this.data.activeStatusFilter, categoryFilterOptions[nextCategoryFilterIndex] || "全部类型");
        const tripStatus = trip ? (0, trip_view_1.getTripStatus)(trip) : "待出发";
        this.setData({
            trip,
            trips,
            tripOptions: trips.map((item) => (0, trip_view_1.formatTripOption)(item)),
            activeTripIndex: trip
                ? Math.max(trips.findIndex((item) => item.id === trip.id), 0)
                : 0,
            tripStatus,
            tripStatusClass: (0, trip_view_1.getTripStatusClass)(tripStatus),
            openScheduleId: "",
            clipScheduleId: "",
            schedules,
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
            dateFilterOptions,
            dateFilterLabels: dateFilterOptions.map((item) => item.label),
            dateFilterIndex: nextDateFilterIndex,
            categoryFilterOptions,
            categoryFilterIndex: nextCategoryFilterIndex,
            activeCategoryFilter: categoryFilterOptions[nextCategoryFilterIndex] || "全部类型",
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
    onDateFilterChange(event) {
        const dateFilterIndex = Number(event.detail.value);
        const dateValue = this.data.dateFilterOptions[dateFilterIndex]?.value || "all";
        const filteredSchedules = this.filterSchedules(this.data.schedules, dateValue, this.data.activeStatusFilter, this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            dateFilterIndex,
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
        });
    },
    clearDateFilter() {
        const filteredSchedules = this.filterSchedules(this.data.schedules, "all", this.data.activeStatusFilter, this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            dateFilterIndex: 0,
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
        });
    },
    onCategoryFilterChange(event) {
        const categoryFilterIndex = Number(event.detail.value);
        const activeCategoryFilter = this.data.categoryFilterOptions[categoryFilterIndex] || "全部类型";
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = this.filterSchedules(this.data.schedules, dateValue, this.data.activeStatusFilter, activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            categoryFilterIndex,
            activeCategoryFilter,
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
        });
    },
    clearCategoryFilter() {
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = this.filterSchedules(this.data.schedules, dateValue, this.data.activeStatusFilter, "全部类型");
        this.closeScheduleSwipe();
        this.setData({
            categoryFilterIndex: 0,
            activeCategoryFilter: "全部类型",
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
        });
    },
    onStatusFilterChange(event) {
        const statusFilterIndex = Number(event.detail.value);
        const activeStatusFilter = this.data.statusFilters[statusFilterIndex] || "全部";
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = this.filterSchedules(this.data.schedules, dateValue, activeStatusFilter, this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            statusFilterIndex,
            activeStatusFilter,
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
        });
    },
    clearStatusFilter() {
        const dateValue = this.data.dateFilterOptions[this.data.dateFilterIndex]?.value || "all";
        const filteredSchedules = this.filterSchedules(this.data.schedules, dateValue, "全部", this.data.activeCategoryFilter);
        this.closeScheduleSwipe();
        this.setData({
            statusFilterIndex: 0,
            activeStatusFilter: "全部",
            filteredSchedules,
            scheduleGroups: this.groupSchedulesByYear(filteredSchedules),
        });
    },
    toScheduleViews(items) {
        return items.map((item) => {
            const status = getScheduleStatus(item);
            const startTime = item.time || "00:00";
            const endTimeText = item.endTime && item.endTime !== startTime ? item.endTime : "";
            return {
                ...item,
                ...(0, trip_view_1.formatScheduleDate)(item.day),
                status,
                statusClass: getStatusClass(status),
                active: status === "进行中",
                startTime,
                endTimeText,
                timeRange: endTimeText ? `${startTime} - ${endTimeText}` : startTime,
            };
        });
    },
    sortScheduleViews(items) {
        return [...items].sort((a, b) => {
            const aDone = a.status === "已完成";
            const bDone = b.status === "已完成";
            if (aDone !== bDone)
                return aDone ? 1 : -1;
            return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
        });
    },
    filterSchedules(items, dateValue, statusValue, categoryValue) {
        return items.filter((item) => {
            const dateMatched = dateValue === "all" || item.day === dateValue;
            const statusMatched = statusValue === "全部" || item.status === statusValue;
            const categoryMatched = categoryValue === "全部类型" || item.category === categoryValue;
            return dateMatched && statusMatched && categoryMatched;
        });
    },
    groupSchedulesByYear(items) {
        const groups = [];
        items.forEach((item) => {
            let group = groups.find((entry) => entry.year === item.year);
            if (!group) {
                group = { year: item.year, items: [] };
                groups.push(group);
            }
            group.items.push(item);
        });
        return groups;
    },
    getEmptyScheduleState() {
        return {
            trip: null,
            trips: [],
            tripOptions: [],
            activeTripIndex: 0,
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
            filterDocked: false,
            travelTip: createEmptyTravelTip(),
        };
    },
});
function getScheduleStatus(item) {
    const startTime = new Date(`${item.day}T${item.time || "00:00"}:00`).getTime();
    const endTime = new Date(`${item.day}T${item.endTime || item.time || "00:00"}:00`).getTime();
    const now = Date.now();
    if (Number.isNaN(startTime))
        return "待出发";
    if (now < startTime)
        return "待出发";
    if (!Number.isNaN(endTime) && endTime > startTime && now <= endTime) {
        return "进行中";
    }
    return "已完成";
}
function getFilterDockTop() {
    const wxApi = wx;
    const statusBarHeight = wxApi.getSystemInfoSync?.().statusBarHeight || 0;
    const menuBottom = wxApi.getMenuButtonBoundingClientRect?.().bottom || statusBarHeight + 44;
    return Math.ceil(menuBottom + 8);
}
function getStatusClass(status) {
    if (status === "已完成")
        return "done";
    if (status === "进行中")
        return "active";
    return "pending";
}
function createDateFilterOptions(items) {
    const dates = Array.from(new Set(items.map((item) => item.day))).sort();
    return [
        { label: "全部日期", value: "all" },
        ...dates.map((date) => {
            const formatted = (0, trip_view_1.formatScheduleDate)(date);
            return {
                label: `${formatted.monthDay} ${formatted.year}`,
                value: date,
            };
        }),
    ];
}
function createCategoryFilterOptions(items) {
    const categories = Array.from(new Set(items.map((item) => item.category))).sort();
    return ["全部类型", ...categories];
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
