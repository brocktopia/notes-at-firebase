
export default {

  namespaced: true,

  state: {
    all:[],
    activeNotebook:{},
    activeNotebookView: 'list', // list | map | full,
    activeNotebookScrollPosition: 0,
    activeNotebookSort: 'latest' // latest | first
  },

  getters: {},

  actions: {

    /*
       Firestore uses id property but I wanted to maintain parity with other versions of the app
       so I'm creating a duplicate _id property in all data objects.
    */

    load({commit, state}) {
      //console.log('store.actions.notebooks.getNotebooks()');
      // check to see if notebooks have been loaded already
      if(state.all.length > 0) {
        return true;
      } else {
        let notebooksRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks');
        return notebooksRef
          .orderBy('Created_date', 'desc')
          .get()
          .then((QuerySnapshot) => {
            let notebooks = QuerySnapshot.docs.map(doc => Object.assign({'_id':doc.id}, doc.data()));
            commit('setNotebooks', notebooks);
          })
          .catch(err => {throw(err)})
      }
    },

    getNotebook({commit, state, dispatch}, id) {
      //console.log('store.actions.notebooks.getNotebook() ['+id+']');
      // make sure there are notebooks loaded
      if (state.all.length === 0) {
        console.warn('store.actions.notebooks.getNotebook() no notebooks loaded yet');
        // notebooks haven't loaded yet
        return dispatch('load')
          .then(() => {
            return dispatch('getNotebook', id)
              .catch(err => {throw(err)})
          })
          .catch(err => {throw(err)})
      } else if (state.activeNotebook._id === id) { // check to see if notebook is already active
        return true;
      }
      // clear any active scroll position state
      commit('setScrollPosition', 0);
      // find notebook
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

    publishNotebook({commit, state}, notebook) {
      console.log('store.actions.notebooks.publishNotebook()');
      let notebookRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notebooks').doc(notebook._id);
      return notebookRef.set(notebook)
        .then(() => {
          return notebookRef.get()
            .then((docSnapshot) => {
              return commit('updateNotebook', Object.assign({'_id':docSnapshot.id}, docSnapshot.data()))
            })
            .catch(err => {throw(err)})
            // Create or update publication
            
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
      state.all = [];
      state.activeNotebook = null;
      state.activeNotebookScrollPosition = 0;
    },

    setNotebookView(state, mode = 'list') { // default to list
      //console.log(`store.mutations.notebooks.setNotebookView() mode [${mode}]`);
      state.activeNotebookView = mode;
    },

    sortNotebooks(state, sort) {
      //console.log(`store.mutations.notebooks.sortNotebooks() sort [${sort}]`);
      let sortFunction;
      if (sort === 'first') {
        sortFunction = (nb1, nb2) => {
          return (nb1.Created_date.seconds > nb2.Created_date.seconds) ? 1 : -1;
        }
      } else if (sort === 'latest') {
        sortFunction = (nb1, nb2) => {
          return (nb1.Created_date.seconds < nb2.Created_date.seconds) ? 1 : -1;
        }
      } else {
        console.warn(`store.mutations.notebooks.sortNotebooks() No handler for sort [${sort}]`);
        return;
      }
      state.all.sort(sortFunction);
      state.activeNotebookSort = sort;
    },

    setScrollPosition(state, position) {
      //console.log(`store.mutations.notebooks.setScrollPosition() position [${position}]`);
      state.activeNotebookScrollPosition = position;
    }

  }

}
