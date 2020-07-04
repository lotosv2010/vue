/* @flow */

/**
 * Expand input[v-model] with dynamic type bindings into v-if-else chains
 * Turn this:
 *   <input v-model="data[type]" :type="type">
 * into this:
 *   <input v-if="type === 'checkbox'" type="checkbox" v-model="data[type]">
 *   <input v-else-if="type === 'radio'" type="radio" v-model="data[type]">
 *   <input v-else :type="type" v-model="data[type]">
 */

import {
  addRawAttr,
  getBindingAttr,
  getAndRemoveAttr
} from 'compiler/helpers'

import {
  processFor,
  processElement,
  addIfCondition,
  createASTElement
} from 'compiler/parser/index'

/**
 * 对元素描述对象做前置处理，预处理使用了 v-model 属性并且使用了绑定的 type 属性的 input 标签
 * @param {元素描述对象} el 
 * @param {编译器的选项} options 
 */
function preTransformNode (el: ASTElement, options: CompilerOptions) {
  if (el.tag === 'input') {
    const map = el.attrsMap
    // 判断标签没有使用 v-model 属性
    if (!map['v-model']) {
      return
    }

    let typeBinding
    // 获取绑定的type属性
    // 例如：<input v-model="val" :type="inputType" />
    if (map[':type'] || map['v-bind:type']) {
      typeBinding = getBindingAttr(el, 'type')
    }
    // 标签没有使用非绑定的 type 属性，并且也没有使用 v-bind: 或 : 绑定 type 属性，并且开发者使用了 v-bind
    // 例如：<input v-model="val" v-bind="{ type: inputType }" />
    if (!map.type && !typeBinding && map['v-bind']) {
      typeBinding = `(${map['v-bind']}).type`
    }

    if (typeBinding) {
      // 例如：<input v-model="val" :type="inputType" v-if="display" />
      // ifCondition = 'display'
      // ifConditionExtra = '&&(display)'
      // hasElse = false
      // elseIfCondition = undefined
      const ifCondition = getAndRemoveAttr(el, 'v-if', true) 
      const ifConditionExtra = ifCondition ? `&&(${ifCondition})` : `` 
      const hasElse = getAndRemoveAttr(el, 'v-else', true) != null 
      const elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true) 
      // 1. checkbox
      // 克隆出一个原始标签的元素描述对象
      const branch0 = cloneASTElement(el)
      // process for on the main node
      processFor(branch0)
      // 将属性的名和值分别添加到元素描述对象的 el.attrsMap 对象以及 el.attrsList 数组中
      addRawAttr(branch0, 'type', 'checkbox')
      processElement(branch0, options)
      // 标识着当前元素描述对象已经被处理过了
      branch0.processed = true // prevent it from double-processed
      // 元素描述对象添加了 `el.if` 属性，例如：(${inputType})==='checkbox'&&display
      branch0.if = `(${typeBinding})==='checkbox'` + ifConditionExtra
      // 标签的元素描述对象被添加到其自身的 el.ifConditions 数组中
      addIfCondition(branch0, {
        exp: branch0.if,
        block: branch0
      })
      // 2. add radio else-if condition
      const branch1 = cloneASTElement(el)
      // 移除 v-for指令，在上面已经通过 processFor 处理过了
      getAndRemoveAttr(branch1, 'v-for', true)
      addRawAttr(branch1, 'type', 'radio')
      processElement(branch1, options)
      addIfCondition(branch0, {
        exp: `(${typeBinding})==='radio'` + ifConditionExtra,
        block: branch1
      })
      // 3. other
      const branch2 = cloneASTElement(el)
      getAndRemoveAttr(branch2, 'v-for', true)
      addRawAttr(branch2, ':type', typeBinding)
      processElement(branch2, options)
      addIfCondition(branch0, {
        exp: ifCondition,
        block: branch2
      })

      if (hasElse) {
        branch0.else = true
      } else if (elseIfCondition) {
        branch0.elseif = elseIfCondition
      }

      return branch0
    }
  }
}

/**
 * 创建出一个元素描述对象
 * @param {元素描述对象} el 
 */
function cloneASTElement (el) {
  // 创建出一个元素描述对象
  // 由于 el.attrsList 数组是引用类型，所以为了避免克隆的元素描述对象与原始描述对象互相干扰，所以需要使用数组的 slice 方法复刻出一个新的 el.attrList 数组
  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

export default {
  preTransformNode
}
