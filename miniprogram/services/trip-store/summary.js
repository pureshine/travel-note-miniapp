"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummaryFromTrips = getSummaryFromTrips;
function getSummaryFromTrips(trips) {
    const expenses = trips.flatMap((trip) => trip.expenses);
    const checklist = trips.flatMap((trip) => trip.checklist);
    const notes = trips.flatMap((trip) => trip.notes);
    return {
        tripCount: trips.length,
        expenseTotal: expenses.reduce((total, item) => total + item.amount, 0),
        noteCount: notes.length,
        scheduleCount: trips.reduce((total, trip) => total + trip.schedules.length, 0),
        checklistDone: checklist.filter((item) => item.done).length,
        checklistTotal: checklist.length
    };
}
