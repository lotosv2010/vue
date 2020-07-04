/* @flow */

import { remove, isDef } from 'shared/util'

// ref 创建，更新和销毁事件
export default {
  create (_: any, vnode: VNodeWithData) {
    registerRef(vnode)
  },
  update (oldVnode: VNodeWithData, vnode: VNodeWithData) {
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true) // 先删除
      registerRef(vnode) // 在添加
    }
  },
  destroy (vnode: VNodeWithData) {
    registerRef(vnode, true)
  }
}

/**
 * 注册ref或者删除ref
 * 比如标签上面设置了ref='abc' 
 * 那么该函数就是为this.$refs.abc 注册ref，把真实的dom存进去
 * @param {虚拟VNode} vnode 
 * @param {是否删除} isRemoval 
 */
export function registerRef (vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref // 获取vond ref的字符串
  if (!isDef(key)) return // ref属性不存在则直接退出

  const vm = vnode.context // vm实例，即上下文
  // 优先获取vonde的组件实例(对于组件来说)，或者el(该Vnode对应的DOM节点，非组件来说)
  const ref = vnode.componentInstance || vnode.elm
  const refs = vm.$refs // 获取vm总共的refs
  if (isRemoval) { // 标志是否删除ref
    // ref是数组的情况
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref)
    } else if (refs[key] === ref) {
      refs[key] = undefined
    }
  } else {
    // 当在v-for之内时，则保存为数组形式
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) { // 第一次添加
        refs[key] = [ref]
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref)
      }
    } else { // 不是在v-for之内时 
      refs[key] = ref
    }
  }
}
