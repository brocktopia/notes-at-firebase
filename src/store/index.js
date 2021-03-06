import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '../firebase'
import notebooks from './modules/notebooks'
import notes from './modules/notes'
import user from './modules/user'

Vue.use(Vuex);

// store reference to firestore for data
Vuex.Store.prototype.$fbdb = firebase.firestore();

// Create Store

export default new Vuex.Store({
  strict: true,
  modules: {
    notebooks,
    notes,
    user
  }
})