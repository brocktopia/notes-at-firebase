<template>
  <div class="app-wrapper">

    <!-- Start desktop view -->

    <note-edit-desktop
      v-if="device === 'desktop' && !showPhotoEdit"
      :note="note"
      :mode="mode"
      :previews="photoPreviews"
      :photoselected="isPhotoSelected"
      :cansave="saveEnabled"
      @mapload="mapLoad"
      @getgeo="updateCoordinates"
      @mapmarker="mapMarkerMoved"
      @clearplace="clearPlace"
      @findplace="findPlace"
      @search="searchForLocation"
      @photoselect="onPhotosSelect"
      @uploadphotos="uploadPhotos"
      @clearphotos="clearPhotos"
      @photoclick="onPhotoClick"
      @previewclick="onPhotoPreviewClick"
      @onexif="onPhotoExif"
      @missingphoto="onMissingPhoto"
      @close="closeNote"
      @save="saveNote"
    />

    <!-- Start mobile view -->
    <div class="mobile" v-if="device === 'mobile' && !showPhotoEdit">

      <!-- Name, Date & Map settings -->
      <keep-alive>
        <note-edit-mobile
          v-if="activeView === 'edit-name'"
          :note="note"
          :mode="mode"
          :previews="photoPreviews"
          :photoselected="isPhotoSelected"
          :cansave="saveEnabled"
          @next="activeView = 'edit-note'"
          @mapload="mapLoad"
          @getgeo="updateCoordinates"
          @mapmarker="mapMarkerMoved"
          @clearplace="clearPlace"
          @findplace="findPlace"
          @search="searchForLocation"
          @photoselect="onPhotosSelect"
          @uploadphotos="uploadPhotos"
          @clearphotos="clearPhotos"
          @photoclick="onPhotoClick"
          @previewclick="onPhotoPreviewClick"
          @onexif="onPhotoExif"
          @missingphoto="onMissingPhoto"
          @close="closeNote"
          @save="saveNote"
        />
      </keep-alive>

      <!-- Note input -->
      <div
        :class="'app-container' + (mode === 'new' ? ' new' : ' edit')"
        v-if="activeView === 'edit-note'"
      >

        <nav class="head">
          <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
          <span class="button-bar">
            <button class="icon" @click="activeView = 'edit-name'"><svg><use xlink:href="dist/symbols.svg#arrow-back">
              <title>Back</title>
            </use></svg></button>
            <button v-if="saveEnabled" class="icon" @click="saveNote()"><svg><use xlink:href="dist/symbols.svg#save">
              <title>Save Note</title>
            </use></svg></button>
          </span>
        </nav>

        <div class="content note-edit">
          <textarea id="noteNote" v-model="note.note" placeholder="Your note"></textarea>
        </div>

        <div class="navigation">
          <a @click="closeNote()">Cancel</a>
          <a class="action-link" @click="saveNote()">Save</a>
          <a class="action-link" @click="activeView = 'edit-name'">Back</a>
        </div>
      </div>

    </div>
    <!-- Dynamically loaded content -->

    <photo-edit
      v-if="showPhotoEdit"
      :target="activePhoto"
      :loadedAsSubcomponent="true"
      @close="showPhotoEdit = false"
      @save="onPhotoSave"
      @photodelete="onPhotoDelete"
    ></photo-edit>

    <photo-viewer
      v-if="showPreviewPhoto"
      :path="selectedPreview.path"
      @close="showPreviewPhoto = false"
    />

    <exif-viewer
      v-if="showExifData"
      :exifs="photoExifs"
      @selectexif="onExifDataSelect"
      @close="showExifData = false"
    />

    <places-dialog
      v-if="showPlacesDialog"
      :places="places"
      :placeName="placeName"
      :showMore="showMoreButton"
      v-on:select="placeSelected"
      v-on:close="placesClose"
      v-on:place="placeInputUpdated"
      v-on:more="moreSelected"
    ></places-dialog>

    <modal-dialog
      v-if="showMessage"
      @close="showMessage = false"
    >
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <modal-dialog
      v-if="showConfirm"
      :modalType="'yesno'"
      @close="showConfirm = false"
      @confirm="confirmMethod()"
    >
      <h3 :class="'notify'" slot="header">{{confirmTitle}}</h3>
      <div slot="body" v-html="confirmBody"></div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import PlacesDialog from '@/components/PlacesDialog'
  import ModalDialog from '@/components/ModalDialog'
  import PhotoScroller from '@/components/PhotoScroller'
  import NoteEditDesktop from '@/components/NoteEditDesktop'
  import NoteEditMobile from '@/components/NoteEditMobile'
  import {GmapMap, GmapMarker} from 'vue2-google-maps'
  import PhotoEdit from './PhotoEdit'
  import PhotoViewer from '@/components/PhotoViewer'
  import ExifViewer from '@/components/ExifViewer'
  //import { mapGetters } from 'vuex'

  let vm,
    closeRoute;
  export default {

    components: {
      PlacesDialog,
      ModalDialog,
      PhotoEdit,
      PhotoScroller,
      PhotoViewer,
      ExifViewer,
      NoteEditDesktop,
      NoteEditMobile
    },

    data() {
      return {
        isLoading: true,
        loadingMessage: 'Loading...',
        google:null,
        activeView: 'edit-name',
        locationDenied: false,
        mode:'',
        places:[],
        placeName:'',
        note:{name:'',note:'',photos:[],geocode:{latitude:0,longitude:0},Created_date:{toDate(){return new Date()}}}, // need enough default values for template
        placesService: null,
        showPlacesDialog: false,
        showMoreButton: false,
        pagination: null,
        mapSearchInput: '',
        isPhotoSelected: false,
        showPhotoEdit: false,
        photoPreviews:[],
        // message dialog
        showMessage: false,
        messageClass: 'notify',
        messageTitle: '',
        messageBody: '',
        // confirm dialog
        showConfirm: false,
        confirmTitle: '',
        confirmBody: '',
        confirmMethod: null,
        // photo preview
        showPreviewPhoto: false,
        selectedPreview: null,
        // photo exif
        showExifData: false,
        photoExifs: [],
        imageInput: null,
        photoFileList: null,
        exifDelayTimer: NaN
      }
    },

    computed: {

      device() {
        if (this.$route.name.includes('mobile')) {
          return 'mobile';
        } else {
          return 'desktop';
        }
      },

      location() {
        return { lat: this.note.geocode.latitude, lng: this.note.geocode.longitude }
      },

      geoLat() {
        if (!this.note) return 0;
        return this.note.geocode.latitude || 0;
      },

      geoLon() {
        if (!this.note) return 0;
        return this.note.geocode.longitude || 0;
      },

      hasGeocoords() {
        if (!this.note || !this.note.geocode) {
          return false;
        }
        return (this.location.lat !== 0 && this.location.lng !== 0);
      },

      saveEnabled() {
        return !!this.note.name && !!this.note.note && this.note.name.length > 0 && this.note.note.length > 0;
      },

      activeNote: function() {
        return this.$store.state.notes.activeNote;
      },

      activePhoto() {
        return this.$store.state.photos.activePhoto;
      },

      activePhotos() {
        return this.$store.state.photos.activePhotos;
      },

      notebookNoteCount: function() {
        return this.$store.state.notes.notebookNoteCount;
      },

      photoBaseUrl() {
        return this.$store.state.photos.photoBaseUrl;
      },

      noteDate: { // Firestore's Timestamp class requires transformation
        get() {
          return this.note.Created_date.toDate().toISOString();
        },
        set(date) {
          if (!date) return;
          date = new Date(date);
          this.note.Created_date = this.$firebase.firebase_.firestore.Timestamp.fromDate(date);
        }
      }

      // Setup getters from store
      //...mapGetters('notes', ['activeNote','notebookNoteCount'])
    },

    watch: {
      '$store.state.user.userAuthenticating': (val, oldVal) => {
        //console.log(`NoteEdit.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.init();
        }
      }
    },

    beforeRouteEnter(toRoute, fromRoute, next) {
      //console.log('NoteEdit.beforeRouteEnter()');
      if (fromRoute.name && fromRoute.fullPath.indexOf('note-edit') === -1) {
        closeRoute = fromRoute.fullPath;
      }
      next();
    },

    mounted() {
      //console.log(`NoteEdit.mounted()`);
      vm = this;
      // make sure user isn't being authenticated
      if (!vm.$store.state.user.userAuthenticating) {
        vm.init();
        // Authentication watcher above will trigger init
      }
      // get google reference
      vm.$gmapApiPromiseLazy().then((google) => {
        vm.google = google;
      });
    },

    methods:{

      init() {
        //console.log(`NoteEdit.initNote()`);
        // Check route to determine if note is new
        if (vm.$route.name === 'note-new' || vm.$route.name === 'note-new-mobile') {
          vm.mode = 'new'
        } else {
          vm.mode = 'edit'
        }
        //console.log(`NoteEdit.initNote() mode: ${vm.mode}`);
        // Check for deep-linking
        if (vm.mode === 'new') {
          if (!vm.activeNote.notebook) { // Deep-linked note-new
            //console.log(`NoteEdit.initNote() new note deep-linked`);
            // pull notebook_id out of route
            vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id)
              .then(() => {
                Object.assign(vm.note, vm.activeNote);
                vm.isLoading = false;
              })
              .catch(vm.handleError);
          } else {
            Object.assign(vm.note, vm.activeNote);
            vm.isLoading = false;
          }
        } else if (vm.mode === 'edit') {
          if (!vm.activeNote._id) { // Deep-linked note-edit
            //console.log(`NoteEdit.initNote() deep-linked note_id [${vm.$route.params.note_id}]`);
            vm.$store.dispatch('notes/getNote', vm.$route.params.note_id)
              .then(() => {
                // copy data from activeNote
                Object.assign(vm.note, vm.activeNote);
                vm.isLoading = false;
                if (vm.activeNote._id) {
                  closeRoute = '/note/' + vm.activeNote._id;
                }
              })
              .catch(vm.handleError);
            // get note photos
            this.$store.dispatch('photos/getNotePhotos', vm.$route.params.note_id)
              .catch(this.handleError)
          } else {
            Object.assign(vm.note, vm.activeNote);
            vm.isLoading = false;
          }
        } else {
          console.warn('NoteEdit.initNote() Unable to determine context for initialization');
        }
        // get location if this is a new note
        if (vm.mode === 'new') {
          vm.updateCoordinates(false);
        }
      },

      mapLoad(map) {
        //console.log(`NoteEdit.mapLoad()`);
        vm.placesService = new vm.google.maps.places.PlacesService(map);
      },

      updateCoordinates(userAction) {
        //console.log(`NoteEdit.updateCoordinates() userAction: ${userAction}`);
        // [TODO Switch to using Utils version of this function]
        navigator.geolocation.getCurrentPosition(
          (position) => {
            //console.dir(position);
            vm.note.geocode = {
              latitude: Number(position.coords.latitude.toFixed(7)),
              longitude: Number(position.coords.longitude.toFixed(7))
            };
            // clear any loaded places
            vm.places = [];
          },
          (err) => {
            console.warn(`NoteEdit.updateCoordinates() ERROR(${err.code}): ${err.message}`);
            //console.dir(err);
            if (err.message === 'User denied Geolocation') {
              vm.locationDenied = true;
              if (userAction) {
                this.messageTitle = 'User Denied Geolocation';
                this.messageBody = 'Access to browser geolocation data has been denied. You must allow access to that data to enable this feature. This can be done in your browser settings.';
                this.messageClass = 'warn';
                this.showMessage = true;
              }
            } else if (userAction) {
              this.messageTitle = 'Geolocation Failed';
              this.messageBody = 'Your device was unable to determine your current location.';
              this.messageClass = 'notify';
              this.showMessage = true;
            }
          },
          {
            enableHighAccuracy: true
          }
        );
      },

      saveNote() {
        //console.log(`NoteEdit.saveNote() `);
        vm.isLoading = true;
        const dispatchMethod = (vm.mode === 'edit') ? 'notes/updateActiveNote' : 'notes/saveActiveNote';
        vm.loadingMessage = 'Saving Note...';
        vm.$store.dispatch(dispatchMethod, vm.note)
          .then((note) => {
            this.note = {...note};
            if (this.photoFileList && this.photoFileList.length > 0) {
              vm.savePhotos()
                .then(vm.afterSaveNote);
            } else {
              vm.afterSaveNote();
            }
          })
          .catch(vm.handleError);
      },

      savePhotos() { // Returns Promise
        //console.log(`NoteEdit.savePhotos()`);
        vm.isLoading = true;
        vm.loadingMessage = 'Saving Photos...';
        return vm.$store.dispatch('photos/addPhotos', {files:this.imageInput.files, note_id: vm.activeNote._id})
          .then((results) => {
            vm.loadingMessage = 'Updating Note...';
            // update notes photos array with photo data
            vm.note.photos = vm.$store.getters['photos/photosSummary'];
            return vm.$store.dispatch('notes/updateNotePhotos', vm.note);
          })
          .catch(vm.handleError);
      },

      afterSaveNote() {
        //console.log(`NoteEdit.afterSaveNote()`);
        vm.isLoading = false;
        if (vm.mode === 'edit') {
          if (closeRoute.includes(vm.activeNote._id)) {
            vm.$router.push(closeRoute);
          } else {
            vm.$router.push('/note/' + vm.activeNote._id);
          }
        } else {
          //vm.$router.push('/note/' + vm.activeNote._id);
          // Go back to notebook if user came here from notebook
          if (closeRoute.includes('notebook')) {
            vm.$router.replace(closeRoute);
          } else {
            vm.$router.replace('/note/' + vm.activeNote._id);
          }
        }
      },

      closeNote() {
        //console.log(`NoteEdit.closeNote() closeRoute [${closeRoute}]`);
        if (closeRoute) {
          vm.$router.push(closeRoute);
        } else {
          vm.$router.push('/notebook/' + vm.activeNote.notebook);
        }
      },

      hasPlace(note) { // this should probably be a computed property
        return !!(note.place && note.place.name)
      },

      findPlace() {
        //console.log(`NoteEdit.findPlace()`);
        let options = {
          location:{
            lat:vm.geoLat,
            lng:vm.geoLon
          },
          radius:1000
        };
        if (vm.placeName) {
          options.keyword = vm.placeName;
        }
        // Check to see if places have already been loaded
        if (this.places.length > 0) {
          vm.showPlacesDialog = true;
        } else {
          // Call PlacesService
          vm.placesService.nearbySearch(options, (res, status, pagination) => {
            if (status !== 'OK') {
              if (status === 'ZERO_RESULTS') {
                //vm.noPlaceResults = true;
              } else {
                vm.showServiceFailure();
                return;
              }
            }
            vm.places ? vm.places = vm.places.concat(res) : vm.places = res;
            vm.showPlacesDialog = true;
            if (pagination.hasNextPage) {
              vm.showMoreButton = true;
              vm.pagination = pagination;
            } else {
              vm.showMoreButton = false;
              vm.pagination = null;
            }
          });
        }
      },

      moreSelected() {
        //console.log(`NoteEdit.moreSelected()`);
        if (vm.pagination) {
          vm.pagination.nextPage();
        }
      },

      mapMarkerMoved(marker) {
        //console.log(`NoteEdit.mapMarkerMoved()`);
        let latlonObj = {
          latitude:  Number(marker.latLng.lat().toFixed(7)),
          longitude: Number(marker.latLng.lng().toFixed(7))
        };
        vm.note.geocode = latlonObj;
        // clear any loaded places
        vm.places = [];
      },

      placesClose() {
        //console.log(`NoteEdit.placesClose()`);
        vm.showPlacesDialog = false;
      },

      placeSelected(place) {
        //console.log(`NoteEdit.placeSelected()`);
        let options = {
          placeId: place.place_id,
          fields:['name', 'url']
        };
        vm.placesService.getDetails(options, (placeDetail, status) => {
          //console.log(`NoteEdit.placeSelected() place details [${status}]`);
          if (status === 'OK') {
            vm.note.place = {
              name: place.name,
              icon: place.icon,
              url: placeDetail.url,
              _id: place.place_id
            };
            vm.note.geocode = {
              latitude: Number(place.geometry.location.lat().toFixed(7)),
              longitude: Number(place.geometry.location.lng().toFixed(7))
            };
            // hide the 2 potential dialogs that call this method
            vm.showPlacesDialog = false;
            vm.showConfirm = false;
          } else {
            console.warn(`NoteEdit.placeSelected() Error [${status}] getting Place details`);
          }
        });
      },

      placeInputUpdated(name) {
        //console.log(`NoteEdit.placeInputUpdated() ${name}`);
        // clear current results
        vm.placeName = name;
        vm.places = [];
        vm.findPlace();
      },

      clearPlace() {
        //console.log(`NoteEdit.clearPlace()`);
        vm.$delete(vm.note, 'place');
        // needs to be empty object to save
        vm.note.place = {};
      },

      searchForLocation(location) {
        //console.log(`NoteEditor.searchForLocation() location [${location}]`);
        const options = {
          query: location
        };
        // Make sure we have valid geocoordinates
        if (this.hasGeocoords) {
          options.location = {
            lat: this.geoLat,
            lng: this.geoLon
          }
        }
        // perform Places textSearch
        this.placesService.textSearch(options, (res, status) => {
          //console.log(`NoteEditor.searchForLocation() status [${status}] results`);
          //console.dir(res);
          // TODO Future option for displaying multiple results
          if (status === 'OK') {
            const loc = res[0];
            //this.note.geocode = this.note.geocode || {};
            this.note.geocode = {
              latitude: Number(loc.geometry.location.lat().toFixed(7)),
              longitude: Number(loc.geometry.location.lng().toFixed(7))
            };
            if (loc.place_id) {
              this.confirmTitle = 'Add Place';
              this.confirmBody = `Your search for "${location}" found place information for <img src="${loc.icon}" width="25" height="25" style="vertical-align: middle;"><b>${loc.name}</b>. Would you like to save this with your note?`;
              this.confirmMethod = this.placeSelected.bind(this, loc);
              this.showConfirm = true;
            }
          } else if (status === 'ZERO_RESULTS') {
            this.messageTitle = 'No Results';
            this.messageBody = `Your search for [${location}] return no results.`;
            this.messageClass = 'notify';
            this.showMessage = true;
          } else {
            this.showServiceFailure();
          }
        })
      },

      onPhotosSelect(evnt) {
        //console.log(`NoteEditor.onPhotosSelect() photos ${evnt.target.files.length}`);
        this.photoFileList = evnt.target.files;
        this.imageInput = evnt.target;
        this.isPhotoSelected = this.photoFileList.length > 0;
        this.photoPreviews = [];
        this.photoExifs = [];
        if (this.isPhotoSelected  && !!window.URL) {
          const files = Array.from(this.photoFileList);
          files.forEach((photo, index) => {
            let img = {
              path: window.URL.createObjectURL(photo),
              name: photo.name,
              index: index
            };
            this.photoPreviews.push(img)
          })
        }
      },

      clearPhotos() {
        //console.log(`NoteEditor.clearPhotos()`);
        this.imageInput.value = null;
        this.isPhotoSelected = false;
        this.photoPreviews = [];
        this.photoFileList = null;
      },

      uploadPhotos() {
        //console.log(`NoteEditor.uploadPhotos()`);
        this.savePhotos()
          .then(note => {
            // returns current note reference
            this.clearPhotos();
            this.isLoading = false;
          })
      },

      onPhotoClick(photo) {
        //console.log(`NoteEditor.onPhotoClick()`);
        this.$store.commit('photos/setActivePhotoById', photo.id);
        this.showPhotoEdit = true;
        //this.$router.push(`${this.$route.path}/photo-edit/${photo.id}`);
      },

      onPhotoPreviewClick(preview) {
        //console.log(`NoteEditor.onPhotoPreviewClick() path [${preview.path}] ${typeof(preview.path)}`);
        this.selectedPreview = preview;
        this.showPreviewPhoto = true;
      },

      onPhotoExif(data, preview) {
        //console.log(`NoteEditor.onPhotoExif() [${preview.path}]`);
        if (this.photoExifs.findIndex(exif => exif.index === preview.index) === -1) {
          this.photoExifs.push(Object.assign({}, data, preview));
          clearTimeout(this.exifDelayTimer);
          // set a delay so all image exif data can be loaded before showing dialog
          this.exifDelayTimer = setTimeout(() => {
            this.showExifData = true;
          }, 500)
        }
      },

      onExifDataSelect(data) {
        //console.log(`NoteEditor.onExifDataSelect()`);
        if (data.datetime) {
          this.note.Created_date = this.$firebase.firebase_.firestore.Timestamp.fromDate(data.datetime);
        }
        if (data.geocode) {
          this.note.geocode = data.geocode;
        }
      },

      onPhotoSave(photo) {
        //console.log(`NoteEditor.onPhotoSave()`);
        this.note.photos = vm.$store.getters['photos/photosSummary'];
        vm.$store.dispatch('notes/updateNotePhotos', vm.note);
      },

      onPhotoDelete(photo) {
        console.log(`NoteEditor.onPhotoDelete()`);
        // activeNote will have been updated already
        this.note.photos = this.activeNote.photos;
      },

      onMissingPhoto(photo) {
        //console.log(`NoteEditor.onMissingPhoto()`);
        this.$store.dispatch('photos/checkMissingPhoto', {note_id: this.note._id, photo_id: photo.id})
          .then(success => {
            if (success) {
              //console.log('PhotoScroller.onPhotoError() photo exists');
            }
            else {
              //console.log('PhotoScroller.onPhotoError() no photo');
              this.note.photos = this.$store.getters['photos/photosSummary'];
              this.$store.dispatch('notes/updateNotePhotos', this.note)
                .then(console.log)
                .catch(this.handleError)
            }
          })
          .catch(this.handleError)
      },

      showServiceFailure() {
        //console.log(`NoteEditor.showServiceFailure()`);
        vm.messageTitle = 'Service Failure';
        vm.messageBody = 'There was a problem searching for places at your current location.';
        vm.showMessage = true;
      },

      handleError(err) {
        console.warn(`Note.handleError()`);
        console.dir(err);
        if (vm.isLoading) {
          vm.isLoading = false;
          vm.messageTitle = 'Problem Saving Note';
          vm.messageBody = 'An error occurred while attempting to save this note. Make sure the note has both a name and note body text.';
          vm.showMessage = true;
        }
      }

    }
  }

</script>

<style lang="scss" scoped>

  .mobile {
    #noteNote {
      height: 100%;
      font-size: 1.8rem;
    }
    .content textarea {
      width: 100%;
      heigth: 100%;
      overflow: auto;
    }
    .content > *:last-child {
      margin-bottom: 0;
    }
  }

</style>
