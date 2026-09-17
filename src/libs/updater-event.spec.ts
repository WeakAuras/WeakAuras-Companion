import { describe, expect, it } from "vite-plus/test";

import { toUpdaterViewState } from "./updater-event";
import type { UpdaterEvent } from "./updater-event";

const updateInfo = {
  version: "5.4.0",
  path: "WeakAuras-Companion-5.4.0.dmg",
  releaseNotes: [
    { version: "5.4.0", note: "First change" },
    { version: "5.3.9", note: null },
    { version: "5.3.8", note: "Second change" },
  ],
};

describe("updater event state", () => {
  it("shows checking without retaining display fields from a previous update", () => {
    const event: UpdaterEvent = { type: "checking-for-update" };

    expect(toUpdaterViewState(event)).toEqual({
      type: "checking-for-update",
    });
  });

  it("rounds download progress down to the displayed whole percent", () => {
    const event: UpdaterEvent = {
      type: "download-progress",
      percent: 42.9,
    };

    expect(toUpdaterViewState(event)).toEqual({
      type: "download-progress",
      percent: 42,
    });
  });

  it("derives the release URL and joins release notes for an available update", () => {
    const event: UpdaterEvent = {
      type: "update-available",
      updateInfo,
    };

    expect(toUpdaterViewState(event)).toEqual({
      type: "update-available",
      version: "5.4.0",
      downloadUrl:
        "https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v5.4.0/WeakAuras-Companion-5.4.0.dmg",
      releaseNotes: "First change\n\nSecond change",
    });
  });

  it("clears update-only fields when no update is available", () => {
    const event: UpdaterEvent = {
      type: "update-not-available",
      updateInfo,
    };

    expect(toUpdaterViewState(event)).toEqual({
      type: "update-not-available",
      version: "5.4.0",
    });
  });

  it("keeps only the version after the update has downloaded", () => {
    const event: UpdaterEvent = {
      type: "update-downloaded",
      updateInfo,
    };

    expect(toUpdaterViewState(event)).toEqual({
      type: "update-downloaded",
      version: "5.4.0",
    });
  });

  it("preserves updater errors as serializable text", () => {
    const event: UpdaterEvent = {
      type: "error",
      error: "Network unavailable",
      message: "Request timed out",
    };

    expect(toUpdaterViewState(event)).toEqual(event);
  });
});
