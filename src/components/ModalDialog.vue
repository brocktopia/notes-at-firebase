<template>
    <div class="modal-mask">

      <div class="modal-wrapper">

        <div class="modal-container">

          <div class="modal-header">
            <slot name="header">
              default header
            </slot>
          </div>

          <div class="modal-body">
            <slot name="body">
              default body
            </slot>
          </div>

          <div class="modal-footer">
            <slot v-if="modalType === 'notify'" name="footer">
              <button class="modal-default-button" @click="$emit('close')">
                OK
              </button>
              <br/><br/>
            </slot>
            <slot v-if="modalType === 'confirm'" name="footer">
              <button class="modal-default-button" @click="$emit('close')">
                Cancel
              </button>
              <button class="modal-default-button" @click="$emit('confirm')">
                Confirm
              </button>
              <br/><br/>
            </slot>
            <slot v-if="modalType === 'yesno'" name="footer">
              <button class="modal-default-button" @click="$emit('confirm')">
                Yes
              </button>
              <button class="modal-default-button" @click="$emit('close')">
                No
              </button>
              <br/><br/>
            </slot>
          </div>

        </div>

      </div>

    </div>
</template>

<script>
  export default {

    props:{
      modalType: {
        type: String,
        default: 'notify'
      }
    },

    data: function() {
      return {}
    }

  };
</script>

<style scoped>

  .alert {
    color: darkred;
  }

</style>