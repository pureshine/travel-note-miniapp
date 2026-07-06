const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  if (!wxContext.OPENID) {
    throw new Error("缺少微信 openid，请先登录");
  }

  const cloudPath = normalizeCloudPath(event.cloudPath);
  const fileContent = typeof event.fileContent === "string" ? event.fileContent : "";
  if (!cloudPath) throw new Error("缺少上传路径");
  if (!fileContent) throw new Error("缺少图片内容");

  const uploadResult = await cloud.uploadFile({
    cloudPath,
    fileContent: Buffer.from(fileContent, "base64")
  });

  return {
    fileID: uploadResult.fileID,
    cloudPath
  };
};

function normalizeCloudPath(cloudPath) {
  if (typeof cloudPath !== "string") return "";
  const normalized = cloudPath.replace(/^\/+/, "").replace(/\.\./g, "");
  return normalized.startsWith("trip-images/") ? normalized : "";
}
