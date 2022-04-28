<template>
  <div class="gifpicker">
    <header>
      <div>
        <div>
          <input v-model="search" placeholder="Search Tenor" />
          <span class="material-icons">search</span>
        </div>
      </div>
    </header>
    <div class="gifpicker_container">
      <div>
        <div>
          <div v-if="search !== '' && results && results.length" class="grid">
            <div
              v-for="(result, r) in results"
              :key="r"
              class="grid_images"
              :style="`background-image: url(${result.media[0].tinygif.url})`"
              @click="send(result.media[0], result.content_description)"
            />
          </div>
          <div v-else-if="tags && tags.length" class="grid">
            <div
              v-for="(tag, t) in tags"
              :key="t"
              class="grid_images"
              :style="`background-image: url(${tag.image})`"
              @click="search = tag.searchterm"
            >
              <div class="searchterm"></div>
              {{ tag.searchterm }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    apiKey: {
      type: String,
      required: true
    },
  },
  data () {
    return {
      search: null,
      results: [],
      tags: []
    }
  },
  mounted () {
    fetch(`https://g.tenor.com/v1/categories?key=${this.apiKey}`)
    .then(res => res.json())
    .then(({ tags }) => this.tags = tags)
  },
  watch: {
    search: "onSearch",
  },
  methods: {
    onSearch (key) {
      this.get(`search?q=${key}&limit=32`, "results")
    },
    renderSmallGif ({ tinygif }) {
      return tinygif.url
    },
    renderHugeGif ({ mediumgif }) {
      return mediumgif.url
    },
    get (query, key) {
      fetch(`https://g.tenor.com/v1/${query}&key=${this.apiKey}`)
      .then(res => res.json())
      .then(data => this[key] = data[key])
    },
    send (url, title) {
      this.$emit("send", { url: this.renderHugeGif(url), send: true, type: "gif", title: title })
      this.search = null
    }
  }
}
</script>
<style scoped lang="scss">
$dark-bg: #212224;
$light-bg: #2F3136;
$border-blue: #5865f2;

.gifpicker {
  height: calc(100% - 9px);
  position: relative;
  z-index: 1000;
}

header {
  position: relative; 
  padding-left: 1.25rem;
  padding-right: 1.25rem; 
  padding-top: 0.5rem; 
  padding-bottom: 1.25rem;
  background-color: $light-bg;
  width: 100%;
  height: 60px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
  div {
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    width: 100%;
    div {
      display: flex; 
      overflow: hidden; 
      padding-right: 0.5rem;
      justify-content: space-between; 
      align-items: center; 
      width: 100%; 
      border-radius: 0.375rem; 
      background-color: $dark-bg;
      input { // ugly border bottom & right, and can't select it
        all: unset;
        text-align: left;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem; 
        padding-left: 0.75rem;
        padding-right: 0.75rem; 
        color: white;
        background-color: $dark-bg;
        font-size: 0.875rem;
        line-height: 1.25rem; 
        width: 100%;
        outline: 2px solid transparent;
	      outline-offset: 2px;
        user-select: all;

        pointer-events: all;
      }
    }
  }
}

.gifpicker_container {
  display: flex;
  height: calc(100% - 50px);
  div {
    display: flex; 
    flex-direction: column; 
    width: 100%; 
    height: 100%;
    background-color: $dark-bg;
    div {
      overflow: auto; 
      position: relative; 
      padding: 1rem; 
      width: 100%; 
      height: 100%; 
      .grid {
        display: grid; 
        grid-template-columns: repeat(2, minmax(0, 1fr)); 
        gap: 1rem; 
        grid-auto-flow: row; 
        grid-auto-rows: auto;
        .grid_images {
          width: 200px;
          display: flex; 
          overflow: hidden; 
          position: relative; 
          background-size: cover; 
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; 
          transition-duration: 300ms; 
          color: white;
          font-weight: 600; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 7rem; 
          border-radius: 0.5rem; 
          border-width: 1px; 
          border-color: transparent;
          &:hover {
            border-color: $border-blue;
            border-style: solid;
          }
          cursor: pointer;
          .searchterm {
            position: absolute; 
            top: 0; 
            left: 0; 
            background-color: black;
            transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; 
            transition-duration: 300ms; 
            width: 100%; 
            height: 100%; 
            opacity: 0;
            &:hover { // group-hover
              opacity: 70%;
            }
          }
        }
      }
    }
  }
}
</style>