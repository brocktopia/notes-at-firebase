<template>
  <div class="app-container" id="navError">

    <header>
      <h2>Page Note Found</h2>
    </header>

    <div class="content">
      <p>The page you're looking for can not be found.</p>
      <p>Route <b class="route-error">{{$route.path}}</b> does not compute.</p>
    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
      <router-link to="/notebooks">Notebooks</router-link>
    </div>

  </div>
</template>

<script>
  module.exports =  {
    name: 'app',
    data () {
      return {}
    }
  }
</script>

<style scoped>
  .content {
    padding: 20px;
  }
  .route-error {
    color: orangered;
  }
</style>