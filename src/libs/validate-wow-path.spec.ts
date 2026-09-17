import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import { validateWowPath } from "@/libs/validate-wow-path";
import type { Account, AuraType, ConfigState } from "@/stores/config";

const { accessSync, existsSync, readdirSync, statSync } = vi.hoisted(() => ({
  accessSync: vi.fn(),
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("node:fs", () => {
  const constants = { F_OK: 0 };
  return {
    default: { accessSync, constants, existsSync, readdirSync, statSync },
    accessSync,
    constants,
    existsSync,
    readdirSync,
    statSync,
  };
});

vi.mock("node:path", () => {
  const join = (...parts: string[]) => parts.join("/").replace(/\/+/g, "/");

  return { default: { join }, join };
});

vi.mock("@/libs/i18n", () => ({
  i18n: { global: { t: (key: string) => key } },
}));

function createAccount(name: string, auras: AuraType[] = []): Account {
  return {
    name,
    lastWagoUpdate: null,
    auras,
    numAuras: auras.length,
    savedvariableSizeForAddon: [],
  };
}

describe("validateWowPath", () => {
  beforeEach(() => {
    accessSync.mockReset();
    existsSync.mockReset();
    readdirSync.mockReset();
    statSync.mockReset();

    const directories = new Set([
      "/new-wow/Data",
      "/new-wow/_ptr_",
      "/new-wow/_ptr_/WTF/Account",
      "/new-wow/_ptr_/WTF/Account/NEW_ACCOUNT",
      "/new-wow/_retail_",
      "/new-wow/_retail_/WTF/Account",
    ]);
    const filesByDirectory = new Map([
      ["/new-wow", ["_ptr_", "_retail_", "Data"]],
      ["/new-wow/_ptr_/WTF/Account", ["NEW_ACCOUNT"]],
      ["/new-wow/_retail_/WTF/Account", []],
    ]);

    accessSync.mockImplementation((filePath: string) => {
      if (!directories.has(filePath)) throw new Error("Path is not readable");
    });
    existsSync.mockImplementation((filePath: string) =>
      directories.has(filePath),
    );
    readdirSync.mockImplementation(
      (filePath: string) => filesByDirectory.get(filePath) ?? [],
    );
    statSync.mockImplementation((filePath: string) => ({
      isDirectory: () => directories.has(filePath),
    }));
  });

  test("selects discovered versions and accounts after a path change, keeping cached aura data", () => {
    const cachedAura = { slug: "cached" } as AuraType;
    const cachedAccount = createAccount("OLD_ACCOUNT", [cachedAura]);
    const config = {
      wowpath: {
        value: "/new-wow",
        version: "_classic_",
        validated: false,
        versions: [
          {
            name: "_classic_",
            account: "ERA_ACCOUNT",
            accounts: [createAccount("ERA_ACCOUNT", [cachedAura])],
          },
          {
            name: "_ptr_",
            account: "OLD_ACCOUNT",
            accounts: [cachedAccount],
          },
        ],
      },
    } as ConfigState;
    const versionOptions = [];
    const accountOptions = [];

    validateWowPath(config, versionOptions, accountOptions);

    expect(config.wowpath.validated).toBe(true);
    expect(versionOptions.map((option) => option.value)).toEqual([
      "_ptr_",
      "_retail_",
    ]);
    expect(config.wowpath.version).toBe("_ptr_");
    expect(accountOptions.map((option) => option.value)).toEqual([
      "NEW_ACCOUNT",
    ]);

    const selectedVersion = config.wowpath.versions.find(
      (version) => version.name === "_ptr_",
    );
    expect(selectedVersion?.account).toBe("NEW_ACCOUNT");
    expect(selectedVersion?.accounts).toContain(cachedAccount);
    expect(cachedAccount.auras).toContain(cachedAura);
    expect(
      config.wowpath.versions.some((version) => version.name === "_classic_"),
    ).toBe(true);
  });
});
