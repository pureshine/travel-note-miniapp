const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const sharedTrips = db.collection("shared_trips");
const invitations = db.collection("trip_invitations");

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    throw new Error("缺少微信 openid，请先登录");
  }

  if (event.action === "upload") {
    const trips = Array.isArray(event.trips) ? event.trips : [];
    const updatedAt = Date.now();

    for (const trip of trips) {
      if (!trip || !trip.id) continue;
      const existing = await getSharedTrip(trip.id);
      const members = existing ? ensureMember(existing.memberOpenids, openid) : [openid];
      const memberProfiles = {
        ...(existing?.memberProfiles || {}),
        [openid]: normalizeMemberProfile(event.memberProfile, openid)
      };
      const deletedIds = normalizeDeletedIds(trip.syncDeletedIds);
      const nextTrip = existing?.trip ? mergeTrip(existing.trip, stripSharedFields(trip), deletedIds) : stripSharedFields(trip);

      await sharedTrips.doc(trip.id).set({
        data: {
          _openid: existing?._openid || openid,
          ownerOpenid: existing?.ownerOpenid || openid,
          memberOpenids: members,
          memberCount: members.length,
          memberProfiles,
          trip: nextTrip,
          updatedAt,
          updatedBy: openid,
          updatedByProfile: memberProfiles[openid]
        }
      });
    }

    return {
      openid,
      tripCount: trips.length,
      sharedTripCount: trips.length,
      updatedAt
    };
  }

  if (event.action === "download") {
    const result = await sharedTrips
      .where({
        memberOpenids: _.in([openid])
      })
      .orderBy("updatedAt", "desc")
      .limit(100)
      .get();
    const docs = result.data || [];
    const trips = docs
      .map((item) => item.trip ? { ...item.trip, sharedMembers: profileMapToMembers(item.memberProfiles) } : undefined)
      .filter(Boolean);
    return {
      openid,
      trips,
      tripCount: trips.length,
      sharedTripCount: trips.length,
      updatedAt: docs[0]?.updatedAt || 0,
      memberTotal: docs.reduce((total, item) => total + (item.memberCount || 1), 0)
    };
  }

  if (event.action === "resetMyData") {
    await sharedTrips
      .where({
        memberOpenids: _.in([openid])
      })
      .remove();
    await invitations
      .where({
        inviterOpenid: openid
      })
      .remove();
    return {
      openid,
      reset: true,
      updatedAt: Date.now()
    };
  }

  if (event.action === "createInvite") {
    const tripId = event.tripId;
    if (!tripId) throw new Error("缺少旅行 ID");

    const tripDoc = await getSharedTrip(tripId);
    if (!tripDoc || !Array.isArray(tripDoc.memberOpenids) || !tripDoc.memberOpenids.includes(openid)) {
      throw new Error("请先上传当前旅行，再邀请好友");
    }

    const inviteCode = createInviteCode();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await invitations.doc(inviteCode).set({
      data: {
        _openid: openid,
        inviteCode,
        tripId,
        tripName: tripDoc.trip?.name || "新的旅行",
        inviterOpenid: openid,
        expiresAt,
        createdAt: Date.now()
      }
    });

    return {
      openid,
      inviteCode,
      tripId,
      tripName: tripDoc.trip?.name || "新的旅行",
      expiresAt
    };
  }

  if (event.action === "acceptInvite") {
    const inviteCode = event.inviteCode;
    if (!inviteCode) throw new Error("缺少邀请码");

    const invite = await invitations.doc(inviteCode).get();
    if (!invite.data || invite.data.expiresAt < Date.now()) {
      throw new Error("邀请已失效");
    }

    const tripDoc = await getSharedTrip(invite.data.tripId);
    if (!tripDoc) throw new Error("旅行不存在");

    const members = ensureMember(tripDoc.memberOpenids, openid);
    const memberProfiles = {
      ...(tripDoc.memberProfiles || {}),
      [openid]: normalizeMemberProfile(event.memberProfile, openid)
    };
    await sharedTrips.doc(invite.data.tripId).update({
      data: {
        memberOpenids: members,
        memberCount: members.length,
        memberProfiles,
        updatedAt: Date.now()
      }
    });

    return {
      openid,
      tripId: invite.data.tripId,
      tripName: tripDoc.trip?.name || invite.data.tripName || "新的旅行",
      memberCount: members.length
    };
  }

  throw new Error("未知同步操作");
};

async function getSharedTrip(tripId) {
  try {
    const result = await sharedTrips.doc(tripId).get();
    return result.data;
  } catch (error) {
    return undefined;
  }
}

function ensureMember(memberOpenids, openid) {
  const members = Array.isArray(memberOpenids) ? memberOpenids : [];
  return Array.from(new Set([...members, openid]));
}

function createInviteCode() {
  return `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMemberProfile(profile, openid) {
  const nickname = typeof profile?.nickname === "string" ? profile.nickname.trim() : "";
  const avatarUrl = typeof profile?.avatarUrl === "string" ? profile.avatarUrl : "";
  return {
    nickname: nickname || "未设置名字",
    avatarUrl,
    openid,
    updatedAt: Date.now()
  };
}

function profileMapToMembers(memberProfiles) {
  if (!memberProfiles || typeof memberProfiles !== "object") return [];
  return Object.keys(memberProfiles).map((memberOpenid) => {
    const profile = memberProfiles[memberOpenid] || {};
    return {
      openid: memberOpenid,
      nickname: profile.nickname || "未设置名字",
      avatarUrl: profile.avatarUrl || "",
      updatedAt: profile.updatedAt || 0
    };
  });
}

function stripSharedFields(trip) {
  const nextTrip = { ...trip };
  delete nextTrip.sharedMembers;
  delete nextTrip.syncDeletedIds;
  return nextTrip;
}

function mergeTrip(cloudTrip, incomingTrip, deletedIds) {
  return {
    ...cloudTrip,
    ...incomingTrip,
    schedules: removeDeletedItems(mergeById(cloudTrip.schedules, incomingTrip.schedules), deletedIds.schedules).sort(compareSchedule),
    checklist: removeDeletedItems(mergeById(cloudTrip.checklist, incomingTrip.checklist), deletedIds.checklist),
    notes: removeDeletedItems(mergeById(cloudTrip.notes, incomingTrip.notes), deletedIds.notes).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    expenses: removeDeletedItems(mergeById(cloudTrip.expenses, incomingTrip.expenses), deletedIds.expenses).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  };
}

function mergeById(cloudItems, incomingItems) {
  const itemMap = new Map();
  const safeCloudItems = Array.isArray(cloudItems) ? cloudItems : [];
  const safeIncomingItems = Array.isArray(incomingItems) ? incomingItems : [];
  safeCloudItems.forEach((item) => {
    if (item?.id) itemMap.set(item.id, item);
  });
  safeIncomingItems.forEach((item) => {
    if (item?.id) itemMap.set(item.id, item);
  });
  return Array.from(itemMap.values());
}

function compareSchedule(a, b) {
  return `${a?.day || ""} ${a?.time || ""}`.localeCompare(`${b?.day || ""} ${b?.time || ""}`);
}

function normalizeDeletedIds(deletedIds) {
  return {
    schedules: normalizeIdList(deletedIds?.schedules),
    checklist: normalizeIdList(deletedIds?.checklist),
    notes: normalizeIdList(deletedIds?.notes),
    expenses: normalizeIdList(deletedIds?.expenses)
  };
}

function normalizeIdList(ids) {
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && id) : [];
}

function removeDeletedItems(items, deletedIds) {
  if (!deletedIds.length) return items;
  const deletedIdSet = new Set(deletedIds);
  return items.filter((item) => !deletedIdSet.has(item.id));
}
