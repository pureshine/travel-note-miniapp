"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_sync_1 = require("../../services/cloud-sync");
function formatSyncTime(timestamp) {
    if (!timestamp)
        return "暂未同步";
    const date = new Date(timestamp);
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const hour = `${date.getHours()}`.padStart(2, "0");
    const minute = `${date.getMinutes()}`.padStart(2, "0");
    return `${month}-${day} ${hour}:${minute}`;
}
Page({
    data: {
        avatarUrl: "",
        nickname: "",
        openid: "",
        lastSyncText: "暂未同步",
        saving: false
    },
    onShow() {
        this.loadProfile();
    },
    loadProfile() {
        const profile = (0, cloud_sync_1.getSavedProfile)();
        if (!profile) {
            wx.navigateBack();
            return;
        }
        this.setData({
            avatarUrl: profile.avatarUrl || "",
            nickname: profile.nickname?.trim() || "",
            openid: profile.openid,
            lastSyncText: formatSyncTime(profile.lastSyncAt)
        });
    },
    onChooseAvatar(event) {
        this.setData({ avatarUrl: event.detail.avatarUrl });
    },
    onNameInput(event) {
        this.setData({ nickname: event.detail.value });
    },
    async saveProfile() {
        if (this.data.saving)
            return;
        const nickname = this.data.nickname.trim();
        if (!nickname) {
            wx.showToast({ title: "请设置名字", icon: "none" });
            return;
        }
        this.setData({ saving: true });
        const profile = (0, cloud_sync_1.updateSavedProfile)({
            avatarUrl: this.data.avatarUrl,
            nickname
        });
        if (!profile) {
            this.setData({ saving: false });
            wx.showToast({ title: "请重新登录", icon: "none" });
            return;
        }
        try {
            await (0, cloud_sync_1.syncTripsWithCloud)();
            wx.showToast({ title: "已保存", icon: "success" });
            wx.navigateBack();
        }
        catch (error) {
            console.error("个人资料同步失败", error);
            wx.showToast({ title: "已保存，稍后自动同步", icon: "none" });
            wx.navigateBack();
        }
        finally {
            this.setData({ saving: false });
        }
    },
    logout() {
        wx.showActionSheet({
            itemList: ["退出登录"],
            alertText: "退出后本机数据会保留，再次登录后可继续同步",
            success: (res) => {
                if (res.tapIndex !== 0)
                    return;
                wx.removeStorageSync("travel-note-profile");
                wx.showToast({ title: "已退出", icon: "success" });
                wx.navigateBack();
            }
        });
    }
});
