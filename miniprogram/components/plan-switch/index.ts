Component({
  data: {
    showOptions: false
  },
  properties: {
    tripOptions: { type: Array, value: [] },
    activeIndex: { type: Number, value: 0 },
    tripName: { type: String, value: "" },
    statusText: { type: String, value: "" },
    statusClass: { type: String, value: "" },
    showMenu: { type: Boolean, value: false }
  },
  methods: {
    onToggleOptions() {
      this.setData({ showOptions: !this.data.showOptions });
    },
    onSelectOption(event: { currentTarget: { dataset: { index: string } } }) {
      const index = Number(event.currentTarget.dataset.index);
      this.setData({ showOptions: false });
      this.triggerEvent("change", { value: String(index) });
    },
    onMenuTap() {
      this.triggerEvent("menu");
    }
  }
});
