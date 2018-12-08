<template>
  <div id="about">
    <div>
      {{
        $t(
          "app.about.version",
          { version: version } /* WeakAuras Companion version {version} */
        )
      }}
    </div>
    <br /><br />
    <div style="display: flex">
      <div style="flex: 50%">
        <h2>{{ $t("app.about.weakaurasteam" /* WeakAuras Team */) }}</h2>
        <br />
        <div
          v-for="media in medias.weakauras"
          class="media-item"
          :key="media.name"
        >
          <a :href="media.url" target="_blank">
            <img
              :src="require(`@/assets/${media.name}.png`)"
              class="logo"
              :title="media.name"
            />
            {{ media.name | capitalize }}
          </a>
        </div>
      </div>
      <div style="flex: 50%">
        <h2>{{ $t("app.about.wago" /* Wago */) }}</h2>
        <br />
        <div v-for="media in medias.wago" class="media-item" :key="media.name">
          <a :href="media.url" target="_blank">
            <img
              :src="require(`@/assets/${media.name}.png`)"
              class="logo"
              :title="media.name"
            />
            {{ media.name | capitalize }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const medias = require("../libs/contacts.js");

// console.log(`VERSION: ${VERSION}`);
export default {
  name: "about",
  data() {
    return {
      medias,
      // eslint-disable-next-line no-undef
      version: VERSION
    };
  },
  filters: {
    capitalize: string => string.charAt(0).toUpperCase() + string.slice(1)
  }
};
</script>

<style scoped>
#about {
  margin: 10px 50px;
  text-align: left;
}
#about a {
  display: flex;
  align-items: center;
}
#about img {
  margin-right: 10px;
}
#about > .valign {
  flex: 50%;
  align-items: center;
}
.media-item {
  margin: 10px 5px;
}
.logo {
  opacity: 1;
}
</style>
