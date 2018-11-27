<template>
  <div id="about" style="display: flex">
    <div style="flex: 50%">
      <h2>WeakAuras Team</h2>
      <br>
      <p>
        <a href="https://discord.gg/wa2" target="_blank">
          <img src="../../assets/discord.png" class="logo" title="discord"> Discord
        </a>
        <br>
        <a href="https://twitter.com/WeakAuras" target="_blank">
          <img src="../../assets/twitter.png" class="logo" title="twitter"> Twitter
        </a>
        <br>
        <a href="https://facebook.com/WeakAuras" target="_blank">
          <img src="../../assets/facebook.png" class="logo" title="facebook"> Facebook
        </a>
        <br>
        <a href="https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg" target="_blank">
          <img src="../../assets/youtube.png" class="logo" title="youtube"> Youtube
        </a>
        <br>
        <a href="https://github.com/WeakAuras/WeakAuras2" target="_blank">
          <img src="../../assets/github.png" class="logo" title="github"> Github
        </a>
        <br>
        <a href="https://www.patreon.com/WeakAuras" target="_blank">
          <img src="../../assets/patreon.png" class="logo" title="patreon"> Patreon
        </a>
        <br>
        <a href="https://mods.curse.com/addons/wow/weakauras-2" target="_blank">
          <img src="../../assets/curse.png" class="logo" title="curse"> Curse
        </a>
        <br>
      </p>
    </div>
    <div style="flex: 50%">
      <h2>Wago</h2>
      <br>
      <p>
        <a href="https://wago.io/" target="_blank">
          <img src="../../assets/wago.png" class="logo" title="wago"> Wago
        </a>
        <br>
        <a href="https://github.com/oratory/wago.io" target="_blank">
          <img src="../../assets/github.png" class="logo" title="github"> Github
        </a>
        <br>
        <a href="https://www.patreon.com/wago" target="_blank">
          <img src="../../assets/patreon.png" class="logo" title="patreon"> Patreon
        </a>
        <br>
      </p>
    </div>
  </div>
</template>

<script>
export default {
    name: 'about',
}
</script>

<style scoped>
#about {
  margin: 5px 50px;
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
</style>
