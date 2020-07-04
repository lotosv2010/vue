/* not type checking this file because flow doesn't play well with Proxy */

import config from 'core/config'
import { warn, makeMap, isNative } from '../util/index'

// 声明 initProxy 变量
let initProxy

// 判断给定的 `key` 是否出现在上面字符串中定义的关键字中的
// 这些关键字都是在 `js` 中可以全局访问的。
if (process.env.NODE_ENV !== 'production') {
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )

  // 在渲染的时候引用了 key，但是在实例对象上并没有定义 key 这个属性或方法，就会报这个错
  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }

  // 以 _ 或 $ 开头的 property 不会被 Vue 实例代理，因为它们可能和 Vue 内置的 property、API 方法冲突
  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals. ' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }

  // 判断当前宿主环境是否支持原生 Proxy
  const hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy)

  if (hasProxy) {
    // 检测给定的值是否是内置的事件修饰符
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    // 为 config.keyCodes 设置 set 代理，其目的是防止开发者在自定义键位别名的时候，覆盖了内置的修饰符
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          target[key] = value
          return true
        }
      }
    })
  }

  // hasHandler方法的应用场景在于查看vm实例是否拥有某个属性
  const hasHandler = {
    has (target, key) {
      // has 常量是真实经过 in 运算符得来的结果
      const has = key in target
      // 如果 key 在 allowedGlobals 之内，或者 key 是以下划线 _ 开头的字符串并且不在target.$data对象中的字符串，则为真
      const isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      // 如果 has 和 isAllowed 都为假
      if (!has && !isAllowed) {
        // 如果 key 在target.$data对象中， 使用 warnReservedPrefix 函数打印错误
        if (key in target.$data) warnReservedPrefix(target, key)
        // 如果 key 不在target.$data对象中， 使用 warnNonPresent 函数打印错误
        else warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }

  const getHandler = {
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return target[key]
    }
  }

  // 初始化 initProxy
  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      // options 就是 vm.$options 的引用
      const options = vm.$options
      // handlers 可能是 getHandler 也可能是 hasHandler
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      // 代理 vm 对象
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
}

export { initProxy }
