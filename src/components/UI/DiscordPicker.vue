<template>
  <div class="discord-picker" style="max-width: max-content" v-click-outside="close">
    <div>
      <div
        :class="{ 'invisible': !opened }"
        class="discord-picker"
      >
        <gif-picker v-if="opened" :api-key="apiKey" @send="({ url, title }) => this.send(url, title)" />
      </div>
      <div class="mt4">
        <div>
          <span @click="open"><slot /></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue"
import clickOutside from "@/libs/click-outside.js"
import GifPicker from "./GifPicker.vue"

export default defineComponent({
  components: { GifPicker },
  directives: {
    clickOutside,
  },
  emits: ["gif"],
  props: {
    value: {
      type: [String, Number],
      default: null,
    },
    apiKey: {
      type: String
    },
  },
  data () {
    return {
      opened: false,
    }
  },
  methods: {
    close () {
      if (this.opened) {
        this.opened = false
      }
      console.log(`close() opened: ${this.opened}`)
    },
    send (url, title) {
      console.log(`send() ${url}`)
      this.$emit("gif", url, title)
    },
    open () {
      this.opened = !this.opened
      console.log(`open() opened: ${this.opened}`)
    }
  }
})
</script>


<style scoped lang="scss">
.invisible {
  opacity: 0;
  //pointer-events: none;
}

.discord-picker {
  div {
    position: relative; 
    max-width: max-content;
    .discord-picker {
      height: 454px;
      width: 800px;
      overflow: hidden; 
      position: absolute; 
      right: 0; 
      top: -1rem; 
      transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; 
      transition-duration: 200ms; 
      --transform-translate-y: -100%; 
      border-radius: 0.75rem; 
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 1;
    }
  }
}

@media (max-width: 768px) {
  .discord-picker {
    width: 400px;
    height: 400px;
  }
}
</style>