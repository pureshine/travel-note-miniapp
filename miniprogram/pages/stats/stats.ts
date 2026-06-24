import { deleteExpense as removeExpense, getDefaultTrip, listTrips, setActiveTripId } from "../../services/trip-store";
import { ExpenseCategory, ExpenseItem, Trip } from "../../types/trip";

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
    recentExpenses: [] as ExpenseItem[]
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
    const budget = this.data.budget;
    this.setData({
      trips,
      tripNames: trips.map((item) => item.name),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === trip.id), 0),
      trip,
      expenseTotal,
      categories,
      expenseCount: expenses.length,
      averageExpense: expenses.length > 0 ? Math.round(expenseTotal / expenses.length) : 0,
      remaining: Math.max(budget - expenseTotal, 0),
      budgetPercent: Math.min(Math.round((expenseTotal / budget) * 100), 100),
      recentExpenses: expenses.slice(0, 4)
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
    wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}` });
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
  return categories.map((category) => {
    const amount = expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
    return {
      category,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0
    };
  });
}
