import { STORAGE_KEYS } from "../constants/storage-keys";
import { PAGE_ROUTES } from "../constants/routes";

export function notifyTripDataChanged(): void {
  wx.setStorageSync(STORAGE_KEYS.dataUpdatedAt, Date.now());
  const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
  pages.forEach((page) => {
    const route = typeof page.route === "string" ? page.route : "";
    if (route === PAGE_ROUTES.index && typeof page.refreshHomeData === "function") {
      page.refreshHomeData();
      return;
    }
    if (route === PAGE_ROUTES.trips && typeof page.refreshTripList === "function") {
      page.refreshTripList();
      return;
    }
    if (route === PAGE_ROUTES.schedule && typeof page.loadTrip === "function") {
      page.loadTrip();
      return;
    }
    if (
      (route === PAGE_ROUTES.notes ||
        route === PAGE_ROUTES.stats ||
        route === PAGE_ROUTES.expenses) &&
      typeof page.loadSelectedTrip === "function"
    ) {
      page.loadSelectedTrip();
      return;
    }
    if (route === PAGE_ROUTES.profile && typeof page.refreshLocalStats === "function") {
      page.refreshLocalStats();
    }
  });
}
