import { getInjectionToken } from "@ogre-tools/injectable";
import type { Runnable } from "@k8slens/run-many";

export const beforeElectronIsReadyInjectionToken = getInjectionToken<Runnable>({
  id: "before-electron-is-ready-injection-token",
});
