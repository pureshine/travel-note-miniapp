import { getSavedProfile, resetMyCloudData } from "../../services/cloud-sync";
import { resetDemoData } from "../../services/trip-store";

Page({
  resetData() {
    wx.showModal({
      title: "清空旅行数据",
      content: "会删除本机所有旅行、日程、备忘和消费记录。已登录时也会尝试清空云端数据，方便从 0 开始测试。",
      confirmText: "清空",
      confirmColor: "#ff6500",
      success: async (res) => {
        if (!res.confirm) return;
        wx.showToast({ title: "正在清空", icon: "loading" });
          resetDemoData();
        try {
          if (getSavedProfile()) await resetMyCloudData();
          wx.setStorageSync("travel-note-last-cloud-pull", Date.now());
          wx.showToast({ title: "已清空", icon: "success" });
        } catch (error) {
          console.error("云端数据清空失败", error);
          wx.showToast({ title: "本机已清空，云端失败", icon: "none" });
        }
      }
    });
  }
});
