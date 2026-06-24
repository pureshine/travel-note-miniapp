import { getDefaultTrip } from "../../services/trip-store";
import { ExpenseCategory, ExpenseItem, Trip } from "../../types/trip";

Page({
  data: {
    trips: [] as Trip[],
    trip: undefined as Trip | undefined,
    expenseTotal: 0,
    categories: [] as Array<{ category: string; amount: number; percent: number }>,
    expenseCount: 0,
    averageExpense: 0,
    budget: 16800,
    remaining: 0,
    budgetPercent: 0,
    recentExpenses: [] as ExpenseItem[]
  },

  onShow() {
    const trip = getDefaultTrip();
    const expenses = trip.expenses;
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const categories = getCategories(expenses, expenseTotal);
    const budget = this.data.budget;
    this.setData({
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

  goExpenseForm() {
    if (!this.data.trip) return;
    wx.navigateTo({ url: `/pages/expense-form/expense-form?tripId=${this.data.trip.id}` });
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
