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
            <slot name="footer">
              <button class="modal-default-button" @click="$emit('close')">
                OK
              </button>
              <br/><br/>
            </slot>
          </div>

        </div>

      </div>

    </div>
</template>

<script>
  module.exports = {

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