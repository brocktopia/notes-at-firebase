<template>
  <div class="app-container">

    <nav class="head">
      <h2>Photo Edit</h2>
      <span class="button-bar">
        <button class="icon delete" @click="deletePhoto()"><svg><use xlink:href="dist/symbols.svg#delete-note">
          <title>Delete Photo</title>
        </use></svg></button>
        <button v-if="saveEnabled" class="icon save" @click="savePhoto"><svg><use xlink:href="dist/symbols.svg#save">
          <title>Save Photo</title>
        </use></svg></button>
        <button class="icon close" @click="close"><svg><use xlink:href="dist/symbols.svg#close-note">
          <title>Close</title>
        </use></svg></button>
      </span>
    </nav>

    <div class="content" v-if="!!photo">

      <div class="name input">
        <label for="noteName">Name</label>
        <input type="text" id="noteName" v-model="photo.name" maxlength="120" placeholder="Name for your note" tabindex="1">
        <span class="input-info"><span class="char-count">{{photo.name.length}}</span> (120 character limit)</span>
        <span class="clear-link" @click="photo.name = ''">Clear</span>
      </div>

      <div class="date input">Date: {{$moment(photo.Created_date.toDate()).format('LLLL')}}</div>

      <div class="date input" v-if="!!photo.datetime">Photo Date: {{$moment(photo.datetime, 'YYYY:MM:DD HH:mm:ss').format('LLLL')}}</div>

      <div class="geocoords input">
        <label for="geocords">Location:</label>
        <span v-if="hasGeocoords" id="geocords" @click="showMap" class="link">{{photo.geocode.latitude + ', ' + photo.geocode.longitude}}</span>
        <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
        <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">No location data in photo</span>
        <svg class="icon-small action-icon" @click="updateCoordinates(true)"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
      </div>

      <div class="caption input">
        <label for="caption">Caption</label>
        <textarea id="caption" v-model="photo.caption" class="photo-caption" tabindex="2 "></textarea>
      </div>

      <button class="exif-btn" v-if="photo.hasEXIF" @click="showEXIF">Photo EXIF Data</button>

      <img
        class="photo"
        :alt="activePhoto.caption"
        :src="activePhoto.medium"
        ref="photo"
        @load="checkExif"
        @click="showFullSize = true"
      />
      
      <div v-if="showFullSize" class="photo-fullsize">
        <img
          class="photo-fullsize"
          :alt="photo.caption"
          :src="photo.full"
          @click="showFullSize = false"
        />
      </div>

    </div>

    <div class="navigation">
      <a @click="close">Cancel</a>
      <a class="action-link" @click="savePhoto">Save</a>
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

    <modal-dialog
      v-if="showMessage"
      @close="showMessage = false"
    >
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <exif-viewer
      v-if="showExifData"
      :exifs="photoExifs"
      @selectexif="onExifDataSelect"
      @close="showExifData = false"
    />

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import View from '@/mixins/View'
  import ExifViewer from '@/components/ExifViewer'

  export default {

    name: "PhotoEdit",

    mixins: [
      View
    ],

    components: {
      ExifViewer
    },

    props:{
      loadedAsSubcomponent:{
        type:Boolean,
        defaultValue:false
      },
      target:Object
    },

    data() {
      return {
        photo: null,
        showExifData: false,
        // confirm dialog
        showConfirmModal: false,
        showFullSize: false,
        showPhotoMap: false,
      };
    },

    computed: {

      activePhoto() {
        return this.$store.state.photos.activePhoto
      },

      saveEnabled() {
        // not sure how/if I want to implement this or not
        return true
      },

      hasGeocoords() {
        return !!this.photo.geocode
      },

      locationDenied() {
        return this.$utils.locationDenied
      },

      photoExifs() {
        return [this.photo];
      }

    },

    methods: {

      init() {
        //console.log(`PhotoEdit.init()`);
        // This component is designed to be loaded as a full route view and as subcomponent of another view.
        // If it is being loaded as a subcomponent it will have props values.
        if (this.loadedAsSubcomponent) {
          // create copy of source photo for mutation
          this.photo = {...this.target};
        } else {
          if (!this.activePhoto.id) { // Photo must be deep-linked first load
            this.isLoading = true;
            this.$store.dispatch('photos/getActivePhoto', this.$route.params)
              .then(photo => {
                // create copy of source photo for mutation
                this.photo = {...photo};
                this.isLoading = false;
                if (this.$route.name === 'note-photo-map') {
                  // [TODO] toggle map view
                }
                // load it's parent note in the background
                return this.$store.dispatch('notes/getNote', photo.note)
                  .then(note => {
                    return this.$store.dispatch('photos/getNotePhotos', photo.note)
                  })
              })
              .catch(this.handleError)
          } else {
            this.photo = {...this.activePhoto};
          }
        }
      },

      showEXIF() {
        this.showExifData = true;
      },

      onExifDataSelect(data) {
        //console.log(`PhotoEdit.onExifDataSelect()`);
        const note = this.$utils.deepClone(this.$store.state.notes.activeNote);
        let hasChange;
        // Use photo time to update note time
        if (data.datetime) {
          hasChange = true;
          note.Created_date = this.$firebase.firebase_.firestore.Timestamp.fromDate(data.datetime);
        }
        // Use photo geocode to update note geocode
        if (data.geocode) {
          hasChange = true;
          note.geocode = data.geocode;
        }
        // Save changes if hasChange
        if (hasChange) {
          this.loadingMessage = 'Updating Note...';
          this.isLoading = true;
          this.$store.dispatch('notes/updateActiveNote', note)
            .then(note => {
              this.isLoading = false;
            })
            .catch(this.handleError)
        }
      },

      checkExif() {
        //console.log(`PhotoEdit.checkExif()`);
        if (this.photo.hasEXIF) { // Don't run it again if EXIF data already saved
          return
        }
        this.$utils.getExifData(this.$refs.photo)
          .then(data => {
            if (data.hasEXIF) {
              Object.keys(data).forEach(key => {
                // Use $set to trigger reactivity
                this.$set(this.photo, key, data[key]);
              })
            }
          })
          .catch(this.handleError)
      },

      updateCoordinates() {
        //console.log(`PhotoEdit.updateCoordinates()`);
        this.$utils.getLocation()
          .then(loc => {
            this.photo.geocode = loc;
          })
          .catch(err => {
            console.warn(`PhotoEdit.updateCoordinates() ERROR`);
            console.dir(err);
            if (err.title) {
              this.messageTitle = err.title;
              this.messageBody = err.message;
              this.messageClass = 'warn';
              this.showMessage = true;
            }
          })
      },

      deletePhoto() {
        //console.log(`PhotoEdit.deletePhoto()`);
        this.showConfirmModal = true;
      },

      confirmDelete() {
        //console.log(`PhotoEdit.confirmDelete()`);
        this.loadingMessage = 'Deleting photo...';
        this.isLoading = true;
        this.$store.dispatch('photos/deleteActivePhoto')
          .then(success => {
            this.loadingMessage = 'Updating note...';
            //
            this.$store.dispatch('notes/removeNotePhoto', {note_id: this.photo.note, photo_id: this.photo.id})
              .then(success => {
                this.isLoading = false;
                this.showConfirmModal = false;
                if (this.loadedAsSubcomponent) {
                  this.$emit('photodelete', this.photo);
                }
                this.close();
              })
              .catch(err => {
                this.handleError(err);
                this.close();
              })
          })
      },

      savePhoto(e) {
        //console.log(`PhotoEdit.savePhoto()`);
        if (!!e) e.stopPropagation();
        this.loadingMessage = 'Saving Photo...';
        this.isLoading = true;
        if (this.loadedAsSubcomponent) {
          this.$store.dispatch('photos/updateActivePhoto', this.photo)
            .then(photo => {
              this.isLoading = false;
              this.$emit('save', photo);
              this.close();
            })
            .catch(this.handleError)
        } else {
          this.$store.dispatch('photos/updateActivePhoto', this.photo)
            .then(photo => {
              if (this.$store.state.notes.activeNote._id) {
                let note = {...this.$store.state.notes.activeNote};
                note.photos = this.$store.getters['photos/photosSummary'];
                this.$store.dispatch('notes/updateNotePhotos', note)
                  .then(() => {
                    this.isLoading = false;
                    this.close();
                  })
              }
            })
            .catch(this.handleError)
        }
      },

      showMap() { // TODO map functionality
        console.log(`PhotoEdit.showMap()`);
      },

      close(e) {
        //console.log(`PhotoEdit.close()`);
        if (!!e) e.stopPropagation();
        if (this.loadedAsSubcomponent) {
          this.$emit('close');
        } else {
          if (this.$route.path.indexOf('note') != -1) {
            this.$router.back();
            //this.$router.push(this.$route.path.substr(0, this.$route.path.indexOf('/photo')));
          }
        }

      }

    }

  }
</script>

<style lang="scss" scoped>

  .content {
    padding-top: 10px;
  }
  .content > * {
    margin-bottom: 10px;
  }
  .content input {
    width: 100%;
  }
  .content textarea {
    width: 100%;
    heigth: 100%;
    overflow: auto;
  }

  .input-info {
    font-size: smaller;
    display: inline-block;
    clear: left;
  }
  .char-count {
    color: orangered;
  }
  .clear-link {
    font-size: smaller;
    float: right;
    color: #0069ed;
    cursor: pointer;
  }

  .geocoords, .place {
    height: 30px;
    line-height: 30px;
    width: 100%;
  }

  .photo {
    width: 100%;
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

  .input {
    padding: 0 10px;
  }

  .exif-btn {
    margin-left: 10px;
  }

  .photo-caption {
    height: 100px;
  }

</style>
