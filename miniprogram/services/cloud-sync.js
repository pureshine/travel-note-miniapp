"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudErrorMessage = getCloudErrorMessage;
exports.getSavedProfile = getSavedProfile;
exports.loginByCloud = loginByCloud;
exports.updateSavedProfile = updateSavedProfile;
exports.uploadTripsToCloud = uploadTripsToCloud;
exports.downloadTripsFromCloud = downloadTripsFromCloud;
exports.syncTripsWithCloud = syncTripsWithCloud;
exports.syncTripsOnForeground = syncTripsOnForeground;
exports.resetMyCloudData = resetMyCloudData;
exports.createTripInvite = createTripInvite;
exports.acceptTripInvite = acceptTripInvite;
const trip_store_1 = require("./trip-store");
const storage_keys_1 = require("../constants/storage-keys");
const PROFILE_KEY = storage_keys_1.STORAGE_KEYS.profile;
const FOREGROUND_SYNC_INTERVAL = 5 * 1000;
let foregroundSyncPromise = null;
let lastForegroundSyncAt = 0;
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
function getSavedProfile() {
    const profile = wx.getStorageSync(PROFILE_KEY);
    return profile && profile.loggedIn && profile.openid ? profile : undefined;
}
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
async function uploadTripsToCloud(options) {
    const trips = (0, trip_store_1.exportTripsForSync)();
    const result = await callCloudFunction("syncTrips", {
        action: "upload",
        trips,
        deletedTripIds: (0, trip_store_1.getDeletedTripIdsForSync)(),
        localTripIds: trips.map((trip) => trip.id),
        memberProfile: getSyncMemberProfile()
    });
    if (options?.clearDeleted !== false) {
        (0, trip_store_1.clearDeletedItemIds)();
    }
    updateLastSyncAt(result.updatedAt || Date.now());
    return result;
}
async function downloadTripsFromCloud() {
    const result = await callCloudFunction("syncTrips", {
        action: "download"
    });
    if (Array.isArray(result.trips)) {
        if (result.trips.length === 0) {
            (0, trip_store_1.importTripsFromSync)([], { replace: true });
        }
        else {
            (0, trip_store_1.importTripsFromSync)(result.trips);
        }
    }
    updateLastSyncAt(result.updatedAt || Date.now());
    return result;
}
async function syncTripsWithCloud() {
    (0, trip_store_1.reconcileClearedPlanState)();
    await uploadTripsToCloud({ clearDeleted: false });
    const result = await callCloudFunction("syncTrips", {
        action: "download"
    });
    const cloudTrips = Array.isArray(result.trips) ? result.trips : [];
    if ((0, trip_store_1.isLocalTripsCleared)() && cloudTrips.length > 0) {
        (0, trip_store_1.importTripsFromSync)([], { replace: true });
    }
    else {
        (0, trip_store_1.importTripsFromSync)(cloudTrips, { replace: true });
    }
    (0, trip_store_1.clearDeletedItemIds)();
    updateLastSyncAt(result.updatedAt || Date.now());
    return result;
}
async function syncTripsOnForeground(force = false) {
    const profile = getSavedProfile();
    if (!profile?.loggedIn || !profile.openid)
        return undefined;
    const now = Date.now();
    if (!force && now - lastForegroundSyncAt < FOREGROUND_SYNC_INTERVAL) {
        return undefined;
    }
    if (foregroundSyncPromise)
        return foregroundSyncPromise;
    foregroundSyncPromise = (async () => {
        const result = await syncTripsWithCloud();
        lastForegroundSyncAt = Date.now();
        return result;
    })();
    try {
        return await foregroundSyncPromise;
    }
    finally {
        foregroundSyncPromise = null;
    }
}
async function resetMyCloudData() {
    return callCloudFunction("syncTrips", {
        action: "resetMyData"
    });
}
async function createTripInvite(tripId) {
    return callCloudFunction("syncTrips", {
        action: "createInvite",
        tripId,
        memberProfile: getSyncMemberProfile()
    });
}
async function acceptTripInvite(inviteCode) {
    const result = await callCloudFunction("syncTrips", {
        action: "acceptInvite",
        inviteCode,
        memberProfile: getSyncMemberProfile()
    });
    const download = await callCloudFunction("syncTrips", {
        action: "download"
    });
    if (Array.isArray(download.trips)) {
        (0, trip_store_1.importTripsFromSync)(download.trips, { adoptTripIds: [result.tripId] });
    }
    (0, trip_store_1.setActiveTripId)(result.tripId);
    updateLastSyncAt(download.updatedAt || Date.now());
    return result;
}
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
