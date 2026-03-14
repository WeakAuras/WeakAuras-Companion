import { beforeEach, describe, expect, test, vi } from "vitest";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("electron", () => ({
  ipcRenderer: {
    invoke: invokeMock,
  },
}));

describe("i18n", () => {
  beforeEach(() => {
    vi.resetModules();
    invokeMock.mockReset();
  });

  test("loads the saved locale and supports switching locales", async () => {
    invokeMock.mockResolvedValue("en");

    const { i18n } = await import("./i18n");

    expect(invokeMock).toHaveBeenCalledWith("getLang");
    expect(i18n.global.t("app.config.lang")).toBe("Language");

    i18n.global.locale.value = "de";

    expect(i18n.global.t("app.config.lang")).toBe("Sprache");
  });
});
