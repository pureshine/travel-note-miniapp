import { addExpense, deleteExpense as removeExpense, getDefaultTrip, getTrip, listTrips, setActiveTripId } from "../../services/trip-store";
import { ExpenseCategory, Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    trips: [] as Trip[],
    tripNames: [] as string[],
    activeTripIndex: 0,
    expenseTouchStartX: 0,
    openExpenseId: "",
    title: "",
    amount: "",
    category: "餐饮" as ExpenseCategory,
    paidBy: "我",
    categories: ["交通", "住宿", "餐饮", "门票", "购物", "其他"] as ExpenseCategory[],
    total: 0
  },

  onLoad(options: { id?: string }) {
    if (options.id) setActiveTripId(options.id);
    this.loadSelectedTrip();
  },

  onShow() {
    this.loadSelectedTrip();
  },

  loadSelectedTrip() {
    const trip = getDefaultTrip();
    this.loadTrip(trip.id);
  },

  loadTrip(tripId: string) {
    const trip = getTrip(tripId);
    const trips = listTrips();
    this.setData({
      tripId,
      trip,
      trips,
      tripNames: trips.map((item) => item.name),
      activeTripIndex: Math.max(trips.findIndex((item) => item.id === tripId), 0),
      total: trip ? trip.expenses.reduce((sum, item) => sum + item.amount, 0) : 0
    });
  },

  onTripChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    const trip = this.data.trips[index];
    if (!trip) return;
    setActiveTripId(trip.id);
    this.loadTrip(trip.id);
  },

  onTitleInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value });
  },

  onAmountInput(event: { detail: { value: string } }) {
    this.setData({ amount: event.detail.value });
  },

  onPaidByInput(event: { detail: { value: string } }) {
    this.setData({ paidBy: event.detail.value });
  },

  onCategoryChange(event: { detail: { value: string } }) {
    const index = Number(event.detail.value);
    this.setData({ category: this.data.categories[index] });
  },

  addItem() {
    const title = this.data.title.trim();
    const amount = Number(this.data.amount);
    if (!title || !Number.isFinite(amount) || amount <= 0) {
      wx.showToast({ title: "填写消费和金额", icon: "none" });
      return;
    }
    addExpense(this.data.tripId, title, amount, this.data.category, this.data.paidBy || "我");
    this.setData({ title: "", amount: "" });
    this.loadTrip(this.data.tripId);
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

  editExpense(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.tripId}&expenseId=${event.currentTarget.dataset.id}` });
  },

  deleteExpense(event: { currentTarget: { dataset: { id: string } } }) {
    const expense = this.data.trip?.expenses.find((item) => item.id === event.currentTarget.dataset.id);
    if (!expense) return;
    wx.showModal({
      title: "删除消费",
      content: `确定删除“${expense.title}”吗？`,
      confirmText: "删除",
      confirmColor: "#dc2626",
      success: (result) => {
        if (!result.confirm) return;
        removeExpense(this.data.tripId, expense.id);
        this.setData({ openExpenseId: "" });
        this.loadTrip(this.data.tripId);
      }
    });
  }
});
