"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageShellBehavior = void 0;
const ui_1 = require("../utils/ui");
exports.pageShellBehavior = Behavior({
    data: {
        safeTopStyle: (0, ui_1.getSafeTopStyle)(14),
        customNavStyle: (0, ui_1.getCustomNavStyle)()
    }
});
