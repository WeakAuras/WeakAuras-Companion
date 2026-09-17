import luaparse from "luaparse";
import { describe, expect, test } from "vite-plus/test";

import { parsePlaterSVdata, parseWeakAurasSVdata } from "./parse-sv-data";

function parseLua(source: string) {
  return luaparse.parse(source, {
    comments: false,
    scope: true,
    locations: true,
    luaVersion: "5.1",
  });
}

describe("saved variable parsers", () => {
  test("treats an empty WeakAuras table as valid data", () => {
    expect(
      parseWeakAurasSVdata(parseLua("WeakAurasSaved = {}"), {
        addonName: "WeakAuras",
      } as any),
    ).toEqual({ status: "valid", auras: [] });
  });

  test("treats an empty Plater table as valid data", () => {
    expect(
      parsePlaterSVdata(parseLua("PlaterDB = {}"), {
        addonName: "Plater",
      } as any),
    ).toEqual({ status: "valid", auras: [] });
  });

  test("rejects a saved variable table with the wrong root", () => {
    const savedData = parseLua("OtherAddon = {}");

    expect(
      parseWeakAurasSVdata(savedData, { addonName: "WeakAuras" } as any),
    ).toEqual({ status: "invalid" });
    expect(
      parsePlaterSVdata(savedData, { addonName: "Plater" } as any),
    ).toEqual({ status: "invalid" });
  });
});
