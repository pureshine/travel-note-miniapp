import { deleteExpense as removeExpense, getDefaultTrip, listTrips, setActiveTripId } from "../../services/trip-store";
import { ExpenseCategory, ExpenseItem, Trip } from "../../types/trip";

type CalendarDay = {
  dateKey: string;
  day: string;
  amount: number;
  amountText: string;
  className: string;
};

type DailyBar = {
  label: string;
  amount: number;
  amountText: string;
  height: number;
  active: boolean;
};

Page({
  data: {
    trips: [] as Trip[],
    tripNames: [] as string[],
    activeTripIndex: 0,
    trip: undefined as Trip | undefined,
    expenseTotal: 0,
    categories: [] as Array<{ category: string; amount: number; percent: number }>,
    expenseCount: 0,
    averageExpense: 0,
    budget: 16800,
    remaining: 0,
    budgetPercent: 0,
    expenseTouchStartX: 0,
    openExpenseId: "",
    recentExpenses: [] as ExpenseItem[],
    weekLabels: ["日", "一", "二", "三", "四", "五", "六"],
    calendarTitle: "",
    calendarMonth: "",
    calendarMonthValue: "",
    calendarTouchStartX: 0,
    calendarDays: [] as CalendarDay[],
    selectedDateKey: "",
    selectedDateTitle: "今天",
    selectedDateExpenseTotal: 0,
    selectedDateExpenses: [] as ExpenseItem[],
    dailyBars: [] as DailyBar[]
  },

  onShow() {
    this.loadSelectedTrip();
  },

  loadSelectedTrip() {
    const trip = getDefaultTrip();
    const trips = listTrips();
    const expenses = trip.expenses;
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const categories = getCategories(expenses, expenseTotal);
    const budget = trip.budget || 16800;
    const selectedDateKey = this.data.selectedDateKey || formatDateKey(new Date());
    const calendarMonth = this.data.calendarMonth || selectedDateKey.slice(0, 7);
    const selectedDateExpenses = getExpensesByDate(expenses, selectedDateKey);
    this.setData({
      trips,
      tripNames: trips.map((item) => item.name),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
      trip,
      expenseTotal,
      categories,
      expenseCount: expenses.length,
      averageExpense: expenses.length > 0 ? Math.round(expenseTotal / expenses.length) : 0,
      budget,
      remaining: Math.max(budget - expenseTotal, 0),
      budgetPercent: Math.min(Math.round((expenseTotal / budget) * 100), 100),
      recentExpenses: expenses.slice(0, 4),
      selectedDateKey,
      selectedDateTitle: formatDateTitle(selectedDateKey),
      selectedDateExpenseTotal: selectedDateExpenses.reduce((sum, item) => sum + item.amount, 0),
      selectedDateExpenses,
      calendarMonth,
      calendarMonthValue: `${calendarMonth}-01`,
      calendarTitle: formatMonthTitle(parseMonth(calendarMonth)),
      calendarDays: buildCalendarDays(expenses, selectedDateKey, calendarMonth),
      dailyBars: buildDailyBars(expenses, calendarMonth)
    });
  },

  onTripChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    const trip = this.data.trips[index];
    if (!trip) return;
    setActiveTripId(trip.id);
    this.loadSelectedTrip();
  },

  goExpenseForm() {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}&date=${this.data.selectedDateKey}` });
  },

  goBudgetForm() {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/budget-form/budget-form?tripId=${this.data.trip.id}` });
  },

  selectCalendarDay(event: { currentTarget: { dataset: { date: string } } }) {
    const selectedDateKey = event.currentTarget.dataset.date;
    if (!selectedDateKey) return;
    this.setData({ selectedDateKey, calendarMonth: selectedDateKey.slice(0, 7) });
    this.loadSelectedTrip();
  },

  prevMonth() {
    this.changeMonth(-1);
  },

  nextMonth() {
    this.changeMonth(1);
  },

  onMonthChange(event: { detail: { value: string } }) {
    const calendarMonth = event.detail.value.slice(0, 7);
    this.setData({
      calendarMonth,
      selectedDateKey: `${calendarMonth}-01`
    });
    this.loadSelectedTrip();
  },

  changeMonth(offset: number) {
    const current = parseMonth(this.data.calendarMonth || formatDateKey(new Date()).slice(0, 7));
    current.setMonth(current.getMonth() + offset);
    const calendarMonth = formatMonthKey(current);
    this.setData({
      calendarMonth,
      selectedDateKey: `${calendarMonth}-01`
    });
    this.loadSelectedTrip();
  },

  onCalendarTouchStart(event: { changedTouches: Array<{ clientX: number }> }) {
    this.setData({ calendarTouchStartX: event.changedTouches[0].clientX });
  },

  onCalendarTouchEnd(event: { changedTouches: Array<{ clientX: number }> }) {
    const distance = event.changedTouches[0].clientX - this.data.calendarTouchStartX;
    if (Math.abs(distance) < 70) return;
    if (distance > 0) {
      this.prevMonth();
    } else {
      this.nextMonth();
    }
  },

  editExpense(event: { currentTarget: { dataset: { id: string } } }) {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}&expenseId=${event.currentTarget.dataset.id}` });
  },

  onExpenseTouchStart(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    this.setData({
      expenseTouchStartX: event.changedTouches[0].clientX,
      openExpenseId: this.data.openExpenseId === event.currentTarget.dataset.id ? this.data.openExpenseId : ""
    });
  },

  onExpenseTouchMove(event: { changedTouches: Array<{ clientX: number }>; currentTarget: { dataset: { id: string } } }) {
    const distance = this.data.expenseTouchStartX - event.changedTouches[0].clientX;
    const expenseId = event.currentTarget.dataset.id;
    if (distance > 40) {
      this.setData({ openExpenseId: expenseId });
    } else if (distance < -20 && this.data.openExpenseId === expenseId) {
      this.setData({ openExpenseId: "" });
    }
  },

  deleteExpense(event: { currentTarget: { dataset: { id: string } } }) {
    const expense = this.data.trip?.expenses.find((item) => item.id === event.currentTarget.dataset.id);
    if (!expense || !this.data.trip) return;
    wx.showModal({
      title: "删除消费",
      content: `确定删除“${expense.title}”吗？`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm || !this.data.trip) return;
        removeExpense(this.data.trip.id, expense.id);
        this.setData({ openExpenseId: "" });
        this.loadSelectedTrip();
      }
    });
  }
});

function getCategories(expenses: ExpenseItem[], total: number): Array<{ category: ExpenseCategory; amount: number; percent: number }> {
  const categories: ExpenseCategory[] = ["餐饮", "交通", "住宿", "购物", "门票", "其他"];
  let usedPercent = 0;
  return categories.map((category, index) => {
    const amount = expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
    const percent = total > 0 ? (index === categories.length - 1 ? Math.max(100 - usedPercent, 0) : Math.round((amount / total) * 100)) : 0;
    usedPercent += percent;
    return {
      category,
      amount,
      percent
    };
  });
}

function buildCalendarDays(expenses: ExpenseItem[], selectedDateKey: string, calendarMonth: string): CalendarDay[] {
  const currentMonth = parseMonth(calendarMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(1 - firstDay.getDay());
  const todayKey = formatDateKey(new Date());
  const amountByDate = groupAmountByDate(expenses);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = formatDateKey(date);
    const amount = amountByDate[dateKey] || 0;
    const classes = ["calendar-day"];
    if (date.getMonth() !== month) classes.push("muted");
    if (dateKey === todayKey) classes.push("today");
    if (dateKey === selectedDateKey) classes.push("selected");
    if (amount > 0) classes.push(amount > 500 ? "high" : "has-amount");
    return {
      dateKey,
      day: `${date.getDate()}`,
      amount,
      amountText: amount > 0 ? formatCompactAmount(amount) : "",
      className: classes.join(" ")
    };
  });
}

function buildDailyBars(expenses: ExpenseItem[], calendarMonth: string): DailyBar[] {
  const currentMonth = parseMonth(calendarMonth);
  const amountByDate = groupAmountByDate(expenses);
  const today = new Date();
  const isCurrentMonth = formatMonthKey(today) === calendarMonth;
  const endDay = isCurrentMonth ? today.getDate() : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = Math.max(1, endDay - 6);
  const days = Array.from({ length: endDay - startDay + 1 }).map((_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), startDay + index);
    const dateKey = formatDateKey(date);
    return {
      date,
      dateKey,
      amount: amountByDate[dateKey] || 0
    };
  });
  const maxAmount = Math.max(...days.map((item) => item.amount), 1);
  return days.map((item) => ({
    label: `${item.date.getDate()}日`,
    amount: item.amount,
    amountText: item.amount > 0 ? `¥${formatCompactAmount(item.amount)}` : "",
    height: Math.max(Math.round((item.amount / maxAmount) * 100), item.amount > 0 ? 12 : 4),
    active: item.dateKey === formatDateKey(today)
  }));
}

function getExpensesByDate(expenses: ExpenseItem[], dateKey: string): ExpenseItem[] {
  return expenses.filter((item) => formatDateKey(new Date(item.createdAt)) === dateKey);
}

function groupAmountByDate(expenses: ExpenseItem[]): Record<string, number> {
  return expenses.reduce((result, item) => {
    const dateKey = formatDateKey(new Date(item.createdAt));
    result[dateKey] = (result[dateKey] || 0) + item.amount;
    return result;
  }, {} as Record<string, number>);
}

function formatDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatMonthKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function parseMonth(monthKey: string): Date {
  return new Date(`${monthKey}-01T00:00:00`);
}

function formatDateTitle(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const todayKey = formatDateKey(new Date());
  if (dateKey === todayKey) return "今天";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function formatCompactAmount(amount: number): string {
  if (amount >= 1000) return `${Math.round(amount / 100) / 10}k`;
  return `${Math.round(amount)}`;
}
