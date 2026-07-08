"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_TRIP_TOAST = void 0;
exports.getTripStatus = getTripStatus;
exports.getTripStatusClass = getTripStatusClass;
exports.formatTripOption = formatTripOption;
exports.formatScheduleDate = formatScheduleDate;
function getTripStatus(trip) {
    const endTime = new Date(`${trip.endDate}T23:59:59`).getTime();
    if (Number.isNaN(endTime))
        return "待出发";
    return Date.now() > endTime ? "已完成" : "待出发";
}
function getTripStatusClass(status) {
    return status === "已完成" ? "done" : "upcoming";
}
function formatTripOption(trip) {
    return `${trip.name} · ${getTripStatus(trip)}`;
}
function formatScheduleDate(day) {
    const parts = day.split("-");
    if (parts.length !== 3)
        return { year: "", monthDay: day };
    return {
        year: parts[0],
        monthDay: `${Number(parts[1])}.${Number(parts[2])}`
    };
}
exports.NO_TRIP_TOAST = "请先新建旅行计划";
