import { ScheduleItem } from "../types/trip";
import { formatScheduleDate } from "./trip-view";

export type ScheduleStatus = "已完成" | "进行中" | "待出发";
export type ScheduleStatusFilter = "全部" | ScheduleStatus;
export type ScheduleCategoryFilter = "全部类型" | ScheduleItem["category"];

export type ScheduleView = ScheduleItem & {
  year: string;
  monthDay: string;
  status: ScheduleStatus;
  statusClass: string;
  active: boolean;
  startTime: string;
  endTimeText: string;
  timeRange: string;
};

export type DateFilterOption = {
  label: string;
  value: string;
};

export type ScheduleYearGroup = {
  year: string;
  items: ScheduleView[];
};

export function createScheduleViews(
  items: ScheduleItem[],
  now: number = Date.now()
): ScheduleView[] {
  return items.map((item) => {
    const status = getScheduleStatus(item, now);
    const startTime = item.time || "00:00";
    const endTimeText =
      item.endTime && item.endTime !== startTime ? item.endTime : "";
    return {
      ...item,
      ...formatScheduleDate(item.day),
      status,
      statusClass: getStatusClass(status),
      active: status === "进行中",
      startTime,
      endTimeText,
      timeRange: endTimeText ? `${startTime} - ${endTimeText}` : startTime
    };
  });
}

export function sortScheduleViews(items: ScheduleView[]): ScheduleView[] {
  return [...items].sort((a, b) => {
    const aDone = a.status === "已完成";
    const bDone = b.status === "已完成";
    if (aDone !== bDone) return aDone ? 1 : -1;
    return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
  });
}

export function filterSchedules(
  items: ScheduleView[],
  dateValue: string,
  statusValue: ScheduleStatusFilter,
  categoryValue: ScheduleCategoryFilter
): ScheduleView[] {
  return items.filter((item) => {
    const dateMatched = dateValue === "all" || item.day === dateValue;
    const statusMatched = statusValue === "全部" || item.status === statusValue;
    const categoryMatched =
      categoryValue === "全部类型" || item.category === categoryValue;
    return dateMatched && statusMatched && categoryMatched;
  });
}

export function groupSchedulesByYear(
  items: ScheduleView[]
): ScheduleYearGroup[] {
  const groups: ScheduleYearGroup[] = [];
  items.forEach((item) => {
    let group = groups.find((entry) => entry.year === item.year);
    if (!group) {
      group = { year: item.year, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups;
}

export function createDateFilterOptions(
  items: ScheduleView[]
): DateFilterOption[] {
  const dates = Array.from(new Set(items.map((item) => item.day))).sort();
  return [
    { label: "全部日期", value: "all" },
    ...dates.map((date) => {
      const formatted = formatScheduleDate(date);
      return {
        label: `${formatted.monthDay} ${formatted.year}`,
        value: date
      };
    })
  ];
}

export function createCategoryFilterOptions(
  items: ScheduleView[]
): ScheduleCategoryFilter[] {
  const categories = Array.from(
    new Set(items.map((item) => item.category))
  ).sort();
  return ["全部类型", ...categories];
}

function getScheduleStatus(item: ScheduleItem, now: number): ScheduleStatus {
  const startTime = new Date(
    `${item.day}T${item.time || "00:00"}:00`
  ).getTime();
  const endTime = new Date(
    `${item.day}T${item.endTime || item.time || "00:00"}:00`
  ).getTime();
  if (Number.isNaN(startTime)) return "待出发";
  if (now < startTime) return "待出发";
  if (!Number.isNaN(endTime) && endTime > startTime && now <= endTime) {
    return "进行中";
  }
  return "已完成";
}

function getStatusClass(status: ScheduleStatus): string {
  if (status === "已完成") return "done";
  if (status === "进行中") return "active";
  return "pending";
}
