import { mount, createLocalVue  } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Home from '@/components/Home.vue'

const localVue = createLocalVue();
localVue.use(VueRouter);
const router = new VueRouter();

describe('Home.vue', () => {
  // Now mount the component and you have the wrapper
  const wrapper = mount(Home, {
    localVue,
    router
  });
  // it's also easy to check for the existence of elements
  it('has a button', () => {
    expect(wrapper.contains('button.single-large')).toBe(true)
  });
  it('button should trigger navigation', () => {
    const button = wrapper.find('button.single-large');
    button.trigger('click');
    expect(wrapper.vm.$route.path).toBe('/notebooks/new')
  })
});