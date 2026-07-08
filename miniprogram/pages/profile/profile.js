"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_sync_1 = require("../../services/cloud-sync");
const trip_store_1 = require("../../services/trip-store");
const page_shell_1 = require("../../behaviors/page-shell");
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
    behaviors: [page_shell_1.pageShellBehavior],
    data: {
        loggedIn: false,
        nickname: "冲鸭旅行者",
        avatarUrl: "",
        openid: "",
        lastSyncText: "暂未同步",
        syncing: false,
        inviteLoading: false,
        tripCount: 0,
        scheduleCount: 0,
        memberNamesText: "",
        inviteCode: "",
        sharePath: "/pages/profile/profile",
        shareTitle: "邀请你一起冲鸭去旅行",
        pendingInviteCode: "",
        autoSynced: false,
        showProfileSetup: false,
        draftAvatarUrl: "",
        draftNickname: ""
    },
    onLoad(options) {
        if (options?.inviteCode) {
            this.setData({ pendingInviteCode: options.inviteCode });
        }
    },
    onShow() {
        this.applyProfile((0, cloud_sync_1.getSavedProfile)());
        this.refreshLocalStats();
        if (this.data.loggedIn && !this.data.syncing) {
            void this.reconcileWithCloud();
        }
    },
    async reconcileWithCloud() {
        if (this.data.syncing)
            return;
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const result = await (0, cloud_sync_1.syncTripsWithCloud)();
            this.applySyncResult(result.tripCount || 0, result.updatedAt);
            this.refreshLocalStats();
        }
        catch (error) {
            console.error("云端对齐失败", error);
        }
        finally {
            this.setData({ syncing: false, autoSynced: true });
        }
    },
    async pushLocalChanges() {
        return this.reconcileWithCloud();
    },
    async loginWithWechat() {
        if (this.data.syncing)
            return;
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const profile = await (0, cloud_sync_1.loginByCloud)();
            this.applyProfile(profile);
            wx.showToast({ title: "登录成功", icon: "success" });
            this.openProfileSetup(profile);
            if (this.data.pendingInviteCode) {
                await this.acceptInvite(this.data.pendingInviteCode);
            }
            else {
                await this.restoreOrSyncCloudData();
            }
        }
        catch (error) {
            console.error("微信登录失败", error);
            this.setData({ syncing: false });
            wx.showToast({ title: "登录失败，请重试", icon: "none" });
            return;
        }
        finally {
            this.setData({ syncing: false });
        }
    },
    onAvatarLongPress() {
        wx.showActionSheet({
            itemList: ["退出登录"],
            alertText: "退出后本机数据会保留，再次登录后可继续同步",
            success: (res) => {
                if (res.tapIndex !== 0)
                    return;
                wx.removeStorageSync("travel-note-profile");
                this.setData({ autoSynced: false, inviteCode: "" });
                this.applyProfile();
                wx.showToast({ title: "已退出", icon: "success" });
            }
        });
    },
    openProfileSetup(profile) {
        if (!profile)
            return;
        const needsProfile = !profile.nickname || profile.nickname === "微信用户";
        if (!needsProfile)
            return;
        this.setData({
            showProfileSetup: true,
            draftAvatarUrl: profile.avatarUrl || "",
            draftNickname: profile.nickname === "微信用户" ? "" : profile.nickname
        });
    },
    editProfile() {
        const profile = (0, cloud_sync_1.getSavedProfile)();
        if (!profile)
            return;
        this.setData({
            showProfileSetup: true,
            draftAvatarUrl: profile.avatarUrl || "",
            draftNickname: profile.nickname === "微信用户" ? "" : profile.nickname
        });
    },
    openProfileEdit() {
        if (!this.data.loggedIn)
            return;
        wx.navigateTo({ url: "/pages/profile-edit/profile-edit" });
    },
    async syncCloudData() {
        if (this.data.syncing)
            return;
        if (!this.data.loggedIn) {
            wx.showToast({ title: "请先微信登录", icon: "none" });
            return;
        }
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const result = await (0, cloud_sync_1.syncTripsWithCloud)();
            this.applySyncResult(result.tripCount || 0, result.updatedAt);
            this.refreshLocalStats();
            wx.showToast({ title: "同步成功", icon: "success" });
        }
        catch (error) {
            console.error("手动同步失败", error);
            wx.showToast({ title: "同步失败", icon: "none" });
        }
        finally {
            this.setData({ syncing: false });
        }
    },
    downloadCloudData() {
        if (this.data.syncing)
            return;
        if (!this.data.loggedIn) {
            wx.showToast({ title: "请先微信登录", icon: "none" });
            return;
        }
        wx.showModal({
            title: "从云端恢复？",
            content: "这会用云端数据覆盖当前手机里的旅行记录。建议先确认这台手机没有未上传的新内容。",
            confirmText: "恢复",
            confirmColor: "#ff8a4c",
            success: (res) => {
                if (!res.confirm)
                    return;
                this.restoreFromCloud();
            }
        });
    },
    async restoreFromCloud() {
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const result = await (0, cloud_sync_1.downloadTripsFromCloud)();
            this.applySyncResult(result.tripCount || 0, result.updatedAt);
            this.refreshLocalStats();
            wx.showToast({ title: "刷新成功", icon: "success" });
        }
        catch (error) {
            console.error("云端恢复失败", error);
            wx.showToast({ title: "刷新失败", icon: "none" });
        }
        finally {
            this.setData({ syncing: false });
        }
    },
    async autoSyncCloudData() {
        if (this.data.syncing)
            return;
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const result = await this.restoreOrUploadTrips();
            this.applySyncResult(result.tripCount || 0, result.updatedAt);
            this.refreshLocalStats();
        }
        catch (error) {
            console.error("自动同步失败", error);
            const profile = (0, cloud_sync_1.getSavedProfile)();
            if (profile) {
                (0, cloud_sync_1.updateSavedProfile)({});
                wx.setStorageSync("travel-note-profile", {
                    ...profile,
                    lastAutoSyncFailedAt: Date.now(),
                    lastAutoSyncError: "自动同步失败"
                });
            }
        }
        finally {
            this.setData({ syncing: false, autoSynced: true });
        }
    },
    async restoreOrSyncCloudData() {
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const result = await this.restoreOrUploadTrips();
            this.applySyncResult(result.tripCount || 0, result.updatedAt);
            this.refreshLocalStats();
        }
        catch (error) {
            console.error("登录后同步失败", error);
            const profile = (0, cloud_sync_1.getSavedProfile)();
            if (profile) {
                wx.setStorageSync("travel-note-profile", {
                    ...profile,
                    lastAutoSyncFailedAt: Date.now(),
                    lastAutoSyncError: "登录后同步失败"
                });
            }
        }
        finally {
            this.setData({ syncing: false, autoSynced: true });
        }
    },
    async restoreOrUploadTrips() {
        return (0, cloud_sync_1.syncTripsWithCloud)();
    },
    async createInvite() {
        if (this.data.inviteLoading)
            return;
        if (this.data.memberNamesText) {
            wx.showToast({ title: "已有同行人", icon: "none" });
            return;
        }
        if (!this.data.loggedIn) {
            wx.showToast({ title: "请先微信登录", icon: "none" });
            return;
        }
        const trip = (0, trip_store_1.getActiveTrip)();
        if (!trip) {
            wx.showToast({ title: "请先新建旅行", icon: "none" });
            return;
        }
        this.setData({ inviteLoading: true });
        try {
            await (0, cloud_sync_1.syncTripsWithCloud)();
            this.refreshLocalStats();
            if (this.data.memberNamesText) {
                wx.showToast({ title: "已有同行人", icon: "none" });
                return;
            }
            const invite = await (0, cloud_sync_1.createTripInvite)(trip.id);
            if (!invite?.inviteCode) {
                throw new Error("未返回邀请码");
            }
            this.applyInvite(invite);
            wx.showToast({ title: "邀请已生成", icon: "success" });
        }
        catch (error) {
            console.error("生成邀请失败", error);
            wx.showToast({ title: "生成失败", icon: "none" });
        }
        finally {
            this.setData({ inviteLoading: false });
        }
    },
    async acceptInvite(inviteCode) {
        if (!this.data.loggedIn) {
            this.setData({ pendingInviteCode: inviteCode });
            return;
        }
        this.setData({ syncing: true, lastSyncText: "同步中..." });
        try {
            const result = await (0, cloud_sync_1.acceptTripInvite)(inviteCode);
            this.applyAcceptedInvite(result);
            this.refreshLocalStats();
            wx.showToast({ title: "已加入旅行", icon: "success" });
        }
        catch (error) {
            console.error("加入邀请失败", error);
            wx.showToast({ title: "加入失败", icon: "none" });
        }
        finally {
            this.setData({ syncing: false, pendingInviteCode: "" });
        }
    },
    applyProfile(profile) {
        if (!profile) {
            this.setData({
                loggedIn: false,
                nickname: "冲鸭旅行者",
                avatarUrl: "",
                openid: "",
                lastSyncText: "暂未同步",
                autoSynced: false
            });
            return;
        }
        this.setData({
            loggedIn: true,
            nickname: profile.nickname?.trim() || "设置名字",
            avatarUrl: profile.avatarUrl || "",
            openid: profile.openid,
            lastSyncText: formatSyncTime(profile.lastSyncAt)
        });
    },
    onChooseAvatar(event) {
        const avatarUrl = event.detail.avatarUrl;
        const profile = (0, cloud_sync_1.updateSavedProfile)({ avatarUrl });
        if (profile)
            this.applyProfile(profile);
        (0, cloud_sync_1.syncTripsWithCloud)().catch((error) => console.error("头像同步失败", error));
    },
    onSetupChooseAvatar(event) {
        this.setData({ draftAvatarUrl: event.detail.avatarUrl });
    },
    onSetupNicknameInput(event) {
        this.setData({ draftNickname: event.detail.value });
    },
    onSetupNicknameBlur(event) {
        this.setData({ draftNickname: event.detail.value });
    },
    saveProfileSetup() {
        const nickname = this.data.draftNickname.trim();
        if (!nickname) {
            wx.showToast({ title: "请设置名字", icon: "none" });
            return;
        }
        const profile = (0, cloud_sync_1.updateSavedProfile)({
            avatarUrl: this.data.draftAvatarUrl,
            nickname
        });
        if (profile)
            this.applyProfile(profile);
        this.setData({ showProfileSetup: false });
        (0, cloud_sync_1.syncTripsWithCloud)().catch((error) => console.error("显示名字同步失败", error));
        wx.showToast({ title: "已保存", icon: "success" });
    },
    skipProfileSetup() {
        this.setData({ showProfileSetup: false });
    },
    refreshLocalStats() {
        (0, trip_store_1.reconcileClearedPlanState)();
        const trips = (0, trip_store_1.listTrips)();
        const summary = (0, trip_store_1.getSummary)();
        const currentTrip = (0, trip_store_1.getActiveTrip)();
        const myOpenid = this.data.openid || (0, cloud_sync_1.getSavedProfile)()?.openid || "";
        const memberNames = (currentTrip?.sharedMembers || [])
            .filter((member) => member.openid !== myOpenid)
            .map((member) => member.nickname)
            .filter((name) => name && name !== "未设置名字");
        this.setData({
            tripCount: trips.length,
            scheduleCount: summary.scheduleCount,
            memberNamesText: memberNames.length > 0 ? memberNames.join("、") : ""
        });
    },
    applySyncResult(_tripCount, updatedAt) {
        this.setData({
            lastSyncText: formatSyncTime(updatedAt || Date.now())
        });
    },
    applyInvite(invite) {
        this.setData({
            inviteCode: invite.inviteCode,
            shareTitle: `邀请你一起冲鸭记录「${invite.tripName}」`,
            sharePath: `/pages/profile/profile?inviteCode=${invite.inviteCode}`
        });
    },
    applyAcceptedInvite(_result) { },
    onShareAppMessage() {
        return {
            title: this.data.shareTitle,
            path: this.data.sharePath
        };
    }
});
