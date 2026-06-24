"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.today = exports.formatMonthDay = void 0;
function formatMonthDay(dateText) {
    const parts = dateText.split("-");
    if (parts.length !== 3)
        return dateText;
    return `${Number(parts[1])}月${Number(parts[2])}日`;
}
exports.formatMonthDay = formatMonthDay;
function today() {
    const date = new Date();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}
exports.today = today;
