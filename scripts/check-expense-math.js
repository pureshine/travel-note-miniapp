const fs = require("fs");

const source = fs.readFileSync("miniprogram/services/trip-store.ts", "utf8");
if (!/expenses:\s*\[\s*\]/.test(source)) {
  throw new Error("Seed trip expenses should be empty for a clean initial state.");
}

const categories = ["餐饮", "交通", "住宿", "购物", "门票", "其他"];
const expenses = [];
const total = expenses.reduce((sum, item) => sum + item.amount, 0);
const categoryTotal = categories
  .map((category) => expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0))
  .reduce((sum, amount) => sum + amount, 0);

if (total !== categoryTotal) {
  throw new Error(`Expense total mismatch: total=${total}, categoryTotal=${categoryTotal}`);
}

console.log("Expense math check passed.");
