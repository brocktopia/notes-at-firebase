<template>
  <div class="app-container">

    <header>
      <h2>Email Address Verified</h2>
    </header>

    <div class="content">
      <p>Thank you for verifying your email address.</p>
      <button class="single-large" @click="window.close()">Close This Window</button>
    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
    </div>

  </div>
</template>

<script>
  module.exports =  {
    data () {
      return {}
    }
  }
</script>

<style scoped>
  .content {
    padding: 20px;
  }
  .single-large {
    display: block;
    margin: 30px auto;
    padding: 0.5rem 1.5rem;
  }
</style>