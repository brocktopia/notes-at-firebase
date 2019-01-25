import ModalDialog from '@/components/ModalDialog'

export default  {

  components: {
    ModalDialog
  },

  data() {
    return {
      isLoading: false,
      loadingMessage:'Loading...',
      // message dialog
      showMessage: false,
      messageClass: 'notify',
      messageTitle: '',
      messageBody: '',
    }
  },

  watch: {
    '$store.state.user.userAuthenticating': function(val, oldVal) {
      //console.log(`${this.$options.name}.watch($store.state.user.userAuthenticating) val [${val}] oldVal [${oldVal}]`);
      if (!val && !!this.$store.state.user.user.uid) {
        this.init();
      }
    }
  },

  mounted() {
    //console.log(`${this.$options.name}.mounted()`);
    if (!this.$store.state.user.userAuthenticating) {
      this.init();
    }
  },

  methods: {
    handleError(err) {
      console.warn(`${this.$options.name}.handleError()`);
      console.dir(err);
    }
  }

}
