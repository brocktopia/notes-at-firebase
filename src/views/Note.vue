<template>
  <div class="app-container">

    <nav class="head">
      <h2>Note</h2>
      <span class="button-bar">
        <button class="icon delete-note" @click="deleteNote()"><svg><use xlink:href="dist/symbols.svg#delete-note">
          <title>Delete Note</title>
        </use></svg></button>
        <button class="desktop-only icon edit-note" @click="editNote()"><svg><use xlink:href="dist/symbols.svg#edit-note">
          <title>Edit Note</title>
        </use></svg></button>
        <button class="mobile-only icon edit-note" @click="editNoteMobile()"><svg><use xlink:href="dist/symbols.svg#edit-note">
          <title>Edit Note</title>
        </use></svg></button>
        <button v-if="showNoteMap" class="icon show-note" @click="showNote()"><svg><use xlink:href="dist/symbols.svg#note">
          <title>Show Note</title>
        </use></svg></button>
        <button v-if="showNoteMap === false" class="icon show-map" @click="showMap()"><svg><use xlink:href="dist/symbols.svg#map">
          <title>Show Map</title>
        </use></svg></button>
        <button class="icon close-note" @click="closeNote()"><svg><use xlink:href="dist/symbols.svg#close-note">
          <title>Close Note</title>
        </use></svg></button>
      </span>
    </nav>

    <div class="content" v-if="!showPhotoViewer">

      <header class="main">
        <h2>{{note.name}}</h2>
      </header>

      <div v-if="!showNoteMap" class="body">

        <div class="date">{{note.Created_date ? $moment(note.Created_date.toDate()).format('LLLL') : ''}}</div>

        <gmap-map
          class="note-view-map"
          ref="NoteMap"
          :center="{'lat':geoLat,'lng':geoLon}"
          :zoom="15"
        >
          <gmap-marker
            ref="myMarker"
            :position="notePosition"
            @click="toggleInfoWindow"
          />
        </gmap-map>

        <div class="geocoords" v-if="!!note.geocode">
          <a @click="showMap()" class="geocords-link">
            <svg class="icon-tiny" style="vertical-align: text-bottom;"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
            {{geoLat +', '+geoLon}}
          </a>
        </div>

        <div class="places" v-if="!!note.place && !!note.place.name">
          <img :src="note.place.icon" class="icon-tiny" />
          <span class="placeName">{{note.place.name}}</span>
          <a :href="note.place.url" target="_blank" style="display: inline-block; vertical-align: middle;">
            <svg class="icon-tiny"><use xlink:href="dist/symbols.svg#launch"></use></svg>
          </a>
        </div>

        <p class="note">{{note.note}}</p>

        <p class="photos" v-for="photo in note.photos">
          <span v-if="!!photo.name" class="photo-name">{{photo.name}}</span>
          <img
            :key="photo.id"
            :src="photoUrl(photo, 'medium')"
            class="note-photo"
            @click="photoSelect(photo)"
            @error="onPhotoError(photo, $event)"
            />
          <span v-if="!!photo.caption" class="photo-caption">{{photo.caption}}</span>
        </p>

      </div>

      <gmap-map
        class="gmap-container"
        v-if="showNoteMap"
        ref="NoteMap"
        :center="{'lat':geoLat,'lng':geoLon}"
        :zoom="15"
      >
        <gmap-info-window
          :options="infoOptions"
          :position="notePosition"
          :opened="infoWinOpen"
          @closeclick="infoWinOpen=false"
        >
          <div class="note-info" v-if="!!note">
            <h3 style="margin-bottom: 4px;">{{note.name}}</h3>
            <div>{{$moment(note.Created_date.toDate()).format('l h:mm:ss a')}}</div>
            <div v-if="hasPlace">
              <img :src="note.place.icon" width="24" height="24" style="vertical-align: middle;"/>
              <span>{{note.place.name}}</span>
              <a :href="note.place.url" target="_blank">
                <svg class="icon-tiny"><use xlink:href="dist/symbols.svg#launch"></use></svg>
              </a>
            </div>
            <p style="max-width: 300px; max-height: 280px; overflow-y: auto; overflow-x: hidden; white-space: pre-wrap;">{{note.note}}</p>
          </div>
        </gmap-info-window>
        <gmap-marker
          ref="myMarker"
          :position="notePosition"
          @click="toggleInfoWindow"
        ></gmap-marker>
      </gmap-map>

    </div>

    <photo-viewer
      :photo="selectedPhoto"
      v-if="showPhotoViewer"
      @close="showPhotoViewer = false"
    />

    <div class="navigation">
      <router-link to="/">Home</router-link>
      &gt;
      <router-link class="notebooks-link" to="/notebooks">Notebooks</router-link>
      &gt;
      <a @click="closeNote()" class="back2notebook">Notebook</a>
      <span v-if="notebookNoteCount > 1" class="icon-button-bar">
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
      <div slot="body">Are you sure you want to delete this note? This can not be undone.</div>
      <div slot="footer">
        <button class="modal-optional-button" @click="cancelDelete()">
          Cancel
        </button>
        <button class="modal-default-button" @click="confirmDelete()">
          Confirm
        </button>
      </div>
    </modal-dialog>

    <modal-dialog v-if="showMissingImageModal" @close="showMissingImageModal = false">
      <h3 slot="header">Missing Image</h3>
      <div slot="body">
        No data was found for the selected image. If you believe this image has been removed, select
        Delete below to remove its reference from this note.
      </div>
      <div slot="footer">
        <button class="modal-optional-button" @click="showMissingImageModal = false">
          Cancel
        </button>
        <button class="modal-default-button" @click="confirmImageDelete()">
          Delete
        </button>
      </div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from '@/components/ModalDialog'
  import PhotoViewer from '@/components/PhotoViewer'
  import { mapGetters } from 'vuex'

  // mapGetters was breaking my test so I switched over to using basic computed properties
  //import { mapGetters } from 'vuex'

  export default {

    components: {
      ModalDialog, PhotoViewer
    },

    computed: {

      geoLat() {
        return this.note.geocode ? this.note.geocode.latitude : 0;
      },

      geoLon() {
        return this.note.geocode ? this.note.geocode.longitude : 0;
      },

      note() {
        return this.$store.state.notes.activeNote;
      },

      notePosition() {
        return this.note.geocode ? {
          lat: this.note.geocode.latitude,
          lng: this.note.geocode.longitude
        } : {lat:0, lng:0};
      },

      hasPlace() {
        return (this.note.place && this.note.place._id);
      },

      activeNote() {
        return this.$store.state.notes.activeNote;
      },

      activePhotos() {
        return this.$store.state.photos.activePhotos;
      },

      notebookNoteCount() {
        return this.$store.state.notes.notebookNotes.length;
      },

      ...mapGetters('photos', ['photoUrl'])
      // Setup getters from store
      //...mapGetters('notes', ['notebookNoteCount'])
    },

    data() {
      return {
        showConfirmModal: false,
        showMissingImageModal: false,
        isLoading: false,
        loadingMessage:'Loading...',
        showNoteMap:false,
        showPhotoViewer:false,
        selectedPhoto:null,
        infoOptions: {
          pixelOffset: {
            width: 0,
            height: -35
          }
        },
        infoWinOpen: true,
        missingImage:null,
        reloads:[]
      }
    },

    watch: {
      $route(toRoute, fromRoute) {
        //console.log(`Note.watch.$route() toRoute [${toRoute.name}] fromRoute [${fromRoute.name}] path [${toRoute.path}] note_id [${toRoute.params.note_id}]`);
        // watch for id changes
        if ((this.note && toRoute.params.note_id) && this.note._id !== toRoute.params.note_id) {
          // handle browser navigation
          this.$store.dispatch('notes/setActiveNote', toRoute.params.note_id);
        }
        // watch for map toggle
        if (toRoute.name === 'note-map') { // show map
          this.showNoteMap = true;
        } else if (toRoute.name === 'note') { // hide map
          this.showNoteMap = false;
        } else {
          console.warn('Note.$route() Unhandled route [' + toRoute.path + ']');
        }
      },

      '$store.state.user.userAuthenticating': function(val, oldVal) {
        //console.log(`Note.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!this.$store.state.user.user.uid) {
          this.initNote();
        }
      }
    },

    mounted() {
      //console.log(`Note.mounted() $route.path [${this.$route.path}]`);
      if (!this.$store.state.user.userAuthenticating) {
        this.initNote();
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

      initNote() {
        //console.log('Note.initNote()');
        this.isLoading = true;
        if (!this.activeNote._id) { // Note must be deep-linked first load
          //console.log('Note.initNote() deeplinked');
          this.$store.dispatch('notes/getNote', this.$route.params.note_id)
            .then(() => {
              if (this.$route.name === 'note-map') {
                this.showNoteMap = true;
              }
              // load note photos if it has photos
              this.loadNotePhotos()
                .then(hasPhotos => {
                  this.isLoading = false;
                });
              // load notebook notes for next/previous navigation
              this.$store.dispatch('notes/getNotebookNotes', this.note.notebook)
                .then(() => {
                  // Notebook notes have loaded
                })
                .catch(this.handleError);
            })
            .catch(this.handleError);
        } else {
          // activeNote has already been set. Check route and for photos
          if (this.$route.name === 'note-map') {
            this.$gmapApiPromiseLazy().then(() => {
              // get a render error if we try to load maps immediately
              this.showNoteMap = true;
            });
          }
          this.loadNotePhotos()
            .then(hasPhotos => {
              this.isLoading = false;
            });
        }
      },

      loadNotePhotos() {
        //console.log('Note.loadNotePhotos()');
        if (!!this.activeNote.photos && this.activeNote.photos.length > 0) {
          if (!this.$store.getters['photos/photosLoaded'](this.activeNote.photos)) {
            this.loadingMessage = 'Loading photos...';
            return this.$store.dispatch('photos/getNotePhotos', this.activeNote._id)
              .then(() => {
                return Promise.resolve(true)
              });
          } else {
            // photos are already loaded in store
            return Promise.resolve(true);
          }
        } else {
          // no photos
          return Promise.resolve(false)
        }
      },

      editNote() {
        //console.log('Note.editNote()');
        this.$router.push('/note-edit/' + this.note._id);
      },

      editNoteMobile() {
        //console.log('Note.editNoteMobile()');
        this.$router.push('/note-edit-mobile/' + this.note._id);
      },

      closeNote() {
        //console.log(`Note.closeNote()`);
        this.$router.push('/notebook/' + this.note.notebook);
      },

      nextNote() {
        //console.log('Note.nextNote()');
        this.$store.dispatch('notes/nextNote')
          .then(() => {
            this.$router.push('/note/' + this.note._id + (this.showNoteMap ? '/map/' : ''));
          })
          .catch(this.handleError)
      },

      previousNote() {
        //console.log('Note.previousNote()');
        this.$store.dispatch('notes/previousNote')
          .then(() => {
            this.$router.push('/note/' + this.note._id + (this.showNoteMap ? '/map/' : ''));
          })
          .catch(this.handleError)
      },

      deleteNote() {
        //console.log('Note.deleteNote()');
        this.showConfirmModal = true;
      },

      cancelDelete() {
        //console.log('Note.cancelDelete()');
        this.showConfirmModal = false;
      },

      confirmDelete() {
        //console.log('Note.confirmDelete()');
        this.loadingMessage = 'Removing Note...';
        this.isLoading = true;
        let notebook_id = this.note.notebook;
        this.$store.dispatch('notes/delete', this.note._id)
          .then(() => {
            this.$router.push('/notebook/' + notebook_id);
            this.isLoading = false;
          })
          .catch(this.handleError);
      },

      showMap() {
        //console.log('Note.showMap() lat ['+this.geoLat+'] lng ['+this.geoLon+']');
        this.$router.push('/note/'+this.note._id+'/map');
      },

      showNote() {
        //console.log('Note.showNote()');
        this.$router.push('/note/'+this.note._id);
      },

      toggleInfoWindow(marker) {
        //console.log('Note.toggleInfoWindow()');
        this.infoWinOpen = !this.infoWinOpen;
      },

      photoSelect(photo) {
        //console.log('Note.photoSelect()');
        this.loadingMessage = 'Loading Photo...';
        this.isLoading = true;
        this.$store.dispatch('photos/getActivePhoto', {note_id: this.activeNote._id, photo_id: photo.id})
          .then(photo => {
            this.isLoading = false;
            this.$router.push(`${this.$route.path}/photo/${photo.id}`);
          })
          .catch(this.handleError);
        // [TODO] remember scroll state
      },

      onPhotoError(photo, evnt) {
        // Sometimes it takes a couple of seconds for a newly uploaded image to respond
        // get/create a counter reference
        let reload;
        if (!this.reloads[photo.id]) {
          reload = this.reloads[photo.id] = {photo: photo, count: 0, src: evnt.target.src};
          // [TODO] Need some kind of indicator that photo is loading until we give up
          evnt.target.style.display = 'none';
          evnt.target.addEventListener('load', this.onPhotoErrorReload, {once:true});
        } else {
          reload = this.reloads[photo.id];
        }
        //console.log(`Note.onPhotoError() ${reload.count}`);
        if (reload.count < 10) {
          reload.timeout = setTimeout(() => {
            reload.count++;
            let reloadUrl = `${reload.src}?reload=${reload.count}`;
            evnt.target.src = reloadUrl;
          }, 1000)
        } else {
          //console.log(`Note.onPhotoError() Give up reloading ${reload.photo.id}`);
          evnt.target.style.display = 'none';
          reload.timeout = null;
          this.$emit('missingphoto', photo);
        }
      },

      onPhotoErrorReload(evnt) {
        //console.log(`Note.onPhotoErrorReload()`);
        console.dir(evnt);
        evnt.target.style.display = 'block';
      },

      confirmImageDelete() {
        //console.log('Note.confirmImageDelete()');
        // If image isn't in photos collection then remove reference from the note.
        // Could result from a failure to update note after photo doc is deleted.
        this.$store.dispatch('notes/removeNotePhoto', {note_id: this.activeNote._id, photo_id: this.missingImage[1]})
          .then(() => {
            this.showMissingImageModal = true;
          });
      },

      handleError(err) {
        console.warn('Note.handleError()');
        console.dir(err);
        this.isLoading = false;
        if (err.message.startsWith('Failed to get photo by id')) {
          // show error message
          this.missingImage = err.message.match(/\[([0-9]+)\]/);
          this.showMissingImageModal = true;
        }
      }

    }

  }
</script>

<style scoped>

  .gmap-container {
    height: calc(100% - 50px);
  }

  .body {
    height: calc(100% - 50px);
    padding: 0 20px 10px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .body > div {
    margin: 10px 0;
  }

  .note-view-map {
    float: right;
    width: 200px;
    height: 150px;
  }

  .date, .geocoords, .places {
    float: left;
    clear: left;
  }

  .places img {
    vertical-align: middle;
  }
  .places .placeName {
    display: inline-block;
    vertical-align: middle;
    max-width: 520px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .note {
    border: 1px solid transparent;
    white-space: pre-wrap;
    clear: both;
  }

  a svg {
    fill: #42b983;
  }

  .navigation a {
    display: inline-block;
  }

  .note-photo {
    display: block;
    margin: 0 auto;
  }

  .photo-name {
    color:#666;
    width: 100%;
    display: inline-block;
    text-align: center;
  }

  .photo-caption {
    width: 100%;
    display: inline-block;
    margin-top: 8px;
    padding: 0 40px;
  }

  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    .note-info {
      font-size: 1rem;
    }
    div.body {
      height: calc(100% - 50px);
    }
  }

</style>
