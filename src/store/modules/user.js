export default {

  namespaced: true,

  state: {
    user: {},
    userAuthenticating: true,
    userLoggedIn: false
  },

  actions: {

    loginUser({commit, dispatch}, user) {
      //console.log('store.actions.user.loginUser()');
      let userRef = this.$fbdb.collection('users').doc(user.uid);
      // create a user data object to store in db and check against auth user data
      let userData = {
        'displayName':user.displayName,
        'email':user.email,
        'emailVerified':user.emailVerified,
        'phoneNumber':user.phoneNumber,
        'photoURL':user.photoURL,
        'refreshToken':user.refreshToken,
        'uid':user.uid,
        'creationTime':user.metadata.creationTime,
        'lastSignInTime':user.metadata.lastSignInTime,
      };
      return userRef.get()
        .then((docSnapshot) => {
          if (docSnapshot.exists) {
            // check auth data for changes
            let matched = ((u1, u2) => {
              for (var x in u1) {
                if (u2.hasOwnProperty(x)) {
                  if (u1[x] != u2[x]) {
                    return false;
                  }
                } else {
                  return false;
                }
              }
              return true;
            })(docSnapshot.data(), userData);
            // update user if there are changes
            if (!matched) {
              return userRef.set(userData, {merge: true})
                .then(() => {
                  return userRef.get()
                    .then((docSnapshot) => {
                      commit('setUserStatus', true);
                      return commit('setUser', docSnapshot.data());
                    })
                })
                .catch(err => {throw(err)})
            } else {
              commit('setUserStatus', true);
              return commit('setUser', docSnapshot.data());
            }
          } else {
            return userRef.set(userData)
              .then(() => {
                return userRef.get()
                  .then((docSnapshot) => {
                    commit('setUserStatus', true);
                    return commit('setUser', docSnapshot.data());
                  })
              })
              .catch(err => {throw(err)})
          }
        });
    },

    setUserStatus({commit}, status) {
      //console.log(`store.actions.user.setUserStatus() status [${status}]`);
      return commit('setUserStatus', status)
    },

    updateUser({commit, state}, user) {
      //console.log(`store.actions.user.updateUser()`);
      let userRef = this.$fbdb.collection('users').doc(this.state.user.user.uid),
        stateData = Object.assign({}, state.user),
        userData = Object.assign(stateData, user);
      return userRef.set(userData)
        .then(() => {
          return userRef.get()
            .then((userSnapshot) => {
              return commit('setUser', userSnapshot.data())
            })
            .catch(err => {throw(err)})
        })
        .catch(err => {throw(err)})
    },

    deleteUser({commit}) {
      //console.log(`store.actions.user.deleteUser()`);
      let userRef = this.$fbdb.collection('users').doc(this.state.user.user.uid);
      return userRef.get()
        .then((userSnapshot) => {
          return userSnapshot.ref.delete()
            .then(() => {
              return commit('deleteUser')
            })
        })
    }

  },

  mutations: {
    setUser(state, user) {
      //console.log('store.mutations.user.setUser()');
      state.user = user;
      state.userAuthenticating = false
    },
    setUserStatus(state, status) {
      //console.log(`store.mutations.user.setUserStatus(${status})`);
      state.userLoggedIn = status;
      state.userAuthenticating = false
    },
    deleteUser(state) {
      //console.log('store.mutations.user.deleteUser()');
    }
  }

}