export const PAGE_ROUTES = {
  index: "pages/index/index",
  trips: "pages/trips/trips",
  schedule: "pages/schedule/schedule",
  notes: "pages/notes/notes",
  stats: "pages/stats/stats",
  expenses: "pages/expenses/expenses",
  profile: "pages/profile/profile"
} as const;

export const PAGE_PATHS = {
  schedule: "/pages/schedule/schedule",
  notes: "/pages/notes/notes",
  stats: "/pages/stats/stats",
  profile: "/pages/profile/profile",
  tripForm: "/pages/trip-form/trip-form",
  scheduleForm: "/pages/schedule-form/schedule-form",
  noteForm: "/pages/note-form/note-form",
  expenseForm: "/pages/expense-form/expense-form",
  budgetForm: "/pages/budget-form/budget-form",
  profileEdit: "/pages/profile-edit/profile-edit",
  settings: "/pages/settings/settings"
} as const;
