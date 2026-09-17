import type { UpdateInfo } from "electron-updater";

export const updaterEventChannel = "updaterEvent";

export type UpdaterReleaseInfo = Pick<
  UpdateInfo,
  "version" | "path" | "releaseNotes"
>;

export type UpdaterEvent =
  | { type: "checking-for-update" }
  | { type: "download-progress"; percent: number }
  | { type: "update-available"; updateInfo: UpdaterReleaseInfo }
  | { type: "update-not-available"; updateInfo: UpdaterReleaseInfo }
  | { type: "update-downloaded"; updateInfo: UpdaterReleaseInfo }
  | { type: "error"; error: string; message?: string };

export type UpdaterViewState =
  | { type: "idle" }
  | { type: "checking-for-update" }
  | { type: "download-progress"; percent: number }
  | {
      type: "update-available";
      version: string;
      downloadUrl: string;
      releaseNotes: string;
    }
  | { type: "update-not-available"; version: string }
  | { type: "update-downloaded"; version: string }
  | { type: "error"; error: string; message?: string };

export function toUpdaterViewState(event: UpdaterEvent): UpdaterViewState {
  switch (event.type) {
    case "checking-for-update":
      return { type: "checking-for-update" };
    case "download-progress":
      return {
        type: "download-progress",
        percent: Math.floor(event.percent),
      };
    case "update-available":
      return {
        type: "update-available",
        version: event.updateInfo.version,
        downloadUrl: buildUpdateDownloadUrl(event.updateInfo),
        releaseNotes: formatReleaseNotes(event.updateInfo.releaseNotes),
      };
    case "update-not-available":
      return {
        type: "update-not-available",
        version: event.updateInfo.version,
      };
    case "update-downloaded":
      return {
        type: "update-downloaded",
        version: event.updateInfo.version,
      };
    case "error":
      return {
        type: "error",
        error: event.error,
        ...(event.message === undefined ? {} : { message: event.message }),
      };
  }
}

export function toUpdaterReleaseInfo(info: UpdateInfo): UpdaterReleaseInfo {
  return {
    version: info.version,
    path: info.path,
    releaseNotes: info.releaseNotes,
  };
}

function buildUpdateDownloadUrl(info: UpdaterReleaseInfo): string {
  return `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${info.version}/${info.path}`;
}

function formatReleaseNotes(
  releaseNotes: UpdaterReleaseInfo["releaseNotes"],
): string {
  if (typeof releaseNotes === "string") return releaseNotes;
  if (Array.isArray(releaseNotes)) {
    return releaseNotes.map(({ note }) => note ?? "").join("\n");
  }
  return "";
}
