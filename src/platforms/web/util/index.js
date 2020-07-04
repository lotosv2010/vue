/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */
export function query (el: string | Element): Element {
  if (typeof el === 'string') { // 字符串的情况
    const selected = document.querySelector(el) // html5获取dom元素
    if (!selected) { // dom不存在并且在开发环境报下面警告，并返回一个新创建的div元素
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else { // dom的情况
    return el
  }
}
