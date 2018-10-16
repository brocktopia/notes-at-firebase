<template>
  <div class="app-container">

    <nav class="head">
      <h2>Sign In</h2>
    </nav>

    <div class="content">
      <img class="logo" src="../assets/logo.png" width="180" height="40" />
      <form @submit.prevent="signIn">
        <p class="msg">Sign into your accout.</p>
        <p class="error-msg" v-if="errors.length">
          <b>Please correct the following issue(s):</b>
          <ul>
            <li v-for="error in errors">{{ error }}</li>
          </ul>
        </p>
        <input type="email" v-model="email" placeholder="Email">
        <input type="password" v-model="password" placeholder="Password">
        <button class="single-large" type="submit">Sign In</button>
      </form>
    </div>

    <div class="navigation">
      <a @click="forgotPassword">Forgot Password?</a>
      <router-link class="action-link" to="/signup">Create a new account</router-link>
    </div>

    <reset-password-dialog
      v-if="showResetPassword"
      @close="showResetPassword = false"
    ></reset-password-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ResetPasswordDialog from './ResetPasswordDialog'

  let vm;
  export default {

    components: {
      ResetPasswordDialog
    },

    data() {
      return {
        email:'',
        password:'',
        confirmpass:'',
        errors:[],
        isLoading:false,
        loadingMessage:'Signing In...',
        showResetPassword:false
      }
    },
    mounted() {
      //console.log('Login.mounted()');
      vm = this;
    },
    methods: {
      signIn() {
        //console.log('Login.signIn()');
        vm.errors = [];
        let validEmail = RegExp(/^.+@.+\..+$/).test(vm.email);
        let validpassword = vm.password.length > 5;
        if (!validEmail) {
          vm.errors.push('Please enter a valid email.')
        }
        if (!validpassword){
          vm.errors.push('Please enter a valid password (at least 6 characters).')
        }
        if (vm.errors.length === 0) {
          vm.isLoading = true;
          vm.$firebase.auth().signInWithEmailAndPassword(vm.email, vm.password)
            .then((res) => {
              vm.isLoading = false;
              // Redirect is handled by the Auth listener in App.vue
            })
            .catch(vm.handleError)
        }
      },
      forgotPassword() {
        //console.log('Login.forgotPassword()');
        vm.showResetPassword = true;
      },
      handleError(err) {
        console.warn('SignUp.handleError()');
        console.dir(err);
        if (err.code === 'auth/wrong-password') {
          vm.errors.push('Invalid login/password combination. Please try again.')
        }
        if (err.code === 'auth/user-not-found') {
          vm.errors.push('Invalid login/password combination. Please try again.')
        }
        vm.isLoading = false;
      }
    }
  }
</script>

<style scoped>
  .content {
    padding: 20px;
  }
  .logo {
    display: block;
    margin: 30px auto;
  }
  li {
    display: block;
  }
  .error-msg {
    text-align: center;
    font-size: smaller;
  }
  .error-msg b {
    color: darkred;
  }
  .msg {
    width: 100%;
    text-align: center;
  }
  input {
    display: block;
    margin: 10px auto;
    min-width: 300px;
  }
  .single-large {
    display: block;
    margin: 30px auto;
    padding: 0.5rem 1.5rem;
  }
  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    input[type=email], input[type=password] {
      font-family: monospace;
      font-size: 1.8rem;
      line-height: 1.8rem;
      min-width: 80%;
    }
  }
</style>