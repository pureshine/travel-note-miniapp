import { addExpense, getTrip } from "../../services/trip-store";
import { ExpenseCategory, Trip } from "../../types/trip";

Page({
  data: {
    tripId: "",
    trip: undefined as Trip | undefined,
    title: "",
    amount: "",
    category: "餐饮" as ExpenseCategory,
    paidBy: "我",
    categories: ["交通", "住宿", "餐饮", "门票", "购物", "其他"] as ExpenseCategory[],
    total: 0
  },

  onLoad(options: { id?: string }) {
    if (!options.id) return;
    this.setData({ tripId: options.id });
    this.loadTrip(options.id);
  },

  loadTrip(tripId: string) {
    const trip = getTrip(tripId);
    this.setData({
      trip,
      total: trip ? trip.expenses.reduce((sum, item) => sum + item.amount, 0) : 0
    });
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
  }
});
