export function confirmDelete(options: {
  title: string;
  content: string;
  onConfirm: () => void;
}): void {
  wx.showModal({
    title: options.title,
    content: options.content,
    confirmText: "删除",
    confirmColor: "#dc2626",
    success: (result) => {
      if (result.confirm) options.onConfirm();
    }
  });
}
