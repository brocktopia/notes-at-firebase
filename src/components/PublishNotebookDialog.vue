<template>
  <div class="modal-mask">

    <div class="modal-wrapper">

      <div class="modal-container">

        <div class="modal-header">
          <h3 v-if="notebook.lastPublished == null">Publish Notebook</h3>
          <h3 v-if="notebook.lastPublished != null">Update Published Notebook</h3>
        </div>

        <div class="modal-body">
          <div class="form-field">
            <label for="publishName">Name</label>
            <input
              type="text"
              id="publishName"
              ref="nameInput"
              v-model="notebook.publishName"
              maxlength="40"
              placeholder="Enter a name"
            >
          </div>
          <div v-if="notebook.lastPublished != null" class="form-field">
            <label for="lastPublished">Last Published</label>
            <div class="date">{{$moment(notebook.lastPublished.toDate()).format('LLLL')}}</div>
          </div>
          <div v-if="notebook.lastPublished == null" class="form-field">
            <label for="published">Publish Date</label>
            <div class="date">{{$moment(new Date()).format('LLLL')}}</div>
          </div>
          
        </div>

        <div class="modal-footer">
          <button class="modal-optional-button" @click="$emit('close')">
            Cancel
          </button>
          <button class="modal-default-button" @click="onPublish()">
            Publish
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script>
  export default {

    data() {
      return {
        notebook:{publishName:""}
      }
    },

    computed: {

      activeNotebook() {
        return this.$store.state.notebooks.activeNotebook;
      }

    },

    mounted() {
      console.log('PublishNotebookDialog.mounted()');
      
      Object.assign(this.notebook, this.activeNotebook);
      if (this.notebook.publishId != null) {
        this.getPublication();
      }
      if (this.notebook.publishName == "") {
        this.notebook.publishName = this.notebook.name;
      }
      this.$refs.nameInput.focus();
    },

    methods: {

      getPublication() {
        this.$store.dispatch('published/getPublication', this.notebook.publishId)
          .then(() => {

          })
          .catch(this.handleError);
      },

      onPublish() {
        if (this.notebook.publishId != null) {
          // save notebook changes
          this.$store.dispatch('notebooks/updateNotebook', this.notebook)
            .then(() => {
              // update publication
              this.$store.dispatch('published/updatePublication', this.notebook)
                .then(() => {
                  this.$emit('close');
                });
            });
        }
        else {
          // save notebook changes
          this.$store.dispatch('notebooks/updateNotebook', this.notebook)
            .then(() => {
              // create publication
              this.$store.dispatch('published/createPublication', this.notebook)
                .then(() => {
                  this.$emit('close');
                });
            });
        }
      },

      handleError(err) {
        console.warn('Notebook.handleError()');
        console.dir(err);
      }

    }

  };
</script>

<style scoped>
  .form-field {
    margin: 8px auto;
  }
</style>