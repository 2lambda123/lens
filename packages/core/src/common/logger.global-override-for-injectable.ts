/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import loggerInjectable from "./logger.injectable";
import { getGlobalOverride } from "@k8slens/test-utils";

export default getGlobalOverride(loggerInjectable, () => ({
  warn: () => {},
  debug: () => {},
  error: () => {},
  info: () => {},
  silly: () => {},
}));
