import { downloadTripsFromCloud, getSavedProfile, resetMyCloudData } from "./services/cloud-sync";

const CLOUD_ENV_ID = "cloud1-d2gse79u56ad69a8a";
const CLOUD_PULL_INTERVAL = 30 * 1000;
const CLOUD_RESET_VERSION_KEY = "travel-note-cloud-reset-version";
const CURRENT_CLOUD_RESET_VERSION = 2;

let pullingCloudTrips = false;
let resettingCloudTrips = false;

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
    if (resetCloudDataOnceForTesting()) return;
    pullSharedTripsSilently();
  }
});

function resetCloudDataOnceForTesting(): boolean {
  const profile = getSavedProfile();
  if (!profile || !wx.cloud || resettingCloudTrips) return false;
  const resetVersion = wx.getStorageSync<number>(CLOUD_RESET_VERSION_KEY) || 0;
  if (resetVersion >= CURRENT_CLOUD_RESET_VERSION) return false;
  resettingCloudTrips = true;
  resetMyCloudData()
    .then(() => {
      wx.setStorageSync(CLOUD_RESET_VERSION_KEY, CURRENT_CLOUD_RESET_VERSION);
      wx.setStorageSync("travel-note-last-cloud-pull", Date.now());
    })
    .catch((error) => {
      console.error("测试云端数据清理失败", error);
    })
    .finally(() => {
      resettingCloudTrips = false;
    });
  return true;
}

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
