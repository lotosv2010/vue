/* @flow */

import { cached, extend, toObject } from 'shared/util'

/**
 * 字符串解析为对象形式
 * 例如：<div style="color: red; background: green;"></div>
 */
export const parseStyleText = cached(function (cssText) {
  const res = {}
  // 样式字符串中分号(;)用来作为每一条样式规则的分割
  const listDelimiter = /;(?![^(]*\))/g
  // 冒号(:)则用来一条样式规则中属性名与值的分割
  const propertyDelimiter = /:(.+)/
  // 分割字符串，例如：[ 'color: red', 'background: green']
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      // 分割字符串，例如：[ 'color', 'red']
      const tmp = item.split(propertyDelimiter)
      // 给res添加属性，例如：res['color'] = 'red'
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim())
    }
  })
  return res
})

// merge static and dynamic style data on the same vnode
function normalizeStyleData (data: VNodeData): ?Object {
  const style = normalizeStyleBinding(data.style)
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
export function normalizeStyleBinding (bindingStyle: any): ?Object {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
export function getStyle (vnode: VNodeWithData, checkChild: boolean): Object {
  const res = {}
  let styleData

  if (checkChild) {
    let childNode = vnode
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode
      if (
        childNode && childNode.data &&
        (styleData = normalizeStyleData(childNode.data))
      ) {
        extend(res, styleData)
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData)
  }

  let parentNode = vnode
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData)
    }
  }
  return res
}
