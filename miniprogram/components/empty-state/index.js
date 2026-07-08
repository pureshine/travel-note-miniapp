"use strict";
Component({
    properties: {
        icon: { type: String, value: "+" },
        title: { type: String, value: "" },
        desc: { type: String, value: "" },
        buttonText: { type: String, value: "" },
        panel: { type: Boolean, value: false },
        extraClass: { type: String, value: "" }
    },
    methods: {
        onTap() {
            this.triggerEvent("action");
        }
    }
});
