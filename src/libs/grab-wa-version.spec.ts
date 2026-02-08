import { grabVersionFromInstalledAddons } from "@/libs/grab-wa-version";
import { beforeEach, describe, expect, test, vi } from "vitest";

const existsSync = vi.fn();
const readFileSync = vi.fn();
const readdirSync = vi.fn();
const realpathSync = vi.fn();

vi.mock("node:fs", () => ({
  default: { existsSync, readFileSync, readdirSync, realpathSync },
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
}));

describe("grabVersionFromInstalledAddons", () => {
  beforeEach(() => {
    existsSync.mockReset();
    readFileSync.mockReset();
    readdirSync.mockReset();
    realpathSync.mockReset();
  });

  test("returns the full interface list from a WeakAuras toc", () => {
    const wowPath = "/wow";
    const wowVersion = "_retail_";
    const addonFolder = "/wow/_retail_/Interface/AddOns/WeakAuras";
    const tocPath = "/wow/_retail_/Interface/AddOns/WeakAuras/WeakAuras.toc";

    existsSync.mockImplementation((filePath: string) => {
      return filePath === addonFolder || filePath === tocPath;
    });
    realpathSync.mockImplementation((filePath: string) => filePath);
    readFileSync.mockImplementation(() =>
      ["## Interface: 110000, 120000", "## Title: WeakAuras", ""].join("\n"),
    );

    const versions = grabVersionFromInstalledAddons(wowPath, wowVersion);

    expect(versions).toEqual(["110000", "120000"]);
  });

  test("returns a single interface version when only one is present", () => {
    const wowPath = "/wow";
    const wowVersion = "_retail_";
    const addonFolder = "/wow/_retail_/Interface/AddOns/WeakAuras";
    const tocPath = "/wow/_retail_/Interface/AddOns/WeakAuras/WeakAuras.toc";

    existsSync.mockImplementation((filePath: string) => {
      return filePath === addonFolder || filePath === tocPath;
    });
    realpathSync.mockImplementation((filePath: string) => filePath);
    readFileSync.mockImplementation(() =>
      ["## Interface: 120000", "## Title: WeakAuras", ""].join("\n"),
    );

    const versions = grabVersionFromInstalledAddons(wowPath, wowVersion);

    expect(versions).toEqual(["120000"]);
  });

  test("falls back to default list when addons are missing", () => {
    const wowPath = "/wow";
    const wowVersion = "_retail_";

    existsSync.mockImplementation(() => false);

    const versions = grabVersionFromInstalledAddons(wowPath, wowVersion);

    expect(versions).toEqual(["120000"]);
  });
});
