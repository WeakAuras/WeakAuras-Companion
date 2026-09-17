import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

const readFileSync = vi.hoisted(() => vi.fn());

vi.mock("node:fs", () => ({
  default: { readFileSync },
  readFileSync,
}));

vi.mock("electron", () => ({
  ipcRenderer: { invoke: vi.fn() },
}));

vi.mock("got", () => ({
  default: vi.fn(),
}));

vi.mock("./is-addon-installed", () => ({
  isAddonInstalled: vi.fn(),
}));

describe("compareSVwithWago", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    readFileSync.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("keeps cached auras when saved variables have an unsupported root", async () => {
    const { compareSVwithWago } = await import("./compare-sv-with-wago");
    const { parseWeakAurasSVdata } = await import("./parse-sv-data");
    const cachedAura = { slug: "cached-aura" };
    const auras = [cachedAura] as any[];
    const account = { lastWagoUpdate: null } as any;
    const updateFetchingState = vi.fn();
    const writeAddonData = vi.fn();

    readFileSync.mockReturnValue("OtherAddon = {}");

    await compareSVwithWago(
      { wagoApiKey: "" } as any,
      { account: "test-account" } as any,
      account,
      false,
      [
        {
          addonName: "WeakAuras",
          wagoAPI: "https://data.wago.io/api/check/",
          addonDependency: "WeakAuras",
          isInstalled: true,
          hasTypeColumn: false,
          svPathFunction: () => "/saved/variables.lua",
          parseFunction: parseWeakAurasSVdata,
        } as any,
      ],
      "WeakAuras",
      auras,
      updateFetchingState,
      writeAddonData,
    );

    expect(auras).toEqual([cachedAura]);
    expect(auras[0]).toBe(cachedAura);
    expect(updateFetchingState).toHaveBeenNthCalledWith(1, true);
    expect(updateFetchingState).toHaveBeenNthCalledWith(2, false);
    expect(writeAddonData).not.toHaveBeenCalled();
    expect(account.lastWagoUpdate).toBeNull();
  });
});
