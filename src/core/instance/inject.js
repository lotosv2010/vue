/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

/**
 * 初始化provide
 * @param {vue实例} vm 
 */
export function initProvide (vm: Component) {
  const provide = vm.$options.provide // 尝试获取provide
  // 如果provide存在,当它是函数时执行该返回，
  // 否则直接将provide保存到Vue实例的_provided属性
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

/**
 * 初始化inject
 * @param {vue实例} vm 
 */
export function initInjections (vm: Component) {
  // provide 和 inject 主要为高阶插件/组件库提供用例。并不推荐直接用于应用程序代码中。
  // 这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深，并在起上下游关系成立的时间里始终生效。如果你熟悉 React，这与 React 的上下文特性很相似。
  // 更多详情信息https://cn.vuejs.org/v2/api/#provide-inject
  const result = resolveInject(vm.$options.inject, vm) // 遍历祖先节点，获取对应的inject,例如:比如:{foo: "bar"}
  if (result) { // 如果获取了对应的值，则将它变成响应式
    toggleObserving(false)
    // 注入的值不能修改，相当于props属性一样
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}

/**
 * 解析注入对象，获取注入key对应的值
 * @param {注入对象，inject:例如:{foo: {from: "foo"}}} inject 
 * @param {vue实例} vm 
 */
export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) { // 如果inject非空
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null) // 存储最后的结果
    // Reflect.ownKeys参考：
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys
    const keys = hasSymbol // 判断是否支持Symbol 数据类型
      ? Reflect.ownKeys(inject) // 如果有符号类型，调用Reflect.ownKeys()返回所有的key
      : Object.keys(inject) // 获取所有的key，此时keys就是个字符串数组,比如:["foo"]

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] // 获取注入的key
      // #6574 in case the inject object is observed...
      if (key === '__ob__') continue
      const provideKey = inject[key].from // normalized[3]={from: 3} 获取key的值
      let source = vm
      while (source) {
        // 如果source存在_provided 且 含有provideKey这个属性
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey] //获取值，将值保存到result[key]中
          break
        }
        // 否则将source赋值给父Vue实例，直到找到对应的providekey为止
        source = source.$parent
      }
      // 如果最后source不存在，即没有从当前实例或祖先实例的_provide找到privideKey这个key
      if (!source) {
        // 判断default key存在inject[key]中么
        if ('default' in inject[key]) {
          // 如果存在则获取默认default的值
          const provideDefault = inject[key].default
          // 如果是函数则执行
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    return result
  }
}
