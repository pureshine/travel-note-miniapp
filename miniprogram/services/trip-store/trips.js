"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTripData = createTripData;
exports.updateTripInfoInTrip = updateTripInfoInTrip;
exports.updateTripBudgetInTrip = updateTripBudgetInTrip;
function createTripData(input, id, currentDate) {
    return {
        id,
        name: input?.name || "新的旅行",
        destination: input?.destination || "待定目的地",
        startDate: input?.startDate || currentDate,
        endDate: input?.endDate || input?.startDate || currentDate,
        budget: 10000,
        coverTone: "sky",
        schedules: [],
        checklist: [],
        notes: [],
        expenses: []
    };
}
function updateTripInfoInTrip(trip, input) {
    return {
        ...trip,
        name: input.name,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate
    };
}
function updateTripBudgetInTrip(trip, budget) {
    return {
        ...trip,
        budget
    };
}
