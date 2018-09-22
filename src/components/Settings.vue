<template>
  <div class="app-container edit">

    <header>
      <h2>Settings</h2>
      <span class="button-bar">
        <button class="icon action-icon" @click="closeSettings()"><svg><use xlink:href="./dist/symbols.svg#close-note">
          <title>Close Settings</title>
        </use></svg></button>
      </span>
    </header>

    <div class="content settings-edit">
      <span class="app-version">v.{{$version}}</span>
      <h3>User Profile</h3>
      <div class="form-field">
        <label for="displayName">Display Name</label>
        <input type="text" id="displayName" v-model="user.displayName" placeholder="Display Name">
      </div>
      <div class="form-field">
        <label for="email">Email</label>
        <input type="text" id="email" v-model="user.email" placeholder="Email">
      </div>
      <div class="form-field">
        <svg :class="'verify-icon ' + (user.emailVerified ? 'verified' : 'unverified')"><use xlink:href="./dist/symbols.svg#verified-user">Verified User</use></svg>
        <span v-if="user.emailVerified">Your email address has been verified</span>
        <button class="single-large" v-if="!user.emailVerified" @click="verifyEmail">Verify Your Email</button>
      </div>
      <!--
      <div class="form-field">
        <label for="phone">Phone</label>
        <input type="tel" id="phone" v-model="user.phoneNumber" placeholder="Phone#">
      </div>
      -->
      <div class="form-field">
        <label for="photoURL">Photo URL</label>
        <input type="text" id="photoURL" v-model="user.photoURL" placeholder="Photo URL">
        <img v-if="!!user.photoURL" :src="user.photoURL" class="user-photo" width="50" height="50"/>
      </div>
      <button class="single-large" @click="updateProfile">Update Profile</button>

      <hr>
      <h3>Update Password</h3>
      <div class="form-field">
        <label for="currentPassword">Current Password</label>
        <input type="password" id="currentPassword" v-model="userPass.currentPassword" placeholder="Current Password">
      </div>
      <div class="form-field">
        <label for="newPassword">New Password</label>
        <input type="password" id="newPassword" v-model="userPass.newPassword" placeholder="New Password">
      </div>
      <div class="form-field">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" :class="passwordValid ? 'valid' : 'invalid'" id="confirmPassword" v-model="userPass.confirmPassword" placeholder="Confirm Password">
      </div>
      <button class="single-large" @click="updatePassword">Update Your Password</button>
      <p>Or if you can't remember your password reset it via email.</p>
      <button class="single-large" @click="resetPassword">Reset Your Password</button>

      <hr>
      <h3>Delete Account</h3>
      <button class="single-large" @click="deleteAccount">Delete Your Account</button>

    </div>

    <div class="navigation">
      <router-link :to="backPath">Back</router-link>
    </div>

    <modal-dialog
      v-if="showMessage"
      @close="showMessage = false">
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <account-delete-dialog
      v-if="showConfirmModal"
      @close="showConfirmModal = false"
    ></account-delete-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import ModalDialog from './ModalDialog'
  import AccountDeleteDialog from './AccountDeleteDialog'
  import firebase from 'firebase/app'

  var vm, backRoute;
  export default {

    components: {
      ModalDialog, AccountDeleteDialog
    },

    data() {
      return {
        isLoading: false,
        loadingMessage:'Saving Settings...',
        showMessage: false,
        messageClass: 'notify',
        messageTitle: '',
        messageBody: '',
        showConfirmModal: false,
        accountDeleteMessage: 'You can put some <b class="alert">HTML</b> in here!',
        backPath:'/',
        user:{},
        userPass:{
          currentPassword:'',
          newPassword:'',
          confirmPassword:''
        }
      }
    },

    computed: {
      userData() {
        return this.$store.state.user.user;
      },
      passwordValid() {
        return (this.userPass.newPassword.length > 5 && (this.userPass.newPassword === this.userPass.confirmPassword));
      },
      changes() {
        let changes = [];
        for (var item in vm.user) {
          if (vm.user[item] != vm.userData[item]) {
            changes.push(item);
          }
        }
        return changes;
      }
    },

    watch: {
      '$store.state.user.userAuthenticating': (val, oldVal) => {
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.initSettings();
        }
      }
    },

    beforeRouteEnter(toRoute, fromRoute, next) {
      if (fromRoute.name) {
        backRoute = fromRoute.fullPath;
      }
      next();
    },

    mounted() {
      //console.log('Settings.mounted()');
      vm = this;
      if (!vm.$store.state.user.userAuthenticating) {
        vm.initSettings();
      }
    },

    methods: {
      initSettings() {
        //console.log('Settings.initSettings()');
        vm.user = Object.assign({}, vm.userData);
        vm.backPath = backRoute || vm.backPath;
      },
      updateProfile() {
        //console.log('Settings.updateProfile()');
        if (vm.changes.length === 0) {
          // There have been no changes
        } else {
          let updates = [vm.updateUser];
          if (vm.changes.includes('displayName') || vm.changes.includes('photoURL')) {
            updates.push(vm.updateProfile);
          }
          if (vm.changes.includes('phoneNumber')) {
            updates.push(vm.updatePhone);
          }
          if (vm.changes.includes('email')) {
            updates.push(vm.updateEmail);
          }
          let method = updates.pop();
          // Look into Promise.all()
          method()
            .then(() => {
              if (updates.length > 0) {
                method = updates.pop();
                method()
                  .then(() => {
                    if (updates.length > 0) {
                      method = updates.pop();
                      method()
                        .then(() => {
                          if (updates.length > 0) {
                            method = updates.pop();
                            method()
                              .then(() => {
                                return true;
                              })
                              .catch(vm.handleError)
                          }
                        })
                        .catch(vm.handleError)
                    }
                  })
                  .catch(vm.handleError)
              }
            })
            .catch(vm.handleError)
        }
      },
      /* Phone number is only used as an auth alternative.
         Setting it up is possible but complicated.
         Don't see any real necessity for it at the moment.
      updatePhone() {
        //console.log('Settings.updatePhone()');
        vm.loadingMessage = 'Updating Phone Number...';
        vm.isLoading = true;
        return vm.$firebase.auth().currentUser.updatePhoneNumber(vm.user.phoneNumber)
          .then(() => {
            vm.isLoading = false;
          })
          .catch(vm.handleError)
      },
      */
      updateEmail() {
        //console.log('Settings.updateEmail()');
        vm.loadingMessage = 'Updating Email...';
        vm.isLoading = true;
        return vm.$firebase.auth().currentUser.updateProfile(vm.user.email)
          .then(() => {
            vm.isLoading = false;
          })
          .catch(vm.handleError)
      },
      updateUser() {
        //console.log('Settings.updateUser()');
        vm.loadingMessage = 'Updating...';
        vm.isLoading = true;
        return this.$store.dispatch('user/updateUser', vm.user)
          .then(() => {
            vm.isLoading = false;
          })
          .catch(vm.handleError)
      },
      verifyEmail() {
        //console.log('Settings.verifyEmail()');
        let config = {url: 'https://notes-at.firebaseapp.com/#/verified'};
        vm.loadingMessage = 'Sending Verification Email...';
        vm.isLoading = true;
        vm.$firebase.auth().currentUser.sendEmailVerification(config)
          .then(() => {
            vm.isLoading = false;
            vm.messageTitle = 'Verification Email Sent';
            vm.messageBody = 'Please check your email for the verification message and follow the instructions in the email.'
            vm.showMessage = true;
          })
          .catch(vm.handleError)
      },
      updatePassword() {
        //console.log('Settings.updatePassword()');
        if (!vm.passwordValid) {
          vm.messageTitle = 'Password Invalid';
          vm.messageBody = 'Your new password must be at least 6 characters and must match confirmation.';
          vm.showMessage = true;
          return;
        }
        vm.loadingMessage = 'Updating Password...';
        vm.isLoading = true;
        //console.log(`Settings.updatePassword() get credential with ${vm.user.email} ${vm.userPass.currentPassword}`)
        let credential = firebase.auth.EmailAuthProvider.credential(vm.user.email, vm.userPass.currentPassword);
        console.dir(credential);
        vm.$firebase.auth().currentUser.reauthenticateAndRetrieveDataWithCredential(credential)
          .then(() => {
            vm.$firebase.auth().currentUser.updatePassword(vm.userPass.newPassword)
              .then(() => {
                vm.isLoading = false;
                vm.messageTitle = 'Password Updated';
                vm.messageBody = 'Your password has successfully been reset';
                vm.showMessage = true;
                vm.userPass = {
                  currentPassword:'',
                  newPassword:'',
                  confirmPassword:''
                }
              })
          })
          .catch(vm.handleError)
      },
      resetPassword() {
        //console.log('Settings.resetPassword()');
        vm.loadingMessage = 'Sending Password Reset Email...';
        vm.isLoading = true;
        vm.$firebase.auth().sendPasswordResetEmail(vm.user.email)
          .then(() => {
            vm.isLoading = false;
            vm.messageTitle = 'Password Reset Email Sent';
            vm.messageBody = 'Please check your email for the password reset message and follow the instructions in the email.'
            vm.showMessage = true;
          })
      },
      deleteAccount() {
        //console.log('Settings.deleteAccount()');
        vm.showConfirmModal = true;
      },
      closeSettings() {
        //console.log('Settings.closeSettings()');
        vm.$router.back();
      },
      handleError(err) {
        console.warn('Settings.handleError()');
        console.dir(err);
        vm.isLoading = false;
        if (err.code ==='auth/wrong-password') {
          vm.messageTitle = 'Password Invalid';
          vm.messageBody = 'Your entry for Current Password was not valid';
          vm.showMessage = true;
        }
      }
    }
  }

</script>

<style scoped>
  .content {
    position: relative;
    padding: 20px;
  }
  .app-version {
    position: absolute;
    font-size: smaller;
    top: 10px;
    right: 10px;
  }
  .form-field {
    margin: 20px auto;
  }
  input {
    min-width: 300px;
    vertical-align: middle;
  }
  input.invalid {
    color: darkred;
  }
  input.valid {
    color: darkgreen;
  }
  label {
    display: inline-block;
    min-width: 170px;
    text-align: right;
  }
  svg.verify-icon {
    width: 40px;
    height: 40px;
    vertical-align: middle;
    margin-left: 130px;
  }
  svg.verified {
    fill: darkgreen;
  }
  svg.unverified {
    fill: darkred;
  }
  button.single-large {
    padding-left: 20px;
    padding-right: 20px;
  }
  .user-photo {
    vertical-align: middle;
    margin-left: 30px;
  }
  hr {
    width: 100%;
    color: #999;
    margin: 20px -20px 0;
    width: calc(100% + 40px)
  }
  b.alert {
    color: darkred;
  }
</style>