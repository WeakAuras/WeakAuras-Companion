import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

const { gotMock, gotPostMock, readFileSync } = vi.hoisted(() => ({
  gotMock: vi.fn(),
  gotPostMock: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: { readFileSync },
  readFileSync,
}));

vi.mock("electron", () => ({
  ipcRenderer: { invoke: vi.fn() },
}));

vi.mock("got", () => ({
  default: Object.assign(gotMock, { post: gotPostMock }),
}));

vi.mock("./is-addon-installed", () => ({
  isAddonInstalled: vi.fn(),
}));

function makeAddon(addonName: string, slugs: string[]) {
  const addonConfig: any = {
    addonName,
    wagoAPI: `https://data.wago.io/api/check/${addonName}`,
    addonDependency: addonName,
    isInstalled: true,
    hasTypeColumn: addonName === "Plater",
    svPathFunction: () => `/${addonName}.lua`,
    parseFunction: () => ({
      status: "valid",
      auras: slugs.map((slug, index) => ({
        addonConfig,
        auraType: addonName,
        auraTypeDisplay: null,
        id: index + 1,
        ignoreWagoUpdate: false,
        semver: "1.0.0",
        slug,
        uid: null,
        version: 1,
      })),
    }),
  };

  return addonConfig;
}

function makeCachedAura(slug: string, addonConfig: any) {
  return {
    addonConfig,
    auraType: addonConfig.addonName,
    auraTypeDisplay: null,
    author: "author",
    encoded: null,
    ids: [1],
    ignoreWagoUpdate: false,
    name: slug,
    regionType: null,
    semver: "1.0.0",
    slug,
    uids: [],
    version: 1,
    wagoSemver: null,
    wagoVersion: null,
  };
}

describe("compareSVwithWago", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    readFileSync.mockReset();
    gotMock.mockReset();
    gotPostMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  test("does not prune a failed add-on when a peer request succeeds", async () => {
    const { compareSVwithWago } = await import("./compare-sv-with-wago");
    const weakAurasConfig = makeAddon("WeakAuras", ["weak-aura"]);
    const platerConfig = makeAddon("Plater", ["plater-aura", "plater-stale"]);
    const auras = [
      makeCachedAura("weak-aura", weakAurasConfig),
      makeCachedAura("plater-aura", platerConfig),
      makeCachedAura("plater-stale", platerConfig),
    ] as any[];
    const account = { lastWagoUpdate: null } as any;
    let finishComparison!: () => void;
    const comparisonFinished = new Promise<void>((resolve) => {
      finishComparison = resolve;
    });
    const updateFetchingState = vi.fn((fetching: boolean) => {
      if (!fetching) {
        finishComparison();
      }
    });

    readFileSync.mockImplementation((filePath: string) => {
      return filePath === "/WeakAuras.lua"
        ? "WeakAurasSaved = {}"
        : "PlaterDB = {}";
    });
    gotPostMock
      .mockRejectedValueOnce({
        request: { requestUrl: { href: "https://data.wago.io/WeakAuras" } },
        response: { statusCode: 503 },
      })
      .mockResolvedValueOnce({
        body: [
          {
            _id: "plater-id",
            changelog: { format: "", text: "" },
            created: "2024-01-01",
            modified: "2024-01-01",
            name: "Plater Aura",
            regionType: "profile",
            slug: "plater-aura",
            username: "author",
            version: 1,
            versionString: "1.0.0",
          },
        ],
      });

    const writeAddonData = vi.fn();

    await compareSVwithWago(
      { wagoApiKey: "" } as any,
      { account: "test-account" } as any,
      account,
      false,
      [weakAurasConfig, platerConfig],
      auras,
      updateFetchingState,
      writeAddonData,
    );
    await comparisonFinished;

    expect(auras.map((aura) => aura.slug)).toEqual([
      "weak-aura",
      "plater-aura",
    ]);
    expect(writeAddonData).toHaveBeenCalledOnce();
    expect(gotPostMock).toHaveBeenCalledTimes(2);
  });

  test("keeps the current 404 behavior for the requested add-on", async () => {
    const { compareSVwithWago } = await import("./compare-sv-with-wago");
    const weakAurasConfig = makeAddon("WeakAuras", ["missing-aura"]);
    const auras = [makeCachedAura("missing-aura", weakAurasConfig)] as any[];
    const account = { lastWagoUpdate: null } as any;
    let finishComparison!: () => void;
    const comparisonFinished = new Promise<void>((resolve) => {
      finishComparison = resolve;
    });
    const updateFetchingState = vi.fn((fetching: boolean) => {
      if (!fetching) {
        finishComparison();
      }
    });

    readFileSync.mockReturnValue("WeakAurasSaved = {}");
    gotPostMock.mockRejectedValueOnce({
      request: { requestUrl: { href: "https://data.wago.io/WeakAuras" } },
      response: { statusCode: 404 },
    });

    await compareSVwithWago(
      { wagoApiKey: "" } as any,
      { account: "test-account" } as any,
      account,
      false,
      [weakAurasConfig],
      auras,
      updateFetchingState,
      vi.fn(),
    );
    await comparisonFinished;

    expect(auras).toEqual([]);
    expect(account.lastWagoUpdate).toBeInstanceOf(Date);
  });

  test("keeps cached auras when a successful request returns invalid data", async () => {
    const { compareSVwithWago } = await import("./compare-sv-with-wago");
    const weakAurasConfig = makeAddon("WeakAuras", ["cached-aura"]);
    const auras = [makeCachedAura("cached-aura", weakAurasConfig)] as any[];
    let finishComparison!: () => void;
    const comparisonFinished = new Promise<void>((resolve) => {
      finishComparison = resolve;
    });
    const updateFetchingState = vi.fn((fetching: boolean) => {
      if (!fetching) {
        finishComparison();
      }
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    readFileSync.mockReturnValue("WeakAurasSaved = {}");
    gotPostMock.mockResolvedValueOnce({
      body: { error: "upstream unavailable" },
    });

    await compareSVwithWago(
      { wagoApiKey: "" } as any,
      { account: "test-account" } as any,
      { lastWagoUpdate: null } as any,
      false,
      [weakAurasConfig],
      auras,
      updateFetchingState,
      vi.fn(),
    );
    await comparisonFinished;

    expect(auras.map((aura) => aura.slug)).toEqual(["cached-aura"]);
  });
});
