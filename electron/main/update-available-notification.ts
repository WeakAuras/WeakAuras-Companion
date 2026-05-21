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

export const downloadNowNotificationActionIndex = 0;

export const updateAvailableNotificationActions = [
  DOWNLOAD_NOW_ACTION,
  CLOSE_ACTION,
];

export function buildUpdateDownloadUrl(
  info: Pick<UpdateInfo, "version" | "path">,
) {
  const releaseTag = `v${encodeURIComponent(info.version)}`;
  const assetName = info.path;

  if (/[\\/]/.test(assetName)) {
    return `https://github.com/WeakAuras/WeakAuras-Companion/releases/tag/${releaseTag}`;
  }

  return `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/${releaseTag}/${encodeURIComponent(assetName)}`;
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
