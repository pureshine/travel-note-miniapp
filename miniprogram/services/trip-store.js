"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScheduleCategories = exports.getNoteCategories = void 0;
exports.listTrips = listTrips;
exports.getTrip = getTrip;
exports.createTrip = createTrip;
exports.updateTripInfo = updateTripInfo;
exports.updateTripBudget = updateTripBudget;
exports.deleteTrip = deleteTrip;
exports.addSchedule = addSchedule;
exports.updateSchedule = updateSchedule;
exports.deleteSchedule = deleteSchedule;
exports.addChecklistItem = addChecklistItem;
exports.toggleChecklistItem = toggleChecklistItem;
exports.addNote = addNote;
exports.updateNote = updateNote;
exports.toggleNoteItem = toggleNoteItem;
exports.deleteNote = deleteNote;
exports.addExpense = addExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
exports.getDataUpdatedAt = getDataUpdatedAt;
exports.getSummary = getSummary;
exports.getExpenseByCategory = getExpenseByCategory;
exports.resetDemoData = resetDemoData;
exports.exportTripsForSync = exportTripsForSync;
exports.clearDeletedItemIds = clearDeletedItemIds;
exports.getDeletedTripIdsForSync = getDeletedTripIdsForSync;
exports.isLocalTripsCleared = isLocalTripsCleared;
exports.reconcileClearedPlanState = reconcileClearedPlanState;
exports.importTripsFromSync = importTripsFromSync;
exports.getDefaultTrip = getDefaultTrip;
exports.getActiveTrip = getActiveTrip;
exports.setActiveTripId = setActiveTripId;
exports.clearActiveTripId = clearActiveTripId;
const id_1 = require("../utils/id");
const date_1 = require("../utils/date");
const storage_keys_1 = require("../constants/storage-keys");
const trip_sync_notify_1 = require("./trip-sync-notify");
const checklist_1 = require("./trip-store/checklist");
const expenses_1 = require("./trip-store/expenses");
const notes_1 = require("./trip-store/notes");
const schedules_1 = require("./trip-store/schedules");
const summary_1 = require("./trip-store/summary");
const trips_1 = require("./trip-store/trips");
var notes_2 = require("./trip-store/notes");
Object.defineProperty(exports, "getNoteCategories", { enumerable: true, get: function () { return notes_2.getNoteCategories; } });
var schedules_2 = require("./trip-store/schedules");
Object.defineProperty(exports, "getScheduleCategories", { enumerable: true, get: function () { return schedules_2.getScheduleCategories; } });
const STORAGE_KEY = storage_keys_1.STORAGE_KEYS.trips;
const ACTIVE_TRIP_KEY = storage_keys_1.STORAGE_KEYS.activeTripId;
const ACTIVE_TRIP_CLEARED_KEY = storage_keys_1.STORAGE_KEYS.activeTripCleared;
const PROFILE_KEY = storage_keys_1.STORAGE_KEYS.profile;
const DELETED_ITEMS_KEY = storage_keys_1.STORAGE_KEYS.deletedItems;
const DELETED_TRIPS_KEY = storage_keys_1.STORAGE_KEYS.deletedTrips;
const DATA_UPDATED_AT_KEY = storage_keys_1.STORAGE_KEYS.dataUpdatedAt;
const DATA_RESET_VERSION_KEY = storage_keys_1.STORAGE_KEYS.dataResetVersion;
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
    (0, trip_sync_notify_1.notifyTripDataChanged)();
    return trips;
}
function resetLocalDataOnce() {
    const resetVersion = wx.getStorageSync(DATA_RESET_VERSION_KEY) || 0;
    if (resetVersion >= storage_keys_1.CURRENT_DATA_RESET_VERSION)
        return;
    wx.setStorageSync(STORAGE_KEY, []);
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
    wx.removeStorageSync(ACTIVE_TRIP_CLEARED_KEY);
    wx.removeStorageSync(DELETED_ITEMS_KEY);
    wx.removeStorageSync(DELETED_TRIPS_KEY);
    wx.setStorageSync(DATA_RESET_VERSION_KEY, storage_keys_1.CURRENT_DATA_RESET_VERSION);
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
function getTrip(tripId) {
    return listTrips().find((trip) => trip.id === tripId);
}
function createTrip(input) {
    const current = (0, date_1.today)();
    const trip = (0, trips_1.createTripData)(input, (0, id_1.createId)("trip"), current);
    setActiveTripId(trip.id);
    writeTrips([trip, ...readTrips()]);
    return trip;
}
function updateTripInfo(tripId, input) {
    return updateTrip(tripId, (trip) => (0, trips_1.updateTripInfoInTrip)(trip, input));
}
function updateTripBudget(tripId, budget) {
    return updateTrip(tripId, (trip) => (0, trips_1.updateTripBudgetInTrip)(trip, budget));
}
function deleteTrip(tripId, _options) {
    markDeletedTrip(tripId);
    const activeTripId = wx.getStorageSync(ACTIVE_TRIP_KEY);
    const trips = readTrips().filter((trip) => trip.id !== tripId);
    if (trips.length === 0) {
        clearActiveTripId();
    }
    else if (!activeTripId || activeTripId === tripId) {
        setActiveTripId(trips[0].id);
    }
    writeTrips(trips);
    return getActiveTrip();
}
function addSchedule(tripId, item) {
    return updateTrip(tripId, (trip) => (0, schedules_1.addScheduleToTrip)(trip, item, (0, id_1.createId)("schedule")));
}
function updateSchedule(tripId, scheduleId, input) {
    return updateTrip(tripId, (trip) => (0, schedules_1.updateScheduleInTrip)(trip, scheduleId, input));
}
function deleteSchedule(tripId, scheduleId) {
    markDeletedItem(tripId, "schedules", scheduleId);
    return updateTrip(tripId, (trip) => (0, schedules_1.deleteScheduleFromTrip)(trip, scheduleId));
}
function addChecklistItem(tripId, title) {
    return updateTrip(tripId, (trip) => (0, checklist_1.addChecklistItemToTrip)(trip, title, (0, id_1.createId)("check")));
}
function toggleChecklistItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => (0, checklist_1.toggleChecklistItemInTrip)(trip, itemId));
}
function addNote(tripId, title, content, category = "物品") {
    return updateTrip(tripId, (trip) => (0, notes_1.addNoteToTrip)(trip, title, content, category, (0, id_1.createId)("note"), Date.now()));
}
function updateNote(tripId, noteId, input) {
    return updateTrip(tripId, (trip) => (0, notes_1.updateNoteInTrip)(trip, noteId, input));
}
function toggleNoteItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => (0, notes_1.toggleNoteInTrip)(trip, itemId));
}
function deleteNote(tripId, itemId) {
    markDeletedItem(tripId, "notes", itemId);
    return updateTrip(tripId, (trip) => (0, notes_1.deleteNoteFromTrip)(trip, itemId));
}
function addExpense(tripId, title, amount, category, paidBy, createdAt = Date.now()) {
    return updateTrip(tripId, (trip) => (0, expenses_1.addExpenseToTrip)(trip, title, amount, category, paidBy, (0, id_1.createId)("expense"), createdAt));
}
function updateExpense(tripId, expenseId, input) {
    return updateTrip(tripId, (trip) => (0, expenses_1.updateExpenseInTrip)(trip, expenseId, input));
}
function deleteExpense(tripId, expenseId) {
    markDeletedItem(tripId, "expenses", expenseId);
    return updateTrip(tripId, (trip) => (0, expenses_1.deleteExpenseFromTrip)(trip, expenseId));
}
function getDataUpdatedAt() {
    return wx.getStorageSync(DATA_UPDATED_AT_KEY) || 0;
}
function getSummary() {
    return (0, summary_1.getSummaryFromTrips)(listTrips());
}
function getExpenseByCategory() {
    return (0, expenses_1.getExpenseByCategoryFromTrips)(listTrips());
}
function resetDemoData() {
    wx.setStorageSync(STORAGE_KEY, []);
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
    wx.removeStorageSync(ACTIVE_TRIP_CLEARED_KEY);
    wx.removeStorageSync(DELETED_ITEMS_KEY);
    wx.removeStorageSync(DELETED_TRIPS_KEY);
    wx.setStorageSync(DATA_RESET_VERSION_KEY, storage_keys_1.CURRENT_DATA_RESET_VERSION);
    scheduleAutoSync([]);
    (0, trip_sync_notify_1.notifyTripDataChanged)();
}
function exportTripsForSync() {
    const deletedItems = readDeletedItemIds();
    return listTrips().map((trip) => {
        const syncDeletedIds = deletedItems[trip.id];
        return syncDeletedIds ? { ...trip, syncDeletedIds } : trip;
    });
}
function clearDeletedItemIds() {
    wx.removeStorageSync(DELETED_ITEMS_KEY);
    wx.removeStorageSync(DELETED_TRIPS_KEY);
}
function getDeletedTripIdsForSync() {
    return readDeletedTripIds();
}
function isLocalTripsCleared() {
    return Boolean(wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY));
}
function reconcileClearedPlanState() {
    if (!isLocalTripsCleared())
        return;
    const trips = readTrips();
    if (trips.length === 0)
        return;
    const activeTripId = wx.getStorageSync(ACTIVE_TRIP_KEY);
    if (activeTripId && trips.some((trip) => trip.id === activeTripId))
        return;
    writeTrips([], { skipAutoSync: true });
}
function importTripsFromSync(trips, options) {
    const activeTripId = wx.getStorageSync(ACTIVE_TRIP_KEY);
    const activeTripWasCleared = Boolean(wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY));
    const deletedTripIds = new Set(readDeletedTripIds());
    const normalizedTrips = trips.filter((trip) => !deletedTripIds.has(trip.id)).map(normalizeTrip);
    const localTrips = readTrips().map(normalizeTrip);
    const mergedTrips = options?.replace
        ? normalizedTrips
        : localTrips.length === 0 && activeTripWasCleared
            ? []
            : mergeTrips(localTrips, normalizedTrips);
    writeTrips(mergedTrips, { skipAutoSync: true });
    const stillActiveTrip = activeTripId ? mergedTrips.find((trip) => trip.id === activeTripId) : undefined;
    if (stillActiveTrip) {
        setActiveTripId(stillActiveTrip.id);
    }
    else if (activeTripWasCleared || (activeTripId && deletedTripIds.has(activeTripId))) {
        clearActiveTripId();
    }
    else if (!activeTripId && mergedTrips[0]) {
        setActiveTripId(mergedTrips[0].id);
    }
    else {
        clearActiveTripId();
    }
    return mergedTrips;
}
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
function getActiveTrip() {
    const activeTripId = wx.getStorageSync(ACTIVE_TRIP_KEY);
    const trips = listTrips();
    if (!activeTripId) {
        return wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY) ? undefined : trips[0];
    }
    return trips.find((trip) => trip.id === activeTripId);
}
function setActiveTripId(tripId) {
    wx.setStorageSync(ACTIVE_TRIP_KEY, tripId);
    wx.removeStorageSync(ACTIVE_TRIP_CLEARED_KEY);
}
function clearActiveTripId() {
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
    wx.setStorageSync(ACTIVE_TRIP_CLEARED_KEY, true);
}
function normalizeTrip(trip) {
    return {
        ...trip,
        budget: typeof trip.budget === "number" && Number.isFinite(trip.budget) ? trip.budget : 10000,
        schedules: trip.schedules.map((item) => ({
            ...item,
            category: item.category || "其他",
            time: item.time || "09:00",
            endTime: item.endTime || "",
            images: item.images || []
        })).sort(schedules_1.compareSchedule),
        notes: trip.notes.map((item) => ({
            ...item,
            category: (0, notes_1.normalizeNoteCategory)(String(item.category || "")),
            done: Boolean(item.done)
        })),
        sharedMembers: Array.isArray(trip.sharedMembers) ? trip.sharedMembers : []
    };
}
function mergeTrips(localTrips, cloudTrips) {
    const allowCloudBootstrap = localTrips.length === 0 && !wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY);
    const tripMap = new Map();
    localTrips.forEach((trip) => tripMap.set(trip.id, normalizeTrip(trip)));
    cloudTrips.forEach((trip) => {
        const localTrip = tripMap.get(trip.id);
        if (!localTrip) {
            if (allowCloudBootstrap) {
                tripMap.set(trip.id, normalizeTrip(trip));
            }
            return;
        }
        tripMap.set(trip.id, mergeTrip(localTrip, normalizeTrip(trip)));
    });
    return Array.from(tripMap.values()).sort((a, b) => {
        const aTime = new Date(a.startDate || "1970-01-01").getTime();
        const bTime = new Date(b.startDate || "1970-01-01").getTime();
        return bTime - aTime;
    });
}
function mergeTrip(localTrip, cloudTrip) {
    const deletedItems = readDeletedItemIds()[localTrip.id] || {};
    return normalizeTrip({
        ...cloudTrip,
        ...localTrip,
        schedules: removeDeletedItems(mergeById(localTrip.schedules, cloudTrip.schedules).sort(schedules_1.compareSchedule), deletedItems.schedules || []),
        checklist: removeDeletedItems(mergeById(localTrip.checklist, cloudTrip.checklist), deletedItems.checklist || []),
        notes: removeDeletedItems(mergeById(localTrip.notes, cloudTrip.notes).sort((a, b) => b.createdAt - a.createdAt), deletedItems.notes || []),
        expenses: removeDeletedItems(mergeById(localTrip.expenses, cloudTrip.expenses).sort((a, b) => b.createdAt - a.createdAt), deletedItems.expenses || []),
        sharedMembers: mergeById(localTrip.sharedMembers || [], cloudTrip.sharedMembers || [])
    });
}
function mergeById(localItems, cloudItems) {
    const itemMap = new Map();
    cloudItems.forEach((item) => {
        const key = item.id || item.openid;
        if (key)
            itemMap.set(key, item);
    });
    localItems.forEach((item) => {
        const key = item.id || item.openid;
        if (key)
            itemMap.set(key, item);
    });
    return Array.from(itemMap.values());
}
function removeDeletedItems(items, deletedIds) {
    if (!deletedIds.length)
        return items;
    const deletedIdSet = new Set(deletedIds);
    return items.filter((item) => !item.id || !deletedIdSet.has(item.id));
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
