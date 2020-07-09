/* @flow */

import { _Set as Set, isObject } from '../util/index'
import type { SimpleSet } from '../util/index'
import VNode from '../vdom/vnode'

// 实例化set对象
const seenObjects = new Set()

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
/**
 * 为 seenObjects 深度收集val 中的key
 * @param {监听的值} val 
 */
export function traverse (val: any) {
  _traverse(val, seenObjects)
  // 清除set
  seenObjects.clear()
}

/**
 * 收集依赖
 * @param {监听的值} val 
 * @param {set} seen 
 */
function _traverse (val: any, seen: SimpleSet) {
  let i, keys
  const isA = Array.isArray(val)
  // val不是数组并且不是对象或val被冻结或val是VNode，直接返回
  // Object.isFrozen参考：
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  // val存在__ob__属性，即val是响应式数据
  // 避免循环引用造成的死循环的解决方案
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) { // 数组情况
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else { // 对象情况
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
