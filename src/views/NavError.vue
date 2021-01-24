<template>
  <div class="app-container" id="navError">

    <nav class="head">
      <h2>Page Not Found</h2>
      <span class="button-bar">
        
      </span>
    </nav>

    <div class="content">
      <p>The page you're looking for can not be found.</p>
      <p>Route <b class="route-error">{{$route.path}}</b> does not compute.</p>
    </div>

    <div class="navigation">
      <router-link to="/">Home</router-link>
      <router-link to="/notebooks">Notebooks</router-link>
      <router-link to="/explore">Explore</router-link>
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