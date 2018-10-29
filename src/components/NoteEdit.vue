<template>
  <div>

    <div v-if="device === 'desktop'" class="app-container edit desktop">

      <nav class="head">
        <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
        <span class="button-bar">
          <button class="icon action-icon" @click="closeNote()"><svg><use xlink:href="./dist/symbols.svg#close-note">
            <title>Cancel Edit</title>
          </use></svg></button>
          <button v-if="saveEnabled" class="icon action-icon save-note" @click="saveNote()"><svg><use xlink:href="./dist/symbols.svg#save">
            <title>Save Note</title>
          </use></svg></button>
        </span>
      </nav>

      <div class="content note-edit">

        <!-- CSS Grid requires 7 elements for layout (name, date, location, places, search, map & note) -->

        <div class="name">
          <label for="noteName">Name</label>
          <input type="text" id="noteName" v-model="note.name" maxlength="40" placeholder="Name for your note" tabindex="1">
          <span class="input-info"><span class="char-count">{{note.name.length}}</span> (40 character limit)</span>
        </div>

        <div class="date">{{$moment(note.Created_date.toDate()).format('LLLL')}}</div>

        <div class="geocoords">
          <label for="geocords">Location:</label>
          <span v-if="hasGeocoords" id="geocords" class="link">{{geoLat + ', ' + geoLon}}</span>
          <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
          <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">Your location can not be determined</span>
          <svg class="icon-small action-icon" @click="updateCoordinates(true)"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
        </div>

        <div class="place">
          <label v-if="!hasPlace(note)" for="placeName">
            <svg class="icon-small"><use xlink:href="./dist/symbols.svg#place"></use></svg>
          </label>
          <label v-if="hasPlace(note)" for="placeName">
            <img :src="note.place.icon" width="24" height="24" />
          </label>
          <span v-if="hasGeocoords" :class="note.place && note.place._id ? 'has-place' : 'no-place'" id="placeName">{{note.place && note.place._id ? note.place.name : 'Click the button to lookup a place'}}</span>
          <span style="float:right;">
            <button class="small" v-if="note.place && note.place._id" @click="clearPlace()" style="margin-right: 10px;">Remove Place</button>
            <button class="small" @click="findPlace()" tabindex="2">Lookup Places</button>
          </span>
        </div>

        <div class="search">
          <input
            type="text"
            v-model="mapSearchInput"
            class="map-search-input"
            placeholder="Search for location"
            @keyup.enter="searchForLocation(mapSearchInput)"
          >
          <button class="icon small bg-lt" @click="searchForLocation(mapSearchInput)"><svg><use xlink:href="./dist/symbols.svg#search">
            <title>Search</title>
          </use></svg></button>
          <span class="map-info">Drag marker to move location.</span>
        </div>

        <gmap-map
          ref="NoteMap"
          :center="{'lat':geoLat,'lng':geoLon}"
          :zoom="15"
          style="width:100%;  height: 150px;"
        >
          <gmap-marker
            ref="myMarker"
            :draggable="true"
            @dragend="mapMarkerMoved"
            :position="{'lat':note.geocode.latitude, 'lng':note.geocode.longitude}"></gmap-marker>
        </gmap-map>

        <div class="note-input">
          <textarea id="noteNote" v-model="note.note" placeholder="Your note" tabindex="3"></textarea>
        </div>

      </div>

      <div class="navigation">
        <a @click="closeNote()">Cancel</a>
        <a class="action-link" @click="saveNote()">Save</a>
      </div>

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

    <div v-if="device === 'mobile'" class="mobile">

      <!-- Name, Date & Map settings -->
      <div :class="'app-container' + (mode === 'new' ? ' new' : ' edit')" v-if="activeView === 'edit-name'">

        <nav class="head">
          <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
          <span class="button-bar">
            <button class="icon" @click="activeView = 'edit-note'"><svg><use xlink:href="./dist/symbols.svg#arrow-forward">
              <title>Next</title>
            </use></svg></button>
            <button v-if="saveEnabled" class="icon" @click="saveNote()"><svg><use xlink:href="./dist/symbols.svg#save">
              <title>Save</title>
            </use></svg></button>
          </span>
        </nav>

        <div class="content name-edit">

          <!-- CSS Grid requires 6 elements for layout (name, date, location, places, search, map) -->

          <div class="name">
            <label v-if="mode === 'edit'" for="noteName" style="font-size: smaller;">Name</label>
            <input type="text" id="noteName" v-model="note.name" maxlength="40" placeholder="Name for your note" tabindex="1">
            <span style="font-size: smaller;">
              Maximum 40 characters (<span :class="note.name.length < 30 ? 'char-count' : 'char-count-close'">{{40 - note.name.length}}</span> remaining)
            </span>
          </div>

          <div class="date">{{$moment(note.Created_date.toDate()).format('LLLL')}}</div>

          <div class="geocoords">
            <label for="geocords">Location:</label>
            <span v-if="hasGeocoords" id="geocords" class="link">{{geoLat + ', ' + geoLon}}</span>
            <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
            <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">Your location can not be determined</span>
            <button class="icon small bg-lt action-icon" @click="updateCoordinates(true)">
              <svg class="icon-small"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
            </button>
          </div>

          <div class="place">
            <svg v-if="!hasPlace(note)" class="icon-small"><use xlink:href="./dist/symbols.svg#place"></use></svg>
            <img v-if="hasPlace(note)" :src="note.place.icon" class="icon-small" style="vertical-align:unset;" />
            <span :class="hasPlace(note) ? 'has-place' : 'no-place'" id="placeName">{{note.place && note.place._id ? note.place.name : 'Click the button to add a place'}}</span>
            <span style="float:right;">
              <button v-if="hasPlace(note)" @click="clearPlace()" style="margin-right: 10px;">Remove</button>
              <button v-if="hasPlace(note)" @click="findPlace()" tabindex="2">Change</button>
              <button v-if="!hasPlace(note)" @click="findPlace()" tabindex="2">Lookup Places</button>
            </span>
          </div>

          <div class="search">
            <input
              type="text"
              v-model="mapSearchInput"
              class="map-search-input"
              placeholder="Search for location"
              @keyup.enter="searchForLocation(mapSearchInput)"
            >
            <button class="icon small bg-lt" @click="searchForLocation(mapSearchInput)"><svg><use xlink:href="./dist/symbols.svg#search">
              <title>Search</title>
            </use></svg></button>
            <span class="map-info">Drag marker to move location.</span>
          </div>

          <gmap-map
            ref="NoteMap"
            :center="{'lat':geoLat,'lng':geoLon}"
            :zoom="15"
            style="width:100%;  height:100%;"
          >
            <gmap-marker
              ref="myMarker"
              :draggable="true"
              @dragend="mapMarkerMoved"
              :position="{'lat':geoLat, 'lng':geoLon}"></gmap-marker>
          </gmap-map>

        </div>

        <div class="navigation">
          <a @click="closeNote()">Cancel</a>
          <a class="action-link" @click="activeView = 'edit-note'">Next</a>
        </div>

      </div>

      <!-- Note input -->
      <div :class="'app-container' + (mode === 'new' ? ' new' : ' edit')" v-if="activeView === 'edit-note'">

        <nav class="head">
          <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
          <span class="button-bar">
            <button class="icon" @click="activeView = 'edit-name'"><svg><use xlink:href="./dist/symbols.svg#arrow-back">
              <title>Back</title>
            </use></svg></button>
            <button v-if="saveEnabled" class="icon" @click="saveNote()"><svg><use xlink:href="./dist/symbols.svg#save">
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

  </div>
</template>

<script>
  import PlacesDialog from './PlacesDialog'
  import ModalDialog from './ModalDialog'
  import {GmapMap, GmapMarker} from 'vue2-google-maps'
  //import { mapGetters } from 'vuex'

  let vm,
    closeRoute;
  export default {

    components: {
      PlacesDialog, ModalDialog
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
        note:{name:'',note:'',geocode:{latitude:0,longitude:0},Created_date:{toDate(){}}}, // need enough default values for template
        placesService: null,
        showPlacesDialog: false,
        showMoreButton: false,
        pagination: null,
        showMessage: false,
        messageClass: 'notify',
        messageTitle: '',
        messageBody: '',
        showConfirm: false,
        confirmTitle: '',
        confirmBody: '',
        confirmMethod: null,
        mapSearchInput: ''
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
        return ((this.note.name && this.note.note) && this.note.name.length > 0 && this.note.note.length > 0);
      },

      activeNote: function() {
        return this.$store.state.notes.activeNote;
      },

      notebookNoteCount: function() {
        return this.$store.state.notes.notebookNoteCount;
      },

      // Setup getters from store
      //...mapGetters('notes', ['activeNote','notebookNoteCount'])
    },

    watch: {
      '$store.state.user.userAuthenticating': (val, oldVal) => {
        //console.log(`NoteEdit.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.initNote();
        }
      }
    },

    beforeRouteEnter(toRoute, fromRoute, next) {
      //console.log('NoteEdit.beforeRouteEnter()');
      if (fromRoute.name) {
        closeRoute = fromRoute.fullPath;
      }
      next();
    },

    mounted() {
      //console.log(`NoteEdit.mounted()`);
      vm = this;
      // make sure user isn't being authenticated
      if (!vm.$store.state.user.userAuthenticating) {
        vm.initNote();
        // Authentication watcher above will trigger init
      }
      // get google reference
      vm.$gmapApiPromiseLazy().then((google) => {
        vm.google = google;
      });
      // get places service
      try {
        vm.$refs.NoteMap.$mapPromise.then((map) => {
          vm.placesService = new vm.google.maps.places.PlacesService(map);
        });
      } catch (e) {
        console.warn('Failied to get Places Service!');
      }
    },

    methods:{

      initNote() {
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
          } else {
            console.warn('NoteEdit.initNote() no activeNote');
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

      updateCoordinates(userAction) {
        //console.log(`NoteEdit.updateCoordinates() userAction: ${userAction}`);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            //console.dir(position);
            let latlonObj = {
              latitude: Number(position.coords.latitude.toFixed(7)),
              longitude: Number(position.coords.longitude.toFixed(7))
            };
            vm.note.geocode = latlonObj;
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
        //console.log(`NoteEdit.saveNote()`);
        //vm.$emit('save', vm.note);
        vm.loadingMessage = 'Saving Note...';
        vm.isLoading = true;
        if (vm.mode === 'edit') {
          vm.$store.dispatch('notes/updateActiveNote', vm.note)
            .then(() => {
              vm.isLoading = false;
              if (closeRoute.includes(vm.activeNote._id)) {
                vm.$router.push(closeRoute);
              } else {
                vm.$router.push('/note/' + vm.activeNote._id);
              }
            })
            .catch(vm.handleError);
        } else if (vm.mode === 'new') {
          vm.$store.dispatch('notes/saveActiveNote', vm.note)
            .then(() => {
              vm.isLoading = false;
              vm.$router.push('/note/' + vm.activeNote._id);
            })
            .catch(vm.handleError);
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
                vm.noPlaceResults = true;
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
  .desktop {
    .content {
      padding: 8px 20px;
      display: grid;
      grid-template-rows: 45px 30px 35px 35px 30px 155px auto;
    }
    .content > * {
      margin-bottom: 10px;
    }
    .content input {
      width: 60%;
    }
    .input-info {
      font-size: smaller;
    }
    .char-count {
      color: orangered;
    }
    .geocoords, .place {
      height: 30px;
      line-height: 30px;
      width: 100%;
    }
    .place button {
      vertical-align: top;
    }
    .place svg {
      fill: #ed453b;
    }
    span.no-place {
      font-size: smaller;
      color: #999999;
    }
    span.has-place {
      display: inline-block;
      max-width: 340px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: text-bottom;
    }
    .search {
      margin-bottom: 0;
    }
    .search input {
      display: inline-block;
      width: 250px;
    }
    .map-info {
      float: right;
      font-size: smaller;
      color: #888;
      margin-top: 8px;
    }
    .content textarea {
      width: 100%;
      heigth: 100%;
      overflow: auto;
    }
    #noteNote {
      height: 100%;
    }
    .content > *:last-child {
      margin-bottom: 0;
    }
  }
  .mobile {

    .app-container.edit .name-edit {
      display: grid;
      grid-template-rows: 120px 40px 50px 60px 40px auto;
    }
    .app-container.new .name-edit {
      display: grid;
      grid-template-rows: 90px 40px 50px 60px 40px auto;
    }
    #noteName {
      font-size: 1.8rem;
    }
    .content {
      padding: 20px;
    }
    .content > * {
      margin-bottom: 10px;
    }
    .content input {
      width: 100%;
    }
    .char-count {
      color: darkgreen;
    }
    .char-count-close {
      color: orangered;
    }
    .geocoords, .place {
      height: 50px;
      line-height: 50px;
      width: 100%;
    }
    span.no-place {
      font-size: smaller;
      color: #999999;
    }
    span.has-place {
      display: inline-block;
      max-width: 340px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: text-bottom;
    }
    .place button {
      vertical-align: top;
    }
    .geocoords button {
      margin-top: 10px;
    }
    .place svg {
      fill: #ed453b;
    }
    .search {
      margin-bottom: 0;
    }
    .search input.map-search-input {
      display: inline-block;
      line-height: 1em;
      font-size: 1em;
      width: 250px;
      min-width: 250px;
    }
    .map-info {
      float: right;
      font-size: smaller;
      color: #888;
      margin-top: 8px;
    }
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