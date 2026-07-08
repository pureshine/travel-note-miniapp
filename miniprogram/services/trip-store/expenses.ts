import { ExpenseCategory, ExpenseItem, Trip } from "../../types/trip";

export function addExpenseToTrip(
  trip: Trip,
  title: string,
  amount: number,
  category: ExpenseCategory,
  paidBy: string,
  id: string,
  createdAt: number
): Trip {
  return {
    ...trip,
    expenses: [{ id, title, amount, category, paidBy, createdAt }, ...trip.expenses]
  };
}

export function updateExpenseInTrip(
  trip: Trip,
  expenseId: string,
  input: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    paidBy: string;
    createdAt?: number;
  }
): Trip {
  return {
    ...trip,
    expenses: trip.expenses.map((item: ExpenseItem) =>
      item.id === expenseId
        ? {
            ...item,
            title: input.title,
            amount: input.amount,
            category: input.category,
            paidBy: input.paidBy,
            createdAt: input.createdAt || item.createdAt
          }
        : item
    )
  };
}

export function deleteExpenseFromTrip(trip: Trip, expenseId: string): Trip {
  return {
    ...trip,
    expenses: trip.expenses.filter((item: ExpenseItem) => item.id !== expenseId)
  };
}

export function getExpenseByCategoryFromTrips(
  trips: Trip[]
): Array<{ category: ExpenseCategory; amount: number }> {
  const categories: ExpenseCategory[] = ["交通", "住宿", "餐饮", "门票", "购物", "其他"];
  const expenses = trips.flatMap((trip) => trip.expenses);
  return categories.map((category) => ({
    category,
    amount: expenses
      .filter((item) => item.category === category)
      .reduce((total, item) => total + item.amount, 0)
  }));
}
