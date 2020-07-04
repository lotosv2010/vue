/* @flow */

import config from '../config'
import { warn } from './debug'
import { set } from '../observer/index'
import { unicodeRegExp } from './lang'
import { nativeWatch, hasSymbol } from './env'

import {
  ASSET_TYPES,
  LIFECYCLE_HOOKS
} from 'shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
const strats = config.optionMergeStrategies

/**
 * Options with restrictions
 */
/**
 * el & propsData 合并策略
 * @param {父组件} parent 
 * @param {子组件} child 
 * @param {Vue实例} vm 
 * @param {el 或 propsData} key 
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    // 如果是子组件
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    // 默认策略
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.
 */
/**
 * 将 from 对象的属性混合到 to 对象中，
 * 也可以说是将 parentVal 对象的属性混合到 childVal 中，
 * 最后返回的是处理后的 childVal 对象。
 * @param {目标} to 
 * @param {来源} from 
 */
function mergeData (to: Object, from: ?Object): Object {
  // 没有 from 直接返回 to
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  // 遍历 from 的 key
  for (let i = 0; i < keys.length; i++) {
    key = keys[i] // 获取对象的key
    // in case the object is already observed...
    if (key === '__ob__') continue
    toVal = to[key] // 获取key对应的目标对象的值
    fromVal = from[key] // 获取key对应的来源对象的值
    if (!hasOwn(to, key)) { // 如果 from 对象中的 key 不在 to 对象中，则使用 set 函数为 to 对象设置 key 及相应的值
      set(to, key, fromVal)
    } else if ( // 如果 from 对象中的 key 也在 to 对象中，且这两个属性的值都是纯对象则递归进行深度合并
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      // 深层递归
      mergeData(toVal, fromVal)
    }
    // 其他情况什么都不做
  }
  return to
}

/**
 * Data
 */
/**
 * 递归合并数据，深度拷贝
 * 如果vm不存在，并且childVal不存在就返回parentVal
 * 如果vm不存在，并且parentVal不存在则返回childVal
 * 如果vm不存在，parentVal和childVal都存在则返回mergedDataFn
 * 如果vm存在则返回 mergedInstanceDataFn函数
 * @param {父组件} parentVal 
 * @param {子组件} childVal 
 * @param {vue实例} vm 
 */
export function mergeDataOrFn (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) { // 如果vm 不存在，处理子组件
    // in a Vue.extend merge, both should be functions
    // 选项是在调用 Vue.extend 函数时进行合并处理的，此时父子 data 选项都应该是函数
    // 如果没有子选项则使用父选项，没有父选项就直接使用子选项
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    // 如果父子选项同时存在，则返回mergedDataFn
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else { // 如果vm 存在，这是非组件的实例，返回一个函数
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) { // childVal存在
        return mergeData(instanceData, defaultData)
      } else { // childVal不存在，返回parentVal
        return defaultData
      }
    }
  }
}

/**
 * data的合并策略
 * @param {父组件} parentVal 
 * @param {子组件} childVal 
 * @param {vue实例} vm 
 */
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  // 如果是子组件
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )
      // 返回父级的data
      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * Hooks and props are merged as arrays.
 */
/**
 * 生命周期合并策略
 * @param {父组件} parentVal 
 * @param {子组件} childVal 
 */
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  // 如果子选项不存在直接等于父选项的值
  // 如果子选项存在，再判断父选项。如果父选项存在, 就把父子选项合并成一个数组
  // 如果父选项不存在，判断子选项是不是一个数组，如果不是数组将其作为数组的元素
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}

/**
 * 剔除选项合并数组中的重复值
 * @param {钩子} hooks 
 */
function dedupeHooks (hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
/**
 * 
 * @param {父组件} parentVal 
 * @param {子组件} childVal 
 * @param {vue实例} vm 
 * @param {*} key 
 */
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  // 以 parentVal 为原型创建对象 res
  const res = Object.create(parentVal || null)
  if (childVal) {
    // 判断 childVal 是否是纯对象
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    // 将 childVal 上的属性混合到 res 对象上
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // work around Firefox's Object.prototype.watch...
  // 处理 Firefox 原型上有 watch 属性的问题
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  // 组件选项是否有 watch 选项，如果没有的话，直接以 parentVal 为原型创建对象并返回
  if (!childVal) return Object.create(parentVal || null)
  // 开发环境判断 childVal 是否是一个纯对象，如果不是则报一个警告
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  // 判断是否有 parentVal，如果没有的话则直接返回 childVal
  if (!parentVal) return childVal
  // 定义 ret 常量，其值为一个对象
  const ret = {}
  // 将 parentVal 的属性混合到 ret 中，后面处理的都将是 ret 对象，最后返回的也是 ret 对象
  extend(ret, parentVal)
  // 遍历 childVal
  for (const key in childVal) {
    // 由于遍历的是 childVal，所以 key 是子选项的 key，父选项中未必能获取到值，所以 parent 未必有值
    let parent = ret[key]
    // child 是肯定有值的，因为遍历的就是 childVal 本身
    const child = childVal[key]
    // 这个 if 分支的作用就是如果 parent 存在，就将其转为数组
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    // 最后，如果 parent 存在，此时的 parent 应该已经被转为数组了，所以直接将 child concat 进去
    ret[key] = parent
      ? parent.concat(child)
      // 如果 parent 不存在，直接将 child 转为数组返回
      : Array.isArray(child) ? child : [child]
  }
  // 最后返回新的 ret 对象
  return ret
}

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // 如果存在 childVal，那么在非生产环境下要检查 childVal 的类型
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  // parentVal 不存在的情况下直接返回 childVal
  if (!parentVal) return childVal
  // 如果 parentVal 存在，则创建 ret 对象，
  // 然后分别将 parentVal 和 childVal 的属性混合到 ret 中，
  // 注意：由于 childVal 将覆盖 parentVal 的同名属性
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  // 最后返回 ret 对象。
  return ret
}
strats.provide = mergeDataOrFn

/**
 * Default strategy.
 */
/**
 * 默认策略
 * @param {父组件} parentVal 
 * @param {子组件} childVal 
 */
const defaultStrat = function (parentVal: any, childVal: any): any {
  // 只要子选项不是 undefined 那么就是用子选项，否则使用父选项
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Validate component names
 */
/**
 * 校验组件名称
 * @param {组件配置} options 
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

/**
 * 验证组件名称
 * @param {组件名称} name 
 */
export function validateComponentName (name: string) {
  // 符合HTML5规范，由普通字符和中横线(-)组成，并且必须以字母开头。
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  // isBuiltInTag是检验名字不能与slot,component重名
  // isReservedTag是检验不能与html、svg内置标签重名
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
/**
 * 规范化props
 * @param {组件配置} options 
 * @param {vue实例} vm 
 */
function normalizeProps (options: Object, vm: ?Component) {
  const props = options.props // 获取props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) { // 数组情况
    i = props.length // 获取长度
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val) // 把含有 '-' 的字符串转驼峰命名
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) { // 对象的情况
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // 如果不是对象和数组则警告
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}

/**
 * Normalize all injections into Object-based format
 */
/**
 * 规范化inject
 * @param {组件配置} options 
 * @param {vue实例} vm 
 */
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject // 获取inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) { // 数组的情况
    for (let i = 0; i < inject.length; i++) {
      // 保存到normalized里面，例如:{foo: {from: "foo"}}
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) { // 对象的情况
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
 * Normalize raw function directives into object format.
 */
/**
 * 规范化directives
 * @param {组件配置} options 
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        // 如果是函数则把它变成，
        // dirs[key] = {bind: def, update: def} 这种形式
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

/**
 * 判断 value 是否是纯对象
 * @param {属性名称} name 
 * @param {属性值} value 
 * @param {vue实例} vm 
 */
function assertObjectType (name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 * 将两个选项对象合并到一个新的对象中。用于实例化和继承的核心实用程序
 */
/**
 * 将两个对象合成一个对象
 * 将父值对象和子值对象合并在一起，并且优先取值子值，如果没有则取父值
 * @param {父值} parent 
 * @param {子值} child 
 * @param {Vue实例} vm 
 */
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    // 检验子组件
    checkComponents(child)
  }

  // 接下来是检查传入的child是否是函数，如果是的话，取到它的options选项重新赋值给child。
  // 所以说child参数可以是普通选项对象，也可以是Vue构造函数和通过Vue.extend继承的子类构造函数。
  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm) // 对 props 进行一次规范化
  normalizeInject(child, vm) // 对 inject 进行一次规范化
  normalizeDirectives(child) // 对 directives 进行一次规范化

  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  if (!child._base) { // child的_base属性不存在
    if (child.extends) { // 子组件是否有需要合并的对象继承
      parent = mergeOptions(parent, child.extends, vm)
    }
    //如果子组件有mixins 数组，则也递归合并
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options = {}
  let key
  for (key in parent) { // 循环合并后的key
    mergeField(key)
  }
  for (key in child) { // 循环子组件的
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  // 获取到key 去读取strats类的方法
  // strats类有方法 el，propsData，data，provide，watch，props，methods，inject，computed，components，directives，filters
  // strats类里面的方法都是合并数据，如果没有子节点childVal，
  // 就返回父节点parentVal，如果有子节点childVal就返回子节点childVal
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
/**
 * 检测指令是否在组件对象上面 ,返回注册指令或者组建的对象
 * @param {组件配置} options 
 * @param {类型：directives ， filters ，components} type 
 * @param {key 属性} id 
 * @param {警告的信息} warnMissing 
 */
export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  // 首先检查本地注册的变化，检查id是否是assets 实例化的属性或者方法
  if (hasOwn(assets, id)) return assets[id]
  // 让这样的的属性 v-model 变成 vModel 驼峰
  const camelizedId = camelize(id)
  // 检查camelizedId是否是assets 实例化的属性或者方法
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  // 将首字母变成大写 变成 VModel
  const PascalCaseId = capitalize(camelizedId)
  // 检查PascalCaseId是否是assets 实例化的属性或者方法
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  // 如果检查不到id 实例化则如果是开发环境则警告
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  // 返回注册指令或者组建的对象
  return res
}
