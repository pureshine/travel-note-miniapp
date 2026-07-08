import { Trip } from "../types/trip";

export type TripStatus = "待出发" | "已完成";

export function getTripStatus(trip: Trip): TripStatus {
  const endTime = new Date(`${trip.endDate}T23:59:59`).getTime();
  if (Number.isNaN(endTime)) return "待出发";
  return Date.now() > endTime ? "已完成" : "待出发";
}

export function getTripStatusClass(status: TripStatus): string {
  return status === "已完成" ? "done" : "upcoming";
}

export function formatTripOption(trip: Trip): string {
  return `${trip.name} · ${getTripStatus(trip)}`;
}

export function formatScheduleDate(day: string): { year: string; monthDay: string } {
  const parts = day.split("-");
  if (parts.length !== 3) return { year: "", monthDay: day };
  return {
    year: parts[0],
    monthDay: `${Number(parts[1])}.${Number(parts[2])}`
  };
}

export const NO_TRIP_TOAST = "请先新建旅行计划";
