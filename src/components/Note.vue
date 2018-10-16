<template>
  <div class="app-container">

    <header>
      <h2>{{note.name}}</h2>
      <span class="button-bar">
        <button class="icon delete-note" @click="deleteNote()"><svg><use xlink:href="./dist/symbols.svg#delete-note">
          <title>Delete Note</title>
        </use></svg></button>
        <button class="desktop-only icon edit-note" @click="editNote()"><svg><use xlink:href="./dist/symbols.svg#edit-note">
          <title>Edit Note</title>
        </use></svg></button>
        <button class="mobile-only icon edit-note" @click="editNoteMobile()"><svg><use xlink:href="./dist/symbols.svg#edit-note">
          <title>Edit Note</title>
        </use></svg></button>
        <button v-if="showNoteMap" class="icon show-note" @click="showNote()"><svg><use xlink:href="./dist/symbols.svg#note">
          <title>Show Note</title>
        </use></svg></button>
        <button v-if="showNoteMap === false" class="icon show-map" @click="showMap()"><svg><use xlink:href="./dist/symbols.svg#map">
          <title>Show Map</title>
        </use></svg></button>
        <button class="icon close-note" @click="closeNote()"><svg><use xlink:href="./dist/symbols.svg#close-note">
          <title>Close Note</title>
        </use></svg></button>
      </span>
    </header>

    <div v-if="!showNoteMap" class="content">

      <div class="date">{{note.Created_date ? $moment(note.Created_date.toDate()).format('LLLL') : ''}}</div>

      <div class="geocoords" v-if="!!note.place && !!note.place.name">
        <img :src="note.place.icon" class="icon-tiny" />
        <span id="placeName">{{note.place.name}}</span>
        <a :href="note.place.url" target="_blank" style="display: inline-block; vertical-align: middle;">
          <svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#launch"></use></svg>
        </a>
      </div>

      <div class="geocoords" v-if="!!note.geocode">
        <a @click="showMap()" class="geocords-link">
          <svg class="icon-tiny" style="vertical-align: text-bottom;"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
          {{note.geocode.latitude +', '+note.geocode.longitude}}
        </a>
      </div>
      <p class="note">{{note.note}}</p>
    </div>

    <gmap-map
      v-if="showNoteMap"
      class="content"
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
            <img :src="note.place.icon" width="24" height="24"/>
            <span>{{note.place.name}}</span>
            <a :href="note.place.url" target="_blank">
              <svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#launch"></use></svg>
            </a>
          </div>
          <p style="max-width: 300px; max-height: 280px; overflow-y: auto; white-space: pre-wrap;">{{note.note}}</p>
        </div>
      </gmap-info-window>
      <gmap-marker
        ref="myMarker"
        :position="notePosition"
        @click="toggleInfoWindow"
      ></gmap-marker>
    </gmap-map>

    <div class="navigation">
      <a @click="closeNote()" class="back2notebook">Back to Notebook</a>
      <a v-if="notebookNoteCount > 1" style="float:right;" @click="nextNote()">Next &gt;</a>
      <a v-if="notebookNoteCount > 1" style="float:right;" @click="previousNote()">&lt; Previous</a>
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

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from './ModalDialog'
  import {gmapApi, GmapMap} from 'vue2-google-maps'
  import { mapGetters } from 'vuex'

  var vm,
   closeRoute;
  export default {

    components: {
      ModalDialog
    },

    computed: {
      google: gmapApi,
      geoLat: function () {
        return vm.note.geocode.latitude || 0;
      },
      geoLon: function () {
        return vm.note.geocode.longitude || 0;
      },
      note: function() {
        return this.$store.state.notes.activeNote;
      },
      notePosition: function() {
        return vm.note.geocode ? {
          lat: vm.note.geocode.latitude,
          lng: vm.note.geocode.longitude
        } : null;
      },
      hasPlace: function() {
        return (vm.note.place && vm.note.place._id);
      },
      // Setup getters from store
      ...mapGetters('notes', ['activeNote','notebookNoteCount'])
    },

    data() {
      return {
        showConfirmModal: false,
        isLoading: false,
        loadingMessage:'Loading...',
        showNoteMap:false,
        closeRoute:'', // this param helps get the app back to notebook in the map view state
        infoOptions: {
          pixelOffset: {
            width: 0,
            height: -35
          }
        },
        infoWinOpen: false,
      }
    },

    watch: {
      $route(toRoute, fromRoute) {
        //console.log('Note.watch.$route() toRoute [' + toRoute.name + '] fromRoute [' + fromRoute.name + '] path [' + toRoute.path + ']');
        if (toRoute.name === 'note-map') { // show map
          vm.showNoteMap = true;
        } else if (toRoute.name === 'note') { // hide map
          vm.showNoteMap = false;
        } else {
          console.warn('Note.$route() Unhandled route [' + toRoute.path + ']');
        }
      },
      '$store.state.user.userAuthenticating': (val, oldVal) => {
        //console.log(`Note.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.initNote();
        }
      }
    },

    beforeRouteEnter(toRoute, fromRoute, next) {
      if (!closeRoute && fromRoute.name) {
        if (!fromRoute.name.includes('note-') && fromRoute.name != 'note') {
          closeRoute = fromRoute.fullPath;
        }
      } else if (fromRoute.name && fromRoute.name.includes('notebook')) {
        closeRoute = fromRoute.fullPath;
      }
      next();
    },

    mounted() {
      //console.log(`Note.mounted() closeRoute [${closeRoute}]`);
      vm = this;
      if (!vm.$store.state.user.userAuthenticating) {
        vm.initNote();
      }
    },

    methods: {
      initNote() {
        //console.log('Note.initNote()');
        vm.isLoading = true;
        if (!closeRoute) { // Note must be deep-linked
          //console.log('Note.mounted() deeplinked');
          vm.$store.dispatch('notes/getNote', vm.$route.params.note_id)
            .then(() => {
              vm.isLoading = false;
              if (vm.$route.name === 'note-map') {
                vm.showNoteMap = true;
              }
              closeRoute = '/notebook/' + vm.note.notebook;
              // load notebook notes for next/previous navigation
              vm.$store.dispatch('notes/getNotebookNotes', vm.note.notebook)
                .then(() => {
                  // Notebook notes have loaded
                })
                .catch(vm.handleError);
            })
            .catch(vm.handleError);
        } else {
          if (vm.$route.name === 'note-map') {
            vm.showNoteMap = true;
          }
          vm.isLoading = false;
        }
      },
      editNote() {
        //console.log('Note.editNote()');
        vm.$router.push('/note-edit/' + vm.note._id);
      },
      editNoteMobile() {
        //console.log('Note.editNoteMobile()');
        vm.$router.push('/note-edit-mobile/' + vm.note._id);
      },
      closeNote() {
        //console.log(`Note.closeNote() [${closeRoute}]`);
        vm.$router.push(closeRoute);
      },
      nextNote() {
        //console.log('Note.nextNote()');
        vm.$store.dispatch('notes/nextNote')
          .then(function() {
            vm.$router.push('/note/' + vm.note._id + (vm.showNoteMap ? '/map/' : ''));
          })
          .catch(vm.handleError)
      },
      previousNote() {
        //console.log('Note.previousNote()');
        vm.$store.dispatch('notes/previousNote')
          .then(function() {
            vm.$router.push('/note/' + vm.note._id + (vm.showNoteMap ? '/map/' : ''));
          })
          .catch(vm.handleError)
      },
      deleteNote() {
        //console.log('Note.deleteNote()');
        vm.showConfirmModal = true;
      },
      cancelDelete() {
        //console.log('Note.cancelDelete()');
        vm.showConfirmModal = false;
      },
      confirmDelete() {
        //console.log('Note.confirmDelete()');
        vm.loadingMessage = 'Removing Note...';
        vm.isLoading = true;
        let notebook_id = vm.note.notebook;
        vm.$store.dispatch('notes/delete', vm.note._id)
          .then(function () {
            vm.$router.push('/notebook/' + notebook_id);
            vm.isLoading = false;
          })
          .catch(vm.handleError);
      },
      showMap() {
        //console.log('Note.showMap() lat ['+vm.geoLat+'] lng ['+vm.geoLon+']');
        vm.$router.push('/note/'+vm.note._id+'/map');
      },
      showNote() {
        //console.log('Note.showNote()');
        vm.$router.push('/note/'+vm.note._id);
      },
      toggleInfoWindow: function(marker) {
        //console.log('Note.toggleInfoWindow()');
        vm.infoWinOpen = !vm.infoWinOpen;
      },
      handleError(err) {
        console.warn('Note.handleError()');
        console.dir(err);
      }
    }

  }
</script>

<style scoped>
  .content {
    padding: 20px;
  }
  .content > div {
    margin: 10px 0;
  }
  .geocoords img {
    vertical-align: middle;
  }
  .note {
    white-space: pre-wrap;
  }
  a svg {
    fill: #42b983;
  }
  .navigation a {
    display: inline-block;
  }
  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    .note-info {
      font-size: 1rem;
    }
  }
</style>