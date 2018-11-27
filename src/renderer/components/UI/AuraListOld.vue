<template>
  <div id="aura-list">
    <div v-for="aura in topLevel" :key="aura.id">
      <div :class="aura.type">
        <span
          v-if="aura.isGroup"
          @click="aura.showchilds = !aura.showchilds"
          v-bind:class="{ expandMinus: aura.showchilds, expandPlus: !aura.showchilds }"
        ></span>
        <span class="aura_name">{{ aura.id }}</span>
        <a v-if="aura.shorturl" :href="aura.shorturl" :title="aura.shorturl" class="wago_icon"></a>
        <span
          v-if="aura.wagoVersion && aura.version < aura.wagoVersion"
          :title="'upgrade from v' + aura.version + ' to v' + aura.wagoVersion"
          class="wagoUpgrade"
        ></span>
        <span
          v-if="aura.wagoVersion && aura.version == aura.wagoVersion"
          title="you have last version"
          class="wagoOk"
        ></span>
        <span
          v-if="aura.wagoVersion && aura.version > aura.wagoVersion"
          :title="'your version ('+ aura.version + ') is newer that wago version (' + aura.wagoVersion +')'"
          class="wagoWarning"
        ></span>
        <span v-if="aura.wagoError" class="wagoError" title="error"></span>
      </div>
      <span v-if="aura.isGroup">
        <span v-if="aura.showchilds">
          <div v-for="subaura in childs(aura.id)" :key="subaura.id">
            <div :class="subaura.type">
              <span class="aura_name">{{ subaura.id }}</span>
              <a
                v-if="subaura.shorturl"
                :href="subaura.shorturl"
                :title="subaura.shorturl"
                class="wago_icon"
              ></a>
              <span
                v-if="subaura.wagoVersion && subaura.version < subaura.wagoVersion"
                :title="'upgrade from v' + subaura.version + ' to v' + subaura.wagoVersion"
                class="wagoUpgrade"
              ></span>
              <span
                v-if="subaura.wagoVersion && subaura.version == subaura.wagoVersion"
                title="you have last version"
                class="wagoOk"
              ></span>
              <span
                v-if="subaura.wagoVersion && subaura.version > subaura.wagoVersion"
                :title="'your version ('+ subaura.version + ') is newer that wago version (' + subaura.wagoVersion +')'"
                class="wagoWarning"
              ></span>
              <span v-if="subaura.wagoError" class="wagoError" title="error"></span>
            </div>
          </div>
        </span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "AuraList",
  props: ["auras"],
  computed: {
    sorted: function() {
      function compare(a, b) {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      }
      return this.auras.sort(compare);
    },
    topLevel: function() {
      return this.sorted.filter(aura => !aura.parent);
    }
  },
  methods: {
    childs(id) {
      return this.sorted.filter(aura => aura.parent == id);
    }
  }
};
</script>

<style scoped>
.aura_group,
.aura_toplevel,
.aura_child {
  background-color: rgba(127, 127, 127, 64);
  color: rgb(255, 209, 0);
  margin: 1px;
  height: 32px;
  font-size: 14px;
  padding: 2px;
  vertical-align: middle;
}

.aura_child {
  margin-left: 10px;
}

.expandPlus {
  content: url("~@/assets/UI-PlusButton-Up.png");
  cursor: pointer;
}
.expandPlus:active:hover {
  content: url("~@/assets/UI-PlusButton-Down.png");
  cursor: pointer;
}

.expandMinus {
  content: url("~@/assets/UI-MinusButton-Up.png");
  cursor: pointer;
}
.expandMinus:active:hover {
  content: url("~@/assets/UI-MinusButton-Down.png");
  cursor: pointer;
}

.wago_icon {
  content: url("~@/assets/wago_logo.png");
  width: 25px;
  height: 25px;
  float: right;
  padding: 4px;
  cursor: pointer;
}
.wagoError {
  content: url("~@/assets/error.png");
  width: 25px;
  height: 25px;
  float: right;
  padding: 4px;
  cursor: pointer;
}
.wagoUpgrade {
  content: url("~@/assets/upgrade.png");
  width: 25px;
  height: 25px;
  float: right;
  padding: 4px;
  cursor: pointer;
}
.wagoOk {
  content: url("~@/assets/ok.png");
  width: 25px;
  height: 25px;
  float: right;
  padding: 4px;
  cursor: pointer;
}
.wagoWarning {
  content: url("~@/assets/warning.png");
  width: 25px;
  height: 25px;
  float: right;
  padding: 4px;
  cursor: pointer;
}
</style>
