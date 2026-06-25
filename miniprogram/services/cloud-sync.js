"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptTripInvite = exports.createTripInvite = exports.syncTripsWithCloud = exports.downloadTripsFromCloud = exports.uploadTripsToCloud = exports.updateSavedProfile = exports.loginByCloud = exports.getSavedProfile = exports.getCloudErrorMessage = void 0;
const trip_store_1 = require("./trip-store");
const PROFILE_KEY = "travel-note-profile";
function callCloudFunction(name, data) {
    return new Promise((resolve, reject) => {
        if (!wx.cloud) {
            reject(new Error("当前基础库不支持云开发"));
            return;
        }
        wx.cloud.callFunction({
            name,
            data,
            success: (res) => resolve(res.result),
            fail: (error) => {
                reject(new Error(error.errMsg || `${name} 云函数调用失败`));
            }
        });
    });
}
function getCloudErrorMessage(error) {
    if (error instanceof Error && error.message)
        return error.message;
    if (typeof error === "object" && error && "errMsg" in error) {
        return String(error.errMsg || "云函数调用失败");
    }
    return "云函数调用失败";
}
exports.getCloudErrorMessage = getCloudErrorMessage;
function getSavedProfile() {
    const profile = wx.getStorageSync(PROFILE_KEY);
    return profile && profile.loggedIn && profile.openid ? profile : undefined;
}
exports.getSavedProfile = getSavedProfile;
async function loginByCloud() {
    const result = await callCloudFunction("login");
    if (!result.openid) {
        throw new Error("云登录未返回 openid");
    }
    const profile = {
        loggedIn: true,
        nickname: "",
        avatarUrl: "",
        openid: result.openid,
        loginAt: Date.now()
    };
    wx.setStorageSync(PROFILE_KEY, profile);
    return profile;
}
exports.loginByCloud = loginByCloud;
function updateSavedProfile(input) {
    const profile = getSavedProfile();
    if (!profile)
        return undefined;
    const nextProfile = {
        ...profile,
        ...input
    };
    wx.setStorageSync(PROFILE_KEY, nextProfile);
    return nextProfile;
}
exports.updateSavedProfile = updateSavedProfile;
async function uploadTripsToCloud() {
    const trips = (0, trip_store_1.exportTripsForSync)();
    const result = await callCloudFunction("syncTrips", {
        action: "upload",
        trips,
        memberProfile: getSyncMemberProfile()
    });
    updateLastSyncAt(result.updatedAt || Date.now());
    return result;
}
exports.uploadTripsToCloud = uploadTripsToCloud;
async function downloadTripsFromCloud() {
    const result = await callCloudFunction("syncTrips", {
        action: "download"
    });
    if (Array.isArray(result.trips) && result.trips.length > 0) {
        (0, trip_store_1.importTripsFromSync)(result.trips);
    }
    updateLastSyncAt(result.updatedAt || Date.now());
    return result;
}
exports.downloadTripsFromCloud = downloadTripsFromCloud;
async function syncTripsWithCloud() {
    await uploadTripsToCloud();
    return downloadTripsFromCloud();
}
exports.syncTripsWithCloud = syncTripsWithCloud;
async function createTripInvite(tripId) {
    return callCloudFunction("syncTrips", {
        action: "createInvite",
        tripId,
        memberProfile: getSyncMemberProfile()
    });
}
exports.createTripInvite = createTripInvite;
async function acceptTripInvite(inviteCode) {
    const result = await callCloudFunction("syncTrips", {
        action: "acceptInvite",
        inviteCode,
        memberProfile: getSyncMemberProfile()
    });
    await downloadTripsFromCloud();
    return result;
}
exports.acceptTripInvite = acceptTripInvite;
function updateLastSyncAt(lastSyncAt) {
    const profile = getSavedProfile();
    if (!profile)
        return;
    wx.setStorageSync(PROFILE_KEY, {
        ...profile,
        lastSyncAt,
        lastAutoSyncFailedAt: undefined,
        lastAutoSyncError: undefined
    });
}
function getSyncMemberProfile() {
    const profile = getSavedProfile();
    if (!profile)
        return undefined;
    return {
        nickname: profile.nickname?.trim() || "未设置名字",
        avatarUrl: profile.avatarUrl || ""
    };
}
