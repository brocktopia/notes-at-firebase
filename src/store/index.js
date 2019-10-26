import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '../firebase'
import notebooks from './modules/notebooks'
import notes from './modules/notes'
import user from './modules/user'
import photos from './modules/photos'
import ui from './modules/ui'

Vue.use(Vuex);

// store reference to firestore for data
Vuex.Store.prototype.$fbdb = firebase.firestore();
Vuex.Store.prototype.$fbstoreage = firebase.storage();

// store reference to local storage for data


// Create Store

export default new Vuex.Store({
  strict: true,
  modules: {
    notebooks,
    notes,
    user,
    photos,
    ui
  }
})
