import { ScheduleCategory, ScheduleItem, Trip } from "../../types/trip";

export function addScheduleToTrip(
  trip: Trip,
  item: Omit<ScheduleItem, "id">,
  id: string
): Trip {
  return {
    ...trip,
    schedules: [{ ...item, id }, ...trip.schedules].sort(compareSchedule)
  };
}

export function updateScheduleInTrip(
  trip: Trip,
  scheduleId: string,
  input: Omit<ScheduleItem, "id">
): Trip {
  return {
    ...trip,
    schedules: trip.schedules
      .map((item: ScheduleItem) =>
        item.id === scheduleId ? { ...input, id: item.id } : item
      )
      .sort(compareSchedule)
  };
}

export function deleteScheduleFromTrip(trip: Trip, scheduleId: string): Trip {
  return {
    ...trip,
    schedules: trip.schedules.filter((item: ScheduleItem) => item.id !== scheduleId)
  };
}

export function getScheduleCategories(): ScheduleCategory[] {
  return ["景点", "交通", "住宿", "餐饮", "其他"];
}

export function compareSchedule(a: ScheduleItem, b: ScheduleItem): number {
  return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
}
