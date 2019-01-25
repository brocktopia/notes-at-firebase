<template>
  <div class="photo-container">
    <span class="photo-scroll-btn left" v-if="photoBarHasScroll" @click="photoScroll('left', $event)">&lt;</span>
    <div
      ref="photoBar"
      class="photo-bar"
      :style="photoBarHasScroll ? 'padding:0 40px;' : 'padding:0;'"
    >
      <img
        v-for="photo in photos"
        :key="photo.id"
        :src="photoUrl(photo, 'thumb')"
        :alt="photo.name || photo.caption"
        @click="onPhotoClick(photo, $event)"
        @error="onPhotoError(photo, $event)"
        @load="onPhotoLoad"
        class="note-photo"
      />
      <img
        v-for="preview in previews"
        :src="preview.path"
        :key="preview.index"
        alt="Selected for Upload"
        class="preview-photo"
        @load="onPreviewLoad(preview, $event)"
        @click="onPreviewClick(preview, $event)"
      />
    </div>
    <span class="photo-scroll-btn right" v-if="photoBarHasScroll" @click="photoScroll('right', $event)">&gt;</span>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'

  export default {

    name: "PhotoScroller",

    props: {
      photos: {
        type:Array,
        defaultValue:[]
      },
      previews: Array
    },

    computed: {

      ...mapGetters('photos', ['photoUrl'])


    },

    data() {
      return {
        photoBarHasScroll:false,
        photoReloads: 0,
        reloads: {},
        reloadMax: 20
      }
    },

    beforeDestroy() {
      Object.keys(this.reloads).forEach(key => {
        // kill any reload timers
        if (this.reloads[key].timeout) {
          clearTimeout(this.reloads[key].timeout);
        }
      })
    },

    methods: {

      onPhotoClick(photo, evnt) {
        //console.log(`PhotoScroller.onPhotoClick()`);
        evnt.stopPropagation();
        this.$emit('select', photo);
      },

      onPreviewClick(photo, evnt) {
        //console.log(`PhotoScroller.onPhotoClick()`);
        evnt.stopPropagation();
        this.$emit('previewselect', photo);
      },

      onPhotoError(photo, evnt) {
        // Sometimes it takes a couple of seconds for a newly uploaded image to respond
        // get/create a counter reference
        let reload;
        if (!this.reloads[photo.id]) {
          reload = this.reloads[photo.id] = {photo: photo, count: 0, src: evnt.target.src};
          evnt.target.style.display = 'none';
          evnt.target.addEventListener('load', this.onPhotoErrorReload, {once:true});
        } else {
          reload = this.reloads[photo.id];
        }
        //console.log(`PhotoScroller.onPhotoError() ${reload.count}`);
        if (reload.count < this.reloadMax) {
          reload.timeout = setTimeout(() => {
            reload.count++;
            let reloadUrl = `${reload.src}?reload=${reload.count}`;
            //console.log(`PhotoScroller.onPhotoError() reload ${reloadUrl}`);
            evnt.target.src = reloadUrl;
          }, 1000)
        } else {
          //console.log(`PhotoScroller.onPhotoError() Give up reloading ${reload.photo.id}`);
          reload.timeout = null;
          this.$emit('missingphoto', photo);
        }
      },

      onPhotoErrorReload(evnt) {
        //console.log(`PhotoScroller.onPhotoErrorReload()`);
        evnt.target.style.display = 'inline-block';
      },

      onPhotoLoad(evnt) {
        //console.log(`PhotoScroller.onPhotoLoad()`);
        this.photoBarHasScroll = this.$refs.photoBar.scrollWidth > this.$refs.photoBar.clientWidth;
      },

      onPreviewLoad(preview, evnt) {
        //console.log(`PhotoScroller.onPreviewLoad()`);
        const el = evnt.target;
        this.$utils.getExifData(evnt.target)
          .then(exif => {
            //console.log(`PhotoScroller.onPreviewLoad() exif data`);
            //console.dir(exif);
            if (exif.hasEXIF) {
              this.$emit('exif', exif, preview)
            }
          })
          .catch(console.log)
      },

      photoScroll(dir, evnt) {
        //console.log(`PhotoScroller.photoScroll() ${dir}`);
        evnt.stopPropagation();
        const scrollLeft = this.$refs.photoBar.scrollLeft;
        const boxWidth = this.$refs.photoBar.clientWidth;
        const scrollDiff = this.$refs.photoBar.scrollWidth - this.$refs.photoBar.clientWidth;
        const step = Math.min(scrollDiff, boxWidth - 80);
        let scrollChange = 0;
        if (dir === 'left') {
          if (scrollLeft > 0) {
            scrollChange = Math.max(scrollLeft - step, 0);
          }
        } else {
          scrollChange = Math.min(scrollLeft + step, scrollDiff);
        }
        this.$refs.photoBar.scrollLeft = scrollChange;
      }

    }

  }
</script>

<style lang="scss" scoped>
  .photo-container {
    position: relative;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    .photo-scroll-btn {
      position: absolute;
      height: 100%;
      width: 40px;
      background-color: rgba(0, 105, 237, 1);
      cursor: pointer;
      text-align: center;
      color: white;
      line-height: 90px;
      font-size: x-large;
      &:hover {
        background-color: rgba(0, 105, 237, 1);
      }
      &.left {
        left: 0;
        z-index: 9998;
      }
      &.right {
        right: 0;
        top: 0;
        z-index: 9999;
      }
    }
  }
  .photo-bar {
    position: relative;
    height: 90px;
    padding: 0;
    margin: 0;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    scroll-behavior: smooth;
    img {
      cursor: pointer;
    }
    img + img {
      padding-left: 5px;
    }
    .preview-photo {
      max-height: 90px;
      opacity: 0.7;
    }
  }
</style>
