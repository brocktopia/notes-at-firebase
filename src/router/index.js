import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

// component route endpoints
import Login from '../components/Login'
import SignUp from '../components/SignUp'
import Home from '../components/Home'
import Settings from '../components/Settings'
import Notebooks from '../components/Notebooks'
import Notebook from '../components/Notebook'
import Note from '../components/Note'
import NoteEdit from '../components/NoteEdit'
import Verified from '../components/Verified'
import NavError from '../components/NavError'

Vue.use(VueRouter);

const router = new VueRouter({
  routes:[
    // Login Component
    {
      path:'/login',
      name:'login',
      component: Login
    },
    // SignUp Component
    {
      path:'/signup',
      name:'sign-up',
      component: SignUp
    },
    // Home Component
    {
      path:'/',
      name:'home',
      component: Home,
      meta: {
        requiresLogin:true
      }
    }
    // Settings
    ,{
      path:'/settings',
      name:'settings',
      component: Settings,
      meta: {
        requiresLogin:true
      }
    }
    // Notebooks Component
    ,{
      path:'/notebooks',
      name:'notebooks',
      component: Notebooks,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebooks/new',
      name:'notebooks-new',
      component: Notebooks,
      meta: {
        requiresLogin:true
      }
    }
    // Notebook Component
    ,{
      path:'/notebook/:notebook_id',
      name:'notebook',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebook/:notebook_id/note/:note_id',
      name:'notebook-note',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebook/:notebook_id/note-edit/:note_id',
      name:'notebook-note-edit',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebook/:notebook_id/note-new',
      name:'notebook-note-new',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebook/:notebook_id/note-new-mobile',
      name:'notebook-note-new-mobile',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebook/:notebook_id/note-edit-mobile/:note_id',
      name:'notebook-note-edit-mobile',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/notebook/:notebook_id/map',
      name:'notebook-map',
      component: Notebook,
      meta: {
        requiresLogin:true
      }
    }
    // Note Component
    ,{
      path:'/note/:note_id',
      name:'note',
      component: Note,
      meta: {
        requiresLogin:true
      }
    }
    ,{
      path:'/note/:note_id/map',
      name:'note-map',
      component: Note,
      meta: {
        requiresLogin:true
      }
    }
    // NoteEdit Component
    ,{
      path:'/note-edit/:note_id',
      name:'note-edit',
      component: NoteEdit,
      meta: {
        requiresLogin:true
      }
    },{
      path:'/note-new/:notebook_id',
      name:'note-new',
      component: NoteEdit,
      meta: {
        requiresLogin:true
      }
    }
    // NoteEditMobile Component
    ,{
      path:'/note-edit-mobile/:note_id',
      name:'note-edit-mobile',
      component: NoteEdit,
      meta: {
        requiresLogin:true
      }
    }
    ,{
      path:'/note-new-mobile/:notebook_id',
      name:'note-new-mobile',
      component: NoteEdit,
      meta: {
        requiresLogin:true
      }
    }
    // Email Verification
    ,{
      path:'/verified',
      name:'verified',
      component: Verified
    }
    // NavError Component
    ,{
      path:'*',
      name:'404',
      component: NavError
    }
  ],

  scrollBehavior (toRoute, fromRoute, savedPosition) {
    // return desired position--not currently working because whole view must scroll
    //console.log('router.scrollBehavior() to ['+toRoute.name+'] from ['+fromRoute.name+'] savedPosition ['+savedPosition+']');
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }

});

router.beforeEach((toRoute, fromRoute, next) => {
  let requiresLogin = toRoute.meta.requiresLogin,
    isAuthenticating = store.state.user.userAuthenticating,
    isLoggedIn = store.state.user.userLoggedIn;
  //console.log(`router.beforeEach() requiresLogin [${requiresLogin}] isLoggedIn [${isLoggedIn}] isAuthenticating [${isAuthenticating}]`);
  if (requiresLogin) {
    if (isLoggedIn || isAuthenticating) {
      next();
    } else {
      console.warn(`router.beforeEach() App user is not logged in`);
      next('/login');
    }
  } else {
    next();
  }
});

export default router