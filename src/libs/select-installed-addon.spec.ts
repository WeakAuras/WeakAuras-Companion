import { describe, expect, test } from "vite-plus/test";

import { selectInstalledAddon } from "@/libs/select-installed-addon";

describe("selectInstalledAddon", () => {
  test("keeps the selected addon when it is installed", () => {
    const installedAddons = [
      { addonName: "WeakAuras" },
      { addonName: "Plater" },
    ];

    expect(selectInstalledAddon(installedAddons, "Plater")).toBe("Plater");
  });

  test("selects Plater when it is the only installed addon", () => {
    expect(selectInstalledAddon([{ addonName: "Plater" }], "WeakAuras")).toBe(
      "Plater",
    );
  });

  test("clears selection when no addon is installed", () => {
    expect(selectInstalledAddon([], "WeakAuras")).toBe("");
  });
});
