/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

/**
 * 切换观测
 * @param {是否要观测} value 
 */
export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
// Observer 构造类
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value // 初始化属性 value，值为数据对象的引用
    this.dep = new Dep() // 初始化属性 dep，值为 Dep实例
    this.vmCount = 0 // 初始化属性 vmCount ，值为0
    // 为数据对象定义了一个 __ob__ 属性，值为当前实例
    // def 函数其实就是 Object.defineProperty 函数的简单封装
    def(value, '__ob__', this)

    if (Array.isArray(value)) {
      // 检测当前环境是否可以使用 __proto__ 属性
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 如果value是数组，对数组每一个元素执行observe方法
      this.observeArray(value)
    } else {
      // 如果value是对象， 遍历对象的每一个属性， 将属性转化为响应式属性
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  // 遍历obj的属性，将obj对象的属性转化为响应式属性
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 给obj的每一个属性都赋予getter/setter方法。
      // 这样一旦属性被访问或者更新，这样我们就可以追踪到这些变化
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  // 如果要观察的对象时数组， 遍历数组，然后调用observe方法将对象的属性转化为响应式属性
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
/**
 * 设置数组实例的 __proto__ 属性，让其指向一个代理原型
 * @param {目标数组} target 
 * @param {代理原型} src 
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
/**
 * 把数组实例与代理原型或与代理原型中定义的函数联系起来，从而拦截数组变异方法
 * @param {目标数组} target 
 * @param {代理原型} src 
 * @param {所有要拦截的数组变异方法的名称} keys 
 */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
/**
 * observe 工厂函数
 * @param {要观测的数据} value 
 * @param {要被观测的数据是否是根级数据} asRootData 
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 判断要观测数据不是一个纯对象或者要观测的数据类型为 VNode 则直接返回
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 检测数据对象 value 自身是否含有 __ob__ 属性，并且 __ob__ 属性应该是 Observer 的实例
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve && // shouldObserve 必须为 true
    !isServerRendering() && // 判断是否是服务端渲染
    (Array.isArray(value) || isPlainObject(value)) && // 数据对象是数组或纯对象
    Object.isExtensible(value) && // 数据对象必须是可扩展的
    !value._isVue // !value._isVue 必须为真
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
/**
 * 将数据对象的数据属性转换为访问器属性
 * @param {要观测的数据对象} obj 
 * @param {属性的键名即key} key 
 * @param {对象属性对应的值} val 
 * @param {自定setter} customSetter 
 * @param {是否浅观测} shallow 
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 每一个响应式属性都会有一个 Dep对象实例， 该对象实例会存储订阅它的Watcher对象实例
  const dep = new Dep()

  // 获取对象属性key的描述对象
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果属性是不可配置的，则直接返
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 属性原来的getter/setter
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 如果属性值是一个对象，递归观察属性值
  let childOb = !shallow && observe(val)
  // 重新定义对象obj的属性key
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 当obj的某个属性被访问的时候，就会调用getter方法
      const value = getter ? getter.call(obj) : val
      // 当Dep.target不为空时，调用dep.depend 和 childOb.dep.depend方法做依赖收集
      if (Dep.target) {
        // 通过dep对象， 收集依赖关系
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          // 如果访问的是一个数组， 则会遍历这个数组， 收集数组元素的依赖
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      // 当改变obj的属性是，就会调用setter方法。这是就会调用dep.notify方法进行通知
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 新旧值相等 或 新旧值都等于NaN时
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 对新值进行观测
      childOb = !shallow && observe(newVal)
      // 当响应式属性发生修改时，通过dep对象通知依赖的vue实例进行更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
/**
 * 向响应式对象中添加一个 property
 * @param {将要被添加属性的对象} target 
 * @param {要添加属性的键名} key 
 * @param {要添加属性的值} val 
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  // 判断在开发环境，如果 `set` 函数的第一个参数是 `undefined` 或 `null` 或者是原始类型值，则警告信息
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // `target` 是一个数组，并且 `key` 是一个有效的数组索引
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 修改数组的长度
    target.length = Math.max(target.length, key)
    // 就利用了 splice 替换元素的能力，将指定位置元素的值替换为新值
    target.splice(key, 1, val)
    return val
  }
  // `key` 在 `target` 对象上，或在 `target` 的原型链上，同时必须不能在 `Object.prototype` 上
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  // 被观测的数据对象是`Vue` 实例对象或被观测的数据对象是否是根数据对象
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // `target.__ob__` 不存在，说明 target 是非响应的
  if (!ob) {
    target[key] = val
    return val
  }
  // 保证新添加的属性是响应式的
  defineReactive(ob.value, key, val)
  // 触发响应
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
/**
 * 删除对象的 property
 * @param {将要被删除属性的对象} target 
 * @param {要删除属性的键名} key 
 */
export function del (target: Array<any> | Object, key: any) {
  // 检测 `target` 是否是 `undefined` 或 `null` 或者是原始类型值，如果是的话那么在非生产环境下会打印警告信息
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 删除数组元素
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  // 不允许删除Vue对象和根数据的属性
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 判断属性是否对象上的自有属性
  if (!hasOwn(target, key)) {
    return
  }
  // 删除属性
  delete target[key]
  // ob不存在，说明不是响应式的，直接返回
  if (!ob) {
    return
  }
  // 触发响应
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
/**
 * 递归数组收集依赖
 * @param {数组} value 
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
