import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vite-plus/test";

import { useStopMotionStore } from "./stopmotion";

describe("stop motion GIF source", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("switches between local and Tenor sources without retaining old data", () => {
    const store = useStopMotionStore();
    const buffer = Buffer.from("gif data");

    store.selectTenorSource("tenor-123", buffer);
    expect(store.gif.source).toEqual({
      kind: "tenor",
      tenorID: "tenor-123",
      buffer,
    });

    store.selectLocalSource("/clips/local.gif");
    expect(store.gif.source).toEqual({
      kind: "local",
      path: "/clips/local.gif",
    });
  });
});
