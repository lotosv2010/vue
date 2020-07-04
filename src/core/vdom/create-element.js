/* @flow */

import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'
import { traverse } from '../observer/traverse'

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject,
  isPrimitive,
  resolveAsset
} from '../util/index'

import {
  normalizeChildren,
  simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
/**
 * 创建vnode节点
 * @param {vnode的上下文环境} context 
 * @param {标签，它可以是一个字符串，也可以是一个component} tag 
 * @param {vnode的数据} data 
 * @param {vnode的子节点} children 
 * @param {子节点规范的类型} normalizationType 
 * @param {是否是alwaysNormalize} alwaysNormalize 
 */
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  // 判断是否是数组或者基本数据类型(string，number，symbol，boolean)
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  // 是否是alwaysNormalize类型
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  // 创建节点
  return _createElement(context, tag, data, children, normalizationType)
}

/**
 * 1.children的规范化
 * 2.创建vnode节点
 * @param {vnode的上下文环境} context 
 * @param {标签，它可以是一个字符串，也可以是一个component} tag 
 * @param {vnode的数据} data 
 * @param {vnode的子节点} children 
 * @param {子节点规范的类型} normalizationType 
 */
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  // data 不存在，并且data的__ob__属性不存在的情况
  // 如果存在data.__ob__，说明data是被Observer观察的数据，不能用作虚拟节点的data，需要抛出警告，并返回一个空节点
  // NOTE:被监控的data不能被用作vnode渲染的数据的原因是：data在vnode渲染过程中可能会被改变，这样会触发监控，导致不符合预期的操作
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    // 创建一个空的vnode节点
    return createEmptyVNode()
  }
  // object syntax in v-bind
  // data存在并且data的is属性也存在的情况
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
  // tag 不存在的情况
  if (!tag) {
    // in case of component :is set to falsy value
    // 当组件的is属性被设置为一个falsy的值，Vue将不会知道要把这个组件渲染成什么，所以渲染一个空节点
    return createEmptyVNode()
  }
  // warn against non-primitive key
  // data存在并且data的key属性存在而且属性key的值不为基本类型的情况
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      )
    }
  }
  // support single function children as default scoped slot
  // 支持作为默认作用域插槽的单函数子函数
  // 子节点是数组并且第一项为函数的情况
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] } // 获取插槽
    children.length = 0
  }
  // 子节点规范
  if (normalizationType === ALWAYS_NORMALIZE) { // 2
    // 创建一个规范的子节点
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) { // 1
     // 把所有子节点的数组、子孙数组拍平在一个数组
    children = simpleNormalizeChildren(children)
  }
  let vnode, ns
  // 判断 tag 为 string 类型的情况
  if (typeof tag === 'string') {
    let Ctor
    // getTagNamespace获取标签名的命名空间，判断 tag 是否是svg或者math 标签
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    // 判断标签是不是html原有的标签
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }
      
      /**
       * tag是平台内置的元素，创建一个vnode
       * @param {当前节点的标签名} tag 
       * @param {当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息} data 
       * @param {子节点} children 
       * @param {文本} text 
       * @param {当前节点的dom} elm 
       * @param {编译作用域} context
       * @param {组件的option选项} componentOptions
       * @param {异步工厂} asyncFactory
       */
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // 如果不是保留标签，
      // 那么我们将尝试从vm的components上查找是否有这个标签的定义，
      // 如果有则创建一个组件
      // component
      /**
       * Ctor: 组件构造函数
       * data: 组件虚拟dom数据
       * context: this上下文
       * children: 子节点
       * tag: 组件标签
       */
      vnode = createComponent(Ctor, data, context, children, tag)
    } else { // 否则创建一个未知的标签的 VNode
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else { // 如果 tag 是一个 component 类型，则直接调用 createComponent 创建组件类型的VNode
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
  // vnode 是数组的情况
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) { // vnode存在
    // ns 存在
    if (isDef(ns)) applyNS(vnode, ns)
    // data 存在
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else { // 否则，返回一个空节点
    return createEmptyVNode()
  }
}

/**
 * 检测 vnode中的tag === 'foreignObject' 是否相等
 * 并且修改ns值与force 标志
 * @param {虚拟dom节点} vnode 
 * @param {namespace 标签} ns 
 * @param {*} force 
 */
function applyNS (vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) { // 虚拟dom节点子节点存在
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      // 子节点tag存在
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force) // 递归调用applyNS
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings (data) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}
