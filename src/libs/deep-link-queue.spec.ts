import { describe, expect, it } from "vite-plus/test";

import { createDeepLinkQueue } from "./deep-link-queue";

describe("deep link queue", () => {
  it("holds a cold-start protocol URL until the renderer is ready", () => {
    const delivered: string[] = [];
    const queue = createDeepLinkQueue((link) => delivered.push(link));

    queue.enqueue("weakauras-companion://wago/push/cold-start");
    expect(delivered).toEqual([]);

    queue.markReady();

    expect(delivered).toEqual(["weakauras-companion://wago/push/cold-start"]);
  });

  it("preserves second-instance URL order while the renderer is loading", () => {
    const delivered: string[] = [];
    const queue = createDeepLinkQueue((link) => delivered.push(link));

    queue.enqueue("weakauras-companion://wago/push/first-instance");
    queue.enqueue("weakauras-companion://wago/push/second-instance");
    expect(delivered).toEqual([]);

    queue.markReady();

    expect(delivered).toEqual([
      "weakauras-companion://wago/push/first-instance",
      "weakauras-companion://wago/push/second-instance",
    ]);
  });

  it("holds macOS open-url events before readiness and sends later events once", () => {
    const delivered: string[] = [];
    const queue = createDeepLinkQueue((link) => delivered.push(link));

    queue.enqueue("weakauras-companion://wago/push/before-ready");
    expect(delivered).toEqual([]);

    queue.markReady();
    queue.enqueue("weakauras-companion://wago/push/after-ready");
    queue.markReady();

    expect(delivered).toEqual([
      "weakauras-companion://wago/push/before-ready",
      "weakauras-companion://wago/push/after-ready",
    ]);
  });

  it("holds new URLs while the renderer reloads and resumes in order", () => {
    const delivered: string[] = [];
    const queue = createDeepLinkQueue((link) => delivered.push(link));

    queue.markReady();
    queue.enqueue("weakauras-companion://wago/push/before-reload");
    queue.markNotReady();
    queue.enqueue("weakauras-companion://wago/push/during-reload");
    expect(delivered).toEqual([
      "weakauras-companion://wago/push/before-reload",
    ]);

    queue.markReady();
    queue.enqueue("weakauras-companion://wago/push/after-reload");

    expect(delivered).toEqual([
      "weakauras-companion://wago/push/before-reload",
      "weakauras-companion://wago/push/during-reload",
      "weakauras-companion://wago/push/after-reload",
    ]);
  });
});
