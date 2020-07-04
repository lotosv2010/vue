/* @flow */

import { genHandlers } from './events'
import baseDirectives from '../directives/index'
import { camelize, no, extend } from 'shared/util'
import { baseWarn, pluckModuleFunction } from '../helpers'
import { emptySlotScopeToken } from '../parser/index'

type TransformFunction = (el: ASTElement, code: string) => string;
type DataGenFunction = (el: ASTElement) => string;
type DirectiveFunction = (el: ASTElement, dir: ASTDirective, warn: Function) => boolean;

export class CodegenState {
  options: CompilerOptions;
  warn: Function;
  transforms: Array<TransformFunction>;
  dataGenFns: Array<DataGenFunction>;
  directives: { [key: string]: DirectiveFunction };
  maybeComponent: (el: ASTElement) => boolean;
  onceId: number;
  staticRenderFns: Array<string>;
  pre: boolean;

  constructor (options: CompilerOptions) {
    // 缓存实例化传递进来的 `options`
    this.options = options
    // 用来打印警告信息的
    this.warn = options.warn || baseWarn
    // 空数组
    this.transforms = pluckModuleFunction(options.modules, 'transformCode')
    // 对静态类和静态样式的处理
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
    // 对指令的相关操作
    this.directives = extend(extend({}, baseDirectives), options.directives)
    // 保留标签标志
    const isReservedTag = options.isReservedTag || no
    // 判断是组件
    this.maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag)
    // 使用`v-once`的递增id
    this.onceId = 0
    // 对静态根节点的处理
    this.staticRenderFns = []
    // v-pre 标识
    this.pre = false
  }
}

export type CodegenResult = {
  render: string,
  staticRenderFns: Array<string>
};

/**
 * 生成代码
 * @param {ast树} ast 
 * @param {配置项} options 
 */
export function generate (
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {
  // 根据options创建CodegenState对象
  const state = new CodegenState(options)
  // 调用genElement将ast对象转换为字符串
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
    // 最外层用with(this)包裹
    render: `with(this){return ${code}}`,
    // 被标记为 staticRoot 节点的 VNode 就会单独生成 staticRenderFns
    staticRenderFns: state.staticRenderFns
  }
}

/**
 * 将ast对象转换为字符串
 * @param {ast树} el 
 * @param {CodegenState 实例} state 
 */
export function genElement (el: ASTElement, state: CodegenState): string {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre
  }
  // 对一些标签属性的处理
  // 处理静态树节点
  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    // 处理 v-once 节点
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    // 处理 v-for 节点
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    // 处理 v-if 节点
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
    // 处理 template 节点
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    // 处理 slot 节点
    return genSlot(el, state)
  } else {
    // component or element
    // 处理组件 或 元素节点
    let code
    if (el.component) {
      // 处理组件节点
      code = genComponent(el.component, el, state)
    } else {
      //核心的body部分
      let data
      //  el.plain 表示标签没有属性(key,插槽，其他属性)值为 true
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        // 1、生成节点的数据对象data的字符串
        data = genData(el, state)
      }

      // 2、查找其子节点,生成子节点的字符串
      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      // 3、将tag，data，children拼装成字符串
      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms
    // 循环执行 state.transforms 数组中的 transformCode 函数，此处 state.transforms 为空数组
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}

// hoist static sub-trees out
function genStatic (el: ASTElement, state: CodegenState): string {
  el.staticProcessed = true
  // Some elements (templates) need to behave differently inside of a v-pre
  // node.  All pre nodes are static roots, so we can use this as a location to
  // wrap a state change and reset it upon exiting the pre node.
  const originalPreState = state.pre
  if (el.pre) {
    state.pre = el.pre
  }
  state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)
  state.pre = originalPreState
  return `_m(${
    state.staticRenderFns.length - 1
  }${
    el.staticInFor ? ',true' : ''
  })`
}

// v-once
function genOnce (el: ASTElement, state: CodegenState): string {
  el.onceProcessed = true
  if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.staticInFor) {
    let key = ''
    let parent = el.parent
    while (parent) {
      if (parent.for) {
        key = parent.key
        break
      }
      parent = parent.parent
    }
    if (!key) {
      process.env.NODE_ENV !== 'production' && state.warn(
        `v-once can only be used inside v-for that is keyed. `,
        el.rawAttrsMap['v-once']
      )
      return genElement(el, state)
    }
    return `_o(${genElement(el, state)},${state.onceId++},${key})`
  } else {
    return genStatic(el, state)
  }
}

/**
 * 处理 v-if 节点
 * @param {AST树} el 
 * @param {CodegenState 实例} state 
 * @param {*} altGen 
 * @param {*} altEmpty 
 */
export function genIf (
  el: any,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  // 标识成已处理状态，避免递归
  el.ifProcessed = true // avoid recursion
  // 调用 genIfConditions 进行处理
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

/**
 * 处理 v-if/v-else-if/v-else 指令
 * @param {el 虚拟dom} conditions 
 * @param {CodegenState 实例} state 
 * @param {*} altGen 
 * @param {*} altEmpty 
 */
function genIfConditions (
  conditions: ASTIfConditions,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  // 条件指令数组为空，返回一个创建空节点的函数的字符串
  if (!conditions.length) {
    return altEmpty || '_e()'
  }

  const condition = conditions.shift()
  // 判断 exp 属性是否存在，将调用 genIfConditions 进行递归生成二元表达式
  if (condition.exp) {
    // 生成本次条件的二元表达式
    return `(${condition.exp})?${
      genTernaryExp(condition.block)
    }:${
      // 递归生成后续的二元表达式
      genIfConditions(conditions, state, altGen, altEmpty)
    }`
  } else {
    return `${genTernaryExp(condition.block)}`
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {
    return altGen
      ? altGen(el, state)
      : el.once // 使用了v-once指令
        ? genOnce(el, state) // 处理 v-once 节点，返回一个创建静态标签节点的函数的字符串
        : genElement(el, state) // 调用genElement，生成节点的字符串
  }
}

export function genFor (
  el: any,
  state: CodegenState,
  altGen?: Function,
  altHelper?: string
): string {
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

  if (process.env.NODE_ENV !== 'production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
      `v-for should have explicit keys. ` +
      `See https://vuejs.org/guide/list.html#key for more info.`,
      el.rawAttrsMap['v-for'],
      true /* tip */
    )
  }

  el.forProcessed = true // avoid recursion
  return `${altHelper || '_l'}((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
      `return ${(altGen || genElement)(el, state)}` +
    '})'
}

/**
 * 生成节点的数据对象 data 的字符串
 * @param {AST树} el 
 * @param {CodegenState 实例} state 
 */
export function genData (el: ASTElement, state: CodegenState): string {
  let data = '{'

  // directives first.
  // directives may mutate the el's other properties before they are generated.
  // 首先对directives进行处理
  // directives可能会对el上的其他属性有影响，所以先处理
  const dirs = genDirectives(el, state)
  // 将获取的字符串追加到 data 变量并且已逗号结尾
  if (dirs) data += dirs + ','

  // key
  // 将 el.key 的值追加到 data 变量并且已逗号结尾
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  // 将 el.ref 的值追加到 data 变量并且已逗号结尾
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  // 将 el.refInFor 的值追加到 data 变量并且已逗号结尾
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  // pre
  // 将 el.pre 的值追加到 data 变量并且已逗号结尾
  if (el.pre) {
    data += `pre:true,`
  }
  // record original tag name for components using "is" attribute
  // 将 el.tag 的值追加到 data 变量并且已逗号结尾
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  // module data generation functions
  // 对静态属性 class 、style 和动态属性 :class 、:style 的处理，把处理结果值拼接起来返回
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el)
  }
  // attributes
  // 普通属性处理并将结果追加到 data 变量并且已逗号结尾
  if (el.attrs) {
    data += `attrs:${genProps(el.attrs)},`
  }
  // DOM props
  // props属性处理并将结果追加到 data 变量并且已逗号结尾
  if (el.props) {
    data += `domProps:${genProps(el.props)},`
  }
  // event handlers
  // 对自定义事件进行处理，将结果追加到 data 变量并且已逗号结尾
  if (el.events) {
    data += `${genHandlers(el.events, false)},`
  }
  // 对原生事件进行处理，将结果追加到 data 变量并且已逗号结尾
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true)},`
  }
  // slot target
  // only for non-scoped slots
  // 将 slot 的值追加到 data 变量并且已逗号结尾
  if (el.slotTarget && !el.slotScope) {
    data += `slot:${el.slotTarget},`
  }
  // scoped slots
  // 对作用域插槽进行处理，将结果追加到 data 变量并且已逗号结尾
  if (el.scopedSlots) {
    data += `${genScopedSlots(el, el.scopedSlots, state)},`
  }
  // component v-model
  // 在组件上使用 v-model 指令的情况，对 AST 树的 model 属性进行处理，将结果追加到 data 变量并且已逗号结尾
  // 例如：v-model = "name"，则转换的 AST 树为，{callback: "function ($$v) {name=$$v}", expression: ""name"", value: "(name)"}
  if (el.model) {
    data += `model:{value:${
      el.model.value
    },callback:${
      el.model.callback
    },expression:${
      el.model.expression
    }},`
  }
  // inline-template
  // 处理内联模板
  if (el.inlineTemplate) {
    const inlineTemplate = genInlineTemplate(el, state)
    if (inlineTemplate) {
      data += `${inlineTemplate},`
    }
  }
  // 将最后一个逗号替换成空字符
  data = data.replace(/,$/, '') + '}'
  // v-bind dynamic argument wrap
  // v-bind with dynamic arguments must be applied using the same v-bind object
  // merge helper so that class/style/mustUseProp attrs are handled correctly.
  // 处理动态属性，
  // 例如：<div :[key]="name"> ... </div>，
  // 转换后的 AST 树为：dynamicAttrs: [{dynamic: true, end: 17, name: "key", start: 5, value: "name"}]
  // 最后转换成 '_b({staticClass:"list",class:classObject},"ul",_d({},[val,name]))'
  if (el.dynamicAttrs) {
    data = `_b(${data},"${el.tag}",${genProps(el.dynamicAttrs)})`
  }
  // v-bind data wrap
  // 包装数据处理
  // 例如：<div v-bind="{ id: someProp, 'other-attr': otherProp }"></div>
  if (el.wrapData) {
    data = el.wrapData(data)
  }
  // v-on data wrap
  // 包装事件处理
  // 例如：<button v-on="{ mousedown: doThis, mouseup: doThat }"></button>
  if (el.wrapListeners) {
    data = el.wrapListeners(data)
  }
  return data
}

function genDirectives (el: ASTElement, state: CodegenState): string | void {
  const dirs = el.directives
  if (!dirs) return
  let res = 'directives:['
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    const gen: DirectiveFunction = state.directives[dir.name]
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn)
    }
    if (needRuntime) {
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
      }${
        dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''
      }${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate (el: ASTElement, state: CodegenState): ?string {
  const ast = el.children[0]
  if (process.env.NODE_ENV !== 'production' && (
    el.children.length !== 1 || ast.type !== 1
  )) {
    state.warn(
      'Inline-template components must have exactly one child element.',
      { start: el.start }
    )
  }
  if (ast && ast.type === 1) {
    const inlineRenderFns = generate(ast, state.options)
    return `inlineTemplate:{render:function(){${
      inlineRenderFns.render
    }},staticRenderFns:[${
      inlineRenderFns.staticRenderFns.map(code => `function(){${code}}`).join(',')
    }]}`
  }
}

function genScopedSlots (
  el: ASTElement,
  slots: { [key: string]: ASTElement },
  state: CodegenState
): string {
  // by default scoped slots are considered "stable", this allows child
  // components with only scoped slots to skip forced updates from parent.
  // but in some cases we have to bail-out of this optimization
  // for example if the slot contains dynamic names, has v-if or v-for on them...
  let needsForceUpdate = el.for || Object.keys(slots).some(key => {
    const slot = slots[key]
    return (
      slot.slotTargetDynamic ||
      slot.if ||
      slot.for ||
      containsSlotChild(slot) // is passing down slot from parent which may be dynamic
    )
  })

  // #9534: if a component with scoped slots is inside a conditional branch,
  // it's possible for the same component to be reused but with different
  // compiled slot content. To avoid that, we generate a unique key based on
  // the generated code of all the slot contents.
  let needsKey = !!el.if

  // OR when it is inside another scoped slot or v-for (the reactivity may be
  // disconnected due to the intermediate scope variable)
  // #9438, #9506
  // TODO: this can be further optimized by properly analyzing in-scope bindings
  // and skip force updating ones that do not actually use scope variables.
  if (!needsForceUpdate) {
    let parent = el.parent
    while (parent) {
      if (
        (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
        parent.for
      ) {
        needsForceUpdate = true
        break
      }
      if (parent.if) {
        needsKey = true
      }
      parent = parent.parent
    }
  }

  const generatedSlots = Object.keys(slots)
    .map(key => genScopedSlot(slots[key], state))
    .join(',')

  return `scopedSlots:_u([${generatedSlots}]${
    needsForceUpdate ? `,null,true` : ``
  }${
    !needsForceUpdate && needsKey ? `,null,false,${hash(generatedSlots)}` : ``
  })`
}

function hash(str) {
  let hash = 5381
  let i = str.length
  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0
}

function containsSlotChild (el: ASTNode): boolean {
  if (el.type === 1) {
    if (el.tag === 'slot') {
      return true
    }
    return el.children.some(containsSlotChild)
  }
  return false
}

function genScopedSlot (
  el: ASTElement,
  state: CodegenState
): string {
  const isLegacySyntax = el.attrsMap['slot-scope']
  if (el.if && !el.ifProcessed && !isLegacySyntax) {
    return genIf(el, state, genScopedSlot, `null`)
  }
  if (el.for && !el.forProcessed) {
    return genFor(el, state, genScopedSlot)
  }
  const slotScope = el.slotScope === emptySlotScopeToken
    ? ``
    : String(el.slotScope)
  const fn = `function(${slotScope}){` +
    `return ${el.tag === 'template'
      ? el.if && isLegacySyntax
        ? `(${el.if})?${genChildren(el, state) || 'undefined'}:undefined`
        : genChildren(el, state) || 'undefined'
      : genElement(el, state)
    }}`
  // reverse proxy v-slot without scope on this.$slots
  const reverseProxy = slotScope ? `` : `,proxy:true`
  return `{key:${el.slotTarget || `"default"`},fn:${fn}${reverseProxy}}`
}

/**
 * 查找其子节点,生成子节点的字符串
 * @param {AST树} el 
 * @param {CodegenState 实例} state 
 * @param {*} checkSkip 
 * @param {*} altGenElement 
 * @param {*} altGenNode 
 */
export function genChildren (
  el: ASTElement,
  state: CodegenState,
  checkSkip?: boolean,
  altGenElement?: Function,
  altGenNode?: Function
): string | void {
  // 获取子节点 AST 树
  const children = el.children
  if (children.length) {
    // 获取第一个子节点 AST 树
    const el: any = children[0]
    // optimize single v-for
    // 对v-for进行简单优化
    if (children.length === 1 &&
      el.for &&
      el.tag !== 'template' &&
      el.tag !== 'slot'
    ) {
      // 判断 checkSkip，
      // 如果为 false，normalizationType = '', 
      // 如果为 true，在判断是不是组件，如果是则 normalizationType = ',1', 否则 normalizationType = ',0'
      const normalizationType = checkSkip
        ? state.maybeComponent(el) ? `,1` : `,0`
        : ``
      // 通过调用 genElement 处理子节点
      return `${(altGenElement || genElement)(el, state)}${normalizationType}`
    }
    // 判断 checkSkip，确定子数组所需的规范化
    // 如果为 false，normalizationType = 0, 
    // 如果为 true，调用 getNormalizationType
    const normalizationType = checkSkip
      ? getNormalizationType(children, state.maybeComponent)
      : 0
    const gen = altGenNode || genNode
    // 遍历子节点，调用 genNode 函数
    return `[${children.map(c => gen(c, state)).join(',')}]${
      normalizationType ? `,${normalizationType}` : ''
    }`
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
/**
 * 确定子数组所需的规范化
 * 0:不需要规范化
 * 1:需要简单的规范化（可能是1级深嵌套数组）
 * 2:需要完全规范化
 * @param {AST树的子节点} children 
 * @param {是否是组件} maybeComponent 
 */
function getNormalizationType (
  children: Array<ASTNode>,
  maybeComponent: (el: ASTElement) => boolean
): number {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el: ASTNode = children[i]
    if (el.type !== 1) {
      continue
    }
    // el上有 v-for 或标签名是 template 或 slot
    // 或者el是if块，但块内元素有内容符合上述三个条件的
    if (needsNormalization(el) ||
        (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }

    // el是自定义组件
    // 或el是if块，但块内元素有自定义组件的
    if (maybeComponent(el) ||
        (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1
    }
  }
  return res
}

/**
 * 是否需要规范化
 * @param {节点AST树} el 
 */
function needsNormalization (el: ASTElement): boolean {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

/**
 * 
 * @param {*} node 
 * @param {*} state 
 */
function genNode (node: ASTNode, state: CodegenState): string {
  if (node.type === 1) {
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

/**
 * 
 * @param {*} text 
 */
export function genText (text: ASTText | ASTExpression): string {
  return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

export function genComment (comment: ASTText): string {
  return `_e(${JSON.stringify(comment.text)})`
}

function genSlot (el: ASTElement, state: CodegenState): string {
  const slotName = el.slotName || '"default"'
  const children = genChildren(el, state)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs || el.dynamicAttrs
    ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(attr => ({
        // slot props are camelized
        name: camelize(attr.name),
        value: attr.value,
        dynamic: attr.dynamic
      })))
    : null
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent (
  componentName: string,
  el: ASTElement,
  state: CodegenState
): string {
  const children = el.inlineTemplate ? null : genChildren(el, state, true)
  return `_c(${componentName},${genData(el, state)}${
    children ? `,${children}` : ''
  })`
}

function genProps (props: Array<ASTAttr>): string {
  let staticProps = ``
  let dynamicProps = ``
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    const value = __WEEX__
      ? generateValue(prop.value)
      : transformSpecialNewlines(prop.value)
    if (prop.dynamic) {
      dynamicProps += `${prop.name},${value},`
    } else {
      staticProps += `"${prop.name}":${value},`
    }
  }
  staticProps = `{${staticProps.slice(0, -1)}}`
  if (dynamicProps) {
    return `_d(${staticProps},[${dynamicProps.slice(0, -1)}])`
  } else {
    return staticProps
  }
}

/* istanbul ignore next */
function generateValue (value) {
  if (typeof value === 'string') {
    return transformSpecialNewlines(value)
  }
  return JSON.stringify(value)
}

// #3895, #4268
function transformSpecialNewlines (text: string): string {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
