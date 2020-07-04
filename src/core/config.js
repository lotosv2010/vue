/* @flow */

import {
  no,
  noop,
  identity
} from 'shared/util'

import { LIFECYCLE_HOOKS } from 'shared/constants'

export type Config = {
  // user
  optionMergeStrategies: { [key: string]: Function };
  silent: boolean;
  productionTip: boolean;
  performance: boolean;
  devtools: boolean;
  errorHandler: ?(err: Error, vm: Component, info: string) => void;
  warnHandler: ?(msg: string, vm: Component, trace: string) => void;
  ignoredElements: Array<string | RegExp>;
  keyCodes: { [key: string]: number | Array<number> };

  // platform
  isReservedTag: (x?: string) => boolean;
  isReservedAttr: (x?: string) => boolean;
  parsePlatformTagName: (x: string) => string;
  isUnknownElement: (x?: string) => boolean;
  getTagNamespace: (x?: string) => string | void;
  mustUseProp: (tag: string, type: ?string, name: string) => boolean;

  // private
  async: boolean;

  // legacy
  _lifecycleHooks: Array<string>;
};

export default ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  // 自定义合并策略的选项
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  // 是否关闭警告，默认为false，如果设置为true，那么将不会有报错信息
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  // 开发模式下是否在控制台显示生产提示，即一条 `You are running Vue in development mode` 提示，设置为false，即可关闭该提示
  productionTip: process.env.NODE_ENV !== 'production',

  /**
   * Whether to enable devtools
   */
  // 是否允许 `Vue-devtools` (Vue调试工具)检查代码，浏览器环境下为true
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * Whether to record perf
   */
  // 是否开启性能追踪，只是在开发默认和支持 `performance.mark API` 的浏览器上才会有效
  performance: false,

  /**
   * Error handler for watcher errors
   */
  // 指定组件的渲染和观察期间未捕获错误的处理函数，这个处理函数被调用时，可获取错误信息和 Vue 实例
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  // Vue 的运行时警告赋予一个自定义处理函数，注意这只会在开发环境下生效，在生产环境下它会被忽略
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  // 忽略某些自定义元素
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  // 给 v-on 自定义健位别名
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  // 保留标签，如有，则这些标签不能注册为组件
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
}: Config)
