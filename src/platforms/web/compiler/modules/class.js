/* @flow */

import { parseText } from 'compiler/parser/text-parser'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from 'compiler/helpers'

/**
 * 对 class 属性进行扩展
 * 例如：<div :class="classObject" class="list" style="color:red;"> {{ val }} </div>
 * @param {元素描述对象} el 
 * @param {编译器的选项} options 
 */
function transformNode (el: ASTElement, options: CompilerOptions) {
  // 获取打印警告信息函数
  const warn = options.warn || baseWarn
  // 获取class属性的值，例如 staticClass = 'list'
  const staticClass = getAndRemoveAttr(el, 'class')
  if (process.env.NODE_ENV !== 'production' && staticClass) {
    const res = parseText(staticClass, options.delimiters)
    if (res) {
      warn(
        `class="${staticClass}": ` +
        'Interpolation inside attributes has been removed. ' +
        'Use v-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.',
        el.rawAttrsMap['class']
      )
    }
  }
  // 非绑定的 class 属性，例如 el.staticClass = '"list"'
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass)
  }
  // 绑定的 class 属性，例如 el.classBinding = 'classObject'
  const classBinding = getBindingAttr(el, 'class', false /* getStatic */)
  if (classBinding) {
    el.classBinding = classBinding
  }
}

/**
 * 处理 class 或 :class属性
 * @param {AST 树} el 
 */
function genData (el: ASTElement): string {
  let data = ''
  if (el.staticClass) {
    data += `staticClass:${el.staticClass},`
  }
  if (el.classBinding) {
    data += `class:${el.classBinding},`
  }
  return data
}

export default {
  staticKeys: ['staticClass'],
  transformNode,
  genData
}
