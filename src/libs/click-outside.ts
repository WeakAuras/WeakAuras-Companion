import type { Directive } from "vue";

const handlers = new WeakMap<HTMLElement, (event: Event) => void>();

const clickOutside: Directive<HTMLElement> = {
  beforeMount(el, binding) {
    const handler = function (event: Event) {
      const classes = [
        "vue3-discord-emojipicker__gifimage",
        "vue3-discord-emojipicker__pickvariation",
        "vue3-discord-emojipicker__emojibutton",
        "vue3-discord-emojipicker__gifbutton",
        "vue3-discord-emojipicker__autocomplete",
        "vue3-discord-emojipicker__input",
      ];

      const target = event.target as HTMLElement;
      if (classes.find((classe) => target.classList?.contains(classe))) {
        return;
      }

      if (!(el === target || el.contains(target))) {
        binding.value(event, el);
      }
    };
    handlers.set(el, handler);
    document.body.addEventListener("click", handler);
  },
  unmounted(el) {
    const handler = handlers.get(el);
    if (handler) {
      document.body.removeEventListener("click", handler);
      handlers.delete(el);
    }
  },
};

export default clickOutside;
