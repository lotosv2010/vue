/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'
// 缓存数组原型
const arrayProto = Array.prototype
// 以数组构造函数的原型创建一个新对象
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 缓存了数组原本的变异方法
  const original = arrayProto[method]
  // 使用 def 函数在 arrayMethods 上定义与数组变异方法同名的函数，在函数体内优先调用了缓存下来的数组变异方法
  def(arrayMethods, method, function mutator (...args) {
    // 执行数组原本的变异方法
    const result = original.apply(this, args)
    // 此时的 this 就是数组本身
    const ob = this.__ob__
    // 保存那些被新添加进来的数组元素
    let inserted
    // 增加元素的操作
    // 因为新增加的元素是非响应式的，所以我们需要获取到这些新元素，并将其变为响应式数据才行，而这就是上面代码的目的
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 调用 observeArray 函数对其进行观测
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
