import { getCustomNavStyle, getSafeTopStyle } from "../utils/ui";

export const pageShellBehavior = Behavior({
  data: {
    safeTopStyle: getSafeTopStyle(14),
    customNavStyle: getCustomNavStyle()
  }
});
