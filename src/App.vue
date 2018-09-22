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
        loadingMessage:'Authenticating...'
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
      db.settings({
        timestampsInSnapshots: true
      })
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
