<template>
  <div class="modal-mask">

    <div class="modal-wrapper">

      <div class="modal-container">

        <div class="modal-header">
          <h3>Confirm Account Delete</h3>
          <button class="icon action-icon" @click="$emit('close')"><svg><use xlink:href="dist/symbols.svg#close-note">
            <title>Cancel</title>
          </use></svg></button>
        </div>

        <div class="modal-body" >
          <form @submit.prevent="deleteAccount">
            <p>Are you sure you want to delete your account? <span v-html="accountDeleteMessage"></span> This can not be undone.</p>
            <p>Please enter you sign-in credentials to confirm your account deletion.</p>
            <p class="error-msg" v-if="errors.length">
              <b>Please correct the following issue(s):</b>
            <ul>
              <li v-for="error in errors">{{ error }}</li>
            </ul>
            </p>
            <input type="email" v-model="email" placeholder="Email">
            <input type="password" v-model="password" placeholder="Password">
            <button class="single-large delete" type="submit">Delete Account</button>
          </form>
        </div>

        <div class="modal-footer">
          <button class="modal-optional-button" @click="$emit('close')">
            Cancel
          </button>
        </div>

      </div>

    </div>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import firebase from 'firebase/app'

  var vm;
  export default {

    data() {
      return {
        email:'',
        password:'',
        accountDeleteMessage:'',
        showConfirmModal:false,
        isLoading: false,
        loadingMessage:'Deleting Account...',
        errors:[]
      }
    },

    mounted: function() {
      console.log('AccountDeleteDialog.mounted()');
      vm = this;
      vm.$store.dispatch('notes/getNoteCount')
        .then((count) => {
          vm.accountDeleteMessage = `You have <b class="delete">${vm.$store.state.notes.noteCount}</b> notes that will be permanently deleted.`;
          vm.showConfirmModal = true;
        })
        .catch(vm.handleError)
    },

    methods: {

      deleteAccount() {
        console.log('AccountDeleteDialog.deleteAccount()');
        // delete notes, notebooks and then user docs before deleting auth account
        vm.errors = [];
        vm.isLoading = true;
        let credential = firebase.auth.EmailAuthProvider.credential(vm.email, vm.password);
        console.dir(credential);
        vm.$firebase.auth().currentUser.reauthenticateAndRetrieveDataWithCredential(credential)
          .then(() => {
            vm.$store.dispatch('notes/deleteAll')
              .then(() => {
                return vm.$store.dispatch('notebooks/deleteAll')
                  .then(() => {
                    return vm.$store.dispatch('user/deleteUser')
                      .then(() => {
                        vm.$firebase.auth().currentUser.delete()
                          .then(() => {
                            console.log('Settings.confirmDeleteAccount() user account deleted');
                            vm.isLoading = false;
                            // should log user out and push them to login
                          })
                          .catch(vm.handleError)
                      })
                      .catch(vm.handleError)
                  })
                  .catch(vm.handleError)
              })
              .catch(vm.handleError)
          })
          .catch(vm.handleError)
      },
      handleError(err) {
        console.warn('AccountDeleteDialog.handleError()');
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
  }
  .modal-header * {
    display: inline-block;
    line-height: 50px;
  }
  .action-icon {
    float: right;
    vertical-align: middle;
  }
  .error-msg {
    text-align: center;
    font-size: smaller;
  }
  .error-msg b {
    color: darkred;
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
  .delete {
    background-color: darkred;
  }
</style>
