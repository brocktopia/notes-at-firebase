<template>
  <div class="app-container">

    <nav class="head">
      <h2>Create Account</h2>
    </nav>

    <div class="content">
      <img class="logo" src="../assets/logo.png" width="180" height="40" />
      <form @submit.prevent="createAccount">
        <p class="msg">Sign up for a new accout.</p>
        <p class="error-msg" v-if="errors.length">
          <b>Please correct the following issue(s):</b>
          <ul>
            <li v-for="error in errors">{{ error }}</li>
          </ul>
        </p>
        <input type="email" :class="validemail ? 'confirm' : 'invalid'" v-model="email" placeholder="Email" @input="testEmail(email)">
        <input type="password" :class="validpassword ? 'confirm' : 'invalid'" v-model="password" placeholder="Password" @input="testPassword(password)">
        <input type="password" :class="confirmed ? 'confirm' : 'invalid'" v-model="confirmpass" placeholder="Confirm Password" @input="confirmPassword(confirmpass)">
        </span>
        <p class="pw-instruct">
          (6 character minimum)
          The best passwords have:<br/>
          At least 8 characters <span v-if="has8char"><svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#check"><title>Check!</title></use></svg></span><br/>
          Lowercase character <span v-if="hasLowerCase"><svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#check"><title>Check!</title></use></svg></span><br/>
          Uppercase character <span v-if="hasUpperCase"><svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#check"><title>Check!</title></use></svg></span><br/>
          Number character <span v-if="hasNumber"><svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#check"><title>Check!</title></use></svg></span><br/>
          Symbol character <span v-if="hasSymbol"><svg class="icon-tiny"><use xlink:href="./dist/symbols.svg#check"><title>Check!</title></use></svg></span>
        </p>
        <button class="single-large" type="submit">Create Account</button>
      </form>
    </div>

    <div class="navigation">
      <router-link to="/login">Sign In to your account</router-link>
    </div>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  var vm;
  module.exports = {
    data() {
      return {
        email:'',
        password:'',
        validemail:false,
        validpassword:false,
        confirmpass:'',
        confirmed:false,
        errors:[],
        has8char:false,
        hasLowerCase:false,
        hasUpperCase:false,
        hasNumber:false,
        hasSymbol:false,
        isLoading:false,
        loadingMessage:'Creating Account...'
      }
    },
    mounted() {
      //console.log(`SignUp.mounted()`);
      vm = this;
    },
    methods: {
      createAccount() {
        //console.log(`SignUp.createAccount()`);
        vm.errors = [];
        if (!vm.validemail) {
          vm.errors.push('Please enter a valid email.')
        }
        if (!vm.validpassword){
          vm.errors.push('Please enter a valid password (at least 6 characters).')
        }
        if (!vm.confirmed){
          vm.errors.push('Your passwords do not match.).')
        }
        if (vm.errors.length === 0) {
          // Create new user account
          vm.isLoading = true;
          vm.$firebase.auth().createUserWithEmailAndPassword(vm.email, vm.password)
            .then((user) => {
              // Redirect is handled by the Auth listener in App.vue
            })
            .catch(vm.handleError)
        }
      },
      testEmail(email) {
        vm.validemail = RegExp(/^.+@.+\..+$/).test(email);
      },
      testPassword(pw) {
        vm.has8char = pw.length > 7;
        vm.hasLowerCase = RegExp(/[a-z]/g).test(pw);
        vm.hasUpperCase = RegExp(/[A-Z]/g).test(pw);
        vm.hasNumber = RegExp(/[0-9]/g).test(pw);
        vm.hasSymbol = RegExp(/\W|_/g).test(pw);
        // firebase requires at least 6 characters
        vm.validpassword = pw.length > 5;
        // make sure user doesn't trick confirm
        vm.confirmed = (pw === vm.confirmpass);
      },
      confirmPassword(pw) {
        vm.confirmed = (pw === vm.password);
      },
      handleError(err) {
        console.warn('SignUp.handleError()');
        console.dir(err);
        if (err.code === 'auth/email-already-in-use') {
          vm.errors.push(`The email address (${vm.email}) is already in use by another account.`);
          vm.errors.push(`Go to Sign In to use that email or retrieve your password.`);
        }
        vm.isLoading = false;
      }
    }
  }
</script>

<style scoped>
  svg {
    fill: darkgreen;
  }
  .content {
    padding: 20px;
  }
  .logo {
    display: block;
    margin: 30px auto;
  }
  .msg {
    text-align: center;
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
  .pw-instruct {
    width: 30%;
    font-size: smaller;
    line-height: 1.5rem;
    margin: 0 auto;
  }
  input {
    display: block;
    margin: 10px auto;
    min-width: 300px;
  }
  input.invalid {
    color: darkorange;
  }
  input.confirm {
    color: darkgreen;
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
      border-top: 1px solid #999;
    }
    .pw-instruct {
      width: 80%;
    }
  }
</style>