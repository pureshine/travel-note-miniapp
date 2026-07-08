import { ChecklistItem, Trip } from "../../types/trip";

export function addChecklistItemToTrip(
  trip: Trip,
  title: string,
  id: string
): Trip {
  return {
    ...trip,
    checklist: [...trip.checklist, { id, title, done: false }]
  };
}

export function toggleChecklistItemInTrip(trip: Trip, itemId: string): Trip {
  return {
    ...trip,
    checklist: trip.checklist.map((item: ChecklistItem) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )
  };
}
