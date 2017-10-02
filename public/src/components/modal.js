module.exports = Vue.component('modal', {
  template: "#modal-tpl",
  methods: {
    closeModal: function () {
      this.$emit('close-modal');
    }
  }
});
