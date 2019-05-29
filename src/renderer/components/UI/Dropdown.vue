<template>
  <div class="dropdown">
    <label v-if="label" class="dropdown__label"> {{ label }} </label>
    <div
      class="dropdown__toggle"
      :class="{ 'dropdown__toggle--toggled': showMenu }"
      @click="toggleDropdown()"
    >
      <span>{{ selected }}</span>
      <i :class="{ open: showMenu }" class="material-icons">
        keyboard_arrow_down
      </i>
    </div>
    <div
      :style="{ height: showMenu ? height + 'px' : '0px' }"
      :class="{ 'dropdown__options--toggled': showMenu }"
      class="dropdown__options"
    >
      <div
        v-for="option in options"
        :key="option.name"
        class="dropdown__option"
        :title="option.name"
        @click="selectItem(option.name)"
      >
        <span>{{ option.name }}</span>
      </div>
    </div>
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
    this.selected = this.value === "" ? this.placeholder : this.value;
    this.height = this.options.length * 30;
  },
  methods: {
    toggleDropdown() {
      this.showMenu = !this.showMenu;
    },
    selectItem(option) {
      this.showMenu = false;
      this.selected = option;
      this.$emit("input", option);
    }
  }
};
</script>

<style scoped lang="scss">
$button-color-bg: #101010;
$border-color-separate: #0d0d0d;
$highlight-color: #1a1a1a;
$highlight-color-text: #ffffff;
$text-color: #e6e6e6;
$border-color: #191919;
$border-color-expand: #2c2c2c;

$max-width: 200px;
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
    max-width: $max-width;

    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    height: 30px;
    background: $button-color-bg;
    padding: 5px 30px 5px 10px;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid $border-color;
    transition: border-color 0.3s ease-in-out,
      border-radius 0.3s cubic-bezier(1, -0.21, 1, -1.65);

    &--toggled {
      border-radius: 4px 4px 0 0;
      border-color: $border-color-expand;
      border-bottom-color: transparent;
      transition: border-radius 0.3s cubic-bezier(0, 1.95, 0, 1.93);
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
      cursor: pointer;

      &.open {
        transform: rotate(180deg);
      }
    }
    span {
      cursor: pointer;
    }
  }
  &__options {
    width: 100%;
    cursor: pointer;
    position: relative;
    border-radius: 0 0 4px 4px;

    max-width: $max-width;
    transition: height 0.3s ease-in-out, border-color 0.2s ease-in-out,
      background 0.2s ease-in-out;
    overflow: hidden;
    border: 1px solid transparent;
    &--toggled {
      background: $button-color-bg;
      border-color: $border-color-expand;
      border-top-color: $border-color-separate;
    }
  }
  &__option {
    cursor: pointer;
    width: 100%;
    height: 30px;
    padding: 5px 25px 5px 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:last-child {
      border-radius: 0 0 4px 4px;
    }
    position: relative;
    &:hover {
      background: $highlight-color;
    }

    span {
      cursor: pointer;
      padding: 0 5px;
    }
  }
}
</style>
