import type { NativeImage } from "electron";
import { describe, expect, it } from "vitest";

import {
  buildUpdateAvailableNotificationOptions,
  buildUpdateDownloadUrl,
  updateAvailableNotificationActions,
} from "../../electron/main/update-available-notification";

describe("update-available-notification", () => {
  const icon = {} as NativeImage;

  it("builds the release download url from update info", () => {
    expect(
      buildUpdateDownloadUrl({
        version: "5.3.1",
        path: "WeakAuras-Companion-5.3.1.exe",
      }),
    ).toBe(
      "https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v5.3.1/WeakAuras-Companion-5.3.1.exe",
    );
  });

  it("adds native actions to update notifications on Windows", () => {
    const notification = buildUpdateAvailableNotificationOptions(
      { version: "5.3.1" },
      icon,
      "win32",
    );

    expect(notification.actions).toEqual(updateAvailableNotificationActions);
  });

  it("leaves actions unset on other platforms", () => {
    const notification = buildUpdateAvailableNotificationOptions(
      { version: "5.3.1" },
      icon,
      "linux",
    );

    expect(notification.actions).toBeUndefined();
  });

  it("falls back to the release page for paths containing directory separators", () => {
    expect(
      buildUpdateDownloadUrl({
        version: "5.3.1",
        path: "../WeakAuras-Companion-5.3.1.exe",
      }),
    ).toBe(
      "https://github.com/WeakAuras/WeakAuras-Companion/releases/tag/v5.3.1",
    );
  });

  it("builds the download url for asset names containing spaces", () => {
    expect(
      buildUpdateDownloadUrl({
        version: "5.3.1",
        path: "WeakAuras Companion 5.3.1.exe",
      }),
    ).toBe(
      "https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v5.3.1/WeakAuras%20Companion%205.3.1.exe",
    );
  });
});
