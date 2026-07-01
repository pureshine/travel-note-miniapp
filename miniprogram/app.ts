import { downloadTripsFromCloud, getSavedProfile } from "./services/cloud-sync";

const CLOUD_ENV_ID = "cloud1-d2gse79u56ad69a8a";
const CLOUD_PULL_INTERVAL = 30 * 1000;

let pullingCloudTrips = false;

App<IAppOption>({
  globalData: {
    appName: "冲鸭去旅行"
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      });
    }
    wx.setStorageSync("travel-note-last-opened", Date.now());
  },
  onShow() {
    pullSharedTripsSilently();
  }
});

function pullSharedTripsSilently(): void {
  const profile = getSavedProfile();
  if (!profile || !wx.cloud || pullingCloudTrips) return;
  const lastPullAt = wx.getStorageSync<number>("travel-note-last-cloud-pull") || 0;
  if (Date.now() - lastPullAt < CLOUD_PULL_INTERVAL) return;
  pullingCloudTrips = true;
  downloadTripsFromCloud()
    .then(() => {
      wx.setStorageSync("travel-note-last-cloud-pull", Date.now());
    })
    .catch((error) => {
      console.error("共享旅行静默拉取失败", error);
    })
    .finally(() => {
      pullingCloudTrips = false;
    });
}
