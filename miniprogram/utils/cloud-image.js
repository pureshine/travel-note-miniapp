"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCloudImageError = exports.resolveCloudImageUrls = exports.uploadImagesToCloud = exports.uploadImageToCloud = exports.hasLocalImage = exports.buildTripImagePath = exports.ensureLoggedInForUpload = exports.ensureCloudReady = exports.isCloudFile = void 0;
const cloud_1 = require("../config/cloud");
const cloud_sync_1 = require("../services/cloud-sync");
const id_1 = require("./id");
const DIRECT_MAX_BYTES = Math.floor(2 * 1024 * 1024 * 0.85);
const SERVER_MAX_BYTES = 320 * 1024;
let cloudReady = false;
function getFileExt(filePath) {
    const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : "jpg";
}
function isCloudFile(filePath) {
    return filePath.startsWith("cloud://");
}
exports.isCloudFile = isCloudFile;
function ensureCloudReady() {
    if (!wx.cloud)
        return false;
    if (!cloudReady) {
        wx.cloud.init({
            env: cloud_1.CLOUD_ENV_ID,
            traceUser: true
        });
        cloudReady = true;
    }
    return true;
}
exports.ensureCloudReady = ensureCloudReady;
function ensureLoggedInForUpload() {
    const profile = (0, cloud_sync_1.getSavedProfile)();
    if (profile?.loggedIn && profile.openid)
        return true;
    wx.showModal({
        title: "需要登录",
        content: "上传图片需先微信登录，好友加入旅行后才能看到同一份照片。",
        confirmText: "去登录",
        success: (res) => {
            if (res.confirm)
                wx.switchTab({ url: "/pages/profile/profile" });
        }
    });
    return false;
}
exports.ensureLoggedInForUpload = ensureLoggedInForUpload;
function buildTripImagePath(filePath, tripId) {
    const profile = (0, cloud_sync_1.getSavedProfile)();
    const openid = profile?.openid?.replace(/[^a-zA-Z0-9_-]/g, "_") || "guest";
    const safeTripId = tripId.replace(/[^a-zA-Z0-9_-]/g, "_") || "trip";
    const safeExt = getFileExt(filePath).replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    return `trip-images/${openid}/${safeTripId}/${Date.now()}-${(0, id_1.createId)("img")}.${safeExt}`;
}
exports.buildTripImagePath = buildTripImagePath;
function getFileSize(filePath) {
    return new Promise((resolve, reject) => {
        wx.getFileSystemManager().getFileInfo({
            filePath,
            success: (res) => resolve(res.size),
            fail: (error) => reject(new Error(error.errMsg || "读取图片失败"))
        });
    });
}
function compressImage(filePath, quality) {
    return new Promise((resolve, reject) => {
        wx.compressImage({
            src: filePath,
            quality,
            success: (res) => resolve(res.tempFilePath),
            fail: (error) => reject(new Error(error.errMsg || "图片压缩失败"))
        });
    });
}
async function compressToLimit(filePath, maxBytes) {
    let current = filePath;
    let size = await getFileSize(current);
    if (size <= maxBytes)
        return current;
    for (const quality of [80, 65, 50, 35, 20]) {
        current = await compressImage(current, quality);
        size = await getFileSize(current);
        if (size <= maxBytes)
            return current;
    }
    throw new Error("图片过大，请换一张较小的图片");
}
function readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
            filePath,
            encoding: "base64",
            success: (res) => resolve(String(res.data)),
            fail: (error) => reject(new Error(error.errMsg || "读取图片失败"))
        });
    });
}
function getUploadErrorMessage(error) {
    if (error instanceof Error && error.message)
        return error.message;
    if (typeof error === "object" && error && "errMsg" in error) {
        return String(error.errMsg || "图片上传失败");
    }
    return "图片上传失败";
}
function formatUploadError(error) {
    const raw = getUploadErrorMessage(error);
    if (/未知同步操作/.test(raw)) {
        return "请右键 uploadImage 云函数并部署";
    }
    if (/FUNCTION_NOT_FOUND|could not be found|未找到云函数/i.test(raw)) {
        return "请部署 uploadImage 云函数";
    }
    if (/504002|FUNCTIONS_EXECUTE_FAIL|timeout/i.test(raw)) {
        return "云函数上传超时，请压缩图片后重试";
    }
    const nested = raw.match(/Error:\s*([^,(\n]+)/);
    if (nested?.[1] && nested[1].length < 40)
        return nested[1].trim();
    return raw.length > 36 ? `${raw.slice(0, 36)}...` : raw;
}
function isFunctionNotFound(error) {
    return /FUNCTION_NOT_FOUND|could not be found|未找到云函数/i.test(getUploadErrorMessage(error));
}
function shouldUseServerUpload(error) {
    const message = getUploadErrorMessage(error);
    return /STORAGE_EXCEED_AUTHORITY|Have no access right|access right|authority|permission|权限不足|无权限/i.test(message);
}
function uploadByDirect(filePath, cloudPath) {
    return new Promise((resolve, reject) => {
        if (!wx.cloud) {
            reject(new Error("云开发未初始化"));
            return;
        }
        wx.cloud.uploadFile({
            cloudPath,
            filePath,
            success: (res) => {
                if (!res.fileID) {
                    reject(new Error("图片上传未返回 fileID"));
                    return;
                }
                resolve(res.fileID);
            },
            fail: (error) => reject(new Error(error.errMsg || "图片上传失败"))
        });
    });
}
function uploadByCloudFunction(name, cloudPath, fileContent) {
    return new Promise((resolve, reject) => {
        if (!wx.cloud) {
            reject(new Error("云开发未初始化"));
            return;
        }
        wx.cloud.callFunction({
            name,
            data: name === "syncTrips" ? { action: "uploadImage", cloudPath, fileContent } : { cloudPath, fileContent },
            success: (res) => {
                const result = res.result;
                if (result && typeof result === "object" && "errMsg" in result && result.errMsg) {
                    reject(new Error(String(result.errMsg)));
                    return;
                }
                if (!result?.fileID) {
                    reject(new Error(result?.error || "云函数上传未返回 fileID"));
                    return;
                }
                resolve(result.fileID);
            },
            fail: (error) => reject(new Error(formatUploadError(error)))
        });
    });
}
async function uploadByServer(filePath, cloudPath) {
    const compact = await compressToLimit(filePath, SERVER_MAX_BYTES);
    const fileContent = await readFileAsBase64(compact);
    try {
        return await uploadByCloudFunction("uploadImage", cloudPath, fileContent);
    }
    catch (uploadError) {
        if (!isFunctionNotFound(uploadError))
            throw uploadError;
        try {
            return await uploadByCloudFunction("syncTrips", cloudPath, fileContent);
        }
        catch (syncError) {
            throw new Error(formatUploadError(syncError));
        }
    }
}
function hasLocalImage(filePaths) {
    return filePaths.some((filePath) => !isCloudFile(filePath));
}
exports.hasLocalImage = hasLocalImage;
async function uploadImageToCloud(filePath, tripId) {
    if (isCloudFile(filePath))
        return filePath;
    if (!ensureCloudReady())
        throw new Error("云开发未初始化");
    if (!ensureLoggedInForUpload())
        throw new Error("请先微信登录");
    const prepared = await compressToLimit(filePath, DIRECT_MAX_BYTES);
    const cloudPath = buildTripImagePath(prepared, tripId);
    try {
        return await uploadByDirect(prepared, cloudPath);
    }
    catch (directError) {
        if (!shouldUseServerUpload(directError)) {
            throw new Error(formatUploadError(directError));
        }
        return uploadByServer(prepared, cloudPath);
    }
}
exports.uploadImageToCloud = uploadImageToCloud;
async function uploadImagesToCloud(filePaths, tripId) {
    const uploaded = [];
    for (const filePath of filePaths) {
        uploaded.push(await uploadImageToCloud(filePath, tripId));
    }
    return uploaded;
}
exports.uploadImagesToCloud = uploadImagesToCloud;
function resolveCloudImageUrls(images) {
    const cloudIds = images.filter((item) => isCloudFile(item));
    if (!cloudIds.length || !ensureCloudReady() || !wx.cloud) {
        return Promise.resolve(images);
    }
    const cloudApi = wx.cloud;
    return new Promise((resolve) => {
        cloudApi.getTempFileURL({
            fileList: cloudIds,
            success: (res) => {
                const urlMap = new Map((res.fileList || []).map((item) => [item.fileID, item.tempFileURL || item.fileID]));
                resolve(images.map((image) => urlMap.get(image) || image));
            },
            fail: () => resolve(images)
        });
    });
}
exports.resolveCloudImageUrls = resolveCloudImageUrls;
function formatCloudImageError(error) {
    return formatUploadError(error);
}
exports.formatCloudImageError = formatCloudImageError;
