"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMonthDay = formatMonthDay;
exports.today = today;
exports.isTripDateRangeValid = isTripDateRangeValid;
function formatMonthDay(dateText) {
    const parts = dateText.split("-");
    if (parts.length !== 3)
        return dateText;
    return `${Number(parts[1])}月${Number(parts[2])}日`;
}
function today() {
    const date = new Date();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}
function isTripDateRangeValid(startDate, endDate) {
    if (!startDate || !endDate)
        return false;
    return startDate <= endDate;
}
