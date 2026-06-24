"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createId = void 0;
function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
exports.createId = createId;
