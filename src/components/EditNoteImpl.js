import PlacesDialog from './PlacesDialog'
import ModalDialog from './ModalDialog'
import {GmapMap, GmapMarker} from 'vue2-google-maps'
import { mapGetters } from 'vuex'

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

    // Setup getters from store
    ...mapGetters('notes', ['activeNote','notebookNoteCount'])
  },

  watch: {
    '$store.state.user.userAuthenticating': (val, oldVal) => {
      //console.log(`EditNoteImpl.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
      if (!val && !!vm.$store.state.user.user.uid) {
        vm.initNote();
      }
    }
  },

  beforeRouteEnter(toRoute, fromRoute, next) {
    //console.log('EditNoteImpl.beforeRouteEnter()');
    if (fromRoute.name) {
      closeRoute = fromRoute.fullPath;
    }
    next();
  },

  mounted() {
    //console.log(`EditNoteImpl.mounted()`);
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
    vm.$refs.NoteMap.$mapPromise.then((map) => {
      vm.placesService = new vm.google.maps.places.PlacesService(map);
    });
  },

  methods:{

    initNote() {
      //console.log(`EditNoteImpl.initNote()`);
      // Check route to determine if note is new
      if (vm.$route.name === 'note-new' || vm.$route.name === 'note-new-mobile') {
        vm.mode = 'new'
      } else {
        vm.mode = 'edit'
      }
      //console.log(`EditNoteImpl.initNote() mode: ${vm.mode}`);
      // Check for deep-linking
      if (vm.mode === 'new') {
        if (!vm.activeNote.notebook) { // Deep-linked note-new
          //console.log(`EditNoteImpl.initNote() new note deep-linked`);
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
          //console.log(`EditNoteImpl.initNote() deep-linked note_id [${vm.$route.params.note_id}]`);
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
          Object.assign(vm.note, vm.activeNote);
          vm.isLoading = false;
        }
      } else {
        console.warn('EditNoteImpl.initNote() Unable to determine context for initialization');
      }
      // get location if this is a new note
      if (vm.mode === 'new') {
        vm.updateCoordinates(false);
      }
    },

    updateCoordinates(userAction) {
      //console.log(`EditNoteImpl.updateCoordinates() userAction: ${userAction}`);
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
          console.warn(`EditNoteImpl.updateCoordinates() ERROR(${err.code}): ${err.message}`);
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
      //console.log(`EditNoteImpl.saveNote()`);
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
      //console.log(`EditNoteImpl.closeNote() closeRoute [${closeRoute}]`);
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
      //console.log(`EditNoteImpl.findPlace()`);
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
      //console.log(`EditNoteImpl.moreSelected()`);
      if (vm.pagination) {
        vm.pagination.nextPage();
      }
    },

    mapMarkerMoved(marker) {
      //console.log(`EditNoteImpl.mapMarkerMoved()`);
      let latlonObj = {
        latitude:  Number(marker.latLng.lat().toFixed(7)),
        longitude: Number(marker.latLng.lng().toFixed(7))
      };
      vm.note.geocode = latlonObj;
      // clear any loaded places
      vm.places = [];
    },

    placesClose() {
      //console.log(`EditNoteImpl.placesClose()`);
      vm.showPlacesDialog = false;
    },

    placeSelected(place) {
      //console.log(`EditNoteImpl.placeSelected()`);
      let options = {
        placeId: place.place_id,
        fields:['name', 'url']
      };
      vm.placesService.getDetails(options, (placeDetail, status) => {
        //console.log(`EditNoteImpl.placeSelected() place details [${status}]`);
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
          console.warn(`EditNoteImpl.placeSelected() Error [${status}] getting Place details`);
        }
      });
    },

    placeInputUpdated(name) {
      //console.log(`EditNoteImpl.placeInputUpdated() ${name}`);
      // clear current results
      vm.placeName = name;
      vm.places = [];
      vm.findPlace();
    },

    clearPlace() {
      //console.log(`EditNoteImpl.clearPlace()`);
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
