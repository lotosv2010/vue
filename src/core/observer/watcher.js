/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component, // vm dom
    expOrFn: string | Function, // 获取值的函数，或者是更新viwe试图函数
    cb: Function, // 回调函数,回调值给回调函数
    options?: ?Object, // 参数
    isRenderWatcher?: boolean // 是否渲染过得观察者
  ) {
    this.vm = vm
    // 是否是已经渲染过得观察者
    if (isRenderWatcher) {
      // 把当前 Watcher 对象赋值给 vm._watcher上
      vm._watcher = this
    }
    // 把观察者添加到队列里面 当前Watcher添加到vue实例上
    vm._watchers.push(this)
    // options
    // 如果有参数
    if (options) {
      this.deep = !!options.deep // 用来告诉当前观察者实例对象是否是深度观测
      this.user = !!options.user // 用来标识当前观察者实例对象是 开发者定义的 还是 内部定义的
      this.lazy = !!options.lazy // 懒惰渲染，用来标识当前观察者实例对象是否是计算属性的观察者
      this.sync = !!options.sync // 用来告诉观察者当数据变化时是否同步求值并执行回调
      this.before = options.before // 可以理解为 Watcher 实例的钩子，当数据变化之后，触发更新之前，调用在创建渲染函数的观察者实例对象时传递的 `before` 选项
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb // 回调函数
    this.id = ++uid // uid for batching // uid为批处理  监听者id
    this.active = true // 激活
    this.dirty = this.lazy // for lazy watchers // 对于懒惰的观察者
    this.deps = [] // 观察者队列
    this.newDeps = [] // 新的观察者队列
    // 内容不可重复的数组对象
    this.depIds = new Set()
    this.newDepIds = new Set()
    // 把函数变成字符串形式
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    // getter的解析表达式
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn) // get对应的是parsePath()返回的匿名函数
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get() // 最后会执行get()方法
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    // 将当前用户watch保存到Dep.target中
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 执行用户wathcer的getter()方法，此方法会将当前用户watcher作为订阅者订阅起来
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        // 深度收集 value 中的key
        traverse(value)
      }
      // 恢复之前的watcher
      popTarget()
      // 清理依赖项集合
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id // dep.id 一个持续相加的id
    if (!this.newDepIds.has(id)) { // 如果id不存在
      this.newDepIds.add(id) // 添加一个id
      this.newDeps.push(dep) // 添加一个deps
      if (!this.depIds.has(id)) { // 如果depIds不存在id则添加一个sub
        // 添加一个sub
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this) //清除 sub
      }
    }
    let tmp = this.depIds // 获取depids
    this.depIds = this.newDepIds // 获取新的depids
    this.newDepIds = tmp // 旧的覆盖新的
    this.newDepIds.clear() //清空对象
    // 互换值
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      // 如果$this.sync为true，则直接运行this.run获取结果，
      // 这里对应watch的值为对象且含有sync属性的情况
      this.run()
    } else {
      // 否则调用queueWatcher()函数把所有要执行update()的watch push到队列中
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get() // 获取新值
      if (
        value !== this.value || // 新值和旧值不相等
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) || // 新值是对象
        this.deep // deep为true
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) { // 如果是个用户 watcher
          try {
            // 执行这个回调函数 vm作为上下文 参数1为新值 参数2为旧值，
            // 也就是最后我们自己定义的function(newval,val){ console.log(newval,val) }函数
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  /**
   * 为计算watcher量身定制的
   */
  evaluate () {
    // 调用计算属性的get方法，此时如果有依赖其他属性，则会在其他属性的dep对象里将当前计算watcher作为订阅者
    this.value = this.get()
    // 修正this.dirty为false,即一个渲染watcher渲染多个计算属性时，只会执行一次
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    // 获取计算watcher的所有deps
    let i = this.deps.length
    while (i--) {
      // 为该deps增加渲染watcher
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
