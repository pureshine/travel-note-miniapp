import {
  ExpenseCategory,
  NoteCategory,
  ScheduleItem,
  Trip
} from "../types/trip";
import { createId } from "../utils/id";
import { today } from "../utils/date";
import { STORAGE_KEYS, CURRENT_DATA_RESET_VERSION } from "../constants/storage-keys";
import { notifyTripDataChanged } from "./trip-sync-notify";
import {
  addChecklistItemToTrip,
  toggleChecklistItemInTrip
} from "./trip-store/checklist";
import {
  addExpenseToTrip,
  deleteExpenseFromTrip,
  getExpenseByCategoryFromTrips,
  updateExpenseInTrip
} from "./trip-store/expenses";
import {
  addNoteToTrip,
  deleteNoteFromTrip,
  normalizeNoteCategory,
  toggleNoteInTrip,
  updateNoteInTrip
} from "./trip-store/notes";
import {
  addScheduleToTrip,
  compareSchedule,
  deleteScheduleFromTrip,
  updateScheduleInTrip
} from "./trip-store/schedules";
import { getSummaryFromTrips } from "./trip-store/summary";
import {
  createTripData,
  updateTripBudgetInTrip,
  updateTripInfoInTrip
} from "./trip-store/trips";

export { getNoteCategories } from "./trip-store/notes";
export { getScheduleCategories } from "./trip-store/schedules";

const STORAGE_KEY = STORAGE_KEYS.trips;
const ACTIVE_TRIP_KEY = STORAGE_KEYS.activeTripId;
const ACTIVE_TRIP_CLEARED_KEY = STORAGE_KEYS.activeTripCleared;
const PROFILE_KEY = STORAGE_KEYS.profile;
const DELETED_ITEMS_KEY = STORAGE_KEYS.deletedItems;
const DELETED_TRIPS_KEY = STORAGE_KEYS.deletedTrips;
const DATA_UPDATED_AT_KEY = STORAGE_KEYS.dataUpdatedAt;
const DATA_RESET_VERSION_KEY = STORAGE_KEYS.dataResetVersion;
let autoSyncTimer: number | undefined;

interface StoredProfile {
  loggedIn: boolean;
  openid: string;
  nickname: string;
  avatarUrl?: string;
  loginAt: number;
  lastSyncAt?: number;
  previewMode?: boolean;
}

interface SyncMemberProfile {
  nickname: string;
  avatarUrl?: string;
}

type SyncItemCollection = "schedules" | "checklist" | "notes" | "expenses";
type DeletedItems = Record<string, Partial<Record<SyncItemCollection, string[]>>>;

function seedTrips(): Trip[] {
  return [];
}

function readTrips(): Trip[] {
  resetLocalDataOnce();
  const stored = wx.getStorageSync<Trip[]>(STORAGE_KEY);
  if (Array.isArray(stored)) return stored;
  const seeded = seedTrips();
  wx.setStorageSync(STORAGE_KEY, seeded);
  return seeded;
}

function writeTrips(trips: Trip[], options?: { skipAutoSync?: boolean }): Trip[] {
  wx.setStorageSync(STORAGE_KEY, trips);
  if (!options?.skipAutoSync) scheduleAutoSync(trips.map(normalizeTrip));
  notifyTripDataChanged();
  return trips;
}

function resetLocalDataOnce(): void {
  const resetVersion = wx.getStorageSync<number>(DATA_RESET_VERSION_KEY) || 0;
  if (resetVersion >= CURRENT_DATA_RESET_VERSION) return;
  wx.setStorageSync(STORAGE_KEY, []);
  wx.removeStorageSync(ACTIVE_TRIP_KEY);
  wx.removeStorageSync(ACTIVE_TRIP_CLEARED_KEY);
  wx.removeStorageSync(DELETED_ITEMS_KEY);
  wx.removeStorageSync(DELETED_TRIPS_KEY);
  wx.setStorageSync(DATA_RESET_VERSION_KEY, CURRENT_DATA_RESET_VERSION);
}

function scheduleAutoSync(trips: Trip[]): void {
  const profile = wx.getStorageSync<StoredProfile>(PROFILE_KEY);
  if (!profile?.loggedIn || !profile.openid || profile.previewMode || !wx.cloud) return;

  if (autoSyncTimer) clearTimeout(autoSyncTimer);
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
        const result = res.result as { updatedAt?: number };
        const latestProfile = wx.getStorageSync<StoredProfile>(PROFILE_KEY);
        if (!latestProfile?.loggedIn) return;
        clearDeletedItemIds();
        wx.setStorageSync(PROFILE_KEY, {
          ...latestProfile,
          lastSyncAt: result.updatedAt || Date.now()
        });
      },
      fail: (error) => {
        const latestProfile = wx.getStorageSync<StoredProfile>(PROFILE_KEY);
        if (!latestProfile?.loggedIn) return;
        wx.setStorageSync(PROFILE_KEY, {
          ...latestProfile,
          lastAutoSyncFailedAt: Date.now(),
          lastAutoSyncError: error.errMsg || "自动同步失败"
        });
      }
    });
  }, 1600) as unknown as number;
}

function getSyncMemberProfile(profile: StoredProfile): SyncMemberProfile {
  return {
    nickname: profile.nickname?.trim() || "未设置名字",
    avatarUrl: profile.avatarUrl || ""
  };
}

function updateTrip(tripId: string, updater: (trip: Trip) => Trip): Trip | undefined {
  const trips = readTrips();
  const nextTrips = trips.map((trip) => (trip.id === tripId ? updater(trip) : trip));
  writeTrips(nextTrips);
  return nextTrips.find((trip) => trip.id === tripId);
}

export function listTrips(): Trip[] {
  return readTrips().map(normalizeTrip);
}

export function getTrip(tripId: string): Trip | undefined {
  return listTrips().find((trip) => trip.id === tripId);
}

export function createTrip(input?: { name?: string; destination?: string; startDate?: string; endDate?: string }): Trip {
  const current = today();
  const trip = createTripData(input, createId("trip"), current);
  setActiveTripId(trip.id);
  writeTrips([trip, ...readTrips()]);
  return trip;
}

export function updateTripInfo(
  tripId: string,
  input: { name: string; destination: string; startDate: string; endDate: string }
): Trip | undefined {
  return updateTrip(tripId, (trip) => updateTripInfoInTrip(trip, input));
}

export function updateTripBudget(tripId: string, budget: number): Trip | undefined {
  return updateTrip(tripId, (trip) => updateTripBudgetInTrip(trip, budget));
}

export function deleteTrip(tripId: string, _options?: { clearActive?: boolean }): Trip | undefined {
  markDeletedTrip(tripId);
  const activeTripId = wx.getStorageSync<string>(ACTIVE_TRIP_KEY);
  const trips = readTrips().filter((trip) => trip.id !== tripId);
  if (trips.length === 0) {
    clearActiveTripId();
  } else if (!activeTripId || activeTripId === tripId) {
    setActiveTripId(trips[0].id);
  }
  writeTrips(trips);
  return getActiveTrip();
}

export function addSchedule(tripId: string, item: Omit<ScheduleItem, "id">): Trip | undefined {
  return updateTrip(tripId, (trip) =>
    addScheduleToTrip(trip, item, createId("schedule"))
  );
}

export function updateSchedule(tripId: string, scheduleId: string, input: Omit<ScheduleItem, "id">): Trip | undefined {
  return updateTrip(tripId, (trip) => updateScheduleInTrip(trip, scheduleId, input));
}

export function deleteSchedule(tripId: string, scheduleId: string): Trip | undefined {
  markDeletedItem(tripId, "schedules", scheduleId);
  return updateTrip(tripId, (trip) => deleteScheduleFromTrip(trip, scheduleId));
}

export function addChecklistItem(tripId: string, title: string): Trip | undefined {
  return updateTrip(tripId, (trip) =>
    addChecklistItemToTrip(trip, title, createId("check"))
  );
}

export function toggleChecklistItem(tripId: string, itemId: string): Trip | undefined {
  return updateTrip(tripId, (trip) => toggleChecklistItemInTrip(trip, itemId));
}

export function addNote(tripId: string, title: string, content: string, category: NoteCategory = "物品"): Trip | undefined {
  return updateTrip(tripId, (trip) =>
    addNoteToTrip(trip, title, content, category, createId("note"), Date.now())
  );
}

export function updateNote(
  tripId: string,
  noteId: string,
  input: { title: string; content: string; category: NoteCategory }
): Trip | undefined {
  return updateTrip(tripId, (trip) => updateNoteInTrip(trip, noteId, input));
}

export function toggleNoteItem(tripId: string, itemId: string): Trip | undefined {
  return updateTrip(tripId, (trip) => toggleNoteInTrip(trip, itemId));
}

export function deleteNote(tripId: string, itemId: string): Trip | undefined {
  markDeletedItem(tripId, "notes", itemId);
  return updateTrip(tripId, (trip) => deleteNoteFromTrip(trip, itemId));
}

export function addExpense(
  tripId: string,
  title: string,
  amount: number,
  category: ExpenseCategory,
  paidBy: string,
  createdAt: number = Date.now()
): Trip | undefined {
  return updateTrip(tripId, (trip) =>
    addExpenseToTrip(
      trip,
      title,
      amount,
      category,
      paidBy,
      createId("expense"),
      createdAt
    )
  );
}

export function updateExpense(
  tripId: string,
  expenseId: string,
  input: { title: string; amount: number; category: ExpenseCategory; paidBy: string; createdAt?: number }
): Trip | undefined {
  return updateTrip(tripId, (trip) => updateExpenseInTrip(trip, expenseId, input));
}

export function deleteExpense(tripId: string, expenseId: string): Trip | undefined {
  markDeletedItem(tripId, "expenses", expenseId);
  return updateTrip(tripId, (trip) => deleteExpenseFromTrip(trip, expenseId));
}

export function getDataUpdatedAt(): number {
  return wx.getStorageSync<number>(DATA_UPDATED_AT_KEY) || 0;
}

export function getSummary() {
  return getSummaryFromTrips(listTrips());
}

export function getExpenseByCategory(): Array<{ category: ExpenseCategory; amount: number }> {
  return getExpenseByCategoryFromTrips(listTrips());
}

export function resetDemoData(): void {
  wx.setStorageSync(STORAGE_KEY, []);
  wx.removeStorageSync(ACTIVE_TRIP_KEY);
  wx.removeStorageSync(ACTIVE_TRIP_CLEARED_KEY);
  wx.removeStorageSync(DELETED_ITEMS_KEY);
  wx.removeStorageSync(DELETED_TRIPS_KEY);
  wx.setStorageSync(DATA_RESET_VERSION_KEY, CURRENT_DATA_RESET_VERSION);
  scheduleAutoSync([]);
  notifyTripDataChanged();
}

export function exportTripsForSync(): Trip[] {
  const deletedItems = readDeletedItemIds();
  return listTrips().map((trip) => {
    const syncDeletedIds = deletedItems[trip.id];
    return syncDeletedIds ? ({ ...trip, syncDeletedIds } as Trip) : trip;
  });
}

export function clearDeletedItemIds(): void {
  wx.removeStorageSync(DELETED_ITEMS_KEY);
  wx.removeStorageSync(DELETED_TRIPS_KEY);
}

export function getDeletedTripIdsForSync(): string[] {
  return readDeletedTripIds();
}

export function isLocalTripsCleared(): boolean {
  return Boolean(wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY));
}

export function reconcileClearedPlanState(): void {
  if (!isLocalTripsCleared()) return;
  const trips = readTrips();
  if (trips.length === 0) return;
  const activeTripId = wx.getStorageSync<string>(ACTIVE_TRIP_KEY);
  if (activeTripId && trips.some((trip) => trip.id === activeTripId)) return;
  writeTrips([], { skipAutoSync: true });
}

export function importTripsFromSync(trips: Trip[], options?: { replace?: boolean }): Trip[] {
  const activeTripId = wx.getStorageSync<string>(ACTIVE_TRIP_KEY);
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
  } else if (activeTripWasCleared || (activeTripId && deletedTripIds.has(activeTripId))) {
    clearActiveTripId();
  } else if (!activeTripId && mergedTrips[0]) {
    setActiveTripId(mergedTrips[0].id);
  } else {
    clearActiveTripId();
  }
  return mergedTrips;
}

export function getDefaultTrip(): Trip {
  const activeTripId = wx.getStorageSync<string>(ACTIVE_TRIP_KEY);
  const trips = listTrips();
  const activeTrip = trips.find((trip) => trip.id === activeTripId);
  if (activeTrip) return activeTrip;
  if (trips.length > 0) return trips[0];
  return createTrip();
}

export function getActiveTrip(): Trip | undefined {
  const activeTripId = wx.getStorageSync<string>(ACTIVE_TRIP_KEY);
  const trips = listTrips();
  if (!activeTripId) {
    return wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY) ? undefined : trips[0];
  }
  return trips.find((trip) => trip.id === activeTripId);
}

export function setActiveTripId(tripId: string): void {
  wx.setStorageSync(ACTIVE_TRIP_KEY, tripId);
  wx.removeStorageSync(ACTIVE_TRIP_CLEARED_KEY);
}

export function clearActiveTripId(): void {
  wx.removeStorageSync(ACTIVE_TRIP_KEY);
  wx.setStorageSync(ACTIVE_TRIP_CLEARED_KEY, true);
}

function normalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    budget: typeof trip.budget === "number" && Number.isFinite(trip.budget) ? trip.budget : 10000,
    schedules: trip.schedules.map((item) => ({
      ...item,
      category: item.category || "其他",
      time: item.time || "09:00",
      endTime: item.endTime || "",
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

function mergeTrips(localTrips: Trip[], cloudTrips: Trip[]): Trip[] {
  const allowCloudBootstrap = localTrips.length === 0 && !wx.getStorageSync(ACTIVE_TRIP_CLEARED_KEY);
  const tripMap = new Map<string, Trip>();
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

function mergeTrip(localTrip: Trip, cloudTrip: Trip): Trip {
  const deletedItems = readDeletedItemIds()[localTrip.id] || {};
  return normalizeTrip({
    ...cloudTrip,
    ...localTrip,
    schedules: removeDeletedItems(
      mergeById(localTrip.schedules, cloudTrip.schedules).sort(compareSchedule),
      deletedItems.schedules || []
    ),
    checklist: removeDeletedItems(
      mergeById(localTrip.checklist, cloudTrip.checklist),
      deletedItems.checklist || []
    ),
    notes: removeDeletedItems(
      mergeById(localTrip.notes, cloudTrip.notes).sort((a, b) => b.createdAt - a.createdAt),
      deletedItems.notes || []
    ),
    expenses: removeDeletedItems(
      mergeById(localTrip.expenses, cloudTrip.expenses).sort((a, b) => b.createdAt - a.createdAt),
      deletedItems.expenses || []
    ),
    sharedMembers: mergeById(localTrip.sharedMembers || [], cloudTrip.sharedMembers || [])
  });
}

function mergeById<T extends { id?: string; openid?: string }>(localItems: T[], cloudItems: T[]): T[] {
  const itemMap = new Map<string, T>();
  cloudItems.forEach((item) => {
    const key = item.id || item.openid;
    if (key) itemMap.set(key, item);
  });
  localItems.forEach((item) => {
    const key = item.id || item.openid;
    if (key) itemMap.set(key, item);
  });
  return Array.from(itemMap.values());
}

function removeDeletedItems<T extends { id?: string }>(items: T[], deletedIds: string[]): T[] {
  if (!deletedIds.length) return items;
  const deletedIdSet = new Set(deletedIds);
  return items.filter((item) => !item.id || !deletedIdSet.has(item.id));
}

function readDeletedItemIds(): DeletedItems {
  const stored = wx.getStorageSync<DeletedItems>(DELETED_ITEMS_KEY);
  return stored && typeof stored === "object" ? stored : {};
}

function readDeletedTripIds(): string[] {
  const stored = wx.getStorageSync<string[]>(DELETED_TRIPS_KEY);
  return Array.isArray(stored) ? stored.filter((id) => typeof id === "string" && id) : [];
}

function markDeletedTrip(tripId: string): void {
  const deletedTripIds = readDeletedTripIds();
  wx.setStorageSync(DELETED_TRIPS_KEY, Array.from(new Set([...deletedTripIds, tripId])));
  const deletedItems = readDeletedItemIds();
  if (deletedItems[tripId]) {
    const nextDeletedItems = { ...deletedItems };
    delete nextDeletedItems[tripId];
    wx.setStorageSync(DELETED_ITEMS_KEY, nextDeletedItems);
  }
}

function markDeletedItem(tripId: string, collection: SyncItemCollection, itemId: string): void {
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
