import { CLOUD_ENV_ID } from "./config/cloud";
import { STORAGE_KEYS } from "./constants/storage-keys";
import { syncTripsOnForeground } from "./services/cloud-sync";

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
    wx.setStorageSync(STORAGE_KEYS.lastOpened, Date.now());
  },
  onShow() {
    syncTripsOnForeground(true).catch((error) => {
      console.error("前台自动同步失败", error);
    });
  }
});
