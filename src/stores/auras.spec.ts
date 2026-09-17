import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { useStashStore } from "@/stores/auras";
import type { AuraType } from "@/stores/config";

describe("stash store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("keeps the first aura for each slug and preserves insertion order", () => {
    const stash = useStashStore();
    const firstAura = { slug: "first" } as AuraType;
    const duplicateAura = { slug: "first", name: "Duplicate" } as AuraType;
    const secondAura = { slug: "second" } as AuraType;

    stash.add(firstAura);
    stash.add(duplicateAura);
    stash.add(secondAura);

    expect(stash.auras).toEqual([firstAura, secondAura]);
  });

  it("clears the stash", () => {
    const stash = useStashStore();
    stash.add({ slug: "first" } as AuraType);

    stash.clear();

    expect(stash.auras).toEqual([]);
  });
});
