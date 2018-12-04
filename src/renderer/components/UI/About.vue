<template>
  <div id="about" style="display: flex">
    <div style="flex: 50%">
      <h2>WeakAuras Team</h2>
      <br />
      <div v-for="media in weakauras" class="media-item" :key="media.name">
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
      <h2>Wago</h2>
      <br />
      <div v-for="media in wago" class="media-item" :key="media.name">
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
</template>

<script>
const medias = require("../libs/contacts.js");

export default {
  name: "about",
  data() {
    return medias;
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
