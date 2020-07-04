/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

/**
 * 初始化渲染
 * @param {Vue实例} vm 
 */
export function initRender (vm: Component) {
  // 根实例
  vm._vnode = null // the root of the child tree
  // v-once 缓存树
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options // 获取实例参数options
  // 父级的占位符节点
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  // 上下文
  const renderContext = parentVnode && parentVnode.context
  // TODO：插槽初始化
  // 判断 children 有没有分发式插槽，并且过滤掉空的插槽，并且收集插槽
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  // 模板编译成的 render 函数使用
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  // 用户手写 render  方法使用
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  // 获取父vnode data 属性
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    // 通过defineProperty的set方法去通知notify()订阅者subscribers有新的值修改
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}

export let currentRenderingInstance: Component | null = null

// for testing only
export function setCurrentRenderingInstance (vm: Component) {
  currentRenderingInstance = vm
}

/**
 * 初始化渲染的函数
 * @param {Vue构造器} Vue 
 */
export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  // 给 Vue 原型上添加_x(例如_l)这样的函数
  installRenderHelpers(Vue.prototype)

  // 给 Vue 原型上添加 $nextTick API
  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }

  Vue.prototype._render = function (): VNode {
    // this是Vue实例
    const vm: Component = this
    // 获取render函数和父级vnode
    const { render, _parentVnode } = vm.$options

    if (_parentVnode) { // 判断是否有parentVnode
      // 标准化slot
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      )
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    // 把父级的vnode赋值给vue实例的$vnode
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm
      // 核心方法，返回一个vnode
      // vm._renderProxy: this指向 其实就是vm
      // vm.$createElement: 这里虽然传参进去但是没有接收参数
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      //返回错误渲染结果，
      //或以前的vnode，以防止渲染错误导致空白组件
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      //创建一个节点,为注释节点,空的vnode
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode // 设置父vnode
    return vnode
  }
}
