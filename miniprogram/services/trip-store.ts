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

function seedTrips(): Trip[] {
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

function readTrips(): Trip[] {
  const stored = wx.getStorageSync<Trip[]>(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  const seeded = seedTrips();
  wx.setStorageSync(STORAGE_KEY, seeded);
  return seeded;
}

function writeTrips(trips: Trip[]): Trip[] {
  wx.setStorageSync(STORAGE_KEY, trips);
  return trips;
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

export function addSchedule(tripId: string, item: Omit<ScheduleItem, "id">): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    schedules: [{ ...item, id: createId("schedule") }, ...trip.schedules].sort(compareSchedule)
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

export function toggleNoteItem(tripId: string, itemId: string): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    notes: trip.notes.map((item: NoteItem) => (item.id === itemId ? { ...item, done: !item.done } : item))
  }));
}

export function addExpense(
  tripId: string,
  title: string,
  amount: number,
  category: ExpenseCategory,
  paidBy: string
): Trip | undefined {
  return updateTrip(tripId, (trip) => ({
    ...trip,
    expenses: [{ id: createId("expense"), title, amount, category, paidBy, createdAt: Date.now() }, ...trip.expenses]
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

function compareSchedule(a: ScheduleItem, b: ScheduleItem): number {
  return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
