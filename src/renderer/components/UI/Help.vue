<template>
  <div id="help" ref="help">
    <ol>
      <li>
        Configure WeakAuras Companion, you will need at least to set your Wold
        Of Warcraft folder and Account
      </li>
      <li>
        Fetch updates, this is done automatically once every hour
        <ol>
          <li>Companion make a list of your auras with a link to wago</li>
          <li>Companion send the list to Wago API and compare versions</li>
          <li>Wago send updated import strings</li>
          <li>
            Companion create a new "WeakAurasCompanion" addon automatically,
            this is where new import strings are saved
          </li>
        </ol>
      </li>

      <li>
        Update your auras in-game by clicking the update button
        <img :src="require(`@/assets/wagoupdate_logo.png`)" /> in WeakAuras
        Options<br />
        <img :src="require(`@/assets/ingame.png`)" class="center" /><br /><br />
        <img :src="require(`@/assets/diagram.gif`)" class="center" />
      </li>
      <li>
        You can skip a version or ignore completely updates<br />
        <img :src="require(`@/assets/ingame2.png`)" class="center" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
#help {
  padding: 10px 50px;
  text-align: left;
  height: 100%;
  position: relative;
  overflow: auto;
}
.updateButton {
  margin-left: 60%;
}
ol {
  counter-reset: item;
  padding-left: 10px;
  font-size: small;
  margin-left: 20px;
}
li {
  display: block;
  margin-top: 7px;
}
li:before {
  content: counters(item, ".") ". ";
  counter-increment: item;
}
li > img {
  transform: translate(0, 8px);
}
.center {
  position: relative;
  left: 50%;
  transform: translate(-50%, 0);
  margin: 10px 0;
}
</style>
