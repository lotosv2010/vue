/* @flow */

import he from 'he'
import { parseHTML } from './html-parser'
import { parseText } from './text-parser'
import { parseFilters } from './filter-parser'
import { genAssignmentCode } from '../directives/model'
import { extend, cached, no, camelize, hyphenate } from 'shared/util'
import { isIE, isEdge, isServerRendering } from 'core/util/env'

import {
  addProp,
  addAttr,
  baseWarn,
  addHandler,
  addDirective,
  getBindingAttr,
  getAndRemoveAttr,
  getRawBindingAttr,
  pluckModuleFunction,
  getAndRemoveAttrByRegex
} from '../helpers'

export const onRE = /^@|^v-on:/
export const dirRE = process.env.VBIND_PROP_SHORTHAND
  ? /^v-|^@|^:|^\.|^#/
  : /^v-|^@|^:|^#/
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g
const dynamicArgRE = /^\[.*\]$/

const argRE = /:(.*)$/
export const bindRE = /^:|^\.|^v-bind:/
const propBindRE = /^\./
const modifierRE = /\.[^.\]]+(?=[^\]]*$)/g
// 匹配到 'v-slot' 或 'v-slot:' 或 '#xxx' 则为 true
const slotRE = /^v-slot(:|$)|^#/

const lineBreakRE = /[\r\n]/
const whitespaceRE = /\s+/g

const invalidAttributeRE = /[\s"'<>\/=]/

const decodeHTMLCached = cached(he.decode)

export const emptySlotScopeToken = `_empty_`

// configurable state
export let warn: any
let delimiters
let transforms
let preTransforms
let postTransforms
let platformIsPreTag
let platformMustUseProp
let platformGetTagNamespace
let maybeComponent

/**
 * 创建一个元素的描述对象
 * @param {标签名} tag 
 * @param {标签拥有的属性数组} attrs 
 * @param {父标签描述对象} parent 
 */
export function createASTElement (
  tag: string,
  attrs: Array<ASTAttr>,
  parent: ASTElement | void
): ASTElement {
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent,
    children: []
  }
}

/**
 * Convert HTML string to AST.
 */
/**
 * HTML字符串转换为AST
 * @param {html 模板} template 
 * @param {配置信息} options 
 */
export function parse (
  template: string,
  options: CompilerOptions
): ASTElement | void {
  warn = options.warn || baseWarn // 警告日志函数

  platformIsPreTag = options.isPreTag || no // 判断标签是否是 pre 如果是则返回真
  /** mustUseProp 校验属性
   * 1. attr === 'value', tag 必须是 'input,textarea,option,select,progress' 其中一个 type !== 'button'
   * 2. attr === 'selected' && tag === 'option'
   * 3. attr === 'checked' && tag === 'input'
   * 4. attr === 'muted' && tag === 'video'
   * 的情况下为真
   **/
  platformMustUseProp = options.mustUseProp || no
  // 来获取元素(标签)的命名空间
  platformGetTagNamespace = options.getTagNamespace || no
  // 判断标签是否是保留的标签
  const isReservedTag = options.isReservedTag || no 
  // 判断是否为组件
  maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag)

  // 循环过滤数组或者对象的值，根据key循环，过滤对象或者数组[key]值，如果不存在则丢弃，如果有相同多个的key值，返回多个值的数组
  transforms = pluckModuleFunction(options.modules, 'transformNode')
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

  // 改变纯文本插入分隔符。修改指令的书写风格，比如默认是{{mgs}}  delimiters: ['${', '}']之后变成这样 ${mgs}
  delimiters = options.delimiters

  // 是用来修正当前正在解析元素的父级
  const stack = []
  // 判断是否保留元素之间的空白
  const preserveWhitespace = options.preserveWhitespace !== false
  // 空白处理策略，`'preserve' | 'condense'` 
  const whitespaceOption = options.whitespace 
  let root  // 定义AST模型对象
  let currentParent // 当前父节点，描述对象之间的父子关系
  let inVPre = false // 标识当前解析的标签是否在拥有 v-pre 的标签之内
  let inPre = false // 标识当前正在解析的标签是否在 <pre></pre> 标签之内
  let warned = false // 标识只会打印一次警告信息，默认为 false

  /**
   * 警告日志函数
   * @param {警告信息} msg 
   * @param {范围} range 
   */
  function warnOnce (msg, range) {
    if (!warned) {
      warned = true
      warn(msg, range)
    }
  }

  /**
   * 关闭节点
   * @param {*} element 
   */
  function closeElement (element) {
    trimEndingWhitespace(element)
    // 元素不再 v-pre 中并且没有被处理过
    if (!inVPre && !element.processed) {
      // 解析 ast树
      element = processElement(element, options)
    }
    // tree management
    if (!stack.length && element !== root) {
      // allow root elements with v-if, v-else-if and v-else
      if (root.if && (element.elseif || element.else)) {
        if (process.env.NODE_ENV !== 'production') {
          // 检查当前元素是否符合作为根元素的要求
          checkRootConstraints(element)
        }
        // 将条件对象添加到 root.ifConditions 属性的数组中，此处针对 v-else-if and v-else
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        })
      } else if (process.env.NODE_ENV !== 'production') {
        warnOnce(
          `Component template should contain exactly one root element. ` +
          `If you are using v-if on multiple elements, ` +
          `use v-else-if to chain them instead.`,
          { start: element.start }
        )
      }
    }
    // 当前元素存在父级(`currentParent`)，并且当前元素不是被禁止的元素
    if (currentParent && !element.forbidden) {
      // 如果有elseif或者else属性的时候
      if (element.elseif || element.else) {
        // 找到上一个兄弟节点，如果上一个兄弟节点是if，则下一个兄弟节点则是elseif或else
        processIfConditions(element, currentParent)
      } else {
        // scoped slot 作用域的槽存在
        if (element.slotScope) {
          // scoped slot
          // keep it in the children list so that v-else(-if) conditions can
          // find it as the prev node.
          // 获取slotTarget作用域标签，如果获取不到则定义为default
          const name = element.slotTarget || '"default"'
          ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
        }
        // 把当前元素描述对象添加到父级元素描述对象(currentParent)的 children 数组中
        currentParent.children.push(element)
        // 当前元素对象的 parent 属性指向父级元素对象
        element.parent = currentParent
      }
    }

    // final children cleanup
    // filter out scoped slots
    // 过滤掉作用域插槽
    element.children = element.children.filter(c => !(c: any).slotScope)
    // remove trailing whitespace node again
    // 删除尾部空白节点
    trimEndingWhitespace(element)

    // check pre state
    // 如果标签有pre属性，inVPre设置为false
    if (element.pre) {
      inVPre = false
    }
    // 判断标签是否是pre 如果是则返回真
    if (platformIsPreTag(element.tag)) {
      inPre = false
    }
    // apply post-transforms
    for (let i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options)
    }
  }

  /**
   * 删除尾部空白节点
   * 例如：<div><input type="text" v-model="val"> </div>
   * @param {vnode} el 
   */
  function trimEndingWhitespace (el) {
    // remove trailing whitespace node
    if (!inPre) {
      let lastNode
      while (
        // 循环children，删除尾部空白节点
        (lastNode = el.children[el.children.length - 1]) && // children存在
        lastNode.type === 3 && // 节点类型为文本
        lastNode.text === ' ' // 节点内容为空字符
      ) {
        // 从children的数组尾部删除
        el.children.pop()
      }
    }
  }

  /**
   * 校验根节点
   * @param {vnode} el 
   */
  function checkRootConstraints (el) {
    if (el.tag === 'slot' || el.tag === 'template') { // 根节点不能为 slot 或 template 标签
      warnOnce(
        `Cannot use <${el.tag}> as component root element because it may ` +
        'contain multiple nodes.',
        { start: el.start }
      )
    }
    if (el.attrsMap.hasOwnProperty('v-for')) { // 根节点不能有 v-for 指令
      warnOnce(
        'Cannot use v-for on stateful component root element because ' +
        'it renders multiple elements.',
        el.rawAttrsMap['v-for']
      )
    }
  }

  // 主要的解析方法
  parseHTML(template, /* 字符串模板 */ {
    warn, // 警告日志函数
    expectHTML: options.expectHTML, // 标志是html,是true
    // 匹配标签是否是 'area,base,br,col,embed,frame,hr,img,input,isindex,keygen, link,meta,param,source,track,wbr'
    isUnaryTag: options.isUnaryTag,
    // 判断标签是否是 'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    // IE在属性值中编码换行，而其他浏览器则不会
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    // true chrome在a[href]中编码内容
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    // 当设为 true 时，将会保留且渲染模板中的 HTML 注释。默认行为是舍弃它们
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    /**
     * 标签开始函数， 
     * 创建一个ast标签dom，判断获取v-for属性是否存在如果有则转义 v-for指令把for，alias，iterator1，iterator2属性添加到虚拟dom中
     * 获取v-if属性，为el虚拟dom添加 v-if，v-eles，v-else-if 属性
     * 获取v-once 指令属性，如果有有该属性为虚拟dom标签标记事件只触发一次则销毁
     * 校验属性的值，为el添加muted， events，nativeEvents，directives，  key， ref，slotName或者slotScope或者slot，component或者inlineTemplate 属性
     * 标志当前的currentParent当前的 element
     * 为parse函数 stack标签堆栈 添加一个标签
     * @param {标签名称} tag 
     * @param {标签属性} attrs 
     * @param {标签是否是一元标签，如果不是则为真} unary 
     * @param {开始} start 
     * @param {结束} end 
     */
    start (tag, attrs, unary, start, end) {
      // check namespace.
      // inherit parent ns if there is one
      // 检查名称空间，如果有，继承父ns
      const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag) // 判断 tag 是否是svg或者math 标签

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') { // 如果是ie浏览器 并且是svg
        // 防止ie浏览器 svg 的 bug 替换属性含有NS+数字 去除 NS+数字
        attrs = guardIESVGBug(attrs)
      }

      // 创建一个ast标签dom
      let element: ASTElement = createASTElement(tag, attrs, currentParent)
      if (ns) { // 判断 tag 是否是svg或者math 标签
        element.ns = ns
      }

      if (process.env.NODE_ENV !== 'production') {
        if (options.outputSourceRange) { // 生产环境还是开发环境，开发环境为true
          element.start = start
          element.end = end
          // 将attrsList数组，转换成key为属性名，值为数组项的对象，例如
          /*
          "attrsList":[
            {
              "name":"v-for",
              "value":"(l, i) in list",
              "start":71,
              "end":93
            },{
              "name":":key",
              "value":"i",
              "start":94,
              "end":102
            },{
              "name":"@click",
              "value":"clickItem(index)",
              "start":103,
              "end":128
            }
          ]
          转换为：
          {
            :key: {name: ":key", value: "i", start: 94, end: 102},
            @click: {name: "@click", value: "clickItem(index)", start: 103, end: 128},
            v-for: {name: "v-for", value: "(l, i) in list", start: 71, end: 93}
          }
          */
          element.rawAttrsMap = element.attrsList.reduce((cumulated, attr) => {
            cumulated[attr.name] = attr
            return cumulated
          }, {})
        }
        attrs.forEach(attr => {
          if (invalidAttributeRE.test(attr.name)) {
            warn(
              `Invalid dynamic argument expression: attribute names cannot contain ` +
              `spaces, quotes, <, >, / or =.`,
              {
                start: attr.start + attr.name.indexOf(`[`),
                end: attr.start + attr.name.length
              }
            )
          }
        })
      }

      // isForbiddenTag：如果是style或者是是script 标签并且type属性不存在或者存在并且是javascript属性的时候返回真
      // isServerRendering：不是在服务器node环境下
      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true
        process.env.NODE_ENV !== 'production' && warn(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          `<${tag}>` + ', as they will not be parsed.',
          { start: element.start }
        )
      }

      // apply pre-transforms
      for (let i = 0; i < preTransforms.length; i++) {
        // preTransformNode把attrsMap与attrsList属性值转换添加到el   
        // ast虚拟dom中为虚拟dom添加for，alias，iterator1，iterator2， addRawAttr ，type ，key， ref，slotName或者slotScope或者slot，component或者inlineTemplate ， plain，if ，else，elseif 属性
        element = preTransforms[i](element, options) || element
      }

      // 如果标签没有 v-pre 指令
      if (!inVPre) {
        // 检查标签是否有v-pre 指令，含有 v-pre 指令的标签里面的指令则不会被编译
        processPre(element)
        if (element.pre) { // 标签是否含有 v-pre 指令
          inVPre = true // 如果标签有v-pre 指令，则标记为true
        }
      }
      // 判断标签是否是pre 如果是则返回真
      if (platformIsPreTag(element.tag)) {
        inPre = true
      }
      // v-pre 指令存在
      if (inVPre) {
        // 浅拷贝属性把虚拟dom的attrsList拷贝到attrs中,如果没有pre块，标记plain为true
        processRawAttrs(element)
      } else if (!element.processed) {
        // structural directives
        // 判断获取v-for属性是否存在如果有则转义 v-for指令，把for，alias，iterator1，iterator2属性添加到虚拟dom中
        processFor(element)
        // 获取v-if属性，为el虚拟dom添加 v-if，v-eles，v-else-if 属性
        processIf(element)
        // 获取v-once 指令属性，如果有有该属性，为虚拟dom标记事件只触发一次则销毁
        processOnce(element)
      }

      // 根节点不存在
      if (!root) {
        root = element
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(root)
        }
      }

      if (!unary) {
        currentParent = element
        // 为parse函数，stack标签堆栈添加一个标签
        stack.push(element)
      } else {
        // 关闭节点
        closeElement(element)
      }
    },

    /**
     * 为标签元素对象做闭环处理，
     * 从stack中删除AST模型对象，
     * 更新当前的parent对象等
     * @param {标签名称} tag 
     * @param {开始} start 
     * @param {结束} end 
     */
    end (tag, start, end) {
      // 读取 stack 栈中的最后一个元素
      const element = stack[stack.length - 1]
      // pop stack
      // 节点出栈
      stack.length -= 1
      // 读取出栈后 stack 栈中的最后一个元素
      currentParent = stack[stack.length - 1]
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        // 设置 end 位置
        element.end = end
      }
      // 关闭
      closeElement(element)
    },

    /**
     * 字符处理
     * @param {文本} text 
     * @param {开始} start 
     * @param {结束} end 
     */
    chars (text: string, start: number, end: number) {
      // 判断是否有当前的父节点
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.',
              { start }
            )
          } else if ((text = text.trim())) {
            warnOnce(
              `text "${text}" outside root element will be ignored.`,
              { start }
            )
          }
        }
        return
      }
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE && // 如果是ie
        currentParent.tag === 'textarea' && // 如果父节点是textarea
        currentParent.attrsMap.placeholder === text // 如果他的html5 用户信息提示和当前的文本一样
      ) {
        return
      }
      // 获取到同级的兄弟节点
      const children = currentParent.children
      // 判断标签是否是pre 如果是则返回真，则不需要去空格
      if (inPre || text.trim()) {
        // isTextTag：判断标签是否是script或者是style
        // decodeHTMLCached：获取真是dom的textContent文本
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
      } else if (!children.length) {
        // remove the whitespace-only node right after an opening tag
        text = ''
      } else if (whitespaceOption) { // 空白符处理策略
        if (whitespaceOption === 'condense') {
          // in condense mode, remove the whitespace node if it contains
          // line break, otherwise condense to a single space
          // lineBreakRE匹配换行符或回车符
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        // preserveWhitespace是否保留空白符
        text = preserveWhitespace ? ' ' : ''
      }
      if (text) {
        if (!inPre && whitespaceOption === 'condense') {
          // condense consecutive whitespaces into single space
          // 将连续空白压缩为单个空格
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        let child: ?ASTNode
        // 包含表达式的text
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
          }
        // 纯文本的text
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text
          }
        }
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start
            child.end = end
          }
          children.push(child)
        }
      }
    },
    /**
     * 把text添加到属性节点或者添加到注释节点，ast模板数据
     * @param {文本} text 
     * @param {开始} start 
     * @param {结束} end 
     */
    comment (text: string, start, end) {
      // adding anyting as a sibling to the root node is forbidden
      // comments should still be allowed, but ignored
      if (currentParent) {
        const child: ASTText = {
          type: 3,
          text,
          isComment: true
        }
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          child.start = start
          child.end = end
        }
        currentParent.children.push(child)
      }
    }
  })
  // 返回AST
  return root
}

/**
 * 获取给定元素 v-pre 属性的值，如果 v-pre 属性的值不等于 null 则会在元素描述对象上添加 .pre 属性，并将其值设置为 true
 * @param {元素AST树} el 
 */
function processPre (el) {
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true
  }
}

/**
 * 在元素的描述对象上添加 element.attrs 属性
 * @param {元素AST树} el 
 */
function processRawAttrs (el) {
  const list = el.attrsList
  const len = list.length
  if (len) {
    const attrs: Array<ASTAttr> = el.attrs = new Array(len)
    for (let i = 0; i < len; i++) {
      attrs[i] = {
        name: list[i].name,
        value: JSON.stringify(list[i].value)
      }
      if (list[i].start != null) {
        attrs[i].start = list[i].start
        attrs[i].end = list[i].end
      }
    }
  } else if (!el.pre) {
    // non root node in pre blocks with no attributes
    // 如果一个标签没有任何属性，并且该标签是使用了 v-pre 指令标签的子代标签，那么该标签的元素描述对象将被添加 element.plain 属性，并且其值为 true
    el.plain = true
  }
}

/**
 * 解析 ast树
 * 为el添加 muted，events，nativeEvents，directives，key，ref，slotName
 * 或者slotScope或者slot，component或者inlineTemplate 标志属性
 * @param {元素AST树} element 
 * @param {配置项} options 
 */
export function processElement (
  element: ASTElement,
  options: CompilerOptions
) {
  // 获取属性key值，校验key 是否放在template 标签上面,为el 虚拟dom添加 key属性
  processKey(element)

  // determine whether this is a plain element after
  // removing structural attributes
  // 确定这是否是一个普通元素
  // 删除结构属性
  element.plain = (
    !element.key && //如果没有key 
    !element.scopedSlots && //也没有作用域插槽
    !element.attrsList.length // 也没有属性
  )

  // 获取属性ref值，并且判断ref 是否含有v-for指令,为el 虚拟dom添加 ref属性
  processRef(element)
  // 
  processSlotContent(element)
  // 检查插槽作用域，为el虚拟dom添加 slotName或者slotScope或者slot
  processSlotOutlet(element)
  // 判断虚拟dom 是否有 :is属性，是否有inline-template 内联模板属性,如果有则标记下,为el 虚拟dom 添加component属性或者inlineTemplate 标志
  processComponent(element)
  // 转换数据
  for (let i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element
  }
  // 检查属性，为虚拟dom属性转换成对应需要的虚拟dom vonde数据,为el虚拟dom 添加muted， events，nativeEvents，directives
  processAttrs(element)
  return element
}

/**
 * 解析key
 * 获取属性key值，校验key 是否放在template 标签上面,为el 虚拟dom添加 key属性
 * @param {元素AST树} el 
 */
function processKey (el) {
  // 从元素描述对象的 attrsList 数组中获取到属性名字为 key 的属性值，并将值赋值给 exp 常量
  const exp = getBindingAttr(el, 'key')
  if (exp) {
    if (process.env.NODE_ENV !== 'production') {
      if (el.tag === 'template') {
        warn(
          `<template> cannot be keyed. Place the key on real elements instead.`,
          getRawBindingAttr(el, 'key')
        )
      }
      if (el.for) {
        const iterator = el.iterator2 || el.iterator1
        const parent = el.parent
        if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
          warn(
            `Do not use v-for index as key on <transition-group> children, ` +
            `this is the same as not using keys.`,
            getRawBindingAttr(el, 'key'),
            true /* tip */
          )
        }
      }
    }
    el.key = exp
  }
}

/**
 * 处理el中ref属性
 * 获取属性ref值，并且判断 ref 否存在于 v-for 指令之内,为 el 虚拟dom添加 ref 和 refInFor 属性
 * @param {元素AST树} el 
 */
function processRef (el) {
  // 校验ref，并获取ref属性
  const ref = getBindingAttr(el, 'ref')
  if (ref) {
    el.ref = ref // 保存到el.ref里面
    // 检查是否在v-for循环内，将结果保存到el.refInfor里面
    el.refInFor = checkInFor(el)
  }
}

/**
 * 处理el中v-for
 * 例如 exp 为：(l, i) in list
 * @param {元素AST树} el 
 */
export function processFor (el: ASTElement) {
  let exp
  // getAndRemoveAttr 移除name为v-for的属性，并且返回获取到v-for属性的值，例如 v-for="(l, i) in list" 获取到的exp 为 (l, i) in list
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    // 对 v-for 属性的值做解析
    // res = {alias: "l", for: "list", iterator1: "i"}
    const res = parseFor(exp)
    if (res) {
      // 将 res 常量中的属性混入当前元素的描述对象中
      extend(el, res)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(
        `Invalid v-for expression: ${exp}`,
        el.rawAttrsMap['v-for']
      )
    }
  }
}

type ForParseResult = {
  for: string;
  alias: string;
  iterator1?: string;
  iterator2?: string;
};

/**
 * 解析v-for
 * 例如 exp 为：(l, k, i) in list
 * @param {*} exp 
 */
export function parseFor (exp: string): ?ForParseResult {
  // 捕获的字符串数组为：["(l, k, i) in list", "(l, k, i)", "list"]
  const inMatch = exp.match(forAliasRE)
  // 没有捕获到直接返回undefined
  if (!inMatch) return
  const res = {}
  // res.for = 'list'
  res.for = inMatch[2].trim()
  // alias = 'l, k, i'
  const alias = inMatch[1].trim().replace(stripParensRE, '')
  // iteratorMatch = [',k,i', 'k', 'i']
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    // res.alias = 'l'
    res.alias = alias.replace(forIteratorRE, '').trim()
    // res.iterator1 = 'k'
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      // res.iterator2 = 'i'
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    // res.alias = 'l'
    res.alias = alias
  }
  return res
}

/**
 * 处理el中v-if v-else v-else-if
 * @param {*} el 
 */
function processIf (el) {
  // getAndRemoveAttr 移除name为v-if的属性，并且返回获取到v-if属性的值，例如 v-if="child === 1" 获取到的exp 为 child === 1
  const exp = getAndRemoveAttr(el, 'v-if')
  if (exp) {
    // 在元素描述对象上定义了 el.if 属性，并且该属性的值就是 v-if 指令的属性值
    el.if = exp
    // 将条件对象添加到 el.ifConditions 属性的数组中，此处针对 v-if
    addIfCondition(el, {
      exp: exp,
      block: el
    })
  } else {
    // 移除name为v-else的属性，并且返回空字符串即''
    if (getAndRemoveAttr(el, 'v-else') != null) {
      // 在元素描述对象上定义了 el.else 属性，并且该属性的值就是 true
      el.else = true
    }
    // 移除name为v-else-if的属性，并且返回获取到v-else-if属性的值，例如 v-else-if="child === 2" 获取到的exp 为 child === 2
    const elseif = getAndRemoveAttr(el, 'v-else-if')
    if (elseif) {
      // 在元素描述对象上定义了 el.elseif 属性，并且该属性的值就是 v-elseif 指令的属性值
      el.elseif = elseif
    }
  }
}

/**
 * 处理if条件
 * @param {*} el 
 * @param {*} parent 
 */
function processIfConditions (el, parent) {
  const prev = findPrevElement(parent.children)
  if (prev && prev.if) {
    // 将条件对象添加到 root.ifConditions 属性的数组中，此处针对 v-else-if and v-else
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    })
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `v-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
      `used on element <${el.tag}> without corresponding v-if.`,
      el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
    )
  }
}

/**
 * 找到当前元素的前一个元素描述对象
 * @param {当前元素} children 
 */
function findPrevElement (children: Array<any>): ASTElement | void {
  // 获取children的长度
  let i = children.length
  // 循环查找最后一个元素
  while (i--) {
    // 找到最后一个元素，并返回
    if (children[i].type === 1) {
      return children[i]
    } else {
      // 如果是非元素节点并且内容不为空，在开发环境报警告
      if (process.env.NODE_ENV !== 'production' && children[i].text !== ' ') {
        warn(
          `text "${children[i].text.trim()}" between v-if and v-else(-if) ` +
          `will be ignored.`,
          children[i]
        )
      }
      // 移除children数组的最后一个元素
      children.pop()
    }
  }
}

/**
 * v-if的条件数组添加
 * @param {*} el 
 * @param {*} condition 
 */
export function addIfCondition (el: ASTElement, condition: ASTIfCondition) {
  if (!el.ifConditions) {
    // 在元素描述对象上定义了 el.ifConditions 属性
    el.ifConditions = []
  }
  // 将条件对象添加到 el.ifConditions 属性的数组中
  el.ifConditions.push(condition)
}

/**
 * 解析v-once
 * @param {*} el 
 */
function processOnce (el) {
  // 移除name为v-once的属性，并且返回空字符串即''
  const once = getAndRemoveAttr(el, 'v-once')
  if (once != null) {
    // 在元素描述对象上定义了 el.once 属性，并且该属性的值就是 true
    el.once = true
  }
}

// handle content being passed to a component as slot,
// e.g. <template slot="xxx">, <div slot-scope="xxx">
/**
 * 解析slot
 * @param {*} el 
 */
function processSlotContent (el) {
  let slotScope
  if (el.tag === 'template') {
    // 移除 element.attrsList 对象中 name 为 scope 的属性，并且返回获取到 scope 属性的值赋值给变量 slotScope
    slotScope = getAndRemoveAttr(el, 'scope')
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && slotScope) {
      warn(
        `the "scope" attribute for scoped slots have been deprecated and ` +
        `replaced by "slot-scope" since 2.5. The new "slot-scope" attribute ` +
        `can also be used on plain elements in addition to <template> to ` +
        `denote scoped slots.`,
        el.rawAttrsMap['scope'],
        true
      )
    }
    // 在元素描述对象上添加了 el.slotScope 属性
    el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')
  } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) { // 移除 element.attrsList 对象中 name 为 slot-scope 的属性，并且返回获取到 slot-scope 属性的值赋值给变量 slotScope
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && el.attrsMap['v-for']) {
      warn(
        `Ambiguous combined usage of slot-scope and v-for on <${el.tag}> ` +
        `(v-for takes higher priority). Use a wrapper <template> for the ` +
        `scoped slot to make it clearer.`,
        el.rawAttrsMap['slot-scope'],
        true
      )
    }
     // 在元素描述对象上添加了 el.slotScope 属性
    el.slotScope = slotScope
  }

  // slot="xxx"
  // 获取元素 slot 属性的值，并将获取到的值赋值给 slotTarget 常量，注意这里使用的是 getBindingAttr 函数，这意味着 slot 属性是可以绑定的
  const slotTarget = getBindingAttr(el, 'slot')
  if (slotTarget) {
    // 将 slotTarget 变量的值赋值给 el.slotTarget 属性
    el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
    // 在元素描述对象上添加了 el.slotTargetDynamic 属性
    el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot'])
    // preserve slot as an attribute for native shadow DOM compat
    // only for non-scoped slots.
    if (el.tag !== 'template' && !el.slotScope) {
      // 用来保存原生影子DOM (shadow DOM)的 slot 属性
      addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'))
    }
  }

  // 2.6 v-slot syntax
  // 判断系统配置是否支持新插槽语法
  if (process.env.NEW_SLOT_SYNTAX) {
    if (el.tag === 'template') {
      // v-slot on <template>
      // 获取v-slot 或者 v-slot:xxx 或 '#xxx' 的值，例如 v-slot:todo="todo" ，
      // attrsList为 attrsList: [{name: "v-slot:todo", value: "todo", start: 76, end: 87}]，
      // 匹配获取到 slotBinding 为 {name: "v-slot:todo", value: "todo", start: 76, end: 87}
      const slotBinding = getAndRemoveAttrByRegex(el, slotRE)
      if (slotBinding) {
        if (process.env.NODE_ENV !== 'production') {
          // el.slotScope 或 el.slotTarget 存在，说明使用了 slot 或 slot-scope
          if (el.slotTarget || el.slotScope) {
            // 新旧语法不能混合使用
            warn(
              `Unexpected mixed usage of different slot syntaxes.`,
              el
            )
          }
          // 获取标签的父级标签，如果父级标签不是组件或者template标签，报警告：只能出现在组件的根级别
          if (el.parent && !maybeComponent(el.parent)) {
            warn(
              `<template v-slot> can only appear at the root level inside ` +
              `the receiving component`,
              el
            )
          }
        }
        // 获取到name, dynamic
        const { name, dynamic } = getSlotName(slotBinding)
        // 在元素描述对象上添加了 el.slotTarget 属性
        el.slotTarget = name
        // 在元素描述对象上添加了 el.slotTargetDynamic 属性
        el.slotTargetDynamic = dynamic
        // 在元素描述对象上添加了 el.slotScope 属性
        el.slotScope = slotBinding.value || emptySlotScopeToken // force it into a scoped slot for perf
      }
    } else {
      // v-slot on component, denotes default slot
      // 匹配v-slot 或者 v-slot:xxx 或 '#xxx' 的值并获取到attrsList为对应的对象
      const slotBinding = getAndRemoveAttrByRegex(el, slotRE)
      if (slotBinding) {
        if (process.env.NODE_ENV !== 'production') {
          // 不是组件或template标签
          if (!maybeComponent(el)) {
            warn(
              `v-slot can only be used on components or <template>.`,
              slotBinding
            )
          }
          // el.slotScope 或 el.slotTarget 存在
          if (el.slotScope || el.slotTarget) {
            warn(
              `Unexpected mixed usage of different slot syntaxes.`,
              el
            )
          }
          // el.scopedSlots 存在
          if (el.scopedSlots) {
            warn(
              `To avoid scope ambiguity, the default slot should also use ` +
              `<template> syntax when there are other named slots.`,
              slotBinding
            )
          }
        }
        // add the component's children to its default slot
        // 获取当前组件的 scopedSlots
        const slots = el.scopedSlots || (el.scopedSlots = {})
        // 获取到name, dynamic
        const { name, dynamic } = getSlotName(slotBinding)
        // 获取 slots 中 key 对应匹配出来 name 的 slot
        // 然后再其下面创建一个标签名为 template 的 ASTElement，attrs 为空数组，parent 为当前节点
        const slotContainer = slots[name] = createASTElement('template', [], el)
        // 这里 name、dynamic 统一赋值给 slotContainer 的 slotTarget、slotTargetDynamic，而不是 el
        slotContainer.slotTarget = name
        slotContainer.slotTargetDynamic = dynamic
        // 将当前节点的 children 添加到 slotContainer 的 children 属性中
        slotContainer.children = el.children.filter((c: any) => {
          if (!c.slotScope) {
            c.parent = slotContainer
            return true
          }
        })
        slotContainer.slotScope = slotBinding.value || emptySlotScopeToken
        // remove children as they are returned from scopedSlots now
        // 清空当前节点的 children
        el.children = []
        // mark el non-plain so data gets generated
        el.plain = false
      }
    }
  }
}

/**
 * 获取 slotName
 * @param {属性，例如{name: "v-slot:todo", value: "todo", start: 76, end: 87}} binding 
 */
function getSlotName (binding) {
  // 者匹配 'v-slot:todo'、':todo'、'#todo'，
  let name = binding.name.replace(slotRE, '')
  if (!name) {
    // 获取binding.name并判断第一个字符是否为#
    if (binding.name[0] !== '#') {
      name = 'default' // 赋值默认名
    } else if (process.env.NODE_ENV !== 'production') {
      // 简写形式下，如果没有名称，则报警告
      warn(
        `v-slot shorthand syntax requires a slot name.`,
        binding
      )
    }
  }
  // 返回一个 key 包含 name，dynamic 的对象
  // 'v-slot:[todo]' 匹配然后获取到 name = '[todo]'，在通过name.slice(1, -1获取到todo
  // 进而进行动态参数进行匹配 dynamicArgRE.test(name) 结果为 true
  return dynamicArgRE.test(name)
    // dynamic [name]
    ? { name: name.slice(1, -1), dynamic: true }
    // static name
    : { name: `"${name}"`, dynamic: false }
}

// handle <slot/> outlets
function processSlotOutlet (el) {
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name')
    if (process.env.NODE_ENV !== 'production' && el.key) {
      warn(
        `\`key\` does not work on <slot> because slots are abstract outlets ` +
        `and can possibly expand into multiple elements. ` +
        `Use the key on a wrapping element instead.`,
        getRawBindingAttr(el, 'key')
      )
    }
  }
}

/**
 * 处理is特性
 * @param {*} el 
 */
function processComponent (el) {
  let binding
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding
  }
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true
  }
}

/**
 * 处理attrs属性
 * @param {*} el 
 */
function processAttrs (el) {
  // 获取attrsList的索引
  const list = el.attrsList
  let i, l, name, rawName, value, modifiers, syncGen, isDynamic
  for (i = 0, l = list.length; i < l; i++) {
    // 例如 {"name":"v-bind:prop1.prop","value":"prop1","start":39,"end":59}
    name = rawName = list[i].name
    value = list[i].value
    if (dirRE.test(name)) {
      // mark element as dynamic
      el.hasBindings = true
      // modifiers
      // parseModifiers('bind:prop1.prop') ===> {prop: true}
      modifiers = parseModifiers(name.replace(dirRE, ''))
      // support .foo shorthand syntax for the .prop modifier
      // propBindRE 检测一个(v-bind)指令是否绑定修饰符(.prop)
      if (process.env.VBIND_PROP_SHORTHAND && propBindRE.test(name)) {
        // {prop: true}
        (modifiers || (modifiers = {})).prop = true
        // modifierRE匹配修饰分, 得到'.-bind:prop1'
        name = `.` + name.slice(1).replace(modifierRE, '')
      } else if (modifiers) {
        name = name.replace(modifierRE, '')
      }
      // 解析 v-bind 指令，例如：v-bind:prop1
      if (bindRE.test(name)) { // v-bind
        // 替换掉 v-bind: 或 : 或 .，得到的name，例如prop1
        name = name.replace(bindRE, '')
        // 解析过滤器
        value = parseFilters(value)
        // 判断是否为动态属性
        isDynamic = dynamicArgRE.test(name)
        if (isDynamic) {
          // 去掉动态属性的[]括号
          name = name.slice(1, -1)
        }
        if (
          process.env.NODE_ENV !== 'production' &&
          value.trim().length === 0
        ) {
          warn(
            `The value for a v-bind expression cannot be empty. Found in "v-bind:${name}"`
          )
        }
        if (modifiers) {
          if (modifiers.prop && !isDynamic) { // 处理修饰符prop
            // 将绑定的属性驼峰化,例如 prop-data ===> propData
            name = camelize(name)
            if (name === 'innerHtml') name = 'innerHTML'
          }
          if (modifiers.camel && !isDynamic) {// 处理修饰符camel
            // 将绑定的属性驼峰化
            name = camelize(name)
          }
          if (modifiers.sync) { // 处理修饰符sync
            // 例如v-bind:prop1.sync='prop1'，此时value为prop1，所以获取到的值为 prop1=$event
            syncGen = genAssignmentCode(value, `$event`)
            if (!isDynamic) {
              addHandler(
                el,
                `update:${camelize(name)}`,
                syncGen,
                null,
                false,
                warn,
                list[i]
              )
              // hyphenate 用连接符 - 替换驼峰命名，当name 为形如 `xx-xx`下面条件成立
              if (hyphenate(name) !== camelize(name)) {
                addHandler(
                  el,
                  `update:${hyphenate(name)}`,
                  syncGen,
                  null,
                  false,
                  warn,
                  list[i]
                )
              }
            } else {
              // handler w/ dynamic event name
              addHandler(
                el,
                `"update:"+(${name})`,
                syncGen,
                null,
                false,
                warn,
                list[i],
                true // dynamic
              )
            }
          }
        }
        if ((modifiers && modifiers.prop) || (
          !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
        )) {
          // 添加属性到el.props
          addProp(el, name, value, list[i], isDynamic)
        } else {
          // 添加属性到el.attrs
          addAttr(el, name, value, list[i], isDynamic)
        }
      } else if (onRE.test(name)) { // v-on, 解析 v-on 指令
         // 替换掉 v-on: 或 @，得到的name，例如click
        name = name.replace(onRE, '')
        // 判断是否为动态属性
        isDynamic = dynamicArgRE.test(name)
        if (isDynamic) {
          // 去掉动态属性的[]括号
          name = name.slice(1, -1)
        }
        // 在当前元素描述对象上添加事件侦听器，实际上就是将事件名称与该事件的侦听函数添加到元素描述对象的 el.events 属性或 el.nativeEvents 属性中
        addHandler(el, name, value, modifiers, false, warn, list[i], isDynamic)
      } else { // normal directives, 对于其他指令的解析
        // 使用字符串的 `replace` 方法配合 `dirRE` 正则去掉属性名称中的 `'v-'` 或 `':'` 或 `'@'` 或 `'#'` 等字符
        name = name.replace(dirRE, '')
        // parse arg
        // 匹配参数,例如v-custom:arg，获取到的 argMatch = [':arg', 'arg']
        const argMatch = name.match(argRE)
        // 获取参数arg = 'arg'
        let arg = argMatch && argMatch[1]
        isDynamic = false
        if (arg) {
          // 截取参数标示，如 :arg 
          name = name.slice(0, -(arg.length + 1))
          if (dynamicArgRE.test(arg)) {
            // 截取[]
            arg = arg.slice(1, -1)
            isDynamic = true
          }
        }
        // 在元素描述对象上添加 `el.directives` 属性的
        addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i])
        if (process.env.NODE_ENV !== 'production' && name === 'model') {
          // 检查v-model在for循环中的绑定的检查
          checkForAliasModel(el, value)
        }
      }
    } else {
      // literal attribute
      if (process.env.NODE_ENV !== 'production') {
        // 判断该非指令属性的属性值是否使用了字面量表达式
        const res = parseText(value, delimiters)
        if (res) {
          // 报警告，用绑定的形式代替，例如
          // 用   <div :id="isTrue ? 'a' : 'b'"></div>
          // 代替 <div id="{{ isTrue ? 'a' : 'b' }}"></div>
          warn(
            `${name}="${value}": ` +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div id="{{ val }}">, use <div :id="val">.',
            list[i]
          )
        }
      }
      // 将属性与属性对应的字符串值添加到元素描述对象的 el.attrs 或 el.dynamicAttrs 数组中
      addAttr(el, name, JSON.stringify(value), list[i])
      // #6887 firefox doesn't update muted state if set via attribute
      // even immediately after element creation
      if (!el.component &&
          name === 'muted' &&
          platformMustUseProp(el.tag, el.attrsMap.type, name)) {
        addProp(el, name, 'true', list[i])
      }
    }
  }
}

/**
 * 检查是否在v-for中
 * 检查当前虚拟dom  vonde 是否有for指令，或者父组件是否有for指令
 * @param {*} el 
 */
function checkInFor (el: ASTElement): boolean {
  // 首先将el保存到parent里，这样v-for和ref就可以作用在同一个元素上
  let parent = el
  // 通过检测parent的AST对象是否由for来判断
  while (parent) {
    if (parent.for !== undefined) {
      return true // 如果在v-for内则返回true
    }
    parent = parent.parent
  }
  return false
}

/**
 * 解析指令中的修饰符
 * @param {指令字符串，例如: bind:prop1.prop} name 
 */
function parseModifiers (name: string): Object | void {
  // modifierRE匹配修饰分，所以匹配到的结果为 ['.prop']
  const match = name.match(modifierRE)
  if (match) {
    const ret = {}
    // 遍历match数组，从修饰符的第一位开始截取到末尾即得到 'prop' ,然后以prop为key值添加到ret对象并赋值为true
    match.forEach(m => { ret[m.slice(1)] = true })
    return ret
  }
}

/**
 * 将标签的属性数组转换成健值对
 * @param {标签拥有的属性数组} attrs 
 */
function makeAttrsMap (attrs: Array<Object>): Object {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    if (
      process.env.NODE_ENV !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn('duplicate attribute: ' + attrs[i].name, attrs[i])
    }
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

// for script (e.g. type="x/template") or style, do not decode content
/**
 * 是否是text标签，即script,style标签，不会解析
 * @param {*} el 
 */
function isTextTag (el): boolean {
  return el.tag === 'script' || el.tag === 'style'
}

/**
 * 是否是禁止在模板中使用的标签
 * @param {*} el 
 */
function isForbiddenTag (el): boolean {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap.type ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

const ieNSBug = /^xmlns:NS\d+/
const ieNSPrefix = /^NS\d+:/

/* istanbul ignore next */
/**
 * 修复ie svg的bug
 * @param {*} attrs 
 */
function guardIESVGBug (attrs) {
  const res = []
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '')
      res.push(attr)
    }
  }
  return res
}

/**
 * 检查v-model在for循环中的绑定的检查
 * @param {*} el 
 * @param {*} value 
 */
function checkForAliasModel (el, value) {
  let _el = el
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn(
        `<${el.tag} v-model="${value}">: ` +
        `You are binding v-model directly to a v-for iteration alias. ` +
        `This will not be able to modify the v-for source array because ` +
        `writing to the alias is like modifying a function local variable. ` +
        `Consider using an array of objects and use v-model on an object property instead.`,
        el.rawAttrsMap['v-model']
      )
    }
    _el = _el.parent
  }
}
