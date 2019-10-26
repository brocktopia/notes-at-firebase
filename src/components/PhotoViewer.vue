<template>
    <div class="photo-viewer">
      <img
        :src="path"
        @click="photoClick"
      />
      <button class="remove-btn" v-if="removable" @click="onRemove">Remove</button>
    </div>
</template>

<script>
    export default {

      name: "PhotoViewer",

      props: {
        path: String,
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
