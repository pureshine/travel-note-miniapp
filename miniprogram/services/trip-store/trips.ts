import { Trip } from "../../types/trip";

export function createTripData(
  input:
    | {
        name?: string;
        destination?: string;
        startDate?: string;
        endDate?: string;
        budget?: number;
      }
    | undefined,
  id: string,
  currentDate: string
): Trip {
  const budget =
    typeof input?.budget === "number" && Number.isFinite(input.budget) && input.budget > 0
      ? Math.round(input.budget)
      : 10000;

  return {
    id,
    name: input?.name || "新的旅行",
    destination: input?.destination || "待定目的地",
    startDate: input?.startDate || currentDate,
    endDate: input?.endDate || input?.startDate || currentDate,
    budget,
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
