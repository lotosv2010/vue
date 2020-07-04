/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import { mark, measure } from '../util/perf'
import { createEmptyVNode } from '../vdom/vnode'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'
import { toggleObserving } from '../observer/index'
import { pushTarget, popTarget } from '../observer/dep'

import {
  warn,
  noop,
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling
} from '../util/index'

export let activeInstance: any = null
// 定义 isUpdatingChildComponent，并初始化为 false
export let isUpdatingChildComponent: boolean = false

/**
 * 保存了一个activeInstance是vm实例的状态
 * @param {vue实例} vm 
 */
export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

/**
 * 初始化生命周期
 * @param {vue实例} vm 
 */
export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent(查找第一个非抽象的父组件)
  // 定义 parent，它引用当前实例的父实例
  let parent = options.parent
  // 如果当前实例有父组件，且当前实例不是抽象的
  if (parent && !options.abstract) {
    // 使用 while 循环查找第一个非抽象的父组件
    while (parent.$options.abstract && parent.$parent) {
      // 沿着父实例链逐层向上寻找到第一个不抽象的实例作为 parent（父级）
      parent = parent.$parent
    }
    // 经过上面的 while 循环后，parent 应该是一个非抽象的组件，
    // 将它作为当前实例的父级，所以将当前实例 vm 添加到父级的 $children 属性里
    parent.$children.push(vm)
  }

  // 设置当前实例的 $parent 属性，指向父级
  vm.$parent = parent
  // 设置 $root 属性，有父级就是用父级的 $root，否则 $root 指向自身
  vm.$root = parent ? parent.$root : vm

  // 添加$children属性
  vm.$children = []
  // 添加$refs属性
  vm.$refs = {}

  vm._watcher = null // 观察者
  vm._inactive = null // 禁用的组件状态标志
  vm._directInactive = false // 不活跃，禁用的组件标志
  vm._isMounted = false // 标志是否触发过钩子Mounted
  vm._isDestroyed = false // 是否已经销毁的组件标志
  vm._isBeingDestroyed = false // 如果为true 则不触发 beforeDestroy 钩子函数 和destroyed 钩子函数
}

/**
 * 初始化vue 更新/销毁
 * @param {Vue构造器} Vue 
 */
export function lifecycleMixin (Vue: Class<Component>) {
  /**
   * 将vnode转换成dom，渲染在视图中
   * @param {vnode dom虚拟节点} vnode 
   * @param {布尔类型的参数是跟ssr相关} hydrating 
   */
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el // 获取vue实例的el节点
    const prevVnode = vm._vnode // 获取前置Vnode，第一次渲染时为空
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    // 如果这个prevVnode不存在表示上一次没有创建过vnode，
    // 这个组件或者new Vue 是第一次进来
    if (!prevVnode) {
      // initial render
      // TODO:(重点分析:首次渲染) 首次渲染传入真实dom
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      // TODO:(重点分析:数据更新)
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }

  // 更新观察者数据
  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  // 销毁组建周期函数
  Vue.prototype.$destroy = function () {
    const vm: Component = this
    // 如果是已经销毁过则不会再执行
    if (vm._isBeingDestroyed) {
      return
    }
    // TODO:(生命周期:beforeDestroy)
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true
    // remove self from parent
    // 从父节点移除self
    const parent = vm.$parent
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm) // 删除父节点
    }
    // teardown watchers
    // 拆卸观察者
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      // 从数据ob中删除引用
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    vm._isDestroyed = true
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    // TODO:(生命周期:destroyed)
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    // 销毁事件监听器
    vm.$off()
    // remove __vue__ reference
    // 删除vue 参数
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // release circular reference (#6759)
    // 释放循环引用，销毁父节点
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}

/**
 * 挂载组件
 * @param {Vue实例} vm 
 * @param {元素} el 
 * @param {新的虚拟dom vonde} hydrating 
 */
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  // 没有渲染函数的情况
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode // 创建一个空的组件
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      // 模版存在并且第一个字符不为#则报警告
      // 实例的配置项中el存在或el实参存在时则报警告
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // TODO:(生命周期:beforeMount) 调用生命周期钩子beforeMount
  callHook(vm, 'beforeMount')
  // 定义更新组件
  let updateComponent
  /* istanbul ignore if */
  // 开启了性能追踪时的分支
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag) // 插入一个名称，并记录插入名称的时间
      const vnode = vm._render() // 获取虚拟dom
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag) // 浏览器性能时间戳监听
      // 更新组件
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      // 首先vm._update和vm._render这两个方法是定义在Vue原型上的
      // 1.vm._render()把实例渲染成一个虚拟 Node
      // 2.vm._update更新 DOM，内部调用 vm.__patch__转换成真正的 DOM 节点
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  /**
   * 创建 watcher(观察者)
   * @param {Vue实例} vm 
   * @param {数据绑定完之后回调该函数(更新组件函数)更新 view 视图} updateComponent 
   * @param {回调函数} noop 
   * @param {参数} options
   * @param {是否渲染过得观察者} isRenderWatcher
   */
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) { // 如果已经挂载了，并且没有销毁
        // TODO:(生命周期:beforeUpdate) 调用生命周期钩子beforeUpdate
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true // 设置vm._isMounted为true,表示已挂载
    // TODO:(生命周期:mounted) 调用生命周期钩子mounted
    callHook(vm, 'mounted')
  }
  return vm
}

export function updateChildComponent (
  vm: Component,
  propsData: ?Object,
  listeners: ?Object,
  parentVnode: MountedComponentVNode,
  renderChildren: ?Array<VNode>
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.

  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  const newScopedSlots = parentVnode.data.scopedSlots
  const oldScopedSlots = vm.$scopedSlots
  const hasDynamicScopedSlot = !!(
    (newScopedSlots && !newScopedSlots.$stable) ||
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
  )

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  const needsForceUpdate = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    hasDynamicScopedSlot
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode
  }
  vm.$options._renderChildren = renderChildren

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject
  vm.$listeners = listeners || emptyObject

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }

  // update listeners
  listeners = listeners || emptyObject
  const oldListeners = vm.$options._parentListeners
  vm.$options._parentListeners = listeners
  updateComponentListeners(vm, listeners, oldListeners)

  // resolve slots + force update if has children
  if (needsForceUpdate) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false
  }
}

/**
 * 循环父树层，如果有不活跃的则返回真
 * @param {vue实例} vm 
 */
function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) { // 循环父节点如果父节点有_inactive 则返回true
    if (vm._inactive) return true
  }
  return false
}

/**
 * 判断是否有不活跃的组件如有则禁用，如果有活跃组件则触发钩子函数activated
 * @param {vue实例} vm 
 * @param {} direct 
 */
export function activateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) { // 如果有不活跃的树，或者被禁用组件
      return
    }
  } else if (vm._directInactive) { // 单个不活跃的
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]) // 递归循环 禁用子组件
    }
    // TODO:(生命周期:activated)
    callHook(vm, 'activated')
  }
}

/**
 * 判断是否有禁止的组件，如果有活跃组件则执行生命后期函数deactivated
 * @param {vue实例} vm 
 * @param {*} direct 
 */
export function deactivateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) { // 如果该组件是活跃的
    vm._inactive = true // 设置活动中的树
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    // TODO:(生命周期:deactivated)
    callHook(vm, 'deactivated')
  }
}

/**
 * 调用钩子函数
 * @param {vue实例} vm 
 * @param {钩子函数的key，例如:beforeCreate、created等} hook 
 */
export function callHook (vm: Component, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget() // 入栈target
  const handlers = vm.$options[hook] // 获取生命周期函数 
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) { // 遍历生命周期函数
      invokeWithErrorHandling(handlers[i], vm, null, vm, info) // 执行该函数，以vm作为上下文
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget() // 出栈target
}
