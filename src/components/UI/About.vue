<template>
  <div id="about">
    <div id="main">
      <h2>WeakAuras Companion</h2>
      <br />
      <p>
        {{
          $t(
            "app.about.tools",
            { tools: "Electron &amp; Vue" } /* Developed with {tools} */
          )
        }}<br />
        {{
          $t(
            "app.about.version",
            { version: version } /* Version: {version} */
          )
        }}<br />
        {{
          $t(
            "app.about.license",
            { license: "GPLv2" } /* License: {license} */
          )
        }}<br />
        {{ $t("app.about.source" /* Sources on */) }}
        <a
          href="https://github.com/WeakAuras/WeakAuras-Companion"
          target="_blank"
          >GitHub</a
        >
      </p>
      <br />
    </div>
    <div id="links">
      <div style="flex: 50%;">
        <div class="title">WeakAuras</div>
        <div class="items">
          <div
            v-for="media in medias.weakauras"
            :key="media.name"
            class="media-item"
          >
            <a :href="media.url" target="_blank">
              <img
                :src="require(`@/assets/social-icons/${media.name}.svg`)"
                class="logo"
                :title="media.name"
              />
              {{ media.displayName }}
            </a>
          </div>
        </div>
      </div>
      <div style="flex: 50%;">
        <div class="title">Wago</div>
        <div class="items">
          <div
            v-for="media in medias.wago"
            :key="media.name"
            class="media-item"
          >
            <a :href="media.url" target="_blank">
              <img
                :src="require(`@/assets/social-icons/${media.name}.svg`)"
                class="logo"
                :title="media.name"
              />
              {{ media.displayName }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const medias = require("../libs/contacts.js");
const VERSION = require("../../../package.json").version;
// console.log(`VERSION: ${VERSION}`);
export default {
  name: "About",
  filters: {
    capitalize: (string) => string.charAt(0).toUpperCase() + string.slice(1),
  },
  data() {
    return {
      medias,
      // eslint-disable-next-line no-undef
      version: VERSION,
    };
  },
};
</script>

<style scoped lang="scss">
#about {
  padding: 10px 2.35vw;
  text-align: left;
  height: 100%;
  position: relative;
  font-weight: 500;
}
#links a {
  align-items: center;
  vertical-align: middle;
}
#about img {
  margin-right: 10px;
  vertical-align: middle;
  cursor: pointer;
}
#about > .valign {
  flex: 50%;
  align-items: center;
}
#main {
  font-weight: 100;
  text-align: center;
  width: 100%;
  margin: auto;
}
#links {
  display: flex;
  width: 450px;
  margin: auto;
  border-radius: 8px;
  padding-bottom: 5px;
}
.media-item {
  margin: 10px 15px;
  cursor: pointer;
}
.logo {
  opacity: 1;
  width: 25px;
  top: 0;
}
.title {
  border-left: none;
  border-bottom: 2px solid rgb(255, 209, 0);
  border-radius: 8px 8px 0 0;
  text-align: center;
  background-color: rgba(0, 0, 0, 0);
}
a:hover {
  color: rgb(255, 209, 0);
}
.fab {
  margin-right: 5px;
  font-size: 22px;
  color: #e6e6e6 !important;
}
.items {
  margin: 0 30px;
}
</style>
