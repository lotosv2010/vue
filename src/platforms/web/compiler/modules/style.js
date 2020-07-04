/* @flow */

import { parseText } from 'compiler/parser/text-parser'
import { parseStyleText } from 'web/util/style'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from 'compiler/helpers'

/**
 * 对 style 属性进行扩展
 * 例如：<div :class="classObject" class="list" style="color:red;"> {{ val }} </div>
 * @param {元素描述对象} el 
 * @param {编译器的选项} options 
 */
function transformNode (el: ASTElement, options: CompilerOptions) {
  // 获取打印警告信息函数
  const warn = options.warn || baseWarn
  // 获取 style 属性的值，例如 staticStyle = 'color:red;'
  const staticStyle = getAndRemoveAttr(el, 'style')
  if (staticStyle) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      const res = parseText(staticStyle, options.delimiters)
      if (res) {
        warn(
          `style="${staticStyle}": ` +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div style="{{ val }}">, use <div :style="val">.',
          el.rawAttrsMap['style']
        )
      }
    }
    // parseStyleText 字符串解析为对象形式
    // JSON.stringify 函数将对象变为字符串
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle))
  }

  // 获取到绑定的 style 属性值
  const styleBinding = getBindingAttr(el, 'style', false /* getStatic */)
  if (styleBinding) {
    // 将其赋值给元素描述对象的 el.styleBinding 属性
    el.styleBinding = styleBinding
  }
}

/**
 * 处理 style 或 :style 属性
 * @param {AST 树} el 
 */
function genData (el: ASTElement): string {
  let data = ''
  if (el.staticStyle) {
    data += `staticStyle:${el.staticStyle},`
  }
  if (el.styleBinding) {
    data += `style:(${el.styleBinding}),`
  }
  return data
}

export default {
  staticKeys: ['staticStyle'],
  transformNode,
  genData
}
