import { NoteCategory, NoteItem, Trip } from "../../types/trip";

export function addNoteToTrip(
  trip: Trip,
  title: string,
  content: string,
  category: NoteCategory,
  id: string,
  createdAt: number
): Trip {
  return {
    ...trip,
    notes: [{ id, title, content, category, done: false, createdAt }, ...trip.notes]
  };
}

export function updateNoteInTrip(
  trip: Trip,
  noteId: string,
  input: { title: string; content: string; category: NoteCategory }
): Trip {
  return {
    ...trip,
    notes: trip.notes.map((item: NoteItem) =>
      item.id === noteId
        ? {
            ...item,
            title: input.title,
            content: input.content,
            category: input.category
          }
        : item
    )
  };
}

export function toggleNoteInTrip(trip: Trip, itemId: string): Trip {
  return {
    ...trip,
    notes: trip.notes.map((item: NoteItem) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )
  };
}

export function deleteNoteFromTrip(trip: Trip, itemId: string): Trip {
  return {
    ...trip,
    notes: trip.notes.filter((item: NoteItem) => item.id !== itemId)
  };
}

export function getNoteCategories(): NoteCategory[] {
  return ["物品", "事项", "预订", "攻略"];
}

export function normalizeNoteCategory(category: string): NoteCategory {
  if (category === "财务") return "事项";
  if (category === "证件") return "物品";
  const categories = getNoteCategories();
  if (categories.includes(category as NoteCategory)) {
    return category as NoteCategory;
  }
  return "物品";
}
