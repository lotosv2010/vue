/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

const callbacks = []
let pending = false

/**
 * 刷新回调函数
 */
function flushCallbacks () {
  pending = false
  // 获取到数组中所有的回调函数
  const copies = callbacks.slice(0)
  // 数组清空
  callbacks.length = 0
  // 循环执行回调函数
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).

// 核心的异步延迟函数,用于异步延迟调用 flushCallbacks 函数
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */

// timerFunc 优先使用原生 Promise
// 原本 MutationObserver 支持更广,但在 iOS >= 9.3.3 的 UIWebView 中,触摸事件处理程序中触发会产生严重错误
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.

    // IOS 的 UIWebView,Promise.then 回调被推入 microtask 队列但是队列可能不会如期执行。
    // 因此,添加一个空计时器“强制”执行 microtask 队列。
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)

  // 当原生 Promise 不可用时,timerFunc 使用原生 MutationObserver
  // 如 PhantomJS,iOS7,Android 4.4
  // issue #6466 MutationObserver 在 IE11 并不可靠,所以这里排除了 IE
  let counter = 1
  // 创建 MutationObserver 实例
  const observer = new MutationObserver(flushCallbacks)
  // 创建文本节点
  const textNode = document.createTextNode(String(counter))
  // 监听文本节点的内容改变
  observer.observe(textNode, {
    characterData: true
  })
  // 定义 microtask 函数
  timerFunc = () => {
    // 修改文本节点内容
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.

  // 如果原生 setImmediate 可用,timerFunc 使用原生 setImmediate
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // 最后,timerFunc 使用 setTimeout
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

/**
 * nextTick API
 * @param {回调函数} cb 
 * @param {执行上下文} ctx 
 */
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  // 添加一个回调函数到队列里面
  callbacks.push(() => {
    if (cb) { // 如果回调函数存在则使用call执行回调函数
      try {
        // 使用 .call 方法将函数 cb 的作用域设置为 ctx
        cb.call(ctx)
      } catch (e) { // 执行回调函数时,捕获错误
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) { // _resolve存在则执行_resolve函数
      _resolve(ctx)
    }
  })
  if (!pending) { // pending为false时
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  //如果回调函数不存在并且当前环境支持Promise时,则声明一个Promise 函数
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
