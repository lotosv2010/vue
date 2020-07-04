/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

// 共享属性定义
/**
 *  configurable：当且仅当该属性的 configurable 键值为 true 时，该属性的描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 false
 *  enumerable：当且仅当该属性的 enumerable 键值为 true 时，该属性才会出现在对象的枚举属性中。默认为 false
 * 数据描述符：
 *  value：该属性对应的值。可以是任何有效的 JavaScript 值（数值，对象，函数等）。默认为 undefined
 *  writable：当且仅当该属性的 writable 键值为 true 时，属性的值，也就是上面的 value，才能被赋值运算符改变。默认为 false
 * 存取描述符：
 *  get：属性的 getter 函数，如果没有 getter，则为 undefined。当访问该属性时，会调用此函数。执行时不传入任何参数，但是会传入 this 对象（由于继承关系，这里的this并不一定是定义该属性的对象）。该函数的返回值会被用作属性的值。默认为 undefined
 *  set：属性的 setter 函数，如果没有 setter，则为 undefined。当属性值被修改时，会调用此函数。该方法接受一个参数（也就是被赋予的新值），会传入赋值时的 this 对象。默认为 undefined
 */
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true, // 
  get: noop,
  set: noop
}

/**
 * 代理data/props，使得可以直接通过 this.key 访问 this._data.key / this._props.key
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
 * @param {Vue实例或Vue原型} target 
 * @param {_data/_props} sourceKey 
 * @param {data或props的属性} key 
 */
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * 初始化 `props` 属性、`data` 属性、`methods` 属性、`computed` 属性、`watch` 属性
 * @param {vue实例} vm 
 */
export function initState (vm: Component) {
  vm._watchers = [] //初始化观察者队列
  // new Vue(options) 中的 options
  const opts = vm.$options
  // 将props配置项中属性转化为vue实例的响应式属性
  if (opts.props) initProps(vm, opts.props)
  // 将 methods配置项中的方法添加到 vue实例对象中
  if (opts.methods) initMethods(vm, opts.methods)
  // 将data配置项中的属性转化为vue实例的响应式属性
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed) // 初始化computed
  // Firefox has a "watch" function on Object.prototype
  // 如果传入了watch 且 watch不等于nativeWatch
  // (细节处理，在Firefox浏览器下Object的原型上含有一个watch函数)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch) // 初始化watch
  }
}

/**
 * 初始化props
 * @param {Vue实例} vm 
 * @param {props属性对象} propsOptions 
 */
function initProps (vm: Component, propsOptions: Object) {
  // todo：propsData是什么？
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存props的key值
  const keys = vm.$options._propKeys = []
  // 是否根组件
  const isRoot = !vm.$parent
  // root instance props should be converted
  // 如果不是根组件则没必要转换成响应式数据
  if (!isRoot) {
    // 控制是否转换成响应式数据
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    // 获取props的值
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 用连接符 - 替换驼峰命名，比如把驼峰 aBc 变成了 a-bc
      const hyphenatedKey = hyphenate(key)
      // 检查属性是否为保留属性
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      //通过defineProperty的set方法去通知notify()订阅者subscribers有新的值修改
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 把props代理到Vue实例上来，可以直接通过this.props访问
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

/**
 * 初始化数据，获取到 options.data 将他们添加到监听队列中
 * @param {vue实例} vm 
 */
function initData (vm: Component) {
  // 获取data配置项对象
  let data = vm.$options.data
  // 组件实例的data配置项是一个函数
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  // 获取data配置项的属性值
  const keys = Object.keys(data)
  // 获取props配置项的属性值
  const props = vm.$options.props
  // 获取methods配置项的属性值；
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // methods配置项和data配置项中的属性不能同名
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // props配置项和data配置项中的属性不能同名
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) { // 如果属性不是$,_ 开头(vue的保留属性)
      // 建立 vue实例 和 _data 的关联关系性
      // 代理data，使得可以直接通过 this.key 访问 this._data.key
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 观察data对象， 将对象属性全部转化为响应式属性
  observe(data, true /* asRootData */)
}
/**
 * 获取data属性返回的响应式数据
 * @param {组件的data属性} data 
 * @param {vm实例} vm 
 */
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget() // 为了防止使用 props 数据初始化 data 数据时收集冗余的依赖
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

// 计算属性的配置信息
const computedWatcherOptions = { lazy: true }

/**
 * 初始化计算属性
 * @param {Vue实例} vm 
 * @param {计算属性} computed 
 */
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  // 定义一个空对象，没有原型的，用于存储所有计算属性对应的watcher
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  // 计算的属性只是SSR期间的getter
  // 服务器呈现  判断是不是node 服务器环境
  const isSSR = isServerRendering()

  for (const key in computed) {
    // 将计算属性的值保存到userDef里面
    const userDef = computed[key]
    // 如果userDef是一个函数则赋值给getter,否则将userDef.get赋值给getter
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // 如果getter 是空,警告
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    // 如果不是node ssr渲染
    if (!isSSR) {
      // create internal watcher for the computed property.
      //创建一个内部的watcher给计算属性用
      // NOTE: 注:对于计算属性的Watcher来说，它的lazy属性为true，因此new watcher()结尾时不会执行get()方法，而是直接返回undefined(求值会等到该计算属性被调用时才求值的)
      watchers[key] = new Watcher(
        vm, // vm  vode
        getter || noop, // 函数
        noop, // 回调函数
        computedWatcherOptions //参数 lazy = true
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 如果key在vm中没有定义
    // 注:组件的计算属性在模块加载的时候已经被定义在了原型上面了
    if (!(key in vm)) {
      // 定义计算属性并且把属性的数据添加到对象监听中
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') { // 如果判断属性监听的key 在 data 中则发出警告
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) { // 如果判断属性监听的key 在 props 中则发出警告
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}

/**
 * 定义计算属性， 并且把属性的添加到对象监听中
 * @param {目标：vm} target 
 * @param {计算属性的key} key 
 * @param {计算属性的值} userDef 
 */
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 是否是浏览器环境
  const shouldCache = !isServerRendering()
  // 属性的值如果是个函数
  if (typeof userDef === 'function') {
    
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key) // 是浏览器环境，创建计算属性获取值，收集 dep 依赖
      : createGetterInvoker(userDef) // node服务器环境
    sharedPropertyDefinition.set = noop // 赋值一个空函数
  } else {
    sharedPropertyDefinition.get = userDef.get // 如果userDef.get 存在
      ? shouldCache && userDef.cache !== false // 缓存
        ? createComputedGetter(key) //创建计算属性获取值，收集 dep 依赖
        : createGetterInvoker(userDef.get) // node服务器环境
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) { // 如果设置值等于一个空函数则警告
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  // 设置访问器属性,这样当我们在模板里访问计算属性时就会执行sharedPropertyDefinition的get方法了
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * 创建计算属性获取值，收集 dep 依赖
 * @param {计算属性的key} key 
 */
function createComputedGetter (key) {
  return function computedGetter () {
    // 获取key对应的计算watcher
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) { // watcher存在
      if (watcher.dirty) {
        // 执行watcher.evaluate()函数
        watcher.evaluate()
      }
      // 这个Dep.target存在(这是个渲染watcher)
      if (Dep.target) {
        // 为Watcher 添加 （Watcher.newDeps.push(dep);） 一个dep对象
        // 循环deps 收集 newDeps dep 当newDeps 数据被清空的时候重新收集依赖
        watcher.depend()
      }
      // 最后返回计算属性的值
      return watcher.value
    }
  }
}

/**
 * node服务器环境，创建getter函数
 * @param {计算属性对应的函数} fn 
 */
function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

/**
 * 初始化事件
 * @param {Vue实例} vm 
 * @param {methods属性} methods 
 */
function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props // 获取props属性
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') { // 事件不是方法的话报错
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      //如果props属性中定义了key，则在methods中不能定义同样的key
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      //isReserved 检查一个字符串是否以$或者_开头的字母
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 判断methods每个属性值是否为函数类型
    // 如果为函数，则执行该函数
    // 如果不是函数，则赋值空函数即noop
    // bind 定义在scr/shared/util.js中
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

/**
 * 初始化监听属性
 * @param {Vue实例} vm 
 * @param {监听属性} watch 
 */
function initWatch (vm: Component, watch: Object) {
  // 循环watch对象
  for (const key in watch) {
    // 获取单个watch
    const handler = watch[key]
    // 如果他是数组handler
    if (Array.isArray(handler)) {
      // 循环数组 创建 监听
      for (let i = 0; i < handler.length; i++) {
        // vm 是 vue对象
        // key
        // 函数或者对象
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

/**
 * 创建用户watcher
 * @param {vue对象} vm 
 * @param {key值或者函数} expOrFn 
 * @param {函数或者对象或字符串} handler 
 * @param {参数} options 
 */
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  // 如果handler是个对象，则将该对象的hanler属性保存到handler里面;
  // 这里对应watch的值为对象的情况
  if (isPlainObject(handler)) {
    options = handler
    // 对象中的handler，一定是函数或者字符串
    handler = handler.handler
  }
  // 判断handler 是否是字符串 如果是 则是key
  if (typeof handler === 'string') {
    // 取值 vm 就是Vue 最外层 中的函数
    handler = vm[handler]
  }
  // 最后创建一个用户watch
  return vm.$watch(expOrFn, handler, options)
}

/**
 * 数据绑定，$watch方法
 * @param {vue构造器} Vue 
 */
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  // 流在某种程度上与直接声明的定义对象有问题
  // 在使用Object.defineProperty时，我们必须循序渐进地进行构建
  const dataDef = {}
  // 重新定义get 和set方法
  dataDef.get = function () { return this._data } // 获取data中的数据
  const propsDef = {}
  propsDef.get = function () { return this._props } // 获取props 数据
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () { //避免替换实例根$data，使用嵌套数据属性代替
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () { //props 只是可读的数据不可以设置更改
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  // 添加一个数组数据或者对象数据
  Vue.prototype.$set = set
  // 删除一个数组数据或者对象数据
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function, // 监听的属性
    cb: any, // 监听的属性对应的函数
    options?: Object //参数
  ): Function {
    const vm: Component = this
    // 判断是否是对象 
    // 如果是对象则递归深层监听，直到它不是一个对象的时候才会跳出递归
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    // 设置options.user为true,表示这是一个用户watch
    options.user = true
    // vm: vode函数, expOrFn: 监听的属性, cb: 监听的属性对应的函数, options: 参数
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      try {
        // 触发监听的属性对应的函数
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    // 卸载观察者
    return function unwatchFn () {
      // 从所有依赖项的订阅方列表中删除self。
      watcher.teardown()
    }
  }
}
