<template>
  <div
    id="updatedAuraList"
    ref="updatedAuraList"
    @click="close"
  >
    <div class="container">
      <h1>{{ $t("app.updatedAuraList.title" /* Ready to install */) }}</h1>
      <div class="updated-auras">
        <Aura
          v-for="aura in stash.auras"
          :key="aura.slug"
          :aura="aura"
        />
      </div>
      <div class="actions">
        <UIButton
          type="reset"
          @click="clearList"
        >
          Clear list
        </UIButton>
      </div>
    </div>
  </div>
</template>

<script lang="js">
import { defineComponent } from "vue";
import UIButton from "./UIButton.vue";
import Aura from "./Aura.vue";
import { useStashStore } from "../../stores/auras";

export default defineComponent({
  components: { UIButton, Aura },
  setup() {
    const stash = useStashStore();

    return {
      stash,
    };
  },
  methods: {
    close() {
      this.$parent.toggleUpdatedAuraList();
    },
    clearList(event) {
      event.preventDefault();
      event.stopPropagation();
      this.stash.$reset();
      this.$parent.toggleUpdatedAuraList();
    },
  },
});
</script>

<style lang="scss" scoped>
#updatedAuraList {
  width: 100%;
  height: 100%;
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  text-align: center;
}

.container {
  position: relative;
  top: 35%;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  width: 90%;
  padding: 15px 15px 25px;
  margin: auto;
}

.updated-auras {
  width: 100%;
}

.actions {
  margin-top: 15px;
}

h1 {
  margin-bottom: 30px;
  color: #e6e6e6;
}
</style>
