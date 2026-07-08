Component({
  properties: {
    tripOptions: { type: Array, value: [] },
    activeIndex: { type: Number, value: 0 },
    tripName: { type: String, value: "" },
    statusText: { type: String, value: "" },
    statusClass: { type: String, value: "" },
    showMenu: { type: Boolean, value: false }
  },
  methods: {
    onPickerChange(event: { detail: { value: string } }) {
      this.triggerEvent("change", { value: event.detail.value });
    },
    onMenuTap() {
      this.triggerEvent("menu");
    }
  }
});
