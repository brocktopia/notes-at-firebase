<template>
    <div class="photo-viewer">
      <img
        :src="path"
        @click="photoClick"
      />
      <button class="remove-btn" v-if="removable" @click="onRemove">Remove</button>
      <button class="rotate-btn" v-if="removable" @click="onRotate">Rotate</button>
    </div>
</template>

<script>
    export default {

      name: "PhotoViewer",

      props: {
        path: String,
        photodata: Object,
        removable: {
          type: Boolean,
          defaultValue: false
        }
      },

      data() {
        return {}
      },

      methods: {

        photoClick() {
          //console.log('PhotoViewer.photoClick()');
          this.$emit('close');
        },

        onRemove() {
          //console.log('PhotoViewer.onRemove()');
          this.$emit('remove');
        },

        onRotate() {
          console.log('PhotoViewer.onRotate()');
          console.dir(this.photodata);
          this.$emit('rotate');
        }

      }

    }
</script>

<style scoped>

  .photo-viewer {
    width: 100%;
    height: 100%;
    background-color: black;
  }

  .remove-btn {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  .rotate-btn {
    position: absolute;
    top: 60px;
    right: 10px;
  }

  div img {
    display: block;
    max-height: 100%;
    max-width: 100%;
    width: auto;
    height: auto;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
  }

</style>
