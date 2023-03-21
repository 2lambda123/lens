/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import ipcFileLoggerInjectable from "./ipc-file-logger.injectable";
import { getMessageChannelListenerInjectable } from "../../common/utils/channel/message-channel-listener-injection-token";
import type { IpcFileLogObject } from "../../common/logger/ipc-file-logger-channel";
import { ipcFileLoggerChannel } from "../../common/logger/ipc-file-logger-channel";
import { MESSAGE } from "triple-beam";

/**
 * Winston uses symbol property for the actual message.
 *
 * For that to get through IPC, use the internalMessage property instead
 */
export function deserializeLogFromIpc(ipcFileLogObject: IpcFileLogObject) {
  const { internalMessage, ...standardEntry } = ipcFileLogObject.entry;

  return {
    ...ipcFileLogObject,
    entry: {
      ...standardEntry,
      [MESSAGE]: internalMessage,
    },
  };
}

const ipcFileLoggingListenerInjectable = getMessageChannelListenerInjectable({
  id: "ipc-file-logging",
  channel: ipcFileLoggerChannel,
  handler: (di) => {
    const logger = di.inject(ipcFileLoggerInjectable);

    return (ipcFileLogObject) =>
      logger.log(deserializeLogFromIpc(ipcFileLogObject));
  },
});

export default ipcFileLoggingListenerInjectable;