const assert = require("assert");

const {
  createCategoryFilterOptions,
  createDateFilterOptions,
  createScheduleViews,
  filterSchedules,
  groupSchedulesByYear,
  sortScheduleViews
} = require("../miniprogram/utils/schedule-view");

const now = new Date("2026-07-08T09:30:00").getTime();
const schedules = [
  {
    id: "done",
    day: "2026-07-07",
    time: "09:00",
    endTime: "10:00",
    category: "景点",
    title: "昨天景点",
    place: "A",
    note: "",
    images: []
  },
  {
    id: "active",
    day: "2026-07-08",
    time: "09:00",
    endTime: "10:00",
    category: "交通",
    title: "当前交通",
    place: "B",
    note: "",
    images: []
  },
  {
    id: "pending",
    day: "2026-07-09",
    time: "08:00",
    endTime: "",
    category: "住宿",
    title: "明天住宿",
    place: "C",
    note: "",
    images: []
  }
];

const views = createScheduleViews(schedules, now);

assert.deepStrictEqual(
  views.map((item) => [item.id, item.status, item.statusClass, item.timeRange]),
  [
    ["done", "已完成", "done", "09:00 - 10:00"],
    ["active", "进行中", "active", "09:00 - 10:00"],
    ["pending", "待出发", "pending", "08:00"]
  ]
);

assert.deepStrictEqual(
  sortScheduleViews(views).map((item) => item.id),
  ["active", "pending", "done"]
);

assert.deepStrictEqual(
  filterSchedules(views, "2026-07-08", "进行中", "交通").map((item) => item.id),
  ["active"]
);

assert.deepStrictEqual(createDateFilterOptions(views), [
  { label: "全部日期", value: "all" },
  { label: "7.7 2026", value: "2026-07-07" },
  { label: "7.8 2026", value: "2026-07-08" },
  { label: "7.9 2026", value: "2026-07-09" }
]);

assert.deepStrictEqual(createCategoryFilterOptions(views), [
  "全部类型",
  "交通",
  "住宿",
  "景点"
]);

assert.deepStrictEqual(
  groupSchedulesByYear(views).map((group) => [
    group.year,
    group.items.map((item) => item.id)
  ]),
  [["2026", ["done", "active", "pending"]]]
);

console.log("Schedule view checks passed.");
