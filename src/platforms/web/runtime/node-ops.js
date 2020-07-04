/* @flow */

import { namespaceMap } from 'web/util/index'

/**
 * 创建一个真实的dom
 * @param {标签名} tagName 
 * @param {虚拟dom} vnode 
 */
export function createElement (tagName: string, vnode: VNode): Element {
  // 创建一个真实的dom
  const elm = document.createElement(tagName)
  // 如果不是select标签则返回dom出去
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  // 如果是select标签 判断是否设置了multiple属性。如果设置了则加上去
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}

/**
 * 创建带有指定命名空间的元素节点
 * @param {命名空间} namespace 
 * @param {标签名} tagName 
 */
export function createElementNS (namespace: string, tagName: string): Element {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

/**
 * 创建文本节点真是dom节点
 * @param {文本} text 
 */
export function createTextNode (text: string): Text {
  return document.createTextNode(text)
}

/**
 * 创建一个注释节点
 * @param {文本} text 
 */
export function createComment (text: string): Comment {
  return document.createComment(text)
}

/**
 * 插入节点在referenceNode dom 前面插入一个节点
 * @param {父级节点} parentNode 
 * @param {要插入的节点} newNode 
 * @param {参考节点} referenceNode 
 */
export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {
  parentNode.insertBefore(newNode, referenceNode)
}

/**
 * 删除子节点
 * @param {当前节点} node 
 * @param {要删除的子节点} child 
 */
export function removeChild (node: Node, child: Node) {
  node.removeChild(child)
}

/**
 * 添加子节点在尾部
 * @param {当前节点} node 
 * @param {要插入的子节点} child 
 */
export function appendChild (node: Node, child: Node) {
  node.appendChild(child)
}

/**
 * 获取父亲子节点dom
 * @param {当前节点} node 
 */
export function parentNode (node: Node): ?Node {
  return node.parentNode
}

/**
 * 获取下一个兄弟节点
 * @param {当前节点} node 
 */
export function nextSibling (node: Node): ?Node {
  return node.nextSibling
}

/**
 * 获取dom标签名称
 * @param {当前节点} node 
 */
export function tagName (node: Element): string {
  return node.tagName
}

/**
 * 设置 dom 文本
 * @param {当前节点} node 
 * @param {文本内容} text 
 */
export function setTextContent (node: Node, text: string) {
  node.textContent = text
}

/**
 * 设置dom节点属性
 * @param {当前节点} node 
 * @param {属性名} scopeId 
 */
export function setStyleScope (node: Element, scopeId: string) {
  node.setAttribute(scopeId, '')
}
