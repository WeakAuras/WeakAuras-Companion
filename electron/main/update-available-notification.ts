import type {
  NativeImage,
  NotificationAction,
  NotificationConstructorOptions,
} from "electron";
import type { UpdateInfo } from "electron-updater";

const DOWNLOAD_NOW_ACTION: NotificationAction = {
  type: "button",
  text: "Download Now",
};

const CLOSE_ACTION: NotificationAction = {
  type: "button",
  text: "Close",
};

export const updateAvailableNotificationActions = [
  DOWNLOAD_NOW_ACTION,
  CLOSE_ACTION,
];

export function buildUpdateDownloadUrl(
  info: Pick<UpdateInfo, "version" | "path">,
) {
  return `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${info.version}/${info.path}`;
}

export function buildUpdateAvailableNotificationOptions(
  info: Pick<UpdateInfo, "version">,
  icon: NativeImage,
  platform = process.platform,
): NotificationConstructorOptions {
  return {
    title: "A new update is available",
    body: `WeakAuras Companion ${info.version} is available for download.`,
    icon,
    ...(platform === "win32"
      ? { actions: updateAvailableNotificationActions }
      : {}),
  };
}
