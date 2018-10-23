<template>
  <div class="modal-mask">

    <div class="modal-wrapper">

      <div class="modal-container">

        <div class="modal-header">
          <h3 v-if="mode === 'edit'">Edit Notebook Name</h3>
          <h3 v-if="mode === 'create'">Create a New Notebook</h3>
        </div>

        <div class="modal-body">
          <input
            type="text"
            id="notebookName"
            ref="nameInput"
            v-model="notebook.name"
            maxlength="40"
            placeholder="Enter a name"
            @keyup.enter="$emit('save', notebook)"
          >
          <span v-if="typeof(notebook.name) === 'string'" class="input-info">
            Maximum 40 characters (<span :class="notebook.name.length < 30 ? 'char-count' : 'char-count-close'">{{40 - notebook.name.length}}</span> remaining)
          </span>
        </div>

        <div class="modal-footer">
          <button class="modal-optional-button" @click="$emit('close')">
            Cancel
          </button>
          <button class="modal-default-button" @click="$emit('save', notebook)">
            Save
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script>
  export default {

    props: {
      mode:{
        type:String,
        default: 'edit'
      },
      notebookSource:{
        type: Object,
        required: true
      }
    },

    data() {
      return {
        notebook:{name:''}
      }
    },

    mounted() {
      //console.log('EditNotebookDialog.mounted()');
      Object.assign(this.notebook, this.notebookSource);
      this.$refs.nameInput.focus();
    }
  };
</script>

<style scoped>
  .input-info {
    font-size: smaller;
  }
  .char-count {
    color: darkgreen;
  }
  .char-count-close {
    color: orangered;
  }
</style>