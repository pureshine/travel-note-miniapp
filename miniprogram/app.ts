import { CLOUD_ENV_ID } from "./config/cloud";
import { STORAGE_KEYS } from "./constants/storage-keys";

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
    // 同步仅在「我的」页触发，避免后台拉取把已删除数据 merge 回来
  }
});
