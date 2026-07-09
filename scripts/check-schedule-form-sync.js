const assert = require("assert");

const storage = new Map();
global.wx = {
  getStorageSync(key) {
    return storage.get(key);
  },
  setStorageSync(key, value) {
    storage.set(key, value);
  },
  removeStorageSync(key) {
    storage.delete(key);
  },
};

const {
  addScheduleWithLinkedItems,
  createTrip,
  getTrip,
} = require("../miniprogram/services/trip-store");

const trip = createTrip({
  name: "厦门周末小旅行",
  destination: "厦门",
  startDate: "2026-07-18",
  endDate: "2026-07-21",
});

addScheduleWithLinkedItems(trip.id, {
  schedule: {
    day: "2026-07-19",
    time: "09:30",
    endTime: "13:30",
    category: "景点",
    title: "鼓浪屿半日游",
    place: "鼓浪屿",
    note: "提前 20 分钟到码头",
    images: [],
  },
  notes: [
    {
      title: "提前购买鼓浪屿船票",
      content: "截图保存二维码",
      category: "预订",
    },
    {
      title: "带身份证",
      content: "登船可能需要核验身份",
      category: "物品",
    },
  ],
  expenses: [
    {
      title: "鼓浪屿往返船票",
      amount: 70,
      category: "交通",
      paidBy: "我",
      createdAt: new Date("2026-07-19T12:00:00").getTime(),
    },
    {
      title: "岛上午餐预算",
      amount: 160,
      category: "餐饮",
      paidBy: "我",
      createdAt: new Date("2026-07-19T12:00:00").getTime(),
    },
  ],
});

const saved = getTrip(trip.id);

assert.strictEqual(saved.schedules.length, 1);
assert.strictEqual(saved.notes.length, 2);
assert.strictEqual(saved.expenses.length, 2);
assert.strictEqual(saved.schedules[0].title, "鼓浪屿半日游");
assert.deepStrictEqual(
  saved.notes.map((item) => item.title).sort(),
  ["带身份证", "提前购买鼓浪屿船票"].sort(),
);
assert.strictEqual(
  saved.expenses.reduce((sum, item) => sum + item.amount, 0),
  230,
);

console.log("schedule form sync checks passed");
