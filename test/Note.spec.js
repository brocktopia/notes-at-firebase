import { shallowMount, createLocalVue  } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import Note from '@/components/Note.vue'
import moment from 'moment'
import Vue from "vue";

Vue.prototype.$moment = moment;
const localVue = createLocalVue();
const testNote = {
  _id:'5b92bebbb64e6b0a4870d239',
  notebook:'5b91e91c46c21c7a882c9a0d',
  name:'testing',
  note:'testing',
  geocode:{lat:0,lng:0}
};
localVue.use(VueRouter);
localVue.use(Vuex);
const router = new VueRouter();
let actions = {
  "notes/getNote": jest.fn(),
  "notes/nextNote": jest.fn(),
  "notes/previousNote": jest.fn(),
  "notes/delete": jest.fn(),
};
let getters = {
  "notes/activeNote":() => testNote,
  "notes/notebookNoteCount": () => 1
};
let store = new Vuex.Store({
  'state': {
    'notes':{
      'notebookNotes':[
        testNote
      ],
      activeNote: testNote
    }
  },
  'actions': actions,
  'getters': getters
});

describe('Note.vue', () => {

  // Now mount the component and you have the wrapper
  const wrapper = shallowMount(Note, {
    localVue,
    store,
    router
  });

  // check that service calls are made on mount
  it('service calls to have been made on mount', () => {
    expect(actions['notes/getNote']).toHaveBeenCalled();
  });

  // check note edit
  it('edit button should trigger navigation', () => {
    const button = wrapper.find('button.edit-note');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/note-edit/'+testNote._id);
    });
  });

  /* check delete button */
  it('delete button should triggers new content', () => {
    const button = wrapper.find('button.delete-note');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.contains('Confirm Delete')).toBe(true);
      // clean-up
      wrapper.vm.cancelDelete();
    });
  });

  // check map toggle
  it('map buttons should triggers navigation', () => {
    let button = wrapper.find('button.show-map');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/note/'+testNote._id+'/map');
      /* test map back to note */
      button = wrapper.find('button.show-note');
      button.trigger('click');
      wrapper.vm.$nextTick(() => {
        expect(wrapper.vm.$route.path).toBe('/note/'+testNote._id);
      });
    });
  });

  // check map link in geocords
  it('geocordinate link should triggers navigation', () => {
    let link = wrapper.find('a.geocords-link');
    link.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/note/'+testNote._id+'/map');
    });
  });

  /* check close button */
  it('close button should trigger navigation', () => {
    const button = wrapper.find('button.close-note');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/notebook/'+testNote.notebook);
    });
  });

  /* check Back to Notebook link */
  it('Back to Notebook link should trigger navigation', () => {
    const link = wrapper.find('a.back2notebook');
    link.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/notebook/'+testNote.notebook);
    });
  });


});