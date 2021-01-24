<template>
  <div class="app-container">

    <nav class="head">
      <h2>Explore</h2>
      <span class="button-bar">
        <button class="icon sign-out" @click="exploreMenuSelect()"><svg><use xlink:href="dist/symbols.svg#menu">
          <title>Exlore Menu</title>
        </use></svg></button>
      </span>
    </nav>

    <div class="content">
      <ul class="publications">
        <li
          v-for="notebook in published"
          :key="notebook._id"
          class="list-item"
          @click="publishedSelect(notebook)"
        >
          <span class="list-item-name">{{notebook.name}}</span>
          <span class="notebook-date">{{$moment(notebook.Created_date.toDate()).format("l")}}</span>
        </li>
      </ul>
      <div v-if="published.length === 0" class="published-message">No public notebooks have been created.</div>
    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
    </div>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  var vm;
  module.exports = {

    data() {
      return {
        isLoading: false,
        loadingMessage:'Loading...'
      }
    },

    computed: {
      published() {
        return this.$store.state.published.publications
      }
    },

    watch: {
      '$store.state.user.userAuthenticating': (val, oldVal) => {
        console.log(`Explore.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.getPublished();
        }
      }
    },

    mounted() {
      console.log(`Explore.mounted()`);
      vm = this;
      if (!this.$store.state.user.userAuthenticating) {
        this.getPublished();
      }
    },

    methods: {

      getPublished() {
        console.log(`Explore.getPublished()`);
        this.isLoading = true;
        this.$store.dispatch('published/getPublications')
          .then(() => {
            this.isLoading = false;
          })
          .catch(this.handleError)
      }, 

      publishedSelect(notebook) {
        console.log(`Explore.publishedSelect() ${notebook._id}`);
        vm.$router.push('/published/'+notebook._id);
      },

      exploreMenuSelect() {
        console.log(`Explore.exploreMenuSelect()`);
      },

      handleError(err) {
        console.warn('Explore.handleError()');
        console.dir(err);
        vm.isLoading = false;
      }

    }

  }
</script>

<style scoped>
  ul {
    width: 100%;
    margin: 0px;
    text-align: left;
  }
  ul.publications li {
    list-style: none;
    width: 100%;
    height: 50px;
    padding: 0px 20px;
    background-color: #dddddd;
    border-top: 1px solid #ffffff;
    border-bottom: 1px solid #999999;
    line-height: 50px;
    cursor: pointer;
  }
  ul.publications li:hover {
    background-color: #eeeeee;
  }
  .publication-date {
    float: right;
  }
  .publications-message {
    margin: 20px;
  }
</style>