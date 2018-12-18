<template>
  <div id="help" ref="help">
    <ol class="follow">
      <li>
        {{
          $t(
            "app.help.s1" /* Configure WeakAuras Companion, you will need at least to set your World Of Warcraft folder and Account */
          )
        }}
      </li>
      <li>
        {{
          $t(
            "app.help.s2" /* Fetch updates, this is done automatically once every hour */
          )
        }}
        <ol class="follow">
          <li>
            {{
              $t(
                "app.help.s2_1" /* Companion make a list of your auras with a link to wago */
              )
            }}
          </li>
          <li>
            {{
              $t(
                "app.help.s2_2" /* Companion send the list to Wago API and compare versions */
              )
            }}
          </li>
          <li>
            {{ $t("app.help.s2_3" /* Wago send updated import strings */) }}
          </li>
          <li>
            {{
              $t(
                "app.help.s2_4" /* Companion create a new "WeakAurasCompanion" addon automatically, this is where new import strings are saved */
              )
            }}
          </li>
        </ol>
      </li>

      <li>
        {{
          $t(
            "app.help.s3" /* The first time you start WeakAuras Companion, a new addon will be created in your World of Warcraft addon folder, you will have to restart the game for it to be able to read the new files. */
          )
        }}
      </li>

      <li>
        {{
          $t(
            "app.help.s4_1" /* Update your auras in-game by clicking the update button */
          )
        }}
        <img :src="require(`@/assets/wagoupdate_logo.png`)" />
        {{ $t("app.help.s4_2" /* in WeakAuras Options */) }}<br />
        <img :src="require(`@/assets/ingame.png`)" class="center" /><br /><br />
        <img :src="require(`@/assets/diagram.gif`)" class="center" />
      </li>
      <li>
        {{
          $t(
            "app.help.s5" /* You can skip a version or ignore completely updates */
          )
        }}<br />
        <img :src="require(`@/assets/ingame2.png`)" class="center" />
      </li>
    </ol>
    <br />
    <br />
    <div>
      {{
        $t("app.help.bug" /* If you encounter a bug, please make a ticket on */)
      }}
      <a
        target="_blank"
        href="https://github.com/WeakAuras/WeakAuras-Companion/issues/new"
        >GitHub</a
      >
      {{ $t("app.help.bugend" /* with: */) }}<br />
      <ul>
        <li>{{ $t("app.help.bug.s1" /* A description of your problem */) }}</li>
        <li>{{ $t("app.help.bug.s2" /* Steps to reproduce */) }}</li>
        <li>
          {{
            $t(
              "app.help.bug.s3" /* Screenshot if it helps understand your issue */
            )
          }}
        </li>
        <li>
          {{
            $t(
              "app.help.bug.s4" /* Type [Ctrl+Shift+I] to access the console and copy any error */
            )
          }}
        </li>
      </ul>
    </div>
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
ol,
ul {
  padding-left: 10px;
  font-size: small;
  margin-left: 20px;
}
.follow {
  counter-reset: item;
}
.follow > li {
  display: block;
  margin-top: 7px;
}
.follow > li:before {
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
a {
  color: #3f51b5;
}
</style>
