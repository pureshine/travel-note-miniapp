import { getActiveTrip, listTrips, setActiveTripId } from "../services/trip-store";
import { Trip } from "../types/trip";

export const activeTripBehavior = Behavior({
  methods: {
    onTripChange(event: { detail: { value: string } }) {
      const page = this as WechatMiniprogram.Page.TrivialInstance & {
        data: { trips: Trip[] };
      };
      const index = Number(event.detail.value);
      const trip = page.data.trips[index];
      if (!trip) return;
      setActiveTripId(trip.id);
      if (typeof page.loadTrip === "function") {
        page.loadTrip(trip.id);
        return;
      }
      if (typeof page.loadSelectedTrip === "function") {
        page.loadSelectedTrip();
      }
    },
    syncActiveTripState(trip?: ReturnType<typeof getActiveTrip>) {
      const trips = listTrips();
      const activeTrip = trip || getActiveTrip();
      return {
        trips,
        trip: activeTrip,
        tripNames: trips.map((item) => item.name),
        activeTripIndex: activeTrip
          ? Math.max(
              trips.findIndex((item) => item.id === activeTrip.id),
              0
            )
          : 0
      };
    }
  }
});
