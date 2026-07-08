"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScheduleViews = createScheduleViews;
exports.sortScheduleViews = sortScheduleViews;
exports.filterSchedules = filterSchedules;
exports.groupSchedulesByYear = groupSchedulesByYear;
exports.createDateFilterOptions = createDateFilterOptions;
exports.createCategoryFilterOptions = createCategoryFilterOptions;
const trip_view_1 = require("./trip-view");
function createScheduleViews(items, now = Date.now()) {
    return items.map((item) => {
        const status = getScheduleStatus(item, now);
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
            timeRange: endTimeText ? `${startTime} - ${endTimeText}` : startTime
        };
    });
}
function sortScheduleViews(items) {
    return [...items].sort((a, b) => {
        const aDone = a.status === "已完成";
        const bDone = b.status === "已完成";
        if (aDone !== bDone)
            return aDone ? 1 : -1;
        return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
    });
}
function filterSchedules(items, dateValue, statusValue, categoryValue) {
    return items.filter((item) => {
        const dateMatched = dateValue === "all" || item.day === dateValue;
        const statusMatched = statusValue === "全部" || item.status === statusValue;
        const categoryMatched = categoryValue === "全部类型" || item.category === categoryValue;
        return dateMatched && statusMatched && categoryMatched;
    });
}
function groupSchedulesByYear(items) {
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
}
function createDateFilterOptions(items) {
    const dates = Array.from(new Set(items.map((item) => item.day))).sort();
    return [
        { label: "全部日期", value: "all" },
        ...dates.map((date) => {
            const formatted = (0, trip_view_1.formatScheduleDate)(date);
            return {
                label: `${formatted.monthDay} ${formatted.year}`,
                value: date
            };
        })
    ];
}
function createCategoryFilterOptions(items) {
    const categories = Array.from(new Set(items.map((item) => item.category))).sort();
    return ["全部类型", ...categories];
}
function getScheduleStatus(item, now) {
    const startTime = new Date(`${item.day}T${item.time || "00:00"}:00`).getTime();
    const endTime = new Date(`${item.day}T${item.endTime || item.time || "00:00"}:00`).getTime();
    if (Number.isNaN(startTime))
        return "待出发";
    if (now < startTime)
        return "待出发";
    if (!Number.isNaN(endTime) && endTime > startTime && now <= endTime) {
        return "进行中";
    }
    return "已完成";
}
function getStatusClass(status) {
    if (status === "已完成")
        return "done";
    if (status === "进行中")
        return "active";
    return "pending";
}
