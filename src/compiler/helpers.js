/* @flow */

import { emptyObject } from 'shared/util'
import { parseFilters } from './parser/filter-parser'

type Range = { start?: number, end?: number };

/* eslint-disable no-unused-vars */
export function baseWarn (msg: string, range?: Range) {
  console.error(`[Vue compiler]: ${msg}`)
}
/* eslint-enable no-unused-vars */

/**
 * 从第一个参数中"采摘"出函数名字与第二个参数所指定字符串相同的函数，并将它们组成一个数组
 * @param {*} modules 
 * @param {*} key 
 */
export function pluckModuleFunction<F: Function> (
  modules: ?Array<Object>,
  key: string
): Array<F> {
  return modules
    ? modules.map(m => m[key]).filter(_ => _) // filter是为了过滤掉 undefined
    : []
}

export function addProp (el: ASTElement, name: string, value: string, range?: Range, dynamic?: boolean) {
  (el.props || (el.props = [])).push(rangeSetItem({ name, value, dynamic }, range))
  el.plain = false
}

/**
 * 将属性与属性对应的字符串值添加到元素描述对象的 el.attrs 或 el.dynamicAttrs 数组中。
 * @param {当前元素描述对象} el 
 * @param {绑定属性的名字} name 
 * @param {绑定属性的值} value 
 * @param {范围，即在el.attrsList中对应的属性值} range 
 * @param {是否是动态属性} dynamic 
 */
export function addAttr (el: ASTElement, name: string, value: any, range?: Range, dynamic?: boolean) {
  const attrs = dynamic
    ? (el.dynamicAttrs || (el.dynamicAttrs = []))
    : (el.attrs || (el.attrs = []))
  attrs.push(rangeSetItem({ name, value, dynamic }, range))
  el.plain = false
}

// add a raw attr (use this in preTransforms)
/**
 * 将属性的名和值分别添加到元素描述对象的 el.attrsMap 对象以及 el.attrsList 数组中
 * @param {当前元素描述对象} el 
 * @param {绑定属性的名字} name 
 * @param {绑定属性的值} value 
 * @param {范围，即在el.attrsList中对应的属性值å} range 
 */
export function addRawAttr (el: ASTElement, name: string, value: any, range?: Range) {
  el.attrsMap[name] = value
  el.attrsList.push(rangeSetItem({ name, value }, range))
}

/**
 * 在元素描述对象上添加 `el.directives` 属性的
 * @param {当前元素描述对象} el 
 * @param {绑定属性的名字，即指令名称} name 
 * @param {绑定属性的原始名称} rawName 
 * @param {绑定属性的值} value 
 * @param {参数} arg 
 * @param {是否是动态属性} isDynamicArg 
 * @param {指令修饰符对象} modifiers 
 * @param {范围，即在el.attrsList中对应的属性值} range 
 */
export function addDirective (
  el: ASTElement,
  name: string,
  rawName: string,
  value: string,
  arg: ?string,
  isDynamicArg: boolean,
  modifiers: ?ASTModifiers,
  range?: Range
) {
  (el.directives || (el.directives = [])).push(rangeSetItem({
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers
  }, range))
  el.plain = false
}

/**
 * 前置修饰标记
 * @param {标示符} symbol 
 * @param {绑定属性的名字，即事件名称} name 
 * @param {是否是动态属性} dynamic 
 */
function prependModifierMarker (symbol: string, name: string, dynamic?: boolean): string {
  // 如果动态属性则返回，例如 _p(click,!)，如果不是动态属性则返回 ！click
  return dynamic
    ? `_p(${name},"${symbol}")`
    : symbol + name // mark the event as captured
}

/**
 * 在当前元素描述对象上添加事件侦听器，实际上就是将事件名称与该事件的侦听函数添加到元素描述对象的 el.events 属性或 el.nativeEvents 属性中
 * @param {当前元素描述对象} el 
 * @param {绑定属性的名字，即事件名称} name 
 * @param {绑定属性的值，这个值有可能是事件回调函数名字，有可能是内联语句，有可能是函数表达式} value 
 * @param {指令修饰符对象} modifiers 
 * @param {可选参数，是一个布尔值，代表着添加的事件侦听函数的重要级别，如果为 true，则该侦听函数会被添加到该事件侦听函数数组的头部，否则会将其添加到尾部} important 
 * @param {打印警告信息的函数，是一个可选参数} warn 
 * @param {范围，即在el.attrsList中对应的属性值} range 
 * @param {是否是动态属性} dynamic 
 */
export function addHandler (
  el: ASTElement,
  name: string,
  value: string,
  modifiers: ?ASTModifiers,
  important?: boolean,
  warn?: ?Function,
  range?: Range,
  dynamic?: boolean
) {
  modifiers = modifiers || emptyObject
  // warn prevent and passive modifier
  /* istanbul ignore if */
  // 提示开发者 passive 修饰符不能和 prevent 修饰符一起使用，
  // 这是因为在事件监听中 passive 选项参数就是用来告诉浏览器该事件监听函数是不会阻止默认行为的
  if (
    process.env.NODE_ENV !== 'production' && warn &&
    modifiers.prevent && modifiers.passive
  ) {
    warn(
      'passive and prevent can\'t be used together. ' +
      'Passive handler can\'t prevent default event.',
      range
    )
  }

  // normalize click.right and click.middle since they don't actually fire
  // this is technically browser-specific, but at least for now browsers are
  // the only target envs that have right/middle clicks.
  // 处理.right修饰符 - (2.2.0) 只当点击鼠标右键时触发
  if (modifiers.right) {
    if (dynamic) {
      // 例如 @click.right='handleClick'，此时name为 name = `(click)==='click'?'contextmenu':'click'`
      name = `(${name})==='click'?'contextmenu':(${name})`
    } else if (name === 'click') {
      name = 'contextmenu'
      delete modifiers.right
    }
  } else if (modifiers.middle) { // 处理.middle修饰符 - (2.2.0) 只当点击鼠标中键时触发
    if (dynamic) {
      // 例如 @click.middle='handleClick'，此时name为 name = `(click)==='click'?'mouseup':'click'`
      name = `(${name})==='click'?'mouseup':(${name})`
    } else if (name === 'click') {
      name = 'mouseup'
    }
  }

  // check capture modifier
  // 处理捕获
  if (modifiers.capture) {
    // 删除capture属性
    delete modifiers.capture
    // 如果动态属性则name为，例如 _p(click,!)，如果不是动态属性则name为, 例如 !click
    name = prependModifierMarker('!', name, dynamic)
  }
  // 处理只执行一次
  if (modifiers.once) {
    // 删除once属性
    delete modifiers.once
    // 如果动态属性则name为，例如 _p(click,~)，如果不是动态属性则name为, 例如 ~click
    name = prependModifierMarker('~', name, dynamic)
  }
  /* istanbul ignore if */
  // 处理passive
  if (modifiers.passive) {
    // 删除passive属性
    delete modifiers.passive
    // 如果动态属性则name为，例如 _p(click,&)，如果不是动态属性则name为, 例如 &click
    name = prependModifierMarker('&', name, dynamic)
  }

  let events
  if (modifiers.native) {
    // 删除了 modifiers.native 属性
    delete modifiers.native
    // 在元素描述对象上添加 el.nativeEvents 属性，初始值为一个空对象，并且 events 变量与 el.nativeEvents 属性具有相同的引用
    events = el.nativeEvents || (el.nativeEvents = {})
  } else {
    // native属性不存在则会在元素描述对象上添加 el.events 属性，它的初始值也是一个空对象，此时 events 变量的引用将与 el.events 属性相同
    events = el.events || (el.events = {})
  }

  // 给第一个对象参数添加开始结束位置
  const newHandler: any = rangeSetItem({ value: value.trim(), dynamic }, range)
  if (modifiers !== emptyObject) {
    // 修饰符不为空则给newHandler添加modifiers属性
    newHandler.modifiers = modifiers
  }

  const handlers = events[name]
  /* istanbul ignore if */
  if (Array.isArray(handlers)) {
    important ? handlers.unshift(newHandler) : handlers.push(newHandler)
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
  } else {
    events[name] = newHandler
  }

  el.plain = false
}

/**
 * el例如: 
 * rawAttrsMap: {ref: {name: "ref", value: "child", start: 76, end: 87}}
 * @param {AST树} el 
 * @param {例如:key,ref,slot,name,is等} name 
 */
export function getRawBindingAttr (
  el: ASTElement,
  name: string
) {
  // 例如: el.rawAttrsMap[`:key`] 或 el.rawAttrsMap[`v-bind:key`] 或 el.rawAttrsMap[`key`]
  return el.rawAttrsMap[':' + name] ||
    el.rawAttrsMap['v-bind:' + name] ||
    el.rawAttrsMap[name]
}

/**
 * 获取:属性 或者v-bind:属性，并且返回获取到属性的值
 * @param {AST树} el 
 * @param {对应的属性名，例如:key,ref,slot,name,is等} name 
 * @param {} getStatic 
 */
export function getBindingAttr (
  el: ASTElement,
  name: string,
  getStatic?: boolean
): ?string {
  // 从元素描述对象的 attrsList 数组中获取到属性名字为参数 name 的值所对应的属性值，并赋值给变量 dynamicValue 
  const dynamicValue =
    getAndRemoveAttr(el, ':' + name) ||
    getAndRemoveAttr(el, 'v-bind:' + name)
  if (dynamicValue != null) { // 存在的情况
    return parseFilters(dynamicValue)
  } else if (getStatic !== false) { // 当不传递第三个参数时
    // 用来获取非绑定的属性值
    const staticValue = getAndRemoveAttr(el, name)
    if (staticValue != null) {
       // 转换成字符串,够保证对于非绑定的属性来讲，总是会将该属性的值作为字符串处理
      return JSON.stringify(staticValue)
    }
  }
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
/**
 * 移除传进来的属性name，并且返回获取到属性的值
 * @param {AST树} el 
 * @param {属性名称} name 
 * @param {是否要删除属性的标志} removeFromMap 
 */
export function getAndRemoveAttr (
  el: ASTElement,
  name: string,
  removeFromMap?: boolean
): ?string {
  let val
  // el.attrsMap，例如 attrsMap: {ref: "child"}
  if ((val = el.attrsMap[name]) != null) {
    // attrsList: [{name: "ref", value: "child", start: 76, end: 87}]
    const list = el.attrsList
    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1) // 删除数组中对应数据项
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name] // 删除对象中对应的属性
  }
  return val
}

/**
 * 获取通过正则匹配绑定的 attr 值
 * @param {AST树} el 
 * @param {属性名} name 
 */
export function getAndRemoveAttrByRegex (
  el: ASTElement,
  name: RegExp
) {
  const list = el.attrsList
  for (let i = 0, l = list.length; i < l; i++) {
    const attr = list[i]
    // 例如：匹配到 'v-slot' 或者 'v-slot:xxx' 则会返回其对应的 attr
    if (name.test(attr.name)) {
      list.splice(i, 1) // // 删除数组中对应数据项
      return attr
    }
  }
}

/**
 * 给item添加开始结束位置，例如@click="clickItem(index)"
 * @param {例如：{value: clickItem(index),dynamic: false}} item 
 * @param {例如：{name: "@click", value: "clickItem(index)", start: 99, end: 124}} range 
 */
function rangeSetItem (
  item: any,
  range?: { start?: number, end?: number }
) {
  if (range) {
    if (range.start != null) {
      item.start = range.start
    }
    if (range.end != null) {
      item.end = range.end
    }
  }
  return item
}
