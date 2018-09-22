import Vue from 'vue'
import App from './App'
import router from './router'
import firebase from './firebase'
import moment from 'moment'
import * as VueGoogleMaps from 'vue2-google-maps'
import googleConfig from './google-maps-config'
import store from './store'
import './css/style.scss'
import './assets/svg/symbols.svg'

Vue.config.productionTip = false;

Vue.prototype.$firebase = firebase;

Vue.prototype.$moment = moment;

Vue.prototype.$version = '1.0.0';

// Moved map config to external file to reduce chances of committing secret key
Vue.use(VueGoogleMaps, {
  load: googleConfig
});

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
});
