import { shallowMount, createLocalVue  } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import Notebook from '@/components/Notebook.vue'
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
const notebook_id = '5b91e91c46c21c7a882c9a0d';
const router = new VueRouter();//{base:'/notebook/' + notebook_id}
let getters = {
  "notes/activeNote":() => testNote,
  "notes/findNotebookNote": jest.fn()
}
let actions = {
  "notebooks/load": jest.fn(),
  "notebooks/getNotebook": jest.fn(),
  "notes/getNotebookNotes": jest.fn(),
  "notes/clearActiveNote": jest.fn(),
  "notes/setActiveNote": jest.fn(),
  "notes/createActiveNote": jest.fn(),
  "notebooks/updateNotebook": jest.fn(),
  "notebooks/delete": jest.fn()
};
let store = new Vuex.Store({
  'state': {
    'notebooks':{
      'activeNotebook':{
        '_id':notebook_id,
        'name':'testing'
      }
    },
    'notes':{
      'notebookNotes':[
        testNote
      ]
    }
  },
  'actions': actions,
  'getters': getters
});

describe('Notebook.vue', () => {

  // Now mount the component and you have the wrapper
  const wrapper = shallowMount(Notebook, {
    localVue,
    store,
    router
  });

  // check that service calls are made on mount
  it('service calls to have been made on mount', () => {
    expect(actions['notebooks/load']).toHaveBeenCalled();
    wrapper.vm.$nextTick(() => {
      expect(actions['notebooks/getNotebook']).toHaveBeenCalled();
      expect(actions['notes/getNotebookNotes']).toHaveBeenCalled();
    });
  });

  // check for add notebook button
  it('has add-note button', () => {
    expect(wrapper.contains('button.add-note')).toBe(true);
  });

  // check for new route on click
  it('add-note button should trigger navigation', () => {
    const button = wrapper.find('button.add-note');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/note-new/'+notebook_id);
    });
  });

  // check selectNote function
  it('noteSelect method triggers navigation', () => {
    wrapper.vm.noteSelect(testNote);
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/note/'+testNote._id);
    });
  });

  // check map toggle
  it('map button should triggers navigation', () => {
    const button = wrapper.find('button.show-map');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.$route.path).toBe('/notebook/'+notebook_id+'/map');
    });
  });

  // check notebook edit
  it('edit button should triggers new content', () => {
    const button = wrapper.find('button.edit-notebook');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.contains('Edit Notebook Name')).toBe(true);
    });
  });

  // check notebook delete
  it('delete button should triggers new content', () => {
    const button = wrapper.find('button.delete-notebook');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.contains('Confirm Notebook Delete')).toBe(true);
    });
  });

});