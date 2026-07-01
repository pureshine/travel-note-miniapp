Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/schedule/schedule",
        text: "日程",
        iconPath: "/assets/tabbar/schedule-normal.png",
        selectedIconPath: "/assets/tabbar/schedule-active.png"
      },
      {
        pagePath: "/pages/notes/notes",
        text: "备忘",
        iconPath: "/assets/tabbar/notes-normal.png",
        selectedIconPath: "/assets/tabbar/notes-active.png"
      },
      {
        pagePath: "/pages/stats/stats",
        text: "消费",
        iconPath: "/assets/tabbar/expense-normal.png",
        selectedIconPath: "/assets/tabbar/expense-active.png"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "/assets/tabbar/profile-normal.png",
        selectedIconPath: "/assets/tabbar/profile-active.png"
      }
    ]
  },
  methods: {
    switchTab(event) {
      const path = event.currentTarget.dataset.path;
      if (!path) return;
      wx.switchTab({ url: path });
    }
  }
});
