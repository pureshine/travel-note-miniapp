"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNoteToTrip = addNoteToTrip;
exports.updateNoteInTrip = updateNoteInTrip;
exports.toggleNoteInTrip = toggleNoteInTrip;
exports.deleteNoteFromTrip = deleteNoteFromTrip;
exports.getNoteCategories = getNoteCategories;
exports.normalizeNoteCategory = normalizeNoteCategory;
function addNoteToTrip(trip, title, content, category, id, createdAt) {
    return {
        ...trip,
        notes: [{ id, title, content, category, done: false, createdAt }, ...trip.notes]
    };
}
function updateNoteInTrip(trip, noteId, input) {
    return {
        ...trip,
        notes: trip.notes.map((item) => item.id === noteId
            ? {
                ...item,
                title: input.title,
                content: input.content,
                category: input.category
            }
            : item)
    };
}
function toggleNoteInTrip(trip, itemId) {
    return {
        ...trip,
        notes: trip.notes.map((item) => item.id === itemId ? { ...item, done: !item.done } : item)
    };
}
function deleteNoteFromTrip(trip, itemId) {
    return {
        ...trip,
        notes: trip.notes.filter((item) => item.id !== itemId)
    };
}
function getNoteCategories() {
    return ["物品", "事项", "预订", "攻略"];
}
function normalizeNoteCategory(category) {
    if (category === "财务")
        return "事项";
    if (category === "证件")
        return "物品";
    const categories = getNoteCategories();
    if (categories.includes(category)) {
        return category;
    }
    return "物品";
}
