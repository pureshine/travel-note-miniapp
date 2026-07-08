"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDelete = confirmDelete;
function confirmDelete(options) {
    wx.showModal({
        title: options.title,
        content: options.content,
        confirmText: "删除",
        confirmColor: "#dc2626",
        success: (result) => {
            if (result.confirm)
                options.onConfirm();
        }
    });
}
