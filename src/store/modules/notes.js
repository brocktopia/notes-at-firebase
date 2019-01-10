
export default {

  namespaced: true,

  state: {
    all:[],
    notebookNotes:[],
    activeNote:{},
    noteCount:NaN
  },

  getters: {
    findNotebookNote:(state) => (id) => {
      return state.notebookNotes.find(note => {return note._id === id})
    },
    activeNote:(state) => {
      //console.log('store.getters.notes.activeNote()');
      return state.activeNote
    },
    notebookNoteCount:(state) => {
      return state.notebookNotes.length
    }
  },

  actions: {

    /*
       Firestore uses id property but I wanted to maintain parity with other versions of the app
       so I'm creating a duplicate _id property in all data objects.
    */

    getNotes({commit}) {
      //console.log('store.actions.notes.getNotes()');
      let notesRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes');
      return notesRef.get()
        .then((QuerySnapshot) => {
          let notes = QuerySnapshot.docs.map(doc => Object.assign({'_id':doc.id}, doc.data()));
          commit('setNotes', notes);
        })
        .catch(err => {throw(err)})
    },

    getNote({commit}, id) {
      //console.log(`store.actions.notes.getNote() [${id}]`);
      let noteRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(id);
      return noteRef.get()
        .then((docSnapshot) => {
          if (docSnapshot.exists) {
            return commit('setActiveNote', Object.assign({'_id':docSnapshot.id}, docSnapshot.data()) || {});
          }
        })
        .catch(err => {throw(err)})
    },

    getNotebookNotes({state, commit, dispatch}, notebook_id) {
      //console.log('store.actions.notes.getNotebookNotes() notebook_id ['+notebook_id+']');
      // check to see if notes are already loaded
      if (state.notebookNotes.length > 0 && state.notebookNotes[0].notebook === notebook_id) {
        console.log(`store.actions.notes.getNotebookNotes() notes for ${notebook_id} already loaded`);
        return true;
      }
      let notesRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes');
      return notesRef
        .where('notebook', '==', notebook_id)
        .orderBy('Created_date', 'desc')
        .get()
        .then((QuerySnapshot) => {
          let notes = QuerySnapshot.docs.map(doc => Object.assign({'_id':doc.id}, doc.data()));
          commit('setNotebookNotes', notes);
        })
        .catch(err => {throw(err)})
    },

    getNoteCount({commit}) {
      //console.log('store.actions.notes.getNoteCount()');
      let notesRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes');
      return notesRef.get()
        .then((snapshot) => {
          return commit('setNoteCount', snapshot.size)
        })
    },

    setActiveNote({commit, state}, note_id) {
      //console.log('store.actions.notes.setActiveNote() note ['+note_id+']');
      let note = state.notebookNotes.find(n => n._id == note_id);
      //console.dir(note);
      if (note) {
        return commit('setActiveNote', note);
      } else {
        throw({message:'Failed to find note by id ['+note_id+'] to set it active.'})
      }
    },

    clearActiveNote({commit}) {
      //console.log('store.actions.notes.clearActiveNote()');
      return commit('setActiveNote', {});
    },

    createActiveNote({commit}, notebook_id) {
      //console.log('store.actions.notes.createActiveNote()');
      // Need a reference to firebase for static firestore methods
      // Firestore can take Javascript dates but for UI consistency I want to use firestore timestamp
      const fb = this.$fbdb.app.firebase_;
      let note = {
        'name':'',
        'Created_date': fb.firestore.Timestamp.now(),
        'geocode': {
          'latitude':0,
          'longitude':0
        },
        'note':'',
        'notebook': notebook_id
      };
      //console.dir(note);
      return commit('setActiveNote', note);
    },

    nextNote({commit, state}) {
      //console.log('store.actions.notes.nextNote()');
      let note,
        i = state.notebookNotes.findIndex(n => n._id === state.activeNote._id);
      if (!isNaN(i) && i != -1) {
        i++;
        if (state.notebookNotes[i]) {
          note = state.notebookNotes[i];
        } else {
          note = state.notebookNotes[0];
        }
        return commit('setActiveNote', note);
      } else {
        throw({message:'Could note find activeNote index.'});
      }
    },

    previousNote({commit, state}) {
      //console.log('store.actions.notes.previousNote()');
      let note,
        i = state.notebookNotes.findIndex(n => n._id === state.activeNote._id);
      if (!isNaN(i) && i != -1) {
        i--;
        if (i > -1) {
          note = state.notebookNotes[i];
        } else {
          note = state.notebookNotes[state.notebookNotes.length - 1];
        }
        return commit('setActiveNote', note);
      } else {
        throw({message:'Could note find activeNote index.'});
      }
    },

    saveActiveNote({commit, state}, note) { // Create new note
      //console.log('store.actions.notes.saveActiveNote()');
      let noteRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes');
      return noteRef.add(note)
        .then((doc) => {
          if (doc.id) {
            return doc.get()
              .then((docSnapshot) => {
                let noteData = Object.assign({'_id':docSnapshot.id}, docSnapshot.data());
                commit('addNotebookNote', noteData);
                return commit('updateActiveNote', noteData)
              })
              .catch(err => {throw(err)})
          }
        })
        .catch(err => {throw(err)})
    },

    updateActiveNote({commit, state}, note) { // Update existing note
      //console.log('store.actions.notes.updateActiveNote()');
      let noteRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(note._id);
      return noteRef.set(note)
        .then(() => {
          return noteRef.get()
            .then((docSnapshot) => {
              return commit('updateActiveNote', Object.assign({'_id':docSnapshot.id}, docSnapshot.data()))
            })
            .catch(err => {throw(err)})
        })
        .catch(err => {throw(err)})
    },

    delete({commit}, note_id) {
      //console.log('store.actions.notes.delete()');
      let noteRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(note_id);
      return noteRef.delete()
        .then(() => {
          return commit('delete', note_id);
        })
        .catch(err => {throw(err)})
    },

    deleteAll({commit}) {
      //console.log('store.actions.notes.deleteAll()');
      let notesRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes');
      let deleteCount = 0;
      return notesRef.get()
        .then((notesSnapshot) => {
          let deletes = [];
          notesSnapshot.forEach((docSnapshot) => {
            deletes.push(docSnapshot.ref.delete()
              .then(() => {
                ++deleteCount;
              }));
          });
          return Promise.all(deletes)
            .then(() => {
              //console.log(`store.actions.notes.deleteAll() ${deleteCount} notes deleted`);
              return commit('deleteAll');
            })
        })
    }
  },

  mutations: {
    setNotes(state, notes) {
      state.all = notes;
    },
    setActiveNote(state, note) {
      //console.log('store.mutations.notes.setActiveNote()');
      state.activeNote = note;
    },
    setNotebookNotes(state, notes) {
      //console.log('store.mutations.notes.setNotebookNotes()');
      //console.dir(notes);
      state.notebookNotes = notes;
    },
    addNotebookNote(state, note) {
      state.notebookNotes.unshift(note);
    },
    updateActiveNote(state, note) {
      //console.log('store.mutations.notes.updateActiveNote()');
      //console.dir(note);
      state.activeNote = note;
      // update in notes array
      let i = state.notebookNotes.findIndex(n => n._id == note._id);
      if (i > -1) {
        state.notebookNotes[i] = note;
      } else if (state.notebookNotes.length === 0) {
        console.warn('store.mutations.notes.updateActiveNote() state.notebookNotes is empty');
      } else {
        throw({message:'Could not find note ['+note._id+'] in notebookNotes[]'})
      }
    },
    setNoteCount(state, count) {
      state.noteCount = count;
      return count;
    },
    delete(state, note_id) {
      let i = state.notebookNotes.findIndex(n => n._id == note_id);
      //console.log('store.mutations.notes.delete() note id ['+note_id+'] at index ['+i+']');
      if (i > -1) {
        state.notebookNotes.splice(i, 1);
      } else {
        throw({message:'Could not find note by id ['+note_id+']'})
      }
    },
    deleteAll(state) {
      //console.log('store.mutations.notes.deleteAll()');
      state.notebookNotes = [];
      state.notes = [];
      state.notesCount = 0;
      state.activeNote = null;
    }

  }

}
