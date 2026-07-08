"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.getScheduleCategories = getScheduleCategories;
exports.getNoteCategories = getNoteCategories;
const id_1 = require("../utils/id");
const date_1 = require("../utils/date");
const storage_keys_1 = require("../constants/storage-keys");
const trip_sync_notify_1 = require("./trip-sync-notify");
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
    setActiveTripId(trip.id);
    writeTrips([trip, ...readTrips()]);
    return trip;
}
function updateTripInfo(tripId, input) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        name: input.name,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate
    }));
}
function updateTripBudget(tripId, budget) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        budget
    }));
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
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: [{ ...item, id: (0, id_1.createId)("schedule") }, ...trip.schedules].sort(compareSchedule)
    }));
}
function updateSchedule(tripId, scheduleId, input) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: trip.schedules.map((item) => (item.id === scheduleId ? { ...input, id: item.id } : item)).sort(compareSchedule)
    }));
}
function deleteSchedule(tripId, scheduleId) {
    markDeletedItem(tripId, "schedules", scheduleId);
    return updateTrip(tripId, (trip) => ({
        ...trip,
        schedules: trip.schedules.filter((item) => item.id !== scheduleId)
    }));
}
function addChecklistItem(tripId, title) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        checklist: [...trip.checklist, { id: (0, id_1.createId)("check"), title, done: false }]
    }));
}
function toggleChecklistItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        checklist: trip.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    }));
}
function addNote(tripId, title, content, category = "物品") {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: [{ id: (0, id_1.createId)("note"), title, content, category, done: false, createdAt: Date.now() }, ...trip.notes]
    }));
}
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
function toggleNoteItem(tripId, itemId) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: trip.notes.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    }));
}
function deleteNote(tripId, itemId) {
    markDeletedItem(tripId, "notes", itemId);
    return updateTrip(tripId, (trip) => ({
        ...trip,
        notes: trip.notes.filter((item) => item.id !== itemId)
    }));
}
function addExpense(tripId, title, amount, category, paidBy, createdAt = Date.now()) {
    return updateTrip(tripId, (trip) => ({
        ...trip,
        expenses: [{ id: (0, id_1.createId)("expense"), title, amount, category, paidBy, createdAt }, ...trip.expenses]
    }));
}
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
function deleteExpense(tripId, expenseId) {
    markDeletedItem(tripId, "expenses", expenseId);
    return updateTrip(tripId, (trip) => ({
        ...trip,
        expenses: trip.expenses.filter((item) => item.id !== expenseId)
    }));
}
function getDataUpdatedAt() {
    return wx.getStorageSync(DATA_UPDATED_AT_KEY) || 0;
}
function getSummary() {
    const trips = listTrips();
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
function getExpenseByCategory() {
    const categories = ["交通", "住宿", "餐饮", "门票", "购物", "其他"];
    const expenses = listTrips().flatMap((trip) => trip.expenses);
    return categories.map((category) => ({
        category,
        amount: expenses.filter((item) => item.category === category).reduce((total, item) => total + item.amount, 0)
    }));
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
function getScheduleCategories() {
    return ["景点", "交通", "住宿", "餐饮", "其他"];
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
            category: normalizeNoteCategory(String(item.category || "")),
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
        schedules: removeDeletedItems(mergeById(localTrip.schedules, cloudTrip.schedules).sort(compareSchedule), deletedItems.schedules || []),
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
function compareSchedule(a, b) {
    return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
