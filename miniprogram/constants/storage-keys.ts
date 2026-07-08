export const STORAGE_KEYS = {
  trips: "travel-note-trips",
  activeTripId: "travel-note-active-trip-id",
  activeTripCleared: "travel-note-active-trip-cleared",
  profile: "travel-note-profile",
  deletedItems: "travel-note-deleted-item-ids",
  deletedTrips: "travel-note-deleted-trip-ids",
  dataUpdatedAt: "travel-note-data-updated-at",
  dataResetVersion: "travel-note-data-reset-version",
  lastOpened: "travel-note-last-opened",
  lastCloudPull: "travel-note-last-cloud-pull"
} as const;

export const CURRENT_DATA_RESET_VERSION = 3;
