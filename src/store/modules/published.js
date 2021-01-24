export default {

    namespaced: true,

    state: {
        activePublication: {},
        publications: [],
        activePublishedNotes: [],
        activePublishedNote: null,
        activePublishedView: 'list', // list | map | full,
        activePublishedScrollPosition: 0,
        activePublishedSort: 'latest' // latest | first
    },

    getters: {

    },

    actions: {

        load({ commit, state, dispatch }) {
            console.log('store.published.actions.load()');
            // check to see if notebooks have been loaded already
            if (state.publications.length > 0) {
                return true;
            } else {
                let notebooksRef = this.$fbdb.collection('published');
                return dispatch('getPublications');
            }
        },

        getPublications({ commit, state }) {
            console.log(`store.published.actions.getPublications()`);
            let publicationsRef = this.$fbdb.collection('published');
            publicationsRef
                .orderBy('Created_date', 'desc')
                .get()
                    .then((QuerySnapshot) => {
                        let publications = QuerySnapshot.docs.map(doc => Object.assign({ '_id': doc.id }, doc.data()));
                        commit('setPublications', publications);
                    })
                    .catch(err => {
                        console.warn('store.actions.published.getPublications() ERROR');
                        console.dir(err);
                        throw ({ message: `Failed to get publications.` });
                    });
        },

        getPublication({ commit, state, dispatch }, id) {
            console.log(`store.published.actions.getPublication() ${id}`);
            let publicationRef = this.$fbdb.collection('published').doc(id);
            publicationRef.get()
                .then((docSnapshot) => {
                    if (docSnapshot.exists) {
                        commit('setActivePublication', Object.assign({ 'id': docSnapshot.id }, docSnapshot.data() || {}));
                        return Promise.resolve(state.activePublication);
                    } else {
                        return Promise.reject('No publication reference returned');
                    }
                })
                .catch(err => {
                    console.warn('store.actions.published.getPublication() ERROR');
                    console.dir(err);
                    throw ({ message: `Failed to get publication by id [${id}].` });
                    return Promise.reject(`Error getting publication [${id}]`);
                });
        }, 

        getPublicationNotes({ commit, state, dispatch }, id) {
            console.log(`store.published.actions.getPublicationNotes() ${id}`);

            if (state.activePublishedNotes.length > 0 && state.activePublishedNotes[0].notebook === id) {
                console.log(`store.published.notes.getPublicationNotes() notes for ${id} already loaded`);
                return true;
            }
            let notesRef = this.$fbdb.collection('published').doc(id).collection('notes');
            return notesRef
                .orderBy('Created_date', 'desc')
                .get()
                .then((QuerySnapshot) => {
                    console.log(`store.published.notes.getPublicationNotes() ${QuerySnapshot.docs.length} notes loaded`);
                    let notes = QuerySnapshot.docs.map(doc => Object.assign({ '_id': doc.id }, doc.data()));
                    dispatch("notes/setPublishdedNotes", notes, {root:true});
                    commit('setActivePublishedNotes', notes, id);
                })
                .catch(err => { throw (err) })
        }, 

        createPublication({ commit, state, rootState }, notebook) {
            console.log(`store.published.actions.createPublication()`);
            const fb = this.$fbdb.app.firebase_;
            let publication = {
                'name': notebook.publishName,
                'Created_date': fb.firestore.Timestamp.now(),
                'last_published_date': fb.firestore.Timestamp.now()
            };
            let publishedRef = this.$fbdb.collection('published');
            console.log(`store.published.actions.createPublication() add ${publication.name}`);
            publishedRef.add(publication)
                .then((doc) => {
                    if (doc.id) {
                        console.log(`store.published.actions.createPublication() published item created ${doc.id}`);
                        return doc.get()
                            .then((docSnapshot) => {
                                commit('setActivePublication', Object.assign({ 'id': docSnapshot.id }, docSnapshot.data() || {}));
                                publishedRef = this.$fbdb.collection('published').doc(docSnapshot.id);
                                let notesRef = this.$fbdb.collection('published').doc(docSnapshot.id).collection('notes');
                                // add active notes to publication
                                let adds = rootState.notes.notebookNotes.map(note => notesRef.add(note));
                                return Promise.all(adds)
                                    .then(() => {
                                        return Promise.resolve(state.publication);
                                    })
                                    .catch(err => { throw (err) });
                            })
                            .catch(err => { throw (err) });
                    }
                    else {
                        console.log(`store.published.actions.createPublication() Failed to add ${publication.name}`);
                        return Promise.reject(`Failed to add item to published ref`);
                    }
                })
                .catch(err => { throw (err) });
        }, 

        updatePublication({ commit, state, rootState }, notebook) {
            console.log(`store.published.actions.updatePublication()`);
            let publishedRef = this.$fbdb.collection('published').doc(notebook.publishedId);
            // first remove all items
            return publishedRef.get()
                .then((docSnapshot) => {
                    commit('setActivePublication', Object.assign({ 'id': docSnapshot.id }, docSnapshot.data() || {}));
                    let deletes = docSnapshot.map(doc => doc.delete());
                    return Promise.all(deletes)
                        .then(() => {
                            // add active notes to publication
                            let adds = rootState.notes.notebookNotes.map(note => publishedRef.add(note));
                            return Promise.all(adds)
                                .then(() => {
                                    return Promise.resolve(state.publication);
                                })
                                .catch(err => { throw (err) }); 
                        })
                        .catch(err => { throw (err) });
                })
                .catch(err => { throw (err) });
        },

        setActivePublishedNote({commit, state}, note_id) {
            console.log(`store.published.actions.setActivePublishedNote() ${note_id}`);
            let note = state.activePublishedNotes.find(n => n._id == note_id);
            console.dir(note);
            if (note) {
                return commit('setActiveNote', note);
            } else {
                throw ({ message: 'Failed to find note by id [' + note_id + '] to set it active.' })
            }
        },

        clearActiveNote({commit}) {
            console.log(`store.published.actions.clearActiveNote()`);
            commit('clearActiveNote');
        },

    },

    mutations: {
        setPublications(state, obj) {
            state.publications = obj;
        },
        setActivePublication(state, obj) {
            console.log(`store.published.mutations.setActivePublication()`);
            console.dir(obj);
            state.activePublication = obj;
        },
        setActivePublishedNotes(state, obj, published_id) {
            console.log(`store.published.mutations.setActivePublishedNotes()`);
            // temporarily assign notes a published_id
            let notes = obj.map(n => Object.assign({"published_id": published_id}, n));
            console.dir(notes);
            state.activePublishedNotes = notes;
        },
        setPublishedView(state, mode = 'list') { // default to list
            console.log(`store.mutations.published.setPublishedView() mode [${mode}]`);
            state.activePublishedView = mode;
        },
        setActiveNote(state, obj) {
            console.log(`store.published.mutations.setActiveNote() ${obj._id}`);
            state.activePublishedNote = obj;
        },
        clearActiveNote(state) {
            console.log(`store.published.mutations.clearActiveNote()`);
            state.activePublishedNote = null;
        },
        setScrollPosition(state, position) {
            console.log(`store.published.mutations.setScrollPosition() position [${position}]`);
            state.activePublishedScrollPosition = position;
        },

        sortPublishedNotes(state, sort) {
            console.log(`store.published.mutations.sortPublishedNotes() sort [${sort}]`);
            let sortFunction;
            if (sort === 'first') {
                sortFunction = (n1, n2) => {
                    return (n1.Created_date.seconds > n2.Created_date.seconds) ? 1 : -1;
                }
            } else if (sort === 'latest') {
                sortFunction = (n1, n2) => {
                    return (n1.Created_date.seconds < n2.Created_date.seconds) ? 1 : -1;
                }
            } else {
                console.warn(`store.published.mutations.sortPublishedNotes() No handler for sort [${sort}]`);
                return;
            }
            state.activePublishedNotes.sort(sortFunction);
            state.activePublishedSort = sort;
        }

    }

}
