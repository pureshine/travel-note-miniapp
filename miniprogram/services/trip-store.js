"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteCategories = exports.getScheduleCategories = exports.setActiveTripId = exports.getDefaultTrip = exports.resetDemoData = exports.getExpenseByCategory = exports.getSummary = exports.addExpense = exports.toggleNoteItem = exports.addNote = exports.toggleChecklistItem = exports.addChecklistItem = exports.addSchedule = exports.createTrip = exports.getTrip = exports.listTrips = void 0;
const id_1 = require("../utils/id");
const date_1 = require("../utils/date");
const STORAGE_KEY = "travel-note-trips";
const ACTIVE_TRIP_KEY = "travel-note-active-trip-id";
function seedTrips() {
    return [
        {
            id: "trip_seed_1",
            name: "厦门周末小旅行",
            destination: "厦门",
            startDate: "2026-07-10",
            endDate: "2026-07-12",
            coverTone: "mint",
            schedules: [
                {
                    id: "schedule_seed_1",
                    day: "2026-07-10",
                    time: "19:20",
                    category: "住宿",
                    title: "抵达酒店办理入住",
                    place: "思明区",
                    note: "提前保存前台电话和附近便利店位置。",
                    images: []
                },
                {
                    id: "schedule_seed_2",
                    day: "2026-07-11",
                    time: "09:30",
                    category: "景点",
                    title: "鼓浪屿散步",
                    place: "三丘田码头",
                    note: "船票和证件放在清单最上方。",
                    images: []
                }
            ],
            checklist: [
                { id: "check_seed_1", title: "身份证", done: true },
                { id: "check_seed_2", title: "充电器和充电宝", done: false },
                { id: "check_seed_3", title: "防晒和雨伞", done: false }
            ],
            notes: [
                {
                    id: "note_seed_1",
                    title: "酒店信息",
                    content: "入住时间 15:00 后，地铁站步行约 8 分钟。",
                    category: "预订",
                    done: false,
                    createdAt: 1783699200000
                }
            ],
            expenses: [
                { id: "expense_seed_1", title: "动车票", amount: 286, category: "交通", paidBy: "我", createdAt: 1783699200000 },
                { id: "expense_seed_2", title: "酒店预付", amount: 520, category: "住宿", paidBy: "我", createdAt: 1783699200000 }
            ]
        }
    ];
}
function readTrips() {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (Array.isArray(stored) && stored.length > 0)
        return stored;
    const seeded = seedTrips();
    wx.setStorageSync(STORAGE_KEY, seeded);
    return seeded;
}
function writeTrips(trips) {
    wx.setStorageSync(STORAGE_KEY, trips);
    return trips;
}
function updateTrip(tripId, updater) {
    const trips = readTrips();
    const nextTrips = trips.map((trip) => (trip.id === tripId ? updater(trip) : trip));
    writeTrips(nextTrips);
    return nextTrips.find((trip) => trip.id === tripId);
}
function listTrips() {
    return readTrips().map(normalizeTrip);
}
exports.listTrips = listTrips;
function getTrip(tripId) {
    return listTrips().find((trip) => trip.id === tripId);
}
exports.getTrip = getTrip;
function createTrip(input) {
    const current = (0, date_1.today)();
    const trip = {
        id: (0, id_1.createId)("trip"),
        name: input?.name || "新的旅行",
        destination: input?.destination || "待定目的地",
        startDate: input?.startDate || current,
        endDate: input?.endDate || input?.startDate || current,
        coverTone: "sky",
        schedules: [],
        checklist: [
            { id: (0, id_1.createId)("check"), title: "身份证件", done: false },
            { id: (0, id_1.createId)("check"), title: "充电器", done: false }
        ],
        notes: [],
        expenses: []
    };
    writeTrips([trip, ...readTrips()]);
    setActiveTripId(trip.id);
    return trip;
}
exports.createTrip = createTrip;
function addSchedule(tripId, item) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: [{ ...item, id: (0, id_1.createId)("schedule") }, ...trip.schedules].sort(compareSchedule)
    }));
}
exports.addSchedule = addSchedule;
function addChecklistItem(tripId, title) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        checklist: [...trip.checklist, { id: (0, id_1.createId)("check"), title, done: false }]
    }));
}
exports.addChecklistItem = addChecklistItem;
function toggleChecklistItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        checklist: trip.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    }));
}
exports.toggleChecklistItem = toggleChecklistItem;
function addNote(tripId, title, content, category = "事项") {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: [{ id: (0, id_1.createId)("note"), title, content, category, done: false, createdAt: Date.now() }, ...trip.notes]
    }));
}
exports.addNote = addNote;
function toggleNoteItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: trip.notes.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    }));
}
exports.toggleNoteItem = toggleNoteItem;
function addExpense(tripId, title, amount, category, paidBy) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        expenses: [{ id: (0, id_1.createId)("expense"), title, amount, category, paidBy, createdAt: Date.now() }, ...trip.expenses]
    }));
}
exports.addExpense = addExpense;
function getSummary() {
    const trips = listTrips();
    const expenses = trips.flatMap((trip) => trip.expenses);
    const checklist = trips.flatMap((trip) => trip.checklist);
    return {
        tripCount: trips.length,
        expenseTotal: expenses.reduce((total, item) => total + item.amount, 0),
        checklistDone: checklist.filter((item) => item.done).length,
        checklistTotal: checklist.length
    };
}
exports.getSummary = getSummary;
function getExpenseByCategory() {
    const categories = ["交通", "住宿", "餐饮", "门票", "购物", "其他"];
    const expenses = listTrips().flatMap((trip) => trip.expenses);
    return categories.map((category) => ({
        category,
        amount: expenses.filter((item) => item.category === category).reduce((total, item) => total + item.amount, 0)
    }));
}
exports.getExpenseByCategory = getExpenseByCategory;
function resetDemoData() {
    writeTrips(seedTrips());
}
exports.resetDemoData = resetDemoData;
function getDefaultTrip() {
    const activeTripId = wx.getStorageSync(ACTIVE_TRIP_KEY);
    const trips = listTrips();
    const activeTrip = trips.find((trip) => trip.id === activeTripId);
    if (activeTrip)
        return activeTrip;
    if (trips.length > 0)
        return trips[0];
    return createTrip();
}
exports.getDefaultTrip = getDefaultTrip;
function setActiveTripId(tripId) {
    wx.setStorageSync(ACTIVE_TRIP_KEY, tripId);
}
exports.setActiveTripId = setActiveTripId;
function getScheduleCategories() {
    return ["景点", "交通", "住宿", "餐饮", "其他"];
}
exports.getScheduleCategories = getScheduleCategories;
function getNoteCategories() {
    return ["证件", "财务", "物品", "预订", "事项"];
}
exports.getNoteCategories = getNoteCategories;
function normalizeTrip(trip) {
    return {
        ...trip,
        schedules: trip.schedules.map((item) => ({
            ...item,
            category: item.category || "其他",
            images: item.images || []
        })).sort(compareSchedule),
        notes: trip.notes.map((item) => ({
            ...item,
            category: item.category || "事项",
            done: Boolean(item.done)
        }))
    };
}
function compareSchedule(a, b) {
    return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
