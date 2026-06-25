export type ExpenseCategory = "交通" | "住宿" | "餐饮" | "门票" | "购物" | "其他";
export type ScheduleCategory = "景点" | "交通" | "住宿" | "餐饮" | "其他";
export type NoteCategory = "证件" | "财务" | "物品" | "预订" | "事项";

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  category: ScheduleCategory;
  title: string;
  place: string;
  note: string;
  images: string[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  done: boolean;
  createdAt: number;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  createdAt: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverTone: "mint" | "sky" | "sunrise";
  schedules: ScheduleItem[];
  checklist: ChecklistItem[];
  notes: NoteItem[];
  expenses: ExpenseItem[];
  sharedMembers?: TripMember[];
}

export interface TripSummary {
  tripCount: number;
  expenseTotal: number;
  checklistDone: number;
  checklistTotal: number;
}

export interface TripMember {
  openid: string;
  nickname: string;
  avatarUrl?: string;
  updatedAt?: number;
}
