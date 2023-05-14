<template>
  <div class="sk-fading-circle">
    <span v-if="spin">
      <div class="sk-circle1 sk-circle"></div>
      <div class="sk-circle2 sk-circle"></div>
      <div class="sk-circle3 sk-circle"></div>
      <div class="sk-circle4 sk-circle"></div>
      <div class="sk-circle5 sk-circle"></div>
      <div class="sk-circle6 sk-circle"></div>
      <div class="sk-circle7 sk-circle"></div>
      <div class="sk-circle8 sk-circle"></div>
      <div class="sk-circle9 sk-circle"></div>
      <div class="sk-circle10 sk-circle"></div>
      <div class="sk-circle11 sk-circle"></div>
      <div class="sk-circle12 sk-circle"></div>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Spinner",
  props: ["spin"],
});
</script>

<style scoped lang="scss">
.sk-fading-circle {
  width: 40px;
  height: 40px;
  position: relative;
  left: 50%;
  margin-left: -20px;
  margin-bottom: 20px;
}

.sk-fading-circle .sk-circle {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.sk-fading-circle .sk-circle:before {
  content: "";
  display: block;
  margin: 0 auto;
  width: 15%;
  height: 15%;
  background-color: rgb(209, 202, 202);
  border-radius: 100%;
  animation: sk-circleFadeDelay 1.2s infinite ease-in-out both;
}

.sk-fading-circle .sk-circle2 {
  transform: rotate(30deg);
}

.sk-fading-circle .sk-circle3 {
  transform: rotate(60deg);
}

.sk-fading-circle .sk-circle4 {
  transform: rotate(90deg);
}

.sk-fading-circle .sk-circle5 {
  transform: rotate(120deg);
}

.sk-fading-circle .sk-circle6 {
  transform: rotate(150deg);
}

.sk-fading-circle .sk-circle7 {
  transform: rotate(180deg);
}

.sk-fading-circle .sk-circle8 {
  transform: rotate(210deg);
}

.sk-fading-circle .sk-circle9 {
  transform: rotate(240deg);
}

.sk-fading-circle .sk-circle10 {
  transform: rotate(270deg);
}

.sk-fading-circle .sk-circle11 {
  transform: rotate(300deg);
}

.sk-fading-circle .sk-circle12 {
  transform: rotate(330deg);
}

.sk-fading-circle .sk-circle2:before {
  animation-delay: -1.1s;
}

.sk-fading-circle .sk-circle3:before {
  animation-delay: -1s;
}

.sk-fading-circle .sk-circle4:before {
  animation-delay: -0.9s;
}

.sk-fading-circle .sk-circle5:before {
  animation-delay: -0.8s;
}

.sk-fading-circle .sk-circle6:before {
  animation-delay: -0.7s;
}

.sk-fading-circle .sk-circle7:before {
  animation-delay: -0.6s;
}

.sk-fading-circle .sk-circle8:before {
  animation-delay: -0.5s;
}

.sk-fading-circle .sk-circle9:before {
  animation-delay: -0.4s;
}

.sk-fading-circle .sk-circle10:before {
  animation-delay: -0.3s;
}

.sk-fading-circle .sk-circle11:before {
  animation-delay: -0.2s;
}

.sk-fading-circle .sk-circle12:before {
  animation-delay: -0.1s;
}

@keyframes sk-circleFadeDelay {
  0%,
  39%,
  100% {
    opacity: 0;
  }

  40% {
    opacity: 1;
  }
}
</style>
