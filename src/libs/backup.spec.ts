import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { backup } from "@/libs/backup";
import type { AddonConfig, ConfigState } from "@/stores/config";

const { archiver, fs, os, path } = vi.hoisted(() => {
  const module = process.getBuiltinModule(
    "module",
  ) as typeof import("node:module");
  const requireFromProject = module.createRequire(
    `${process.cwd()}/src/libs/backup.spec.ts`,
  );

  return {
    archiver: requireFromProject("archiver"),
    fs: process.getBuiltinModule("fs") as typeof import("node:fs"),
    os: process.getBuiltinModule("os") as typeof import("node:os"),
    path: process.getBuiltinModule("path") as typeof import("node:path"),
  };
});

vi.mock("archiver", () => archiver);
vi.mock("node:fs", () => ({ default: fs, ...fs }));
vi.mock("node:os", () => ({ default: os, ...os }));
vi.mock("node:path", () => ({ default: path, ...path }));

let testDirectory: string;

afterEach(() => {
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

describe("backup", () => {
  it("serializes overlapping requests and saves one file-size baseline", async () => {
    const { account, backupDirectory, config, sourceFile, addon } = setup();

    await Promise.all([backup(config, [addon]), backup(config, [addon])]);

    expect(account.savedvariableSizeForAddon).toEqual([
      { addonName: addon.addonName, fileSize: fs.statSync(sourceFile).size },
    ]);
    expect(fs.readdirSync(backupDirectory)).toHaveLength(1);
  });

  it("uses the backup path and limit captured when the request starts", async () => {
    const { backupDirectory, config, addon } = setup();
    const oldBackup = path.join(
      backupDirectory,
      "WeakAuras-_retail_#Test-20200101000000.zip",
    );
    fs.writeFileSync(oldBackup, Buffer.alloc(6 * 1024 * 1024));

    const otherDirectory = path.join(testDirectory, "other-backups");
    fs.mkdirSync(otherDirectory);
    const pendingBackup = backup(config, [addon]);
    config.backup.path = otherDirectory;
    config.backup.maxSize = 5;

    await pendingBackup;

    expect(fs.readdirSync(backupDirectory)).toHaveLength(2);
    expect(fs.readdirSync(otherDirectory)).toEqual([]);
  });

  it("allows a failed job to be retried", async () => {
    const { account, config, addon } = setup();
    config.backup.path = path.join(testDirectory, "missing-directory");

    await expect(backup(config, [addon])).rejects.toThrow();
    expect(account.savedvariableSizeForAddon).toEqual([]);

    fs.mkdirSync(config.backup.path);
    await backup(config, [addon]);

    expect(account.savedvariableSizeForAddon).toHaveLength(1);
    expect(fs.readdirSync(config.backup.path)).toHaveLength(1);
  });
});

function setup() {
  testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wac-backup-"));
  const sourceFile = path.join(testDirectory, "WeakAuras.lua");
  const backupDirectory = path.join(testDirectory, "backups");
  fs.mkdirSync(backupDirectory);
  fs.writeFileSync(sourceFile, "saved variable data");

  const account = {
    auras: [],
    lastWagoUpdate: null,
    name: "Test",
    numAuras: 0,
    savedvariableSizeForAddon: [],
  };
  const config: ConfigState = {
    autostart: false,
    autoupdate: false,
    backup: {
      active: true,
      defaultBackupPath: backupDirectory,
      maxSize: 100,
      path: backupDirectory,
    },
    beta: false,
    ignoreOwnAuras: false,
    lang: "en",
    notify: false,
    startminimize: false,
    wagoApiKey: null,
    wagoUsername: null,
    wowpath: {
      validated: true,
      value: testDirectory,
      version: "_retail_",
      versions: [{ name: "_retail_", accounts: [account] }],
    },
  };
  const addon: AddonConfig = {
    addonDependency: "",
    addonName: "WeakAuras",
    hasTypeColumn: false,
    isInstalled: true,
    parseFunction: () => ({ status: "invalid" }),
    svPathFunction: () => sourceFile,
    wagoAPI: "",
  };

  return { account, addon, backupDirectory, config, sourceFile };
}
