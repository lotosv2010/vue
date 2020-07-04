/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0
/**
 * 初始化vue
 * @param {Vue构造器} Vue 
 */
export function initMixin (Vue: Class<Component>) {
  //初始化函数
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    /* 
    * 测试代码性能
    * 参考：https://segmentfault.com/a/1190000014479800
    */
    let startTag, endTag //开始标签，结束标签
    /* istanbul ignore if */
    //浏览器性能监控
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 避免被响应式的标识
    // 这里可以暂时理解新建observer实例就是让数据响应式
    vm._isVue = true
    // merge options
    // 有子组件时，options._isComponent才会为true
    if (options && options._isComponent) { //这是组件实例化时的分支
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      /*
      * 优化内部组件实例化
      * 因为动态选项合并非常慢，而且内部组件选项不需要特殊处理
      * 初始化内部组件
      */
      initInternalComponent(vm, options)
    } else { // 根Vue实例执行到这里
      // TODO:(重点分析:合并options)传入的options和vue自身的options进行合并保存到vm.$options
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor), // 解析vue 构造函数上的options属性的
        options || {},
        vm
      )
    }
    /* 
    * istanbul ignore else 
    * 参考：https://segmentfault.com/a/1190000014824359
    */
    if (process.env.NODE_ENV !== 'production') {
      // 初始化代理监听
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm // 开放真实的self
    initLifecycle(vm) // 初始化生命周期
    initEvents(vm) // 初始化事件
    initRender(vm) // 初始化渲染
    // TODO:(生命周期:beforeCreate)
    callHook(vm, 'beforeCreate') // 触发 beforeCreate 钩子函数
    /**
     * 在data / props之前解决注入问题
     * 初始化 inject
     */
    initInjections(vm) // resolve injections before data/props
    // 初始化props属性、data属性、methods属性、computed属性、watch属性
    initState(vm)
    /**
     * 在data / props初始化后解决注入问题
     * 选项应该是一个对象或返回一个对象的函数
     * 该对象包含可注入其子孙的属性，用于组件之间通信
     */
    initProvide(vm) // resolve provide after data/props
    // TODO:(生命周期:created)
    callHook(vm, 'created') // 触发 created 钩子函数

    /* istanbul ignore if */
    //浏览器性能监听
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      /**
       * 手动挂载
       * 在项目中可用于延时挂载（例如在挂载之前要进行一些其他操作、判断等），之后要手动挂载上
       * new Vue时，el和 $mount 并没有本质上的不同
       */
      vm.$mount(vm.$options.el)
    }
  }
}

/**
 * 初始化内部组件
 * @param {Vue实例} vm 
 * @param {配置项} options 
 */
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options) // 拷贝一份vm配置项
  // doing this because it's faster than dynamic enumeration.
  // var options = {
  //     _isComponent: true, //是否是组件
  //     parent: parent, //组件的父节点
  //     _parentVnode: vnode, //组件的 虚拟vonde 父节点
  //     _parentElm: parentElm || null, //父节点的dom el
  //     _refElm: refElm || null //当前节点 el
  // }
  const parentVnode = options._parentVnode // 获取组件的虚拟vnode父节点
  opts.parent = options.parent // 组件的父节点
  opts._parentVnode = parentVnode // 组件的虚拟vnode父节点

  const vnodeComponentOptions = parentVnode.componentOptions // 组件参数
  opts.propsData = vnodeComponentOptions.propsData // 组件数据
  opts._parentListeners = vnodeComponentOptions.listeners // 组件事件
  opts._renderChildren = vnodeComponentOptions.children // 组件子节点
  opts._componentTag = vnodeComponentOptions.tag // 组件标签

  if (options.render) { // 渲染函数存在的情况
    opts.render = options.render // 渲染函数
    opts.staticRenderFns = options.staticRenderFns // 静态渲染函数
  }
}

/**
 * 解析 Vue 构造函数上的 options 属性
 * @param {组件构造器} Ctor 
 */
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 有 super 属性，说明 Ctor 是 Vue.extend 构建的子类
  if (Ctor.super) { // 父类
    const superOptions = resolveConstructorOptions(Ctor.super) // 递归调用获取父类的 options
    const cachedSuperOptions = Ctor.superOptions // Vue构造函数上的options,如directives,filters,....
    if (superOptions !== cachedSuperOptions) { //判断如果 超类的options不等于子类的options 的时候
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions // 让父类的 options 赋值给 Ctor 的 superOptions 属性
      // check if there are any late-modified/attached options (#4976)
      // 检查是否有任何后期修改/附加选项
      // 解决修改选项 ，转义数据，合并数据
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      // 更新基本扩展选项
      if (modifiedOptions) {
        // extendOptions合并拓展参数
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 优先取Ctor.extendOptions 将两个对象合成一个对象 将父值对象和子值对象合并在一起
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

/**
 * 解决修改options 转义数据，合并数据
 * @param {组件构造器} Ctor 
 */
function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options // 获取选项
  const sealed = Ctor.sealedOptions // 获取扩展的选项
  for (const key in latest) {
    if (latest[key] !== sealed[key]) { // 如果选项不等于子类选项
      if (!modified) modified = {}
      modified[key] = latest[key] // 合并参数
    }
  }
  return modified
}
