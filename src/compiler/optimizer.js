/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

let isStaticKey
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */
/**
 * 优化ast树
 * @param {ast树} root 
 * @param {平台配置，baseOptions} options 
 */
export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  isPlatformReservedTag = options.isReservedTag || no
  // first pass: mark all non-static nodes.
  markStatic(root)
  // second pass: mark static roots.
  markStaticRoots(root, false)
}

/**
 * 
 * @param {*} keys 
 */
function genStaticKeys (keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

/**
 * 标记静态节点
 * @param {AST节点} node 
 */
function markStatic (node: ASTNode) {
  // 1、标注节点的状态
  node.static = isStatic(node)
  // 2、对标签节点进行处理
  if (node.type === 1) { // 判断是否为普通元素
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      // 非平台保留标签(html,svg)
      !isPlatformReservedTag(node.tag) &&
      // 不是slot标签
      node.tag !== 'slot' &&
      // 不是一个内联模板容器
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    // 递归其子节点，标注状态
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      // 子节点非静态，则该节点也标注非静态
      if (!child.static) {
        node.static = false
      }
    }
    // 对ifConditions进行循环递归,类似递归其子节点，标注状态过程
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        // 获取 ifConditions 数组中每一项
        const block = node.ifConditions[i].block
        markStatic(block)
        // 条件数组中有非静态，则该节点也标注非静态
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

/**
 * 静态根节点
 * @param {AST节点} node 
 * @param {是否在for循环中} isInFor 
 */
function markStaticRoots (node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    // 用以标记在v-for内的静态节点，此属性用以告诉renderStatic(_m)对这个节点生成新的key，避免patch error
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    // 一个节点要成为根节点，那么要满足以下条件：
    // 1、静态节点，并且有子节点，
    // 2、子节点不能仅为一个文本节点
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    // 循环递归标记children
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    // 循环递归标记ifConditions
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

/**
 * 标注节点的状态
 * @param {节点ast树} node 
 */
function isStatic (node: ASTNode): boolean {
  // 表达式，标注非静态
  if (node.type === 2) { // expression
    return false
  }
  // 文本，标注静态
  if (node.type === 3) { // text
    return true
  }
  return !!(node.pre || ( // v-pre 指令
    // 无动态绑定
    !node.hasBindings && // no dynamic bindings
    // 没有 v-if 和 v-for
    !node.if && !node.for && // not v-if or v-for or v-else
    // 不是内置的标签，内置的标签有slot和componen
    !isBuiltInTag(node.tag) && // not a built-in
    // 是平台保留标签
    isPlatformReservedTag(node.tag) && // not a component
    // 不是 template 标签的直接子元素并且没有包含在 for 循环中
    !isDirectChildOfTemplateFor(node) &&
    // 节点包含的属性只能有isStaticKey中指定的几个
    Object.keys(node).every(isStaticKey)
  ))
}

/**
 * 判断是 template 标签的直接子元素并且有包含在 for 循环中
 * @param {节点ast树} node 
 */
function isDirectChildOfTemplateFor (node: ASTElement): boolean {
  while (node.parent) {
    // 缓存父节点
    node = node.parent
    // 判断节点类型不是 template， 则返回false
    if (node.tag !== 'template') {
      return false
    }
    // 如果节点类型为template并存在 for 属性，则返回true
    if (node.for) {
      return true
    }
  }
  return false
}
