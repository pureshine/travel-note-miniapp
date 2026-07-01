"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteCategories = exports.getScheduleCategories = exports.setActiveTripId = exports.getActiveTrip = exports.getDefaultTrip = exports.importTripsFromSync = exports.getDeletedTripIdsForSync = exports.clearDeletedItemIds = exports.exportTripsForSync = exports.resetDemoData = exports.getExpenseByCategory = exports.getSummary = exports.deleteExpense = exports.updateExpense = exports.addExpense = exports.deleteNote = exports.toggleNoteItem = exports.updateNote = exports.addNote = exports.toggleChecklistItem = exports.addChecklistItem = exports.deleteSchedule = exports.updateSchedule = exports.addSchedule = exports.deleteTrip = exports.updateTripBudget = exports.updateTripInfo = exports.createTrip = exports.getTrip = exports.listTrips = void 0;
const id_1 = require("../utils/id");
const date_1 = require("../utils/date");
const STORAGE_KEY = "travel-note-trips";
const ACTIVE_TRIP_KEY = "travel-note-active-trip-id";
const PROFILE_KEY = "travel-note-profile";
const DELETED_ITEMS_KEY = "travel-note-deleted-item-ids";
const DELETED_TRIPS_KEY = "travel-note-deleted-trip-ids";
const DATA_UPDATED_AT_KEY = "travel-note-data-updated-at";
const DATA_RESET_VERSION_KEY = "travel-note-data-reset-version";
const CURRENT_DATA_RESET_VERSION = 3;
let autoSyncTimer;
function seedTrips() {
    return [];
}
function readTrips() {
    resetLocalDataOnce();
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (Array.isArray(stored))
        return stored;
    const seeded = seedTrips();
    wx.setStorageSync(STORAGE_KEY, seeded);
    return seeded;
}
function writeTrips(trips, options) {
    wx.setStorageSync(STORAGE_KEY, trips);
    if (!options?.skipAutoSync)
        scheduleAutoSync(trips.map(normalizeTrip));
    notifyTripDataChanged();
    return trips;
}
function resetLocalDataOnce() {
    const resetVersion = wx.getStorageSync(DATA_RESET_VERSION_KEY) || 0;
    if (resetVersion >= CURRENT_DATA_RESET_VERSION)
        return;
    wx.setStorageSync(STORAGE_KEY, []);
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
    wx.removeStorageSync(DELETED_ITEMS_KEY);
    wx.removeStorageSync(DELETED_TRIPS_KEY);
    wx.setStorageSync(DATA_RESET_VERSION_KEY, CURRENT_DATA_RESET_VERSION);
}
function scheduleAutoSync(trips) {
    const profile = wx.getStorageSync(PROFILE_KEY);
    if (!profile?.loggedIn || !profile.openid || profile.previewMode || !wx.cloud)
        return;
    if (autoSyncTimer)
        clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(() => {
        wx.cloud?.callFunction({
            name: "syncTrips",
            data: {
                action: "upload",
                trips,
                deletedTripIds: readDeletedTripIds(),
                memberProfile: getSyncMemberProfile(profile)
            },
            success: (res) => {
                const result = res.result;
                const latestProfile = wx.getStorageSync(PROFILE_KEY);
                if (!latestProfile?.loggedIn)
                    return;
                clearDeletedItemIds();
                wx.setStorageSync(PROFILE_KEY, {
                    ...latestProfile,
                    lastSyncAt: result.updatedAt || Date.now()
                });
            },
            fail: (error) => {
                const latestProfile = wx.getStorageSync(PROFILE_KEY);
                if (!latestProfile?.loggedIn)
                    return;
                wx.setStorageSync(PROFILE_KEY, {
                    ...latestProfile,
                    lastAutoSyncFailedAt: Date.now(),
                    lastAutoSyncError: error.errMsg || "自动同步失败"
                });
            }
        });
    }, 1600);
}
function getSyncMemberProfile(profile) {
    return {
        nickname: profile.nickname?.trim() || "未设置名字",
        avatarUrl: profile.avatarUrl || ""
    };
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
        budget: 10000,
        coverTone: "sky",
        schedules: [],
        checklist: [],
        notes: [],
        expenses: []
    };
    writeTrips([trip, ...readTrips()]);
    setActiveTripId(trip.id);
    return trip;
}
exports.createTrip = createTrip;
function updateTripInfo(tripId, input) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        name: input.name,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate
    }));
}
exports.updateTripInfo = updateTripInfo;
function updateTripBudget(tripId, budget) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        budget
    }));
}
exports.updateTripBudget = updateTripBudget;
function deleteTrip(tripId) {
    markDeletedTrip(tripId);
    const trips = readTrips().filter((trip) => trip.id !== tripId);
    writeTrips(trips);
    const nextTrip = trips[0];
    if (nextTrip) {
        setActiveTripId(nextTrip.id);
    }
    else {
        wx.removeStorageSync(ACTIVE_TRIP_KEY);
    }
    return nextTrip;
}
exports.deleteTrip = deleteTrip;
function addSchedule(tripId, item) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: [{ ...item, id: (0, id_1.createId)("schedule") }, ...trip.schedules].sort(compareSchedule)
    }));
}
exports.addSchedule = addSchedule;
function updateSchedule(tripId, scheduleId, input) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: trip.schedules.map((item) => (item.id === scheduleId ? { ...input, id: item.id } : item)).sort(compareSchedule)
    }));
}
exports.updateSchedule = updateSchedule;
function deleteSchedule(tripId, scheduleId) {
    markDeletedItem(tripId, "schedules", scheduleId);
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: trip.schedules.filter((item) => item.id !== scheduleId)
    }));
}
exports.deleteSchedule = deleteSchedule;
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
function updateNote(tripId, noteId, input) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: trip.notes.map((item) => item.id === noteId
            ? {
                ...item,
                title: input.title,
                content: input.content,
                category: input.category
            }
            : item)
    }));
}
exports.updateNote = updateNote;
function toggleNoteItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: trip.notes.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    }));
}
exports.toggleNoteItem = toggleNoteItem;
function deleteNote(tripId, itemId) {
    markDeletedItem(tripId, "notes", itemId);
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: trip.notes.filter((item) => item.id !== itemId)
    }));
}
exports.deleteNote = deleteNote;
function addExpense(tripId, title, amount, category, paidBy, createdAt = Date.now()) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        expenses: [{ id: (0, id_1.createId)("expense"), title, amount, category, paidBy, createdAt }, ...trip.expenses]
    }));
}
exports.addExpense = addExpense;
function updateExpense(tripId, expenseId, input) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        expenses: trip.expenses.map((item) => item.id === expenseId
            ? {
                ...item,
                title: input.title,
                amount: input.amount,
                category: input.category,
                paidBy: input.paidBy,
                createdAt: input.createdAt || item.createdAt
            }
            : item)
    }));
}
exports.updateExpense = updateExpense;
function deleteExpense(tripId, expenseId) {
    markDeletedItem(tripId, "expenses", expenseId);
    return updateTrip(tripId, (trip) => ({
        ...trip,
        expenses: trip.expenses.filter((item) => item.id !== expenseId)
    }));
}
exports.deleteExpense = deleteExpense;
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
    wx.setStorageSync(STORAGE_KEY, []);
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
    wx.removeStorageSync(DELETED_ITEMS_KEY);
    wx.removeStorageSync(DELETED_TRIPS_KEY);
    wx.setStorageSync(DATA_RESET_VERSION_KEY, CURRENT_DATA_RESET_VERSION);
    scheduleAutoSync([]);
    notifyTripDataChanged();
}
exports.resetDemoData = resetDemoData;
function exportTripsForSync() {
    const deletedItems = readDeletedItemIds();
    return listTrips().map((trip) => {
        const syncDeletedIds = deletedItems[trip.id];
        return syncDeletedIds ? { ...trip, syncDeletedIds } : trip;
    });
}
exports.exportTripsForSync = exportTripsForSync;
function clearDeletedItemIds() {
    wx.removeStorageSync(DELETED_ITEMS_KEY);
    wx.removeStorageSync(DELETED_TRIPS_KEY);
}
exports.clearDeletedItemIds = clearDeletedItemIds;
function getDeletedTripIdsForSync() {
    return readDeletedTripIds();
}
exports.getDeletedTripIdsForSync = getDeletedTripIdsForSync;
function importTripsFromSync(trips) {
    const normalizedTrips = trips.map(normalizeTrip);
    const localTrips = readTrips().map(normalizeTrip);
    const mergedTrips = mergeTrips(localTrips, normalizedTrips);
    writeTrips(mergedTrips, { skipAutoSync: true });
    const firstTrip = mergedTrips[0];
    if (firstTrip) {
        setActiveTripId(firstTrip.id);
    }
    else {
        wx.removeStorageSync(ACTIVE_TRIP_KEY);
    }
    return mergedTrips;
}
exports.importTripsFromSync = importTripsFromSync;
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
function getActiveTrip() {
    const activeTripId = wx.getStorageSync(ACTIVE_TRIP_KEY);
    const trips = listTrips();
    return trips.find((trip) => trip.id === activeTripId) || trips[0];
}
exports.getActiveTrip = getActiveTrip;
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
        budget: typeof trip.budget === "number" && Number.isFinite(trip.budget) ? trip.budget : 10000,
        schedules: trip.schedules.map((item) => ({
            ...item,
            category: item.category || "其他",
            images: item.images || []
        })).sort(compareSchedule),
        notes: trip.notes.map((item) => ({
            ...item,
            category: item.category || "事项",
            done: Boolean(item.done)
        })),
        sharedMembers: Array.isArray(trip.sharedMembers) ? trip.sharedMembers : []
    };
}
function mergeTrips(localTrips, cloudTrips) {
    const tripMap = new Map();
    localTrips.forEach((trip) => tripMap.set(trip.id, normalizeTrip(trip)));
    cloudTrips.forEach((trip) => {
        const localTrip = tripMap.get(trip.id);
        tripMap.set(trip.id, localTrip ? mergeTrip(localTrip, normalizeTrip(trip)) : normalizeTrip(trip));
    });
    return Array.from(tripMap.values()).sort((a, b) => {
        const aTime = new Date(a.startDate || "1970-01-01").getTime();
        const bTime = new Date(b.startDate || "1970-01-01").getTime();
        return bTime - aTime;
    });
}
function mergeTrip(localTrip, cloudTrip) {
    return normalizeTrip({
        ...localTrip,
        ...cloudTrip,
        schedules: mergeById(localTrip.schedules, cloudTrip.schedules).sort(compareSchedule),
        checklist: mergeById(localTrip.checklist, cloudTrip.checklist),
        notes: mergeById(localTrip.notes, cloudTrip.notes).sort((a, b) => b.createdAt - a.createdAt),
        expenses: mergeById(localTrip.expenses, cloudTrip.expenses).sort((a, b) => b.createdAt - a.createdAt),
        sharedMembers: mergeById(localTrip.sharedMembers || [], cloudTrip.sharedMembers || [])
    });
}
function mergeById(localItems, cloudItems) {
    const itemMap = new Map();
    localItems.forEach((item) => {
        const key = item.id || item.openid;
        if (key)
            itemMap.set(key, item);
    });
    cloudItems.forEach((item) => {
        const key = item.id || item.openid;
        if (key)
            itemMap.set(key, item);
    });
    return Array.from(itemMap.values());
}
function readDeletedItemIds() {
    const stored = wx.getStorageSync(DELETED_ITEMS_KEY);
    return stored && typeof stored === "object" ? stored : {};
}
function readDeletedTripIds() {
    const stored = wx.getStorageSync(DELETED_TRIPS_KEY);
    return Array.isArray(stored) ? stored.filter((id) => typeof id === "string" && id) : [];
}
function markDeletedTrip(tripId) {
    const deletedTripIds = readDeletedTripIds();
    wx.setStorageSync(DELETED_TRIPS_KEY, Array.from(new Set([...deletedTripIds, tripId])));
    const deletedItems = readDeletedItemIds();
    if (deletedItems[tripId]) {
        const nextDeletedItems = { ...deletedItems };
        delete nextDeletedItems[tripId];
        wx.setStorageSync(DELETED_ITEMS_KEY, nextDeletedItems);
    }
}
function notifyTripDataChanged() {
    wx.setStorageSync(DATA_UPDATED_AT_KEY, Date.now());
    const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
    pages.forEach((page) => {
        const route = typeof page.route === "string" ? page.route : "";
        if (route === "pages/index/index" && typeof page.refreshHomeData === "function") {
            page.refreshHomeData();
            return;
        }
        if (route === "pages/trips/trips" && typeof page.refreshTripList === "function") {
            page.refreshTripList();
            return;
        }
        if (route === "pages/schedule/schedule" && typeof page.loadTrip === "function") {
            page.loadTrip();
            return;
        }
        if ((route === "pages/notes/notes" || route === "pages/stats/stats" || route === "pages/expenses/expenses") && typeof page.loadSelectedTrip === "function") {
            page.loadSelectedTrip();
            return;
        }
        if (route === "pages/profile/profile" && typeof page.refreshLocalStats === "function") {
            page.refreshLocalStats();
        }
    });
}
function markDeletedItem(tripId, collection, itemId) {
    const deletedItems = readDeletedItemIds();
    const tripDeletedItems = deletedItems[tripId] || {};
    const collectionIds = tripDeletedItems[collection] || [];
    wx.setStorageSync(DELETED_ITEMS_KEY, {
        ...deletedItems,
        [tripId]: {
            ...tripDeletedItems,
            [collection]: Array.from(new Set([...collectionIds, itemId]))
        }
    });
}
function compareSchedule(a, b) {
    return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
