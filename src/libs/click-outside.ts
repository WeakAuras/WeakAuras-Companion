export default {
  beforeMount(el: HTMLElement, binding: { value: (event: MouseEvent, el: HTMLElement) => void }) {
    el.clickOutsideEvent = function (event: MouseEvent) {
      const classes = [
        "vue3-discord-emojipicker__gifimage",
        "vue3-discord-emojipicker__pickvariation",
        "vue3-discord-emojipicker__emojibutton",
        "vue3-discord-emojipicker__gifbutton",
        "vue3-discord-emojipicker__autocomplete",
        "vue3-discord-emojipicker__input",
      ];

      if (classes.find((classe) => event.target && 'classList' in event.target && event.target.classList.contains(classe))) {
        return;
      }

      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event, el);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent as EventListener);
  },
  unmounted(el: HTMLElement) {
    document.body.removeEventListener("click", el.clickOutsideEvent as EventListener);
  },
};
