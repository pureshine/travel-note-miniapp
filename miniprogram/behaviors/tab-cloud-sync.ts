import { getSavedProfile, syncTripsOnForeground } from "../services/cloud-sync";

type TabCloudSyncPage = WechatMiniprogram.Page.TrivialInstance & {
  refreshAfterCloudSync?: () => void;
  loadTrip?: () => void;
  loadSelectedTrip?: () => void;
  refreshLocalStats?: () => void;
};

function refreshTabPage(page: TabCloudSyncPage) {
  if (typeof page.loadTrip === "function") {
    page.loadTrip();
    return;
  }
  if (typeof page.loadSelectedTrip === "function") {
    page.loadSelectedTrip();
    return;
  }
  if (typeof page.refreshLocalStats === "function") {
    page.refreshLocalStats();
  }
}

export const tabCloudSyncBehavior = Behavior({
  pageLifetimes: {
    show() {
      const page = this as TabCloudSyncPage;
      refreshTabPage(page);
      if (!getSavedProfile()?.loggedIn) return;
      void syncTripsOnForeground()
        .finally(() => {
          refreshTabPage(page);
        })
        .catch((error) => {
          console.error("Tab 云端同步失败", error);
        });
    }
  },
  methods: {
    pullCloudAndRefresh() {
      const page = this as TabCloudSyncPage;
      refreshTabPage(page);
      if (!getSavedProfile()?.loggedIn) return;
      void syncTripsOnForeground()
        .finally(() => {
          refreshTabPage(page);
        })
        .catch((error) => {
          console.error("Tab 云端同步失败", error);
        });
    },
    refreshAfterCloudSync() {
      refreshTabPage(this as TabCloudSyncPage);
    }
  }
});
