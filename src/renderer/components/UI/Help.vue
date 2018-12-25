<template>
  <div id="help" ref="help">
    <ol class="follow">
      <li>
        {{
          $t(
            "app.help.s1" /* Configure WeakAuras Companion, you will need to at least set your World of Warcraft Folder and Account. */
          )
        }}
      </li>
      <li>
        {{
          $t(
            "app.help.s2" /* Click on 'Fetch Updates', this is also done automatically once every hour. */
          )
        }}
        <ol class="follow">
          <li>
            {{
              $t(
                "app.help.s2_1" /* Companion creates a list of your auras with a link to Wago. */
              )
            }}
          </li>
          <li>
            {{
              $t(
                "app.help.s2_2" /* Companion sends the list to the Wago API. */
              )
            }}
          </li>
          <li>
            {{
              $t(
                "app.help.s2_3" /* Wago sends updated import strings and Companion compares versions. */
              )
            }}
          </li>
          <li>
            {{
              $t(
                "app.help.s2_4" /* Companion creates a new "WeakAurasCompanion" addon automatically, this is where new import strings are saved. */
              )
            }}
          </li>
          <li>
            {{
              $t(
                "app.help.s2_5" /* Restart World of Warcraft or reload your UI. */
              )
            }}
          </li>
        </ol>
      </li>

      <li>
        {{
          $t(
            "app.help.s3" /* The first time you start WeakAuras Companion, you will have to restart the game for it to be able to load the addon. */
          )
        }}
      </li>

      <li class="reset">
        {{
          $t(
            "app.help.s4_1" /* Update your auras in-game by clicking the update button next to them */
          )
        }}
        <img :src="require(`@/assets/wagoupdate_logo.png`)" />
        {{ $t("app.help.s4_2" /* in the WeakAuras options. */) }}
        <img :src="require(`@/assets/ingame.png`)" class="center" />
        <img :src="require(`@/assets/diagram.gif`)" class="center" />
      </li>
      <li>
        {{
          $t(
            "app.help.s5" /* You can always skip a version or just ignore updates completely. */
          )
        }}<br />
        <img :src="require(`@/assets/ingame2.png`)" class="center" />
      </li>
    </ol>
    <br />
    <br />
    <div>
      {{
        $t(
          "app.help.bug" /* If you encounter a bug, please create a ticket on */
        )
      }}
      <a
        target="_blank"
        href="https://github.com/WeakAuras/WeakAuras-Companion/issues/new"
        >GitHub</a
      >
      {{ $t("app.help.bugend" /* containing: */) }}<br />
      <ul>
        <li>
          {{ $t("app.help.bug.s1" /* A description of your problem. */) }}
        </li>
        <li>{{ $t("app.help.bug.s2" /* The steps to reproduce it. */) }}</li>
        <li>
          {{
            $t(
              "app.help.bug.s3" /* A screenshot if it helps to understand your issue. */
            )
          }}
        </li>
        <li>
          {{
            $t(
              "app.help.bug.s4" /* Error logs, type Ctrl+Shift+I to access the console and copy any error that might show up. */
            )
          }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
#help {
  padding: 10px 30px;
  text-align: left;
  height: 100%;
  position: relative;
  overflow: auto;
  transition: all ease-in 1s;
}
.updateButton {
  margin-left: 60%;
}
#help > ol {
  margin-left: 0;
  padding-left: 0;
}
ol,
ul {
  font-size: small;
  margin-left: 30px;
}
.follow {
  counter-reset: item;
}
.follow > li {
  display: block;
  margin-top: 10px;
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
  margin: 20px 0 0;
}
a {
  color: rgb(255, 209, 0);
  font-weight: 700;
}
a:hover {
  color: rgb(255, 228, 106);
}
.reset {
  margin-top: 0px !important;
}
</style>
