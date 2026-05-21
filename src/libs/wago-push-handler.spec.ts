import { beforeEach, describe, expect, test, vi } from "vitest";

import hash from "./hash";

const gotMock = vi.hoisted(() => vi.fn());

vi.mock("got", () => ({
  default: gotMock,
}));

describe("wagoPushHandler", () => {
  beforeEach(() => {
    vi.resetModules();
    gotMock.mockReset();
  });

  test("passes got options when fetching metadata and encoded data", async () => {
    const { wagoPushHandler } = await import("./wago-push-handler");

    gotMock
      .mockResolvedValueOnce({
        body: [
          {
            _id: "wago-id",
            changelog: "notes",
            name: "Aura Name",
            slug: "test-slug",
            type: "WEAKAURA",
            username: "author",
            version: 123,
            versionString: "123.0.0",
          },
        ],
      })
      .mockResolvedValueOnce({
        body: "encoded-data",
      });

    const stash = {
      add: vi.fn(),
      auras: [],
    };

    await wagoPushHandler(
      { wagoApiKey: "api-key" } as any,
      "test-slug",
      stash as any,
      { account: "AccountName" } as any,
    );

    const expectedIdentifier = hash.hashFnv32a("AccountName", true).toString();

    expect(gotMock).toHaveBeenNthCalledWith(
      1,
      "https://data.wago.io/api/check/?ids=test-slug",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Identifier": expectedIdentifier,
          "User-Agent": expect.stringContaining("WeakAuras Companion"),
          "api-key": "api-key",
        }),
        http2: true,
        responseType: "json",
        timeout: {
          request: 30000,
        },
      }),
    );

    expect(gotMock).toHaveBeenNthCalledWith(
      2,
      "https://data.wago.io/api/raw/encoded?id=wago-id",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Identifier": expectedIdentifier,
          "api-key": "api-key",
        }),
        http2: true,
        responseType: "text",
        timeout: {
          request: 30000,
        },
      }),
    );

    expect(stash.add).toHaveBeenCalledWith(
      expect.objectContaining({
        author: "author",
        auraType: "WeakAuras",
        encoded: "encoded-data",
        name: "Aura Name",
        slug: "test-slug",
        source: "Wago",
        versionNote: "notes",
        wagoSemver: "123.0.0",
        wagoVersion: 123,
      }),
    );
  });

  test("skips requests when aura already exists in stash", async () => {
    const { wagoPushHandler } = await import("./wago-push-handler");

    await wagoPushHandler(
      { wagoApiKey: "api-key" } as any,
      "test-slug",
      {
        add: vi.fn(),
        auras: [{ slug: "test-slug" }],
      } as any,
      { account: "AccountName" } as any,
    );

    expect(gotMock).not.toHaveBeenCalled();
  });
});
