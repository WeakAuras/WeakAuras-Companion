import { createApp, defineComponent, h, nextTick, ref } from "vue";

import { afterEach, describe, expect, test } from "vite-plus/test";
import { createI18n } from "vue-i18n";

import Dropdown from "@/components/UI/Dropdown.vue";

describe("Dropdown", () => {
  let app: ReturnType<typeof createApp> | undefined;
  let container: HTMLDivElement;

  afterEach(() => {
    app?.unmount();
    app = undefined;
    container?.remove();
  });

  test("renders current option labels and placeholder, updates height, and emits selection events", async () => {
    const value = ref<string | number>("a");
    const options = ref([
      { text: "Alpha", value: "a" },
      { text: "Beta", value: "b" },
    ]);
    const placeholder = ref("Choose an option");
    const updates: Array<string | number> = [];
    let changes = 0;
    const Harness = defineComponent({
      setup() {
        return () =>
          h(Dropdown, {
            "label": "Version",
            "value": value.value,
            "options": options.value,
            "placeholder": placeholder.value,
            "onUpdate:value": (nextValue: string | number) => {
              updates.push(nextValue);
              value.value = nextValue;
            },
            "onChange": () => {
              changes += 1;
            },
          });
      },
    });
    const i18n = createI18n({
      legacy: false,
      locale: "en",
      messages: { en: { app: { dropdown: { placeholder: "Select..." } } } },
    });

    container = document.createElement("div");
    document.body.append(container);
    app = createApp(Harness).use(i18n);
    app.mount(container);

    const toggle = container.querySelector(".dropdown__toggle");
    const selected = container.querySelector(".dropdown__toggle span");
    const menu = container.querySelector(".dropdown__options");
    expect(container.textContent).toContain("Version");
    expect(selected?.textContent).toBe("Alpha");

    toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(menu?.getAttribute("style")).toContain("height: 60px");

    const beta = [...container.querySelectorAll(".dropdown__option")].find(
      (option) => option.textContent?.trim() === "Beta",
    );
    beta?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(selected?.textContent).toBe("Beta");
    expect(updates).toEqual(["b"]);
    expect(changes).toBe(1);

    options.value.splice(0, options.value.length, {
      text: "Updated Alpha",
      value: "a",
    });
    value.value = "a";
    await nextTick();
    expect(selected?.textContent).toBe("Updated Alpha");
    toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(menu?.getAttribute("style")).toContain("height: 30px");

    value.value = "";
    await nextTick();
    expect(selected?.textContent).toBe("Choose an option");

    placeholder.value = "Choose a version";
    await nextTick();
    expect(selected?.textContent).toBe("Choose a version");
  });
});
