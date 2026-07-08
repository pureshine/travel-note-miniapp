"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeTripBehavior = void 0;
const trip_store_1 = require("../services/trip-store");
exports.activeTripBehavior = Behavior({
    methods: {
        onTripChange(event) {
            const page = this;
            const index = Number(event.detail.value);
            const trip = page.data.trips[index];
            if (!trip)
                return;
            (0, trip_store_1.setActiveTripId)(trip.id);
            if (typeof page.loadTrip === "function") {
                page.loadTrip(trip.id);
                return;
            }
            if (typeof page.loadSelectedTrip === "function") {
                page.loadSelectedTrip();
            }
        },
        syncActiveTripState(trip) {
            const trips = (0, trip_store_1.listTrips)();
            const activeTrip = trip || (0, trip_store_1.getActiveTrip)();
            return {
                trips,
                trip: activeTrip,
                tripNames: trips.map((item) => item.name),
                activeTripIndex: activeTrip
                    ? Math.max(trips.findIndex((item) => item.id === activeTrip.id), 0)
                    : 0
            };
        }
    }
});
