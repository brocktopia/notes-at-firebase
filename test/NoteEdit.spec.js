import { shallowMount, createLocalVue  } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import NoteEdit from '@/components/NoteEdit.vue'
import moment from 'moment'
import Vue from "vue"
import * as VueGoogleMaps from 'vue2-google-maps'

/*

Not working due to the way script is shared between NoteEdit.vue and NoteEditMobile.vue.
For some reason it's not getting imported modules required to mount. Going to leave this
here in case I discover a solution for this problem.

 */

Vue.prototype.$moment = moment;
const localVue = createLocalVue();
const testNote = {
  _id:'5b92bebbb64e6b0a4870d239',
  notebook:'5b91e91c46c21c7a882c9a0d',
  name:'testing',
  note:'testing',
  geocode:{latitude:45.5122308,longitude:-122.6587185}
};
localVue.use(VueRouter);
localVue.use(Vuex);
localVue.use(VueGoogleMaps);
const router = new VueRouter({
  routes:[
    {
      path: '/note-edit/:note_id',
      name: 'note-edit',
      component: NoteEdit
    }
  ]
});
router.push('/note-edit/5b92bebbb64e6b0a4870d239');
const actions = {
  "notes/getNote": jest.fn(),
  "notes/getNotebookNotes":() => [testNote],
  "notes/createActiveNote": jest.fn(),
  "notes/saveActiveNote": jest.fn(),
  "notes/updateActiveNote": jest.fn(),
  "notes/delete": jest.fn(),
};
const getters = {
  "notes/activeNote":() => testNote,
  "notes/notebookNoteCount": () => 1
};
const store = new Vuex.Store({
  'state': {
    'notes':{
      'notebookNotes':[
        testNote
      ],
      activeNote: testNote
    },
    'user':{
      'userAuthenticating': false,
      'userLoggedIn': true,
      'user': {}
    }
  },
  'actions': actions,
  'getters': getters
});
const $gmapApiPromiseLazy = () => {
  console.log('$gmapApiPromiseLazy()');
  return {
    'then': (f) => {
      console.log('$gmapApiPromiseLazy().then()');
      return f({});
    }
  }
};

describe('NoteEdit.vue', () => {

  // Now mount the component and you have the wrapper
  const wrapper = shallowMount(NoteEdit, {
    localVue,
    store,
    router,
    mocks:{
      $gmapApiPromiseLazy
    }
  });

  // check that properties are set on mount
  it('device and mode to be set on mount', () => {
    expect(wrapper.vm.mode).toBe('edit');
    expect(wrapper.vm.device).toBe('desktop');
  });

  it('name input is set', () => {
    const el = wrapper.find('#noteName');
    expect(el.element.value).toBe('testing')
  });

  it('note input is set', () => {
    const el = wrapper.find('#noteNote');
    expect(el.element.value).toBe('testing')
  });

  it('geocords to be set', () => {
    const el = wrapper.find('#geocords');
    expect(el.element.innerHTML).toBe('45.5122308, -122.6587185');
  })

});