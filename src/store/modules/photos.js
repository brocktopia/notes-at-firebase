import fbconfig from '@/firebase-config'

export default {

  namespaced: true,

  state: {
    all: [],
    activePhoto: {},
    activePhotos: [],
    notePhotoCount: 0 // TODO get this working for the Photos view
  },

  getters: {

    photoBaseUrl(state) {
      return `${location.protocol}//storage.googleapis.com/${fbconfig.storageBucket}/images/`;
    },

    photoUrl: (state) => (photo, size) => {
      //console.log(`store.getters.photos.photoUrl() ${size}`);
      const sizes = {thumb:'90px', medium:'600px', full:'1200px'};
      return `${location.protocol}//storage.googleapis.com/${fbconfig.storageBucket}/images/gcphoto-${photo.id}-${sizes[size]}.${photo.ext}`;
    },

    photoObject: (state, getters) => (id, ext) => {
      if (!id || !ext) return;
      //console.log(`store.getters.photos.photoObject() id [${id}] ext [${ext}]`);
      let photos = {id: id};
      photos.thumb = `${getters.photoBaseUrl}gcphoto-${id}-90px.${ext}`;
      photos.medium = `${getters.photoBaseUrl}gcphoto-${id}-600px.${ext}`;
      photos.full = `${getters.photoBaseUrl}gcphoto-${id}-1200px.${ext}`;
      return photos;
    },

    photosLoaded: (state) => (photo_ids) => {
      //console.log(`store.getters.photos.photoObject() compare [${photo_ids}] to activePhotos`);
      if (state.activePhotos.length === photo_ids.length) {
        const result = state.activePhotos.reduce((result, photo, index) => photo.id === photo_ids[index], true);
        return result
      } else {
        return false;
      }
    },

    photosSummary(state) {
      if (state.activePhotos.length > 0) {
        let sum = [];
        state.activePhotos.forEach(photo => {
          sum.push({
            id: photo.id,
            ext: photo.ext || 'jpg',
            name: photo.name || '',
            caption: photo.caption || ''
          })
        });
        return sum;
      }
    }
  },

  actions: {

    addPhotos({commit, state, getters}, {files, note_id}) {
      //files = Array.from(files);
      //console.log(`store.actions.photos.addPhotos() save [${files.length}] photos to note [${note_id}]`);
      // first load photo to storage
      const storageRef = this.$fbstoreage.ref();
      const fb = this.$fbdb.app.firebase_;
      let photoMetadata = [];
      let promises = files.map(file => {
        const fileRef = storageRef.child(file.name);
        return fileRef.put(file)
          .then((snapshot) => {
            photoMetadata.push(snapshot.metadata);
            // push data into photos
            return Promise.resolve(snapshot);
          })
      });
      return Promise.all(promises)
        .then((resp) => {
          // then save photo data to notes collection
          const photoRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(note_id).collection('photos');
          let docs = [];
          let promises = photoMetadata.map( meta => {
            // Add some upload data to the photo doc
            const photo_id = meta.generation;
            const ext = meta.name.slice(meta.name.lastIndexOf('.') + 1);
            let  photo = getters.photoObject(photo_id, ext);
            photo.Created_date = fb.firestore.Timestamp.now();
            photo.content_type = meta.contentType;
            photo.ext = ext;
            photo.name = meta.name;
            photo.note = note_id;
            return photoRef.doc(photo_id).set(photo)
              .then(() => {
                docs.push(photo);
                // push new photo into activePhotos
                return photoRef.doc(photo_id).get()
                  .then(photoSnapshot => {
                    commit('addActivePhoto', photoSnapshot.data());
                    return Promise.resolve(photoSnapshot.data());
                  })
              })
          });
          return Promise.all(promises)
            .then(resp => {
              // all photo docs are created and we're done
              return Promise.resolve(docs);
            })
        })
        .catch(err => {
          console.warn('store.actions.photos.addPhotos() ERROR');
          console.dir(err);
          throw({message:'Failed to create photos entry.'});
        })
    },

    getActivePhoto({state, commit}, {note_id, photo_id}) {
      //console.log(`store.actions.photos.getActivePhoto() id [${photo_id}]`);
      const photoRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(note_id).collection('photos').doc(photo_id);
      return photoRef.get()
        .then((docSnapshot) => {
          if (docSnapshot.exists) {
            commit('setActivePhoto', Object.assign({'id':docSnapshot.id}, docSnapshot.data() || {}));
            return Promise.resolve(state.activePhoto);
          } else {
            return Promise.reject('No photo reference returned');
          }
        })
        .catch(err => {
          console.warn('store.actions.photos.getActivePhoto() ERROR');
          console.dir(err);
          throw({message: `Failed to get photo by id [${photo_id}].`});
        })
    },

    checkMissingPhoto({state, commit}, {note_id, photo_id}) {
      //console.log(`store.actions.photos.checkMissingPhoto() note [${note_id}] photo [${photo_id}]`);
      const photoRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(note_id).collection('photos').doc(photo_id);
      return photoRef.get()
        .then((docSnapshot) => {
          Promise.resolve(docSnapshot.exists)
        })
        .catch(err => {throw(err)})
    },

    getNotePhotos({state, commit}, note_id) {
      //console.log(`store.actions.photos.getNotePhotos() note_id [${note_id}]`);
      const photoRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(note_id).collection('photos');
      let photos = [];
      photoRef.get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            photos.push(doc.data());
          });
          commit('setActivePhotos', photos);
        })
        .catch(err => {throw(err)})
    },

    updateActivePhoto({state, commit}, photo) {
      //console.log(`store.actions.photos.updateActivePhoto() note_id [${photo.id}]`);
      const photoRef = this.$fbdb.collection('users').doc(this.state.user.user.uid).collection('notes').doc(photo.note).collection('photos').doc(photo.id);
      return photoRef.set(photo)
        .then(() => {
          return photoRef.get()
            .then((docSnapshot) => {
              commit('updateActivePhoto', docSnapshot.data());
              return Promise.resolve(state.activePhoto);
            })
        })
        .catch(err => {throw(err)})
    },

    deleteActivePhoto({state, commit}) {
      //console.log(`store.actions.photos.deleteActivePhoto() photo_id [${state.activePhoto.id}]`);
      // create a file list
      const i = state.activePhoto.thumb.indexOf('/images/');
      const files = [
        state.activePhoto.thumb.slice(i),
        state.activePhoto.medium.slice(i),
        state.activePhoto.full.slice(i)
      ];
      // get storage and doc references
      const storageRef = this.$fbstoreage.ref();
      const photoRef = this.$fbdb.collection('users')
        .doc(this.state.user.user.uid)
        .collection('notes')
        .doc(state.activePhoto.note)
        .collection('photos')
        .doc(state.activePhoto.id);
      // first delete files from storage
      const proms = files.map(path => {
        const fileRef = storageRef.child(path);
        return fileRef.delete()
          .then(resp => {
            return Promise.resolve(resp);
          })
          .catch(err => {throw(err)})
      });
      return Promise.all(proms)
        .then(resp => {
          // delete photo document
          return photoRef.delete()
            .then(resp => {
              commit('deleteActivePhoto');
              return Promise.resolve(true);
            })
        })
        .catch(err => {throw(err)})
    },

    deletePhotos({state, commit}, querySnapshot) {
      //console.log(`store.actions.photos.deletePhotos() delete [${querySnapshot.size}] photos`);
      let deletes = [];
      querySnapshot.forEach(doc => {
        const photo = doc.data();
        const i = photo.thumb.indexOf('/images/');
        const storageRef = this.$fbstoreage.ref();
        const fileRefs = [
          storageRef.child(photo.thumb.slice(i)),
          storageRef.child(photo.medium.slice(i)),
          storageRef.child(photo.full.slice(i))
        ];
        fileRefs.forEach(ref => {
          deletes.push(ref.delete());
        });
        deletes.push(doc.ref.delete());
      });
      if (deletes.length === 0) {
        return Promise.resolve('no photos');
      } else {
        //console.log(`store.actions.photos.deletePhotos() ${deletes.length} photo refs to delete`);
        return Promise.all(deletes)
          .then(() => {
            return Promise.resolve(true);
          })
      }
    },

    clearActivePhotos({commit}) {
      //console.log('store.actions.notes.clearActivePhotos()');
      commit('setActivePhoto', {});
      commit('setActivePhotos', []);
      return Promise.resolve(true);
    },

  },

  mutations: {

    setActivePhoto(state, photo) {
      //console.log('store.mutations.photos.setActivePhoto()');
      state.activePhoto = photo;
    },

    setActivePhotoById(state, photo_id) {
      //console.log(`store.mutations.photos.setActivePhotoById() ${photo_id}`);
      const i = state.activePhotos.findIndex(p => p.id === photo_id);
      if (i > -1) {
        state.activePhoto = state.activePhotos[i];
      } else if (state.activePhotos.length === 0) {
        console.warn('store.mutations.photos.updateActiveNote() state.activePhotos is empty');
      } else {
        throw({message:'Could not find photo ['+photo_id+'] in activePhotos[]'})
      }
    },

    updateActivePhoto(state, photo) {
      //console.log('store.mutations.photos.updateActivePhoto()');
      state.activePhoto = photo;
      // update in notes array
      const i = state.activePhotos.findIndex(p => p.id == photo.id);
      if (i > -1) {
        state.activePhotos[i] = photo;
      } else if (state.activePhotos.length === 0) {
        console.warn('store.mutations.photos.updateActiveNote() state.activePhotos is empty');
      } else {
        throw({message:'Could not find photo ['+photo.id+'] in activePhotos[]'})
      }

    },

    setActivePhotos(state, photos) {
      //console.log('store.mutations.photos.setActivePhotos()');
      state.activePhotos = photos;
    },

    addActivePhoto(state, photo) {
      //console.log('store.mutations.photos.addActivePhoto()');
      state.activePhotos.push(photo);
    },

    deleteActivePhoto(state) {
      //console.log(`store.mutations.photos.deleteActivePhoto()`);
      let i = state.activePhotos.findIndex(photo => photo.id === state.activePhoto.id);
      if (i > -1) {
        state.activePhotos.splice(i, 1);
      } else {
        console.warn(`store.mutations.photos.deleteActivePhoto() photo id ${state.activePhoto.id} note found in [${state.activePhotos.length}] activePhotos`);
        console.dir(state.activePhotos);
      }
      state.activePhoto = {};
    }

  }

}
