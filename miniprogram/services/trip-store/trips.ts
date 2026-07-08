import { Trip } from "../../types/trip";

export function createTripData(
  input: { name?: string; destination?: string; startDate?: string; endDate?: string } | undefined,
  id: string,
  currentDate: string
): Trip {
  return {
    id,
    name: input?.name || "新的旅行",
    destination: input?.destination || "待定目的地",
    startDate: input?.startDate || currentDate,
    endDate: input?.endDate || input?.startDate || currentDate,
    budget: 10000,
    coverTone: "sky",
    schedules: [],
    checklist: [],
    notes: [],
    expenses: []
  };
}

export function updateTripInfoInTrip(
  trip: Trip,
  input: { name: string; destination: string; startDate: string; endDate: string }
): Trip {
  return {
    ...trip,
    name: input.name,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate
  };
}

export function updateTripBudgetInTrip(trip: Trip, budget: number): Trip {
  return {
    ...trip,
    budget
  };
}
