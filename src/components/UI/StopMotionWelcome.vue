<template>
    <div id="StopMotionWelcome">
        <div class="stuff">
            <div>
                <img :src="require(`@/assets/kekround.gif`)" />
                <!-- <label>gif</label> -->
            </div>
            <span class="material-icons">arrow_forward</span>
            <div>
                <img :src="require(`@/assets/kekroundtile.png`)" style="width: 140px" />
                <!-- <label>tga</label> -->
            </div>
            <span class="material-icons">arrow_forward</span>
            <div class="ingame">
                <img :src="require(`@/assets/kekround.gif`)" />                
                <!-- <label>stopmotion</label> -->
            </div>
        </div>
        <div id="mid">
            <Button class="btn-ok" @click="$emit('next')">{{ $t('app.stopmotion.selectgifanimation' /* Select GIF Animation */) }}</Button>
        </div>
    </div>
</template>

<script>
import { defineComponent } from "vue";
import Button from "./Button.vue";

export default defineComponent({
  name: "StopMotionWelcome",
  components: {
    Button,
  },
});
</script>

<style scoped lang="scss">

#StopMotionWelcome {
    width: 100%;
    //background-color: red;
}

#mid {
    text-align: center;
    width: 100%;
    margin: auto;
    transition: all 0.4s ease-in-out;
}

.btn-ok {
    padding-left: 20px;
    padding-right: 20px;
    height: 50px;
}

.stuff {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 100px;
    margin-bottom: 60px;
}

.ingame {
    background-image: url(@/assets/dragonblightbg.png);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: 140px;
}
</style>
