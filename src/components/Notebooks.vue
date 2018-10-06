<template>
  <div class="app-container">

    <header>
      <h2>Notebooks</h2>
      <span class="button-bar">
        <button class="icon add-notebook" @click="addNotebook()"><svg><use xlink:href="./dist/symbols.svg#add-item"><title>Add New Notebook</title></use></svg></button>
      </span>
    </header>

    <div class="content">
      <ul class="notebooks">
        <li
          v-for="notebook in notebooks"
          :key="notebook._id"
          class="list-item"
          @click="notebookSelect(notebook)"
        >
          <span class="list-item-name">{{notebook.name}}</span>
          <span class="notebook-date">{{$moment(notebook.Created_date.toDate()).format("l")}}</span>
        </li>
      </ul>
      <div v-if="notebooks.length === 0" class="notebooks-message">No notebooks have been created.</div>
    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
    </div>

    <edit-notebook-dialog
      v-if="showNewNotebook"
      :mode="'create'"
      :notebookSource="notebookBaseObj"
      @save="saveNewNotebook"
      @close="cancelNewNotebook"
    ></edit-notebook-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  import EditNotebookDialog from './EditNotebookDialog'

  var vm;
  export default {

    components:{
      EditNotebookDialog
    },

    data: function() {
      return {
        showNewNotebook:false,
        isLoading: false,
        loadingMessage:'Loading...',
        notebookBaseObj:{}
      }
    },

    computed: {
      notebooks() {
        return this.$store.state.notebooks.all
      }
    },

    watch: {
      '$store.state.user.userAuthenticating': (val, oldVal) => {
        //console.log(`Notebooks.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
        if (!val && !!vm.$store.state.user.user.uid) {
          vm.getNotebooks();
        }
      }
    },

    mounted() {
      vm = this;
      //console.log(`Notebooks.mounted()`);
      if (!vm.$store.state.user.userAuthenticating) {
        vm.getNotebooks();
      }
    },

    methods:{
      getNotebooks() {
        //console.log('Notebooks.getNotebooks()');
        vm.isLoading = true;
        vm.$store.dispatch('notebooks/load')
          .then(function() {
            vm.isLoading = false;
            // Check to see if route is to notebooks-new
            if (vm.$route.name === 'notebooks-new') {
              vm.notebookBaseObj = {name:'', Created_date: new Date()};
              vm.showNewNotebook = true;
            }
          })
          .catch(vm.handleError)
      },
      notebookSelect(notebook) {
        //console.log('Notebooks.notebookSelect() notebook');
        vm.$router.push('/notebook/'+notebook._id);
      },
      addNotebook() {
        //console.log('Notebooks.addNotebook()');
        // initialize a new notebook instance
        vm.notebookBaseObj = {name:'', Created_date: new Date()};
        vm.showNewNotebook = true;
        vm.$router.replace('/notebooks/new');
      },
      cancelNewNotebook() {
        //console.log('Notebooks.cancelNewNotebook()');
        // clear notebookBaseObj
        vm.notebookBaseObj = {};
        vm.showNewNotebook = false;
        vm.$router.replace('/notebooks');
      },
      saveNewNotebook(notebook) {
        //console.log('Notebooks.saveNewNotebook()');
        vm.$store.dispatch('notebooks/addNotebook', notebook)
          .then(function() {
            // clear notebookBaseObj
            vm.notebookBaseObj = {};
            vm.showNewNotebook = false;
            vm.$router.replace('/notebooks');
          })
      },
      handleError(err) {
        console.warn('Notebooks.handleError()');
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
  ul.notebooks li {
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
  ul.notebooks li:hover {
    background-color: #eeeeee;
  }
  .notebook-date {
    float: right;
  }
  .notebooks-message {
    margin: 20px;
  }
</style>
