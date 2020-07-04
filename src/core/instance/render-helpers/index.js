/* @flow */

import { toNumber, toString, looseEqual, looseIndexOf } from 'shared/util'
import { createTextVNode, createEmptyVNode } from 'core/vdom/vnode'
import { renderList } from './render-list'
import { renderSlot } from './render-slot'
import { resolveFilter } from './resolve-filter'
import { checkKeyCodes } from './check-keycodes'
import { bindObjectProps } from './bind-object-props'
import { renderStatic, markOnce } from './render-static'
import { bindObjectListeners } from './bind-object-listeners'
import { resolveScopedSlots } from './resolve-scoped-slots'
import { bindDynamicKeys, prependModifier } from './bind-dynamic-keys'

/**
 * 安装渲染助手
 * @param {参数} target 
 */
export function installRenderHelpers (target: any) {
  // 实际上，这意味着使用唯一键将节点标记为静态。* 标志 v-once. 指令
  target._o = markOnce
  // 字符串转数字，如果失败则返回字符串
  target._n = toNumber
  // 将对象或者其他基本数据变成一个字符串
  target._s = toString
  // 根据value 判断是数字，数组，对象，字符串，循环渲染
  target._l = renderList
  // 用于呈现<slot>的运行时帮助程序 创建虚拟slot vonde
  target._t = renderSlot
  // 检测a和b的数据类型，是否是不是数组或者对象，对象的key长度一样即可，数组长度一样即可
  target._q = looseEqual
  // arr数组中的对象，或者对象数组是否和val 相等
  target._i = looseIndexOf
  // 用于呈现静态树的运行时助手，创建静态虚拟vnode
  target._m = renderStatic
  // 用于解析过滤器的运行时助手
  target._f = resolveFilter
  // 检查两个key是否相等，如果不想等返回true 如果相等返回false
  target._k = checkKeyCodes
  // 用于将v-bind="object"合并到VNode的数据中的运行时助手，检查value 是否是对象，并且为value 添加update 事件
  target._b = bindObjectProps
  // 创建一个文本节点 vonde
  target._v = createTextVNode
  // 创建一个节点为空的vnode
  target._e = createEmptyVNode
  // 解决作用域插槽，把对象数组事件分解成对象
  target._u = resolveScopedSlots
  // 判断value 是否是对象，并且为数据 data.on 合并data和value 的on 事件
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}
