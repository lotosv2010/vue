/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    // dep对象的id
    this.id = uid++
    // 数组，用来存储依赖响应式属性的Observer
    this.subs = []
  }

  // 将Observer添加到dep对象的依赖列表中
  addSub (sub: Watcher) {
    // Dep对象实例添加订阅它的Watcher
    this.subs.push(sub)
  }

  // 将Observer从dep对象的依赖列表中删除
  removeSub (sub: Watcher) {
    // Dep对象实例移除订阅它的Watcher
    remove(this.subs, sub)
  }

  // 收集依赖关系
  depend () {
    // 把当前Dep对象实例添加到当前正在计算的Watcher的依赖中
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知Observer更新
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    // 遍历所有的订阅Watcher，然后调用他们的update方法
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
