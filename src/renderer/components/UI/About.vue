<template>
  <div id="about" style="display: flex">
    <div style="flex: 50%">
      <h2>WeakAuras Team</h2>
      <br />
      <div v-for="contact in weakauras" class="media-item" :key="contact.media">
        <a :href="contact.url" target="_blank">
          <img
            :src="require(`@/assets/${contact.media}.png`)"
            class="logo"
            :title="contact.media"
          />
          {{ contact.media | capitalize }}
        </a>
      </div>
    </div>
    <div style="flex: 50%">
      <h2>Wago</h2>
      <br />
      <div v-for="contact in wago" class="media-item" :key="contact.media">
        <a :href="contact.url" target="_blank">
          <img
            :src="require(`@/assets/${contact.media}.png`)"
            class="logo"
            :title="contact.media"
          />
          {{ contact.media | capitalize }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "about",
  data() {
    return {
      weakauras: [
        { media: "discord", url: "https://discord.gg/wa2" },
        { media: "github", url: "https://github.com/WeakAuras/WeakAuras2" },
        { media: "patreon", url: "https://www.patreon.com/WeakAuras" },
        { media: "twitter", url: "https://twitter.com/WeakAuras" },
        {
          media: "youtube",
          url: "https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg"
        },
        { media: "facebook", url: "https://facebook.com/WeakAuras" },
        { media: "curse", url: "https://mods.curse.com/addons/wow/weakauras-2" }
      ],
      wago: [
        { media: "wago", url: "https://wago.io/" },
        { media: "github", url: "https://github.com/oratory/wago.io" },
        { media: "patreon", url: "https://www.patreon.com/wago" }
      ]
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
