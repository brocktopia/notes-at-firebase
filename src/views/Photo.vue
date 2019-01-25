<template>
  <div class="app-container">

    <nav class="head">
      <h2>Photo</h2>
      <span class="button-bar">
        <button class="icon delete" @click="deletePhoto()"><svg><use xlink:href="dist/symbols.svg#delete-note">
          <title>Delete Photo</title>
        </use></svg></button>
        <button class="icon edit" @click="editPhoto()"><svg><use xlink:href="dist/symbols.svg#edit-note">
          <title>Edit Photo</title>
        </use></svg></button>
        <button v-if="hadGeoCoords && showPhotoMap" class="icon show-note" @click="showPhoto()"><svg><use xlink:href="dist/symbols.svg#note">
          <title>Show Photo</title>
        </use></svg></button>
        <button v-if="hadGeoCoords && !showPhotoMap" class="icon show-map" @click="showMap()"><svg><use xlink:href="dist/symbols.svg#map">
          <title>Show Map</title>
        </use></svg></button>
        <button class="icon close" @click="close"><svg><use xlink:href="dist/symbols.svg#close-note">
          <title>Close</title>
        </use></svg></button>
      </span>
    </nav>

    <div class="content">

      <img
        class="photo"
        :alt="activePhoto.caption"
        :src="activePhoto.full"
        @click="showFullSize = true"
      />
      
      <div v-if="showFullSize" class="photo-fullsize">
        <img
          class="photo-fullsize"
          :alt="activePhoto.caption"
          :src="activePhoto.full"
          @click="showFullSize = false"
        />
      </div>

      <p class="photo-name">{{activePhoto.name}}</p>

      <p class="photo-caption">{{activePhoto.caption}}</p>

    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
      &gt;
      <router-link class="notebooks-link" to="/notebooks">Notebooks</router-link>
      &gt;
      <a @click="gotToNotebook()" class="back2notebook">Notebook</a>
      <span v-if="notePhotoCount > 1" class="icon-button-bar">
        <a @click="previousNote()">
          <svg><use xlink:href="dist/symbols.svg#arrow-back">
            <title>Previous Note</title>
          </use></svg>
        </a>
        <a @click="nextNote()">
          <svg><use xlink:href="dist/symbols.svg#arrow-forward">
            <title>Next Note</title>
          </use></svg>
        </a>
      </span>
    </div>

    <!-- Dynamically loaded content -->

    <modal-dialog v-if="showConfirmModal" @close="showConfirmModal = false">
      <h3 slot="header">Confirm Delete</h3>
      <div slot="body">Are you sure you want to delete this photo? This can not be undone.</div>
      <div slot="footer">
        <button class="modal-optional-button" @click="showConfirmModal = false">
          Cancel
        </button>
        <button class="modal-default-button" @click="confirmDelete()">
          Confirm
        </button>
      </div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from '@/components/ModalDialog'

  export default {

    name: "Photo",

    components: {
      ModalDialog
    },

    data() {
      return {
        closeRoute:null,
        isLoading: false,
        loadingMessage:'Loading...',
        hadGeoCoords: false,
        showConfirmModal: false,
        showFullSize: false,
        showPhotoMap: false
      };
    },

    computed: {

      activePhoto() {
        return this.$store.state.photos.activePhoto;
      },

      notePhotoCount() { // TODO get this setup in the store
        return this.$store.state.photos.photoCount
      }

    },

    beforeRouteEnter(toRoute, fromRoute, next) {
      //console.log('Photo.beforeRouteEnter()');
      next(vm => {
        if (fromRoute.name) {
          vm.closeRoute = fromRoute.fullPath;
        }
      });
    },

    watch: {
      '$store.state.user.userAuthenticating': function(val, oldVal) {
        //console.log(`Photo.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!this.$store.state.user.user.uid) {
          this.init();
        }
      }
    },

    mounted() {
      //console.log(`Photo.mounted()`);
      if (!this.$store.state.user.userAuthenticating) {
        this.init();
      }
    },

    methods: {

      init() {
        //console.log(`Photo.init()`);
        this.isLoading = true;
        if (!this.activePhoto.id) { // Photo must be deep-linked first load
          this.$store.dispatch('photos/getActivePhoto', this.$route.params)
            .then(photo => {
              this.isLoading = false;
              if (this.$route.name === 'note-photo-map') {
                // [TODO] toggle map view
              }
              // load it's parent note in the background
              this.$store.dispatch('notes/getNote', photo.note)
                .then(note => {
                  return this.$store.dispatch('photos/getNotePhotos', photo.note)
                })
            })
            .catch(this.handleError)
        } else {
          if (this.$route.name === 'note-photo-map') {
            // toggle map view
          }
          if (this.$store.state.photos.activePhotos.length === 0) {
            this.$store.dispatch('photos/getNotePhotos', this.activePhoto.note)
              .then(() => {
                this.isLoading = false;
              })
          } else {
            this.isLoading = false;
          }
        }
      },

      deletePhoto() {
        //console.log(`Photo.deletePhoto()`);
        this.showConfirmModal = true;
      },

      confirmDelete() {
        //console.log(`Photo.confirmDelete()`);
        this.loadingMessage = 'Deleting photo...';
        this.isLoading = true;
        this.$store.dispatch('photos/deleteActivePhoto')
          .then(success => {
            this.loadingMessage = 'Updating note...';
            this.$store.dispatch('notes/removeNotePhoto', this.$route.params)
              .then(success => {
                this.isLoading = false;
                this.showConfirmModal = false;
                this.close();
              })
          })
      },

      editPhoto() {
        //console.log(`Photo.editPhoto()`);
        // Using replace causes close action on Edit to return to Note view
        // Keeps photo and photo-edit view from becoming locked in back-and-forth with closeRoute
        // TODO find better navigation solution--explore nested routes
        this.$router.replace(this.$route.path.replace('/photo/', '/photo-edit/'))
      },

      showPhoto() { // TODO map functionality
        //console.log(`Photo.showPhoto()`);
      },

      showMap() { // TODO map functionality
        //console.log(`Photo.showMap()`);
      },

      gotToNotebook() {
        //console.log(`Photo.gotToNotebook()`);
        if (this.activeNote._id) {
          this.$router.push(`notebook/${this.activeNote.notebook}`);
        }
      },

      close() {
        //console.log(`Photo.close() ${this.closeRoute}`);
        if (this.closeRoute) { // TODO improve navigation
          this.$router.push(this.closeRoute);
        } else if (this.$route.path.indexOf('note') != -1) {
          this.$router.push(this.$route.path.substr(0, this.$route.path.indexOf('/photo')));
        }
      },

      handleError(err) {
        console.warn('Photo.handleError()');
        console.dir(err);
        if (err.message.includes('Failed to get photo')) {
          this.close();
        }
      }

    }

  }
</script>

<style lang="scss" scoped>

  .photo {
    width: 100%;
  }

  .photo-name {
    font-weight: bold;
    padding: 0 20px;
  }

  .photo-caption {
    padding: 0 20px;
  }

  .photo-fullsize {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    background-color: rgba(0,0,0,0.5);
    .photo-fullsize {
      display: block;
      height: 100%;
      width: 100%;
      width: auto;
      height: auto;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      margin: auto;
    }
  }

</style>
