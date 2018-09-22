<template>
  <div class="app-container">

    <header>
      <h2>Home</h2>
      <span class="button-bar">
        <button class="icon sign-out" @click="signOut()"><svg><use xlink:href="./dist/symbols.svg#logout">
          <title>Sign Out</title>
        </use></svg></button>
        <button class="icon settings" @click="loadSettings()"><svg class="bigger"><use xlink:href="./dist/symbols.svg#settings">
          <title>Settings</title>
        </use></svg></button>
      </span>
    </header>

    <div class="content">
      <img class="logo" src="../assets/logo.png" width="180" height="40" />
      <p>
        <b>notes<span class="at-char">@</span></b> allows you to connect an idea with a place.
        Create a new note and it will be tagged with the location where the note was created.
        The location will be stored as geolocation coordinates and can be associated with a place on Google Maps.
        You can organized notes into notebooks which can be viewed as a list or as points on a map.
      </p>
      <p>To get started create a new notebook now.</p>
      <button class="single-large" @click="createNewNotebook()">Create a Notebook</button>
    </div>

    <div class="navigation">
      <router-link to="/notebooks">Go to Notebooks</router-link>
    </div>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  module.exports = {
    data() {
      return {
        isLoading: false,
        loadingMessage:'Signing Out...'
      }
    },
    methods: {
      createNewNotebook() {
        //console.log('Home.createNewNotebook()');
        this.$router.push('/notebooks/new')
      },
      signOut() {
        //console.log('Home.signOut()');
        this.isLoading = true;
        this.$firebase.auth().signOut()
          .then(() => {
            this.isLoading = false;
            console.log('Home.signOut() sign out complete...');
          })
          .catch((err) => {
            console.warn('Home.signOut() Failed to sign out');
            console.dir(err);
            this.isLoading = false;
          })
      },
      loadSettings() {
        //console.log('Home.loadSettings()');
        this.$router.push('/settings')
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
  .at-char {
    color: #4e7eef;
  }
  .single-large {
    display: block;
    margin: 30px auto;
    padding: 0.5rem 1.5rem;
  }
</style>