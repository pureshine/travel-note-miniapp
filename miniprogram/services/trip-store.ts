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

function seedTrips(): Trip[] {
  return [
    {
      id: "trip_seed_1",
      name: "厦门周末小旅行",
      destination: "厦门",
      startDate: "2026-07-10",
      endDate: "2026-07-12",
      budget: 16800,
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
      expenses: []
    }
  ];
}

function readTrips(): Trip[] {
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
    budget: 16800,
    coverTone: "sky",
    schedules: [],
    checklist: [
      { id: createId("check"), title: "身份证件", done: false },
      { id: createId("check"), title: "充电器", done: false }
    ],
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
  return listTrips();
}

export function importTripsFromSync(trips: Trip[]): Trip[] {
  const normalizedTrips = trips.map(normalizeTrip);
  writeTrips(normalizedTrips, { skipAutoSync: true });
  const firstTrip = normalizedTrips[0];
  if (firstTrip) {
    setActiveTripId(firstTrip.id);
  } else {
    wx.removeStorageSync(ACTIVE_TRIP_KEY);
  }
  return normalizedTrips;
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
    budget: typeof trip.budget === "number" && Number.isFinite(trip.budget) ? trip.budget : 16800,
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

function compareSchedule(a: ScheduleItem, b: ScheduleItem): number {
  return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
