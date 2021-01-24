<template>
  <div class="app-container">

    <nav class="head">
      <h2>Explore - Notebook</h2>
      <span class="button-bar">
        
      </span>
    </nav>

    <div class="content">

      <header class="main">
        <h2>{{notebook.name}}</h2>
        <menu-button
          menu-align="br"
          theme="dark"
          :items="noteMenuItems"
          :selected="noteMenuState"
          @select="onNoteMenuSelect"
        ></menu-button>
      </header>

      <div v-if="activeView === 'list'" class="notebook-body">
        <ul v-if="notes.length > 0" class="notebook">

          <note-list-item
            v-for="note in notes"
            :key="note._id"
            class="note-item"
            @select="noteSelect"
            @mapselect="noteMapSelect"
            @photoselect="notePhotoSelect"
            :note="note"
          ></note-list-item>

        </ul>

        <div v-if="notes.length === 0" class="notebook-message">No notes in this notebook.</div>
      </div>

      <div v-if="activeView === 'full'" class="notebook-body">

          <note-full-item
            v-for="note in notes"
            :key="note._id"
            @select="noteSelect"
            @mapselect="noteMapSelect"
            @photoselect="notePhotoSelect"
            :note="note"
          ></note-full-item>

        <div v-if="notes.length === 0" class="notebook-message">No notes in this notebook.</div>
      </div>

      <div v-if="activeView === 'map'" class="notebook-body">
        <keep-alive>
          <!-- keep-alive only works when toggling the view inside the Notebook view.
               Navigating to a Note view and back will reset the map position        -->
          <notebook-map
            v-if="activeView === 'map'"
            :notes="notes"
            @select="noteSelect"
          ></notebook-map>
        </keep-alive>
      </div>

    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
      &gt;
      <router-link class="notebooks-link" to="/explore">Explore</router-link>
    </div>

    <modal-dialog v-if="showMessage" @close="showMessage = false">
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from '@/components/ModalDialog'
  import NotebookMap from '@/components/NotebookMap'
  import NoteListItem from '@/components/NoteListItem'
  import NoteFullItem from '@/components/NoteFullItem'
  import MenuButton from '@/components/MenuButton'
  import { mapGetters } from 'vuex'

  let vm;
  export default {

    components: {
      ModalDialog, NotebookMap, NoteListItem, MenuButton, NoteFullItem
    },

    data() {
      return {
        notebookRouteExtra: '', // currently only used to hold reference to 'map' when user navigates down into notes
        showMessage: false,
        messageClass: 'notify',
        messageTitle: '',
        messageBody: '',
        isLoading: false,
        loadingMessage: 'Loading...', // mutable based on async task
        noteMenuItems: [
          {label:'Show Note List', value:'show-list'},
          {label:'Show Note Map', value:'show-map'},
          {label:'Show Full Notes', value:'show-full'},
          {label:'Sort by Latest', value:'sort-latest', isNew:true},
          {label:'Sort by Earliest', value:'sort-first'}
        ]
      }
    },

    computed: {

      // Could create getters for these but leaving it to illustrate it as possibility
      notebook: function () {
        return this.$store.state.published.activePublication
      },

      notes: function () {
        return this.$store.state.published.activePublishedNotes
      },

      activeView() {
        return this.$store.state.published.activePublishedView;
      },

      scrollPosition() {
        return this.$store.state.published.activePublishedScrollPosition;
      },

      noteMenuState() {
        return ['show-' + this.$store.state.published.activePublishedView, 'sort-' + this.$store.state.published.activePublishedSort];
      },

      // Setup getters from store
      ...mapGetters('notes', ['findNotebookNote', 'activeNote'])
    },

    watch: {

      $route(toRoute, fromRoute) {
        //console.log('Published.$route() toRoute [' + toRoute.name + '] fromRoute [' + fromRoute.name + '] path [' + toRoute.path + ']');
        if (toRoute.name === 'notebook-list') { // notebook home
          vm.$store.commit('published/setPublishedView', 'list');
        }
        else if (toRoute.name === 'notebook-map') { // notebook map
          vm.$store.commit('published/setPublishedView', 'map');
        }
        else if (toRoute.name === 'notebook-full') { // notebook full
          vm.$store.commit('published/setPublishedView', 'full');
        }
        else {
          console.warn('Published.$route() Unhandled route [' + toRoute.path + ']');
          //console.dir(toRoute);
          return;
        }
        vm.$store.dispatch('published/clearActiveNote')
          .catch(vm.handleError);
      },

      '$store.state.user.userAuthenticating': (val, oldVal) => {
        //console.log(`Published.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.getNotebook();
        }
      }

    },

    mounted() {
      //console.log('Published.mounted()');
      vm = this;
      if (!this.$store.state.user.userAuthenticating) {
        this.getNotebook();
        // clear any active note or photo data
        this.$store.dispatch('published/clearActiveNote')
          .catch(this.handleError);
        this.$store.dispatch('photos/clearActivePhotos')
          .catch(this.handleError);
      }
    },

    methods: {

      getNotebook() {
        //console.log(`Published.getNotebook() scrollPosition [${vm.scrollPosition}]`);
        vm.isLoading = true;
        // Make sure notebooks are loaded in case of deep-linking
        vm.$store.dispatch('published/load')
          .then(() => {
            // Get Notebook
            vm.$store.dispatch('published/getPublication', vm.$route.params.publish_id)
              .then(() => {

                // Get Notebook Notes
                vm.$store.dispatch('published/getPublicationNotes', vm.$route.params.publish_id)
                  .then(() => {
                    console.log(`Published.getNotebook() load [${this.notes.length}] notes in view [${this.activeView}]`);
                    /* Check route info to see determine display mode
                    if (vm.$route.name === 'notebook-map') {
                      // Notebook Map
                      vm.$store.commit('notebooks/setNotebookView', 'map');
                    } else if (vm.activeView === 'map') {
                      // update route to reflect view state
                      vm.$router.replace(`/notebook/${vm.notebook._id}/map`);
                    } else if (vm.$route.name === 'notebook-full') {
                      // Full note view
                      vm.$store.commit('notebooks/setNotebookView', 'full');
                    } else if (vm.activeView === 'full') {
                      vm.$router.replace(`/notebook/${vm.notebook._id}/full`);
                    }
                    */

                    // check scroll state
                    if (vm.scrollPosition > 0) {
                      //console.log(`Published.mounted() set scroll position to [${vm.scrollPosition}]`);
                      const body = this.$el.querySelector('.notebook-body');
                      if (body) {
                        body.scrollTop = vm.scrollPosition;
                      }
                    }

                    // Finished
                    vm.isLoading = false;
                  })
                    // Finished
                    vm.isLoading = false;
              })
          })
          .catch(vm.handleError);
      },

      // Utility methods
      setActiveNote(note_id) {
        if (!vm.activeNote || vm.activeNote._id != note_id) {
          console.log('Published.setActiveNote() for ' + note_id);
          vm.$store.dispatch('published/setActivePublishedNote', note_id)
            .catch(vm.handleError);
        }
        // Wasn't async before--probably need to remove this functionality or make it promise-based
        return true;
      },

      recordScrollPosition(clearPosition) {
        console.log('Published.recordScrollPosition()');
        const body = this.$el.querySelector('.notebook-body');
        if (body) {
          console.log(`Published.noteSelect() scrollTop [${body.scrollTop}]`);
          const position = clearPosition ? 0 : body.scrollTop;
          vm.$store.commit('published/setScrollPosition', position);
        }
      },

      // Note interactions
      noteSelect(note) {
        console.log('Published.noteSelect() '+note._id);
        vm.recordScrollPosition();
        vm.$store.dispatch('published/setActivePublishedNote', note._id)
          .then(function() {
            vm.$router.push('/published/note/' + note._id);
          })
          .catch(vm.handleError);
      },

      noteMapSelect(note) {
        console.log('Published.noteMapSelect() '+note._id);
        vm.recordScrollPosition();
        vm.$store.dispatch('published/setActivePublishedNote', note._id)
          .then(function() {
            vm.$router.push('/published/note/' + note._id + '/map');
          })
          .catch(vm.handleError);
      },

      notePhotoSelect(data) {
        //console.log(`Published.notePhotoSelect() note [${ data.note_id}] photo [${data.photo_id}]`);
        vm.recordScrollPosition();
        vm.$store.dispatch('published/setActivePublishedNote', data.note_id)
          .then(() => {
            vm.$store.dispatch('photos/getActivePhoto', data)
              .then(() => {
                vm.$router.push('/published/note/' + data.note_id + '/photo/' + data.photo_id);
              })
          })
          .catch(vm.handleError);
      },

      // Notebook methods
      onNoteMenuSelect(item) {
        //console.log(`Published.onNoteMenuSelect() ${item}`);
        let val;
        if (item.startsWith('show')) {
          val = item.slice(5);
          vm.$router.push('/published/' + this.notebook.id + '/' + val);
        } else if (item.startsWith('sort')) {
          val = item.slice(5);
          vm.$store.commit('published/sortNotebookNotes', val);
        }
      },

      handleError(err) {
        console.warn('Published.handleError()');
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

<style lang="scss" scoped>
  ul {
    margin: 0;
    .note-item {
      border-top: 1px solid #cccccc;
      border-bottom: 1px solid #999999;
    }
  }
  div.notebook-body {
    position: relative;
    height: calc(100% - 50px);
    padding: 0;
    margin: 0;
    overflow: auto;
  }
  header.main {
    position: relative;
    z-index: 999;
    .menu-button {
      position: absolute;
      top: 0px;
      right: 0px;
      height: 50px;
      width: 50px;
    }
  }
  .notebook-message {
    margin: 20px;
  }
  /* Mobile fixes */
  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    ul.notebook{
      height: calc(100% - 50px);
    }
  }
</style>
