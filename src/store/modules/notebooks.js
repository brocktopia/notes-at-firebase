
export default {

  namespaced: true,

  state: {
    all:[],
    activeNotebook:{}
  },

  getters: {},

  actions: {

    load({commit, state}) {
      //console.log('store.actions.notebooks.getNotebooks()');
      // check to see if notebooks have been loaded already
      if(state.all.length > 0) {
        //console.log('store.actions.notebooks.getNotebooks() notebooks already loaded');
        return true;
      } else {
        let notebooksRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks');
        return notebooksRef.get()
          .then((QuerySnapshot) => {
            let notebooks = QuerySnapshot.docs.map(doc => Object.assign({'_id':doc.id}, doc.data()));
            commit('setNotebooks', notebooks);
          })
          .catch(err => {throw(err)})
      }
    },

    getNotebook({commit, state, dispatch}, id) {
      //console.log('store.actions.notebooks.getNotebook() ['+id+']');
      if (state.all.length === 0) {
        console.warn('store.actions.notebooks.getNotebook() no notebooks loaded yet');
        // notebooks haven't loaded yet
        return dispatch('load')
          .then(() => {
            return dispatch('getNotebook', id)
              .catch(err => {throw(err)})
          })
          .catch(err => {throw(err)})
      }
      let notebook = state.all.find(notebook => notebook._id == id);
      if (notebook) {
        commit('setNotebook', notebook);
      } else {
        throw({message: 'Did not find notebook ['+id+'] in all[]'});
      }
    },

    addNotebook({commit, state}, notebook) {
      //console.log('store.actions.notebooks.addNotebook()');
      let notebookRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks');
      return notebookRef.add(notebook)
        .then((doc) => {
          if (doc.id) {
            return doc.get()
              .then((docSnapshot) => {
                return commit('addNotebook', Object.assign({'_id':docSnapshot.id}, docSnapshot.data()));
              })

          }
        })
        .catch(err => {throw(err)})
    },

    updateNotebook({commit, state}, notebook) {
      //console.log('store.actions.notebooks.updateNotebook()');
      let notebookRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks').doc(notebook._id);
      return notebookRef.set(notebook)
        .then(() => {
          return notebookRef.get()
            .then((docSnapshot) => {
              return commit('updateNotebook', Object.assign({'_id':docSnapshot.id}, docSnapshot.data()))
            })
            .catch(err => {throw(err)})
        })
        .catch(err => {throw(err)})
    },

    delete({commit}, notebook_id) {
      //console.log('store.actions.notebooks.delete() ['+notebook_id+']');
      let notebookRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks').doc(notebook_id);
      return notebookRef.delete()
        .then((res) => {
          return commit('delete', notebook_id);
        })
        .catch(err => {throw(err)})
    },

    deleteAll({commit}) {
      //console.log('store.actions.notes.deleteAll()');
      let notebooksRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks');
      let deleteCount = 0;
      return notebooksRef.get()
        .then((snapshot) => {
          let deletes = [];
          snapshot.forEach((docSnapshot) => {
            deletes.push(docSnapshot.ref.delete()
              .then(() => {
                ++deleteCount;
              }));
          });
          return Promise.all(deletes)
            .then(() => {
              return commit('deleteAll');
            })
        })
    }
  },

  mutations: {
    setNotebooks(state, notebooks) {
      //console.log('store.mutations.notebooks.setNotebooks()');
      state.all = notebooks;
    },
    setNotebook(state, notebook) {
      //console.log('store.mutations.notebooks.setNotebook()');
      state.activeNotebook = notebook;
    },
    addNotebook(state, notebook) {
      //console.log('store.mutations.notebooks.addNotebook()');
      state.all.unshift(notebook);
    },
    updateNotebook(state, notebook) {
      //console.log('store.mutations.notebooks.addNotebook()');
      Object.assign(state.activeNotebook, notebook);
    },
    delete(state, notebook_id) {
      //console.log('store.mutations.notebooks.delete()');
      let i = state.all.findIndex(n => n._id == notebook_id);
      //console.log('store.mutations.notebooks.delete() note id ['+notebook_id+'] at index ['+i+']');
      if (i > -1) {
        state.all.splice(i, 1);
      } else {
        throw({message:'Could not find notebook by id ['+notebook_id+']'})
      }
    },
    deleteAll(state) {
      //console.log('store.mutations.notebooks.deleteAll()');
      state.notebookNotes = [];
      state.notes = [];
      state.notesCount = 0;
      state.activeNote = null;
    }
  }

}