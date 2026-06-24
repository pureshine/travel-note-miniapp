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
    categories: ["餐饮", "交通", "住宿", "购物", "门票", "其他"] as ExpenseCategory[]
  },

  onLoad(options: { tripId?: string }) {
    if (!options.tripId) return;
    this.setData({
      tripId: options.tripId,
      trip: getTrip(options.tripId)
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

  saveExpense() {
    const title = this.data.title.trim();
    const amount = Number(this.data.amount);
    if (!title || !Number.isFinite(amount) || amount <= 0) {
      wx.showToast({ title: "填写消费和金额", icon: "none" });
      return;
    }
    addExpense(this.data.tripId, title, amount, this.data.category, this.data.paidBy || "我");
    wx.navigateBack();
  }
});
