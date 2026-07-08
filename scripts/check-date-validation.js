const assert = require("node:assert/strict");
const { isTripDateRangeValid } = require("../miniprogram/utils/date");

assert.equal(isTripDateRangeValid("2026-07-07", "2026-07-07"), true);
assert.equal(isTripDateRangeValid("2026-07-06", "2026-07-07"), true);
assert.equal(isTripDateRangeValid("2026-07-07", "2026-07-06"), false);
assert.equal(isTripDateRangeValid("", "2026-07-06"), false);

console.log("date validation ok");
