const assert = require("assert");

const {
  addScheduleToTrip,
  deleteScheduleFromTrip,
  getScheduleCategories,
  updateScheduleInTrip
} = require("../miniprogram/services/trip-store/schedules");
const {
  addChecklistItemToTrip,
  toggleChecklistItemInTrip
} = require("../miniprogram/services/trip-store/checklist");
const {
  addNoteToTrip,
  deleteNoteFromTrip,
  getNoteCategories,
  normalizeNoteCategory,
  toggleNoteInTrip,
  updateNoteInTrip
} = require("../miniprogram/services/trip-store/notes");
const {
  addExpenseToTrip,
  deleteExpenseFromTrip,
  getExpenseByCategoryFromTrips,
  updateExpenseInTrip
} = require("../miniprogram/services/trip-store/expenses");
const {
  createTripData,
  updateTripBudgetInTrip,
  updateTripInfoInTrip
} = require("../miniprogram/services/trip-store/trips");
const { getSummaryFromTrips } = require("../miniprogram/services/trip-store/summary");

const baseTrip = createTripData(
  {
    name: "成都周末",
    destination: "成都",
    startDate: "2026-07-08",
    endDate: "2026-07-10"
  },
  "trip_1",
  "2026-07-08"
);

assert.strictEqual(baseTrip.id, "trip_1");
assert.strictEqual(baseTrip.budget, 10000);
assert.deepStrictEqual(getScheduleCategories(), ["景点", "交通", "住宿", "餐饮", "其他"]);
assert.deepStrictEqual(getNoteCategories(), ["物品", "事项", "预订", "攻略"]);
assert.strictEqual(normalizeNoteCategory("财务"), "事项");
assert.strictEqual(normalizeNoteCategory("证件"), "物品");
assert.strictEqual(normalizeNoteCategory("攻略"), "攻略");
assert.strictEqual(normalizeNoteCategory("未知"), "物品");

const withSchedules = addScheduleToTrip(
  addScheduleToTrip(baseTrip, {
    day: "2026-07-09",
    time: "10:00",
    category: "景点",
    title: "熊猫基地",
    place: "成都",
    note: "",
    images: []
  }, "schedule_2"),
  {
    day: "2026-07-08",
    time: "09:00",
    category: "交通",
    title: "高铁",
    place: "车站",
    note: "",
    images: []
  },
  "schedule_1"
);

assert.deepStrictEqual(
  withSchedules.schedules.map((item) => item.id),
  ["schedule_1", "schedule_2"]
);

const updatedScheduleTrip = updateScheduleInTrip(withSchedules, "schedule_2", {
    day: "2026-07-09",
    time: "08:30",
    category: "景点",
    title: "早到熊猫基地",
    place: "成都",
    note: "早点出发",
    images: []
  });
assert.deepStrictEqual(
  updatedScheduleTrip.schedules.map((item) => [item.id, item.time, item.title]),
  [
    ["schedule_1", "09:00", "高铁"],
    ["schedule_2", "08:30", "早到熊猫基地"]
  ]
);

assert.deepStrictEqual(
  deleteScheduleFromTrip(withSchedules, "schedule_1").schedules.map((item) => item.id),
  ["schedule_2"]
);

const withChecklist = toggleChecklistItemInTrip(
  addChecklistItemToTrip(baseTrip, "身份证", "check_1"),
  "check_1"
);
assert.deepStrictEqual(withChecklist.checklist, [
  { id: "check_1", title: "身份证", done: true }
]);

const withNotes = updateNoteInTrip(
  toggleNoteInTrip(
    addNoteToTrip(baseTrip, "酒店", "确认入住时间", "预订", "note_1", 1000),
    "note_1"
  ),
  "note_1",
  { title: "酒店预订", content: "14:00 后入住", category: "预订" }
);
assert.deepStrictEqual(withNotes.notes[0], {
  id: "note_1",
  title: "酒店预订",
  content: "14:00 后入住",
  category: "预订",
  done: true,
  createdAt: 1000
});
assert.deepStrictEqual(deleteNoteFromTrip(withNotes, "note_1").notes, []);

const withExpenses = updateExpenseInTrip(
  addExpenseToTrip(baseTrip, "火锅", 188, "餐饮", "我", "expense_1", 2000),
  "expense_1",
  { title: "火锅晚餐", amount: 208, category: "餐饮", paidBy: "我", createdAt: 3000 }
);
assert.deepStrictEqual(withExpenses.expenses[0], {
  id: "expense_1",
  title: "火锅晚餐",
  amount: 208,
  category: "餐饮",
  paidBy: "我",
  createdAt: 3000
});
assert.deepStrictEqual(deleteExpenseFromTrip(withExpenses, "expense_1").expenses, []);

assert.deepStrictEqual(getExpenseByCategoryFromTrips([withExpenses]), [
  { category: "交通", amount: 0 },
  { category: "住宿", amount: 0 },
  { category: "餐饮", amount: 208 },
  { category: "门票", amount: 0 },
  { category: "购物", amount: 0 },
  { category: "其他", amount: 0 }
]);

assert.deepStrictEqual(getSummaryFromTrips([withSchedules, withChecklist, withNotes, withExpenses]), {
  tripCount: 4,
  expenseTotal: 208,
  noteCount: 1,
  scheduleCount: 2,
  checklistDone: 1,
  checklistTotal: 1
});

assert.strictEqual(updateTripInfoInTrip(baseTrip, {
  name: "重庆周末",
  destination: "重庆",
  startDate: "2026-08-01",
  endDate: "2026-08-03"
}).destination, "重庆");
assert.strictEqual(updateTripBudgetInTrip(baseTrip, 5200).budget, 5200);

console.log("Trip store domain checks passed.");
