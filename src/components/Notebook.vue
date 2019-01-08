<template>
  <div class="app-container">

    <nav class="head">
      <h2>Notebook</h2>
      <span class="button-bar">
        <button class="icon delete-notebook" @click="deleteNotebook()">
          <svg><use xlink:href="dist/symbols.svg#delete-note"><title>Delete Notebook</title></use></svg>
        </button>
        <button class="icon edit-notebook" @click="editNotebook()"><svg><use xlink:href="dist/symbols.svg#edit-note"><title>Edit Notebook</title></use></svg></button>
        <button class="icon show-map" v-if="activeView === 'list'" @click="showMap()"><svg><use xlink:href="dist/symbols.svg#map"><title>Show Map</title></use></svg></button>
        <button class="icon show-list" v-if="activeView !== 'list'" @click="closeNotebookMap()"><svg><use xlink:href="dist/symbols.svg#list"><title>Show Note List</title></use></svg></button>
        <button class="desktop-only icon add-note" @click="addNote('desktop')"><svg><use xlink:href="dist/symbols.svg#add-note"><title>Add New Note</title></use></svg></button>
        <button class="mobile-only icon" @click="addNoteMobile()"><svg><use xlink:href="dist/symbols.svg#add-note"><title>Add New Note</title></use></svg></button>
      </span>
    </nav>

    <div v-if="activeView === 'list'" class="content">

      <header class="main">
        <h2>{{notebook.name}}</h2>
      </header>

      <ul v-if="notes.length > 0" class="notebook">

        <li
          v-for="note in notes"
          :key="note._id"
          class="note-item"
          @click="noteSelect(note)"
        >
          <span class="title">{{note.name}}</span><br/>
          <span class="date">{{note.Created_date ? $moment(note.Created_date.toDate()).format('ddd l h:mm:ss a') : ''}}</span>
          <span v-if="!note.place || !note.place.name" class="geocoords">
            <svg class="icon-tiny location-icon"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
            {{(note.geocode.latitude ? note.geocode.latitude.toFixed(5) : 'Unknown') + ', ' + (note.geocode.longitude ? note.geocode.longitude.toFixed(5) : 'Unknown')}}
          </span>
          <span v-if="note.place && note.place.name" class="place">
            <svg class="icon-tiny place-icon"><use xlink:href="dist/symbols.svg#place"></use></svg>
            {{note.place.name}}
          </span>
          <br clear="all"/>
          <span class="note">{{(note.note && note.note.length > 84) ? note.note.substr(0,84) + '...' : note.note}}</span>
        </li>

      </ul>
      <div v-if="notes.length === 0" class="notebook-message">No notes in this notebook.</div>
    </div>

    <keep-alive>
      <!-- keep-alive only works when toggling the view inside the Notebook view.
           Navigating to a Note view and back will reset the map position        -->
      <notebook-map
        v-if="activeView === 'map'"
        :name="notebook.name"
        :notes="notes"
        v-on:close="closeNotebookMap"
        v-on:edit="editNotebook"
        v-on:delete="deleteNotebook"
        v-on:addNote="addNote"
        v-on:addNoteMobile="addNoteMobile"
        v-on:select="noteSelect"
      ></notebook-map>
    </keep-alive>

    <div class="navigation">
      <router-link to="/">Home</router-link>
      &gt;
      <router-link class="notebooks-link" to="/notebooks">Notebooks</router-link>
    </div>

    <edit-notebook-dialog
      v-if="showEditNotebook"
      @close="showEditNotebook = false"
      :mode="'edit'"
      :notebookSource="notebook"
      v-on:save="saveNotebook"
    ></edit-notebook-dialog>

    <modal-dialog
      v-if="showConfirmModal"
      @close="showConfirmModal = false"
    >
      <h3 class="warn" slot="header">Confirm Notebook Delete</h3>
      <div slot="body">Are you sure you want to delete this notebook? <span v-html="notebookDeleteMsg"></span> This can not be undone.</div>
      <div slot="footer">
        <button class="modal-optional-button" @click="cancelDelete()">
          Cancel
        </button>
        <button class="modal-default-button" @click="confirmDelete()">
          Confirm
        </button>
      </div>
    </modal-dialog>

    <modal-dialog v-if="showMessage" @close="showMessage = false">
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from './ModalDialog'
  import EditNotebookDialog from './EditNotebookDialog'
  import NotebookMap from './NotebookMap'
  import { mapGetters } from 'vuex'

  var vm;
  export default {

    components: {
      ModalDialog, EditNotebookDialog, NotebookMap
    },

    data: function () {
      return {
        notebookRouteExtra: '', // currently only used to hold reference to 'map' when user navigates down into notes
        showMessage: false,
        messageClass: 'notify',
        messageTitle: '',
        messageBody: '',
        noteEditMode: '', // edit | new
        showConfirmModal: false,
        showEditNotebook: false,
        isLoading: false,
        loadingMessage: 'Loading...' // mutable based on async task
      }
    },

    computed: {

      notebookDeleteMsg: function () { // Present note count to user on notebook delete
        let notes = vm.notes;
        return (notes.length > 0 ? '<b style="color:darkred;">All ' + (notes.length > 2 ? notes.length : '') + ' notes</b> in this notebook will be deleted. ' : '')
      },

      // Could create getters for these but leaving it to illustrate it as possibility
      notebook: function () {
        return this.$store.state.notebooks.activeNotebook
      },

      notes: function () {
        return this.$store.state.notes.notebookNotes
      },

      activeView() {
        return this.$store.state.notebooks.activeNotebookView;
      },

      // Setup getters from store
      ...mapGetters('notes', ['findNotebookNote', 'activeNote'])
    },

    watch: {

      $route(toRoute, fromRoute) {
        //console.log('Notebook.$route() toRoute [' + toRoute.name + '] fromRoute [' + fromRoute.name + '] path [' + toRoute.path + ']');
        if (toRoute.name === 'notebook') { // notebook home
          vm.$store.dispatch('notes/clearActiveNote')
            .catch(vm.handleError);
          //vm.notebookRouteExtra = '';
          //vm.activeView = 'notebook';
          vm.$store.commit('notebooks/setNotebookView', 'list');
        }
        else if (toRoute.name === 'notebook-map') { // notebook map
          //vm.notebookRouteExtra = '/map';
          //vm.activeView = 'map';
          vm.$store.commit('notebooks/setNotebookView', 'map');
        }
        else {
          console.warn('Notebook.$route() Unhandled route [' + toRoute.path + ']');
          //console.dir(toRoute);
        }
      },

      '$store.state.user.userAuthenticating': (val, oldVal) => {
        //console.log(`Notebook.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.getNotebook();
        }
      }

    },

    mounted() {
      //console.log('Notebook.mounted()');
      vm = this;
      if (!vm.$store.state.user.userAuthenticating) {
        vm.getNotebook();
      }
    },

    methods: {

      getNotebook() {
        //console.log(`Notebook.getNotebook()`);
        vm.isLoading = true;
        // Make sure notebooks are loaded in case of deep-linking
        vm.$store.dispatch('notebooks/load')
          .then(() => {
            // Get Notebook
            vm.$store.dispatch('notebooks/getNotebook', vm.$route.params.notebook_id)
              .then(() => {

                // Get Notebook Notes
                vm.$store.dispatch('notes/getNotebookNotes', vm.$route.params.notebook_id)
                  .then(() => {

                    // Check route info to see determine display mode
                    if (vm.$route.name === 'notebook-map') {
                      // Notebook Map
                      //vm.notebookRouteExtra = '/map';
                      //vm.activeView = 'map';
                      vm.$store.commit('notebooks/setNotebookView', 'map');
                    } else if (vm.activeView === 'map') {
                      // update route to reflect view state
                      vm.$router.replace(`/notebook/${vm.notebook._id}/map`);
                    }

                    // Finished
                    vm.isLoading = false;
                  })
              })
          })
          .catch(vm.handleError);
      },

      // Utility methods
      setActiveNote(note_id) {
        if (!vm.activeNote || vm.activeNote._id != note_id) {
          //console.log('Notebook.setActiveNote() for ' + note_id);
          vm.$store.dispatch('notes/setActiveNote', note_id)
            .catch(vm.handleError);
        }
        // Wasn't async before--probably need to remove this functionality or make it promise-based
        return true;
      },

      // Note interactions
      noteSelect(note) {
        //console.log('Notebook.noteSelect() '+note._id);
        vm.$store.dispatch('notes/setActiveNote', note._id)
          .then(function() {
            vm.$router.push('/note/' + note._id);
          })
          .catch(vm.handleError);


      },

      /* These methods were deprecated when component was decomposed but I may want to add
         edit functionality into the note list at some point
      editNote: function () {
        //console.log('Notebook.editNote()');
        vm.$router.push('/note-edit/' + vm.activeNote._id);
      },
      editNoteMobile: function () {
        //console.log('Notebook.editNoteMobile()');
        vm.$router.push('/note-edit-mobile/' + vm.activeNote._id);
      },
      */

      addNote() {
        //console.log('Notebook.addNote()');
        vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id)
          .then(function() {
            vm.$router.push('/note-new/' + vm.notebook._id);
          })
          .catch(vm.handleError)
      },

      addNoteMobile() {
        //console.log('Notebook.addNoteMobile()');
        vm.$store.dispatch('notes/createActiveNote', vm.$route.params.notebook_id)
          .then(function() {
            vm.$router.push('/note-new-mobile/' + vm.notebook._id);
          })
          .catch(vm.handleError)
      },

      // Notebook methods
      showMap() {
        //console.log('Notebook.showMap()');
        vm.$router.push('/notebook/' + vm.notebook._id + '/map');
      },

      closeNotebookMap: function () {
        //console.log('Notebook.closeNotebookMap()');
        vm.$router.push('/notebook/' + vm.notebook._id);
      },

      editNotebook() {
        //console.log('Notebook.editNotebook()');
        vm.showEditNotebook = true;
      },

      saveNotebook(notebook) {
        //console.log('Notebook.saveNotebook()');
        vm.loadingMessage = 'Saving...';
        vm.isLoading = true;
        // this method currently not needing to create new notebook
        vm.$store.dispatch('notebooks/updateNotebook', notebook)
          .then(function () {
            vm.isLoading = false;
            vm.showEditNotebook = false;
          })
          .catch(vm.handleError);
      },

      deleteNotebook() {
        //console.log('Notebook.deleteNotebook()');
        vm.showConfirmModal = true;
      },

      cancelDelete() {
        //console.log('Notebook.cancelDelete()');
        vm.showConfirmModal = false;
      },

      confirmDelete() {
        //console.log('Notebook.confirmDelete()');
        vm.loadingMessage = 'Removing Notebook...';
        vm.isLoading = true;
        vm.$store.dispatch('notebooks/delete', vm.notebook._id)
          .then(function() {
            vm.showConfirmModal = false;
            vm.isLoading = false;
            vm.$router.replace('/notebooks');
          })
          .catch(vm.handleError);
      },

      handleError(err) {
        console.warn('Notebook.handleError()');
        console.dir(err);
        vm.isLoading = false;
        vm.messageClass = 'warn';
        if (err.message === 'Network Error') {
          vm.messageTitle = 'Network Error';
          vm.messageBody = 'There was a problem connecting to application services. Please try again. If the problem persist, please contact support.';
        } else if (err.message.indexOf('validation failed') != -1) {
          // show user message
          let msg = err.message,
            title = msg.substr(0, msg.indexOf(':')),
            msgBody = msg.slice(msg.indexOf(':') + 2);
          vm.messageTitle = title;
          vm.messageBody = '';
          if (msgBody.indexOf(',')) {
            msgBody.split(',').forEach(part => {
              vm.messageBody += part.slice(part.indexOf(':') + 2) + '<br/>';
            });
          } else {
            vm.messageBody += msgBody.slice(msgBody.indexOf(':') + 2);
          }
        } else {
          vm.messageTitle = 'Unknown Error';
          vm.messageBody = 'There was an unknown problem. Please try again. If the problem persist, please contact support.';
        }
        vm.showMessage = true;
      }

    }
  }
</script>

<style scoped>
  ul {
    margin: 0;
    height: calc(100% - 40px);
    overflow: auto;
  }
  ul.notebook li {
    margin: 0;
    list-style: none;
    width: 100%;
    background-color: #ffffff;
    border-top: 1px solid #cccccc;
    border-bottom: 1px solid #999999;
    padding: 10px 20px;
    text-align: left;
    cursor: pointer;
  }
  ul.notebook li span {
    display: inline-block;
  }
  .notebook-message {
    margin: 20px;
  }
  .date, .note {
    font-size: smaller;
  }
  .title {
    margin-bottom: 8px;
  }
  .note {
    margin-top: 8px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .geocoords, .place {
    float: right;
    font-size: smaller;
    width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .geocoords {
    color: #4e7eef;
  }
  .location-icon {
    fill: #4e7eef;
  }
  .place {
    color: #666;
  }
  .place-icon {
    fill: #ed453b;
  }
  /* Mobile fixes */
  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    ul.notebook{
      height: calc(100% - 50px);
    }
  }
</style>
