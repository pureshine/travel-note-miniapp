import {
  ChecklistItem,
  ExpenseCategory,
  ExpenseItem,
  NoteCategory,
  NoteItem,
  ScheduleCategory,
  ScheduleItem,
  Trip,
  TripSummary
} from "../types/trip";
import { createId } from "../utils/id";
import { today } from "../utils/date";

const STORAGE_KEY = "travel-note-trips";
const ACTIVE_TRIP_KEY = "travel-note-active-trip-id";
const PROFILE_KEY = "travel-note-profile";
const DELETED_ITEMS_KEY = "travel-note-deleted-item-ids";
const DATA_RESET_VERSION_KEY = "travel-note-data-reset-version";
const CURRENT_DATA_RESET_VERSION = 2;
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
  return trips;
}

function resetLocalDataOnce(): void {
  const resetVersion = wx.getStorageSync<number>(DATA_RESET_VERSION_KEY) || 0;
  if (resetVersion >= CURRENT_DATA_RESET_VERSION) return;
  wx.setStorageSync(STORAGE_KEY, []);
  wx.removeStorageSync(ACTIVE_TRIP_KEY);
  wx.removeStorageSync(DELETED_ITEMS_KEY);
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
  const trip: Trip = {
    id: createId("trip"),
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

export function updateTripInfo(
  tripId: string,
  input: { name: string; destination: string; startDate: string; endDate: string }
): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    name: input.name,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate
  }));
}

export function updateTripBudget(tripId: string, budget: number): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    budget
  }));
}

export function deleteTrip(tripId: string): Trip | undefined {
  const trips = readTrips().filter((trip) => trip.id !== tripId);
  writeTrips(trips);
  const nextTrip = trips[0];
  if (nextTrip) {
    setActiveTripId(nextTrip.id);
  } else {
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
  }
  return nextTrip;
}

export function addSchedule(tripId: string, item: Omit<ScheduleItem, "id">): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    schedules: [{ ...item, id: createId("schedule") }, ...trip.schedules].sort(compareSchedule)
  }));
}

export function updateSchedule(tripId: string, scheduleId: string, input: Omit<ScheduleItem, "id">): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    schedules: trip.schedules.map((item: ScheduleItem) => (item.id === scheduleId ? { ...input, id: item.id } : item)).sort(compareSchedule)
  }));
}

export function deleteSchedule(tripId: string, scheduleId: string): Trip | undefined {
  markDeletedItem(tripId, "schedules", scheduleId);
  return updateTrip(tripId, (trip) => ({
    ...trip,
    schedules: trip.schedules.filter((item: ScheduleItem) => item.id !== scheduleId)
  }));
}

export function addChecklistItem(tripId: string, title: string): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    checklist: [...trip.checklist, { id: createId("check"), title, done: false }]
  }));
}

export function toggleChecklistItem(tripId: string, itemId: string): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    checklist: trip.checklist.map((item: ChecklistItem) => (item.id === itemId ? { ...item, done: !item.done } : item))
  }));
}

export function addNote(tripId: string, title: string, content: string, category: NoteCategory = "事项"): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    notes: [{ id: createId("note"), title, content, category, done: false, createdAt: Date.now() }, ...trip.notes]
  }));
}

export function updateNote(
  tripId: string,
  noteId: string,
  input: { title: string; content: string; category: NoteCategory }
): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    notes: trip.notes.map((item: NoteItem) =>
      item.id === noteId
        ? {
            ...item,
            title: input.title,
            content: input.content,
            category: input.category
          }
        : item
    )
  }));
}

export function toggleNoteItem(tripId: string, itemId: string): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    notes: trip.notes.map((item: NoteItem) => (item.id === itemId ? { ...item, done: !item.done } : item))
  }));
}

export function deleteNote(tripId: string, itemId: string): Trip | undefined {
  markDeletedItem(tripId, "notes", itemId);
  return updateTrip(tripId, (trip) => ({
    ...trip,
    notes: trip.notes.filter((item: NoteItem) => item.id !== itemId)
  }));
}

export function addExpense(
  tripId: string,
  title: string,
  amount: number,
  category: ExpenseCategory,
  paidBy: string,
  createdAt: number = Date.now()
): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    expenses: [{ id: createId("expense"), title, amount, category, paidBy, createdAt }, ...trip.expenses]
  }));
}

export function updateExpense(
  tripId: string,
  expenseId: string,
  input: { title: string; amount: number; category: ExpenseCategory; paidBy: string; createdAt?: number }
): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    expenses: trip.expenses.map((item: ExpenseItem) =>
      item.id === expenseId
        ? {
            ...item,
            title: input.title,
            amount: input.amount,
            category: input.category,
            paidBy: input.paidBy,
            createdAt: input.createdAt || item.createdAt
          }
        : item
    )
  }));
}

export function deleteExpense(tripId: string, expenseId: string): Trip | undefined {
  markDeletedItem(tripId, "expenses", expenseId);
  return updateTrip(tripId, (trip) => ({
    ...trip,
    expenses: trip.expenses.filter((item: ExpenseItem) => item.id !== expenseId)
  }));
}

export function getSummary(): TripSummary {
  const trips = listTrips();
  const expenses = trips.flatMap((trip) => trip.expenses);
  const checklist = trips.flatMap((trip) => trip.checklist);

  return {
    tripCount: trips.length,
    expenseTotal: expenses.reduce((total: number, item: ExpenseItem) => total + item.amount, 0),
    checklistDone: checklist.filter((item) => item.done).length,
    checklistTotal: checklist.length
  };
}

export function getExpenseByCategory(): Array<{ category: ExpenseCategory; amount: number }> {
  const categories: ExpenseCategory[] = ["交通", "住宿", "餐饮", "门票", "购物", "其他"];
  const expenses = listTrips().flatMap((trip) => trip.expenses);
  return categories.map((category) => ({
    category,
    amount: expenses.filter((item) => item.category === category).reduce((total, item) => total + item.amount, 0)
  }));
}

export function resetDemoData(): void {
  writeTrips(seedTrips());
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
}

export function importTripsFromSync(trips: Trip[]): Trip[] {
  const normalizedTrips = trips.map(normalizeTrip);
  const localTrips = readTrips().map(normalizeTrip);
  const mergedTrips = mergeTrips(localTrips, normalizedTrips);
  writeTrips(mergedTrips, { skipAutoSync: true });
  const firstTrip = mergedTrips[0];
  if (firstTrip) {
    setActiveTripId(firstTrip.id);
  } else {
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
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

export function setActiveTripId(tripId: string): void {
  wx.setStorageSync(ACTIVE_TRIP_KEY, tripId);
}

export function getScheduleCategories(): ScheduleCategory[] {
  return ["景点", "交通", "住宿", "餐饮", "其他"];
}

export function getNoteCategories(): NoteCategory[] {
  return ["证件", "财务", "物品", "预订", "事项"];
}

function normalizeTrip(trip: Trip): Trip {
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

function mergeTrips(localTrips: Trip[], cloudTrips: Trip[]): Trip[] {
  const tripMap = new Map<string, Trip>();
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

function mergeTrip(localTrip: Trip, cloudTrip: Trip): Trip {
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

function mergeById<T extends { id?: string; openid?: string }>(localItems: T[], cloudItems: T[]): T[] {
  const itemMap = new Map<string, T>();
  localItems.forEach((item) => {
    const key = item.id || item.openid;
    if (key) itemMap.set(key, item);
  });
  cloudItems.forEach((item) => {
    const key = item.id || item.openid;
    if (key) itemMap.set(key, item);
  });
  return Array.from(itemMap.values());
}

function readDeletedItemIds(): DeletedItems {
  const stored = wx.getStorageSync<DeletedItems>(DELETED_ITEMS_KEY);
  return stored && typeof stored === "object" ? stored : {};
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

function compareSchedule(a: ScheduleItem, b: ScheduleItem): number {
  return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
