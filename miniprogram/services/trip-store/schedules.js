"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addScheduleToTrip = addScheduleToTrip;
exports.updateScheduleInTrip = updateScheduleInTrip;
exports.deleteScheduleFromTrip = deleteScheduleFromTrip;
exports.getScheduleCategories = getScheduleCategories;
exports.compareSchedule = compareSchedule;
function addScheduleToTrip(trip, item, id) {
    return {
        ...trip,
        schedules: [{ ...item, id }, ...trip.schedules].sort(compareSchedule)
    };
}
function updateScheduleInTrip(trip, scheduleId, input) {
    return {
        ...trip,
        schedules: trip.schedules
            .map((item) => item.id === scheduleId ? { ...input, id: item.id } : item)
            .sort(compareSchedule)
    };
}
function deleteScheduleFromTrip(trip, scheduleId) {
    return {
        ...trip,
        schedules: trip.schedules.filter((item) => item.id !== scheduleId)
    };
}
function getScheduleCategories() {
    return ["景点", "交通", "住宿", "餐饮", "其他"];
}
function compareSchedule(a, b) {
    return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
