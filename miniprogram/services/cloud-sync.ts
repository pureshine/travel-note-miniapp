import { clearDeletedItemIds, exportTripsForSync, getDeletedTripIdsForSync, importTripsFromSync } from "./trip-store";
import { Trip } from "../types/trip";

const PROFILE_KEY = "travel-note-profile";

export interface CloudProfile {
  loggedIn: boolean;
  nickname: string;
  avatarUrl?: string;
  openid: string;
  loginAt: number;
  lastSyncAt?: number;
  lastAutoSyncFailedAt?: number;
  lastAutoSyncError?: string;
  previewMode?: boolean;
}

interface LoginResult {
  openid: string;
  appid?: string;
  unionid?: string;
}

interface SyncResult {
  openid: string;
  trips?: Trip[];
  tripCount?: number;
  sharedTripCount?: number;
  memberTotal?: number;
  updatedAt?: number;
}

interface SyncMemberProfile {
  nickname: string;
  avatarUrl?: string;
}

export interface InviteResult {
  openid: string;
  inviteCode: string;
  tripId: string;
  tripName: string;
  expiresAt: number;
}

export interface AcceptInviteResult {
  openid: string;
  tripId: string;
  tripName: string;
  memberCount: number;
}

function callCloudFunction<T>(name: string, data?: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error("当前基础库不支持云开发"));
      return;
    }
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => resolve(res.result as T),
      fail: (error) => {
        reject(new Error(error.errMsg || `${name} 云函数调用失败`));
      }
    });
  });
}

export function getCloudErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "errMsg" in error) {
    return String((error as { errMsg?: string }).errMsg || "云函数调用失败");
  }
  return "云函数调用失败";
}

export function getSavedProfile(): CloudProfile | undefined {
  const profile = wx.getStorageSync<CloudProfile>(PROFILE_KEY);
  return profile && profile.loggedIn && profile.openid ? profile : undefined;
}

export async function loginByCloud(): Promise<CloudProfile> {
  const result = await callCloudFunction<LoginResult>("login");
  if (!result.openid) {
    throw new Error("云登录未返回 openid");
  }
  const profile: CloudProfile = {
    loggedIn: true,
    nickname: "",
    avatarUrl: "",
    openid: result.openid,
    loginAt: Date.now()
  };
  wx.setStorageSync(PROFILE_KEY, profile);
  return profile;
}

export function updateSavedProfile(input: Partial<Pick<CloudProfile, "nickname" | "avatarUrl">>): CloudProfile | undefined {
  const profile = getSavedProfile();
  if (!profile) return undefined;
  const nextProfile = {
    ...profile,
    ...input
  };
  wx.setStorageSync(PROFILE_KEY, nextProfile);
  return nextProfile;
}

export async function uploadTripsToCloud(): Promise<SyncResult> {
  const trips = exportTripsForSync();
  const result = await callCloudFunction<SyncResult>("syncTrips", {
    action: "upload",
    trips,
    deletedTripIds: getDeletedTripIdsForSync(),
    memberProfile: getSyncMemberProfile()
  });
  clearDeletedItemIds();
  updateLastSyncAt(result.updatedAt || Date.now());
  return result;
}

export async function downloadTripsFromCloud(): Promise<SyncResult> {
  const result = await callCloudFunction<SyncResult>("syncTrips", {
    action: "download"
  });
  if (Array.isArray(result.trips) && result.trips.length > 0) {
    importTripsFromSync(result.trips);
  }
  updateLastSyncAt(result.updatedAt || Date.now());
  return result;
}

export async function syncTripsWithCloud(): Promise<SyncResult> {
  await uploadTripsToCloud();
  return downloadTripsFromCloud();
}

export async function resetMyCloudData(): Promise<SyncResult> {
  return callCloudFunction<SyncResult>("syncTrips", {
    action: "resetMyData"
  });
}

export async function createTripInvite(tripId: string): Promise<InviteResult> {
  return callCloudFunction<InviteResult>("syncTrips", {
    action: "createInvite",
    tripId,
    memberProfile: getSyncMemberProfile()
  });
}

export async function acceptTripInvite(inviteCode: string): Promise<AcceptInviteResult> {
  const result = await callCloudFunction<AcceptInviteResult>("syncTrips", {
    action: "acceptInvite",
    inviteCode,
    memberProfile: getSyncMemberProfile()
  });
  await downloadTripsFromCloud();
  return result;
}

function updateLastSyncAt(lastSyncAt: number): void {
  const profile = getSavedProfile();
  if (!profile) return;
  wx.setStorageSync(PROFILE_KEY, {
    ...profile,
    lastSyncAt,
    lastAutoSyncFailedAt: undefined,
    lastAutoSyncError: undefined
  });
}

function getSyncMemberProfile(): SyncMemberProfile | undefined {
  const profile = getSavedProfile();
  if (!profile) return undefined;
  return {
    nickname: profile.nickname?.trim() || "未设置名字",
    avatarUrl: profile.avatarUrl || ""
  };
}
