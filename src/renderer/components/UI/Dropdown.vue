<template>
  <div class="dropdown">
    <label v-if="label" class="dropdown__label"> {{ label }} </label>
    <div
      class="dropdown__toggle"
      :class="{ 'dropdown__toggle--toggled': showMenu }"
      @click="toggleDropdown()"
    >
      <span>{{ value }}</span>
      <i :class="{ open: showMenu }" class="material-icons">
        keyboard_arrow_down
      </i>
    </div>
    <input
      hidden="hidden"
      v-bind="$attrs"
      :value="value"
      @change="$emit('input', $event.target.value)"
    />
    <transition name="slide">
      <div
        v-if="showMenu"
        :style="{ height: height + 'px' }"
        class="dropdown__options"
      >
        <div
          v-for="option in options"
          :key="option.name"
          class="dropdown__option"
          @click="selectItem(option.name)"
        >
          <span>{{ option.name }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    value: { type: [String, Object], default: "" },
    options: {
      type: [Array, Object],
      default() {
        return ["0"];
      }
    },
    label: { type: [String, null], default: null },
    placeholder: {
      type: String,
      default() {
        return this.$t("app.dropdown.placeholder" /* Select... */);
      }
    }
  },
  data() {
    return {
      selected: "",
      showMenu: false,
      height: "auto"
    };
  },
  mounted() {
    if (this.value === "") {
      this.value = this.placeholder;
    }
    this.height = this.options.length * 30;
  },
  methods: {
    toggleDropdown() {
      this.showMenu = !this.showMenu;
    },
    selectItem(option) {
      this.value = option;
      this.showMenu = false;
      this.$emit("input", this.value);
    }
  }
};
</script>

<style scoped lang="scss">
$button-color-bg: #101010;
$highlight-color: #1a1a1a;
$highlight-color-text: #ffffff;
$text-color: #e6e6e6;
.dropdown {
  position: relative;
  z-index: 999;
  font-size: 14px;
  font-weight: 500;
  color: $text-color;
  margin: 0 2px;
  &__label {
    font-size: 10px;
    padding-left: 5px;
  }
  &__toggle {
    position: relative;
    width: 100%;
    min-width: 120px;
    height: 30px;
    background: $button-color-bg;
    padding: 5px 10px;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    &--toggled {
      border-radius: 4px 4px 0 0;
    }
    &:hover {
      background: $highlight-color;
    }
    i {
      position: absolute;
      top: 3px;
      right: 4px;
      display: inline-block;
      transition: transform 0.3s ease-in-out;

      &.open {
        transform: rotate(180deg);
      }
    }
    span {
      cursor: pointer;
      padding-right: 20px;
    }
  }
  &__options {
    background: $button-color-bg;
    width: 100%;
    cursor: pointer;
    position: relative;
    border-radius: 0 0 4px 4px;
    transition: height 0.3s ease-in-out;
    overflow: hidden;
  }
  &__option {
    cursor: pointer;
    width: 100%;
    height: 30px;
    padding: 5px;
    border-radius: 0 0 4px 4px;
    position: relative;
    &:hover {
      background: $highlight-color;
    }

    span {
      position: absolute;
      left: 10px;
      top: 6px;
      cursor: pointer;
    }
  }
}
.slide-enter,
.slide-leave-to {
  height: 0 !important;
}
.alpha-enter,
.alpha-leave-to {
  opacity: 0;
}
</style>
