<template>
  <div id="sync">
    <br /><br />
    <spinner :spin="fetching"></spinner>
    <v-button @click="refresh" :type="!usable ? 'issue' : 'refresh'">
      {{ $t("app.refreshbutton.label" /* Check for updates on Wago */) }}
    </v-button>
    <div id="lastupdate">
      {{ $t("app.refreshbutton.lastupdate" /* Last update: */) }}
      {{ lastUpdate | fromNow }}
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Spinner from "./Spinner.vue";
import Button from "./Button.vue";

export default {
  name: "refreshButton",
  props: ["usable", "fetching", "lastUpdate"],
  data() {
    return {
      lastUpdateTimer: null
    };
  },
  components: { Spinner, "v-button": Button },
  methods: {
    refresh() {
      this.$parent.compareSVwithWago();
    },
    scheduleTimer() {
      if (this.lastUpdateTimer) clearInterval(this.lastUpdateTimer);
      this.lastUpdateTimer = setInterval(() => {
        this.$forceUpdate();
      }, 1000 * 60);
    }
  },
  filters: {
    fromNow: value => {
      if (!value) return "n/a";
      return moment(value).fromNow();
    }
  },
  mount() {
    this.scheduleTimer();
  },
  watch: {
    fetching() {
      this.scheduleTimer();
    }
  },
  beforeDestroy() {
    clearInterval(this.lastUpdateTimer);
  }
};
</script>

<style scoped>
#sync {
  flex: 1;
  text-align: center;
}
#lastupdate {
  margin-top: 5px;
  font-size: small;
}

/* Checkboxes */
input[type=checkbox] {
  position: absolute;
  opacity: 0;
}
  input[type=checkbox] + label {
    position: relative;
    cursor: pointer;
    padding: 0;
  }


  input[type=checkbox] + label:before {
    content: '';
    margin-right: 10px;
    display: inline-block;
    vertical-align: text-top;
    width: 20px;
    height: 20px;
    background: white;
  }


  input[type=checkbox]:hover + label:before {
    background: #f35429;
  }


  input[type=checkbox]:focus + label:before {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
  }

  input[type=checkbox]:checked + label:before {
    background: #f35429;
  }

  input[type=checkbox]:disabled + label {
    color: #b8b8b8;
    cursor: auto;
  }

  input[type=checkbox]:disabled + label:before {
    box-shadow: none;
    background: #ddd;
  }

  input[type=checkbox]:checked + label:after {
    content: '';
    position: absolute;
    left: 5px;
    top: 9px;
    background: white;
    width: 2px;
    height: 2px;
    box-shadow:
      2px 0 0 white,
      4px 0 0 white,
      4px -2px 0 white,
      4px -4px 0 white,
      4px -6px 0 white,
      4px -8px 0 white;
    transform: rotate(45deg);
  }


</style>
