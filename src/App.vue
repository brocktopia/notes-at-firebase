<template>
  <div id="app">
    <router-view></router-view>
    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>
  </div>
</template>

<script>
  var vm;
  export default {

    name: 'app',

    data() {
      return {
        isLoading:false,
        loadingMessage:'Authenticating...',
        isDevMode: true
      }
    },

    mounted() {
      //console.log('App.mounted()');
      vm = this;
      // listen for auth state changes (triggers automatic login of active users that didn't logout)
      this.$firebase.auth().onAuthStateChanged((user) => {
        vm.isLoading = true;
        if (!!user) {
          if (!this.$store.state.user.userLoggedIn) {
            // update store with user data
            this.$store.dispatch('user/loginUser', user)
              .then(() => {
                if (this.$route.path === '/login' || this.$route.path === '/signup') {
                  this.$router.push('/');
                }
                vm.isLoading = false;
              })
          } else {
            // what changed (if anything)
            vm.isLoading = false;
          }
        } else {
          // User logged out
          this.$store.dispatch('user/setUserStatus', false)
            .then(() => {
              if (this.$route.meta.requiresLogin) {
                this.$router.push('/login');
              }
              vm.isLoading = false;
            })
            .catch(vm.handleError)
        }
      });
      // initialize firestore-disable depricated features
      let db = vm.$firebase.firestore();
      // Register ServiceWorks
      if ('serviceWorker' in navigator && !this.isDevMode) {
        //console.log(`App.mounted() Let's register some service workers!`);
        navigator.serviceWorker.register('serviceworkers.js', { scope: './' })
          .then(function(swRegistration) {
            //console.log(`App.mounted() service workers registration`);
            let sw;

            if(swRegistration.installing) {
              // Service worker installing
              sw = swRegistration.installing;
            } else if(swRegistration.waiting) {
              // Service worker installed and waiting--skipWaiting
              sw = swRegistration.waiting;
            } else if(swRegistration.active) {
              // Service worker active
              sw = swRegistration.active;
            }

            //console.log(`App.mounted() service worker`);
            //console.dir(sw);

          }).catch(function(error) {
          // registration failed
          console.warn('Service worker registration failed with ' + error);
        });
      }
    },

    methods: {
      handleError(err) {
        console.warn('App.handleError()');
        console.dir(err);
        vm.isLoading = false;
      }
    }
  }
</script>
