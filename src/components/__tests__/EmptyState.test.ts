import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders the component correctly', () => {
    const wrapper = mount(EmptyState, {
      global: {
        stubs: {
          'el-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          'el-icon': {
            template: '<span><slot /></span>',
          },
        },
      },
    })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state__title').text()).toBe('还没有添加城市')
  })

  it('emits addCity when button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      global: {
        stubs: {
          'el-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          'el-icon': {
            template: '<span><slot /></span>',
          },
        },
      },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('addCity')).toBeTruthy()
    expect(wrapper.emitted('addCity')!.length).toBeGreaterThanOrEqual(1)
  })
})
