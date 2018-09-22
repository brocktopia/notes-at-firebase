import { mount, createLocalVue  } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import Notebooks from '@/components/Notebooks.vue'

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(Vuex);
const router = new VueRouter();
let actions = {
  "notebooks/load": jest.fn(),
  "notebooks/addNotebook": jest.fn()
};
let store = new Vuex.Store({
  state: {
    notebooks:{
      all:[]
    }
  },
  actions: actions
});
let testNotebook = {
  name:'Test Notebook'
};

describe('Notebooks.vue', () => {

  // Now mount the component and you have the wrapper
  const wrapper = mount(Notebooks, {
    localVue,
    store,
    router
  });

  // check that call to load notebooks was made
  it('call to load notebooks has been made', () => {
    expect(actions['notebooks/load']).toHaveBeenCalled()
  });
  // check for add notebook button
  it('has add-notebook button', () => {
    expect(wrapper.contains('button.add-notebook')).toBe(true)
  });
  // check for new route on click
  it('add-notebook button should trigger navigation', () => {
    const button = wrapper.find('button.add-notebook');
    button.trigger('click');
    expect(wrapper.vm.$route.path).toBe('/notebooks/new');
  });
  it('home button should trigger navigation', () => {
    const link = wrapper.find('a.router-link-active');
    link.trigger('click');
    expect(wrapper.vm.$route.path).toBe('/');
  });
  // check for dialog content
  it('add-notebook button should display dialog', () => {
    const button = wrapper.find('button.add-notebook');
    button.trigger('click');
    wrapper.vm.$nextTick(() => {
      expect(wrapper.contains('Create a New Notebook')).toBe(true);
    });
  });
  // check that save triggers action
  it('save notebook triggers action', () => {
    wrapper.vm.saveNewNotebook(testNotebook);
    expect(actions['notebooks/addNotebook']).toHaveBeenCalled()
  });
});