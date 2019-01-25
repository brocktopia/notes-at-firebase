<template>
    <div class="photo-viewer">
      <img
        :src="path"
        @click="photoClick"
      />
    </div>
</template>

<script>
    export default {

      name: "PhotoViewer",

      props: {
        path: String
      },

      data() {
        return {}
      },

      methods: {

        photoClick() {
          //console.log('PhotoViewer.photoClick()');
          this.$emit('close');
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
