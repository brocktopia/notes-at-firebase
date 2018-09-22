<template>
  <div class="modal-mask">

    <div class="modal-wrapper">

      <div class="modal-container">

        <button class="icon close-icon" @click="$emit('close')"><svg><use xlink:href="./dist/symbols.svg#close-note">
          <title>Cancel</title>
        </use></svg></button>

        <div class="modal-header">
          <h3>Reset Account Password</h3>
        </div>

        <div class="modal-body" >
          <form v-if="!success" @submit.prevent="resetPassoword">
            <p>Enter your account email to get a reset email sent to you and follow the instructions in the email.</p>
            <p class="error-msg" v-if="errors.length">
              <b>Please correct the following issue(s):</b>
              <ul>
                <li v-for="error in errors">{{ error }}</li>
              </ul>
            </p>
            <input type="email" v-model="email" placeholder="Account Email">
          </form>
          <p v-if="success">A email has been sent to you that will allow you to reset the password for your account.</p>
        </div>

        <div class="modal-footer">
          <button class="modal-optional-button" @click="$emit('close')">
            {{success ? 'Close' : 'Cancel'}}
          </button>
          <button v-if="!success" class="modal-default-button" @click="resetPassword">Reset Password</button>
        </div>

      </div>

    </div>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>

  var vm;
  export default {

    data() {
      return {
        email:'',
        isLoading: false,
        loadingMessage:'Sending Reset Email...',
        errors:[],
        success: false
      }
    },

    mounted: function() {
      console.log('ResetPasswordDialog.mounted()');
      vm = this;
    },

    methods: {
      resetPassword() {
        console.warn('ResetPasswordDialog.resetPassword()');
        let valid = RegExp(/^.+@.+\..+$/).test(vm.email);
        vm.errors = [];
        if (vm.email && valid) {
          vm.isLoading = true;
          vm.$firebase.auth().sendPasswordResetEmail(vm.email)
            .then(() => {
              vm.isLoading = false;
              vm.success = true;
            })
        } else {
          vm.errors.push('You must enter a valid email address.')
        }
      },
      handleError(err) {
        console.warn('ResetPasswordDialog.handleError()');
        console.dir(err);
        vm.isLoading = false;
        if (err.code ==='auth/wrong-password') {
          vm.errors.push('Your password Current Password you entered was not valid');
        }
      }
    }
  };
</script>

<style scoped>
  .modal-mask .modal-container {
    width: 450px;
    position: relative;
  }
  .close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  .modal-header * {
    display: inline-block;
    line-height: 50px;
  }
  .action-icon {
    float: right;
    vertical-align: middle;
  }
  input {
    display: block;
    margin: 10px auto;
    min-width: 200px;
  }
  .single-large {
    display: block;
    margin: 30px auto;
    padding: 0.5rem 1.5rem;
  }
</style>