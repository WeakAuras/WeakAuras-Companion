export default {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function (event) {
      const classes = [
        "vue3-discord-emojipicker__gifimage",
        "vue3-discord-emojipicker__pickvariation",
        "vue3-discord-emojipicker__emojibutton",
        "vue3-discord-emojipicker__gifbutton",
        "vue3-discord-emojipicker__autocomplete",
        "vue3-discord-emojipicker__input",
      ];

      if (classes.find(classe => event.target.classList.contains(classe))) {
        return;
      }

      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event, el);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
};
