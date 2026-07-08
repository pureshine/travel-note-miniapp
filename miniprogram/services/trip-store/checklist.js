"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addChecklistItemToTrip = addChecklistItemToTrip;
exports.toggleChecklistItemInTrip = toggleChecklistItemInTrip;
function addChecklistItemToTrip(trip, title, id) {
    return {
        ...trip,
        checklist: [...trip.checklist, { id, title, done: false }]
    };
}
function toggleChecklistItemInTrip(trip, itemId) {
    return {
        ...trip,
        checklist: trip.checklist.map((item) => item.id === itemId ? { ...item, done: !item.done } : item)
    };
}
