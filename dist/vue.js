/*!
 * Vue.js v2.6.11
 * (c) 2014-2020 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  /*  */

  var emptyObject = Object.freeze({});

  // These helpers produce better VM code in JS engines due to their
  // explicitness and function inlining.
  /**
   * 判断数据是否为 undefined或null
   * @param {数据} v 
   */
  function isUndef (v) {
    return v === undefined || v === null
  }

  /**
   * 判断数据是否不为 undefined或null
   * @param {数据} v 
   */
  function isDef (v) {
    return v !== undefined && v !== null
  }

  /**
   * 判断数据是否为 true
   * @param {数据} v 
   */
  function isTrue (v) {
    return v === true
  }

  /**
   * 判断数据是否为 false
   * @param {数据} v 
   */
  function isFalse (v) {
    return v === false
  }

  /**
   * Check if value is primitive.
   */
  /**
   * 判断数据类型是否是基本数据类型(string，number，symbol，boolean)
   * @param {数据} value 
   */
  function isPrimitive (value) {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
  }

  /**
   * Quick object check - this is primarily used to tell
   * Objects from primitive values when we know the value
   * is a JSON-compliant type.
   */
  function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }

  /**
   * Get the raw type string of a value, e.g., [object Object].
   */
  var _toString = Object.prototype.toString;

  function toRawType (value) {
    return _toString.call(value).slice(8, -1)
  }

  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   */
  function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
  }

  function isRegExp (v) {
    return _toString.call(v) === '[object RegExp]'
  }

  /**
   * Check if val is a valid array index.
   */
  function isValidArrayIndex (val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }

  function isPromise (val) {
    return (
      isDef(val) &&
      typeof val.then === 'function' &&
      typeof val.catch === 'function'
    )
  }

  /**
   * Convert a value to a string that is actually rendered.
   */
  function toString (val) {
    return val == null
      ? ''
      : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
        ? JSON.stringify(val, null, 2)
        : String(val)
  }

  /**
   * Convert an input value to a number for persistence.
   * If the conversion fails, return original string.
   */
  function toNumber (val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
  }

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   */
  /**
   * 根据str, 生成一个map, 然后返回一个方法, 这个方法的作用是, 判断一个值是否在这个生成的map中
   * @param {用来生成map的字符串, 用','隔开，例如 'type,tag,attrsList,attrsMap,plain'} str 
   * @param {是否转小写} expectsLowerCase 
   */
  function makeMap (
    str,
    expectsLowerCase
  ) {
    // 创建一个空对象
    var map = Object.create(null);
    // 通过 `,` 将字符串分割成数组，例如：[type,tag,attrsList,attrsMap,plain]
    var list = str.split(',');
    // 通过for循环将数组中的每一项作为对象的健，`true`作为值，给对象添加相应的属性
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    // 返回一个检查传递进来的参数是否在此对象中的函数
    return expectsLowerCase
      ? function (val) { return map[val.toLowerCase()]; }
      : function (val) { return map[val]; }
  }

  /**
   * Check if a tag is a built-in tag.
   */
  /**
   * 判断是内置的标签，内置的标签有slot和componen
   */
  var isBuiltInTag = makeMap('slot,component', true);

  /**
   * Check if an attribute is a reserved attribute.
   */
  var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

  /**
   * Remove an item from an array.
   */
  /**
   * 删除数组中的指定选项
   * @param {数组} arr 
   * @param {要删除的选项} item 
   */
  function remove (arr, item) {
    if (arr.length) {
      // 获取要删除选项在数组中的索引
      var index = arr.indexOf(item);
      if (index > -1) { // 如果指定选项在数组中
        return arr.splice(index, 1)
      }
    }
  }

  /**
   * Check whether an object has the property.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key)
  }

  /**
   * Create a cached version of a pure function.
   */
  /**
   * 缓存运行fn的运行结果
   * @param {*} fn 
   */
  function cached (fn) {
    // 创建一个空对象
    var cache = Object.create(null);
    return (function cachedFn (str) {  
      // 获取缓存对象str属性的值
      var hit = cache[str]; 
      // 如果该值存在，直接返回，不存在调用一次fn，然后将结果存放到缓存对象中
      return hit || (cache[str] = fn(str)) 
    })
  }

  /**
   * Camelize a hyphen-delimited string.
   */
  var camelizeRE = /-(\w)/g;
  var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
  });

  /**
   * Capitalize a string.
   */
  var capitalize = cached(function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  });

  /**
   * Hyphenate a camelCase string.
   * 用连接符 - 替换驼峰命名
   */
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cached(function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
  });

  /**
   * Simple bind polyfill for environments that do not support it,
   * e.g., PhantomJS 1.x. Technically, we don't need this anymore
   * since native bind is now performant enough in most browsers.
   * But removing it would mean breaking code that was able to run in
   * PhantomJS 1.x, so this must be kept for backward compatibility.
   */

  /* istanbul ignore next */
  /**
   * 当Function的原型上不存在bind()函数时，
   * 自定义一个函数实现同样的功能，
   * 用apply()或call()来实现
   * @param {mehtods属性值} fn 
   * @param {执行上下文，例如Vue实例} ctx 
   */
  function polyfillBind (fn, ctx) {
    function boundFn (a) {
      var l = arguments.length;
      return l
        ? l > 1
          ? fn.apply(ctx, arguments)
          : fn.call(ctx, a)
        : fn.call(ctx)
    }

    boundFn._length = fn.length;
    return boundFn
  }

  /**
   * 
   * @param {mehtods属性值} fn 
   * @param {执行上下文，例如Vue实例} ctx 
   */
  function nativeBind (fn, ctx) {
    return fn.bind(ctx)
  }

  // 判断当前环境是否支持bind方法
  var bind = Function.prototype.bind
    ? nativeBind
    : polyfillBind;

  /**
   * Convert an Array-like object to a real Array.
   */
  function toArray (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret
  }

  /**
   * Mix properties into target object.
   */
  function extend (to, _from) {
    for (var key in _from) {
      to[key] = _from[key];
    }
    return to
  }

  /**
   * Merge an Array of Objects into a single Object.
   */
  function toObject (arr) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]) {
        extend(res, arr[i]);
      }
    }
    return res
  }

  /* eslint-disable no-unused-vars */

  /**
   * Perform no operation.
   * Stubbing args to make Flow happy without leaving useless transpiled code
   * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
   */
  function noop (a, b, c) {}

  /**
   * Always return false.
   */
  var no = function (a, b, c) { return false; };

  /* eslint-enable no-unused-vars */

  /**
   * Return the same value.
   */
  var identity = function (_) { return _; };

  /**
   * Generate a string containing static keys from compiler modules.
   */
  function genStaticKeys (modules) {
    return modules.reduce(function (keys, m) {
      return keys.concat(m.staticKeys || [])
    }, []).join(',')
  }

  /**
   * Check if two values are loosely equal - that is,
   * if they are plain objects, do they have the same shape?
   */
  function looseEqual (a, b) {
    if (a === b) { return true }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
      try {
        var isArrayA = Array.isArray(a);
        var isArrayB = Array.isArray(b);
        if (isArrayA && isArrayB) {
          return a.length === b.length && a.every(function (e, i) {
            return looseEqual(e, b[i])
          })
        } else if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime()
        } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])
          })
        } else {
          /* istanbul ignore next */
          return false
        }
      } catch (e) {
        /* istanbul ignore next */
        return false
      }
    } else if (!isObjectA && !isObjectB) {
      return String(a) === String(b)
    } else {
      return false
    }
  }

  /**
   * Return the first index at which a loosely equal value can be
   * found in the array (if value is a plain object, the array must
   * contain an object of the same shape), or -1 if it is not present.
   */
  function looseIndexOf (arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (looseEqual(arr[i], val)) { return i }
    }
    return -1
  }

  /**
   * Ensure a function is called only once.
   */
  function once (fn) {
    var called = false;
    return function () {
      if (!called) {
        called = true;
        fn.apply(this, arguments);
      }
    }
  }

  var SSR_ATTR = 'data-server-rendered';

  var ASSET_TYPES = [
    'component',
    'directive',
    'filter'
  ];

  var LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated',
    'errorCaptured',
    'serverPrefetch'
  ];

  /*  */



  var config = ({
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
    productionTip: "development" !== 'production',

    /**
     * Whether to enable devtools
     */
    // 是否允许 `Vue-devtools` (Vue调试工具)检查代码，浏览器环境下为true
    devtools: "development" !== 'production',

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
  });

  /*  */

  /**
   * unicode letters used for parsing html tags, component names and property paths.
   * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
   * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
   */
  // unicode代表：·À-ÖØ-öø-ͽͿ-῿‌-‍‿-⁀⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�
  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

  /**
   * Check if a string starts with $ or _
   */
  function isReserved (str) {
    var c = (str + '').charCodeAt(0);
    return c === 0x24 || c === 0x5F
  }

  /**
   * Define a property.
   */
  function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    });
  }

  /**
   * Parse simple path.
   */
  var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
  /**
   * 解析路劲
   * @param {路径} path 
   */
  function parsePath (path) {
    if (bailRE.test(path)) {
      return
    }
    var segments = path.split('.');
    return function (obj) { //返回一个函数，参数是一个对象
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
  }

  /*  */

  // can we use __proto__?
  var hasProto = '__proto__' in {};

  // Browser environment sniffing
  var inBrowser = typeof window !== 'undefined';
  var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
  var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  var isIE = UA && /msie|trident/.test(UA);
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isEdge = UA && UA.indexOf('edge/') > 0;
  var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
  var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
  var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
  var isPhantomJS = UA && /phantomjs/.test(UA);
  var isFF = UA && UA.match(/firefox\/(\d+)/);

  // Firefox has a "watch" function on Object.prototype...
  // 在 Firefox 中原生提供了 Object.prototype.watch 函数，
  // 所以当运行在 Firefox 中时 nativeWatch 为原生提供的函数，
  // 在其他浏览器中 nativeWatch 为 undefined。这个变量主要用于 Vue 处理 watch 选项时与其冲突
  var nativeWatch = ({}).watch;

  var supportsPassive = false;
  if (inBrowser) {
    try {
      var opts = {};
      Object.defineProperty(opts, 'passive', ({
        get: function get () {
          /* istanbul ignore next */
          supportsPassive = true;
        }
      })); // https://github.com/facebook/flow/issues/285
      window.addEventListener('test-passive', null, opts);
    } catch (e) {}
  }

  // this needs to be lazy-evaled because vue may be required before
  // vue-server-renderer can set VUE_ENV
  var _isServer;
  var isServerRendering = function () {
    if (_isServer === undefined) {
      /* istanbul ignore if */
      if (!inBrowser && !inWeex && typeof global !== 'undefined') {
        // detect presence of vue-server-renderer and avoid
        // Webpack shimming the process
        _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
      } else {
        _isServer = false;
      }
    }
    return _isServer
  };

  // detect devtools
  var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

  /* istanbul ignore next */
  function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
  }

  var hasSymbol =
    typeof Symbol !== 'undefined' && isNative(Symbol) &&
    typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

  var _Set;
  /* istanbul ignore if */ // $flow-disable-line
  if (typeof Set !== 'undefined' && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
  } else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = /*@__PURE__*/(function () {
      function Set () {
        this.set = Object.create(null);
      }
      Set.prototype.has = function has (key) {
        return this.set[key] === true
      };
      Set.prototype.add = function add (key) {
        this.set[key] = true;
      };
      Set.prototype.clear = function clear () {
        this.set = Object.create(null);
      };

      return Set;
    }());
  }

  /*  */

  var warn = noop;
  var tip = noop;
  var generateComponentTrace = (noop); // work around flow check
  var formatComponentName = (noop);

  {
    var hasConsole = typeof console !== 'undefined';
    var classifyRE = /(?:^|[-_])(\w)/g;
    var classify = function (str) { return str
      .replace(classifyRE, function (c) { return c.toUpperCase(); })
      .replace(/[-_]/g, ''); };

    warn = function (msg, vm) {
      var trace = vm ? generateComponentTrace(vm) : '';

      if (config.warnHandler) {
        config.warnHandler.call(null, msg, vm, trace);
      } else if (hasConsole && (!config.silent)) {
        console.error(("[Vue warn]: " + msg + trace));
      }
    };

    tip = function (msg, vm) {
      if (hasConsole && (!config.silent)) {
        console.warn("[Vue tip]: " + msg + (
          vm ? generateComponentTrace(vm) : ''
        ));
      }
    };

    formatComponentName = function (vm, includeFile) {
      if (vm.$root === vm) {
        return '<Root>'
      }
      var options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
          ? vm.$options || vm.constructor.options
          : vm;
      var name = options.name || options._componentTag;
      var file = options.__file;
      if (!name && file) {
        var match = file.match(/([^/\\]+)\.vue$/);
        name = match && match[1];
      }

      return (
        (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
        (file && includeFile !== false ? (" at " + file) : '')
      )
    };

    var repeat = function (str, n) {
      var res = '';
      while (n) {
        if (n % 2 === 1) { res += str; }
        if (n > 1) { str += str; }
        n >>= 1;
      }
      return res
    };

    generateComponentTrace = function (vm) {
      if (vm._isVue && vm.$parent) {
        var tree = [];
        var currentRecursiveSequence = 0;
        while (vm) {
          if (tree.length > 0) {
            var last = tree[tree.length - 1];
            if (last.constructor === vm.constructor) {
              currentRecursiveSequence++;
              vm = vm.$parent;
              continue
            } else if (currentRecursiveSequence > 0) {
              tree[tree.length - 1] = [last, currentRecursiveSequence];
              currentRecursiveSequence = 0;
            }
          }
          tree.push(vm);
          vm = vm.$parent;
        }
        return '\n\nfound in\n\n' + tree
          .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
              ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
              : formatComponentName(vm))); })
          .join('\n')
      } else {
        return ("\n\n(found in " + (formatComponentName(vm)) + ")")
      }
    };
  }

  /*  */

  var uid = 0;

  /**
   * A dep is an observable that can have multiple
   * directives subscribing to it.
   */
  var Dep = function Dep () {
    // dep对象的id
    this.id = uid++;
    // 数组，用来存储依赖响应式属性的Observer
    this.subs = [];
  };

  // 将Observer添加到dep对象的依赖列表中
  Dep.prototype.addSub = function addSub (sub) {
    // Dep对象实例添加订阅它的Watcher
    this.subs.push(sub);
  };

  // 将Observer从dep对象的依赖列表中删除
  Dep.prototype.removeSub = function removeSub (sub) {
    // Dep对象实例移除订阅它的Watcher
    remove(this.subs, sub);
  };

  // 收集依赖关系
  Dep.prototype.depend = function depend () {
    // 把当前Dep对象实例添加到当前正在计算的Watcher的依赖中
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  };

  // 通知Observer更新
  Dep.prototype.notify = function notify () {
    // stabilize the subscriber list first
    var subs = this.subs.slice();
    if ( !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort(function (a, b) { return a.id - b.id; });
    }
    // 遍历所有的订阅Watcher，然后调用他们的update方法
    for (var i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  };

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  Dep.target = null;
  var targetStack = [];

  function pushTarget (target) {
    targetStack.push(target);
    Dep.target = target;
  }

  function popTarget () {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }

  /*  */
  /* 
  * 通过new实例化的VNode可以分为：
  *  EmptyVNode（注释节点）
  *  TextVNode（文本节点）
  *  ElementVNode（元素节点）
  *  ComponentVNode（组件节点）
  *  CloneVNode（克隆节点）
  */
  var VNode = function VNode (
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  };

  var prototypeAccessors = { child: { configurable: true } };

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  prototypeAccessors.child.get = function () {
    return this.componentInstance
  };

  Object.defineProperties( VNode.prototype, prototypeAccessors );

  var createEmptyVNode = function (text) {
    if ( text === void 0 ) text = '';

    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node
  };

  function createTextVNode (val) {
    return new VNode(undefined, undefined, undefined, String(val))
  }

  // optimized shallow clone
  // used for static nodes and slot nodes because they may be reused across
  // multiple renders, cloning them avoids errors when DOM manipulations rely
  // on their elm reference.
  function cloneVNode (vnode) {
    var cloned = new VNode(
      vnode.tag,
      vnode.data,
      // #7975
      // clone children array to avoid mutating original in case of cloning
      // a child.
      vnode.children && vnode.children.slice(),
      vnode.text,
      vnode.elm,
      vnode.context,
      vnode.componentOptions,
      vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
  }

  /*
   * not type checking this file because flow doesn't play well with
   * dynamically accessing methods on Array prototype
   */
  // 缓存数组原型
  var arrayProto = Array.prototype;
  // 以数组构造函数的原型创建一个新对象
  var arrayMethods = Object.create(arrayProto);

  var methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
  ];

  /**
   * Intercept mutating methods and emit events
   */
  methodsToPatch.forEach(function (method) {
    // cache original method
    // 缓存了数组原本的变异方法
    var original = arrayProto[method];
    // 使用 def 函数在 arrayMethods 上定义与数组变异方法同名的函数，在函数体内优先调用了缓存下来的数组变异方法
    def(arrayMethods, method, function mutator () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // 执行数组原本的变异方法
      var result = original.apply(this, args);
      // 此时的 this 就是数组本身
      var ob = this.__ob__;
      // 保存那些被新添加进来的数组元素
      var inserted;
      // 增加元素的操作
      // 因为新增加的元素是非响应式的，所以我们需要获取到这些新元素，并将其变为响应式数据才行，而这就是上面代码的目的
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }
      // 调用 observeArray 函数对其进行观测
      if (inserted) { ob.observeArray(inserted); }
      // notify change
      ob.dep.notify();
      return result
    });
  });

  /*  */

  var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

  /**
   * In some cases we may want to disable observation inside a component's
   * update computation.
   */
  var shouldObserve = true;

  /**
   * 切换观测
   * @param {是否要观测} value 
   */
  function toggleObserving (value) {
    shouldObserve = value;
  }

  /**
   * Observer class that is attached to each observed
   * object. Once attached, the observer converts the target
   * object's property keys into getter/setters that
   * collect dependencies and dispatch updates.
   */
  // Observer 构造类
  var Observer = function Observer (value) {
    this.value = value; // 初始化属性 value，值为数据对象的引用
    this.dep = new Dep(); // 初始化属性 dep，值为 Dep实例
    this.vmCount = 0; // 初始化属性 vmCount ，值为0
    // 为数据对象定义了一个 __ob__ 属性，值为当前实例
    // def 函数其实就是 Object.defineProperty 函数的简单封装
    def(value, '__ob__', this);

    if (Array.isArray(value)) {
      // 检测当前环境是否可以使用 __proto__ 属性
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        copyAugment(value, arrayMethods, arrayKeys);
      }
      // 如果value是数组，对数组每一个元素执行observe方法
      this.observeArray(value);
    } else {
      // 如果value是对象， 遍历对象的每一个属性， 将属性转化为响应式属性
      this.walk(value);
    }
  };

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  // 遍历obj的属性，将obj对象的属性转化为响应式属性
  Observer.prototype.walk = function walk (obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      // 给obj的每一个属性都赋予getter/setter方法。
      // 这样一旦属性被访问或者更新，这样我们就可以追踪到这些变化
      defineReactive(obj, keys[i]);
    }
  };

  /**
   * Observe a list of Array items.
   */
  // 如果要观察的对象时数组， 遍历数组，然后调用observe方法将对象的属性转化为响应式属性
  Observer.prototype.observeArray = function observeArray (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  };

  // helpers

  /**
   * Augment a target Object or Array by intercepting
   * the prototype chain using __proto__
   */
  /**
   * 设置数组实例的 __proto__ 属性，让其指向一个代理原型
   * @param {目标数组} target 
   * @param {代理原型} src 
   */
  function protoAugment (target, src) {
    /* eslint-disable no-proto */
    target.__proto__ = src;
    /* eslint-enable no-proto */
  }

  /**
   * Augment a target Object or Array by defining
   * hidden properties.
   */
  /* istanbul ignore next */
  /**
   * 把数组实例与代理原型或与代理原型中定义的函数联系起来，从而拦截数组变异方法
   * @param {目标数组} target 
   * @param {代理原型} src 
   * @param {所有要拦截的数组变异方法的名称} keys 
   */
  function copyAugment (target, src, keys) {
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      def(target, key, src[key]);
    }
  }

  /**
   * Attempt to create an observer instance for a value,
   * returns the new observer if successfully observed,
   * or the existing observer if the value already has one.
   */
  /**
   * observe 工厂函数
   * @param {要观测的数据} value 
   * @param {要被观测的数据是否是根级数据} asRootData 
   */
  function observe (value, asRootData) {
    // 判断要观测数据不是一个纯对象或者要观测的数据类型为 VNode 则直接返回
    if (!isObject(value) || value instanceof VNode) {
      return
    }
    var ob;
    // 检测数据对象 value 自身是否含有 __ob__ 属性，并且 __ob__ 属性应该是 Observer 的实例
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      ob = value.__ob__;
    } else if (
      shouldObserve && // shouldObserve 必须为 true
      !isServerRendering() && // 判断是否是服务端渲染
      (Array.isArray(value) || isPlainObject(value)) && // 数据对象是数组或纯对象
      Object.isExtensible(value) && // 数据对象必须是可扩展的
      !value._isVue // !value._isVue 必须为真
    ) {
      ob = new Observer(value);
    }
    if (asRootData && ob) {
      ob.vmCount++;
    }
    return ob
  }

  /**
   * Define a reactive property on an Object.
   */
  /**
   * 将数据对象的数据属性转换为访问器属性
   * @param {要观测的数据对象} obj 
   * @param {属性的键名即key} key 
   * @param {对象属性对应的值} val 
   * @param {自定setter} customSetter 
   * @param {是否浅观测} shallow 
   */
  function defineReactive (
    obj,
    key,
    val,
    customSetter,
    shallow
  ) {
    // 每一个响应式属性都会有一个 Dep对象实例， 该对象实例会存储订阅它的Watcher对象实例
    var dep = new Dep();

    // 获取对象属性key的描述对象
    var property = Object.getOwnPropertyDescriptor(obj, key);
    // 如果属性是不可配置的，则直接返
    if (property && property.configurable === false) {
      return
    }

    // cater for pre-defined getter/setters
    // 属性原来的getter/setter
    var getter = property && property.get;
    var setter = property && property.set;
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }

    // 如果属性值是一个对象，递归观察属性值
    var childOb = !shallow && observe(val);
    // 重新定义对象obj的属性key
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter () {
        // 当obj的某个属性被访问的时候，就会调用getter方法
        var value = getter ? getter.call(obj) : val;
        // 当Dep.target不为空时，调用dep.depend 和 childOb.dep.depend方法做依赖收集
        if (Dep.target) {
          // 通过dep对象， 收集依赖关系
          dep.depend();
          if (childOb) {
            childOb.dep.depend();
            // 如果访问的是一个数组， 则会遍历这个数组， 收集数组元素的依赖
            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }
        return value
      },
      set: function reactiveSetter (newVal) {
        // 当改变obj的属性是，就会调用setter方法。这是就会调用dep.notify方法进行通知
        var value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        // 新旧值相等 或 新旧值都等于NaN时
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return
        }
        /* eslint-enable no-self-compare */
        if ( customSetter) {
          customSetter();
        }
        // #7981: for accessor properties without setter
        if (getter && !setter) { return }
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        // 对新值进行观测
        childOb = !shallow && observe(newVal);
        // 当响应式属性发生修改时，通过dep对象通知依赖的vue实例进行更新
        dep.notify();
      }
    });
  }

  /**
   * Set a property on an object. Adds the new property and
   * triggers change notification if the property doesn't
   * already exist.
   */
  /**
   * 向响应式对象中添加一个 property
   * @param {将要被添加属性的对象} target 
   * @param {要添加属性的键名} key 
   * @param {要添加属性的值} val 
   */
  function set (target, key, val) {
    // 判断在开发环境，如果 `set` 函数的第一个参数是 `undefined` 或 `null` 或者是原始类型值，则警告信息
    if (
      (isUndef(target) || isPrimitive(target))
    ) {
      warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // `target` 是一个数组，并且 `key` 是一个有效的数组索引
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      // 修改数组的长度
      target.length = Math.max(target.length, key);
      // 就利用了 splice 替换元素的能力，将指定位置元素的值替换为新值
      target.splice(key, 1, val);
      return val
    }
    // `key` 在 `target` 对象上，或在 `target` 的原型链上，同时必须不能在 `Object.prototype` 上
    if (key in target && !(key in Object.prototype)) {
      target[key] = val;
      return val
    }
    var ob = (target).__ob__;
    // 被观测的数据对象是`Vue` 实例对象或被观测的数据对象是否是根数据对象
    if (target._isVue || (ob && ob.vmCount)) {
       warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
      );
      return val
    }
    // `target.__ob__` 不存在，说明 target 是非响应的
    if (!ob) {
      target[key] = val;
      return val
    }
    // 保证新添加的属性是响应式的
    defineReactive(ob.value, key, val);
    // 触发响应
    ob.dep.notify();
    return val
  }

  /**
   * Delete a property and trigger change if necessary.
   */
  /**
   * 删除对象的 property
   * @param {将要被删除属性的对象} target 
   * @param {要删除属性的键名} key 
   */
  function del (target, key) {
    // 检测 `target` 是否是 `undefined` 或 `null` 或者是原始类型值，如果是的话那么在非生产环境下会打印警告信息
    if (
      (isUndef(target) || isPrimitive(target))
    ) {
      warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // 删除数组元素
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      target.splice(key, 1);
      return
    }
    var ob = (target).__ob__;
    // 不允许删除Vue对象和根数据的属性
    if (target._isVue || (ob && ob.vmCount)) {
       warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
        '- just set it to null.'
      );
      return
    }
    // 判断属性是否对象上的自有属性
    if (!hasOwn(target, key)) {
      return
    }
    // 删除属性
    delete target[key];
    // ob不存在，说明不是响应式的，直接返回
    if (!ob) {
      return
    }
    // 触发响应
    ob.dep.notify();
  }

  /**
   * Collect dependencies on array elements when the array is touched, since
   * we cannot intercept array element access like property getters.
   */
  /**
   * 递归数组收集依赖
   * @param {数组} value 
   */
  function dependArray (value) {
    for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
      e = value[i];
      e && e.__ob__ && e.__ob__.dep.depend();
      if (Array.isArray(e)) {
        dependArray(e);
      }
    }
  }

  /*  */

  /**
   * Option overwriting strategies are functions that handle
   * how to merge a parent option value and a child option
   * value into the final value.
   */
  var strats = config.optionMergeStrategies;

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
  {
    strats.el = strats.propsData = function (parent, child, vm, key) {
      // 如果是子组件
      if (!vm) {
        warn(
          "option \"" + key + "\" can only be used during instance " +
          'creation with the `new` keyword.'
        );
      }
      // 默认策略
      return defaultStrat(parent, child)
    };
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
  function mergeData (to, from) {
    // 没有 from 直接返回 to
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol
      ? Reflect.ownKeys(from)
      : Object.keys(from);

    // 遍历 from 的 key
    for (var i = 0; i < keys.length; i++) {
      key = keys[i]; // 获取对象的key
      // in case the object is already observed...
      if (key === '__ob__') { continue }
      toVal = to[key]; // 获取key对应的目标对象的值
      fromVal = from[key]; // 获取key对应的来源对象的值
      if (!hasOwn(to, key)) { // 如果 from 对象中的 key 不在 to 对象中，则使用 set 函数为 to 对象设置 key 及相应的值
        set(to, key, fromVal);
      } else if ( // 如果 from 对象中的 key 也在 to 对象中，且这两个属性的值都是纯对象则递归进行深度合并
        toVal !== fromVal &&
        isPlainObject(toVal) &&
        isPlainObject(fromVal)
      ) {
        // 深层递归
        mergeData(toVal, fromVal);
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
  function mergeDataOrFn (
    parentVal,
    childVal,
    vm
  ) {
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
        var instanceData = typeof childVal === 'function'
          ? childVal.call(vm, vm)
          : childVal;
        var defaultData = typeof parentVal === 'function'
          ? parentVal.call(vm, vm)
          : parentVal;
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
    parentVal,
    childVal,
    vm
  ) {
    // 如果是子组件
    if (!vm) {
      if (childVal && typeof childVal !== 'function') {
         warn(
          'The "data" option should be a function ' +
          'that returns a per-instance value in component ' +
          'definitions.',
          vm
        );
        // 返回父级的data
        return parentVal
      }
      return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
  };

  /**
   * Hooks and props are merged as arrays.
   */
  /**
   * 生命周期合并策略
   * @param {父组件} parentVal 
   * @param {子组件} childVal 
   */
  function mergeHook (
    parentVal,
    childVal
  ) {
    // 如果子选项不存在直接等于父选项的值
    // 如果子选项存在，再判断父选项。如果父选项存在, 就把父子选项合并成一个数组
    // 如果父选项不存在，判断子选项是不是一个数组，如果不是数组将其作为数组的元素
    var res = childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      : parentVal;
    return res
      ? dedupeHooks(res)
      : res
  }

  /**
   * 剔除选项合并数组中的重复值
   * @param {钩子} hooks 
   */
  function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
      if (res.indexOf(hooks[i]) === -1) {
        res.push(hooks[i]);
      }
    }
    return res
  }

  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  });

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
    parentVal,
    childVal,
    vm,
    key
  ) {
    // 以 parentVal 为原型创建对象 res
    var res = Object.create(parentVal || null);
    if (childVal) {
      // 判断 childVal 是否是纯对象
       assertObjectType(key, childVal, vm);
      // 将 childVal 上的属性混合到 res 对象上
      return extend(res, childVal)
    } else {
      return res
    }
  }

  ASSET_TYPES.forEach(function (type) {
    strats[type + 's'] = mergeAssets;
  });

  /**
   * Watchers.
   *
   * Watchers hashes should not overwrite one
   * another, so we merge them as arrays.
   */
  strats.watch = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // work around Firefox's Object.prototype.watch...
    // 处理 Firefox 原型上有 watch 属性的问题
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    // 组件选项是否有 watch 选项，如果没有的话，直接以 parentVal 为原型创建对象并返回
    if (!childVal) { return Object.create(parentVal || null) }
    // 开发环境判断 childVal 是否是一个纯对象，如果不是则报一个警告
    {
      assertObjectType(key, childVal, vm);
    }
    // 判断是否有 parentVal，如果没有的话则直接返回 childVal
    if (!parentVal) { return childVal }
    // 定义 ret 常量，其值为一个对象
    var ret = {};
    // 将 parentVal 的属性混合到 ret 中，后面处理的都将是 ret 对象，最后返回的也是 ret 对象
    extend(ret, parentVal);
    // 遍历 childVal
    for (var key$1 in childVal) {
      // 由于遍历的是 childVal，所以 key 是子选项的 key，父选项中未必能获取到值，所以 parent 未必有值
      var parent = ret[key$1];
      // child 是肯定有值的，因为遍历的就是 childVal 本身
      var child = childVal[key$1];
      // 这个 if 分支的作用就是如果 parent 存在，就将其转为数组
      if (parent && !Array.isArray(parent)) {
        parent = [parent];
      }
      // 最后，如果 parent 存在，此时的 parent 应该已经被转为数组了，所以直接将 child concat 进去
      ret[key$1] = parent
        ? parent.concat(child)
        // 如果 parent 不存在，直接将 child 转为数组返回
        : Array.isArray(child) ? child : [child];
    }
    // 最后返回新的 ret 对象
    return ret
  };

  /**
   * Other object hashes.
   */
  strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // 如果存在 childVal，那么在非生产环境下要检查 childVal 的类型
    if (childVal && "development" !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    // parentVal 不存在的情况下直接返回 childVal
    if (!parentVal) { return childVal }
    // 如果 parentVal 存在，则创建 ret 对象，
    // 然后分别将 parentVal 和 childVal 的属性混合到 ret 中，
    // 注意：由于 childVal 将覆盖 parentVal 的同名属性
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    // 最后返回 ret 对象。
    return ret
  };
  strats.provide = mergeDataOrFn;

  /**
   * Default strategy.
   */
  /**
   * 默认策略
   * @param {父组件} parentVal 
   * @param {子组件} childVal 
   */
  var defaultStrat = function (parentVal, childVal) {
    // 只要子选项不是 undefined 那么就是用子选项，否则使用父选项
    return childVal === undefined
      ? parentVal
      : childVal
  };

  /**
   * Validate component names
   */
  /**
   * 校验组件名称
   * @param {组件配置} options 
   */
  function checkComponents (options) {
    for (var key in options.components) {
      validateComponentName(key);
    }
  }

  /**
   * 验证组件名称
   * @param {组件名称} name 
   */
  function validateComponentName (name) {
    // 符合HTML5规范，由普通字符和中横线(-)组成，并且必须以字母开头。
    if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
      warn(
        'Invalid component name: "' + name + '". Component names ' +
        'should conform to valid custom element name in html5 specification.'
      );
    }
    // isBuiltInTag是检验名字不能与slot,component重名
    // isReservedTag是检验不能与html、svg内置标签重名
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + name
      );
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
  function normalizeProps (options, vm) {
    var props = options.props; // 获取props
    if (!props) { return }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) { // 数组情况
      i = props.length; // 获取长度
      while (i--) {
        val = props[i];
        if (typeof val === 'string') {
          name = camelize(val); // 把含有 '-' 的字符串转驼峰命名
          res[name] = { type: null };
        } else {
          warn('props must be strings when using array syntax.');
        }
      }
    } else if (isPlainObject(props)) { // 对象的情况
      for (var key in props) {
        val = props[key];
        name = camelize(key);
        res[name] = isPlainObject(val)
          ? val
          : { type: val };
      }
    } else {
      // 如果不是对象和数组则警告
      warn(
        "Invalid value for option \"props\": expected an Array or an Object, " +
        "but got " + (toRawType(props)) + ".",
        vm
      );
    }
    options.props = res;
  }

  /**
   * Normalize all injections into Object-based format
   */
  /**
   * 规范化inject
   * @param {组件配置} options 
   * @param {vue实例} vm 
   */
  function normalizeInject (options, vm) {
    var inject = options.inject; // 获取inject
    if (!inject) { return }
    var normalized = options.inject = {};
    if (Array.isArray(inject)) { // 数组的情况
      for (var i = 0; i < inject.length; i++) {
        // 保存到normalized里面，例如:{foo: {from: "foo"}}
        normalized[inject[i]] = { from: inject[i] };
      }
    } else if (isPlainObject(inject)) { // 对象的情况
      for (var key in inject) {
        var val = inject[key];
        normalized[key] = isPlainObject(val)
          ? extend({ from: key }, val)
          : { from: val };
      }
    } else {
      warn(
        "Invalid value for option \"inject\": expected an Array or an Object, " +
        "but got " + (toRawType(inject)) + ".",
        vm
      );
    }
  }

  /**
   * Normalize raw function directives into object format.
   */
  /**
   * 规范化directives
   * @param {组件配置} options 
   */
  function normalizeDirectives (options) {
    var dirs = options.directives;
    if (dirs) {
      for (var key in dirs) {
        var def = dirs[key];
        if (typeof def === 'function') {
          // 如果是函数则把它变成，
          // dirs[key] = {bind: def, update: def} 这种形式
          dirs[key] = { bind: def, update: def };
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
  function assertObjectType (name, value, vm) {
    if (!isPlainObject(value)) {
      warn(
        "Invalid value for option \"" + name + "\": expected an Object, " +
        "but got " + (toRawType(value)) + ".",
        vm
      );
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
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    {
      // 检验子组件
      checkComponents(child);
    }

    // 接下来是检查传入的child是否是函数，如果是的话，取到它的options选项重新赋值给child。
    // 所以说child参数可以是普通选项对象，也可以是Vue构造函数和通过Vue.extend继承的子类构造函数。
    if (typeof child === 'function') {
      child = child.options;
    }

    normalizeProps(child, vm); // 对 props 进行一次规范化
    normalizeInject(child, vm); // 对 inject 进行一次规范化
    normalizeDirectives(child); // 对 directives 进行一次规范化

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) { // child的_base属性不存在
      if (child.extends) { // 子组件是否有需要合并的对象继承
        parent = mergeOptions(parent, child.extends, vm);
      }
      //如果子组件有mixins 数组，则也递归合并
      if (child.mixins) {
        for (var i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm);
        }
      }
    }

    var options = {};
    var key;
    for (key in parent) { // 循环合并后的key
      mergeField(key);
    }
    for (key in child) { // 循环子组件的
      if (!hasOwn(parent, key)) {
        mergeField(key);
      }
    }
    // 获取到key 去读取strats类的方法
    // strats类有方法 el，propsData，data，provide，watch，props，methods，inject，computed，components，directives，filters
    // strats类里面的方法都是合并数据，如果没有子节点childVal，
    // 就返回父节点parentVal，如果有子节点childVal就返回子节点childVal
    function mergeField (key) {
      var strat = strats[key] || defaultStrat;
      options[key] = strat(parent[key], child[key], vm, key);
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
  function resolveAsset (
    options,
    type,
    id,
    warnMissing
  ) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
      return
    }
    var assets = options[type];
    // check local registration variations first
    // 首先检查本地注册的变化，检查id是否是assets 实例化的属性或者方法
    if (hasOwn(assets, id)) { return assets[id] }
    // 让这样的的属性 v-model 变成 vModel 驼峰
    var camelizedId = camelize(id);
    // 检查camelizedId是否是assets 实例化的属性或者方法
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    // 将首字母变成大写 变成 VModel
    var PascalCaseId = capitalize(camelizedId);
    // 检查PascalCaseId是否是assets 实例化的属性或者方法
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    // fallback to prototype chain
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    // 如果检查不到id 实例化则如果是开发环境则警告
    if ( warnMissing && !res) {
      warn(
        'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
        options
      );
    }
    // 返回注册指令或者组建的对象
    return res
  }

  /*  */



  function validateProp (
    key,
    propOptions,
    propsData,
    vm
  ) {
    var prop = propOptions[key];
    var absent = !hasOwn(propsData, key);
    var value = propsData[key];
    // boolean casting
    var booleanIndex = getTypeIndex(Boolean, prop.type);
    if (booleanIndex > -1) {
      if (absent && !hasOwn(prop, 'default')) {
        value = false;
      } else if (value === '' || value === hyphenate(key)) {
        // only cast empty string / same name to boolean if
        // boolean has higher priority
        var stringIndex = getTypeIndex(String, prop.type);
        if (stringIndex < 0 || booleanIndex < stringIndex) {
          value = true;
        }
      }
    }
    // check default value
    if (value === undefined) {
      value = getPropDefaultValue(vm, prop, key);
      // since the default value is a fresh copy,
      // make sure to observe it.
      var prevShouldObserve = shouldObserve;
      toggleObserving(true);
      observe(value);
      toggleObserving(prevShouldObserve);
    }
    {
      assertProp(prop, key, value, vm, absent);
    }
    return value
  }

  /**
   * Get the default value of a prop.
   */
  function getPropDefaultValue (vm, prop, key) {
    // no default, return undefined
    if (!hasOwn(prop, 'default')) {
      return undefined
    }
    var def = prop.default;
    // warn against non-factory defaults for Object & Array
    if ( isObject(def)) {
      warn(
        'Invalid default value for prop "' + key + '": ' +
        'Props with type Object/Array must use a factory function ' +
        'to return the default value.',
        vm
      );
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    if (vm && vm.$options.propsData &&
      vm.$options.propsData[key] === undefined &&
      vm._props[key] !== undefined
    ) {
      return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
      ? def.call(vm)
      : def
  }

  /**
   * Assert whether a prop is valid.
   */
  function assertProp (
    prop,
    name,
    value,
    vm,
    absent
  ) {
    if (prop.required && absent) {
      warn(
        'Missing required prop: "' + name + '"',
        vm
      );
      return
    }
    if (value == null && !prop.required) {
      return
    }
    var type = prop.type;
    var valid = !type || type === true;
    var expectedTypes = [];
    if (type) {
      if (!Array.isArray(type)) {
        type = [type];
      }
      for (var i = 0; i < type.length && !valid; i++) {
        var assertedType = assertType(value, type[i]);
        expectedTypes.push(assertedType.expectedType || '');
        valid = assertedType.valid;
      }
    }

    if (!valid) {
      warn(
        getInvalidTypeMessage(name, value, expectedTypes),
        vm
      );
      return
    }
    var validator = prop.validator;
    if (validator) {
      if (!validator(value)) {
        warn(
          'Invalid prop: custom validator check failed for prop "' + name + '".',
          vm
        );
      }
    }
  }

  var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

  function assertType (value, type) {
    var valid;
    var expectedType = getType(type);
    if (simpleCheckRE.test(expectedType)) {
      var t = typeof value;
      valid = t === expectedType.toLowerCase();
      // for primitive wrapper objects
      if (!valid && t === 'object') {
        valid = value instanceof type;
      }
    } else if (expectedType === 'Object') {
      valid = isPlainObject(value);
    } else if (expectedType === 'Array') {
      valid = Array.isArray(value);
    } else {
      valid = value instanceof type;
    }
    return {
      valid: valid,
      expectedType: expectedType
    }
  }

  /**
   * Use function string name to check built-in types,
   * because a simple equality check will fail when running
   * across different vms / iframes.
   */
  function getType (fn) {
    var match = fn && fn.toString().match(/^\s*function (\w+)/);
    return match ? match[1] : ''
  }

  function isSameType (a, b) {
    return getType(a) === getType(b)
  }

  function getTypeIndex (type, expectedTypes) {
    if (!Array.isArray(expectedTypes)) {
      return isSameType(expectedTypes, type) ? 0 : -1
    }
    for (var i = 0, len = expectedTypes.length; i < len; i++) {
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
    return -1
  }

  function getInvalidTypeMessage (name, value, expectedTypes) {
    var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', '));
    var expectedType = expectedTypes[0];
    var receivedType = toRawType(value);
    var expectedValue = styleValue(value, expectedType);
    var receivedValue = styleValue(value, receivedType);
    // check if we need to specify expected value
    if (expectedTypes.length === 1 &&
        isExplicable(expectedType) &&
        !isBoolean(expectedType, receivedType)) {
      message += " with value " + expectedValue;
    }
    message += ", got " + receivedType + " ";
    // check if we need to specify received value
    if (isExplicable(receivedType)) {
      message += "with value " + receivedValue + ".";
    }
    return message
  }

  function styleValue (value, type) {
    if (type === 'String') {
      return ("\"" + value + "\"")
    } else if (type === 'Number') {
      return ("" + (Number(value)))
    } else {
      return ("" + value)
    }
  }

  function isExplicable (value) {
    var explicitTypes = ['string', 'number', 'boolean'];
    return explicitTypes.some(function (elem) { return value.toLowerCase() === elem; })
  }

  function isBoolean () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
  }

  /*  */

  function handleError (err, vm, info) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    // See: https://github.com/vuejs/vuex/issues/1505
    pushTarget();
    try {
      if (vm) {
        var cur = vm;
        while ((cur = cur.$parent)) {
          var hooks = cur.$options.errorCaptured;
          if (hooks) {
            for (var i = 0; i < hooks.length; i++) {
              try {
                var capture = hooks[i].call(cur, err, vm, info) === false;
                if (capture) { return }
              } catch (e) {
                globalHandleError(e, cur, 'errorCaptured hook');
              }
            }
          }
        }
      }
      globalHandleError(err, vm, info);
    } finally {
      popTarget();
    }
  }

  /**
   * 错误处理
   * @param {函数，例如构造函数} handler 
   * @param {上下文} context 
   * @param {参数} args 
   * @param {vm实例} vm 
   * @param {信息} info 
   */
  function invokeWithErrorHandling (
    handler,
    context,
    args,
    vm,
    info
  ) {
    var res;
    try {
      res = args ? handler.apply(context, args) : handler.call(context); // 执行函数
      if (res && !res._isVue && isPromise(res) && !res._handled) {
        res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
        // issue #9511
        // avoid catch triggering multiple times when nested calls
        res._handled = true;
      }
    } catch (e) {
      handleError(e, vm, info);
    }
    return res
  }

  function globalHandleError (err, vm, info) {
    if (config.errorHandler) {
      try {
        return config.errorHandler.call(null, err, vm, info)
      } catch (e) {
        // if the user intentionally throws the original error in the handler,
        // do not log it twice
        if (e !== err) {
          logError(e, null, 'config.errorHandler');
        }
      }
    }
    logError(err, vm, info);
  }

  function logError (err, vm, info) {
    {
      warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
      console.error(err);
    } else {
      throw err
    }
  }

  /*  */

  var isUsingMicroTask = false;

  var callbacks = [];
  var pending = false;

  function flushCallbacks () {
    pending = false;
    var copies = callbacks.slice(0);
    callbacks.length = 0;
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
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
  var timerFunc;

  // The nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  /* istanbul ignore next, $flow-disable-line */
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    timerFunc = function () {
      p.then(flushCallbacks);
      // In problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      if (isIOS) { setTimeout(noop); }
    };
    isUsingMicroTask = true;
  } else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // Use MutationObserver where native Promise is not available,
    // e.g. PhantomJS, iOS7, Android 4.4
    // (#6466 MutationObserver is unreliable in IE11)
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
    isUsingMicroTask = true;
  } else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // Fallback to setImmediate.
    // Technically it leverages the (macro) task queue,
    // but it is still a better choice than setTimeout.
    timerFunc = function () {
      setImmediate(flushCallbacks);
    };
  } else {
    // Fallback to setTimeout.
    timerFunc = function () {
      setTimeout(flushCallbacks, 0);
    };
  }

  /**
   * nextTick API
   * @param {回调函数} cb 
   * @param {执行上下文} ctx 
   */
  function nextTick (cb, ctx) {
    var _resolve;
    // 添加一个回调函数到队列里面
    callbacks.push(function () {
      if (cb) { // 如果回调函数存在则使用call执行回调函数
        try {
          cb.call(ctx);
        } catch (e) { //  如果不是函数则报错
          handleError(e, ctx, 'nextTick');
        }
      } else if (_resolve) { // _resolve存在则执行_resolve函数
        _resolve(ctx);
      }
    });
    if (!pending) { // pending为false时
      pending = true;
      timerFunc();
    }
    // $flow-disable-line
    //如果回调函数不存在并且当前环境支持Promise时，则声明一个Promise 函数
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(function (resolve) {
        _resolve = resolve;
      })
    }
  }

  var mark;
  var measure;

  {
    var perf = inBrowser && window.performance;
    /* istanbul ignore if */
    if (
      perf &&
      perf.mark &&
      perf.measure &&
      perf.clearMarks &&
      perf.clearMeasures
    ) {
      mark = function (tag) { return perf.mark(tag); };
      measure = function (name, startTag, endTag) {
        perf.measure(name, startTag, endTag);
        perf.clearMarks(startTag);
        perf.clearMarks(endTag);
        // perf.clearMeasures(name)
      };
    }
  }

  /* not type checking this file because flow doesn't play well with Proxy */

  // 声明 initProxy 变量
  var initProxy;

  // 判断给定的 `key` 是否出现在上面字符串中定义的关键字中的
  // 这些关键字都是在 `js` 中可以全局访问的。
  {
    var allowedGlobals = makeMap(
      'Infinity,undefined,NaN,isFinite,isNaN,' +
      'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
      'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
      'require' // for Webpack/Browserify
    );

    // 在渲染的时候引用了 key，但是在实例对象上并没有定义 key 这个属性或方法，就会报这个错
    var warnNonPresent = function (target, key) {
      warn(
        "Property or method \"" + key + "\" is not defined on the instance but " +
        'referenced during render. Make sure that this property is reactive, ' +
        'either in the data option, or for class-based components, by ' +
        'initializing the property. ' +
        'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
        target
      );
    };

    // 以 _ 或 $ 开头的 property 不会被 Vue 实例代理，因为它们可能和 Vue 内置的 property、API 方法冲突
    var warnReservedPrefix = function (target, key) {
      warn(
        "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
        'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
        'prevent conflicts with Vue internals. ' +
        'See: https://vuejs.org/v2/api/#data',
        target
      );
    };

    // 判断当前宿主环境是否支持原生 Proxy
    var hasProxy =
      typeof Proxy !== 'undefined' && isNative(Proxy);

    if (hasProxy) {
      // 检测给定的值是否是内置的事件修饰符
      var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
      // 为 config.keyCodes 设置 set 代理，其目的是防止开发者在自定义键位别名的时候，覆盖了内置的修饰符
      config.keyCodes = new Proxy(config.keyCodes, {
        set: function set (target, key, value) {
          if (isBuiltInModifier(key)) {
            warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
            return false
          } else {
            target[key] = value;
            return true
          }
        }
      });
    }

    // hasHandler方法的应用场景在于查看vm实例是否拥有某个属性
    var hasHandler = {
      has: function has (target, key) {
        // has 常量是真实经过 in 运算符得来的结果
        var has = key in target;
        // 如果 key 在 allowedGlobals 之内，或者 key 是以下划线 _ 开头的字符串并且不在target.$data对象中的字符串，则为真
        var isAllowed = allowedGlobals(key) ||
          (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
        // 如果 has 和 isAllowed 都为假
        if (!has && !isAllowed) {
          // 如果 key 在target.$data对象中， 使用 warnReservedPrefix 函数打印错误
          if (key in target.$data) { warnReservedPrefix(target, key); }
          // 如果 key 不在target.$data对象中， 使用 warnNonPresent 函数打印错误
          else { warnNonPresent(target, key); }
        }
        return has || !isAllowed
      }
    };

    var getHandler = {
      get: function get (target, key) {
        if (typeof key === 'string' && !(key in target)) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return target[key]
      }
    };

    // 初始化 initProxy
    initProxy = function initProxy (vm) {
      if (hasProxy) {
        // determine which proxy handler to use
        // options 就是 vm.$options 的引用
        var options = vm.$options;
        // handlers 可能是 getHandler 也可能是 hasHandler
        var handlers = options.render && options.render._withStripped
          ? getHandler
          : hasHandler;
        // 代理 vm 对象
        vm._renderProxy = new Proxy(vm, handlers);
      } else {
        vm._renderProxy = vm;
      }
    };
  }

  /*  */

  // 实例化set对象
  var seenObjects = new _Set();

  /**
   * Recursively traverse an object to evoke all converted
   * getters, so that every nested property inside the object
   * is collected as a "deep" dependency.
   */
  /**
   * 为 seenObjects 深度收集val 中的key
   * @param {监听的值} val 
   */
  function traverse (val) {
    _traverse(val, seenObjects);
    // 清除set
    seenObjects.clear();
  }

  /**
   * 收集依赖
   * @param {监听的值} val 
   * @param {set} seen 
   */
  function _traverse (val, seen) {
    var i, keys;
    var isA = Array.isArray(val);
    // val不是数组并且不是对象或val被冻结或val是VNode，直接返回
    // Object.isFrozen参考：
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
      return
    }
    // val存在__ob__属性，即val是响应式数据
    if (val.__ob__) {
      var depId = val.__ob__.dep.id;
      if (seen.has(depId)) {
        return
      }
      seen.add(depId);
    }
    if (isA) { // 数组情况
      i = val.length;
      while (i--) { _traverse(val[i], seen); }
    } else { // 对象情况
      keys = Object.keys(val);
      i = keys.length;
      while (i--) { _traverse(val[keys[i]], seen); }
    }
  }

  /*  */

  var normalizeEvent = cached(function (name) {
    var passive = name.charAt(0) === '&';
    name = passive ? name.slice(1) : name;
    var once = name.charAt(0) === '~'; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    var capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
      name: name,
      once: once,
      capture: capture,
      passive: passive
    }
  });

  function createFnInvoker (fns, vm) {
    function invoker () {
      var arguments$1 = arguments;

      var fns = invoker.fns;
      if (Array.isArray(fns)) {
        var cloned = fns.slice();
        for (var i = 0; i < cloned.length; i++) {
          invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
        }
      } else {
        // return handler return value for single handlers
        return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
      }
    }
    invoker.fns = fns;
    return invoker
  }

  function updateListeners (
    on,
    oldOn,
    add,
    remove,
    createOnceHandler,
    vm
  ) {
    var name, def, cur, old, event;
    for (name in on) {
      def = cur = on[name];
      old = oldOn[name];
      event = normalizeEvent(name);
      if (isUndef(cur)) {
         warn(
          "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
          vm
        );
      } else if (isUndef(old)) {
        if (isUndef(cur.fns)) {
          cur = on[name] = createFnInvoker(cur, vm);
        }
        if (isTrue(event.once)) {
          cur = on[name] = createOnceHandler(event.name, cur, event.capture);
        }
        add(event.name, cur, event.capture, event.passive, event.params);
      } else if (cur !== old) {
        old.fns = cur;
        on[name] = old;
      }
    }
    for (name in oldOn) {
      if (isUndef(on[name])) {
        event = normalizeEvent(name);
        remove(event.name, oldOn[name], event.capture);
      }
    }
  }

  /*  */

  function mergeVNodeHook (def, hookKey, hook) {
    if (def instanceof VNode) {
      def = def.data.hook || (def.data.hook = {});
    }
    var invoker;
    var oldHook = def[hookKey];

    function wrappedHook () {
      hook.apply(this, arguments);
      // important: remove merged hook to ensure it's called only once
      // and prevent memory leak
      remove(invoker.fns, wrappedHook);
    }

    if (isUndef(oldHook)) {
      // no existing hook
      invoker = createFnInvoker([wrappedHook]);
    } else {
      /* istanbul ignore if */
      if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
        // already a merged invoker
        invoker = oldHook;
        invoker.fns.push(wrappedHook);
      } else {
        // existing plain hook
        invoker = createFnInvoker([oldHook, wrappedHook]);
      }
    }

    invoker.merged = true;
    def[hookKey] = invoker;
  }

  /*  */

  function extractPropsFromVNodeData (
    data,
    Ctor,
    tag
  ) {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    var propOptions = Ctor.options.props;
    if (isUndef(propOptions)) {
      return
    }
    var res = {};
    var attrs = data.attrs;
    var props = data.props;
    if (isDef(attrs) || isDef(props)) {
      for (var key in propOptions) {
        var altKey = hyphenate(key);
        {
          var keyInLowerCase = key.toLowerCase();
          if (
            key !== keyInLowerCase &&
            attrs && hasOwn(attrs, keyInLowerCase)
          ) {
            tip(
              "Prop \"" + keyInLowerCase + "\" is passed to component " +
              (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
              " \"" + key + "\". " +
              "Note that HTML attributes are case-insensitive and camelCased " +
              "props need to use their kebab-case equivalents when using in-DOM " +
              "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
            );
          }
        }
        checkProp(res, props, key, altKey, true) ||
        checkProp(res, attrs, key, altKey, false);
      }
    }
    return res
  }

  function checkProp (
    res,
    hash,
    key,
    altKey,
    preserve
  ) {
    if (isDef(hash)) {
      if (hasOwn(hash, key)) {
        res[key] = hash[key];
        if (!preserve) {
          delete hash[key];
        }
        return true
      } else if (hasOwn(hash, altKey)) {
        res[key] = hash[altKey];
        if (!preserve) {
          delete hash[altKey];
        }
        return true
      }
    }
    return false
  }

  /*  */

  // The template compiler attempts to minimize the need for normalization by
  // statically analyzing the template at compile time.
  //
  // For plain HTML markup, normalization can be completely skipped because the
  // generated render function is guaranteed to return Array<VNode>. There are
  // two cases where extra normalization is needed:

  // 1. When the children contains components - because a functional component
  // may return an Array instead of a single root. In this case, just a simple
  // normalization is needed - if any child is an Array, we flatten the whole
  // thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
  // because functional components already normalize their own children.
  /**
   * 方法的调用场景有 2 种
   * 1.render函数是用户手写的，当 children 只有一个节点的时候，Vue.js 从接口层面允许用户把 children 写成基础类型用来创建单个简单的文本节点，这种情况会调用  createTextVNode 创建一个文本节点的 VNode
   * 2.当编译 slot 、 v-for 的时候会产生嵌套数组的情况，会调用
   * @param {子节点} children 
   */
  function simpleNormalizeChildren (children) {
    for (var i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        return Array.prototype.concat.apply([], children)
      }
    }
    return children
  }

  // 2. When the children contains constructs that always generated nested Arrays,
  // e.g. <template>, <slot>, v-for, or when the children is provided by user
  // with hand-written render functions / JSX. In such cases a full normalization
  // is needed to cater to all possible types of children values.
  /**
   * render 函数当函数是编译生成的
   * 理论上编译生成的 children 都已经是 VNode 类型
   * 但这里有一个例外
   * 就是 function component 函数式组件返回的是一个数组而不是一个根节点
   * 所以会通过 Array.prototype.concat 方法把整个 children 数组打平，让它的深度只有一层
   * @param {子节点} children 
   */
  function normalizeChildren (children) {
    return isPrimitive(children)
      ? [createTextVNode(children)]
      : Array.isArray(children)
        ? normalizeArrayChildren(children)
        : undefined
  }

  /**
   * 判断是否是文本节点
   * @param {节点} node 
   */
  function isTextNode (node) {
    return isDef(node) && isDef(node.text) && isFalse(node.isComment)
  }

  /**
   * 规范的子节点
   * @param {要规范的子节点} children 
   * @param {嵌套的索引，因为单个child可能是一个数组类型} nestedIndex 
   */
  function normalizeArrayChildren (children, nestedIndex) {
    var res = [];
    var i, c, lastIndex, last;
    // 遍历children
    for (i = 0; i < children.length; i++) {
      c = children[i]; // 获取每个子项
      // 判断子项是否undefined 或 是boolean类型跳过循环
      if (isUndef(c) || typeof c === 'boolean') { continue }
      lastIndex = res.length - 1; // 获取res的作引长度
      last = res[lastIndex]; // 获取res的最后一项
      //  nested
      // 如果节点c是一个数组
      if (Array.isArray(c)) {
        // 数组的长度大于0
        if (c.length > 0) {
          // 递归调用 normalizeArrayChildren
          // nestedIndex有可能是 0_0  0_0_0 0_0_1 0_0_2  0_1  0_1_0 0_1_1 0_1_2
          // 如果含有子节点，则递归，把所有子节点变成文本节点
          c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
          // merge adjacent text nodes
          // 合并相邻文本节点
          // 如果c[0]中的第一个是文本节点， 并且 res 最后一个节点是文本节点
          if (isTextNode(c[0]) && isTextNode(last)) {
            // 合并他们的文本内容，并且创建一个文本节点
            res[lastIndex] = createTextVNode(last.text + (c[0]).text);
            c.shift(); // 从 c 出栈第一个数据
          }
          //res 添加数据，相当于 concat 合并数组
          res.push.apply(res, c);
        }
      } else if (isPrimitive(c)) { // 判断数据类型是否是string，number，symbol，boolean
        // 如果res最后数据一个是文本节点
        if (isTextNode(last)) {
          // merge adjacent text nodes
          // this is necessary for SSR hydration because text nodes are
          // essentially merged when rendered to HTML strings
          // 合并es最后一个节点的文本和c，创建文本节点
          res[lastIndex] = createTextVNode(last.text + c);
        } else if (c !== '') {
          // convert primitive to vnode
          //转换成 vnode， 创建文本节点
          res.push(createTextVNode(c));
        }
      } else {
        // 如果c是文本节点， 并且 res 最后一个节点是文本节点
        if (isTextNode(c) && isTextNode(last)) {
          // merge adjacent text nodes
          // 合并他们的文本内容，并且创建一个文本节点
          res[lastIndex] = createTextVNode(last.text + c.text);
        } else {
          // default key for nested array children (likely generated by v-for)
          if (isTrue(children._isVList) && // 如果children._isVList 为true
            isDef(c.tag) && // c.tag 不为空
            isUndef(c.key) && // c.key 为空
            isDef(nestedIndex)) { // nestedIndex不为空
            // 赋值key的值为例如__vlist1_1__
            c.key = "__vlist" + nestedIndex + "_" + i + "__";
          }
          // 把 VNode 添加到res中
          res.push(c);
        }
      }
    }
    return res
  }

  /*  */

  /**
   * 初始化provide
   * @param {vue实例} vm 
   */
  function initProvide (vm) {
    var provide = vm.$options.provide; // 尝试获取provide
    // 如果provide存在,当它是函数时执行该返回，
    // 否则直接将provide保存到Vue实例的_provided属性
    if (provide) {
      vm._provided = typeof provide === 'function'
        ? provide.call(vm)
        : provide;
    }
  }

  /**
   * 初始化inject
   * @param {vue实例} vm 
   */
  function initInjections (vm) {
    // provide 和 inject 主要为高阶插件/组件库提供用例。并不推荐直接用于应用程序代码中。
    // 这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深，并在起上下游关系成立的时间里始终生效。如果你熟悉 React，这与 React 的上下文特性很相似。
    // 更多详情信息https://cn.vuejs.org/v2/api/#provide-inject
    var result = resolveInject(vm.$options.inject, vm); // 遍历祖先节点，获取对应的inject,例如:比如:{foo: "bar"}
    if (result) { // 如果获取了对应的值，则将它变成响应式
      toggleObserving(false);
      // 注入的值不能修改，相当于props属性一样
      Object.keys(result).forEach(function (key) {
        /* istanbul ignore else */
        {
          defineReactive(vm, key, result[key], function () {
            warn(
              "Avoid mutating an injected value directly since the changes will be " +
              "overwritten whenever the provided component re-renders. " +
              "injection being mutated: \"" + key + "\"",
              vm
            );
          });
        }
      });
      toggleObserving(true);
    }
  }

  /**
   * 解析注入对象，获取注入key对应的值
   * @param {注入对象，inject:例如:{foo: {from: "foo"}}} inject 
   * @param {vue实例} vm 
   */
  function resolveInject (inject, vm) {
    if (inject) { // 如果inject非空
      // inject is :any because flow is not smart enough to figure out cached
      var result = Object.create(null); // 存储最后的结果
      // Reflect.ownKeys参考：
      // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys
      var keys = hasSymbol // 判断是否支持Symbol 数据类型
        ? Reflect.ownKeys(inject) // 如果有符号类型，调用Reflect.ownKeys()返回所有的key
        : Object.keys(inject); // 获取所有的key，此时keys就是个字符串数组,比如:["foo"]

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i]; // 获取注入的key
        // #6574 in case the inject object is observed...
        if (key === '__ob__') { continue }
        var provideKey = inject[key].from; // normalized[3]={from: 3} 获取key的值
        var source = vm;
        while (source) {
          // 如果source存在_provided 且 含有provideKey这个属性
          if (source._provided && hasOwn(source._provided, provideKey)) {
            result[key] = source._provided[provideKey]; //获取值，将值保存到result[key]中
            break
          }
          // 否则将source赋值给父Vue实例，直到找到对应的providekey为止
          source = source.$parent;
        }
        // 如果最后source不存在，即没有从当前实例或祖先实例的_provide找到privideKey这个key
        if (!source) {
          // 判断default key存在inject[key]中么
          if ('default' in inject[key]) {
            // 如果存在则获取默认default的值
            var provideDefault = inject[key].default;
            // 如果是函数则执行
            result[key] = typeof provideDefault === 'function'
              ? provideDefault.call(vm)
              : provideDefault;
          } else {
            warn(("Injection \"" + key + "\" not found"), vm);
          }
        }
      }
      return result
    }
  }

  /*  */



  /**
   * Runtime helper for resolving raw children VNodes into a slot object.
   */
  function resolveSlots (
    children,
    context
  ) {
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      } else {
        (slots.default || (slots.default = [])).push(child);
      }
    }
    // ignore slots that contains only whitespace
    for (var name$1 in slots) {
      if (slots[name$1].every(isWhitespace)) {
        delete slots[name$1];
      }
    }
    return slots
  }

  function isWhitespace (node) {
    return (node.isComment && !node.asyncFactory) || node.text === ' '
  }

  /*  */

  function normalizeScopedSlots (
    slots,
    normalSlots,
    prevSlots
  ) {
    var res;
    var hasNormalSlots = Object.keys(normalSlots).length > 0;
    var isStable = slots ? !!slots.$stable : !hasNormalSlots;
    var key = slots && slots.$key;
    if (!slots) {
      res = {};
    } else if (slots._normalized) {
      // fast path 1: child component re-render only, parent did not change
      return slots._normalized
    } else if (
      isStable &&
      prevSlots &&
      prevSlots !== emptyObject &&
      key === prevSlots.$key &&
      !hasNormalSlots &&
      !prevSlots.$hasNormal
    ) {
      // fast path 2: stable scoped slots w/ no normal slots to proxy,
      // only need to normalize once
      return prevSlots
    } else {
      res = {};
      for (var key$1 in slots) {
        if (slots[key$1] && key$1[0] !== '$') {
          res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
        }
      }
    }
    // expose normal slots on scopedSlots
    for (var key$2 in normalSlots) {
      if (!(key$2 in res)) {
        res[key$2] = proxyNormalSlot(normalSlots, key$2);
      }
    }
    // avoriaz seems to mock a non-extensible $scopedSlots object
    // and when that is passed down this would cause an error
    if (slots && Object.isExtensible(slots)) {
      (slots)._normalized = res;
    }
    def(res, '$stable', isStable);
    def(res, '$key', key);
    def(res, '$hasNormal', hasNormalSlots);
    return res
  }

  function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function () {
      var res = arguments.length ? fn.apply(null, arguments) : fn({});
      res = res && typeof res === 'object' && !Array.isArray(res)
        ? [res] // single vnode
        : normalizeChildren(res);
      return res && (
        res.length === 0 ||
        (res.length === 1 && res[0].isComment) // #9658
      ) ? undefined
        : res
    };
    // this is a slot using the new v-slot syntax without scope. although it is
    // compiled as a scoped slot, render fn users would expect it to be present
    // on this.$slots because the usage is semantically a normal slot.
    if (fn.proxy) {
      Object.defineProperty(normalSlots, key, {
        get: normalized,
        enumerable: true,
        configurable: true
      });
    }
    return normalized
  }

  function proxyNormalSlot(slots, key) {
    return function () { return slots[key]; }
  }

  /*  */

  /**
   * Runtime helper for rendering v-for lists.
   */
  function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
      if (hasSymbol && val[Symbol.iterator]) {
        ret = [];
        var iterator = val[Symbol.iterator]();
        var result = iterator.next();
        while (!result.done) {
          ret.push(render(result.value, ret.length));
          result = iterator.next();
        }
      } else {
        keys = Object.keys(val);
        ret = new Array(keys.length);
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          ret[i] = render(val[key], key, i);
        }
      }
    }
    if (!isDef(ret)) {
      ret = [];
    }
    (ret)._isVList = true;
    return ret
  }

  /*  */

  /**
   * Runtime helper for rendering <slot>
   */
  function renderSlot (
    name,
    fallback,
    props,
    bindObject
  ) {
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    if (scopedSlotFn) { // scoped slot
      props = props || {};
      if (bindObject) {
        if ( !isObject(bindObject)) {
          warn(
            'slot v-bind without argument expects an Object',
            this
          );
        }
        props = extend(extend({}, bindObject), props);
      }
      nodes = scopedSlotFn(props) || fallback;
    } else {
      nodes = this.$slots[name] || fallback;
    }

    var target = props && props.slot;
    if (target) {
      return this.$createElement('template', { slot: target }, nodes)
    } else {
      return nodes
    }
  }

  /*  */

  /**
   * Runtime helper for resolving filters
   */
  /**
   * 解析过滤器
   * @param {过滤器} id 
   */
  function resolveFilter (id) {
    return resolveAsset(this.$options, 'filters', id, true) || identity
  }

  /*  */

  function isKeyNotMatch (expect, actual) {
    if (Array.isArray(expect)) {
      return expect.indexOf(actual) === -1
    } else {
      return expect !== actual
    }
  }

  /**
   * Runtime helper for checking keyCodes from config.
   * exposed as Vue.prototype._k
   * passing in eventKeyName as last argument separately for backwards compat
   */
  function checkKeyCodes (
    eventKeyCode,
    key,
    builtInKeyCode,
    eventKeyName,
    builtInKeyName
  ) {
    var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
    if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
      return isKeyNotMatch(builtInKeyName, eventKeyName)
    } else if (mappedKeyCode) {
      return isKeyNotMatch(mappedKeyCode, eventKeyCode)
    } else if (eventKeyName) {
      return hyphenate(eventKeyName) !== key
    }
  }

  /*  */

  /**
   * Runtime helper for merging v-bind="object" into a VNode's data.
   */
  function bindObjectProps (
    data,
    tag,
    value,
    asProp,
    isSync
  ) {
    if (value) {
      if (!isObject(value)) {
         warn(
          'v-bind without argument expects an Object or Array value',
          this
        );
      } else {
        if (Array.isArray(value)) {
          value = toObject(value);
        }
        var hash;
        var loop = function ( key ) {
          if (
            key === 'class' ||
            key === 'style' ||
            isReservedAttribute(key)
          ) {
            hash = data;
          } else {
            var type = data.attrs && data.attrs.type;
            hash = asProp || config.mustUseProp(tag, type, key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {});
          }
          var camelizedKey = camelize(key);
          var hyphenatedKey = hyphenate(key);
          if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
            hash[key] = value[key];

            if (isSync) {
              var on = data.on || (data.on = {});
              on[("update:" + key)] = function ($event) {
                value[key] = $event;
              };
            }
          }
        };

        for (var key in value) loop( key );
      }
    }
    return data
  }

  /*  */

  /**
   * Runtime helper for rendering static trees.
   */
  function renderStatic (
    index,
    isInFor
  ) {
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    if (tree && !isInFor) {
      return tree
    }
    // otherwise, render a fresh tree.
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this // for render fns generated for functional component templates
    );
    markStatic(tree, ("__static__" + index), false);
    return tree
  }

  /**
   * Runtime helper for v-once.
   * Effectively it means marking the node as static with a unique key.
   */
  function markOnce (
    tree,
    index,
    key
  ) {
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
  }

  function markStatic (
    tree,
    key,
    isOnce
  ) {
    if (Array.isArray(tree)) {
      for (var i = 0; i < tree.length; i++) {
        if (tree[i] && typeof tree[i] !== 'string') {
          markStaticNode(tree[i], (key + "_" + i), isOnce);
        }
      }
    } else {
      markStaticNode(tree, key, isOnce);
    }
  }

  function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
  }

  /*  */

  function bindObjectListeners (data, value) {
    if (value) {
      if (!isPlainObject(value)) {
         warn(
          'v-on without argument expects an Object value',
          this
        );
      } else {
        var on = data.on = data.on ? extend({}, data.on) : {};
        for (var key in value) {
          var existing = on[key];
          var ours = value[key];
          on[key] = existing ? [].concat(existing, ours) : ours;
        }
      }
    }
    return data
  }

  /*  */

  function resolveScopedSlots (
    fns, // see flow/vnode
    res,
    // the following are added in 2.6
    hasDynamicKeys,
    contentHashKey
  ) {
    res = res || { $stable: !hasDynamicKeys };
    for (var i = 0; i < fns.length; i++) {
      var slot = fns[i];
      if (Array.isArray(slot)) {
        resolveScopedSlots(slot, res, hasDynamicKeys);
      } else if (slot) {
        // marker for reverse proxying v-slot without scope on this.$slots
        if (slot.proxy) {
          slot.fn.proxy = true;
        }
        res[slot.key] = slot.fn;
      }
    }
    if (contentHashKey) {
      (res).$key = contentHashKey;
    }
    return res
  }

  /*  */

  function bindDynamicKeys (baseObj, values) {
    for (var i = 0; i < values.length; i += 2) {
      var key = values[i];
      if (typeof key === 'string' && key) {
        baseObj[values[i]] = values[i + 1];
      } else if ( key !== '' && key !== null) {
        // null is a special value for explicitly removing a binding
        warn(
          ("Invalid value for dynamic directive argument (expected string or null): " + key),
          this
        );
      }
    }
    return baseObj
  }

  // helper to dynamically append modifier runtime markers to event names.
  // ensure only append when value is already string, otherwise it will be cast
  // to string and cause the type check to miss.
  function prependModifier (value, symbol) {
    return typeof value === 'string' ? symbol + value : value
  }

  /*  */

  /**
   * 安装渲染助手
   * @param {参数} target 
   */
  function installRenderHelpers (target) {
    // 实际上，这意味着使用唯一键将节点标记为静态。* 标志 v-once. 指令
    target._o = markOnce;
    // 字符串转数字，如果失败则返回字符串
    target._n = toNumber;
    // 将对象或者其他基本数据变成一个字符串
    target._s = toString;
    // 根据value 判断是数字，数组，对象，字符串，循环渲染
    target._l = renderList;
    // 用于呈现<slot>的运行时帮助程序 创建虚拟slot vonde
    target._t = renderSlot;
    // 检测a和b的数据类型，是否是不是数组或者对象，对象的key长度一样即可，数组长度一样即可
    target._q = looseEqual;
    // arr数组中的对象，或者对象数组是否和val 相等
    target._i = looseIndexOf;
    // 用于呈现静态树的运行时助手，创建静态虚拟vnode
    target._m = renderStatic;
    // 用于解析过滤器的运行时助手
    target._f = resolveFilter;
    // 检查两个key是否相等，如果不想等返回true 如果相等返回false
    target._k = checkKeyCodes;
    // 用于将v-bind="object"合并到VNode的数据中的运行时助手，检查value 是否是对象，并且为value 添加update 事件
    target._b = bindObjectProps;
    // 创建一个文本节点 vonde
    target._v = createTextVNode;
    // 创建一个节点为空的vnode
    target._e = createEmptyVNode;
    // 解决作用域插槽，把对象数组事件分解成对象
    target._u = resolveScopedSlots;
    // 判断value 是否是对象，并且为数据 data.on 合并data和value 的on 事件
    target._g = bindObjectListeners;
    target._d = bindDynamicKeys;
    target._p = prependModifier;
  }

  /*  */

  function FunctionalRenderContext (
    data,
    props,
    children,
    parent,
    Ctor
  ) {
    var this$1 = this;

    var options = Ctor.options;
    // ensure the createElement function in functional components
    // gets a unique context - this is necessary for correct named slot check
    var contextVm;
    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent);
      // $flow-disable-line
      contextVm._original = parent;
    } else {
      // the context vm passed in is a functional context as well.
      // in this case we want to make sure we are able to get a hold to the
      // real context instance.
      contextVm = parent;
      // $flow-disable-line
      parent = parent._original;
    }
    var isCompiled = isTrue(options._compiled);
    var needNormalization = !isCompiled;

    this.data = data;
    this.props = props;
    this.children = children;
    this.parent = parent;
    this.listeners = data.on || emptyObject;
    this.injections = resolveInject(options.inject, parent);
    this.slots = function () {
      if (!this$1.$slots) {
        normalizeScopedSlots(
          data.scopedSlots,
          this$1.$slots = resolveSlots(children, parent)
        );
      }
      return this$1.$slots
    };

    Object.defineProperty(this, 'scopedSlots', ({
      enumerable: true,
      get: function get () {
        return normalizeScopedSlots(data.scopedSlots, this.slots())
      }
    }));

    // support for compiled functional template
    if (isCompiled) {
      // exposing $options for renderStatic()
      this.$options = options;
      // pre-resolve slots for renderSlot()
      this.$slots = this.slots();
      this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
    }

    if (options._scopeId) {
      this._c = function (a, b, c, d) {
        var vnode = createElement(contextVm, a, b, c, d, needNormalization);
        if (vnode && !Array.isArray(vnode)) {
          vnode.fnScopeId = options._scopeId;
          vnode.fnContext = parent;
        }
        return vnode
      };
    } else {
      this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
    }
  }

  installRenderHelpers(FunctionalRenderContext.prototype);

  function createFunctionalComponent (
    Ctor,
    propsData,
    data,
    contextVm,
    children
  ) {
    var options = Ctor.options;
    var props = {};
    var propOptions = options.props;
    if (isDef(propOptions)) {
      for (var key in propOptions) {
        props[key] = validateProp(key, propOptions, propsData || emptyObject);
      }
    } else {
      if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
      if (isDef(data.props)) { mergeProps(props, data.props); }
    }

    var renderContext = new FunctionalRenderContext(
      data,
      props,
      children,
      contextVm,
      Ctor
    );

    var vnode = options.render.call(null, renderContext._c, renderContext);

    if (vnode instanceof VNode) {
      return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
    } else if (Array.isArray(vnode)) {
      var vnodes = normalizeChildren(vnode) || [];
      var res = new Array(vnodes.length);
      for (var i = 0; i < vnodes.length; i++) {
        res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
      }
      return res
    }
  }

  function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
    // #7817 clone node before setting fnContext, otherwise if the node is reused
    // (e.g. it was from a cached normal slot) the fnContext causes named slots
    // that should not be matched to match.
    var clone = cloneVNode(vnode);
    clone.fnContext = contextVm;
    clone.fnOptions = options;
    {
      (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
    }
    if (data.slot) {
      (clone.data || (clone.data = {})).slot = data.slot;
    }
    return clone
  }

  function mergeProps (to, from) {
    for (var key in from) {
      to[camelize(key)] = from[key];
    }
  }

  /*  */

  // inline hooks to be invoked on component VNodes during patch
  var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },

    prepatch: function prepatch (oldVnode, vnode) {
      var options = vnode.componentOptions;
      var child = vnode.componentInstance = oldVnode.componentInstance;
      updateChildComponent(
        child,
        options.propsData, // updated props
        options.listeners, // updated listeners
        vnode, // new parent vnode
        options.children // new children
      );
    },

    insert: function insert (vnode) {
      var context = vnode.context;
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');
      }
      if (vnode.data.keepAlive) {
        if (context._isMounted) {
          // vue-router#1212
          // During updates, a kept-alive component's child components may
          // change, so directly walking the tree here may call activated hooks
          // on incorrect children. Instead we push them into a queue which will
          // be processed after the whole patch process ended.
          queueActivatedComponent(componentInstance);
        } else {
          activateChildComponent(componentInstance, true /* direct */);
        }
      }
    },

    destroy: function destroy (vnode) {
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isDestroyed) {
        if (!vnode.data.keepAlive) {
          componentInstance.$destroy();
        } else {
          deactivateChildComponent(componentInstance, true /* direct */);
        }
      }
    }
  };

  var hooksToMerge = Object.keys(componentVNodeHooks);

  function createComponent (
    Ctor,
    data,
    context,
    children,
    tag
  ) {
    if (isUndef(Ctor)) {
      return
    }

    // 获得基础构造器baseCtor
    // 这里的context是指向vm实例
    // 在'globalp-api/index.js'中，可以看到option._base指向的是Vue
    // 而在'core/instance/init.js'中，已经将全局的options与vm实例的options合并，这样baseCtor指向的就是Vue
    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    if (isObject(Ctor)) {
      // 对组件的构造器Ctor进行扩展，实际上执行的是Vue.extend。
      // extend函数在'core/gloabal-api/extend.js'中定义
      // extend函数主要的功能是返回一个组件构造器（函数），拥有Vue相同的功能。
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    // 判断是不是函数，不是的话则抛出警告
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }

    // async component
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
      if (Ctor === undefined) {
        // return a placeholder node for async component, which is rendered
        // as a comment node but preserves all the raw information for the node.
        // the information will be used for async server-rendering and hydration.
        return createAsyncPlaceholder(
          asyncFactory,
          data,
          context,
          children,
          tag
        )
      }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    if (isDef(data.model)) {
      transformModel(Ctor.options, data);
    }

    // extract props
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    data.on = data.nativeOn;

    if (isTrue(Ctor.options.abstract)) {
      // abstract components do not keep anything
      // other than props & listeners & slot

      // work around flow
      var slot = data.slot;
      data = {};
      if (slot) {
        data.slot = slot;
      }
    }

    // install component management hooks onto the placeholder node
    // 处理组件的钩子函数
    installComponentHooks(data);

    // return a placeholder vnode
    // 注意：
    // 这个vnode中的children定义的是undefined，
    // 而在最后一个参数componentOptions中，传入了children，最后返回vnode
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );

    return vnode
  }

  function createComponentInstanceForVnode (
    vnode, // we know it's MountedComponentVNode but flow doesn't
    parent // activeInstance in lifecycle state
  ) {
    var options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: parent
    };
    // check inline-template render functions
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
      options.render = inlineTemplate.render;
      options.staticRenderFns = inlineTemplate.staticRenderFns;
    }
    return new vnode.componentOptions.Ctor(options)
  }

  function installComponentHooks (data) {
    // 获取到data中的hook
    var hooks = data.hook || (data.hook = {});
    // 循环hooksToMerge进行判断，如果data中存在该hook，则合并
    // 不存在则直接添加到data中
    // hooksToMerge定义为componentVNodeHooks的keys
    for (var i = 0; i < hooksToMerge.length; i++) {
      var key = hooksToMerge[i];
      var existing = hooks[key];
      var toMerge = componentVNodeHooks[key];
      if (existing !== toMerge && !(existing && existing._merged)) {
        hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
      }
    }
  }

  function mergeHook$1 (f1, f2) {
    var merged = function (a, b) {
      // flow complains about extra args which is why we use any
      f1(a, b);
      f2(a, b);
    };
    merged._merged = true;
    return merged
  }

  // transform component v-model info (value and callback) into
  // prop and event handler respectively.
  function transformModel (options, data) {
    var prop = (options.model && options.model.prop) || 'value';
    var event = (options.model && options.model.event) || 'input'
    ;(data.attrs || (data.attrs = {}))[prop] = data.model.value;
    var on = data.on || (data.on = {});
    var existing = on[event];
    var callback = data.model.callback;
    if (isDef(existing)) {
      if (
        Array.isArray(existing)
          ? existing.indexOf(callback) === -1
          : existing !== callback
      ) {
        on[event] = [callback].concat(existing);
      }
    } else {
      on[event] = callback;
    }
  }

  /*  */

  var SIMPLE_NORMALIZE = 1;
  var ALWAYS_NORMALIZE = 2;

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
  function createElement (
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
  ) {
    // 判断是否是数组或者基本数据类型(string，number，symbol，boolean)
    if (Array.isArray(data) || isPrimitive(data)) {
      normalizationType = children;
      children = data;
      data = undefined;
    }
    // 是否是alwaysNormalize类型
    if (isTrue(alwaysNormalize)) {
      normalizationType = ALWAYS_NORMALIZE;
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
  function _createElement (
    context,
    tag,
    data,
    children,
    normalizationType
  ) {
    // data 不存在，并且data的__ob__属性不存在的情况
    // 如果存在data.__ob__，说明data是被Observer观察的数据，不能用作虚拟节点的data，需要抛出警告，并返回一个空节点
    // NOTE:被监控的data不能被用作vnode渲染的数据的原因是：data在vnode渲染过程中可能会被改变，这样会触发监控，导致不符合预期的操作
    if (isDef(data) && isDef((data).__ob__)) {
       warn(
        "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
        'Always create fresh vnode data objects in each render!',
        context
      );
      // 创建一个空的vnode节点
      return createEmptyVNode()
    }
    // object syntax in v-bind
    // data存在并且data的is属性也存在的情况
    if (isDef(data) && isDef(data.is)) {
      tag = data.is;
    }
    // tag 不存在的情况
    if (!tag) {
      // in case of component :is set to falsy value
      // 当组件的is属性被设置为一个falsy的值，Vue将不会知道要把这个组件渲染成什么，所以渲染一个空节点
      return createEmptyVNode()
    }
    // warn against non-primitive key
    // data存在并且data的key属性存在而且属性key的值不为基本类型的情况
    if (
      isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
      {
        warn(
          'Avoid using non-primitive value as key, ' +
          'use string/number value instead.',
          context
        );
      }
    }
    // support single function children as default scoped slot
    // 支持作为默认作用域插槽的单函数子函数
    // 子节点是数组并且第一项为函数的情况
    if (Array.isArray(children) &&
      typeof children[0] === 'function'
    ) {
      data = data || {};
      data.scopedSlots = { default: children[0] }; // 获取插槽
      children.length = 0;
    }
    // 子节点规范
    if (normalizationType === ALWAYS_NORMALIZE) { // 2
      // 创建一个规范的子节点
      children = normalizeChildren(children);
    } else if (normalizationType === SIMPLE_NORMALIZE) { // 1
       // 把所有子节点的数组、子孙数组拍平在一个数组
      children = simpleNormalizeChildren(children);
    }
    var vnode, ns;
    // 判断 tag 为 string 类型的情况
    if (typeof tag === 'string') {
      var Ctor;
      // getTagNamespace获取标签名的命名空间，判断 tag 是否是svg或者math 标签
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      // 判断标签是不是html原有的标签
      if (config.isReservedTag(tag)) {
        // platform built-in elements
        if ( isDef(data) && isDef(data.nativeOn)) {
          warn(
            ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
            context
          );
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
        );
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
        vnode = createComponent(Ctor, data, context, children, tag);
      } else { // 否则创建一个未知的标签的 VNode
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
          tag, data, children,
          undefined, undefined, context
        );
      }
    } else { // 如果 tag 是一个 component 类型，则直接调用 createComponent 创建组件类型的VNode
      // direct component options / constructor
      vnode = createComponent(tag, data, context, children);
    }
    // vnode 是数组的情况
    if (Array.isArray(vnode)) {
      return vnode
    } else if (isDef(vnode)) { // vnode存在
      // ns 存在
      if (isDef(ns)) { applyNS(vnode, ns); }
      // data 存在
      if (isDef(data)) { registerDeepBindings(data); }
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
    vnode.ns = ns;
    if (vnode.tag === 'foreignObject') {
      // use default namespace inside foreignObject
      ns = undefined;
      force = true;
    }
    if (isDef(vnode.children)) { // 虚拟dom节点子节点存在
      for (var i = 0, l = vnode.children.length; i < l; i++) {
        var child = vnode.children[i];
        // 子节点tag存在
        if (isDef(child.tag) && (
          isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
          applyNS(child, ns, force); // 递归调用applyNS
        }
      }
    }
  }

  // ref #5318
  // necessary to ensure parent re-render when deep bindings like :style and
  // :class are used on slot nodes
  function registerDeepBindings (data) {
    if (isObject(data.style)) {
      traverse(data.style);
    }
    if (isObject(data.class)) {
      traverse(data.class);
    }
  }

  /*  */

  /**
   * 初始化渲染
   * @param {Vue实例} vm 
   */
  function initRender (vm) {
    // 根实例
    vm._vnode = null; // the root of the child tree
    // v-once 缓存树
    vm._staticTrees = null; // v-once cached trees
    var options = vm.$options; // 获取实例参数options
    // 父级的占位符节点
    var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
    // 上下文
    var renderContext = parentVnode && parentVnode.context;
    // TODO：插槽初始化
    // 判断 children 有没有分发式插槽，并且过滤掉空的插槽，并且收集插槽
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    // bind the createElement fn to this instance
    // so that we get proper render context inside it.
    // args order: tag, data, children, normalizationType, alwaysNormalize
    // internal version is used by render functions compiled from templates
    // 模板编译成的 render 函数使用
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    // normalization is always applied for the public version, used in
    // user-written render functions.
    // 用户手写 render  方法使用
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

    // $attrs & $listeners are exposed for easier HOC creation.
    // they need to be reactive so that HOCs using them are always updated
    // 获取父vnode data 属性
    var parentData = parentVnode && parentVnode.data;

    /* istanbul ignore else */
    {
      defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
        !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
      }, true);
      defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
        !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
      }, true);
    }
  }

  var currentRenderingInstance = null;

  /**
   * 初始化渲染的函数
   * @param {Vue构造器} Vue 
   */
  function renderMixin (Vue) {
    // install runtime convenience helpers
    // 给 Vue 原型上添加_x(例如_l)这样的函数
    installRenderHelpers(Vue.prototype);

    // 给 Vue 原型上添加 $nextTick API
    Vue.prototype.$nextTick = function (fn) {
      return nextTick(fn, this)
    };

    Vue.prototype._render = function () {
      // this是Vue实例
      var vm = this;
      // 获取render函数和父级vnode
      var ref = vm.$options;
      var render = ref.render;
      var _parentVnode = ref._parentVnode;

      if (_parentVnode) { // 判断是否有parentVnode
        // 标准化slot
        vm.$scopedSlots = normalizeScopedSlots(
          _parentVnode.data.scopedSlots,
          vm.$slots,
          vm.$scopedSlots
        );
      }

      // set parent vnode. this allows render functions to have access
      // to the data on the placeholder node.
      // 把父级的vnode赋值给vue实例的$vnode
      vm.$vnode = _parentVnode;
      // render self
      var vnode;
      try {
        // There's no need to maintain a stack because all render fns are called
        // separately from one another. Nested component's render fns are called
        // when parent component is patched.
        currentRenderingInstance = vm;
        // 核心方法，返回一个vnode
        // vm._renderProxy: this指向 其实就是vm
        // vm.$createElement: 这里虽然传参进去但是没有接收参数
        vnode = render.call(vm._renderProxy, vm.$createElement);
      } catch (e) {
        handleError(e, vm, "render");
        // return error render result,
        // or previous vnode to prevent render error causing blank component
        /* istanbul ignore else */
        //返回错误渲染结果，
        //或以前的vnode，以防止渲染错误导致空白组件
        if ( vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      } finally {
        currentRenderingInstance = null;
      }
      // if the returned array contains only a single node, allow it
      if (Array.isArray(vnode) && vnode.length === 1) {
        vnode = vnode[0];
      }
      // return empty vnode in case the render function errored out
      if (!(vnode instanceof VNode)) {
        if ( Array.isArray(vnode)) {
          warn(
            'Multiple root nodes returned from render function. Render function ' +
            'should return a single root node.',
            vm
          );
        }
        //创建一个节点,为注释节点,空的vnode
        vnode = createEmptyVNode();
      }
      // set parent
      vnode.parent = _parentVnode; // 设置父vnode
      return vnode
    };
  }

  /*  */

  function ensureCtor (comp, base) {
    if (
      comp.__esModule ||
      (hasSymbol && comp[Symbol.toStringTag] === 'Module')
    ) {
      comp = comp.default;
    }
    return isObject(comp)
      ? base.extend(comp)
      : comp
  }

  function createAsyncPlaceholder (
    factory,
    data,
    context,
    children,
    tag
  ) {
    var node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = { data: data, context: context, children: children, tag: tag };
    return node
  }

  function resolveAsyncComponent (
    factory,
    baseCtor
  ) {
    if (isTrue(factory.error) && isDef(factory.errorComp)) {
      return factory.errorComp
    }

    if (isDef(factory.resolved)) {
      return factory.resolved
    }

    var owner = currentRenderingInstance;
    if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
      // already pending
      factory.owners.push(owner);
    }

    if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
      return factory.loadingComp
    }

    if (owner && !isDef(factory.owners)) {
      var owners = factory.owners = [owner];
      var sync = true;
      var timerLoading = null;
      var timerTimeout = null

      ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

      var forceRender = function (renderCompleted) {
        for (var i = 0, l = owners.length; i < l; i++) {
          (owners[i]).$forceUpdate();
        }

        if (renderCompleted) {
          owners.length = 0;
          if (timerLoading !== null) {
            clearTimeout(timerLoading);
            timerLoading = null;
          }
          if (timerTimeout !== null) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
          }
        }
      };

      var resolve = once(function (res) {
        // cache resolved
        factory.resolved = ensureCtor(res, baseCtor);
        // invoke callbacks only if this is not a synchronous resolve
        // (async resolves are shimmed as synchronous during SSR)
        if (!sync) {
          forceRender(true);
        } else {
          owners.length = 0;
        }
      });

      var reject = once(function (reason) {
         warn(
          "Failed to resolve async component: " + (String(factory)) +
          (reason ? ("\nReason: " + reason) : '')
        );
        if (isDef(factory.errorComp)) {
          factory.error = true;
          forceRender(true);
        }
      });

      var res = factory(resolve, reject);

      if (isObject(res)) {
        if (isPromise(res)) {
          // () => Promise
          if (isUndef(factory.resolved)) {
            res.then(resolve, reject);
          }
        } else if (isPromise(res.component)) {
          res.component.then(resolve, reject);

          if (isDef(res.error)) {
            factory.errorComp = ensureCtor(res.error, baseCtor);
          }

          if (isDef(res.loading)) {
            factory.loadingComp = ensureCtor(res.loading, baseCtor);
            if (res.delay === 0) {
              factory.loading = true;
            } else {
              timerLoading = setTimeout(function () {
                timerLoading = null;
                if (isUndef(factory.resolved) && isUndef(factory.error)) {
                  factory.loading = true;
                  forceRender(false);
                }
              }, res.delay || 200);
            }
          }

          if (isDef(res.timeout)) {
            timerTimeout = setTimeout(function () {
              timerTimeout = null;
              if (isUndef(factory.resolved)) {
                reject(
                   ("timeout (" + (res.timeout) + "ms)")
                    
                );
              }
            }, res.timeout);
          }
        }
      }

      sync = false;
      // return in case resolved synchronously
      return factory.loading
        ? factory.loadingComp
        : factory.resolved
    }
  }

  /*  */

  function isAsyncPlaceholder (node) {
    return node.isComment && node.asyncFactory
  }

  /*  */

  function getFirstComponentChild (children) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
          return c
        }
      }
    }
  }

  /*  */

  /**
   * 初始化事件
   * @param {Vue实例} vm 
   */
  function initEvents (vm) {
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    var listeners = vm.$options._parentListeners;
    if (listeners) {
      updateComponentListeners(vm, listeners);
    }
  }

  var target;

  function add (event, fn) {
    target.$on(event, fn);
  }

  function remove$1 (event, fn) {
    target.$off(event, fn);
  }

  function createOnceHandler (event, fn) {
    var _target = target;
    return function onceHandler () {
      var res = fn.apply(null, arguments);
      if (res !== null) {
        _target.$off(event, onceHandler);
      }
    }
  }

  function updateComponentListeners (
    vm,
    listeners,
    oldListeners
  ) {
    target = vm;
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
    target = undefined;
  }

  /**
   * 初始化事件绑定方法
   * @param {Vue构造函数} Vue 
   */
  function eventsMixin (Vue) {
    var hookRE = /^hook:/;
    Vue.prototype.$on = function (event, fn) {
      var vm = this;
      if (Array.isArray(event)) {
        for (var i = 0, l = event.length; i < l; i++) {
          vm.$on(event[i], fn);
        }
      } else {
        (vm._events[event] || (vm._events[event] = [])).push(fn);
        // optimize hook:event cost by using a boolean flag marked at registration
        // instead of a hash lookup
        if (hookRE.test(event)) {
          vm._hasHookEvent = true;
        }
      }
      return vm
    };

    Vue.prototype.$once = function (event, fn) {
      var vm = this;
      function on () {
        vm.$off(event, on);
        fn.apply(vm, arguments);
      }
      on.fn = fn;
      vm.$on(event, on);
      return vm
    };

    Vue.prototype.$off = function (event, fn) {
      var vm = this;
      // all
      if (!arguments.length) {
        vm._events = Object.create(null);
        return vm
      }
      // array of events
      if (Array.isArray(event)) {
        for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
          vm.$off(event[i$1], fn);
        }
        return vm
      }
      // specific event
      var cbs = vm._events[event];
      if (!cbs) {
        return vm
      }
      if (!fn) {
        vm._events[event] = null;
        return vm
      }
      // specific handler
      var cb;
      var i = cbs.length;
      while (i--) {
        cb = cbs[i];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i, 1);
          break
        }
      }
      return vm
    };

    Vue.prototype.$emit = function (event) {
      var vm = this;
      {
        var lowerCaseEvent = event.toLowerCase();
        if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
          tip(
            "Event \"" + lowerCaseEvent + "\" is emitted in component " +
            (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
            "Note that HTML attributes are case-insensitive and you cannot use " +
            "v-on to listen to camelCase events when using in-DOM templates. " +
            "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
          );
        }
      }
      var cbs = vm._events[event];
      if (cbs) {
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        var args = toArray(arguments, 1);
        var info = "event handler for \"" + event + "\"";
        for (var i = 0, l = cbs.length; i < l; i++) {
          invokeWithErrorHandling(cbs[i], vm, args, vm, info);
        }
      }
      return vm
    };
  }

  /*  */

  var activeInstance = null;
  // 定义 isUpdatingChildComponent，并初始化为 false
  var isUpdatingChildComponent = false;

  /**
   * 保存了一个activeInstance是vm实例的状态
   * @param {vue实例} vm 
   */
  function setActiveInstance(vm) {
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    return function () {
      activeInstance = prevActiveInstance;
    }
  }

  /**
   * 初始化生命周期
   * @param {vue实例} vm 
   */
  function initLifecycle (vm) {
    var options = vm.$options;

    // locate first non-abstract parent(查找第一个非抽象的父组件)
    // 定义 parent，它引用当前实例的父实例
    var parent = options.parent;
    // 如果当前实例有父组件，且当前实例不是抽象的
    if (parent && !options.abstract) {
      // 使用 while 循环查找第一个非抽象的父组件
      while (parent.$options.abstract && parent.$parent) {
        // 沿着父实例链逐层向上寻找到第一个不抽象的实例作为 parent（父级）
        parent = parent.$parent;
      }
      // 经过上面的 while 循环后，parent 应该是一个非抽象的组件，
      // 将它作为当前实例的父级，所以将当前实例 vm 添加到父级的 $children 属性里
      parent.$children.push(vm);
    }

    // 设置当前实例的 $parent 属性，指向父级
    vm.$parent = parent;
    // 设置 $root 属性，有父级就是用父级的 $root，否则 $root 指向自身
    vm.$root = parent ? parent.$root : vm;

    // 添加$children属性
    vm.$children = [];
    // 添加$refs属性
    vm.$refs = {};

    vm._watcher = null; // 观察者
    vm._inactive = null; // 禁用的组件状态标志
    vm._directInactive = false; // 不活跃，禁用的组件标志
    vm._isMounted = false; // 标志是否触发过钩子Mounted
    vm._isDestroyed = false; // 是否已经销毁的组件标志
    vm._isBeingDestroyed = false; // 如果为true 则不触发 beforeDestroy 钩子函数 和destroyed 钩子函数
  }

  /**
   * 初始化vue 更新/销毁
   * @param {Vue构造器} Vue 
   */
  function lifecycleMixin (Vue) {
    /**
     * 将vnode转换成dom，渲染在视图中
     * @param {vnode dom虚拟节点} vnode 
     * @param {布尔类型的参数是跟ssr相关} hydrating 
     */
    Vue.prototype._update = function (vnode, hydrating) {
      var vm = this;
      var prevEl = vm.$el; // 获取vue实例的el节点
      var prevVnode = vm._vnode; // 获取前置Vnode，第一次渲染时为空
      var restoreActiveInstance = setActiveInstance(vm);
      vm._vnode = vnode;
      // Vue.prototype.__patch__ is injected in entry points
      // based on the rendering backend used.
      // 如果这个prevVnode不存在表示上一次没有创建过vnode，
      // 这个组件或者new Vue 是第一次进来
      if (!prevVnode) {
        // initial render
        // TODO:(重点分析:首次渲染) 首次渲染传入真实dom
        vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
      } else {
        // updates
        // TODO:(重点分析:数据更新)
        vm.$el = vm.__patch__(prevVnode, vnode);
      }
      restoreActiveInstance();
      // update __vue__ reference
      if (prevEl) {
        prevEl.__vue__ = null;
      }
      if (vm.$el) {
        vm.$el.__vue__ = vm;
      }
      // if parent is an HOC, update its $el as well
      if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
        vm.$parent.$el = vm.$el;
      }
      // updated hook is called by the scheduler to ensure that children are
      // updated in a parent's updated hook.
    };

    // 更新观察者数据
    Vue.prototype.$forceUpdate = function () {
      var vm = this;
      if (vm._watcher) {
        vm._watcher.update();
      }
    };

    // 销毁组建周期函数
    Vue.prototype.$destroy = function () {
      var vm = this;
      // 如果是已经销毁过则不会再执行
      if (vm._isBeingDestroyed) {
        return
      }
      // TODO:(生命周期:beforeDestroy)
      callHook(vm, 'beforeDestroy');
      vm._isBeingDestroyed = true;
      // remove self from parent
      // 从父节点移除self
      var parent = vm.$parent;
      if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
        remove(parent.$children, vm); // 删除父节点
      }
      // teardown watchers
      // 拆卸观察者
      if (vm._watcher) {
        vm._watcher.teardown();
      }
      var i = vm._watchers.length;
      while (i--) {
        vm._watchers[i].teardown();
      }
      // remove reference from data ob
      // frozen object may not have observer.
      if (vm._data.__ob__) {
        // 从数据ob中删除引用
        vm._data.__ob__.vmCount--;
      }
      // call the last hook...
      vm._isDestroyed = true;
      // invoke destroy hooks on current rendered tree
      vm.__patch__(vm._vnode, null);
      // fire destroyed hook
      // TODO:(生命周期:destroyed)
      callHook(vm, 'destroyed');
      // turn off all instance listeners.
      // 销毁事件监听器
      vm.$off();
      // remove __vue__ reference
      // 删除vue 参数
      if (vm.$el) {
        vm.$el.__vue__ = null;
      }
      // release circular reference (#6759)
      // 释放循环引用，销毁父节点
      if (vm.$vnode) {
        vm.$vnode.parent = null;
      }
    };
  }

  /**
   * 挂载组件
   * @param {Vue实例} vm 
   * @param {元素} el 
   * @param {新的虚拟dom vonde} hydrating 
   */
  function mountComponent (
    vm,
    el,
    hydrating
  ) {
    vm.$el = el;
    // 没有渲染函数的情况
    if (!vm.$options.render) {
      vm.$options.render = createEmptyVNode; // 创建一个空的组件
      {
        /* istanbul ignore if */
        // 模版存在并且第一个字符不为#则报警告
        // 实例的配置项中el存在或el实参存在时则报警告
        if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
          vm.$options.el || el) {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'compiler is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          );
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          );
        }
      }
    }
    // TODO:(生命周期:beforeMount) 调用生命周期钩子beforeMount
    callHook(vm, 'beforeMount');
    // 定义更新组件
    var updateComponent;
    /* istanbul ignore if */
    // 开启了性能追踪时的分支
    if ( config.performance && mark) {
      updateComponent = function () {
        var name = vm._name;
        var id = vm._uid;
        var startTag = "vue-perf-start:" + id;
        var endTag = "vue-perf-end:" + id;

        mark(startTag); // 插入一个名称，并记录插入名称的时间
        var vnode = vm._render(); // 获取虚拟dom
        mark(endTag);
        measure(("vue " + name + " render"), startTag, endTag);

        mark(startTag); // 浏览器性能时间戳监听
        // 更新组件
        vm._update(vnode, hydrating);
        mark(endTag);
        measure(("vue " + name + " patch"), startTag, endTag);
      };
    } else {
      updateComponent = function () {
        // 首先vm._update和vm._render这两个方法是定义在Vue原型上的
        // 1.vm._render()把实例渲染成一个虚拟 Node
        // 2.vm._update更新 DOM，内部调用 vm.__patch__转换成真正的 DOM 节点
        vm._update(vm._render(), hydrating);
      };
    }

    // we set this to vm._watcher inside the watcher's constructor
    // since the watcher's initial patch may call $forceUpdate (e.g. inside child
    // component's mounted hook), which relies on vm._watcher being already defined
    /**
     * 创建 watcher(观察者)
     * @param {Vue实例} vm 
     * @param {数据绑定完之后回调该函数(更新组件函数)更新 view 视图} updateComponent 
     * @param {回调函数} noop 
     * @param {参数} options
     * @param {是否渲染过得观察者} isRenderWatcher
     */
    new Watcher(vm, updateComponent, noop, {
      before: function before () {
        if (vm._isMounted && !vm._isDestroyed) { // 如果已经挂载了，并且没有销毁
          // TODO:(生命周期:beforeUpdate) 调用生命周期钩子beforeUpdate
          callHook(vm, 'beforeUpdate');
        }
      }
    }, true /* isRenderWatcher */);
    hydrating = false;

    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
      vm._isMounted = true; // 设置vm._isMounted为true,表示已挂载
      // TODO:(生命周期:mounted) 调用生命周期钩子mounted
      callHook(vm, 'mounted');
    }
    return vm
  }

  function updateChildComponent (
    vm,
    propsData,
    listeners,
    parentVnode,
    renderChildren
  ) {
    {
      isUpdatingChildComponent = true;
    }

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren.

    // check if there are dynamic scopedSlots (hand-written or compiled but with
    // dynamic slot names). Static scoped slots compiled from template has the
    // "$stable" marker.
    var newScopedSlots = parentVnode.data.scopedSlots;
    var oldScopedSlots = vm.$scopedSlots;
    var hasDynamicScopedSlot = !!(
      (newScopedSlots && !newScopedSlots.$stable) ||
      (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
      (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
    );

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    var needsForceUpdate = !!(
      renderChildren ||               // has new static slots
      vm.$options._renderChildren ||  // has old static slots
      hasDynamicScopedSlot
    );

    vm.$options._parentVnode = parentVnode;
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render

    if (vm._vnode) { // update child tree's parent
      vm._vnode.parent = parentVnode;
    }
    vm.$options._renderChildren = renderChildren;

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    vm.$attrs = parentVnode.data.attrs || emptyObject;
    vm.$listeners = listeners || emptyObject;

    // update props
    if (propsData && vm.$options.props) {
      toggleObserving(false);
      var props = vm._props;
      var propKeys = vm.$options._propKeys || [];
      for (var i = 0; i < propKeys.length; i++) {
        var key = propKeys[i];
        var propOptions = vm.$options.props; // wtf flow?
        props[key] = validateProp(key, propOptions, propsData, vm);
      }
      toggleObserving(true);
      // keep a copy of raw propsData
      vm.$options.propsData = propsData;
    }

    // update listeners
    listeners = listeners || emptyObject;
    var oldListeners = vm.$options._parentListeners;
    vm.$options._parentListeners = listeners;
    updateComponentListeners(vm, listeners, oldListeners);

    // resolve slots + force update if has children
    if (needsForceUpdate) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context);
      vm.$forceUpdate();
    }

    {
      isUpdatingChildComponent = false;
    }
  }

  /**
   * 循环父树层，如果有不活跃的则返回真
   * @param {vue实例} vm 
   */
  function isInInactiveTree (vm) {
    while (vm && (vm = vm.$parent)) { // 循环父节点如果父节点有_inactive 则返回true
      if (vm._inactive) { return true }
    }
    return false
  }

  /**
   * 判断是否有不活跃的组件如有则禁用，如果有活跃组件则触发钩子函数activated
   * @param {vue实例} vm 
   * @param {} direct 
   */
  function activateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = false;
      if (isInInactiveTree(vm)) { // 如果有不活跃的树，或者被禁用组件
        return
      }
    } else if (vm._directInactive) { // 单个不活跃的
      return
    }
    if (vm._inactive || vm._inactive === null) {
      vm._inactive = false;
      for (var i = 0; i < vm.$children.length; i++) {
        activateChildComponent(vm.$children[i]); // 递归循环 禁用子组件
      }
      // TODO:(生命周期:activated)
      callHook(vm, 'activated');
    }
  }

  /**
   * 判断是否有禁止的组件，如果有活跃组件则执行生命后期函数deactivated
   * @param {vue实例} vm 
   * @param {*} direct 
   */
  function deactivateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = true;
      if (isInInactiveTree(vm)) {
        return
      }
    }
    if (!vm._inactive) { // 如果该组件是活跃的
      vm._inactive = true; // 设置活动中的树
      for (var i = 0; i < vm.$children.length; i++) {
        deactivateChildComponent(vm.$children[i]);
      }
      // TODO:(生命周期:deactivated)
      callHook(vm, 'deactivated');
    }
  }

  /**
   * 调用钩子函数
   * @param {vue实例} vm 
   * @param {钩子函数的key，例如:beforeCreate、created等} hook 
   */
  function callHook (vm, hook) {
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget(); // 入栈target
    var handlers = vm.$options[hook]; // 获取生命周期函数 
    var info = hook + " hook";
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) { // 遍历生命周期函数
        invokeWithErrorHandling(handlers[i], vm, null, vm, info); // 执行该函数，以vm作为上下文
      }
    }
    if (vm._hasHookEvent) {
      vm.$emit('hook:' + hook);
    }
    popTarget(); // 出栈target
  }

  /*  */

  var MAX_UPDATE_COUNT = 100;

  var queue = [];
  var activatedChildren = [];
  var has = {};
  var circular = {};
  var waiting = false;
  var flushing = false;
  var index = 0;

  /**
   * Reset the scheduler's state.
   */
  function resetSchedulerState () {
    index = queue.length = activatedChildren.length = 0;
    has = {};
    {
      circular = {};
    }
    waiting = flushing = false;
  }

  // Async edge case #6566 requires saving the timestamp when event listeners are
  // attached. However, calling performance.now() has a perf overhead especially
  // if the page has thousands of event listeners. Instead, we take a timestamp
  // every time the scheduler flushes and use that for all event listeners
  // attached during that flush.
  var currentFlushTimestamp = 0;

  // Async edge case fix requires storing an event listener's attach timestamp.
  var getNow = Date.now;

  // Determine what event timestamp the browser is using. Annoyingly, the
  // timestamp can either be hi-res (relative to page load) or low-res
  // (relative to UNIX epoch), so in order to compare time we have to use the
  // same timestamp type when saving the flush timestamp.
  // All IE versions use low-res event timestamps, and have problematic clock
  // implementations (#9632)
  if (inBrowser && !isIE) {
    var performance = window.performance;
    if (
      performance &&
      typeof performance.now === 'function' &&
      getNow() > document.createEvent('Event').timeStamp
    ) {
      // if the event timestamp, although evaluated AFTER the Date.now(), is
      // smaller than it, it means the event is using a hi-res timestamp,
      // and we need to use the hi-res version for event listener timestamps as
      // well.
      getNow = function () { return performance.now(); };
    }
  }

  /**
   * Flush both queues and run the watchers.
   */
  function flushSchedulerQueue () {
    currentFlushTimestamp = getNow();
    flushing = true;
    var watcher, id;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort(function (a, b) { return a.id - b.id; });

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
      watcher = queue[index];
      if (watcher.before) {
        watcher.before();
      }
      id = watcher.id;
      has[id] = null;
      watcher.run();
      // in dev build, check and stop circular updates.
      if ( has[id] != null) {
        circular[id] = (circular[id] || 0) + 1;
        if (circular[id] > MAX_UPDATE_COUNT) {
          warn(
            'You may have an infinite update loop ' + (
              watcher.user
                ? ("in watcher with expression \"" + (watcher.expression) + "\"")
                : "in a component render function."
            ),
            watcher.vm
          );
          break
        }
      }
    }

    // keep copies of post queues before resetting state
    var activatedQueue = activatedChildren.slice();
    var updatedQueue = queue.slice();

    resetSchedulerState();

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue); // 执行activated钩子函数
    callUpdatedHooks(updatedQueue); // 执行updated钩子函数

    // devtool hook
    /* istanbul ignore if */
    if (devtools && config.devtools) {
      devtools.emit('flush');
    }
  }

  /**
   * 执行updated钩子函数
   * @param {watcher队列} queue 
   */
  function callUpdatedHooks (queue) {
    var i = queue.length;
    while (i--) {
      var watcher = queue[i];
      var vm = watcher.vm;
      if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
        // TODO:(生命周期:updated)
        callHook(vm, 'updated');
      }
    }
  }

  /**
   * Queue a kept-alive component that was activated during patch.
   * The queue will be processed after the entire tree has been patched.
   */
  function queueActivatedComponent (vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    vm._inactive = false;
    activatedChildren.push(vm);
  }

  /**
   * 执行activated钩子函数
   * @param {watcher队列} queue 
   */
  function callActivatedHooks (queue) {
    for (var i = 0; i < queue.length; i++) {
      queue[i]._inactive = true;
      activateChildComponent(queue[i], true /* true */);
    }
  }

  /**
   * Push a watcher into the watcher queue.
   * Jobs with duplicate IDs will be skipped unless it's
   * pushed when the queue is being flushed.
   */
  /**
   * 将观察者放到一个队列中等待所有突变完成之后统一执行更新
   * @param {观察者实例} watcher 
   */
  function queueWatcher (watcher) {
    // 获取观察者对象的唯一 id
    var id = watcher.id;
    // 避免将相同的观察者重复入队
    if (has[id] == null) {
      // 将该观察者的 id 值登记到 has 对象上作为 has 对象的属性同时将该属性值设置为 true
      has[id] = true;
      // 判断是否执行更新，flushing 为 true 表示正在更新
      if (!flushing) {
        // 入队
        queue.push(watcher);
      } else {
        // if already flushing, splice the watcher based on its id
        // if already past its id, it will be run next immediately.
        var i = queue.length - 1;
        while (i > index && queue[i].id > watcher.id) {
          i--;
        }
        queue.splice(i + 1, 0, watcher);
      }
      // queue the flush
      if (!waiting) {
        waiting = true;

        if ( !config.async) {
          // flushSchedulerQueue 函数的作用之一就是用来将队列中的观察者统一执行更新的
          flushSchedulerQueue();
          return
        }
        // 调用nextTick
        nextTick(flushSchedulerQueue);
      }
    }
  }

  /*  */



  var uid$1 = 0;

  /**
   * A watcher parses an expression, collects dependencies,
   * and fires callback when the expression value changes.
   * This is used for both the $watch() api and directives.
   */
  var Watcher = function Watcher (
    vm, // vm dom
    expOrFn, // 获取值的函数，或者是更新viwe试图函数
    cb, // 回调函数,回调值给回调函数
    options, // 参数
    isRenderWatcher // 是否渲染过得观察者
  ) {
    this.vm = vm;
    // 是否是已经渲染过得观察者
    if (isRenderWatcher) {
      // 把当前 Watcher 对象赋值给 vm._watcher上
      vm._watcher = this;
    }
    // 把观察者添加到队列里面 当前Watcher添加到vue实例上
    vm._watchers.push(this);
    // options
    // 如果有参数
    if (options) {
      this.deep = !!options.deep; // 用来告诉当前观察者实例对象是否是深度观测
      this.user = !!options.user; // 用来标识当前观察者实例对象是 开发者定义的 还是 内部定义的
      this.lazy = !!options.lazy; // 懒惰渲染，用来标识当前观察者实例对象是否是计算属性的观察者
      this.sync = !!options.sync; // 用来告诉观察者当数据变化时是否同步求值并执行回调
      this.before = options.before; // 可以理解为 Watcher 实例的钩子，当数据变化之后，触发更新之前，调用在创建渲染函数的观察者实例对象时传递的 `before` 选项
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb; // 回调函数
    this.id = ++uid$1; // uid for batching // uid为批处理监听者id
    this.active = true; // 激活
    this.dirty = this.lazy; // for lazy watchers // 对于懒惰的观察者
    this.deps = []; // 观察者队列
    this.newDeps = []; // 新的观察者队列
    // 内容不可重复的数组对象
    this.depIds = new _Set();
    this.newDepIds = new _Set();
    // 把函数变成字符串形式
    this.expression =  expOrFn.toString()
      ;
    // parse expression for getter
    // getter的解析表达式
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn); // get对应的是parsePath()返回的匿名函数
      if (!this.getter) {
        this.getter = noop;
         warn(
          "Failed watching path: \"" + expOrFn + "\" " +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        );
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get(); // 最后会执行get()方法
  };

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  Watcher.prototype.get = function get () {
    // 将当前用户watch保存到Dep.target中
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
      // 执行用户wathcer的getter()方法，此方法会将当前用户watcher作为订阅者订阅起来
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        // 深度收集 value 中的key
        traverse(value);
      }
      // 恢复之前的watcher
      popTarget();
      // 清理依赖项集合
      this.cleanupDeps();
    }
    return value
  };

  /**
   * Add a dependency to this directive.
   */
  Watcher.prototype.addDep = function addDep (dep) {
    var id = dep.id; // dep.id 一个持续相加的id
    if (!this.newDepIds.has(id)) { // 如果id不存在
      this.newDepIds.add(id); // 添加一个id
      this.newDeps.push(dep); // 添加一个deps
      if (!this.depIds.has(id)) { // 如果depIds不存在id则添加一个sub
        // 添加一个sub
        dep.addSub(this);
      }
    }
  };

  /**
   * Clean up for dependency collection.
   */
  Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var i = this.deps.length;
    while (i--) {
      var dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this); //清除 sub
      }
    }
    var tmp = this.depIds; // 获取depids
    this.depIds = this.newDepIds; // 获取新的depids
    this.newDepIds = tmp; // 旧的覆盖新的
    this.newDepIds.clear(); //清空对象
    // 互换值
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  };

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  Watcher.prototype.update = function update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true;
    } else if (this.sync) {
      // 如果$this.sync为true，则直接运行this.run获取结果，
      // 这里对应watch的值为对象且含有sync属性的情况
      this.run();
    } else {
      // 否则调用queueWatcher()函数把所有要执行update()的watch push到队列中
      queueWatcher(this);
    }
  };

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  Watcher.prototype.run = function run () {
    if (this.active) {
      var value = this.get(); // 获取新值
      if (
        value !== this.value || // 新值和旧值不相等
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) || // 新值是对象
        this.deep // deep为true
      ) {
        // set new value
        var oldValue = this.value;
        this.value = value;
        if (this.user) { // 如果是个用户 watcher
          try {
            // 执行这个回调函数 vm作为上下文 参数1为新值 参数2为旧值，
            // 也就是最后我们自己定义的function(newval,val){ console.log(newval,val) }函数
            this.cb.call(this.vm, value, oldValue);
          } catch (e) {
            handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
          }
        } else {
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  };

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  /**
   * 为计算watcher量身定制的
   */
  Watcher.prototype.evaluate = function evaluate () {
    // 调用计算属性的get方法，此时如果有依赖其他属性，则会在其他属性的dep对象里将当前计算watcher作为订阅者
    this.value = this.get();
    // 修正this.dirty为false,即一个渲染watcher渲染多个计算属性时，只会执行一次
    this.dirty = false;
  };

  /**
   * Depend on all deps collected by this watcher.
   */
  Watcher.prototype.depend = function depend () {
    // 获取计算watcher的所有deps
    var i = this.deps.length;
    while (i--) {
      // 为该deps增加渲染watcher
      this.deps[i].depend();
    }
  };

  /**
   * Remove self from all dependencies' subscriber list.
   */
  Watcher.prototype.teardown = function teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }
      var i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  };

  /*  */

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
  var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true, // 
    get: noop,
    set: noop
  };

  /**
   * 代理data/props，使得可以直接通过 this.key 访问 this._data.key / this._props.key
   * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
   * @param {Vue实例或Vue原型} target 
   * @param {_data/_props} sourceKey 
   * @param {data或props的属性} key 
   */
  function proxy (target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter () {
      return this[sourceKey][key]
    };
    sharedPropertyDefinition.set = function proxySetter (val) {
      this[sourceKey][key] = val;
    };
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  /**
   * 初始化 `props` 属性、`data` 属性、`methods` 属性、`computed` 属性、`watch` 属性
   * @param {vue实例} vm 
   */
  function initState (vm) {
    vm._watchers = []; //初始化观察者队列
    // new Vue(options) 中的 options
    var opts = vm.$options;
    // 将props配置项中属性转化为vue实例的响应式属性
    if (opts.props) { initProps(vm, opts.props); }
    // 将 methods配置项中的方法添加到 vue实例对象中
    if (opts.methods) { initMethods(vm, opts.methods); }
    // 将data配置项中的属性转化为vue实例的响应式属性
    if (opts.data) {
      initData(vm);
    } else {
      observe(vm._data = {}, true /* asRootData */);
    }
    if (opts.computed) { initComputed(vm, opts.computed); } // 初始化computed
    // Firefox has a "watch" function on Object.prototype
    // 如果传入了watch 且 watch不等于nativeWatch
    // (细节处理，在Firefox浏览器下Object的原型上含有一个watch函数)
    if (opts.watch && opts.watch !== nativeWatch) {
      initWatch(vm, opts.watch); // 初始化watch
    }
  }

  /**
   * 初始化props
   * @param {Vue实例} vm 
   * @param {props属性对象} propsOptions 
   */
  function initProps (vm, propsOptions) {
    // todo：propsData是什么？
    var propsData = vm.$options.propsData || {};
    var props = vm._props = {};
    // cache prop keys so that future props updates can iterate using Array
    // instead of dynamic object key enumeration.
    // 缓存props的key值
    var keys = vm.$options._propKeys = [];
    // 是否根组件
    var isRoot = !vm.$parent;
    // root instance props should be converted
    // 如果不是根组件则没必要转换成响应式数据
    if (!isRoot) {
      // 控制是否转换成响应式数据
      toggleObserving(false);
    }
    var loop = function ( key ) {
      keys.push(key);
      // 获取props的值
      var value = validateProp(key, propsOptions, propsData, vm);
      /* istanbul ignore else */
      {
        // 用连接符 - 替换驼峰命名，比如把驼峰 aBc 变成了 a-bc
        var hyphenatedKey = hyphenate(key);
        // 检查属性是否为保留属性
        if (isReservedAttribute(hyphenatedKey) ||
            config.isReservedAttr(hyphenatedKey)) {
          warn(
            ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
            vm
          );
        }
        //通过defineProperty的set方法去通知notify()订阅者subscribers有新的值修改
        defineReactive(props, key, value, function () {
          if (!isRoot && !isUpdatingChildComponent) {
            warn(
              "Avoid mutating a prop directly since the value will be " +
              "overwritten whenever the parent component re-renders. " +
              "Instead, use a data or computed property based on the prop's " +
              "value. Prop being mutated: \"" + key + "\"",
              vm
            );
          }
        });
      }
      // static props are already proxied on the component's prototype
      // during Vue.extend(). We only need to proxy props defined at
      // instantiation here.
      // 把props代理到Vue实例上来，可以直接通过this.props访问
      if (!(key in vm)) {
        proxy(vm, "_props", key);
      }
    };

    for (var key in propsOptions) loop( key );
    toggleObserving(true);
  }

  /**
   * 初始化数据，获取到 options.data 将他们添加到监听队列中
   * @param {vue实例} vm 
   */
  function initData (vm) {
    // 获取data配置项对象
    var data = vm.$options.data;
    // 组件实例的data配置项是一个函数
    data = vm._data = typeof data === 'function'
      ? getData(data, vm)
      : data || {};
    if (!isPlainObject(data)) {
      data = {};
       warn(
        'data functions should return an object:\n' +
        'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      );
    }
    // proxy data on instance
    // 获取data配置项的属性值
    var keys = Object.keys(data);
    // 获取props配置项的属性值
    var props = vm.$options.props;
    // 获取methods配置项的属性值；
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
      var key = keys[i];
      {
        // methods配置项和data配置项中的属性不能同名
        if (methods && hasOwn(methods, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a data property."),
            vm
          );
        }
      }
      // props配置项和data配置项中的属性不能同名
      if (props && hasOwn(props, key)) {
         warn(
          "The data property \"" + key + "\" is already declared as a prop. " +
          "Use prop default value instead.",
          vm
        );
      } else if (!isReserved(key)) { // 如果属性不是$,_ 开头(vue的保留属性)
        // 建立 vue实例 和 _data 的关联关系性
        // 代理data，使得可以直接通过 this.key 访问 this._data.key
        proxy(vm, "_data", key);
      }
    }
    // observe data
    // 观察data对象， 将对象属性全部转化为响应式属性
    observe(data, true /* asRootData */);
  }
  /**
   * 获取data属性返回的响应式数据
   * @param {组件的data属性} data 
   * @param {vm实例} vm 
   */
  function getData (data, vm) {
    // #7573 disable dep collection when invoking data getters
    pushTarget(); // 为了防止使用 props 数据初始化 data 数据时收集冗余的依赖
    try {
      return data.call(vm, vm)
    } catch (e) {
      handleError(e, vm, "data()");
      return {}
    } finally {
      popTarget();
    }
  }

  // 计算属性的配置信息
  var computedWatcherOptions = { lazy: true };

  /**
   * 初始化计算属性
   * @param {Vue实例} vm 
   * @param {计算属性} computed 
   */
  function initComputed (vm, computed) {
    // $flow-disable-line
    // 定义一个空对象，没有原型的，用于存储所有计算属性对应的watcher
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    // 计算的属性只是SSR期间的getter
    // 服务器呈现  判断是不是node 服务器环境
    var isSSR = isServerRendering();

    for (var key in computed) {
      // 将计算属性的值保存到userDef里面
      var userDef = computed[key];
      // 如果userDef是一个函数则赋值给getter,否则将userDef.get赋值给getter
      var getter = typeof userDef === 'function' ? userDef : userDef.get;
      // 如果getter 是空,警告
      if ( getter == null) {
        warn(
          ("Getter is missing for computed property \"" + key + "\"."),
          vm
        );
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
        );
      }

      // component-defined computed properties are already defined on the
      // component prototype. We only need to define computed properties defined
      // at instantiation here.
      // 如果key在vm中没有定义
      // 注:组件的计算属性在模块加载的时候已经被定义在了原型上面了
      if (!(key in vm)) {
        // 定义计算属性并且把属性的数据添加到对象监听中
        defineComputed(vm, key, userDef);
      } else { // 如果判断属性监听的key 在 data 中则发出警告
        if (key in vm.$data) {
          warn(("The computed property \"" + key + "\" is already defined in data."), vm);
        } else if (vm.$options.props && key in vm.$options.props) { // 如果判断属性监听的key 在 props 中则发出警告
          warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
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
  function defineComputed (
    target,
    key,
    userDef
  ) {
    // 是否是浏览器环境
    var shouldCache = !isServerRendering();
    // 属性的值如果是个函数
    if (typeof userDef === 'function') {
      
      sharedPropertyDefinition.get = shouldCache
        ? createComputedGetter(key) // 是浏览器环境，创建计算属性获取值，收集 dep 依赖
        : createGetterInvoker(userDef); // node服务器环境
      sharedPropertyDefinition.set = noop; // 赋值一个空函数
    } else {
      sharedPropertyDefinition.get = userDef.get // 如果userDef.get 存在
        ? shouldCache && userDef.cache !== false // 缓存
          ? createComputedGetter(key) //创建计算属性获取值，收集 dep 依赖
          : createGetterInvoker(userDef.get) // node服务器环境
        : noop;
      sharedPropertyDefinition.set = userDef.set || noop;
    }
    if (
        sharedPropertyDefinition.set === noop) { // 如果设置值等于一个空函数则警告
      sharedPropertyDefinition.set = function () {
        warn(
          ("Computed property \"" + key + "\" was assigned to but it has no setter."),
          this
        );
      };
    }
    // 设置访问器属性,这样当我们在模板里访问计算属性时就会执行sharedPropertyDefinition的get方法了
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  /**
   * 创建计算属性获取值，收集 dep 依赖
   * @param {计算属性的key} key 
   */
  function createComputedGetter (key) {
    return function computedGetter () {
      // 获取key对应的计算watcher
      var watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) { // watcher存在
        if (watcher.dirty) {
          // 执行watcher.evaluate()函数
          watcher.evaluate();
        }
        // 这个Dep.target存在(这是个渲染watcher)
        if (Dep.target) {
          // 为Watcher 添加 （Watcher.newDeps.push(dep);） 一个dep对象
          // 循环deps 收集 newDeps dep 当newDeps 数据被清空的时候重新收集依赖
          watcher.depend();
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
  function initMethods (vm, methods) {
    var props = vm.$options.props; // 获取props属性
    for (var key in methods) {
      {
        if (typeof methods[key] !== 'function') { // 事件不是方法的话报错
          warn(
            "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
            "Did you reference the function correctly?",
            vm
          );
        }
        //如果props属性中定义了key，则在methods中不能定义同样的key
        if (props && hasOwn(props, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a prop."),
            vm
          );
        }
        //isReserved 检查一个字符串是否以$或者_开头的字母
        if ((key in vm) && isReserved(key)) {
          warn(
            "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
            "Avoid defining component methods that start with _ or $."
          );
        }
      }
      // 判断methods每个属性值是否为函数类型
      // 如果为函数，则执行该函数
      // 如果不是函数，则赋值空函数即noop
      // bind 定义在scr/shared/util.js中
      vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
  }

  /**
   * 初始化监听属性
   * @param {Vue实例} vm 
   * @param {监听属性} watch 
   */
  function initWatch (vm, watch) {
    // 循环watch对象
    for (var key in watch) {
      // 获取单个watch
      var handler = watch[key];
      // 如果他是数组handler
      if (Array.isArray(handler)) {
        // 循环数组 创建 监听
        for (var i = 0; i < handler.length; i++) {
          // vm 是 vue对象
          // key
          // 函数或者对象
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
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
    vm,
    expOrFn,
    handler,
    options
  ) {
    // 如果handler是个对象，则将该对象的hanler属性保存到handler里面;
    // 这里对应watch的值为对象的情况
    if (isPlainObject(handler)) {
      options = handler;
      // 对象中的handler，一定是函数或者字符串
      handler = handler.handler;
    }
    // 判断handler 是否是字符串 如果是 则是key
    if (typeof handler === 'string') {
      // 取值 vm 就是Vue 最外层 中的函数
      handler = vm[handler];
    }
    // 最后创建一个用户watch
    return vm.$watch(expOrFn, handler, options)
  }

  /**
   * 数据绑定，$watch方法
   * @param {vue构造器} Vue 
   */
  function stateMixin (Vue) {
    // flow somehow has problems with directly declared definition object
    // when using Object.defineProperty, so we have to procedurally build up
    // the object here.
    // 流在某种程度上与直接声明的定义对象有问题
    // 在使用Object.defineProperty时，我们必须循序渐进地进行构建
    var dataDef = {};
    // 重新定义get 和set方法
    dataDef.get = function () { return this._data }; // 获取data中的数据
    var propsDef = {};
    propsDef.get = function () { return this._props }; // 获取props 数据
    {
      dataDef.set = function () { //避免替换实例根$data，使用嵌套数据属性代替
        warn(
          'Avoid replacing instance root $data. ' +
          'Use nested data properties instead.',
          this
        );
      };
      propsDef.set = function () { //props 只是可读的数据不可以设置更改
        warn("$props is readonly.", this);
      };
    }
    Object.defineProperty(Vue.prototype, '$data', dataDef);
    Object.defineProperty(Vue.prototype, '$props', propsDef);

    // 添加一个数组数据或者对象数据
    Vue.prototype.$set = set;
    // 删除一个数组数据或者对象数据
    Vue.prototype.$delete = del;

    Vue.prototype.$watch = function (
      expOrFn, // 监听的属性
      cb, // 监听的属性对应的函数
      options //参数
    ) {
      var vm = this;
      // 判断是否是对象 
      // 如果是对象则递归深层监听，直到它不是一个对象的时候才会跳出递归
      if (isPlainObject(cb)) {
        return createWatcher(vm, expOrFn, cb, options)
      }
      options = options || {};
      // 设置options.user为true,表示这是一个用户watch
      options.user = true;
      // vm: vode函数, expOrFn: 监听的属性, cb: 监听的属性对应的函数, options: 参数
      var watcher = new Watcher(vm, expOrFn, cb, options);
      if (options.immediate) {
        try {
          // 触发监听的属性对应的函数
          cb.call(vm, watcher.value);
        } catch (error) {
          handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
        }
      }
      // 卸载观察者
      return function unwatchFn () {
        // 从所有依赖项的订阅方列表中删除self。
        watcher.teardown();
      }
    };
  }

  /*  */

  var uid$2 = 0;
  /**
   * 初始化vue
   * @param {Vue构造器} Vue 
   */
  function initMixin (Vue) {
    //初始化函数
    Vue.prototype._init = function (options) {
      var vm = this;
      // a uid
      vm._uid = uid$2++;

      /* 
      * 测试代码性能
      * 参考：https://segmentfault.com/a/1190000014479800
      */
      var startTag, endTag; //开始标签，结束标签
      /* istanbul ignore if */
      //浏览器性能监控
      if ( config.performance && mark) {
        startTag = "vue-perf-start:" + (vm._uid);
        endTag = "vue-perf-end:" + (vm._uid);
        mark(startTag);
      }

      // a flag to avoid this being observed
      // 避免被响应式的标识
      // 这里可以暂时理解新建observer实例就是让数据响应式
      vm._isVue = true;
      // merge options
      // 有子组件时，options._isComponent才会为true
      if (options && options._isComponent) { //这是组件实例化时的分支
        // optimize internal component instantiation
        // since dynamic options merging is pretty slow, and none of the
        // internal component options needs special treatment.
        /*
        * 优化内部组件实例化
        * 因为动态选项合并非常慢，而且内部组件选项不需要特殊处理
        * 初始化内部组件
        */
        initInternalComponent(vm, options);
      } else { // 根Vue实例执行到这里
        // TODO:(重点分析:合并options)传入的options和vue自身的options进行合并保存到vm.$options
        vm.$options = mergeOptions(
          resolveConstructorOptions(vm.constructor), // 解析vue 构造函数上的options属性的
          options || {},
          vm
        );
      }
      /* 
      * istanbul ignore else 
      * 参考：https://segmentfault.com/a/1190000014824359
      */
      {
        // 初始化代理监听
        initProxy(vm);
      }
      // expose real self
      vm._self = vm; // 开放真实的self
      initLifecycle(vm); // 初始化生命周期
      initEvents(vm); // 初始化事件
      initRender(vm); // 初始化渲染
      // TODO:(生命周期:beforeCreate)
      callHook(vm, 'beforeCreate'); // 触发 beforeCreate 钩子函数
      /**
       * 在data / props之前解决注入问题
       * 初始化 inject
       */
      initInjections(vm); // resolve injections before data/props
      // 初始化props属性、data属性、methods属性、computed属性、watch属性
      initState(vm);
      /**
       * 在data / props初始化后解决注入问题
       * 选项应该是一个对象或返回一个对象的函数
       * 该对象包含可注入其子孙的属性，用于组件之间通信
       */
      initProvide(vm); // resolve provide after data/props
      // TODO:(生命周期:created)
      callHook(vm, 'created'); // 触发 created 钩子函数

      /* istanbul ignore if */
      //浏览器性能监听
      if ( config.performance && mark) {
        vm._name = formatComponentName(vm, false);
        mark(endTag);
        measure(("vue " + (vm._name) + " init"), startTag, endTag);
      }

      if (vm.$options.el) {
        /**
         * 手动挂载
         * 在项目中可用于延时挂载（例如在挂载之前要进行一些其他操作、判断等），之后要手动挂载上
         * new Vue时，el和 $mount 并没有本质上的不同
         */
        vm.$mount(vm.$options.el);
      }
    };
  }

  /**
   * 初始化内部组件
   * @param {Vue实例} vm 
   * @param {配置项} options 
   */
  function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options); // 拷贝一份vm配置项
    // doing this because it's faster than dynamic enumeration.
    // var options = {
    //     _isComponent: true, //是否是组件
    //     parent: parent, //组件的父节点
    //     _parentVnode: vnode, //组件的 虚拟vonde 父节点
    //     _parentElm: parentElm || null, //父节点的dom el
    //     _refElm: refElm || null //当前节点 el
    // }
    var parentVnode = options._parentVnode; // 获取组件的虚拟vnode父节点
    opts.parent = options.parent; // 组件的父节点
    opts._parentVnode = parentVnode; // 组件的虚拟vnode父节点

    var vnodeComponentOptions = parentVnode.componentOptions; // 组件参数
    opts.propsData = vnodeComponentOptions.propsData; // 组件数据
    opts._parentListeners = vnodeComponentOptions.listeners; // 组件事件
    opts._renderChildren = vnodeComponentOptions.children; // 组件子节点
    opts._componentTag = vnodeComponentOptions.tag; // 组件标签

    if (options.render) { // 渲染函数存在的情况
      opts.render = options.render; // 渲染函数
      opts.staticRenderFns = options.staticRenderFns; // 静态渲染函数
    }
  }

  /**
   * 解析 Vue 构造函数上的 options 属性
   * @param {组件构造器} Ctor 
   */
  function resolveConstructorOptions (Ctor) {
    var options = Ctor.options;
    // 有 super 属性，说明 Ctor 是 Vue.extend 构建的子类
    if (Ctor.super) { // 父类
      var superOptions = resolveConstructorOptions(Ctor.super); // 递归调用获取父类的 options
      var cachedSuperOptions = Ctor.superOptions; // Vue构造函数上的options,如directives,filters,....
      if (superOptions !== cachedSuperOptions) { //判断如果 超类的options不等于子类的options 的时候
        // super option changed,
        // need to resolve new options.
        Ctor.superOptions = superOptions; // 让父类的 options 赋值给 Ctor 的 superOptions 属性
        // check if there are any late-modified/attached options (#4976)
        // 检查是否有任何后期修改/附加选项
        // 解决修改选项 ，转义数据，合并数据
        var modifiedOptions = resolveModifiedOptions(Ctor);
        // update base extend options
        // 更新基本扩展选项
        if (modifiedOptions) {
          // extendOptions合并拓展参数
          extend(Ctor.extendOptions, modifiedOptions);
        }
        // 优先取Ctor.extendOptions 将两个对象合成一个对象 将父值对象和子值对象合并在一起
        options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
        if (options.name) {
          options.components[options.name] = Ctor;
        }
      }
    }
    return options
  }

  /**
   * 解决修改options 转义数据，合并数据
   * @param {组件构造器} Ctor 
   */
  function resolveModifiedOptions (Ctor) {
    var modified;
    var latest = Ctor.options; // 获取选项
    var sealed = Ctor.sealedOptions; // 获取扩展的选项
    for (var key in latest) {
      if (latest[key] !== sealed[key]) { // 如果选项不等于子类选项
        if (!modified) { modified = {}; }
        modified[key] = latest[key]; // 合并参数
      }
    }
    return modified
  }

  // Vue 构造函数
  function Vue (options) {
    // 生产环境下，没有使用 new 创建实例会报下面警告
    if (
      !(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
  }

  initMixin(Vue); // 初始化Vue
  stateMixin(Vue); // 数据绑定，$watch方法
  eventsMixin(Vue); // 初始化事件绑定方法
  lifecycleMixin(Vue); // 初始化vue 生命周期： 更新 销毁 
  renderMixin(Vue); // 初始化渲染的函数

  /*  */

  function initUse (Vue) {
    Vue.use = function (plugin) {
      var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
      if (installedPlugins.indexOf(plugin) > -1) {
        return this
      }

      // additional parameters
      var args = toArray(arguments, 1);
      args.unshift(this);
      if (typeof plugin.install === 'function') {
        plugin.install.apply(plugin, args);
      } else if (typeof plugin === 'function') {
        plugin.apply(null, args);
      }
      installedPlugins.push(plugin);
      return this
    };
  }

  /*  */

  function initMixin$1 (Vue) {
    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this
    };
  }

  /*  */

  function initExtend (Vue) {
    /**
     * Each instance constructor, including Vue, has a unique
     * cid. This enables us to create wrapped "child
     * constructors" for prototypal inheritance and cache them.
     */
    Vue.cid = 0;
    var cid = 1;

    /**
     * Class inheritance
     */
    Vue.extend = function (extendOptions) {
      extendOptions = extendOptions || {};
      // Super指向Vue
      var Super = this;
      // 指定一个SuperId
      var SuperId = Super.cid;
      // 定义一个缓存构造器cachedCtors用来缓存构造器
      var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
      if (cachedCtors[SuperId]) {
        return cachedCtors[SuperId]
      }

      // 检查组件的名字是否合法
      var name = extendOptions.name || Super.options.name;
      if ( name) {
        validateComponentName(name);
      }

      // 创建一个sub函数，用来继承Super（Vue）
      var Sub = function VueComponent (options) {
        this._init(options);
      };
      // 这里的继承使用的是Object.create()函数，即原型继承
      Sub.prototype = Object.create(Super.prototype);
      // 该函数的功能是把某个对象（对应这里的Sub.prototype）的__proto__属性关联到指定的对象
      Sub.prototype.constructor = Sub;
      Sub.cid = cid++;
      Sub.options = mergeOptions(
        Super.options,
        extendOptions
      );
      Sub['super'] = Super;

      // For props and computed properties, we define the proxy getters on
      // the Vue instances at extension time, on the extended prototype. This
      // avoids Object.defineProperty calls for each instance created.
      // 对Sub的props和computed做初始化
      // 并扩展一些方法和属性
      if (Sub.options.props) {
        initProps$1(Sub);
      }
      if (Sub.options.computed) {
        initComputed$1(Sub);
      }

      // allow further extension/mixin/plugin usage
      Sub.extend = Super.extend;
      Sub.mixin = Super.mixin;
      Sub.use = Super.use;

      // create asset registers, so extended classes
      // can have their private assets too.
      ASSET_TYPES.forEach(function (type) {
        Sub[type] = Super[type];
      });
      // enable recursive self-lookup
      if (name) {
        Sub.options.components[name] = Sub;
      }

      // keep a reference to the super options at extension time.
      // later at instantiation we can check if Super's options have
      // been updated.
      Sub.superOptions = Super.options;
      Sub.extendOptions = extendOptions;
      Sub.sealedOptions = extend({}, Sub.options);

      // cache constructor
      // 将Sub缓存起来，下次如果对应的cachedCtors中有对应的值，就直接返回，不用再创建一个组件的构造器
      cachedCtors[SuperId] = Sub;
      return Sub
    };
  }

  function initProps$1 (Comp) {
    var props = Comp.options.props;
    for (var key in props) {
      proxy(Comp.prototype, "_props", key);
    }
  }

  function initComputed$1 (Comp) {
    var computed = Comp.options.computed;
    for (var key in computed) {
      defineComputed(Comp.prototype, key, computed[key]);
    }
  }

  /*  */

  function initAssetRegisters (Vue) {
    /**
     * Create asset registration methods.
     */
    ASSET_TYPES.forEach(function (type) {
      Vue[type] = function (
        id,
        definition
      ) {
        if (!definition) {
          return this.options[type + 's'][id]
        } else {
          /* istanbul ignore if */
          if ( type === 'component') {
            validateComponentName(id);
          }
          if (type === 'component' && isPlainObject(definition)) {
            definition.name = definition.name || id;
            definition = this.options._base.extend(definition);
          }
          if (type === 'directive' && typeof definition === 'function') {
            definition = { bind: definition, update: definition };
          }
          this.options[type + 's'][id] = definition;
          return definition
        }
      };
    });
  }

  /*  */



  function getComponentName (opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
  }

  function matches (pattern, name) {
    if (Array.isArray(pattern)) {
      return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
      return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
      return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
  }

  function pruneCache (keepAliveInstance, filter) {
    var cache = keepAliveInstance.cache;
    var keys = keepAliveInstance.keys;
    var _vnode = keepAliveInstance._vnode;
    for (var key in cache) {
      var cachedNode = cache[key];
      if (cachedNode) {
        var name = getComponentName(cachedNode.componentOptions);
        if (name && !filter(name)) {
          pruneCacheEntry(cache, key, keys, _vnode);
        }
      }
    }
  }

  function pruneCacheEntry (
    cache,
    key,
    keys,
    current
  ) {
    var cached = cache[key];
    if (cached && (!current || cached.tag !== current.tag)) {
      cached.componentInstance.$destroy();
    }
    cache[key] = null;
    remove(keys, key);
  }

  var patternTypes = [String, RegExp, Array];

  var KeepAlive = {
    name: 'keep-alive',
    abstract: true,

    props: {
      include: patternTypes,
      exclude: patternTypes,
      max: [String, Number]
    },

    created: function created () {
      this.cache = Object.create(null);
      this.keys = [];
    },

    destroyed: function destroyed () {
      for (var key in this.cache) {
        pruneCacheEntry(this.cache, key, this.keys);
      }
    },

    mounted: function mounted () {
      var this$1 = this;

      this.$watch('include', function (val) {
        pruneCache(this$1, function (name) { return matches(val, name); });
      });
      this.$watch('exclude', function (val) {
        pruneCache(this$1, function (name) { return !matches(val, name); });
      });
    },

    render: function render () {
      var slot = this.$slots.default;
      var vnode = getFirstComponentChild(slot);
      var componentOptions = vnode && vnode.componentOptions;
      if (componentOptions) {
        // check pattern
        var name = getComponentName(componentOptions);
        var ref = this;
        var include = ref.include;
        var exclude = ref.exclude;
        if (
          // not included
          (include && (!name || !matches(include, name))) ||
          // excluded
          (exclude && name && matches(exclude, name))
        ) {
          return vnode
        }

        var ref$1 = this;
        var cache = ref$1.cache;
        var keys = ref$1.keys;
        var key = vnode.key == null
          // same constructor may get registered as different local components
          // so cid alone is not enough (#3269)
          ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
          : vnode.key;
        if (cache[key]) {
          vnode.componentInstance = cache[key].componentInstance;
          // make current key freshest
          remove(keys, key);
          keys.push(key);
        } else {
          cache[key] = vnode;
          keys.push(key);
          // prune oldest entry
          if (this.max && keys.length > parseInt(this.max)) {
            pruneCacheEntry(cache, keys[0], keys, this._vnode);
          }
        }

        vnode.data.keepAlive = true;
      }
      return vnode || (slot && slot[0])
    }
  };

  var builtInComponents = {
    KeepAlive: KeepAlive
  };

  /*  */

  function initGlobalAPI (Vue) {
    // config
    var configDef = {};
    configDef.get = function () { return config; }; // Vue.config 获取 config 全局变量
    {
      configDef.set = function () { // 设置Vue.config时直接报错，即不允许设置Vue.config值
        warn(
          'Do not replace the Vue.config object, set individual fields instead.'
        );
      };
    }
    // 通过ES5的defineProperty设置Vue的config的访问器属性
    // 获取Vue.config时会执行configDef.get函数
    // 设置Vue.config时会执行configDef.set函数
    Object.defineProperty(Vue, 'config', configDef);

    // exposed util methods.
    // NOTE: these are not considered part of the public API - avoid relying on
    // them unless you are aware of the risk.
    Vue.util = {
      warn: warn,
      extend: extend,
      mergeOptions: mergeOptions,
      defineReactive: defineReactive
    };

    Vue.set = set;
    Vue.delete = del;
    Vue.nextTick = nextTick;

    // 2.6 explicit observable API
    Vue.observable = function (obj) {
      observe(obj);
      return obj
    };

    Vue.options = Object.create(null);
    ASSET_TYPES.forEach(function (type) {
      Vue.options[type + 's'] = Object.create(null);
    });

    // this is used to identify the "base" constructor to extend all plain-object
    // components with in Weex's multi-instance scenarios.
    Vue.options._base = Vue;

    extend(Vue.options.components, builtInComponents);

    initUse(Vue);
    initMixin$1(Vue);
    initExtend(Vue);
    initAssetRegisters(Vue);
  }

  initGlobalAPI(Vue);

  Object.defineProperty(Vue.prototype, '$isServer', {
    get: isServerRendering
  });

  Object.defineProperty(Vue.prototype, '$ssrContext', {
    get: function get () {
      /* istanbul ignore next */
      return this.$vnode && this.$vnode.ssrContext
    }
  });

  // expose FunctionalRenderContext for ssr runtime helper installation
  Object.defineProperty(Vue, 'FunctionalRenderContext', {
    value: FunctionalRenderContext
  });

  Vue.version = '2.6.11';

  /*  */

  // these are reserved for web because they are directly compiled away
  // during template compilation
  var isReservedAttr = makeMap('style,class');

  // attributes that should be using props for binding
  var acceptValue = makeMap('input,textarea,option,select,progress');
  var mustUseProp = function (tag, type, attr) {
    return (
      (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
      (attr === 'selected' && tag === 'option') ||
      (attr === 'checked' && tag === 'input') ||
      (attr === 'muted' && tag === 'video')
    )
  };

  var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

  var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

  var convertEnumeratedValue = function (key, value) {
    return isFalsyAttrValue(value) || value === 'false'
      ? 'false'
      // allow arbitrary string value for contenteditable
      : key === 'contenteditable' && isValidContentEditableValue(value)
        ? value
        : 'true'
  };

  var isBooleanAttr = makeMap(
    'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
    'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
    'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
    'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
    'required,reversed,scoped,seamless,selected,sortable,translate,' +
    'truespeed,typemustmatch,visible'
  );

  var xlinkNS = 'http://www.w3.org/1999/xlink';

  var isXlink = function (name) {
    return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
  };

  var getXlinkProp = function (name) {
    return isXlink(name) ? name.slice(6, name.length) : ''
  };

  var isFalsyAttrValue = function (val) {
    return val == null || val === false
  };

  /*  */

  function genClassForVnode (vnode) {
    var data = vnode.data;
    var parentNode = vnode;
    var childNode = vnode;
    while (isDef(childNode.componentInstance)) {
      childNode = childNode.componentInstance._vnode;
      if (childNode && childNode.data) {
        data = mergeClassData(childNode.data, data);
      }
    }
    while (isDef(parentNode = parentNode.parent)) {
      if (parentNode && parentNode.data) {
        data = mergeClassData(data, parentNode.data);
      }
    }
    return renderClass(data.staticClass, data.class)
  }

  function mergeClassData (child, parent) {
    return {
      staticClass: concat(child.staticClass, parent.staticClass),
      class: isDef(child.class)
        ? [child.class, parent.class]
        : parent.class
    }
  }

  function renderClass (
    staticClass,
    dynamicClass
  ) {
    if (isDef(staticClass) || isDef(dynamicClass)) {
      return concat(staticClass, stringifyClass(dynamicClass))
    }
    /* istanbul ignore next */
    return ''
  }

  function concat (a, b) {
    return a ? b ? (a + ' ' + b) : a : (b || '')
  }

  function stringifyClass (value) {
    if (Array.isArray(value)) {
      return stringifyArray(value)
    }
    if (isObject(value)) {
      return stringifyObject(value)
    }
    if (typeof value === 'string') {
      return value
    }
    /* istanbul ignore next */
    return ''
  }

  function stringifyArray (value) {
    var res = '';
    var stringified;
    for (var i = 0, l = value.length; i < l; i++) {
      if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
        if (res) { res += ' '; }
        res += stringified;
      }
    }
    return res
  }

  function stringifyObject (value) {
    var res = '';
    for (var key in value) {
      if (value[key]) {
        if (res) { res += ' '; }
        res += key;
      }
    }
    return res
  }

  /*  */

  var namespaceMap = {
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
  };

  // html 保留标签
  var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'
  );

  // this map is intentionally selective, only covering SVG elements that may
  // contain child elements.
  // svg保留标签
  var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
  );

  var isPreTag = function (tag) { return tag === 'pre'; };

  /**
   * 判断标签是否为原生标签
   * @param {标签} tag 
   */
  var isReservedTag = function (tag) {
    return isHTMLTag(tag) || isSVG(tag)
  };

  /**
   * 获取tag的命名空间
   * 判断 tag 是否是svg或者 math 标签
   * @param {标签} tag 
   */
  function getTagNamespace (tag) {
    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    if (tag === 'math') {
      return 'math'
    }
  }

  var unknownElementCache = Object.create(null);
  function isUnknownElement (tag) {
    /* istanbul ignore if */
    if (!inBrowser) {
      return true
    }
    if (isReservedTag(tag)) {
      return false
    }
    tag = tag.toLowerCase();
    /* istanbul ignore if */
    if (unknownElementCache[tag] != null) {
      return unknownElementCache[tag]
    }
    var el = document.createElement(tag);
    if (tag.indexOf('-') > -1) {
      // http://stackoverflow.com/a/28210364/1070244
      return (unknownElementCache[tag] = (
        el.constructor === window.HTMLUnknownElement ||
        el.constructor === window.HTMLElement
      ))
    } else {
      return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
    }
  }

  var isTextInputType = makeMap('text,number,password,search,email,tel,url');

  /*  */

  /**
   * Query an element selector if it's not an element already.
   */
  function query (el) {
    if (typeof el === 'string') { // 字符串的情况
      var selected = document.querySelector(el); // html5获取dom元素
      if (!selected) { // dom不存在并且在开发环境报下面警告，并返回一个新创建的div元素
         warn(
          'Cannot find element: ' + el
        );
        return document.createElement('div')
      }
      return selected
    } else { // dom的情况
      return el
    }
  }

  /*  */

  /**
   * 创建一个真实的dom
   * @param {标签名} tagName 
   * @param {虚拟dom} vnode 
   */
  function createElement$1 (tagName, vnode) {
    // 创建一个真实的dom
    var elm = document.createElement(tagName);
    // 如果不是select标签则返回dom出去
    if (tagName !== 'select') {
      return elm
    }
    // false or null will remove the attribute but undefined will not
    // 如果是select标签 判断是否设置了multiple属性。如果设置了则加上去
    if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
      elm.setAttribute('multiple', 'multiple');
    }
    return elm
  }

  /**
   * 创建带有指定命名空间的元素节点
   * @param {命名空间} namespace 
   * @param {标签名} tagName 
   */
  function createElementNS (namespace, tagName) {
    return document.createElementNS(namespaceMap[namespace], tagName)
  }

  /**
   * 创建文本节点真是dom节点
   * @param {文本} text 
   */
  function createTextNode (text) {
    return document.createTextNode(text)
  }

  /**
   * 创建一个注释节点
   * @param {文本} text 
   */
  function createComment (text) {
    return document.createComment(text)
  }

  /**
   * 插入节点在referenceNode dom 前面插入一个节点
   * @param {父级节点} parentNode 
   * @param {要插入的节点} newNode 
   * @param {参考节点} referenceNode 
   */
  function insertBefore (parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
  }

  /**
   * 删除子节点
   * @param {当前节点} node 
   * @param {要删除的子节点} child 
   */
  function removeChild (node, child) {
    node.removeChild(child);
  }

  /**
   * 添加子节点在尾部
   * @param {当前节点} node 
   * @param {要插入的子节点} child 
   */
  function appendChild (node, child) {
    node.appendChild(child);
  }

  /**
   * 获取父亲子节点dom
   * @param {当前节点} node 
   */
  function parentNode (node) {
    return node.parentNode
  }

  /**
   * 获取下一个兄弟节点
   * @param {当前节点} node 
   */
  function nextSibling (node) {
    return node.nextSibling
  }

  /**
   * 获取dom标签名称
   * @param {当前节点} node 
   */
  function tagName (node) {
    return node.tagName
  }

  /**
   * 设置 dom 文本
   * @param {当前节点} node 
   * @param {文本内容} text 
   */
  function setTextContent (node, text) {
    node.textContent = text;
  }

  /**
   * 设置dom节点属性
   * @param {当前节点} node 
   * @param {属性名} scopeId 
   */
  function setStyleScope (node, scopeId) {
    node.setAttribute(scopeId, '');
  }

  var nodeOps = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement$1,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    setStyleScope: setStyleScope
  });

  /*  */

  // ref 创建，更新和销毁事件
  var ref = {
    create: function create (_, vnode) {
      registerRef(vnode);
    },
    update: function update (oldVnode, vnode) {
      if (oldVnode.data.ref !== vnode.data.ref) {
        registerRef(oldVnode, true); // 先删除
        registerRef(vnode); // 在添加
      }
    },
    destroy: function destroy (vnode) {
      registerRef(vnode, true);
    }
  };

  /**
   * 注册ref或者删除ref
   * 比如标签上面设置了ref='abc' 
   * 那么该函数就是为this.$refs.abc 注册ref，把真实的dom存进去
   * @param {虚拟VNode} vnode 
   * @param {是否删除} isRemoval 
   */
  function registerRef (vnode, isRemoval) {
    var key = vnode.data.ref; // 获取vond ref的字符串
    if (!isDef(key)) { return } // ref属性不存在则直接退出

    var vm = vnode.context; // vm实例，即上下文
    // 优先获取vonde的组件实例(对于组件来说)，或者el(该Vnode对应的DOM节点，非组件来说)
    var ref = vnode.componentInstance || vnode.elm;
    var refs = vm.$refs; // 获取vm总共的refs
    if (isRemoval) { // 标志是否删除ref
      // ref是数组的情况
      if (Array.isArray(refs[key])) {
        remove(refs[key], ref);
      } else if (refs[key] === ref) {
        refs[key] = undefined;
      }
    } else {
      // 当在v-for之内时，则保存为数组形式
      if (vnode.data.refInFor) {
        if (!Array.isArray(refs[key])) { // 第一次添加
          refs[key] = [ref];
        } else if (refs[key].indexOf(ref) < 0) {
          // $flow-disable-line
          refs[key].push(ref);
        }
      } else { // 不是在v-for之内时 
        refs[key] = ref;
      }
    }
  }

  /**
   * Virtual DOM patching algorithm based on Snabbdom by
   * Simon Friis Vindum (@paldepind)
   * Licensed under the MIT License
   * https://github.com/paldepind/snabbdom/blob/master/LICENSE
   *
   * modified by Evan You (@yyx990803)
   *
   * Not type-checking this because this file is perf-critical and the cost
   * of making flow understand it is not worth it.
   */

  var emptyNode = new VNode('', {}, []);

  var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

  function sameVnode (a, b) {
    return (
      a.key === b.key && (
        (
          a.tag === b.tag &&
          a.isComment === b.isComment &&
          isDef(a.data) === isDef(b.data) &&
          sameInputType(a, b)
        ) || (
          isTrue(a.isAsyncPlaceholder) &&
          a.asyncFactory === b.asyncFactory &&
          isUndef(b.asyncFactory.error)
        )
      )
    )
  }

  function sameInputType (a, b) {
    if (a.tag !== 'input') { return true }
    var i;
    var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
    var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
    return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
  }

  function createKeyToOldIdx (children, beginIdx, endIdx) {
    var i, key;
    var map = {};
    for (i = beginIdx; i <= endIdx; ++i) {
      key = children[i].key;
      if (isDef(key)) { map[key] = i; }
    }
    return map
  }

  /**
   * 把vonde渲染成真实的dom
   * @param {nodeOps 封装了一系列 DOM 操作的方法， modules 定义了一些模块的钩子函数的实现} backend 
   */
  function createPatchFunction (backend) {
    var i, j;
    var cbs = {};

    var modules = backend.modules;
    var nodeOps = backend.nodeOps;
    // 把钩子函数添加到cbs队列中 循环数字 var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];
    for (i = 0; i < hooks.length; ++i) {
      cbs[hooks[i]] = []; // cbs = {create: [], activate: [], update: [], remove: [], destroy:[]}
      // 循环modules 数组
      for (j = 0; j < modules.length; ++j) {
        //判断modules上面是否有定义有  'create', 'activate', 'update', 'remove', 'destroy'
        if (isDef(modules[j][hooks[i]])) {
          //如果有则把他添加到cbs 对象数组中
          cbs[hooks[i]].push(modules[j][hooks[i]]);
        }
      }
    }

    function emptyNodeAt (elm) {
      return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
    }

    function createRmCb (childElm, listeners) {
      function remove () {
        if (--remove.listeners === 0) {
          removeNode(childElm);
        }
      }
      remove.listeners = listeners;
      return remove
    }

    function removeNode (el) {
      var parent = nodeOps.parentNode(el);
      // element may have already been removed due to v-html / v-text
      if (isDef(parent)) {
        nodeOps.removeChild(parent, el);
      }
    }

    /**
     * 检查dom节点的tag标签类型是否是VPre标签或者是判断是否是浏览器自带原有的标签
     * @param {节点} vnode 
     * @param {标签是否还有 v-pre 指令，如果没有则是false} inVPre 
     */
    function isUnknownElement (vnode, inVPre) {
      return (
        !inVPre &&
        !vnode.ns &&
        !(
          config.ignoredElements.length &&
          // some() 方法测试是否至少有一个元素通过由提供的函数实现的测试
          config.ignoredElements.some(function (ignore) {
            return isRegExp(ignore) // 判断是否是正则对象
              ? ignore.test(vnode.tag)
              : ignore === vnode.tag
          })
        ) &&
        // 判断是不是真的是 html 原有的标签，判断是否是浏览器标准标签
        config.isUnknownElement(vnode.tag)
      )
    }

    var creatingElmInVPre = 0;

    /**
     * 创建 dom 节点
     * @param {vnode 节点} vnode 
     * @param {插入Vnode队列} insertedVnodeQueue 
     * @param {父亲节点} parentElm 
     * @param {当前的节点的兄弟节点} refElm 
     * @param {嵌套} nested 
     * @param {主数组节点} ownerArray 
     * @param {索引} index 
     */
    function createElm (
      vnode,
      insertedVnodeQueue,
      parentElm,
      refElm,
      nested,
      ownerArray,
      index
    ) {
      // 存在vnode.elm 和 存在ownerArray
      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // This vnode was used in a previous render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead, we clone the node on-demand before creating
        // associated DOM element for it.
        //克隆一个新的节点
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      // 过渡输入检查
      vnode.isRootInsert = !nested; // for transition enter check
      // 尝试创建组件节点
      if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
        return
      }

      var data = vnode.data; // vnode 数据，例如 {attrs: {id: "app"}}
      var children = vnode.children; // vonde 子节点，例如 [VNode]（'Hello Vue!'文字vnode对象）
      var tag = vnode.tag; // vonde 标签，例如 div 标签
      // 插入顺序: 先子后父，最后父在挂载到文档dom上
      if (isDef(tag)) { // 元素节点
        {
          if (data && data.pre) { // 属性pre存在
            creatingElmInVPre++;
          }
          // 检查 dom 节点的tag标签类型是否是VPre标签或者是判断是否是浏览器自带原有的标签
          if (isUnknownElement(vnode, creatingElmInVPre)) {
            warn(
              'Unknown custom element: <' + tag + '> - did you ' +
              'register the component correctly? For recursive components, ' +
              'make sure to provide the "name" option.',
              vnode.context
            );
          }
        }

        // vnode.ns，字符串值，可为此元素节点规定命名空间的名称，
        // 可能是svg 或者 math 节点
        vnode.elm = vnode.ns
          ? nodeOps.createElementNS(vnode.ns, tag)
          : nodeOps.createElement(tag, vnode);
        setScope(vnode); // setScope css作用域相关

        /* istanbul ignore if */
        {
          // 判断子节点递归调用createElm 插入父dom中
          createChildren(vnode, children, insertedVnodeQueue);
          if (isDef(data)) {
            // invokeCreateHooks，循环cbs.create 钩子函数，并且执行调用，
            // 其实cbs.create 钩子函数就是platformModules中的attrs中 updateAttrs更新属性函数，
            // 如果是组件则调用componentVNodeHooks中的 create
            invokeCreateHooks(vnode, insertedVnodeQueue);
          }
          // parentElm：父挂载节点，vnode.elm：当前vnode节点，refElm：参考节点
          // 组件时 parentElm为undefined 不做插入操作
          insert(parentElm, vnode.elm, refElm);
        }

        if ( data && data.pre) {
          creatingElmInVPre--;
        }
      } else if (isTrue(vnode.isComment)) { // 注释节点
        vnode.elm = nodeOps.createComment(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      } else { // 文本节点
        vnode.elm = nodeOps.createTextNode(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      }
    }

    function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i = vnode.data;
      if (isDef(i)) {
        var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
        if (isDef(i = i.hook) && isDef(i = i.init)) {
          i(vnode, false /* hydrating */);
        }
        // after calling the init hook, if the vnode is a child component
        // it should've created a child instance and mounted it. the child
        // component also has set the placeholder vnode's elm.
        // in that case we can just return the element and be done.
        if (isDef(vnode.componentInstance)) {
          initComponent(vnode, insertedVnodeQueue);
          insert(parentElm, vnode.elm, refElm);
          if (isTrue(isReactivated)) {
            reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
          }
          return true
        }
      }
    }

    function initComponent (vnode, insertedVnodeQueue) {
      if (isDef(vnode.data.pendingInsert)) {
        insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
        vnode.data.pendingInsert = null;
      }
      vnode.elm = vnode.componentInstance.$el;
      if (isPatchable(vnode)) {
        invokeCreateHooks(vnode, insertedVnodeQueue);
        setScope(vnode);
      } else {
        // empty component root.
        // skip all element-related modules except for ref (#3455)
        registerRef(vnode);
        // make sure to invoke the insert hook
        insertedVnodeQueue.push(vnode);
      }
    }

    function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i;
      // hack for #4339: a reactivated component with inner transition
      // does not trigger because the inner node's created hooks are not called
      // again. It's not ideal to involve module-specific logic in here but
      // there doesn't seem to be a better way to do it.
      var innerNode = vnode;
      while (innerNode.componentInstance) {
        innerNode = innerNode.componentInstance._vnode;
        if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
          for (i = 0; i < cbs.activate.length; ++i) {
            cbs.activate[i](emptyNode, innerNode);
          }
          insertedVnodeQueue.push(innerNode);
          break
        }
      }
      // unlike a newly created component,
      // a reactivated keep-alive component doesn't insert itself
      insert(parentElm, vnode.elm, refElm);
    }

    function insert (parent, elm, ref) {
      if (isDef(parent)) {
        if (isDef(ref)) {
          if (nodeOps.parentNode(ref) === parent) {
            nodeOps.insertBefore(parent, elm, ref);
          }
        } else {
          nodeOps.appendChild(parent, elm);
        }
      }
    }

    /**
     * 
     * @param {vnode} vnode 
     * @param {vonde 子节点} children 
     * @param {插入Vnode队列} insertedVnodeQueue 
     */
    function createChildren (vnode, children, insertedVnodeQueue) {
      if (Array.isArray(children)) { // children为数组
        {
          checkDuplicateKeys(children); // 检测key是否有重复
        }
        for (var i = 0; i < children.length; ++i) {
          // 创建节点
          createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
        }
      } else if (isPrimitive(vnode.text)) { // 判断数据类型是否是string，number，symbol，boolean
        // 添加子节点，创建一个文本节点
        nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
      }
    }

    function isPatchable (vnode) {
      while (vnode.componentInstance) {
        vnode = vnode.componentInstance._vnode;
      }
      return isDef(vnode.tag)
    }

    /**
     * 循环cbs.create 钩子函数，并且执行调用，
     * 其实cbs.create 钩子函数就是platformModules中的attrs中 updateAttrs更新属性函数
     * 如果是组件则调用componentVNodeHooks中的 create
     * @param {vnode} vnode 
     * @param {插入Vnode队列} insertedVnodeQueue 
     */
    function invokeCreateHooks (vnode, insertedVnodeQueue) {
      for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
        cbs.create[i$1](emptyNode, vnode);
      }
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (isDef(i.create)) { i.create(emptyNode, vnode); }
        if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
      }
    }

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    /**
     * 设置css作用域
     * @param {vnode} vnode 
     */
    function setScope (vnode) {
      var i;
      // 存在fnScopeId，fnScopeId作用判断css有没有设置Scope
      if (isDef(i = vnode.fnScopeId)) {
        nodeOps.setStyleScope(vnode.elm, i);
      } else {
        var ancestor = vnode;
        while (ancestor) {
          // context：编译作用域(上下文)
          // 1.判断vnode 是否设置有作用域
          // 2.存在 _scopeId 属性
          if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
            nodeOps.setStyleScope(vnode.elm, i); // 设置css作用域
          }
          // 循环父节点
          ancestor = ancestor.parent;
        }
      }
      // for slot content they should also get the scopeId from the host instance.
      // activeInstance 是vm实例或者为null
      if (isDef(i = activeInstance) &&
        i !== vnode.context &&
        i !== vnode.fnContext &&
        isDef(i = i.$options._scopeId)
      ) {
        nodeOps.setStyleScope(vnode.elm, i);
      }
    }

    function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
      for (; startIdx <= endIdx; ++startIdx) {
        createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
      }
    }

    function invokeDestroyHook (vnode) {
      var i, j;
      var data = vnode.data;
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
        for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
      }
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }

    function removeVnodes (vnodes, startIdx, endIdx) {
      for (; startIdx <= endIdx; ++startIdx) {
        var ch = vnodes[startIdx];
        if (isDef(ch)) {
          if (isDef(ch.tag)) {
            removeAndInvokeRemoveHook(ch);
            invokeDestroyHook(ch);
          } else { // Text node
            removeNode(ch.elm);
          }
        }
      }
    }

    function removeAndInvokeRemoveHook (vnode, rm) {
      if (isDef(rm) || isDef(vnode.data)) {
        var i;
        var listeners = cbs.remove.length + 1;
        if (isDef(rm)) {
          // we have a recursively passed down rm callback
          // increase the listeners count
          rm.listeners += listeners;
        } else {
          // directly removing
          rm = createRmCb(vnode.elm, listeners);
        }
        // recursively invoke hooks on child component root node
        if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
          removeAndInvokeRemoveHook(i, rm);
        }
        for (i = 0; i < cbs.remove.length; ++i) {
          cbs.remove[i](vnode, rm);
        }
        if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
          i(vnode, rm);
        } else {
          rm();
        }
      } else {
        removeNode(vnode.elm);
      }
    }

    function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
      var oldStartIdx = 0;
      var newStartIdx = 0;
      var oldEndIdx = oldCh.length - 1;
      var oldStartVnode = oldCh[0];
      var oldEndVnode = oldCh[oldEndIdx];
      var newEndIdx = newCh.length - 1;
      var newStartVnode = newCh[0];
      var newEndVnode = newCh[newEndIdx];
      var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

      // removeOnly is a special flag used only by <transition-group>
      // to ensure removed elements stay in correct relative positions
      // during leaving transitions
      var canMove = !removeOnly;

      {
        checkDuplicateKeys(newCh);
      }

      while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
          oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
        } else if (isUndef(oldEndVnode)) {
          oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
          patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          oldStartVnode = oldCh[++oldStartIdx];
          newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
          patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          oldEndVnode = oldCh[--oldEndIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
          patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
          oldStartVnode = oldCh[++oldStartIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
          patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
          oldEndVnode = oldCh[--oldEndIdx];
          newStartVnode = newCh[++newStartIdx];
        } else {
          if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
          idxInOld = isDef(newStartVnode.key)
            ? oldKeyToIdx[newStartVnode.key]
            : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
          if (isUndef(idxInOld)) { // New element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          } else {
            vnodeToMove = oldCh[idxInOld];
            if (sameVnode(vnodeToMove, newStartVnode)) {
              patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
              oldCh[idxInOld] = undefined;
              canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
            } else {
              // same key but different element. treat as new element
              createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
            }
          }
          newStartVnode = newCh[++newStartIdx];
        }
      }
      if (oldStartIdx > oldEndIdx) {
        refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else if (newStartIdx > newEndIdx) {
        removeVnodes(oldCh, oldStartIdx, oldEndIdx);
      }
    }

    function checkDuplicateKeys (children) {
      var seenKeys = {};
      for (var i = 0; i < children.length; i++) {
        var vnode = children[i];
        var key = vnode.key;
        if (isDef(key)) {
          if (seenKeys[key]) {
            warn(
              ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
              vnode.context
            );
          } else {
            seenKeys[key] = true;
          }
        }
      }
    }

    function findIdxInOld (node, oldCh, start, end) {
      for (var i = start; i < end; i++) {
        var c = oldCh[i];
        if (isDef(c) && sameVnode(node, c)) { return i }
      }
    }

    function patchVnode (
      oldVnode,
      vnode,
      insertedVnodeQueue,
      ownerArray,
      index,
      removeOnly
    ) {
      if (oldVnode === vnode) {
        return
      }

      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // clone reused vnode
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      var elm = vnode.elm = oldVnode.elm;

      if (isTrue(oldVnode.isAsyncPlaceholder)) {
        if (isDef(vnode.asyncFactory.resolved)) {
          hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
        } else {
          vnode.isAsyncPlaceholder = true;
        }
        return
      }

      // reuse element for static trees.
      // note we only do this if the vnode is cloned -
      // if the new node is not cloned it means the render functions have been
      // reset by the hot-reload-api and we need to do a proper re-render.
      if (isTrue(vnode.isStatic) &&
        isTrue(oldVnode.isStatic) &&
        vnode.key === oldVnode.key &&
        (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
      ) {
        vnode.componentInstance = oldVnode.componentInstance;
        return
      }

      var i;
      var data = vnode.data;
      if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
        i(oldVnode, vnode);
      }

      var oldCh = oldVnode.children;
      var ch = vnode.children;
      if (isDef(data) && isPatchable(vnode)) {
        for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
        if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
      }
      if (isUndef(vnode.text)) {
        if (isDef(oldCh) && isDef(ch)) {
          if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
        } else if (isDef(ch)) {
          {
            checkDuplicateKeys(ch);
          }
          if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
          addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
        } else if (isDef(oldCh)) {
          removeVnodes(oldCh, 0, oldCh.length - 1);
        } else if (isDef(oldVnode.text)) {
          nodeOps.setTextContent(elm, '');
        }
      } else if (oldVnode.text !== vnode.text) {
        nodeOps.setTextContent(elm, vnode.text);
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
      }
    }

    function invokeInsertHook (vnode, queue, initial) {
      // delay insert hooks for component root nodes, invoke them after the
      // element is really inserted
      if (isTrue(initial) && isDef(vnode.parent)) {
        vnode.parent.data.pendingInsert = queue;
      } else {
        for (var i = 0; i < queue.length; ++i) {
          queue[i].data.hook.insert(queue[i]);
        }
      }
    }

    var hydrationBailed = false;
    // list of modules that can skip create hook during hydration because they
    // are already rendered on the client or has no need for initialization
    // Note: style is excluded because it relies on initial clone for future
    // deep updates (#7063).
    var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

    // Note: this is a browser-only function so we can assume elms are DOM nodes.
    function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
      var i;
      var tag = vnode.tag;
      var data = vnode.data;
      var children = vnode.children;
      inVPre = inVPre || (data && data.pre);
      vnode.elm = elm;

      if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
        vnode.isAsyncPlaceholder = true;
        return true
      }
      // assert node match
      {
        if (!assertNodeMatch(elm, vnode, inVPre)) {
          return false
        }
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
        if (isDef(i = vnode.componentInstance)) {
          // child component. it should have hydrated its own tree.
          initComponent(vnode, insertedVnodeQueue);
          return true
        }
      }
      if (isDef(tag)) {
        if (isDef(children)) {
          // empty element, allow client to pick up and populate children
          if (!elm.hasChildNodes()) {
            createChildren(vnode, children, insertedVnodeQueue);
          } else {
            // v-html and domProps: innerHTML
            if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
              if (i !== elm.innerHTML) {
                /* istanbul ignore if */
                if (
                  typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('server innerHTML: ', i);
                  console.warn('client innerHTML: ', elm.innerHTML);
                }
                return false
              }
            } else {
              // iterate and compare children lists
              var childrenMatch = true;
              var childNode = elm.firstChild;
              for (var i$1 = 0; i$1 < children.length; i$1++) {
                if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                  childrenMatch = false;
                  break
                }
                childNode = childNode.nextSibling;
              }
              // if childNode is not null, it means the actual childNodes list is
              // longer than the virtual children list.
              if (!childrenMatch || childNode) {
                /* istanbul ignore if */
                if (
                  typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
                }
                return false
              }
            }
          }
        }
        if (isDef(data)) {
          var fullInvoke = false;
          for (var key in data) {
            if (!isRenderedModule(key)) {
              fullInvoke = true;
              invokeCreateHooks(vnode, insertedVnodeQueue);
              break
            }
          }
          if (!fullInvoke && data['class']) {
            // ensure collecting deps for deep class bindings for future updates
            traverse(data['class']);
          }
        }
      } else if (elm.data !== vnode.text) {
        elm.data = vnode.text;
      }
      return true
    }

    function assertNodeMatch (node, vnode, inVPre) {
      if (isDef(vnode.tag)) {
        return vnode.tag.indexOf('vue-component') === 0 || (
          !isUnknownElement(vnode, inVPre) &&
          vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
        )
      } else {
        return node.nodeType === (vnode.isComment ? 8 : 3)
      }
    }

    /**
     * 渲染成真实的dom
     * @param {旧的vonde或者是真实的dom或者是没有} oldVnode 
     * @param {新的vode} vnode 
     * @param {布尔类型的参数是跟ssr相关} hydrating 
     * @param {是否要全部删除标志} removeOnly 
     */
    return function patch (oldVnode, vnode, hydrating, removeOnly) {
      // 删除逻辑 子组件销毁
      if (isUndef(vnode)) { // vonde 不存在
        // vonde 不存在而oldVnode 存在，
        // 说明意图是要销毁老节点，
        // 那么就调用invokeDestroyHook(oldVnode)来进行销毁
        if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
        return
      }

      var isInitialPatch = false;
      // vonde队列，如果vnode上有insert钩子，
      // 那么就将这个vnode放入insertedVnodeQueue中作记录，
      // 到时再在全局批量调用insert钩子回调
      var insertedVnodeQueue = [];

      // 子组件渲染时会走逻辑
      if (isUndef(oldVnode)) { // ldVnode 不存在
        // empty mount (likely as component), create new root element
        isInitialPatch = true;
        // 创建节点
        createElm(vnode, insertedVnodeQueue);
      } else {
        // 判断是否为真实dom
        var isRealElement = isDef(oldVnode.nodeType);
        // 1.不是真实的dom
        // 2.sameVnode(oldVnode, vnode)2个节点的基本属性相同，那么就进入了2个节点的diff过程
        if (!isRealElement && sameVnode(oldVnode, vnode)) {
          // patch existing root node
          // 修补现有根节点
          patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
        } else {
          // 首次渲染为真实dom
          if (isRealElement) {
            // mounting to a real element
            // check if this is server-rendered content and if we can perform
            // a successful hydration.
            // 服务端渲染相关
            if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
              oldVnode.removeAttribute(SSR_ATTR);
              hydrating = true;
            }
            // 服务端渲染相关
            if (isTrue(hydrating)) {
              if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                invokeInsertHook(vnode, insertedVnodeQueue, true);
                return oldVnode
              } else {
                warn(
                  'The client-side rendered virtual DOM tree is not matching ' +
                  'server-rendered content. This is likely caused by incorrect ' +
                  'HTML markup, for example nesting block-level elements inside ' +
                  '<p>, or missing <tbody>. Bailing hydration and performing ' +
                  'full client-side render.'
                );
              }
            }
            // either not server-rendered, or hydration failed.
            // create an empty node and replace it
            // 将真实dom转化成vnode对象
            oldVnode = emptyNodeAt(oldVnode);
          }

          // replacing existing element
          var oldElm = oldVnode.elm; // 获取真实dom
          var parentElm = nodeOps.parentNode(oldElm); // 获取真实dom的父级

          // create new node
          // 把vnode挂载到真实dom中
          createElm(
            vnode,
            insertedVnodeQueue,
            // extremely rare edge case: do not insert if old element is in a
            // leaving transition. Only happens when combining transition +
            // keep-alive + HOCs. (#4590)
            oldElm._leaveCb ? null : parentElm,
            nodeOps.nextSibling(oldElm)
          );

          // update parent placeholder node element, recursively
          // 递归更新父占位符节点元素
          if (isDef(vnode.parent)) {
            var ancestor = vnode.parent;
            var patchable = isPatchable(vnode);
            while (ancestor) {
              for (var i = 0; i < cbs.destroy.length; ++i) {
                cbs.destroy[i](ancestor);
              }
              ancestor.elm = vnode.elm;
              if (patchable) {
                for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                  cbs.create[i$1](emptyNode, ancestor);
                }
                // #6513
                // invoke insert hooks that may have been merged by create hooks.
                // e.g. for directives that uses the "inserted" hook.
                var insert = ancestor.data.hook.insert;
                if (insert.merged) {
                  // start at index 1 to avoid re-invoking component mounted hook
                  for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                    insert.fns[i$2]();
                  }
                }
              } else {
                registerRef(ancestor);
              }
              ancestor = ancestor.parent;
            }
          }

          // destroy old node
          if (isDef(parentElm)) {
            // 删除旧节点
            removeVnodes([oldVnode], 0, 0);
          } else if (isDef(oldVnode.tag)) {
            invokeDestroyHook(oldVnode);
          }
        }
      }

      invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
      return vnode.elm
    }
  }

  /*  */

  var directives = {
    create: updateDirectives,
    update: updateDirectives,
    destroy: function unbindDirectives (vnode) {
      updateDirectives(vnode, emptyNode);
    }
  };

  function updateDirectives (oldVnode, vnode) {
    if (oldVnode.data.directives || vnode.data.directives) {
      _update(oldVnode, vnode);
    }
  }

  function _update (oldVnode, vnode) {
    var isCreate = oldVnode === emptyNode;
    var isDestroy = vnode === emptyNode;
    var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
    var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

    var dirsWithInsert = [];
    var dirsWithPostpatch = [];

    var key, oldDir, dir;
    for (key in newDirs) {
      oldDir = oldDirs[key];
      dir = newDirs[key];
      if (!oldDir) {
        // new directive, bind
        callHook$1(dir, 'bind', vnode, oldVnode);
        if (dir.def && dir.def.inserted) {
          dirsWithInsert.push(dir);
        }
      } else {
        // existing directive, update
        dir.oldValue = oldDir.value;
        dir.oldArg = oldDir.arg;
        callHook$1(dir, 'update', vnode, oldVnode);
        if (dir.def && dir.def.componentUpdated) {
          dirsWithPostpatch.push(dir);
        }
      }
    }

    if (dirsWithInsert.length) {
      var callInsert = function () {
        for (var i = 0; i < dirsWithInsert.length; i++) {
          callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
        }
      };
      if (isCreate) {
        mergeVNodeHook(vnode, 'insert', callInsert);
      } else {
        callInsert();
      }
    }

    if (dirsWithPostpatch.length) {
      mergeVNodeHook(vnode, 'postpatch', function () {
        for (var i = 0; i < dirsWithPostpatch.length; i++) {
          callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
        }
      });
    }

    if (!isCreate) {
      for (key in oldDirs) {
        if (!newDirs[key]) {
          // no longer present, unbind
          callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
        }
      }
    }
  }

  var emptyModifiers = Object.create(null);

  function normalizeDirectives$1 (
    dirs,
    vm
  ) {
    var res = Object.create(null);
    if (!dirs) {
      // $flow-disable-line
      return res
    }
    var i, dir;
    for (i = 0; i < dirs.length; i++) {
      dir = dirs[i];
      if (!dir.modifiers) {
        // $flow-disable-line
        dir.modifiers = emptyModifiers;
      }
      res[getRawDirName(dir)] = dir;
      dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
    }
    // $flow-disable-line
    return res
  }

  function getRawDirName (dir) {
    return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
  }

  function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
    var fn = dir.def && dir.def[hook];
    if (fn) {
      try {
        fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
      } catch (e) {
        handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
      }
    }
  }

  var baseModules = [
    ref, // ref创建，创建/更新/销毁 函数
    directives // 自定义指令，创建/更新/销毁 函数
  ];

  /*  */

  function updateAttrs (oldVnode, vnode) {
    var opts = vnode.componentOptions;
    if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
      return
    }
    if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
      return
    }
    var key, cur, old;
    var elm = vnode.elm;
    var oldAttrs = oldVnode.data.attrs || {};
    var attrs = vnode.data.attrs || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(attrs.__ob__)) {
      attrs = vnode.data.attrs = extend({}, attrs);
    }

    for (key in attrs) {
      cur = attrs[key];
      old = oldAttrs[key];
      if (old !== cur) {
        setAttr(elm, key, cur);
      }
    }
    // #4391: in IE9, setting type can reset value for input[type=radio]
    // #6666: IE/Edge forces progress value down to 1 before setting a max
    /* istanbul ignore if */
    if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
      setAttr(elm, 'value', attrs.value);
    }
    for (key in oldAttrs) {
      if (isUndef(attrs[key])) {
        if (isXlink(key)) {
          elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
        } else if (!isEnumeratedAttr(key)) {
          elm.removeAttribute(key);
        }
      }
    }
  }

  function setAttr (el, key, value) {
    if (el.tagName.indexOf('-') > -1) {
      baseSetAttr(el, key, value);
    } else if (isBooleanAttr(key)) {
      // set attribute for blank value
      // e.g. <option disabled>Select one</option>
      if (isFalsyAttrValue(value)) {
        el.removeAttribute(key);
      } else {
        // technically allowfullscreen is a boolean attribute for <iframe>,
        // but Flash expects a value of "true" when used on <embed> tag
        value = key === 'allowfullscreen' && el.tagName === 'EMBED'
          ? 'true'
          : key;
        el.setAttribute(key, value);
      }
    } else if (isEnumeratedAttr(key)) {
      el.setAttribute(key, convertEnumeratedValue(key, value));
    } else if (isXlink(key)) {
      if (isFalsyAttrValue(value)) {
        el.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else {
        el.setAttributeNS(xlinkNS, key, value);
      }
    } else {
      baseSetAttr(el, key, value);
    }
  }

  function baseSetAttr (el, key, value) {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // #7138: IE10 & 11 fires input event when setting placeholder on
      // <textarea>... block the first input event and remove the blocker
      // immediately.
      /* istanbul ignore if */
      if (
        isIE && !isIE9 &&
        el.tagName === 'TEXTAREA' &&
        key === 'placeholder' && value !== '' && !el.__ieph
      ) {
        var blocker = function (e) {
          e.stopImmediatePropagation();
          el.removeEventListener('input', blocker);
        };
        el.addEventListener('input', blocker);
        // $flow-disable-line
        el.__ieph = true; /* IE placeholder patched */
      }
      el.setAttribute(key, value);
    }
  }

  var attrs = {
    create: updateAttrs,
    update: updateAttrs
  };

  /*  */

  function updateClass (oldVnode, vnode) {
    var el = vnode.elm;
    var data = vnode.data;
    var oldData = oldVnode.data;
    if (
      isUndef(data.staticClass) &&
      isUndef(data.class) && (
        isUndef(oldData) || (
          isUndef(oldData.staticClass) &&
          isUndef(oldData.class)
        )
      )
    ) {
      return
    }

    var cls = genClassForVnode(vnode);

    // handle transition classes
    var transitionClass = el._transitionClasses;
    if (isDef(transitionClass)) {
      cls = concat(cls, stringifyClass(transitionClass));
    }

    // set the class
    if (cls !== el._prevClass) {
      el.setAttribute('class', cls);
      el._prevClass = cls;
    }
  }

  var klass = {
    create: updateClass,
    update: updateClass
  };

  /*  */

  // 匹配 ) 或 . 或 + 或 - 或 _ 或 $ 或 ]
  var validDivisionCharRE = /[\w).+\-_$\]]/;

  /**
   * 解析成正确的value，
   * 把过滤器转换成vue虚拟dom的解析方法函数
   * 比如把过滤器 'message | filterA | filterB('arg1', arg2)' 转换成 _f("filterB")(_f("filterA")(message),arg1,arg2)
   * @param {表达式} exp 
   */
  function parseFilters (exp) {
    // 是否在 ''中
    var inSingle = false;
    // 是否在 "" 中
    var inDouble = false;
    // 是否在 ``
    var inTemplateString = false;
    // 是否在 正则 \\ 中
    var inRegex = false;
    // 是否在 `{` 中发现一个 culy加1,然后发现一个 `}` culy减1,直到culy为0,说明 { .. }闭合
    var curly = 0;
    // 跟 `{` 一样有一个 `[` 加1, 有一个 `]` 减1
    var square = 0;
    // 跟 `{` 一样有一个 `(` 加1, 有一个 `)` 减1
    var paren = 0;
    // 属性值字符串中字符的索引，将会被用来确定过滤器的位置
    var lastFilterIndex = 0;
    // c: 当前读入字符所对应的 ASCII 码
    // prev: 当前字符的前一个字符所对应的 ASCII 码
    // i: 当前读入字符的位置索引
    // expression: 是 parseFilters 函数的返回值
    // filters: 是一个数组，它保存着所有过滤器函数名
    var c, prev, i, expression, filters;

    // 将属性值字符串作为字符流读入，从第一个字符开始一直读到字符串的末尾
    for (i = 0; i < exp.length; i++) {
      prev = c; // 将上一次读取的字符所对应的 ASCII 码赋值给 prev 变量
      c = exp.charCodeAt(i); // 设置为当前读取字符所对应的 ASCII 码
      if (inSingle) { // 如果当前读取的字符存在于由单引号包裹的字符串内，则会执行这里的代码
        // c === `'` && pre !== `\`，当前字符是单引号(')，并且当前字符的前一个字符不是反斜杠(\)
        if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
      } else if (inDouble) { // 如果当前读取的字符存在于由双引号包裹的字符串内，则会执行这里的代码
        // c === `"` && pre !== `\`，当前字符是双引号(')，并且当前字符的前一个字符不是反斜杠(\)
        if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
      } else if (inTemplateString) { // 如果当前读取的字符存在于模板字符串内，则会执行这里的代码
        // c === ``` && pre !== `\`，当前字符是(`)，并且当前字符的前一个字符不是反斜杠(\)
        if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
      } else if (inRegex) { // 如果当前读取的字符存在于正则表达式内，则会执行这里的代码
        // c === `/` && pre !== `\`，当前字符是斜杠(/)，并且当前字符的前一个字符不是反斜杠(\)
        if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
      } else if (
        // 1. 0x7C ===> `|`，当前字符必须是管道
        // 2. 该字符的后一个字符不能是管道符
        // 3. 该字符的前一个字符不能是管道符
        // 4. 该字符不能处于 {} 中
        // 5. 该字符不能处于 [] 中
        // 6. 该字符不能处于 () 中
        // 字符满足以上条件，则说明该字符就是用来作为过滤器分界线的管道符
        c === 0x7C && // pipe 
        exp.charCodeAt(i + 1) !== 0x7C &&
        exp.charCodeAt(i - 1) !== 0x7C &&
        !curly && !square && !paren
      ) { // 如果当前读取的字符是过滤器的分界线，则会执行这里的代码
        if (expression === undefined) {
          // first filter, end of expression
          // 过滤器表达式,就是管道符号之后开始
          lastFilterIndex = i + 1;
          // 存储过滤器的表达式
          // 例如:这里匹配如果字符串是 'ab|c' 则把ab匹配出来
          expression = exp.slice(0, i).trim();
        } else { // 当不满足以上条件时，执行这里的代码
          pushFilter();
        }
      } else {
        switch (c) {
          // 如果当前字符为双引号(")，则将 inDouble 变量的值设置为 true
          // 如果当前字符为单引号(')，则将 inSingle 变量的值设置为 true
          // 如果当前字符为模板字符串的定义字符(`)，则将 inTemplateString 变量的值设置为 true
          // 如果当前字符是左圆括号(()，则将 paren 变量的值加一
          // 如果当前字符是右圆括号())，则将 paren 变量的值减一
          // 如果当前字符是左方括号([)，则将 square 变量的值加一
          // 如果当前字符是右方括号(])，则将 square 变量的值减一
          // 如果当前字符是左花括号({)，则将 curly 变量的值加一
          // 如果当前字符是右花括号(})，则将 curly 变量的值减一
          case 0x22: inDouble = true; break         // "
          case 0x27: inSingle = true; break         // '
          case 0x60: inTemplateString = true; break // `
          case 0x28: paren++; break                 // (
          case 0x29: paren--; break                 // )
          case 0x5B: square++; break                // [
          case 0x5D: square--; break                // ]
          case 0x7B: curly++; break                 // {
          case 0x7D: curly--; break                 // }
        }
        if (c === 0x2f) { // /
          var j = i - 1; // 变量 j 是 / 字符的前一个字符的索引
          var p = (void 0);
          // find first non-whitespace prev char
          // 是找到 / 字符之前第一个不为空的字符
          for (; j >= 0; j--) {
            p = exp.charAt(j);
            if (p !== ' ') { break }
          }
          // 如果字符 / 之前没有非空的字符，或该字符不满足正则 validDivisionCharRE 的情况下，才会认为字符 / 为正则的开始
          if (!p || !validDivisionCharRE.test(p)) {
            inRegex = true;
          }
        }
      }
    }

    if (expression === undefined) {
      expression = exp.slice(0, i).trim();
    } else if (lastFilterIndex !== 0) {
      pushFilter();
    }

    /**
     * 获取当前过滤器的,并将其存储在filters 数组中
     * filters = [ 'filterA' , 'filterB']
     */
    function pushFilter () {
      // 检查变量 filters 是否存在，如果不存在则将其初始化为空数组
      // 接着使用 slice 方法对字符串 exp 进行截取，截取的开始和结束位置恰好是 lastFilterIndex(指的是管道符后面的第一个字符) 和 i
      (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
      lastFilterIndex = i + 1;
    }

    if (filters) {
      for (i = 0; i < filters.length; i++) {
        // 把过滤器封装成函数,虚拟dom需要渲染的函数
        expression = wrapFilter(expression, filters[i]);
      }
    }

    return expression
  }

  /**
   * 生成过滤器的表达式字符串
   * 例如: 
   *  {{ message | filterA | filterB('arg1', arg2) }}
   *  第一步  以exp 为入参 生成 filterA 的过滤器表达式字符串  
   *    _f("filterA")(message)
   *  第二步 以第一步字符串作为入参,生成第二个过滤器的表达式字符串
   *   _f("filterB")(_f("filterA")(message),arg1,arg2)
   * @param {上一个过滤器的值，没有就是表达式的值} exp 
   * @param {过滤器} filter 
   */
  function wrapFilter (exp, filter) {
    // 返回字符串第一次出现'('索引的位置
    var i = filter.indexOf('(');
    if (i < 0) {
      // _f: resolveFilter
      return ("_f(\"" + filter + "\")(" + exp + ")")
    } else {
      // name 是从字符串开始到 `(` 结束的字符串,不包含 `(`
      var name = filter.slice(0, i);
      // args是从 `(` 开始匹配，到字符串末端，不包含`(`
      var args = filter.slice(i + 1);
      return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
    }
  }

  /*  */



  /* eslint-disable no-unused-vars */
  function baseWarn (msg, range) {
    console.error(("[Vue compiler]: " + msg));
  }
  /* eslint-enable no-unused-vars */

  /**
   * 从第一个参数中"采摘"出函数名字与第二个参数所指定字符串相同的函数，并将它们组成一个数组
   * @param {*} modules 
   * @param {*} key 
   */
  function pluckModuleFunction (
    modules,
    key
  ) {
    return modules
      ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; }) // filter是为了过滤掉 undefined
      : []
  }

  function addProp (el, name, value, range, dynamic) {
    (el.props || (el.props = [])).push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  /**
   * 将属性与属性对应的字符串值添加到元素描述对象的 el.attrs 或 el.dynamicAttrs 数组中。
   * @param {当前元素描述对象} el 
   * @param {绑定属性的名字} name 
   * @param {绑定属性的值} value 
   * @param {范围，即在el.attrsList中对应的属性值} range 
   * @param {是否是动态属性} dynamic 
   */
  function addAttr (el, name, value, range, dynamic) {
    var attrs = dynamic
      ? (el.dynamicAttrs || (el.dynamicAttrs = []))
      : (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // add a raw attr (use this in preTransforms)
  /**
   * 将属性的名和值分别添加到元素描述对象的 el.attrsMap 对象以及 el.attrsList 数组中
   * @param {当前元素描述对象} el 
   * @param {绑定属性的名字} name 
   * @param {绑定属性的值} value 
   * @param {范围，即在el.attrsList中对应的属性值å} range 
   */
  function addRawAttr (el, name, value, range) {
    el.attrsMap[name] = value;
    el.attrsList.push(rangeSetItem({ name: name, value: value }, range));
  }

  /**
   * 在元素描述对象上添加 `el.directives` 属性的
   * @param {当前元素描述对象} el 
   * @param {绑定属性的名字，即指令名称} name 
   * @param {绑定属性的原始名称} rawName 
   * @param {绑定属性的值} value 
   * @param {参数} arg 
   * @param {是否是动态属性} isDynamicArg 
   * @param {指令修饰符对象} modifiers 
   * @param {范围，即在el.attrsList中对应的属性值} range 
   */
  function addDirective (
    el,
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers,
    range
  ) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
      name: name,
      rawName: rawName,
      value: value,
      arg: arg,
      isDynamicArg: isDynamicArg,
      modifiers: modifiers
    }, range));
    el.plain = false;
  }

  /**
   * 前置修饰标记
   * @param {标示符} symbol 
   * @param {绑定属性的名字，即事件名称} name 
   * @param {是否是动态属性} dynamic 
   */
  function prependModifierMarker (symbol, name, dynamic) {
    // 如果动态属性则返回，例如 _p(click,!)，如果不是动态属性则返回 ！click
    return dynamic
      ? ("_p(" + name + ",\"" + symbol + "\")")
      : symbol + name // mark the event as captured
  }

  /**
   * 在当前元素描述对象上添加事件侦听器，实际上就是将事件名称与该事件的侦听函数添加到元素描述对象的 el.events 属性或 el.nativeEvents 属性中
   * @param {当前元素描述对象} el 
   * @param {绑定属性的名字，即事件名称} name 
   * @param {绑定属性的值，这个值有可能是事件回调函数名字，有可能是内联语句，有可能是函数表达式} value 
   * @param {指令修饰符对象} modifiers 
   * @param {可选参数，是一个布尔值，代表着添加的事件侦听函数的重要级别，如果为 true，则该侦听函数会被添加到该事件侦听函数数组的头部，否则会将其添加到尾部} important 
   * @param {打印警告信息的函数，是一个可选参数} warn 
   * @param {范围，即在el.attrsList中对应的属性值} range 
   * @param {是否是动态属性} dynamic 
   */
  function addHandler (
    el,
    name,
    value,
    modifiers,
    important,
    warn,
    range,
    dynamic
  ) {
    modifiers = modifiers || emptyObject;
    // warn prevent and passive modifier
    /* istanbul ignore if */
    // 提示开发者 passive 修饰符不能和 prevent 修饰符一起使用，
    // 这是因为在事件监听中 passive 选项参数就是用来告诉浏览器该事件监听函数是不会阻止默认行为的
    if (
       warn &&
      modifiers.prevent && modifiers.passive
    ) {
      warn(
        'passive and prevent can\'t be used together. ' +
        'Passive handler can\'t prevent default event.',
        range
      );
    }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    // 处理.right修饰符 - (2.2.0) 只当点击鼠标右键时触发
    if (modifiers.right) {
      if (dynamic) {
        // 例如 @click.right='handleClick'，此时name为 name = `(click)==='click'?'contextmenu':'click'`
        name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
      } else if (name === 'click') {
        name = 'contextmenu';
        delete modifiers.right;
      }
    } else if (modifiers.middle) { // 处理.middle修饰符 - (2.2.0) 只当点击鼠标中键时触发
      if (dynamic) {
        // 例如 @click.middle='handleClick'，此时name为 name = `(click)==='click'?'mouseup':'click'`
        name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
      } else if (name === 'click') {
        name = 'mouseup';
      }
    }

    // check capture modifier
    // 处理捕获
    if (modifiers.capture) {
      // 删除capture属性
      delete modifiers.capture;
      // 如果动态属性则name为，例如 _p(click,!)，如果不是动态属性则name为, 例如 !click
      name = prependModifierMarker('!', name, dynamic);
    }
    // 处理只执行一次
    if (modifiers.once) {
      // 删除once属性
      delete modifiers.once;
      // 如果动态属性则name为，例如 _p(click,~)，如果不是动态属性则name为, 例如 ~click
      name = prependModifierMarker('~', name, dynamic);
    }
    /* istanbul ignore if */
    // 处理passive
    if (modifiers.passive) {
      // 删除passive属性
      delete modifiers.passive;
      // 如果动态属性则name为，例如 _p(click,&)，如果不是动态属性则name为, 例如 &click
      name = prependModifierMarker('&', name, dynamic);
    }

    var events;
    if (modifiers.native) {
      // 删除了 modifiers.native 属性
      delete modifiers.native;
      // 在元素描述对象上添加 el.nativeEvents 属性，初始值为一个空对象，并且 events 变量与 el.nativeEvents 属性具有相同的引用
      events = el.nativeEvents || (el.nativeEvents = {});
    } else {
      // native属性不存在则会在元素描述对象上添加 el.events 属性，它的初始值也是一个空对象，此时 events 变量的引用将与 el.events 属性相同
      events = el.events || (el.events = {});
    }

    // 给第一个对象参数添加开始结束位置
    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    if (modifiers !== emptyObject) {
      // 修饰符不为空则给newHandler添加modifiers属性
      newHandler.modifiers = modifiers;
    }

    var handlers = events[name];
    /* istanbul ignore if */
    if (Array.isArray(handlers)) {
      important ? handlers.unshift(newHandler) : handlers.push(newHandler);
    } else if (handlers) {
      events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else {
      events[name] = newHandler;
    }

    el.plain = false;
  }

  /**
   * el例如: 
   * rawAttrsMap: {ref: {name: "ref", value: "child", start: 76, end: 87}}
   * @param {AST树} el 
   * @param {例如:key,ref,slot,name,is等} name 
   */
  function getRawBindingAttr (
    el,
    name
  ) {
    // 例如: el.rawAttrsMap[`:key`] 或 el.rawAttrsMap[`v-bind:key`] 或 el.rawAttrsMap[`key`]
    return el.rawAttrsMap[':' + name] ||
      el.rawAttrsMap['v-bind:' + name] ||
      el.rawAttrsMap[name]
  }

  /**
   * 获取:属性 或者v-bind:属性，并且返回获取到属性的值
   * @param {AST树} el 
   * @param {对应的属性名，例如:key,ref,slot,name,is等} name 
   * @param {} getStatic 
   */
  function getBindingAttr (
    el,
    name,
    getStatic
  ) {
    // 从元素描述对象的 attrsList 数组中获取到属性名字为参数 name 的值所对应的属性值，并赋值给变量 dynamicValue 
    var dynamicValue =
      getAndRemoveAttr(el, ':' + name) ||
      getAndRemoveAttr(el, 'v-bind:' + name);
    if (dynamicValue != null) { // 存在的情况
      return parseFilters(dynamicValue)
    } else if (getStatic !== false) { // 当不传递第三个参数时
      // 用来获取非绑定的属性值
      var staticValue = getAndRemoveAttr(el, name);
      if (staticValue != null) {
         // 转换成字符串,够保证对于非绑定的属性来讲，总是会将该属性的值作为字符串处理
        return JSON.stringify(staticValue)
      }
    }
  }

  // note: this only removes the attr from the Array (attrsList) so that it
  // doesn't get processed by processAttrs.
  // By default it does NOT remove it from the map (attrsMap) because the map is
  // needed during codegen.
  /**
   * 移除传进来的属性name，并且返回获取到属性的值
   * @param {AST树} el 
   * @param {属性名称} name 
   * @param {是否要删除属性的标志} removeFromMap 
   */
  function getAndRemoveAttr (
    el,
    name,
    removeFromMap
  ) {
    var val;
    // el.attrsMap，例如 attrsMap: {ref: "child"}
    if ((val = el.attrsMap[name]) != null) {
      // attrsList: [{name: "ref", value: "child", start: 76, end: 87}]
      var list = el.attrsList;
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i].name === name) {
          list.splice(i, 1); // 删除数组中对应数据项
          break
        }
      }
    }
    if (removeFromMap) {
      delete el.attrsMap[name]; // 删除对象中对应的属性
    }
    return val
  }

  /**
   * 获取通过正则匹配绑定的 attr 值
   * @param {AST树} el 
   * @param {属性名} name 
   */
  function getAndRemoveAttrByRegex (
    el,
    name
  ) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      var attr = list[i];
      // 例如：匹配到 'v-slot' 或者 'v-slot:xxx' 则会返回其对应的 attr
      if (name.test(attr.name)) {
        list.splice(i, 1); // // 删除数组中对应数据项
        return attr
      }
    }
  }

  /**
   * 给item添加开始结束位置，例如@click="clickItem(index)"
   * @param {例如：{value: clickItem(index),dynamic: false}} item 
   * @param {例如：{name: "@click", value: "clickItem(index)", start: 99, end: 124}} range 
   */
  function rangeSetItem (
    item,
    range
  ) {
    if (range) {
      if (range.start != null) {
        item.start = range.start;
      }
      if (range.end != null) {
        item.end = range.end;
      }
    }
    return item
  }

  /*  */

  /**
   * Cross-platform code generation for component v-model
   */
  function genComponentModel (
    el,
    value,
    modifiers
  ) {
    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;

    var baseValueExpression = '$$v';
    var valueExpression = baseValueExpression;
    if (trim) {
      valueExpression =
        "(typeof " + baseValueExpression + " === 'string'" +
        "? " + baseValueExpression + ".trim()" +
        ": " + baseValueExpression + ")";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }
    var assignment = genAssignmentCode(value, valueExpression);

    el.model = {
      value: ("(" + value + ")"),
      expression: JSON.stringify(value),
      callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
    };
  }

  /**
   * Cross-platform codegen helper for generating v-model value assignment code.
   */
  /**
   * 获取一个代码字符串，例如 v-bind:prop1.sync='prop1'，此时value为prop1
   * @param {value值，例如：prop1} value 
   * @param {给定字符，例如：$event} assignment 
   */
  function genAssignmentCode (
    value,
    assignment
  ) {
    // 解析v-modelde
    var res = parseModel(value);
    if (res.key === null) {
      return (value + "=" + assignment)
    } else {
      return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
    }
  }

  /**
   * Parse a v-model expression into a base path and a final key segment.
   * Handles both dot-path and possible square brackets.
   *
   * Possible cases:
   *
   * - test
   * - test[key]
   * - test[test1[key]]
   * - test["a"][key]
   * - xxx.test[a[a].test1[key]]
   * - test.xxx.a["asa"][test1[key]]
   *
   */

  var len, str, chr, index$1, expressionPos, expressionEndPos;



  function parseModel (val) {
    // Fix https://github.com/vuejs/vue/pull/7730
    // allow v-model="obj.val " (trailing whitespace)
    val = val.trim();
    len = val.length;

    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
      index$1 = val.lastIndexOf('.');
      if (index$1 > -1) {
        return {
          exp: val.slice(0, index$1),
          key: '"' + val.slice(index$1 + 1) + '"'
        }
      } else {
        return {
          exp: val,
          key: null
        }
      }
    }

    str = val;
    index$1 = expressionPos = expressionEndPos = 0;

    while (!eof()) {
      chr = next();
      /* istanbul ignore if */
      if (isStringStart(chr)) {
        parseString(chr);
      } else if (chr === 0x5B) {
        parseBracket(chr);
      }
    }

    return {
      exp: val.slice(0, expressionPos),
      key: val.slice(expressionPos + 1, expressionEndPos)
    }
  }

  function next () {
    return str.charCodeAt(++index$1)
  }

  function eof () {
    return index$1 >= len
  }

  function isStringStart (chr) {
    return chr === 0x22 || chr === 0x27
  }

  function parseBracket (chr) {
    var inBracket = 1;
    expressionPos = index$1;
    while (!eof()) {
      chr = next();
      if (isStringStart(chr)) {
        parseString(chr);
        continue
      }
      if (chr === 0x5B) { inBracket++; }
      if (chr === 0x5D) { inBracket--; }
      if (inBracket === 0) {
        expressionEndPos = index$1;
        break
      }
    }
  }

  function parseString (chr) {
    var stringQuote = chr;
    while (!eof()) {
      chr = next();
      if (chr === stringQuote) {
        break
      }
    }
  }

  /*  */

  var warn$1;

  // in some cases, the event used has to be determined at runtime
  // so we used some reserved tokens during compile.
  var RANGE_TOKEN = '__r';
  var CHECKBOX_RADIO_TOKEN = '__c';

  function model (
    el,
    dir,
    _warn
  ) {
    warn$1 = _warn;
    var value = dir.value;
    var modifiers = dir.modifiers;
    var tag = el.tag;
    var type = el.attrsMap.type;

    {
      // inputs with type="file" are read only and setting the input's
      // value will throw an error.
      if (tag === 'input' && type === 'file') {
        warn$1(
          "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
          "File inputs are read only. Use a v-on:change listener instead.",
          el.rawAttrsMap['v-model']
        );
      }
    }

    if (el.component) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else if (tag === 'select') {
      genSelect(el, value, modifiers);
    } else if (tag === 'input' && type === 'checkbox') {
      genCheckboxModel(el, value, modifiers);
    } else if (tag === 'input' && type === 'radio') {
      genRadioModel(el, value, modifiers);
    } else if (tag === 'input' || tag === 'textarea') {
      genDefaultModel(el, value, modifiers);
    } else if (!config.isReservedTag(tag)) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else {
      warn$1(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "v-model is not supported on this element type. " +
        'If you are working with contenteditable, it\'s recommended to ' +
        'wrap a library dedicated for that purpose inside a custom component.',
        el.rawAttrsMap['v-model']
      );
    }

    // ensure runtime directive metadata
    return true
  }

  function genCheckboxModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
    addProp(el, 'checked',
      "Array.isArray(" + value + ")" +
      "?_i(" + value + "," + valueBinding + ")>-1" + (
        trueValueBinding === 'true'
          ? (":(" + value + ")")
          : (":_q(" + value + "," + trueValueBinding + ")")
      )
    );
    addHandler(el, 'change',
      "var $$a=" + value + "," +
          '$$el=$event.target,' +
          "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
      'if(Array.isArray($$a)){' +
        "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
            '$$i=_i($$a,$$v);' +
        "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
        "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
      "}else{" + (genAssignmentCode(value, '$$c')) + "}",
      null, true
    );
  }

  function genRadioModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
    addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
  }

  function genSelect (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var selectedVal = "Array.prototype.filter" +
      ".call($event.target.options,function(o){return o.selected})" +
      ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
      "return " + (number ? '_n(val)' : 'val') + "})";

    var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
    var code = "var $$selectedVal = " + selectedVal + ";";
    code = code + " " + (genAssignmentCode(value, assignment));
    addHandler(el, 'change', code, null, true);
  }

  function genDefaultModel (
    el,
    value,
    modifiers
  ) {
    var type = el.attrsMap.type;

    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    {
      var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
      var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
      if (value$1 && !typeBinding) {
        var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
        warn$1(
          binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
          'because the latter already expands to a value binding internally',
          el.rawAttrsMap[binding]
        );
      }
    }

    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;
    var needCompositionGuard = !lazy && type !== 'range';
    var event = lazy
      ? 'change'
      : type === 'range'
        ? RANGE_TOKEN
        : 'input';

    var valueExpression = '$event.target.value';
    if (trim) {
      valueExpression = "$event.target.value.trim()";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }

    var code = genAssignmentCode(value, valueExpression);
    if (needCompositionGuard) {
      code = "if($event.target.composing)return;" + code;
    }

    addProp(el, 'value', ("(" + value + ")"));
    addHandler(el, event, code, null, true);
    if (trim || number) {
      addHandler(el, 'blur', '$forceUpdate()');
    }
  }

  /*  */

  // normalize v-model event tokens that can only be determined at runtime.
  // it's important to place the event as the first in the array because
  // the whole point is ensuring the v-model callback gets called before
  // user-attached handlers.
  function normalizeEvents (on) {
    /* istanbul ignore if */
    if (isDef(on[RANGE_TOKEN])) {
      // IE input[type=range] only supports `change` event
      var event = isIE ? 'change' : 'input';
      on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
      delete on[RANGE_TOKEN];
    }
    // This was originally intended to fix #4521 but no longer necessary
    // after 2.5. Keeping it for backwards compat with generated code from < 2.4
    /* istanbul ignore if */
    if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
      on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
      delete on[CHECKBOX_RADIO_TOKEN];
    }
  }

  var target$1;

  function createOnceHandler$1 (event, handler, capture) {
    var _target = target$1; // save current target element in closure
    return function onceHandler () {
      var res = handler.apply(null, arguments);
      if (res !== null) {
        remove$2(event, onceHandler, capture, _target);
      }
    }
  }

  // #9446: Firefox <= 53 (in particular, ESR 52) has incorrect Event.timeStamp
  // implementation and does not fire microtasks in between event propagation, so
  // safe to exclude.
  var useMicrotaskFix = isUsingMicroTask && !(isFF && Number(isFF[1]) <= 53);

  function add$1 (
    name,
    handler,
    capture,
    passive
  ) {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    if (useMicrotaskFix) {
      var attachedTimestamp = currentFlushTimestamp;
      var original = handler;
      handler = original._wrapper = function (e) {
        if (
          // no bubbling, should always fire.
          // this is just a safety net in case event.timeStamp is unreliable in
          // certain weird environments...
          e.target === e.currentTarget ||
          // event is fired after handler attachment
          e.timeStamp >= attachedTimestamp ||
          // bail for environments that have buggy event.timeStamp implementations
          // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
          // #9681 QtWebEngine event.timeStamp is negative value
          e.timeStamp <= 0 ||
          // #9448 bail if event is fired in another document in a multi-page
          // electron/nw.js app, since event.timeStamp will be using a different
          // starting reference
          e.target.ownerDocument !== document
        ) {
          return original.apply(this, arguments)
        }
      };
    }
    target$1.addEventListener(
      name,
      handler,
      supportsPassive
        ? { capture: capture, passive: passive }
        : capture
    );
  }

  function remove$2 (
    name,
    handler,
    capture,
    _target
  ) {
    (_target || target$1).removeEventListener(
      name,
      handler._wrapper || handler,
      capture
    );
  }

  function updateDOMListeners (oldVnode, vnode) {
    if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
      return
    }
    var on = vnode.data.on || {};
    var oldOn = oldVnode.data.on || {};
    target$1 = vnode.elm;
    normalizeEvents(on);
    updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
    target$1 = undefined;
  }

  var events = {
    create: updateDOMListeners,
    update: updateDOMListeners
  };

  /*  */

  var svgContainer;

  function updateDOMProps (oldVnode, vnode) {
    if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
      return
    }
    var key, cur;
    var elm = vnode.elm;
    var oldProps = oldVnode.data.domProps || {};
    var props = vnode.data.domProps || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(props.__ob__)) {
      props = vnode.data.domProps = extend({}, props);
    }

    for (key in oldProps) {
      if (!(key in props)) {
        elm[key] = '';
      }
    }

    for (key in props) {
      cur = props[key];
      // ignore children if the node has textContent or innerHTML,
      // as these will throw away existing DOM nodes and cause removal errors
      // on subsequent patches (#3360)
      if (key === 'textContent' || key === 'innerHTML') {
        if (vnode.children) { vnode.children.length = 0; }
        if (cur === oldProps[key]) { continue }
        // #6601 work around Chrome version <= 55 bug where single textNode
        // replaced by innerHTML/textContent retains its parentNode property
        if (elm.childNodes.length === 1) {
          elm.removeChild(elm.childNodes[0]);
        }
      }

      if (key === 'value' && elm.tagName !== 'PROGRESS') {
        // store value as _value as well since
        // non-string values will be stringified
        elm._value = cur;
        // avoid resetting cursor position when value is the same
        var strCur = isUndef(cur) ? '' : String(cur);
        if (shouldUpdateValue(elm, strCur)) {
          elm.value = strCur;
        }
      } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) {
        // IE doesn't support innerHTML for SVG elements
        svgContainer = svgContainer || document.createElement('div');
        svgContainer.innerHTML = "<svg>" + cur + "</svg>";
        var svg = svgContainer.firstChild;
        while (elm.firstChild) {
          elm.removeChild(elm.firstChild);
        }
        while (svg.firstChild) {
          elm.appendChild(svg.firstChild);
        }
      } else if (
        // skip the update if old and new VDOM state is the same.
        // `value` is handled separately because the DOM value may be temporarily
        // out of sync with VDOM state due to focus, composition and modifiers.
        // This  #4521 by skipping the unnecessary `checked` update.
        cur !== oldProps[key]
      ) {
        // some property updates can throw
        // e.g. `value` on <progress> w/ non-finite value
        try {
          elm[key] = cur;
        } catch (e) {}
      }
    }
  }

  // check platforms/web/util/attrs.js acceptValue


  function shouldUpdateValue (elm, checkVal) {
    return (!elm.composing && (
      elm.tagName === 'OPTION' ||
      isNotInFocusAndDirty(elm, checkVal) ||
      isDirtyWithModifiers(elm, checkVal)
    ))
  }

  function isNotInFocusAndDirty (elm, checkVal) {
    // return true when textbox (.number and .trim) loses focus and its value is
    // not equal to the updated value
    var notInFocus = true;
    // #6157
    // work around IE bug when accessing document.activeElement in an iframe
    try { notInFocus = document.activeElement !== elm; } catch (e) {}
    return notInFocus && elm.value !== checkVal
  }

  function isDirtyWithModifiers (elm, newVal) {
    var value = elm.value;
    var modifiers = elm._vModifiers; // injected by v-model runtime
    if (isDef(modifiers)) {
      if (modifiers.number) {
        return toNumber(value) !== toNumber(newVal)
      }
      if (modifiers.trim) {
        return value.trim() !== newVal.trim()
      }
    }
    return value !== newVal
  }

  var domProps = {
    create: updateDOMProps,
    update: updateDOMProps
  };

  /*  */

  /**
   * 字符串解析为对象形式
   * 例如：<div style="color: red; background: green;"></div>
   */
  var parseStyleText = cached(function (cssText) {
    var res = {};
    // 样式字符串中分号(;)用来作为每一条样式规则的分割
    var listDelimiter = /;(?![^(]*\))/g;
    // 冒号(:)则用来一条样式规则中属性名与值的分割
    var propertyDelimiter = /:(.+)/;
    // 分割字符串，例如：[ 'color: red', 'background: green']
    cssText.split(listDelimiter).forEach(function (item) {
      if (item) {
        // 分割字符串，例如：[ 'color', 'red']
        var tmp = item.split(propertyDelimiter);
        // 给res添加属性，例如：res['color'] = 'red'
        tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
      }
    });
    return res
  });

  // merge static and dynamic style data on the same vnode
  function normalizeStyleData (data) {
    var style = normalizeStyleBinding(data.style);
    // static style is pre-processed into an object during compilation
    // and is always a fresh object, so it's safe to merge into it
    return data.staticStyle
      ? extend(data.staticStyle, style)
      : style
  }

  // normalize possible array / string values into Object
  function normalizeStyleBinding (bindingStyle) {
    if (Array.isArray(bindingStyle)) {
      return toObject(bindingStyle)
    }
    if (typeof bindingStyle === 'string') {
      return parseStyleText(bindingStyle)
    }
    return bindingStyle
  }

  /**
   * parent component style should be after child's
   * so that parent component's style could override it
   */
  function getStyle (vnode, checkChild) {
    var res = {};
    var styleData;

    if (checkChild) {
      var childNode = vnode;
      while (childNode.componentInstance) {
        childNode = childNode.componentInstance._vnode;
        if (
          childNode && childNode.data &&
          (styleData = normalizeStyleData(childNode.data))
        ) {
          extend(res, styleData);
        }
      }
    }

    if ((styleData = normalizeStyleData(vnode.data))) {
      extend(res, styleData);
    }

    var parentNode = vnode;
    while ((parentNode = parentNode.parent)) {
      if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
        extend(res, styleData);
      }
    }
    return res
  }

  /*  */

  var cssVarRE = /^--/;
  var importantRE = /\s*!important$/;
  var setProp = function (el, name, val) {
    /* istanbul ignore if */
    if (cssVarRE.test(name)) {
      el.style.setProperty(name, val);
    } else if (importantRE.test(val)) {
      el.style.setProperty(hyphenate(name), val.replace(importantRE, ''), 'important');
    } else {
      var normalizedName = normalize(name);
      if (Array.isArray(val)) {
        // Support values array created by autoprefixer, e.g.
        // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
        // Set them one by one, and the browser will only set those it can recognize
        for (var i = 0, len = val.length; i < len; i++) {
          el.style[normalizedName] = val[i];
        }
      } else {
        el.style[normalizedName] = val;
      }
    }
  };

  var vendorNames = ['Webkit', 'Moz', 'ms'];

  var emptyStyle;
  var normalize = cached(function (prop) {
    emptyStyle = emptyStyle || document.createElement('div').style;
    prop = camelize(prop);
    if (prop !== 'filter' && (prop in emptyStyle)) {
      return prop
    }
    var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
    for (var i = 0; i < vendorNames.length; i++) {
      var name = vendorNames[i] + capName;
      if (name in emptyStyle) {
        return name
      }
    }
  });

  function updateStyle (oldVnode, vnode) {
    var data = vnode.data;
    var oldData = oldVnode.data;

    if (isUndef(data.staticStyle) && isUndef(data.style) &&
      isUndef(oldData.staticStyle) && isUndef(oldData.style)
    ) {
      return
    }

    var cur, name;
    var el = vnode.elm;
    var oldStaticStyle = oldData.staticStyle;
    var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

    // if static style exists, stylebinding already merged into it when doing normalizeStyleData
    var oldStyle = oldStaticStyle || oldStyleBinding;

    var style = normalizeStyleBinding(vnode.data.style) || {};

    // store normalized style under a different key for next diff
    // make sure to clone it if it's reactive, since the user likely wants
    // to mutate it.
    vnode.data.normalizedStyle = isDef(style.__ob__)
      ? extend({}, style)
      : style;

    var newStyle = getStyle(vnode, true);

    for (name in oldStyle) {
      if (isUndef(newStyle[name])) {
        setProp(el, name, '');
      }
    }
    for (name in newStyle) {
      cur = newStyle[name];
      if (cur !== oldStyle[name]) {
        // ie9 setting to null has no effect, must use empty string
        setProp(el, name, cur == null ? '' : cur);
      }
    }
  }

  var style = {
    create: updateStyle,
    update: updateStyle
  };

  /*  */

  var whitespaceRE = /\s+/;

  /**
   * Add class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function addClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.add(c); });
      } else {
        el.classList.add(cls);
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      if (cur.indexOf(' ' + cls + ' ') < 0) {
        el.setAttribute('class', (cur + cls).trim());
      }
    }
  }

  /**
   * Remove class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function removeClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.remove(c); });
      } else {
        el.classList.remove(cls);
      }
      if (!el.classList.length) {
        el.removeAttribute('class');
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      var tar = ' ' + cls + ' ';
      while (cur.indexOf(tar) >= 0) {
        cur = cur.replace(tar, ' ');
      }
      cur = cur.trim();
      if (cur) {
        el.setAttribute('class', cur);
      } else {
        el.removeAttribute('class');
      }
    }
  }

  /*  */

  function resolveTransition (def) {
    if (!def) {
      return
    }
    /* istanbul ignore else */
    if (typeof def === 'object') {
      var res = {};
      if (def.css !== false) {
        extend(res, autoCssTransition(def.name || 'v'));
      }
      extend(res, def);
      return res
    } else if (typeof def === 'string') {
      return autoCssTransition(def)
    }
  }

  var autoCssTransition = cached(function (name) {
    return {
      enterClass: (name + "-enter"),
      enterToClass: (name + "-enter-to"),
      enterActiveClass: (name + "-enter-active"),
      leaveClass: (name + "-leave"),
      leaveToClass: (name + "-leave-to"),
      leaveActiveClass: (name + "-leave-active")
    }
  });

  var hasTransition = inBrowser && !isIE9;
  var TRANSITION = 'transition';
  var ANIMATION = 'animation';

  // Transition property/event sniffing
  var transitionProp = 'transition';
  var transitionEndEvent = 'transitionend';
  var animationProp = 'animation';
  var animationEndEvent = 'animationend';
  if (hasTransition) {
    /* istanbul ignore if */
    if (window.ontransitionend === undefined &&
      window.onwebkittransitionend !== undefined
    ) {
      transitionProp = 'WebkitTransition';
      transitionEndEvent = 'webkitTransitionEnd';
    }
    if (window.onanimationend === undefined &&
      window.onwebkitanimationend !== undefined
    ) {
      animationProp = 'WebkitAnimation';
      animationEndEvent = 'webkitAnimationEnd';
    }
  }

  // binding to window is necessary to make hot reload work in IE in strict mode
  var raf = inBrowser
    ? window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : setTimeout
    : /* istanbul ignore next */ function (fn) { return fn(); };

  function nextFrame (fn) {
    raf(function () {
      raf(fn);
    });
  }

  function addTransitionClass (el, cls) {
    var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
    if (transitionClasses.indexOf(cls) < 0) {
      transitionClasses.push(cls);
      addClass(el, cls);
    }
  }

  function removeTransitionClass (el, cls) {
    if (el._transitionClasses) {
      remove(el._transitionClasses, cls);
    }
    removeClass(el, cls);
  }

  function whenTransitionEnds (
    el,
    expectedType,
    cb
  ) {
    var ref = getTransitionInfo(el, expectedType);
    var type = ref.type;
    var timeout = ref.timeout;
    var propCount = ref.propCount;
    if (!type) { return cb() }
    var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
    var ended = 0;
    var end = function () {
      el.removeEventListener(event, onEnd);
      cb();
    };
    var onEnd = function (e) {
      if (e.target === el) {
        if (++ended >= propCount) {
          end();
        }
      }
    };
    setTimeout(function () {
      if (ended < propCount) {
        end();
      }
    }, timeout + 1);
    el.addEventListener(event, onEnd);
  }

  var transformRE = /\b(transform|all)(,|$)/;

  function getTransitionInfo (el, expectedType) {
    var styles = window.getComputedStyle(el);
    // JSDOM may return undefined for transition properties
    var transitionDelays = (styles[transitionProp + 'Delay'] || '').split(', ');
    var transitionDurations = (styles[transitionProp + 'Duration'] || '').split(', ');
    var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    var animationDelays = (styles[animationProp + 'Delay'] || '').split(', ');
    var animationDurations = (styles[animationProp + 'Duration'] || '').split(', ');
    var animationTimeout = getTimeout(animationDelays, animationDurations);

    var type;
    var timeout = 0;
    var propCount = 0;
    /* istanbul ignore if */
    if (expectedType === TRANSITION) {
      if (transitionTimeout > 0) {
        type = TRANSITION;
        timeout = transitionTimeout;
        propCount = transitionDurations.length;
      }
    } else if (expectedType === ANIMATION) {
      if (animationTimeout > 0) {
        type = ANIMATION;
        timeout = animationTimeout;
        propCount = animationDurations.length;
      }
    } else {
      timeout = Math.max(transitionTimeout, animationTimeout);
      type = timeout > 0
        ? transitionTimeout > animationTimeout
          ? TRANSITION
          : ANIMATION
        : null;
      propCount = type
        ? type === TRANSITION
          ? transitionDurations.length
          : animationDurations.length
        : 0;
    }
    var hasTransform =
      type === TRANSITION &&
      transformRE.test(styles[transitionProp + 'Property']);
    return {
      type: type,
      timeout: timeout,
      propCount: propCount,
      hasTransform: hasTransform
    }
  }

  function getTimeout (delays, durations) {
    /* istanbul ignore next */
    while (delays.length < durations.length) {
      delays = delays.concat(delays);
    }

    return Math.max.apply(null, durations.map(function (d, i) {
      return toMs(d) + toMs(delays[i])
    }))
  }

  // Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
  // in a locale-dependent way, using a comma instead of a dot.
  // If comma is not replaced with a dot, the input will be rounded down (i.e. acting
  // as a floor function) causing unexpected behaviors
  function toMs (s) {
    return Number(s.slice(0, -1).replace(',', '.')) * 1000
  }

  /*  */

  function enter (vnode, toggleDisplay) {
    var el = vnode.elm;

    // call leave callback now
    if (isDef(el._leaveCb)) {
      el._leaveCb.cancelled = true;
      el._leaveCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data)) {
      return
    }

    /* istanbul ignore if */
    if (isDef(el._enterCb) || el.nodeType !== 1) {
      return
    }

    var css = data.css;
    var type = data.type;
    var enterClass = data.enterClass;
    var enterToClass = data.enterToClass;
    var enterActiveClass = data.enterActiveClass;
    var appearClass = data.appearClass;
    var appearToClass = data.appearToClass;
    var appearActiveClass = data.appearActiveClass;
    var beforeEnter = data.beforeEnter;
    var enter = data.enter;
    var afterEnter = data.afterEnter;
    var enterCancelled = data.enterCancelled;
    var beforeAppear = data.beforeAppear;
    var appear = data.appear;
    var afterAppear = data.afterAppear;
    var appearCancelled = data.appearCancelled;
    var duration = data.duration;

    // activeInstance will always be the <transition> component managing this
    // transition. One edge case to check is when the <transition> is placed
    // as the root node of a child component. In that case we need to check
    // <transition>'s parent for appear check.
    var context = activeInstance;
    var transitionNode = activeInstance.$vnode;
    while (transitionNode && transitionNode.parent) {
      context = transitionNode.context;
      transitionNode = transitionNode.parent;
    }

    var isAppear = !context._isMounted || !vnode.isRootInsert;

    if (isAppear && !appear && appear !== '') {
      return
    }

    var startClass = isAppear && appearClass
      ? appearClass
      : enterClass;
    var activeClass = isAppear && appearActiveClass
      ? appearActiveClass
      : enterActiveClass;
    var toClass = isAppear && appearToClass
      ? appearToClass
      : enterToClass;

    var beforeEnterHook = isAppear
      ? (beforeAppear || beforeEnter)
      : beforeEnter;
    var enterHook = isAppear
      ? (typeof appear === 'function' ? appear : enter)
      : enter;
    var afterEnterHook = isAppear
      ? (afterAppear || afterEnter)
      : afterEnter;
    var enterCancelledHook = isAppear
      ? (appearCancelled || enterCancelled)
      : enterCancelled;

    var explicitEnterDuration = toNumber(
      isObject(duration)
        ? duration.enter
        : duration
    );

    if ( explicitEnterDuration != null) {
      checkDuration(explicitEnterDuration, 'enter', vnode);
    }

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(enterHook);

    var cb = el._enterCb = once(function () {
      if (expectsCSS) {
        removeTransitionClass(el, toClass);
        removeTransitionClass(el, activeClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, startClass);
        }
        enterCancelledHook && enterCancelledHook(el);
      } else {
        afterEnterHook && afterEnterHook(el);
      }
      el._enterCb = null;
    });

    if (!vnode.data.show) {
      // remove pending leave element on enter by injecting an insert hook
      mergeVNodeHook(vnode, 'insert', function () {
        var parent = el.parentNode;
        var pendingNode = parent && parent._pending && parent._pending[vnode.key];
        if (pendingNode &&
          pendingNode.tag === vnode.tag &&
          pendingNode.elm._leaveCb
        ) {
          pendingNode.elm._leaveCb();
        }
        enterHook && enterHook(el, cb);
      });
    }

    // start enter transition
    beforeEnterHook && beforeEnterHook(el);
    if (expectsCSS) {
      addTransitionClass(el, startClass);
      addTransitionClass(el, activeClass);
      nextFrame(function () {
        removeTransitionClass(el, startClass);
        if (!cb.cancelled) {
          addTransitionClass(el, toClass);
          if (!userWantsControl) {
            if (isValidDuration(explicitEnterDuration)) {
              setTimeout(cb, explicitEnterDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }

    if (vnode.data.show) {
      toggleDisplay && toggleDisplay();
      enterHook && enterHook(el, cb);
    }

    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }

  function leave (vnode, rm) {
    var el = vnode.elm;

    // call enter callback now
    if (isDef(el._enterCb)) {
      el._enterCb.cancelled = true;
      el._enterCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data) || el.nodeType !== 1) {
      return rm()
    }

    /* istanbul ignore if */
    if (isDef(el._leaveCb)) {
      return
    }

    var css = data.css;
    var type = data.type;
    var leaveClass = data.leaveClass;
    var leaveToClass = data.leaveToClass;
    var leaveActiveClass = data.leaveActiveClass;
    var beforeLeave = data.beforeLeave;
    var leave = data.leave;
    var afterLeave = data.afterLeave;
    var leaveCancelled = data.leaveCancelled;
    var delayLeave = data.delayLeave;
    var duration = data.duration;

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(leave);

    var explicitLeaveDuration = toNumber(
      isObject(duration)
        ? duration.leave
        : duration
    );

    if ( isDef(explicitLeaveDuration)) {
      checkDuration(explicitLeaveDuration, 'leave', vnode);
    }

    var cb = el._leaveCb = once(function () {
      if (el.parentNode && el.parentNode._pending) {
        el.parentNode._pending[vnode.key] = null;
      }
      if (expectsCSS) {
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, leaveClass);
        }
        leaveCancelled && leaveCancelled(el);
      } else {
        rm();
        afterLeave && afterLeave(el);
      }
      el._leaveCb = null;
    });

    if (delayLeave) {
      delayLeave(performLeave);
    } else {
      performLeave();
    }

    function performLeave () {
      // the delayed leave may have already been cancelled
      if (cb.cancelled) {
        return
      }
      // record leaving element
      if (!vnode.data.show && el.parentNode) {
        (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
      }
      beforeLeave && beforeLeave(el);
      if (expectsCSS) {
        addTransitionClass(el, leaveClass);
        addTransitionClass(el, leaveActiveClass);
        nextFrame(function () {
          removeTransitionClass(el, leaveClass);
          if (!cb.cancelled) {
            addTransitionClass(el, leaveToClass);
            if (!userWantsControl) {
              if (isValidDuration(explicitLeaveDuration)) {
                setTimeout(cb, explicitLeaveDuration);
              } else {
                whenTransitionEnds(el, type, cb);
              }
            }
          }
        });
      }
      leave && leave(el, cb);
      if (!expectsCSS && !userWantsControl) {
        cb();
      }
    }
  }

  // only used in dev mode
  function checkDuration (val, name, vnode) {
    if (typeof val !== 'number') {
      warn(
        "<transition> explicit " + name + " duration is not a valid number - " +
        "got " + (JSON.stringify(val)) + ".",
        vnode.context
      );
    } else if (isNaN(val)) {
      warn(
        "<transition> explicit " + name + " duration is NaN - " +
        'the duration expression might be incorrect.',
        vnode.context
      );
    }
  }

  function isValidDuration (val) {
    return typeof val === 'number' && !isNaN(val)
  }

  /**
   * Normalize a transition hook's argument length. The hook may be:
   * - a merged hook (invoker) with the original in .fns
   * - a wrapped component method (check ._length)
   * - a plain function (.length)
   */
  function getHookArgumentsLength (fn) {
    if (isUndef(fn)) {
      return false
    }
    var invokerFns = fn.fns;
    if (isDef(invokerFns)) {
      // invoker
      return getHookArgumentsLength(
        Array.isArray(invokerFns)
          ? invokerFns[0]
          : invokerFns
      )
    } else {
      return (fn._length || fn.length) > 1
    }
  }

  function _enter (_, vnode) {
    if (vnode.data.show !== true) {
      enter(vnode);
    }
  }

  var transition = inBrowser ? {
    create: _enter,
    activate: _enter,
    remove: function remove (vnode, rm) {
      /* istanbul ignore else */
      if (vnode.data.show !== true) {
        leave(vnode, rm);
      } else {
        rm();
      }
    }
  } : {};

  var platformModules = [
    attrs, // attrs包含两个方法create和update都是更新设置真实dom属性值 {create: updateAttrs,  update: updateAttrs   }
    klass, // klass包含类包含两个方法create和update都是更新calss，其实就是updateClass方法。，设置真实dom的class
    events, // 更新真实dom的事件，create/update
    domProps, //更新真实dom的props属性值，create/update
    style, // 更新真实dom的style属性，create/和update。方法create和update函数都是updateStyle更新真实dom的style属性值，将vonde虚拟dom的css转义成并且渲染到真实dom的css中
    transition // 过度动画，create/activate/remove
  ];

  /*  */

  // the directive module should be applied last, after all
  // built-in modules have been applied.
  // 合并modules
  var modules = platformModules.concat(baseModules);

  var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

  /**
   * Not type checking this file because flow doesn't like attaching
   * properties to Elements.
   */

  /* istanbul ignore if */
  if (isIE9) {
    // http://www.matts411.com/post/internet-explorer-9-oninput/
    document.addEventListener('selectionchange', function () {
      var el = document.activeElement;
      if (el && el.vmodel) {
        trigger(el, 'input');
      }
    });
  }

  var directive = {
    inserted: function inserted (el, binding, vnode, oldVnode) {
      if (vnode.tag === 'select') {
        // #6903
        if (oldVnode.elm && !oldVnode.elm._vOptions) {
          mergeVNodeHook(vnode, 'postpatch', function () {
            directive.componentUpdated(el, binding, vnode);
          });
        } else {
          setSelected(el, binding, vnode.context);
        }
        el._vOptions = [].map.call(el.options, getValue);
      } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
        el._vModifiers = binding.modifiers;
        if (!binding.modifiers.lazy) {
          el.addEventListener('compositionstart', onCompositionStart);
          el.addEventListener('compositionend', onCompositionEnd);
          // Safari < 10.2 & UIWebView doesn't fire compositionend when
          // switching focus before confirming composition choice
          // this also fixes the issue where some browsers e.g. iOS Chrome
          // fires "change" instead of "input" on autocomplete.
          el.addEventListener('change', onCompositionEnd);
          /* istanbul ignore if */
          if (isIE9) {
            el.vmodel = true;
          }
        }
      }
    },

    componentUpdated: function componentUpdated (el, binding, vnode) {
      if (vnode.tag === 'select') {
        setSelected(el, binding, vnode.context);
        // in case the options rendered by v-for have changed,
        // it's possible that the value is out-of-sync with the rendered options.
        // detect such cases and filter out values that no longer has a matching
        // option in the DOM.
        var prevOptions = el._vOptions;
        var curOptions = el._vOptions = [].map.call(el.options, getValue);
        if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
          // trigger change event if
          // no matching option found for at least one value
          var needReset = el.multiple
            ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
            : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
          if (needReset) {
            trigger(el, 'change');
          }
        }
      }
    }
  };

  function setSelected (el, binding, vm) {
    actuallySetSelected(el, binding, vm);
    /* istanbul ignore if */
    if (isIE || isEdge) {
      setTimeout(function () {
        actuallySetSelected(el, binding, vm);
      }, 0);
    }
  }

  function actuallySetSelected (el, binding, vm) {
    var value = binding.value;
    var isMultiple = el.multiple;
    if (isMultiple && !Array.isArray(value)) {
       warn(
        "<select multiple v-model=\"" + (binding.expression) + "\"> " +
        "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
        vm
      );
      return
    }
    var selected, option;
    for (var i = 0, l = el.options.length; i < l; i++) {
      option = el.options[i];
      if (isMultiple) {
        selected = looseIndexOf(value, getValue(option)) > -1;
        if (option.selected !== selected) {
          option.selected = selected;
        }
      } else {
        if (looseEqual(getValue(option), value)) {
          if (el.selectedIndex !== i) {
            el.selectedIndex = i;
          }
          return
        }
      }
    }
    if (!isMultiple) {
      el.selectedIndex = -1;
    }
  }

  function hasNoMatchingOption (value, options) {
    return options.every(function (o) { return !looseEqual(o, value); })
  }

  function getValue (option) {
    return '_value' in option
      ? option._value
      : option.value
  }

  function onCompositionStart (e) {
    e.target.composing = true;
  }

  function onCompositionEnd (e) {
    // prevent triggering an input event for no reason
    if (!e.target.composing) { return }
    e.target.composing = false;
    trigger(e.target, 'input');
  }

  function trigger (el, type) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  }

  /*  */

  // recursively search for possible transition defined inside the component root
  function locateNode (vnode) {
    return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
      ? locateNode(vnode.componentInstance._vnode)
      : vnode
  }

  var show = {
    bind: function bind (el, ref, vnode) {
      var value = ref.value;

      vnode = locateNode(vnode);
      var transition = vnode.data && vnode.data.transition;
      var originalDisplay = el.__vOriginalDisplay =
        el.style.display === 'none' ? '' : el.style.display;
      if (value && transition) {
        vnode.data.show = true;
        enter(vnode, function () {
          el.style.display = originalDisplay;
        });
      } else {
        el.style.display = value ? originalDisplay : 'none';
      }
    },

    update: function update (el, ref, vnode) {
      var value = ref.value;
      var oldValue = ref.oldValue;

      /* istanbul ignore if */
      if (!value === !oldValue) { return }
      vnode = locateNode(vnode);
      var transition = vnode.data && vnode.data.transition;
      if (transition) {
        vnode.data.show = true;
        if (value) {
          enter(vnode, function () {
            el.style.display = el.__vOriginalDisplay;
          });
        } else {
          leave(vnode, function () {
            el.style.display = 'none';
          });
        }
      } else {
        el.style.display = value ? el.__vOriginalDisplay : 'none';
      }
    },

    unbind: function unbind (
      el,
      binding,
      vnode,
      oldVnode,
      isDestroy
    ) {
      if (!isDestroy) {
        el.style.display = el.__vOriginalDisplay;
      }
    }
  };

  var platformDirectives = {
    model: directive,
    show: show
  };

  /*  */

  var transitionProps = {
    name: String,
    appear: Boolean,
    css: Boolean,
    mode: String,
    type: String,
    enterClass: String,
    leaveClass: String,
    enterToClass: String,
    leaveToClass: String,
    enterActiveClass: String,
    leaveActiveClass: String,
    appearClass: String,
    appearActiveClass: String,
    appearToClass: String,
    duration: [Number, String, Object]
  };

  // in case the child is also an abstract component, e.g. <keep-alive>
  // we want to recursively retrieve the real component to be rendered
  function getRealChild (vnode) {
    var compOptions = vnode && vnode.componentOptions;
    if (compOptions && compOptions.Ctor.options.abstract) {
      return getRealChild(getFirstComponentChild(compOptions.children))
    } else {
      return vnode
    }
  }

  function extractTransitionData (comp) {
    var data = {};
    var options = comp.$options;
    // props
    for (var key in options.propsData) {
      data[key] = comp[key];
    }
    // events.
    // extract listeners and pass them directly to the transition methods
    var listeners = options._parentListeners;
    for (var key$1 in listeners) {
      data[camelize(key$1)] = listeners[key$1];
    }
    return data
  }

  function placeholder (h, rawChild) {
    if (/\d-keep-alive$/.test(rawChild.tag)) {
      return h('keep-alive', {
        props: rawChild.componentOptions.propsData
      })
    }
  }

  function hasParentTransition (vnode) {
    while ((vnode = vnode.parent)) {
      if (vnode.data.transition) {
        return true
      }
    }
  }

  function isSameChild (child, oldChild) {
    return oldChild.key === child.key && oldChild.tag === child.tag
  }

  var isNotTextNode = function (c) { return c.tag || isAsyncPlaceholder(c); };

  var isVShowDirective = function (d) { return d.name === 'show'; };

  var Transition = {
    name: 'transition',
    props: transitionProps,
    abstract: true,

    render: function render (h) {
      var this$1 = this;

      var children = this.$slots.default;
      if (!children) {
        return
      }

      // filter out text nodes (possible whitespaces)
      children = children.filter(isNotTextNode);
      /* istanbul ignore if */
      if (!children.length) {
        return
      }

      // warn multiple elements
      if ( children.length > 1) {
        warn(
          '<transition> can only be used on a single element. Use ' +
          '<transition-group> for lists.',
          this.$parent
        );
      }

      var mode = this.mode;

      // warn invalid mode
      if (
        mode && mode !== 'in-out' && mode !== 'out-in'
      ) {
        warn(
          'invalid <transition> mode: ' + mode,
          this.$parent
        );
      }

      var rawChild = children[0];

      // if this is a component root node and the component's
      // parent container node also has transition, skip.
      if (hasParentTransition(this.$vnode)) {
        return rawChild
      }

      // apply transition data to child
      // use getRealChild() to ignore abstract components e.g. keep-alive
      var child = getRealChild(rawChild);
      /* istanbul ignore if */
      if (!child) {
        return rawChild
      }

      if (this._leaving) {
        return placeholder(h, rawChild)
      }

      // ensure a key that is unique to the vnode type and to this transition
      // component instance. This key will be used to remove pending leaving nodes
      // during entering.
      var id = "__transition-" + (this._uid) + "-";
      child.key = child.key == null
        ? child.isComment
          ? id + 'comment'
          : id + child.tag
        : isPrimitive(child.key)
          ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
          : child.key;

      var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
      var oldRawChild = this._vnode;
      var oldChild = getRealChild(oldRawChild);

      // mark v-show
      // so that the transition module can hand over the control to the directive
      if (child.data.directives && child.data.directives.some(isVShowDirective)) {
        child.data.show = true;
      }

      if (
        oldChild &&
        oldChild.data &&
        !isSameChild(child, oldChild) &&
        !isAsyncPlaceholder(oldChild) &&
        // #6687 component root is a comment node
        !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
      ) {
        // replace old child transition data with fresh one
        // important for dynamic transitions!
        var oldData = oldChild.data.transition = extend({}, data);
        // handle transition mode
        if (mode === 'out-in') {
          // return placeholder node and queue update when leave finishes
          this._leaving = true;
          mergeVNodeHook(oldData, 'afterLeave', function () {
            this$1._leaving = false;
            this$1.$forceUpdate();
          });
          return placeholder(h, rawChild)
        } else if (mode === 'in-out') {
          if (isAsyncPlaceholder(child)) {
            return oldRawChild
          }
          var delayedLeave;
          var performLeave = function () { delayedLeave(); };
          mergeVNodeHook(data, 'afterEnter', performLeave);
          mergeVNodeHook(data, 'enterCancelled', performLeave);
          mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
        }
      }

      return rawChild
    }
  };

  /*  */

  var props = extend({
    tag: String,
    moveClass: String
  }, transitionProps);

  delete props.mode;

  var TransitionGroup = {
    props: props,

    beforeMount: function beforeMount () {
      var this$1 = this;

      var update = this._update;
      this._update = function (vnode, hydrating) {
        var restoreActiveInstance = setActiveInstance(this$1);
        // force removing pass
        this$1.__patch__(
          this$1._vnode,
          this$1.kept,
          false, // hydrating
          true // removeOnly (!important, avoids unnecessary moves)
        );
        this$1._vnode = this$1.kept;
        restoreActiveInstance();
        update.call(this$1, vnode, hydrating);
      };
    },

    render: function render (h) {
      var tag = this.tag || this.$vnode.data.tag || 'span';
      var map = Object.create(null);
      var prevChildren = this.prevChildren = this.children;
      var rawChildren = this.$slots.default || [];
      var children = this.children = [];
      var transitionData = extractTransitionData(this);

      for (var i = 0; i < rawChildren.length; i++) {
        var c = rawChildren[i];
        if (c.tag) {
          if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
            children.push(c);
            map[c.key] = c
            ;(c.data || (c.data = {})).transition = transitionData;
          } else {
            var opts = c.componentOptions;
            var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
            warn(("<transition-group> children must be keyed: <" + name + ">"));
          }
        }
      }

      if (prevChildren) {
        var kept = [];
        var removed = [];
        for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
          var c$1 = prevChildren[i$1];
          c$1.data.transition = transitionData;
          c$1.data.pos = c$1.elm.getBoundingClientRect();
          if (map[c$1.key]) {
            kept.push(c$1);
          } else {
            removed.push(c$1);
          }
        }
        this.kept = h(tag, null, kept);
        this.removed = removed;
      }

      return h(tag, null, children)
    },

    updated: function updated () {
      var children = this.prevChildren;
      var moveClass = this.moveClass || ((this.name || 'v') + '-move');
      if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
        return
      }

      // we divide the work into three loops to avoid mixing DOM reads and writes
      // in each iteration - which helps prevent layout thrashing.
      children.forEach(callPendingCbs);
      children.forEach(recordPosition);
      children.forEach(applyTranslation);

      // force reflow to put everything in position
      // assign to this to avoid being removed in tree-shaking
      // $flow-disable-line
      this._reflow = document.body.offsetHeight;

      children.forEach(function (c) {
        if (c.data.moved) {
          var el = c.elm;
          var s = el.style;
          addTransitionClass(el, moveClass);
          s.transform = s.WebkitTransform = s.transitionDuration = '';
          el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
            if (e && e.target !== el) {
              return
            }
            if (!e || /transform$/.test(e.propertyName)) {
              el.removeEventListener(transitionEndEvent, cb);
              el._moveCb = null;
              removeTransitionClass(el, moveClass);
            }
          });
        }
      });
    },

    methods: {
      hasMove: function hasMove (el, moveClass) {
        /* istanbul ignore if */
        if (!hasTransition) {
          return false
        }
        /* istanbul ignore if */
        if (this._hasMove) {
          return this._hasMove
        }
        // Detect whether an element with the move class applied has
        // CSS transitions. Since the element may be inside an entering
        // transition at this very moment, we make a clone of it and remove
        // all other transition classes applied to ensure only the move class
        // is applied.
        var clone = el.cloneNode();
        if (el._transitionClasses) {
          el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
        }
        addClass(clone, moveClass);
        clone.style.display = 'none';
        this.$el.appendChild(clone);
        var info = getTransitionInfo(clone);
        this.$el.removeChild(clone);
        return (this._hasMove = info.hasTransform)
      }
    }
  };

  function callPendingCbs (c) {
    /* istanbul ignore if */
    if (c.elm._moveCb) {
      c.elm._moveCb();
    }
    /* istanbul ignore if */
    if (c.elm._enterCb) {
      c.elm._enterCb();
    }
  }

  function recordPosition (c) {
    c.data.newPos = c.elm.getBoundingClientRect();
  }

  function applyTranslation (c) {
    var oldPos = c.data.pos;
    var newPos = c.data.newPos;
    var dx = oldPos.left - newPos.left;
    var dy = oldPos.top - newPos.top;
    if (dx || dy) {
      c.data.moved = true;
      var s = c.elm.style;
      s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
      s.transitionDuration = '0s';
    }
  }

  var platformComponents = {
    Transition: Transition,
    TransitionGroup: TransitionGroup
  };

  /*  */

  // install platform specific utils
  Vue.config.mustUseProp = mustUseProp;
  Vue.config.isReservedTag = isReservedTag;
  Vue.config.isReservedAttr = isReservedAttr;
  Vue.config.getTagNamespace = getTagNamespace;
  Vue.config.isUnknownElement = isUnknownElement;

  // install platform runtime directives & components
  extend(Vue.options.directives, platformDirectives);
  extend(Vue.options.components, platformComponents);

  // install platform patch function
  // 初始化path方法
  Vue.prototype.__patch__ = inBrowser ? patch : noop;

  // public mount method
  // 原型上声明的 $mount方法在,这个方法会被runtime only版本和runtime compiler版本中复用
  Vue.prototype.$mount = function (
    el, // 真实的dom 或者 是string
    hydrating // 新的虚拟dom vnode
  ) {
    el = el && inBrowser ? query(el) : undefined;
    return mountComponent(this, el, hydrating)
  };

  // devtools global hook
  /* istanbul ignore next */
  if (inBrowser) {
    setTimeout(function () {
      if (config.devtools) {
        if (devtools) {
          devtools.emit('init', Vue);
        } else {
          console[console.info ? 'info' : 'log'](
            'Download the Vue Devtools extension for a better development experience:\n' +
            'https://github.com/vuejs/vue-devtools'
          );
        }
      }
      if (
        config.productionTip !== false &&
        typeof console !== 'undefined'
      ) {
        console[console.info ? 'info' : 'log'](
          "You are running Vue in development mode.\n" +
          "Make sure to turn on production mode when deploying for production.\n" +
          "See more tips at https://vuejs.org/guide/deployment.html"
        );
      }
    }, 0);
  }

  /*  */

  // 匹配viwe 视图中的{{指令}}
  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  // 匹配特殊符号  - 或者. 或者* 或者+ 或者? 或者^ 或者$ 或者{ 或者} 或者( 或者) 或者| 或者[ 或者] 或者/ 或者\
  var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

  var buildRegex = cached(function (delimiters) {
    //$&与 regexp 相匹配的子串，这里的意思是遇到了特殊符号的时候在正则里面需要替换加多一个/斜杠
    var open = delimiters[0].replace(regexEscapeRE, '\\$&');
    var close = delimiters[1].replace(regexEscapeRE, '\\$&');
    // 匹配开始的open +任意字符或者换行符+ close 全局匹配
    return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
  });



  /**
   * 解析文本
   * @param {文本} text 
   * @param {被修改默认的标签匹配} delimiters 
   */
  function parseText (
    text,
    delimiters
  ) {
    // 如果delimiters不存在则用默认指令 {{}}，如果修改成其他指令则用其他指令
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
    // 匹配是否有表达式,比如:{{message}}  如果没有，则表示是纯文本节点,则直接返回不做处理
    if (!tagRE.test(text)) {
      return
    }
    var tokens = [];
    var rawTokens = [];
    var lastIndex = tagRE.lastIndex = 0;
    var match, index, tokenValue;
    // 用正则tagRE去匹配text,此时match就是text里的每个值，
    // 对于:{{item}}:{{index}}来说,
    // match等于
    // Array["{{item}}","item"] 、 
    // Array["{{index}}","index"]
    while ((match = tagRE.exec(text))) {
      // 匹配的字符串在整个字符串中的位置
      index = match.index;
      // push text token
      // 如果index大于lastIndex，
      // 表明中间还有一段文本，比如:{{item}}:{{index}}，
      // 中间的:就是文本
      if (index > lastIndex) {
        // 截取匹配到字符串指令前面的字符串，并添加到rawTokens
        rawTokens.push(tokenValue = text.slice(lastIndex, index));
        // 添加匹配到字符串指令前面的字符串
        tokens.push(JSON.stringify(tokenValue));
      }
      // tag token
      // 调用parseFilters对match[1做解析];
      // 例如{{no | a(100) | b }}，
      // 解析后的格式为:_f("b")(_f("a")(no,100))
      var exp = parseFilters(match[1].trim());
      // 把指令转义成函数，便于vonde 虚拟dom 渲染 
      // 比如指令{{name}} 转换成 _s(name)
      tokens.push(("_s(" + exp + ")"));
      // 绑定指令{{name}} 指令转换成  [{@binding: "name"}]
      rawTokens.push({ '@binding': exp });
      // 设置下一次开始匹配的位置
      lastIndex = index + match[0].length;
    }
    // 截取剩余的普通文本并将其添加到 rawTokens 和 tokens 数组中
    if (lastIndex < text.length) {
      // 截取字符串到最后一位
      rawTokens.push(tokenValue = text.slice(lastIndex));
      // 拼接最后一位字符串
      tokens.push(JSON.stringify(tokenValue));
    }
    return {
      // 拼凑成一个表达式，例如:"_s(item)+":"+_s(index)"
      expression: tokens.join('+'),
      // 模板信息，例如[{@binding: "item"},":",{@binding: "index"}]
      tokens: rawTokens
    }
  }

  /*  */

  /**
   * 对 class 属性进行扩展
   * 例如：<div :class="classObject" class="list" style="color:red;"> {{ val }} </div>
   * @param {元素描述对象} el 
   * @param {编译器的选项} options 
   */
  function transformNode (el, options) {
    // 获取打印警告信息函数
    var warn = options.warn || baseWarn;
    // 获取class属性的值，例如 staticClass = 'list'
    var staticClass = getAndRemoveAttr(el, 'class');
    if ( staticClass) {
      var res = parseText(staticClass, options.delimiters);
      if (res) {
        warn(
          "class=\"" + staticClass + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div class="{{ val }}">, use <div :class="val">.',
          el.rawAttrsMap['class']
        );
      }
    }
    // 非绑定的 class 属性，例如 el.staticClass = '"list"'
    if (staticClass) {
      el.staticClass = JSON.stringify(staticClass);
    }
    // 绑定的 class 属性，例如 el.classBinding = 'classObject'
    var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
    if (classBinding) {
      el.classBinding = classBinding;
    }
  }

  /**
   * 处理 class 或 :class属性
   * @param {AST 树} el 
   */
  function genData (el) {
    var data = '';
    if (el.staticClass) {
      data += "staticClass:" + (el.staticClass) + ",";
    }
    if (el.classBinding) {
      data += "class:" + (el.classBinding) + ",";
    }
    return data
  }

  var klass$1 = {
    staticKeys: ['staticClass'],
    transformNode: transformNode,
    genData: genData
  };

  /*  */

  /**
   * 对 style 属性进行扩展
   * 例如：<div :class="classObject" class="list" style="color:red;"> {{ val }} </div>
   * @param {元素描述对象} el 
   * @param {编译器的选项} options 
   */
  function transformNode$1 (el, options) {
    // 获取打印警告信息函数
    var warn = options.warn || baseWarn;
    // 获取 style 属性的值，例如 staticStyle = 'color:red;'
    var staticStyle = getAndRemoveAttr(el, 'style');
    if (staticStyle) {
      /* istanbul ignore if */
      {
        var res = parseText(staticStyle, options.delimiters);
        if (res) {
          warn(
            "style=\"" + staticStyle + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div style="{{ val }}">, use <div :style="val">.',
            el.rawAttrsMap['style']
          );
        }
      }
      // parseStyleText 字符串解析为对象形式
      // JSON.stringify 函数将对象变为字符串
      el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
    }

    // 获取到绑定的 style 属性值
    var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
    if (styleBinding) {
      // 将其赋值给元素描述对象的 el.styleBinding 属性
      el.styleBinding = styleBinding;
    }
  }

  /**
   * 处理 style 或 :style 属性
   * @param {AST 树} el 
   */
  function genData$1 (el) {
    var data = '';
    if (el.staticStyle) {
      data += "staticStyle:" + (el.staticStyle) + ",";
    }
    if (el.styleBinding) {
      data += "style:(" + (el.styleBinding) + "),";
    }
    return data
  }

  var style$1 = {
    staticKeys: ['staticStyle'],
    transformNode: transformNode$1,
    genData: genData$1
  };

  /*  */

  var decoder;

  var he = {
    decode: function decode (html) {
      decoder = decoder || document.createElement('div');
      decoder.innerHTML = html;
      return decoder.textContent
    }
  };

  /*  */

  var isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
  );

  // Elements that you can, intentionally, leave open
  // (and which close themselves)
  var canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
  );

  // HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
  // Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
  );

  /**
   * Not type-checking this file because it's mostly vendor code.
   */

  // Regular Expressions for parsing tags and attributes
  // 匹配标签的属性(attributes),例如 a="xx" @a="xx" @click='xxx' v-on:click="xx" filterable 等属性定义字符
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // 正则匹配动态的属性写法  @[x]="handle1"    v-on[x]=""  :[x]="" 
  var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // 不包含前缀的 XML 标签名称
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
  // 捕获的内容就是整个 qname 名称，即整个标签的名称
  var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
  // 用来匹配开始标签的一部分，这部分包括：< 以及后面的标签名称
  var startTagOpen = new RegExp(("^<" + qnameCapture));
  // 用来匹配开始标签的 < 以及标签的名字，但是并不包括开始标签的闭合部分，即：> 或者 />，由于标签可能是一元标签，所以开始标签的闭合部分有可能是 />，比如：<br />，如果不是一元标签，此时就应该是：>
  var startTagClose = /^\s*(\/?)>/;
  // 匹配结束标签
  var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
  // 匹配文档的 DOCTYPE 标签
  var doctype = /^<!DOCTYPE [^>]+>/i;
  // #7298: escape - to avoid being passed as HTML comment when inlined in page
  // 来匹配注释节点
  var comment = /^<!\--/;
  // 匹配条件注释节点
  var conditionalComment = /^<!\[/;

  // Special Elements (can contain anything)
  // 检测给定的标签名字是不是纯文本标签（包括：`script`、`style`、`textarea`）
  var isPlainTextElement = makeMap('script,style,textarea', true);
  var reCache = {};
  // 一个字面量对象， `key` 是一些特殊的 `html` 实体，值则是这些实体对应的字符
  var decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
  };
  // 匹配 '<', '>', '"', '&', "'"
  var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
  // 匹配 '<', '>', '"', '&', "'", '\n', '\t'
  var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

  // #5992
  // 检测给定的标签是否是 <pre> 标签或者 <textarea> 标签
  var isIgnoreNewlineTag = makeMap('pre,textarea', true);
  // 判断是否应该忽略标签内容的第一个换行符的，如果满足：标签是 pre 或者 textarea 且 标签内容的第一个字符是换行符，则返回 true，否则为 false
  var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

  // 将 html 实体转为对应的字符
  function decodeAttr (value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
    return value.replace(re, function (match) { return decodingMap[match]; })
  }

  /**
   * 解析HTML
   * @param {html} html 
   * @param {配置} options
   */
  function parseHTML (html, options) {
    // 一个空数组，在 while 循环中处理 html 字符流的时候每当遇到一个 非一元标签，都会将该开始标签 push 到该数组
    var stack = [];
    var expectHTML = options.expectHTML;
    // 检测一个标签是否是一元标签
    var isUnaryTag = options.isUnaryTag || no;
    // 检测一个标签是否是可以省略闭合标签的非一元标签
    var canBeLeftOpenTag = options.canBeLeftOpenTag || no;
    // 当前字符串的读入位置
    var index = 0;
    // last：存储剩余还未 parse 的 html 字符串
    // lastTag：终存储着位于 stack 栈顶的元素
    var last, lastTag;
    // 开启一个 while 循环，循环结束的条件是 html 为空，即 html 被 parse 完毕
    while (html) {
      last = html;
      // Make sure we're not in a plaintext content element like script/style
      // 确保即将 parse 的内容不是在纯文本标签里 (script,style,textarea)
      if (!lastTag || !isPlainTextElement(lastTag)) {
        // 获取 < 的位置
        var textEnd = html.indexOf('<');
        // 模板里面是以 < 开始，即索引值为0，执行 if 语句
        if (textEnd === 0) {
          // Comment:
          // 匹配注释节点开始位置 <!--
          if (comment.test(html)) {
            // 获取注释节点的结束位置 --> 的索引值
            var commentEnd = html.indexOf('-->');
            // 存在注释节点结束位置标记 -->
            if (commentEnd >= 0) {
              // 是否保留注释节点
              if (options.shouldKeepComment) {
                // 调用 comment，参数说明：例如'<!-- ccc -->'
                // html.substring(4, commentEnd) : 此处的 commentEnd 为9，截取的结果为：" ccc "
                // index： 0
                // index + commentEnd + 3 ===> 0+9+3 = 12即字符串的长度
                options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
              }
              // 将解析完的注释节点从模板中移除
              advance(commentEnd + 3);
              // 继续循环解析模板
              continue
            }
          }

          // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
          // 匹配条件注释节点开始位置 <![
          if (conditionalComment.test(html)) {
            // 获取条件注释节点的结束位置 ]> 的索引值
            var conditionalEnd = html.indexOf(']>');
            // 存在条件注释节点结束位置标记 ]>
            if (conditionalEnd >= 0) {
              // 直接从模板中移除条件注释节点，继续循环解析
              advance(conditionalEnd + 2);
              continue
            }
          }

          // Doctype:
          // 如果匹配成功 doctypeMatch 的值是一个数组，数组的第一项保存着整个匹配项的字符串，即整个 Doctype 标签的字符串，否则 doctypeMatch 的值为 null
          var doctypeMatch = html.match(doctype);
          if (doctypeMatch) {
            // 直接从模板中移除Doctype释节点，继续循环解析
            advance(doctypeMatch[0].length);
            continue
          }

          // End tag:
          // 匹配结束标签
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            var curIndex = index; // 获取当前位置
            advance(endTagMatch[0].length); // 更新index位置索引
            parseEndTag(endTagMatch[1], curIndex, index); // 解析结束标签
            continue
          }

          // Start tag:
          // 获取开始标签
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            // 处理开始标签
            handleStartTag(startTagMatch);
            // 检测是否应该忽略元素内容的第一个换行符
            if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
              advance(1);
            }
            continue
          }
        }

        var text = (void 0), rest = (void 0), next = (void 0);
        // 例如html='x<xx<xxx',textEnd的值应该为1
        if (textEnd >= 0) {
          // rest='<xx<xxx'
          rest = html.slice(textEnd);
          while (
            !endTag.test(rest) && // 不存在结束标签
            !startTagOpen.test(rest) && // 不存在开始标签
            !comment.test(rest) && // 不存在注释标签
            !conditionalComment.test(rest) // 不存在条件注释标签
          ) {
            // < in plain text, be forgiving and treat it as text
            // next=3
            next = rest.indexOf('<', 1);
            if (next < 0) { break }
            // textEnd=4
            textEnd += next;
            // rest='<xxx',此时textEnd的值应该为4，继续循环
            rest = html.slice(textEnd);
          }
          // text='x<xx',此时textEnd的值应该为4
          text = html.substring(0, textEnd);
        }

        // 此案例循环结束textEnd的值应该为4
        if (textEnd < 0) {
          text = html;
        }

        // text='x<xx'
        if (text) {
          // 更新html，html='<xxx'
          advance(text.length);
        }

        if (options.chars && text) {
          options.chars(text, index - text.length, index);
        }
        // 第一次循环结束，html='<xxx'不为空，继续下一个循环，此时textEnd为0，还是执行到textEnd >= 0，所以执行text = html.substring(0, textEnd)，即text = html.substring(0, 0)此时text为空，所以直接执行到最后 if (html === last) 
      } else {
        //  即将 parse 的内容是在纯文本标签里 (script,style,textarea)
        var endTagLength = 0;
        var stackedTag = lastTag.toLowerCase();
        // 这里我们只处理textarea元素, 其他的两种Vue 会警告，不提倡这么写
        // 缓存匹配 textarea 的正则表达式
        var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
        // 清除匹配项，处理text，以 <textarea>xxx</textarea> 为例，其中all 为 xxx</textarea>, text 为 xxx, endTag 为 </textarea>
        var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
          // 要匹配的html字符串的长度
          endTagLength = endTag.length;
          if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
            text = text
              // 匹配<!--xxx--> 
              .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
              // 匹配<!CDATAxxx>
              .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
          }
          // 忽略 <pre> 标签和 <textarea> 标签的内容中的第一个换行符
          if (shouldIgnoreFirstNewline(stackedTag, text)) {
            text = text.slice(1);
          }
          // 处理文本内容，并使用 options.char 方法
          if (options.chars) {
            options.chars(text);
          }
          return ''
        });
        // 更新index
        index += html.length - rest$1.length;
        // 更新html
        html = rest$1;
        // 解析结束tag
        parseEndTag(stackedTag, index - endTagLength, index);
      }

      // 如果两者相等，则说明字符串 html 在经历循环体的代码之后没有任何改变，此时会把 html 字符串作为纯文本对待
      if (html === last) {
        options.chars && options.chars(html);
        if ( !stack.length && options.warn) {
          options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), { start: index + html.length });
        }
        break
      }
    }

    // Clean up any remaining tags
    parseEndTag();

    /**
     * 截取字符串
     * @param {开始位置} n 
     */
    function advance (n) {
      index += n;
      html = html.substring(n);
    }

    /**
     * 解析开始标签
     */
    function parseStartTag () {
      // 匹配开始标签，例如： <p><p> ，匹配的结果是 ['<p', 'p']
      var start = html.match(startTagOpen);
      if (start) {
        var match = {
          tagName: start[1], // 标签的名称
          attrs: [], // 属性列表
          start: index // 当前字符流读入位置在整个 html 字符串中的相对位置
        };
        // 从模板中移除匹配的开始标签即 <标签名
        advance(start[0].length);
        var end, attr;
        // 1.没有匹配到开始标签的结束部分(/> 或 >)
        // 2.匹配到了开始标签中的动态属性
        // 3.匹配到了开始标签中的属性
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          attr.start = index; // 开始位置
          advance(attr[0].length); // 移除匹配到的属性，例如 ` v-for="item in list"`
          attr.end = index; // 获取属性的结束位置
          match.attrs.push(attr); // 缓存匹配到的属性
        }
        if (end) {
          match.unarySlash = end[1]; // 一元斜杠
          advance(end[0].length); // 更新index
          match.end = index; // 给match添加end属性等于结束位置的索引
          return match
        }
      }
    }

    /**
     * 处理解析结果
     * @param {解析后的开始标签} match 
     */
    function handleStartTag (match) {
      // 获取标签名
      var tagName = match.tagName;
      // 获取一元斜杠
      var unarySlash = match.unarySlash;

      if (expectHTML) {
        // isNonPhrasingTag：标签是段落式内容
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
          parseEndTag(lastTag);
        }
        // 当前正在解析的标签是一个可以省略结束标签的标签，并且与上一次解析到的开始标签相同
        if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
          parseEndTag(tagName);
        }
      }

      // isUnaryTag 判断是否是一元原生标签，!!unarySlash 判断自定义标签和组件
      var unary = isUnaryTag(tagName) || !!unarySlash;
      // 获取属性长度
      var l = match.attrs.length;
      // 新建一个数组
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        // 获取每一个属性
        var args = match.attrs[i];
        // 获取属性值 ，例如 'item in list'
        var value = args[3] || args[4] || args[5] || '';
        // 获取解码函数
        var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
          ? options.shouldDecodeNewlinesForHref
          : options.shouldDecodeNewlines;
        attrs[i] = {
          name: args[1],
          // 对属性值进行 html 实体的解码
          value: decodeAttr(value, shouldDecodeNewlines)
        };
        if ( options.outputSourceRange) {
          attrs[i].start = args.start + args[0].match(/^\s*/).length;
          attrs[i].end = args.end;
        }
      }

      if (!unary) {
        // 如果开始标签是非一元标签，则将该开始标签的信息入栈，即 push 到 stack 数组中
        stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
        // 并将 lastTag 的值设置为该标签名
        lastTag = tagName;
      }

      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }

    /**
     * 解析结束标签
     * @param {标签名} tagName 
     * @param {开始位置} start 
     * @param {结束位置} end 
     */
    function parseEndTag (tagName, start, end) {
      // pos：判断 html 字符串是否缺少结束标签
      // lowerCasedTagName：存储 tagName 的小写版
      var pos, lowerCasedTagName;
      // start 和 end 不存在时，将这两个变量的值设置为当前字符流的读入位置，即 index
      if (start == null) { start = index; }
      if (end == null) { end = index; }

      // Find the closest opened tag of the same type
      if (tagName) {
        // 将标签名转为小写格式
        lowerCasedTagName = tagName.toLowerCase();
        // 寻找当前解析的结束标签所对应的开始标签在 stack 栈中的位置
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0;
      }

      if (pos >= 0) {
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
          // 如果发现 stack 数组中存在索引大于 pos 的元素，那么该元素一定是缺少闭合标签的
          if (
            (i > pos || !tagName) &&
            options.warn
          ) {
            options.warn(
              ("tag <" + (stack[i].tag) + "> has no matching end tag."),
              { start: stack[i].start, end: stack[i].end }
            );
          }
          // 闭合标签，为了保证解析结果的正确性
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }

        // Remove the open elements from the stack
        // 匹配后把栈到 pos 位置的都弹出，并从 stack 尾部拿到 lastTag
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
      } else if (lowerCasedTagName === 'br') { // 处理 </br>
        if (options.start) {
          options.start(tagName, [], true, start, end);
        }
      } else if (lowerCasedTagName === 'p') { // 处理</p>
        if (options.start) {
          options.start(tagName, [], false, start, end);
        }
        if (options.end) {
          options.end(tagName, start, end);
        }
      }
    }
  }

  /*  */

  var onRE = /^@|^v-on:/;
  var dirRE =  /^v-|^@|^:|^#/;
  var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  var stripParensRE = /^\(|\)$/g;
  var dynamicArgRE = /^\[.*\]$/;

  var argRE = /:(.*)$/;
  var bindRE = /^:|^\.|^v-bind:/;
  var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;
  // 匹配到 'v-slot' 或 'v-slot:' 或 '#xxx' 则为 true
  var slotRE = /^v-slot(:|$)|^#/;

  var lineBreakRE = /[\r\n]/;
  var whitespaceRE$1 = /\s+/g;

  var invalidAttributeRE = /[\s"'<>\/=]/;

  var decodeHTMLCached = cached(he.decode);

  var emptySlotScopeToken = "_empty_";

  // configurable state
  var warn$2;
  var delimiters;
  var transforms;
  var preTransforms;
  var postTransforms;
  var platformIsPreTag;
  var platformMustUseProp;
  var platformGetTagNamespace;
  var maybeComponent;

  /**
   * 创建一个元素的描述对象
   * @param {标签名} tag 
   * @param {标签拥有的属性数组} attrs 
   * @param {父标签描述对象} parent 
   */
  function createASTElement (
    tag,
    attrs,
    parent
  ) {
    return {
      type: 1,
      tag: tag,
      attrsList: attrs,
      attrsMap: makeAttrsMap(attrs),
      rawAttrsMap: {},
      parent: parent,
      children: []
    }
  }

  /**
   * Convert HTML string to AST.
   */
  /**
   * HTML字符串转换为AST
   * @param {html 模板} template 
   * @param {配置信息} options 
   */
  function parse (
    template,
    options
  ) {
    warn$2 = options.warn || baseWarn; // 警告日志函数

    platformIsPreTag = options.isPreTag || no; // 判断标签是否是 pre 如果是则返回真
    /** mustUseProp 校验属性
     * 1. attr === 'value', tag 必须是 'input,textarea,option,select,progress' 其中一个 type !== 'button'
     * 2. attr === 'selected' && tag === 'option'
     * 3. attr === 'checked' && tag === 'input'
     * 4. attr === 'muted' && tag === 'video'
     * 的情况下为真
     **/
    platformMustUseProp = options.mustUseProp || no;
    // 来获取元素(标签)的命名空间
    platformGetTagNamespace = options.getTagNamespace || no;
    // 判断标签是否是保留的标签
    var isReservedTag = options.isReservedTag || no; 
    // 判断是否为组件
    maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };

    // 循环过滤数组或者对象的值，根据key循环，过滤对象或者数组[key]值，如果不存在则丢弃，如果有相同多个的key值，返回多个值的数组
    transforms = pluckModuleFunction(options.modules, 'transformNode');
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
    postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

    // 改变纯文本插入分隔符。修改指令的书写风格，比如默认是{{mgs}}  delimiters: ['${', '}']之后变成这样 ${mgs}
    delimiters = options.delimiters;

    // 是用来修正当前正在解析元素的父级
    var stack = [];
    // 判断是否保留元素之间的空白
    var preserveWhitespace = options.preserveWhitespace !== false;
    // 空白处理策略，`'preserve' | 'condense'` 
    var whitespaceOption = options.whitespace; 
    var root;  // 定义AST模型对象
    var currentParent; // 当前父节点，描述对象之间的父子关系
    var inVPre = false; // 标识当前解析的标签是否在拥有 v-pre 的标签之内
    var inPre = false; // 标识当前正在解析的标签是否在 <pre></pre> 标签之内
    var warned = false; // 标识只会打印一次警告信息，默认为 false

    /**
     * 警告日志函数
     * @param {警告信息} msg 
     * @param {范围} range 
     */
    function warnOnce (msg, range) {
      if (!warned) {
        warned = true;
        warn$2(msg, range);
      }
    }

    /**
     * 关闭节点
     * @param {*} element 
     */
    function closeElement (element) {
      trimEndingWhitespace(element);
      // 元素不再 v-pre 中并且没有被处理过
      if (!inVPre && !element.processed) {
        // 解析 ast树
        element = processElement(element, options);
      }
      // tree management
      if (!stack.length && element !== root) {
        // allow root elements with v-if, v-else-if and v-else
        if (root.if && (element.elseif || element.else)) {
          {
            // 检查当前元素是否符合作为根元素的要求
            checkRootConstraints(element);
          }
          // 将条件对象添加到 root.ifConditions 属性的数组中，此处针对 v-else-if and v-else
          addIfCondition(root, {
            exp: element.elseif,
            block: element
          });
        } else {
          warnOnce(
            "Component template should contain exactly one root element. " +
            "If you are using v-if on multiple elements, " +
            "use v-else-if to chain them instead.",
            { start: element.start }
          );
        }
      }
      // 当前元素存在父级(`currentParent`)，并且当前元素不是被禁止的元素
      if (currentParent && !element.forbidden) {
        // 如果有elseif或者else属性的时候
        if (element.elseif || element.else) {
          // 找到上一个兄弟节点，如果上一个兄弟节点是if，则下一个兄弟节点则是elseif或else
          processIfConditions(element, currentParent);
        } else {
          // scoped slot 作用域的槽存在
          if (element.slotScope) {
            // scoped slot
            // keep it in the children list so that v-else(-if) conditions can
            // find it as the prev node.
            // 获取slotTarget作用域标签，如果获取不到则定义为default
            var name = element.slotTarget || '"default"'
            ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
          }
          // 把当前元素描述对象添加到父级元素描述对象(currentParent)的 children 数组中
          currentParent.children.push(element);
          // 当前元素对象的 parent 属性指向父级元素对象
          element.parent = currentParent;
        }
      }

      // final children cleanup
      // filter out scoped slots
      // 过滤掉作用域插槽
      element.children = element.children.filter(function (c) { return !(c).slotScope; });
      // remove trailing whitespace node again
      // 删除尾部空白节点
      trimEndingWhitespace(element);

      // check pre state
      // 如果标签有pre属性，inVPre设置为false
      if (element.pre) {
        inVPre = false;
      }
      // 判断标签是否是pre 如果是则返回真
      if (platformIsPreTag(element.tag)) {
        inPre = false;
      }
      // apply post-transforms
      for (var i = 0; i < postTransforms.length; i++) {
        postTransforms[i](element, options);
      }
    }

    /**
     * 删除尾部空白节点
     * 例如：<div><input type="text" v-model="val"> </div>
     * @param {vnode} el 
     */
    function trimEndingWhitespace (el) {
      // remove trailing whitespace node
      if (!inPre) {
        var lastNode;
        while (
          // 循环children，删除尾部空白节点
          (lastNode = el.children[el.children.length - 1]) && // children存在
          lastNode.type === 3 && // 节点类型为文本
          lastNode.text === ' ' // 节点内容为空字符
        ) {
          // 从children的数组尾部删除
          el.children.pop();
        }
      }
    }

    /**
     * 校验根节点
     * @param {vnode} el 
     */
    function checkRootConstraints (el) {
      if (el.tag === 'slot' || el.tag === 'template') { // 根节点不能为 slot 或 template 标签
        warnOnce(
          "Cannot use <" + (el.tag) + "> as component root element because it may " +
          'contain multiple nodes.',
          { start: el.start }
        );
      }
      if (el.attrsMap.hasOwnProperty('v-for')) { // 根节点不能有 v-for 指令
        warnOnce(
          'Cannot use v-for on stateful component root element because ' +
          'it renders multiple elements.',
          el.rawAttrsMap['v-for']
        );
      }
    }

    // 主要的解析方法
    parseHTML(template, /* 字符串模板 */ {
      warn: warn$2, // 警告日志函数
      expectHTML: options.expectHTML, // 标志是html,是true
      // 匹配标签是否是 'area,base,br,col,embed,frame,hr,img,input,isindex,keygen, link,meta,param,source,track,wbr'
      isUnaryTag: options.isUnaryTag,
      // 判断标签是否是 'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
      canBeLeftOpenTag: options.canBeLeftOpenTag,
      // IE在属性值中编码换行，而其他浏览器则不会
      shouldDecodeNewlines: options.shouldDecodeNewlines,
      // true chrome在a[href]中编码内容
      shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
      // 当设为 true 时，将会保留且渲染模板中的 HTML 注释。默认行为是舍弃它们
      shouldKeepComment: options.comments,
      outputSourceRange: options.outputSourceRange,
      /**
       * 标签开始函数， 
       * 创建一个ast标签dom，判断获取v-for属性是否存在如果有则转义 v-for指令把for，alias，iterator1，iterator2属性添加到虚拟dom中
       * 获取v-if属性，为el虚拟dom添加 v-if，v-eles，v-else-if 属性
       * 获取v-once 指令属性，如果有有该属性为虚拟dom标签标记事件只触发一次则销毁
       * 校验属性的值，为el添加muted， events，nativeEvents，directives，  key， ref，slotName或者slotScope或者slot，component或者inlineTemplate 属性
       * 标志当前的currentParent当前的 element
       * 为parse函数 stack标签堆栈 添加一个标签
       * @param {标签名称} tag 
       * @param {标签属性} attrs 
       * @param {标签是否是一元标签，如果不是则为真} unary 
       * @param {开始} start 
       * @param {结束} end 
       */
      start: function start (tag, attrs, unary, start$1, end) {
        // check namespace.
        // inherit parent ns if there is one
        // 检查名称空间，如果有，继承父ns
        var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag); // 判断 tag 是否是svg或者math 标签

        // handle IE svg bug
        /* istanbul ignore if */
        if (isIE && ns === 'svg') { // 如果是ie浏览器 并且是svg
          // 防止ie浏览器 svg 的 bug 替换属性含有NS+数字 去除 NS+数字
          attrs = guardIESVGBug(attrs);
        }

        // 创建一个ast标签dom
        var element = createASTElement(tag, attrs, currentParent);
        if (ns) { // 判断 tag 是否是svg或者math 标签
          element.ns = ns;
        }

        {
          if (options.outputSourceRange) { // 生产环境还是开发环境，开发环境为true
            element.start = start$1;
            element.end = end;
            // 将attrsList数组，转换成key为属性名，值为数组项的对象，例如
            /*
            "attrsList":[
              {
                "name":"v-for",
                "value":"(l, i) in list",
                "start":71,
                "end":93
              },{
                "name":":key",
                "value":"i",
                "start":94,
                "end":102
              },{
                "name":"@click",
                "value":"clickItem(index)",
                "start":103,
                "end":128
              }
            ]
            转换为：
            {
              :key: {name: ":key", value: "i", start: 94, end: 102},
              @click: {name: "@click", value: "clickItem(index)", start: 103, end: 128},
              v-for: {name: "v-for", value: "(l, i) in list", start: 71, end: 93}
            }
            */
            element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
              cumulated[attr.name] = attr;
              return cumulated
            }, {});
          }
          attrs.forEach(function (attr) {
            if (invalidAttributeRE.test(attr.name)) {
              warn$2(
                "Invalid dynamic argument expression: attribute names cannot contain " +
                "spaces, quotes, <, >, / or =.",
                {
                  start: attr.start + attr.name.indexOf("["),
                  end: attr.start + attr.name.length
                }
              );
            }
          });
        }

        // isForbiddenTag：如果是style或者是是script 标签并且type属性不存在或者存在并且是javascript属性的时候返回真
        // isServerRendering：不是在服务器node环境下
        if (isForbiddenTag(element) && !isServerRendering()) {
          element.forbidden = true;
           warn$2(
            'Templates should only be responsible for mapping the state to the ' +
            'UI. Avoid placing tags with side-effects in your templates, such as ' +
            "<" + tag + ">" + ', as they will not be parsed.',
            { start: element.start }
          );
        }

        // apply pre-transforms
        for (var i = 0; i < preTransforms.length; i++) {
          // preTransformNode把attrsMap与attrsList属性值转换添加到el   
          // ast虚拟dom中为虚拟dom添加for，alias，iterator1，iterator2， addRawAttr ，type ，key， ref，slotName或者slotScope或者slot，component或者inlineTemplate ， plain，if ，else，elseif 属性
          element = preTransforms[i](element, options) || element;
        }

        // 如果标签没有 v-pre 指令
        if (!inVPre) {
          // 检查标签是否有v-pre 指令，含有 v-pre 指令的标签里面的指令则不会被编译
          processPre(element);
          if (element.pre) { // 标签是否含有 v-pre 指令
            inVPre = true; // 如果标签有v-pre 指令，则标记为true
          }
        }
        // 判断标签是否是pre 如果是则返回真
        if (platformIsPreTag(element.tag)) {
          inPre = true;
        }
        // v-pre 指令存在
        if (inVPre) {
          // 浅拷贝属性把虚拟dom的attrsList拷贝到attrs中,如果没有pre块，标记plain为true
          processRawAttrs(element);
        } else if (!element.processed) {
          // structural directives
          // 判断获取v-for属性是否存在如果有则转义 v-for指令，把for，alias，iterator1，iterator2属性添加到虚拟dom中
          processFor(element);
          // 获取v-if属性，为el虚拟dom添加 v-if，v-eles，v-else-if 属性
          processIf(element);
          // 获取v-once 指令属性，如果有有该属性，为虚拟dom标记事件只触发一次则销毁
          processOnce(element);
        }

        // 根节点不存在
        if (!root) {
          root = element;
          {
            checkRootConstraints(root);
          }
        }

        if (!unary) {
          currentParent = element;
          // 为parse函数，stack标签堆栈添加一个标签
          stack.push(element);
        } else {
          // 关闭节点
          closeElement(element);
        }
      },

      /**
       * 为标签元素对象做闭环处理，
       * 从stack中删除AST模型对象，
       * 更新当前的parent对象等
       * @param {标签名称} tag 
       * @param {开始} start 
       * @param {结束} end 
       */
      end: function end (tag, start, end$1) {
        // 读取 stack 栈中的最后一个元素
        var element = stack[stack.length - 1];
        // pop stack
        // 节点出栈
        stack.length -= 1;
        // 读取出栈后 stack 栈中的最后一个元素
        currentParent = stack[stack.length - 1];
        if ( options.outputSourceRange) {
          // 设置 end 位置
          element.end = end$1;
        }
        // 关闭
        closeElement(element);
      },

      /**
       * 字符处理
       * @param {文本} text 
       * @param {开始} start 
       * @param {结束} end 
       */
      chars: function chars (text, start, end) {
        // 判断是否有当前的父节点
        if (!currentParent) {
          {
            if (text === template) {
              warnOnce(
                'Component template requires a root element, rather than just text.',
                { start: start }
              );
            } else if ((text = text.trim())) {
              warnOnce(
                ("text \"" + text + "\" outside root element will be ignored."),
                { start: start }
              );
            }
          }
          return
        }
        // IE textarea placeholder bug
        /* istanbul ignore if */
        if (isIE && // 如果是ie
          currentParent.tag === 'textarea' && // 如果父节点是textarea
          currentParent.attrsMap.placeholder === text // 如果他的html5 用户信息提示和当前的文本一样
        ) {
          return
        }
        // 获取到同级的兄弟节点
        var children = currentParent.children;
        // 判断标签是否是pre 如果是则返回真，则不需要去空格
        if (inPre || text.trim()) {
          // isTextTag：判断标签是否是script或者是style
          // decodeHTMLCached：获取真是dom的textContent文本
          text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
        } else if (!children.length) {
          // remove the whitespace-only node right after an opening tag
          text = '';
        } else if (whitespaceOption) { // 空白符处理策略
          if (whitespaceOption === 'condense') {
            // in condense mode, remove the whitespace node if it contains
            // line break, otherwise condense to a single space
            // lineBreakRE匹配换行符或回车符
            text = lineBreakRE.test(text) ? '' : ' ';
          } else {
            text = ' ';
          }
        } else {
          // preserveWhitespace是否保留空白符
          text = preserveWhitespace ? ' ' : '';
        }
        if (text) {
          if (!inPre && whitespaceOption === 'condense') {
            // condense consecutive whitespaces into single space
            // 将连续空白压缩为单个空格
            text = text.replace(whitespaceRE$1, ' ');
          }
          var res;
          var child;
          // 包含表达式的text
          if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text
            };
          // 纯文本的text
          } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
            child = {
              type: 3,
              text: text
            };
          }
          if (child) {
            if ( options.outputSourceRange) {
              child.start = start;
              child.end = end;
            }
            children.push(child);
          }
        }
      },
      /**
       * 把text添加到属性节点或者添加到注释节点，ast模板数据
       * @param {文本} text 
       * @param {开始} start 
       * @param {结束} end 
       */
      comment: function comment (text, start, end) {
        // adding anyting as a sibling to the root node is forbidden
        // comments should still be allowed, but ignored
        if (currentParent) {
          var child = {
            type: 3,
            text: text,
            isComment: true
          };
          if ( options.outputSourceRange) {
            child.start = start;
            child.end = end;
          }
          currentParent.children.push(child);
        }
      }
    });
    // 返回AST
    return root
  }

  /**
   * 获取给定元素 v-pre 属性的值，如果 v-pre 属性的值不等于 null 则会在元素描述对象上添加 .pre 属性，并将其值设置为 true
   * @param {元素AST树} el 
   */
  function processPre (el) {
    if (getAndRemoveAttr(el, 'v-pre') != null) {
      el.pre = true;
    }
  }

  /**
   * 在元素的描述对象上添加 element.attrs 属性
   * @param {元素AST树} el 
   */
  function processRawAttrs (el) {
    var list = el.attrsList;
    var len = list.length;
    if (len) {
      var attrs = el.attrs = new Array(len);
      for (var i = 0; i < len; i++) {
        attrs[i] = {
          name: list[i].name,
          value: JSON.stringify(list[i].value)
        };
        if (list[i].start != null) {
          attrs[i].start = list[i].start;
          attrs[i].end = list[i].end;
        }
      }
    } else if (!el.pre) {
      // non root node in pre blocks with no attributes
      // 如果一个标签没有任何属性，并且该标签是使用了 v-pre 指令标签的子代标签，那么该标签的元素描述对象将被添加 element.plain 属性，并且其值为 true
      el.plain = true;
    }
  }

  /**
   * 解析 ast树
   * 为el添加 muted，events，nativeEvents，directives，key，ref，slotName
   * 或者slotScope或者slot，component或者inlineTemplate 标志属性
   * @param {元素AST树} element 
   * @param {配置项} options 
   */
  function processElement (
    element,
    options
  ) {
    // 获取属性key值，校验key 是否放在template 标签上面,为el 虚拟dom添加 key属性
    processKey(element);

    // determine whether this is a plain element after
    // removing structural attributes
    // 确定这是否是一个普通元素
    // 删除结构属性
    element.plain = (
      !element.key && //如果没有key 
      !element.scopedSlots && //也没有作用域插槽
      !element.attrsList.length // 也没有属性
    );

    // 获取属性ref值，并且判断ref 是否含有v-for指令,为el 虚拟dom添加 ref属性
    processRef(element);
    // 
    processSlotContent(element);
    // 检查插槽作用域，为el虚拟dom添加 slotName或者slotScope或者slot
    processSlotOutlet(element);
    // 判断虚拟dom 是否有 :is属性，是否有inline-template 内联模板属性,如果有则标记下,为el 虚拟dom 添加component属性或者inlineTemplate 标志
    processComponent(element);
    // 转换数据
    for (var i = 0; i < transforms.length; i++) {
      element = transforms[i](element, options) || element;
    }
    // 检查属性，为虚拟dom属性转换成对应需要的虚拟dom vonde数据,为el虚拟dom 添加muted， events，nativeEvents，directives
    processAttrs(element);
    return element
  }

  /**
   * 解析key
   * 获取属性key值，校验key 是否放在template 标签上面,为el 虚拟dom添加 key属性
   * @param {元素AST树} el 
   */
  function processKey (el) {
    // 从元素描述对象的 attrsList 数组中获取到属性名字为 key 的属性值，并将值赋值给 exp 常量
    var exp = getBindingAttr(el, 'key');
    if (exp) {
      {
        if (el.tag === 'template') {
          warn$2(
            "<template> cannot be keyed. Place the key on real elements instead.",
            getRawBindingAttr(el, 'key')
          );
        }
        if (el.for) {
          var iterator = el.iterator2 || el.iterator1;
          var parent = el.parent;
          if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
            warn$2(
              "Do not use v-for index as key on <transition-group> children, " +
              "this is the same as not using keys.",
              getRawBindingAttr(el, 'key'),
              true /* tip */
            );
          }
        }
      }
      el.key = exp;
    }
  }

  /**
   * 处理el中ref属性
   * 获取属性ref值，并且判断 ref 否存在于 v-for 指令之内,为 el 虚拟dom添加 ref 和 refInFor 属性
   * @param {元素AST树} el 
   */
  function processRef (el) {
    // 校验ref，并获取ref属性
    var ref = getBindingAttr(el, 'ref');
    if (ref) {
      el.ref = ref; // 保存到el.ref里面
      // 检查是否在v-for循环内，将结果保存到el.refInfor里面
      el.refInFor = checkInFor(el);
    }
  }

  /**
   * 处理el中v-for
   * 例如 exp 为：(l, i) in list
   * @param {元素AST树} el 
   */
  function processFor (el) {
    var exp;
    // getAndRemoveAttr 移除name为v-for的属性，并且返回获取到v-for属性的值，例如 v-for="(l, i) in list" 获取到的exp 为 (l, i) in list
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
      // 对 v-for 属性的值做解析
      // res = {alias: "l", for: "list", iterator1: "i"}
      var res = parseFor(exp);
      if (res) {
        // 将 res 常量中的属性混入当前元素的描述对象中
        extend(el, res);
      } else {
        warn$2(
          ("Invalid v-for expression: " + exp),
          el.rawAttrsMap['v-for']
        );
      }
    }
  }



  /**
   * 解析v-for
   * 例如 exp 为：(l, k, i) in list
   * @param {*} exp 
   */
  function parseFor (exp) {
    // 捕获的字符串数组为：["(l, k, i) in list", "(l, k, i)", "list"]
    var inMatch = exp.match(forAliasRE);
    // 没有捕获到直接返回undefined
    if (!inMatch) { return }
    var res = {};
    // res.for = 'list'
    res.for = inMatch[2].trim();
    // alias = 'l, k, i'
    var alias = inMatch[1].trim().replace(stripParensRE, '');
    // iteratorMatch = [',k,i', 'k', 'i']
    var iteratorMatch = alias.match(forIteratorRE);
    if (iteratorMatch) {
      // res.alias = 'l'
      res.alias = alias.replace(forIteratorRE, '').trim();
      // res.iterator1 = 'k'
      res.iterator1 = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        // res.iterator2 = 'i'
        res.iterator2 = iteratorMatch[2].trim();
      }
    } else {
      // res.alias = 'l'
      res.alias = alias;
    }
    return res
  }

  /**
   * 处理el中v-if v-else v-else-if
   * @param {*} el 
   */
  function processIf (el) {
    // getAndRemoveAttr 移除name为v-if的属性，并且返回获取到v-if属性的值，例如 v-if="child === 1" 获取到的exp 为 child === 1
    var exp = getAndRemoveAttr(el, 'v-if');
    if (exp) {
      // 在元素描述对象上定义了 el.if 属性，并且该属性的值就是 v-if 指令的属性值
      el.if = exp;
      // 将条件对象添加到 el.ifConditions 属性的数组中，此处针对 v-if
      addIfCondition(el, {
        exp: exp,
        block: el
      });
    } else {
      // 移除name为v-else的属性，并且返回空字符串即''
      if (getAndRemoveAttr(el, 'v-else') != null) {
        // 在元素描述对象上定义了 el.else 属性，并且该属性的值就是 true
        el.else = true;
      }
      // 移除name为v-else-if的属性，并且返回获取到v-else-if属性的值，例如 v-else-if="child === 2" 获取到的exp 为 child === 2
      var elseif = getAndRemoveAttr(el, 'v-else-if');
      if (elseif) {
        // 在元素描述对象上定义了 el.elseif 属性，并且该属性的值就是 v-elseif 指令的属性值
        el.elseif = elseif;
      }
    }
  }

  /**
   * 处理if条件
   * @param {*} el 
   * @param {*} parent 
   */
  function processIfConditions (el, parent) {
    var prev = findPrevElement(parent.children);
    if (prev && prev.if) {
      // 将条件对象添加到 root.ifConditions 属性的数组中，此处针对 v-else-if and v-else
      addIfCondition(prev, {
        exp: el.elseif,
        block: el
      });
    } else {
      warn$2(
        "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
        "used on element <" + (el.tag) + "> without corresponding v-if.",
        el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
      );
    }
  }

  /**
   * 找到当前元素的前一个元素描述对象
   * @param {当前元素} children 
   */
  function findPrevElement (children) {
    // 获取children的长度
    var i = children.length;
    // 循环查找最后一个元素
    while (i--) {
      // 找到最后一个元素，并返回
      if (children[i].type === 1) {
        return children[i]
      } else {
        // 如果是非元素节点并且内容不为空，在开发环境报警告
        if ( children[i].text !== ' ') {
          warn$2(
            "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
            "will be ignored.",
            children[i]
          );
        }
        // 移除children数组的最后一个元素
        children.pop();
      }
    }
  }

  /**
   * v-if的条件数组添加
   * @param {*} el 
   * @param {*} condition 
   */
  function addIfCondition (el, condition) {
    if (!el.ifConditions) {
      // 在元素描述对象上定义了 el.ifConditions 属性
      el.ifConditions = [];
    }
    // 将条件对象添加到 el.ifConditions 属性的数组中
    el.ifConditions.push(condition);
  }

  /**
   * 解析v-once
   * @param {*} el 
   */
  function processOnce (el) {
    // 移除name为v-once的属性，并且返回空字符串即''
    var once = getAndRemoveAttr(el, 'v-once');
    if (once != null) {
      // 在元素描述对象上定义了 el.once 属性，并且该属性的值就是 true
      el.once = true;
    }
  }

  // handle content being passed to a component as slot,
  // e.g. <template slot="xxx">, <div slot-scope="xxx">
  /**
   * 解析slot
   * @param {*} el 
   */
  function processSlotContent (el) {
    var slotScope;
    if (el.tag === 'template') {
      // 移除 element.attrsList 对象中 name 为 scope 的属性，并且返回获取到 scope 属性的值赋值给变量 slotScope
      slotScope = getAndRemoveAttr(el, 'scope');
      /* istanbul ignore if */
      if ( slotScope) {
        warn$2(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
          "can also be used on plain elements in addition to <template> to " +
          "denote scoped slots.",
          el.rawAttrsMap['scope'],
          true
        );
      }
      // 在元素描述对象上添加了 el.slotScope 属性
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) { // 移除 element.attrsList 对象中 name 为 slot-scope 的属性，并且返回获取到 slot-scope 属性的值赋值给变量 slotScope
      /* istanbul ignore if */
      if ( el.attrsMap['v-for']) {
        warn$2(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
          "(v-for takes higher priority). Use a wrapper <template> for the " +
          "scoped slot to make it clearer.",
          el.rawAttrsMap['slot-scope'],
          true
        );
      }
       // 在元素描述对象上添加了 el.slotScope 属性
      el.slotScope = slotScope;
    }

    // slot="xxx"
    // 获取元素 slot 属性的值，并将获取到的值赋值给 slotTarget 常量，注意这里使用的是 getBindingAttr 函数，这意味着 slot 属性是可以绑定的
    var slotTarget = getBindingAttr(el, 'slot');
    if (slotTarget) {
      // 将 slotTarget 变量的值赋值给 el.slotTarget 属性
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      // 在元素描述对象上添加了 el.slotTargetDynamic 属性
      el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope) {
        // 用来保存原生影子DOM (shadow DOM)的 slot 属性
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
      }
    }

    // 2.6 v-slot syntax
    // 判断系统配置是否支持新插槽语法
    {
      if (el.tag === 'template') {
        // v-slot on <template>
        // 获取v-slot 或者 v-slot:xxx 或 '#xxx' 的值，例如 v-slot:todo="todo" ，
        // attrsList为 attrsList: [{name: "v-slot:todo", value: "todo", start: 76, end: 87}]，
        // 匹配获取到 slotBinding 为 {name: "v-slot:todo", value: "todo", start: 76, end: 87}
        var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding) {
          {
            // el.slotScope 或 el.slotTarget 存在，说明使用了 slot 或 slot-scope
            if (el.slotTarget || el.slotScope) {
              // 新旧语法不能混合使用
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            // 获取标签的父级标签，如果父级标签不是组件或者template标签，报警告：只能出现在组件的根级别
            if (el.parent && !maybeComponent(el.parent)) {
              warn$2(
                "<template v-slot> can only appear at the root level inside " +
                "the receiving component",
                el
              );
            }
          }
          // 获取到name, dynamic
          var ref = getSlotName(slotBinding);
          var name = ref.name;
          var dynamic = ref.dynamic;
          // 在元素描述对象上添加了 el.slotTarget 属性
          el.slotTarget = name;
          // 在元素描述对象上添加了 el.slotTargetDynamic 属性
          el.slotTargetDynamic = dynamic;
          // 在元素描述对象上添加了 el.slotScope 属性
          el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
        }
      } else {
        // v-slot on component, denotes default slot
        // 匹配v-slot 或者 v-slot:xxx 或 '#xxx' 的值并获取到attrsList为对应的对象
        var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding$1) {
          {
            // 不是组件或template标签
            if (!maybeComponent(el)) {
              warn$2(
                "v-slot can only be used on components or <template>.",
                slotBinding$1
              );
            }
            // el.slotScope 或 el.slotTarget 存在
            if (el.slotScope || el.slotTarget) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            // el.scopedSlots 存在
            if (el.scopedSlots) {
              warn$2(
                "To avoid scope ambiguity, the default slot should also use " +
                "<template> syntax when there are other named slots.",
                slotBinding$1
              );
            }
          }
          // add the component's children to its default slot
          // 获取当前组件的 scopedSlots
          var slots = el.scopedSlots || (el.scopedSlots = {});
          // 获取到name, dynamic
          var ref$1 = getSlotName(slotBinding$1);
          var name$1 = ref$1.name;
          var dynamic$1 = ref$1.dynamic;
          // 获取 slots 中 key 对应匹配出来 name 的 slot
          // 然后再其下面创建一个标签名为 template 的 ASTElement，attrs 为空数组，parent 为当前节点
          var slotContainer = slots[name$1] = createASTElement('template', [], el);
          // 这里 name、dynamic 统一赋值给 slotContainer 的 slotTarget、slotTargetDynamic，而不是 el
          slotContainer.slotTarget = name$1;
          slotContainer.slotTargetDynamic = dynamic$1;
          // 将当前节点的 children 添加到 slotContainer 的 children 属性中
          slotContainer.children = el.children.filter(function (c) {
            if (!c.slotScope) {
              c.parent = slotContainer;
              return true
            }
          });
          slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
          // remove children as they are returned from scopedSlots now
          // 清空当前节点的 children
          el.children = [];
          // mark el non-plain so data gets generated
          el.plain = false;
        }
      }
    }
  }

  /**
   * 获取 slotName
   * @param {属性，例如{name: "v-slot:todo", value: "todo", start: 76, end: 87}} binding 
   */
  function getSlotName (binding) {
    // 者匹配 'v-slot:todo'、':todo'、'#todo'，
    var name = binding.name.replace(slotRE, '');
    if (!name) {
      // 获取binding.name并判断第一个字符是否为#
      if (binding.name[0] !== '#') {
        name = 'default'; // 赋值默认名
      } else {
        // 简写形式下，如果没有名称，则报警告
        warn$2(
          "v-slot shorthand syntax requires a slot name.",
          binding
        );
      }
    }
    // 返回一个 key 包含 name，dynamic 的对象
    // 'v-slot:[todo]' 匹配然后获取到 name = '[todo]'，在通过name.slice(1, -1获取到todo
    // 进而进行动态参数进行匹配 dynamicArgRE.test(name) 结果为 true
    return dynamicArgRE.test(name)
      // dynamic [name]
      ? { name: name.slice(1, -1), dynamic: true }
      // static name
      : { name: ("\"" + name + "\""), dynamic: false }
  }

  // handle <slot/> outlets
  function processSlotOutlet (el) {
    if (el.tag === 'slot') {
      el.slotName = getBindingAttr(el, 'name');
      if ( el.key) {
        warn$2(
          "`key` does not work on <slot> because slots are abstract outlets " +
          "and can possibly expand into multiple elements. " +
          "Use the key on a wrapping element instead.",
          getRawBindingAttr(el, 'key')
        );
      }
    }
  }

  /**
   * 处理is特性
   * @param {*} el 
   */
  function processComponent (el) {
    var binding;
    if ((binding = getBindingAttr(el, 'is'))) {
      el.component = binding;
    }
    if (getAndRemoveAttr(el, 'inline-template') != null) {
      el.inlineTemplate = true;
    }
  }

  /**
   * 处理attrs属性
   * @param {*} el 
   */
  function processAttrs (el) {
    // 获取attrsList的索引
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for (i = 0, l = list.length; i < l; i++) {
      // 例如 {"name":"v-bind:prop1.prop","value":"prop1","start":39,"end":59}
      name = rawName = list[i].name;
      value = list[i].value;
      if (dirRE.test(name)) {
        // mark element as dynamic
        el.hasBindings = true;
        // modifiers
        // parseModifiers('bind:prop1.prop') ===> {prop: true}
        modifiers = parseModifiers(name.replace(dirRE, ''));
        // support .foo shorthand syntax for the .prop modifier
        // propBindRE 检测一个(v-bind)指令是否绑定修饰符(.prop)
        if (modifiers) {
          name = name.replace(modifierRE, '');
        }
        // 解析 v-bind 指令，例如：v-bind:prop1
        if (bindRE.test(name)) { // v-bind
          // 替换掉 v-bind: 或 : 或 .，得到的name，例如prop1
          name = name.replace(bindRE, '');
          // 解析过滤器
          value = parseFilters(value);
          // 判断是否为动态属性
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            // 去掉动态属性的[]括号
            name = name.slice(1, -1);
          }
          if (
            
            value.trim().length === 0
          ) {
            warn$2(
              ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
            );
          }
          if (modifiers) {
            if (modifiers.prop && !isDynamic) { // 处理修饰符prop
              // 将绑定的属性驼峰化,例如 prop-data ===> propData
              name = camelize(name);
              if (name === 'innerHtml') { name = 'innerHTML'; }
            }
            if (modifiers.camel && !isDynamic) {// 处理修饰符camel
              // 将绑定的属性驼峰化
              name = camelize(name);
            }
            if (modifiers.sync) { // 处理修饰符sync
              // 例如v-bind:prop1.sync='prop1'，此时value为prop1，所以获取到的值为 prop1=$event
              syncGen = genAssignmentCode(value, "$event");
              if (!isDynamic) {
                addHandler(
                  el,
                  ("update:" + (camelize(name))),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i]
                );
                // hyphenate 用连接符 - 替换驼峰命名，当name 为形如 `xx-xx`下面条件成立
                if (hyphenate(name) !== camelize(name)) {
                  addHandler(
                    el,
                    ("update:" + (hyphenate(name))),
                    syncGen,
                    null,
                    false,
                    warn$2,
                    list[i]
                  );
                }
              } else {
                // handler w/ dynamic event name
                addHandler(
                  el,
                  ("\"update:\"+(" + name + ")"),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i],
                  true // dynamic
                );
              }
            }
          }
          if ((modifiers && modifiers.prop) || (
            !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
          )) {
            // 添加属性到el.props
            addProp(el, name, value, list[i], isDynamic);
          } else {
            // 添加属性到el.attrs
            addAttr(el, name, value, list[i], isDynamic);
          }
        } else if (onRE.test(name)) { // v-on, 解析 v-on 指令
           // 替换掉 v-on: 或 @，得到的name，例如click
          name = name.replace(onRE, '');
          // 判断是否为动态属性
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            // 去掉动态属性的[]括号
            name = name.slice(1, -1);
          }
          // 在当前元素描述对象上添加事件侦听器，实际上就是将事件名称与该事件的侦听函数添加到元素描述对象的 el.events 属性或 el.nativeEvents 属性中
          addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
        } else { // normal directives, 对于其他指令的解析
          // 使用字符串的 `replace` 方法配合 `dirRE` 正则去掉属性名称中的 `'v-'` 或 `':'` 或 `'@'` 或 `'#'` 等字符
          name = name.replace(dirRE, '');
          // parse arg
          // 匹配参数,例如v-custom:arg，获取到的 argMatch = [':arg', 'arg']
          var argMatch = name.match(argRE);
          // 获取参数arg = 'arg'
          var arg = argMatch && argMatch[1];
          isDynamic = false;
          if (arg) {
            // 截取参数标示，如 :arg 
            name = name.slice(0, -(arg.length + 1));
            if (dynamicArgRE.test(arg)) {
              // 截取[]
              arg = arg.slice(1, -1);
              isDynamic = true;
            }
          }
          // 在元素描述对象上添加 `el.directives` 属性的
          addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
          if ( name === 'model') {
            // 检查v-model在for循环中的绑定的检查
            checkForAliasModel(el, value);
          }
        }
      } else {
        // literal attribute
        {
          // 判断该非指令属性的属性值是否使用了字面量表达式
          var res = parseText(value, delimiters);
          if (res) {
            // 报警告，用绑定的形式代替，例如
            // 用   <div :id="isTrue ? 'a' : 'b'"></div>
            // 代替 <div id="{{ isTrue ? 'a' : 'b' }}"></div>
            warn$2(
              name + "=\"" + value + "\": " +
              'Interpolation inside attributes has been removed. ' +
              'Use v-bind or the colon shorthand instead. For example, ' +
              'instead of <div id="{{ val }}">, use <div :id="val">.',
              list[i]
            );
          }
        }
        // 将属性与属性对应的字符串值添加到元素描述对象的 el.attrs 或 el.dynamicAttrs 数组中
        addAttr(el, name, JSON.stringify(value), list[i]);
        // #6887 firefox doesn't update muted state if set via attribute
        // even immediately after element creation
        if (!el.component &&
            name === 'muted' &&
            platformMustUseProp(el.tag, el.attrsMap.type, name)) {
          addProp(el, name, 'true', list[i]);
        }
      }
    }
  }

  /**
   * 检查是否在v-for中
   * 检查当前虚拟dom  vonde 是否有for指令，或者父组件是否有for指令
   * @param {*} el 
   */
  function checkInFor (el) {
    // 首先将el保存到parent里，这样v-for和ref就可以作用在同一个元素上
    var parent = el;
    // 通过检测parent的AST对象是否由for来判断
    while (parent) {
      if (parent.for !== undefined) {
        return true // 如果在v-for内则返回true
      }
      parent = parent.parent;
    }
    return false
  }

  /**
   * 解析指令中的修饰符
   * @param {指令字符串，例如: bind:prop1.prop} name 
   */
  function parseModifiers (name) {
    // modifierRE匹配修饰分，所以匹配到的结果为 ['.prop']
    var match = name.match(modifierRE);
    if (match) {
      var ret = {};
      // 遍历match数组，从修饰符的第一位开始截取到末尾即得到 'prop' ,然后以prop为key值添加到ret对象并赋值为true
      match.forEach(function (m) { ret[m.slice(1)] = true; });
      return ret
    }
  }

  /**
   * 将标签的属性数组转换成健值对
   * @param {标签拥有的属性数组} attrs 
   */
  function makeAttrsMap (attrs) {
    var map = {};
    for (var i = 0, l = attrs.length; i < l; i++) {
      if (
        
        map[attrs[i].name] && !isIE && !isEdge
      ) {
        warn$2('duplicate attribute: ' + attrs[i].name, attrs[i]);
      }
      map[attrs[i].name] = attrs[i].value;
    }
    return map
  }

  // for script (e.g. type="x/template") or style, do not decode content
  /**
   * 是否是text标签，即script,style标签，不会解析
   * @param {*} el 
   */
  function isTextTag (el) {
    return el.tag === 'script' || el.tag === 'style'
  }

  /**
   * 是否是禁止在模板中使用的标签
   * @param {*} el 
   */
  function isForbiddenTag (el) {
    return (
      el.tag === 'style' ||
      (el.tag === 'script' && (
        !el.attrsMap.type ||
        el.attrsMap.type === 'text/javascript'
      ))
    )
  }

  var ieNSBug = /^xmlns:NS\d+/;
  var ieNSPrefix = /^NS\d+:/;

  /* istanbul ignore next */
  /**
   * 修复ie svg的bug
   * @param {*} attrs 
   */
  function guardIESVGBug (attrs) {
    var res = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (!ieNSBug.test(attr.name)) {
        attr.name = attr.name.replace(ieNSPrefix, '');
        res.push(attr);
      }
    }
    return res
  }

  /**
   * 检查v-model在for循环中的绑定的检查
   * @param {*} el 
   * @param {*} value 
   */
  function checkForAliasModel (el, value) {
    var _el = el;
    while (_el) {
      if (_el.for && _el.alias === value) {
        warn$2(
          "<" + (el.tag) + " v-model=\"" + value + "\">: " +
          "You are binding v-model directly to a v-for iteration alias. " +
          "This will not be able to modify the v-for source array because " +
          "writing to the alias is like modifying a function local variable. " +
          "Consider using an array of objects and use v-model on an object property instead.",
          el.rawAttrsMap['v-model']
        );
      }
      _el = _el.parent;
    }
  }

  /*  */

  /**
   * 对元素描述对象做前置处理，预处理使用了 v-model 属性并且使用了绑定的 type 属性的 input 标签
   * @param {元素描述对象} el 
   * @param {编译器的选项} options 
   */
  function preTransformNode (el, options) {
    if (el.tag === 'input') {
      var map = el.attrsMap;
      // 判断标签没有使用 v-model 属性
      if (!map['v-model']) {
        return
      }

      var typeBinding;
      // 获取绑定的type属性
      // 例如：<input v-model="val" :type="inputType" />
      if (map[':type'] || map['v-bind:type']) {
        typeBinding = getBindingAttr(el, 'type');
      }
      // 标签没有使用非绑定的 type 属性，并且也没有使用 v-bind: 或 : 绑定 type 属性，并且开发者使用了 v-bind
      // 例如：<input v-model="val" v-bind="{ type: inputType }" />
      if (!map.type && !typeBinding && map['v-bind']) {
        typeBinding = "(" + (map['v-bind']) + ").type";
      }

      if (typeBinding) {
        // 例如：<input v-model="val" :type="inputType" v-if="display" />
        // ifCondition = 'display'
        // ifConditionExtra = '&&(display)'
        // hasElse = false
        // elseIfCondition = undefined
        var ifCondition = getAndRemoveAttr(el, 'v-if', true); 
        var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : ""; 
        var hasElse = getAndRemoveAttr(el, 'v-else', true) != null; 
        var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true); 
        // 1. checkbox
        // 克隆出一个原始标签的元素描述对象
        var branch0 = cloneASTElement(el);
        // process for on the main node
        processFor(branch0);
        // 将属性的名和值分别添加到元素描述对象的 el.attrsMap 对象以及 el.attrsList 数组中
        addRawAttr(branch0, 'type', 'checkbox');
        processElement(branch0, options);
        // 标识着当前元素描述对象已经被处理过了
        branch0.processed = true; // prevent it from double-processed
        // 元素描述对象添加了 `el.if` 属性，例如：(${inputType})==='checkbox'&&display
        branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
        // 标签的元素描述对象被添加到其自身的 el.ifConditions 数组中
        addIfCondition(branch0, {
          exp: branch0.if,
          block: branch0
        });
        // 2. add radio else-if condition
        var branch1 = cloneASTElement(el);
        // 移除 v-for指令，在上面已经通过 processFor 处理过了
        getAndRemoveAttr(branch1, 'v-for', true);
        addRawAttr(branch1, 'type', 'radio');
        processElement(branch1, options);
        addIfCondition(branch0, {
          exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
          block: branch1
        });
        // 3. other
        var branch2 = cloneASTElement(el);
        getAndRemoveAttr(branch2, 'v-for', true);
        addRawAttr(branch2, ':type', typeBinding);
        processElement(branch2, options);
        addIfCondition(branch0, {
          exp: ifCondition,
          block: branch2
        });

        if (hasElse) {
          branch0.else = true;
        } else if (elseIfCondition) {
          branch0.elseif = elseIfCondition;
        }

        return branch0
      }
    }
  }

  /**
   * 创建出一个元素描述对象
   * @param {元素描述对象} el 
   */
  function cloneASTElement (el) {
    // 创建出一个元素描述对象
    // 由于 el.attrsList 数组是引用类型，所以为了避免克隆的元素描述对象与原始描述对象互相干扰，所以需要使用数组的 slice 方法复刻出一个新的 el.attrList 数组
    return createASTElement(el.tag, el.attrsList.slice(), el.parent)
  }

  var model$1 = {
    preTransformNode: preTransformNode
  };

  var modules$1 = [
    klass$1,
    style$1,
    model$1
  ];

  /*  */

  function text (el, dir) {
    if (dir.value) {
      addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  /*  */

  function html (el, dir) {
    if (dir.value) {
      addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  var directives$1 = {
    model: model,
    text: text,
    html: html
  };

  /*  */

  var baseOptions = {
    expectHTML: true, // 标志是html
    modules: modules$1, // 为虚拟dom添加staticClass，classBinding，staticStyle，styleBinding，for，alias，iterator1，iterator2，addRawAttr ，type ，key， ref，slotName或者slotScope或者slot，component或者inlineTemplate ，plain，if ，else，elseif 属性
    directives: directives$1, // 为虚拟dom添加 model ,text ,html 方法
    isPreTag: isPreTag, // 通过给定的标签名字检查标签是否是 pre 标签
    isUnaryTag: isUnaryTag, // 检测给定的标签是否是一元标签
    mustUseProp: mustUseProp, // 检测一个属性在标签中是否要使用 props 进行绑定
    canBeLeftOpenTag: canBeLeftOpenTag, // 检测一个标签是否是那些虽然不是一元标签，但却可以自己补全并闭合的标签。比如 p 标签是一个双标签，你需要这样使用 <p>Some content</p>，但是你依然可以省略闭合标签，直接这样写：<p>Some content，且浏览器会自动补全
    isReservedTag: isReservedTag, // 检查给定的标签是否是保留的标签
    getTagNamespace: getTagNamespace, // 获取元素(标签)的命名空间
    staticKeys: genStaticKeys(modules$1) // 根据编译器选项的 modules 选项生成一个静态键字符串
  };

  /*  */

  var isStaticKey;
  var isPlatformReservedTag;

  var genStaticKeysCached = cached(genStaticKeys$1);

  /**
   * Goal of the optimizer: walk the generated template AST tree
   * and detect sub-trees that are purely static, i.e. parts of
   * the DOM that never needs to change.
   *
   * Once we detect these sub-trees, we can:
   *
   * 1. Hoist them into constants, so that we no longer need to
   *    create fresh nodes for them on each re-render;
   * 2. Completely skip them in the patching process.
   */
  /**
   * 优化ast树
   * @param {ast树} root 
   * @param {平台配置，baseOptions} options 
   */
  function optimize (root, options) {
    if (!root) { return }
    isStaticKey = genStaticKeysCached(options.staticKeys || '');
    isPlatformReservedTag = options.isReservedTag || no;
    // first pass: mark all non-static nodes.
    markStatic$1(root);
    // second pass: mark static roots.
    markStaticRoots(root, false);
  }

  /**
   * 
   * @param {*} keys 
   */
  function genStaticKeys$1 (keys) {
    return makeMap(
      'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
      (keys ? ',' + keys : '')
    )
  }

  /**
   * 标记静态节点
   * @param {AST节点} node 
   */
  function markStatic$1 (node) {
    // 1、标注节点的状态
    node.static = isStatic(node);
    // 2、对标签节点进行处理
    if (node.type === 1) { // 判断是否为普通元素
      // do not make component slot content static. this avoids
      // 1. components not able to mutate slot nodes
      // 2. static slot content fails for hot-reloading
      if (
        // 非平台保留标签(html,svg)
        !isPlatformReservedTag(node.tag) &&
        // 不是slot标签
        node.tag !== 'slot' &&
        // 不是一个内联模板容器
        node.attrsMap['inline-template'] == null
      ) {
        return
      }
      // 递归其子节点，标注状态
      for (var i = 0, l = node.children.length; i < l; i++) {
        var child = node.children[i];
        markStatic$1(child);
        // 子节点非静态，则该节点也标注非静态
        if (!child.static) {
          node.static = false;
        }
      }
      // 对ifConditions进行循环递归,类似递归其子节点，标注状态过程
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          // 获取 ifConditions 数组中每一项
          var block = node.ifConditions[i$1].block;
          markStatic$1(block);
          // 条件数组中有非静态，则该节点也标注非静态
          if (!block.static) {
            node.static = false;
          }
        }
      }
    }
  }

  /**
   * 静态根节点
   * @param {AST节点} node 
   * @param {是否在for循环中} isInFor 
   */
  function markStaticRoots (node, isInFor) {
    if (node.type === 1) {
      // 用以标记在v-for内的静态节点，此属性用以告诉renderStatic(_m)对这个节点生成新的key，避免patch error
      if (node.static || node.once) {
        node.staticInFor = isInFor;
      }
      // For a node to qualify as a static root, it should have children that
      // are not just static text. Otherwise the cost of hoisting out will
      // outweigh the benefits and it's better off to just always render it fresh.
      // 一个节点要成为根节点，那么要满足以下条件：
      // 1、静态节点，并且有子节点，
      // 2、子节点不能仅为一个文本节点
      if (node.static && node.children.length && !(
        node.children.length === 1 &&
        node.children[0].type === 3
      )) {
        node.staticRoot = true;
        return
      } else {
        node.staticRoot = false;
      }
      // 循环递归标记children
      if (node.children) {
        for (var i = 0, l = node.children.length; i < l; i++) {
          markStaticRoots(node.children[i], isInFor || !!node.for);
        }
      }
      // 循环递归标记ifConditions
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          markStaticRoots(node.ifConditions[i$1].block, isInFor);
        }
      }
    }
  }

  /**
   * 标注节点的状态
   * @param {节点ast树} node 
   */
  function isStatic (node) {
    // 表达式，标注非静态
    if (node.type === 2) { // expression
      return false
    }
    // 文本，标注静态
    if (node.type === 3) { // text
      return true
    }
    return !!(node.pre || ( // v-pre 指令
      // 无动态绑定
      !node.hasBindings && // no dynamic bindings
      // 没有 v-if 和 v-for
      !node.if && !node.for && // not v-if or v-for or v-else
      // 不是内置的标签，内置的标签有slot和componen
      !isBuiltInTag(node.tag) && // not a built-in
      // 是平台保留标签
      isPlatformReservedTag(node.tag) && // not a component
      // 不是 template 标签的直接子元素并且没有包含在 for 循环中
      !isDirectChildOfTemplateFor(node) &&
      // 节点包含的属性只能有isStaticKey中指定的几个
      Object.keys(node).every(isStaticKey)
    ))
  }

  /**
   * 判断是 template 标签的直接子元素并且有包含在 for 循环中
   * @param {节点ast树} node 
   */
  function isDirectChildOfTemplateFor (node) {
    while (node.parent) {
      // 缓存父节点
      node = node.parent;
      // 判断节点类型不是 template， 则返回false
      if (node.tag !== 'template') {
        return false
      }
      // 如果节点类型为template并存在 for 属性，则返回true
      if (node.for) {
        return true
      }
    }
    return false
  }

  /*  */

  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

  // KeyboardEvent.keyCode aliases
  var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
  };

  // KeyboardEvent.key aliases
  var keyNames = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
  };

  // #4868: modifiers that prevent the execution of the listener
  // need to explicitly return null so that we can determine whether to remove
  // the listener for .once
  var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

  var modifierCode = {
    stop: '$event.stopPropagation();',
    prevent: '$event.preventDefault();',
    self: genGuard("$event.target !== $event.currentTarget"),
    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),
    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
  };

  function genHandlers (
    events,
    isNative
  ) {
    var prefix = isNative ? 'nativeOn:' : 'on:';
    var staticHandlers = "";
    var dynamicHandlers = "";
    for (var name in events) {
      var handlerCode = genHandler(events[name]);
      if (events[name] && events[name].dynamic) {
        dynamicHandlers += name + "," + handlerCode + ",";
      } else {
        staticHandlers += "\"" + name + "\":" + handlerCode + ",";
      }
    }
    staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
    if (dynamicHandlers) {
      return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
    } else {
      return prefix + staticHandlers
    }
  }

  function genHandler (handler) {
    if (!handler) {
      return 'function(){}'
    }

    if (Array.isArray(handler)) {
      return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

    if (!handler.modifiers) {
      if (isMethodPath || isFunctionExpression) {
        return handler.value
      }
      return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else {
      var code = '';
      var genModifierCode = '';
      var keys = [];
      for (var key in handler.modifiers) {
        if (modifierCode[key]) {
          genModifierCode += modifierCode[key];
          // left/right
          if (keyCodes[key]) {
            keys.push(key);
          }
        } else if (key === 'exact') {
          var modifiers = (handler.modifiers);
          genModifierCode += genGuard(
            ['ctrl', 'shift', 'alt', 'meta']
              .filter(function (keyModifier) { return !modifiers[keyModifier]; })
              .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
              .join('||')
          );
        } else {
          keys.push(key);
        }
      }
      if (keys.length) {
        code += genKeyFilter(keys);
      }
      // Make sure modifiers like prevent and stop get executed after key filtering
      if (genModifierCode) {
        code += genModifierCode;
      }
      var handlerCode = isMethodPath
        ? ("return " + (handler.value) + "($event)")
        : isFunctionExpression
          ? ("return (" + (handler.value) + ")($event)")
          : isFunctionInvocation
            ? ("return " + (handler.value))
            : handler.value;
      return ("function($event){" + code + handlerCode + "}")
    }
  }

  function genKeyFilter (keys) {
    return (
      // make sure the key filters only apply to KeyboardEvents
      // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
      // key events that do not have keyCode property...
      "if(!$event.type.indexOf('key')&&" +
      (keys.map(genFilterCode).join('&&')) + ")return null;"
    )
  }

  function genFilterCode (key) {
    var keyVal = parseInt(key, 10);
    if (keyVal) {
      return ("$event.keyCode!==" + keyVal)
    }
    var keyCode = keyCodes[key];
    var keyName = keyNames[key];
    return (
      "_k($event.keyCode," +
      (JSON.stringify(key)) + "," +
      (JSON.stringify(keyCode)) + "," +
      "$event.key," +
      "" + (JSON.stringify(keyName)) +
      ")"
    )
  }

  /*  */

  function on (el, dir) {
    if ( dir.modifiers) {
      warn("v-on without argument does not support modifiers.");
    }
    el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
  }

  /*  */

  function bind$1 (el, dir) {
    el.wrapData = function (code) {
      return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
    };
  }

  /*  */

  var baseDirectives = {
    on: on,
    bind: bind$1,
    cloak: noop
  };

  /*  */





  var CodegenState = function CodegenState (options) {
    // 缓存实例化传递进来的 `options`
    this.options = options;
    // 用来打印警告信息的
    this.warn = options.warn || baseWarn;
    // 空数组
    this.transforms = pluckModuleFunction(options.modules, 'transformCode');
    // 对静态类和静态样式的处理
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    // 对指令的相关操作
    this.directives = extend(extend({}, baseDirectives), options.directives);
    // 保留标签标志
    var isReservedTag = options.isReservedTag || no;
    // 判断是组件
    this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    // 使用`v-once`的递增id
    this.onceId = 0;
    // 对静态根节点的处理
    this.staticRenderFns = [];
    // v-pre 标识
    this.pre = false;
  };



  /**
   * 生成代码
   * @param {ast树} ast 
   * @param {配置项} options 
   */
  function generate (
    ast,
    options
  ) {
    // 根据options创建CodegenState对象
    var state = new CodegenState(options);
    // 调用genElement将ast对象转换为字符串
    var code = ast ? genElement(ast, state) : '_c("div")';
    return {
      // 最外层用with(this)包裹
      render: ("with(this){return " + code + "}"),
      // 被标记为 staticRoot 节点的 VNode 就会单独生成 staticRenderFns
      staticRenderFns: state.staticRenderFns
    }
  }

  /**
   * 将ast对象转换为字符串
   * @param {ast树} el 
   * @param {CodegenState 实例} state 
   */
  function genElement (el, state) {
    if (el.parent) {
      el.pre = el.pre || el.parent.pre;
    }
    // 对一些标签属性的处理
    // 处理静态树节点
    if (el.staticRoot && !el.staticProcessed) {
      return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
      // 处理 v-once 节点
      return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
      // 处理 v-for 节点
      return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
      // 处理 v-if 节点
      return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
      // 处理 template 节点
      return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
      // 处理 slot 节点
      return genSlot(el, state)
    } else {
      // component or element
      // 处理组件 或 元素节点
      var code;
      if (el.component) {
        // 处理组件节点
        code = genComponent(el.component, el, state);
      } else {
        //核心的body部分
        var data;
        //  el.plain 表示标签没有属性(key,插槽，其他属性)值为 true
        if (!el.plain || (el.pre && state.maybeComponent(el))) {
          // 1、生成节点的数据对象data的字符串
          data = genData$2(el, state);
        }

        // 2、查找其子节点,生成子节点的字符串
        var children = el.inlineTemplate ? null : genChildren(el, state, true);
        // 3、将tag，data，children拼装成字符串
        code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
      }
      // module transforms
      // 循环执行 state.transforms 数组中的 transformCode 函数，此处 state.transforms 为空数组
      for (var i = 0; i < state.transforms.length; i++) {
        code = state.transforms[i](el, code);
      }
      return code
    }
  }

  // hoist static sub-trees out
  function genStatic (el, state) {
    el.staticProcessed = true;
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    var originalPreState = state.pre;
    if (el.pre) {
      state.pre = el.pre;
    }
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    state.pre = originalPreState;
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
  }

  // v-once
  function genOnce (el, state) {
    el.onceProcessed = true;
    if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.staticInFor) {
      var key = '';
      var parent = el.parent;
      while (parent) {
        if (parent.for) {
          key = parent.key;
          break
        }
        parent = parent.parent;
      }
      if (!key) {
         state.warn(
          "v-once can only be used inside v-for that is keyed. ",
          el.rawAttrsMap['v-once']
        );
        return genElement(el, state)
      }
      return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else {
      return genStatic(el, state)
    }
  }

  /**
   * 处理 v-if 节点
   * @param {AST树} el 
   * @param {CodegenState 实例} state 
   * @param {*} altGen 
   * @param {*} altEmpty 
   */
  function genIf (
    el,
    state,
    altGen,
    altEmpty
  ) {
    // 标识成已处理状态，避免递归
    el.ifProcessed = true; // avoid recursion
    // 调用 genIfConditions 进行处理
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
  }

  /**
   * 处理 v-if/v-else-if/v-else 指令
   * @param {el 虚拟dom} conditions 
   * @param {CodegenState 实例} state 
   * @param {*} altGen 
   * @param {*} altEmpty 
   */
  function genIfConditions (
    conditions,
    state,
    altGen,
    altEmpty
  ) {
    // 条件指令数组为空，返回一个创建空节点的函数的字符串
    if (!conditions.length) {
      return altEmpty || '_e()'
    }

    var condition = conditions.shift();
    // 判断 exp 属性是否存在，将调用 genIfConditions 进行递归生成二元表达式
    if (condition.exp) {
      // 生成本次条件的二元表达式
      return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
      return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    function genTernaryExp (el) {
      return altGen
        ? altGen(el, state)
        : el.once // 使用了v-once指令
          ? genOnce(el, state) // 处理 v-once 节点，返回一个创建静态标签节点的函数的字符串
          : genElement(el, state) // 调用genElement，生成节点的字符串
    }
  }

  function genFor (
    el,
    state,
    altGen,
    altHelper
  ) {
    var exp = el.for;
    var alias = el.alias;
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

    if (
      state.maybeComponent(el) &&
      el.tag !== 'slot' &&
      el.tag !== 'template' &&
      !el.key
    ) {
      state.warn(
        "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
        "v-for should have explicit keys. " +
        "See https://vuejs.org/guide/list.html#key for more info.",
        el.rawAttrsMap['v-for'],
        true /* tip */
      );
    }

    el.forProcessed = true; // avoid recursion
    return (altHelper || '_l') + "((" + exp + ")," +
      "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
      '})'
  }

  /**
   * 生成节点的数据对象 data 的字符串
   * @param {AST树} el 
   * @param {CodegenState 实例} state 
   */
  function genData$2 (el, state) {
    var data = '{';

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    // 首先对directives进行处理
    // directives可能会对el上的其他属性有影响，所以先处理
    var dirs = genDirectives(el, state);
    // 将获取的字符串追加到 data 变量并且已逗号结尾
    if (dirs) { data += dirs + ','; }

    // key
    // 将 el.key 的值追加到 data 变量并且已逗号结尾
    if (el.key) {
      data += "key:" + (el.key) + ",";
    }
    // ref
    // 将 el.ref 的值追加到 data 变量并且已逗号结尾
    if (el.ref) {
      data += "ref:" + (el.ref) + ",";
    }
    // 将 el.refInFor 的值追加到 data 变量并且已逗号结尾
    if (el.refInFor) {
      data += "refInFor:true,";
    }
    // pre
    // 将 el.pre 的值追加到 data 变量并且已逗号结尾
    if (el.pre) {
      data += "pre:true,";
    }
    // record original tag name for components using "is" attribute
    // 将 el.tag 的值追加到 data 变量并且已逗号结尾
    if (el.component) {
      data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    // 对静态属性 class 、style 和动态属性 :class 、:style 的处理，把处理结果值拼接起来返回
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    // attributes
    // 普通属性处理并将结果追加到 data 变量并且已逗号结尾
    if (el.attrs) {
      data += "attrs:" + (genProps(el.attrs)) + ",";
    }
    // DOM props
    // props属性处理并将结果追加到 data 变量并且已逗号结尾
    if (el.props) {
      data += "domProps:" + (genProps(el.props)) + ",";
    }
    // event handlers
    // 对自定义事件进行处理，将结果追加到 data 变量并且已逗号结尾
    if (el.events) {
      data += (genHandlers(el.events, false)) + ",";
    }
    // 对原生事件进行处理，将结果追加到 data 变量并且已逗号结尾
    if (el.nativeEvents) {
      data += (genHandlers(el.nativeEvents, true)) + ",";
    }
    // slot target
    // only for non-scoped slots
    // 将 slot 的值追加到 data 变量并且已逗号结尾
    if (el.slotTarget && !el.slotScope) {
      data += "slot:" + (el.slotTarget) + ",";
    }
    // scoped slots
    // 对作用域插槽进行处理，将结果追加到 data 变量并且已逗号结尾
    if (el.scopedSlots) {
      data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    // 在组件上使用 v-model 指令的情况，对 AST 树的 model 属性进行处理，将结果追加到 data 变量并且已逗号结尾
    // 例如：v-model = "name"，则转换的 AST 树为，{callback: "function ($$v) {name=$$v}", expression: ""name"", value: "(name)"}
    if (el.model) {
      data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    // 处理内联模板
    if (el.inlineTemplate) {
      var inlineTemplate = genInlineTemplate(el, state);
      if (inlineTemplate) {
        data += inlineTemplate + ",";
      }
    }
    // 将最后一个逗号替换成空字符
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    // 处理动态属性，
    // 例如：<div :[key]="name"> ... </div>，
    // 转换后的 AST 树为：dynamicAttrs: [{dynamic: true, end: 17, name: "key", start: 5, value: "name"}]
    // 最后转换成 '_b({staticClass:"list",class:classObject},"ul",_d({},[val,name]))'
    if (el.dynamicAttrs) {
      data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    // 包装数据处理
    // 例如：<div v-bind="{ id: someProp, 'other-attr': otherProp }"></div>
    if (el.wrapData) {
      data = el.wrapData(data);
    }
    // v-on data wrap
    // 包装事件处理
    // 例如：<button v-on="{ mousedown: doThis, mouseup: doThat }"></button>
    if (el.wrapListeners) {
      data = el.wrapListeners(data);
    }
    return data
  }

  function genDirectives (el, state) {
    var dirs = el.directives;
    if (!dirs) { return }
    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {
      dir = dirs[i];
      needRuntime = true;
      var gen = state.directives[dir.name];
      if (gen) {
        // compile-time directive that manipulates AST.
        // returns true if it also needs a runtime counterpart.
        needRuntime = !!gen(el, dir, state.warn);
      }
      if (needRuntime) {
        hasRuntime = true;
        res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
      }
    }
    if (hasRuntime) {
      return res.slice(0, -1) + ']'
    }
  }

  function genInlineTemplate (el, state) {
    var ast = el.children[0];
    if ( (
      el.children.length !== 1 || ast.type !== 1
    )) {
      state.warn(
        'Inline-template components must have exactly one child element.',
        { start: el.start }
      );
    }
    if (ast && ast.type === 1) {
      var inlineRenderFns = generate(ast, state.options);
      return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
    }
  }

  function genScopedSlots (
    el,
    slots,
    state
  ) {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
      var slot = slots[key];
      return (
        slot.slotTargetDynamic ||
        slot.if ||
        slot.for ||
        containsSlotChild(slot) // is passing down slot from parent which may be dynamic
      )
    });

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    var needsKey = !!el.if;

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    if (!needsForceUpdate) {
      var parent = el.parent;
      while (parent) {
        if (
          (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
          parent.for
        ) {
          needsForceUpdate = true;
          break
        }
        if (parent.if) {
          needsKey = true;
        }
        parent = parent.parent;
      }
    }

    var generatedSlots = Object.keys(slots)
      .map(function (key) { return genScopedSlot(slots[key], state); })
      .join(',');

    return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
  }

  function hash(str) {
    var hash = 5381;
    var i = str.length;
    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    return hash >>> 0
  }

  function containsSlotChild (el) {
    if (el.type === 1) {
      if (el.tag === 'slot') {
        return true
      }
      return el.children.some(containsSlotChild)
    }
    return false
  }

  function genScopedSlot (
    el,
    state
  ) {
    var isLegacySyntax = el.attrsMap['slot-scope'];
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
      return genIf(el, state, genScopedSlot, "null")
    }
    if (el.for && !el.forProcessed) {
      return genFor(el, state, genScopedSlot)
    }
    var slotScope = el.slotScope === emptySlotScopeToken
      ? ""
      : String(el.slotScope);
    var fn = "function(" + slotScope + "){" +
      "return " + (el.tag === 'template'
        ? el.if && isLegacySyntax
          ? ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined")
          : genChildren(el, state) || 'undefined'
        : genElement(el, state)) + "}";
    // reverse proxy v-slot without scope on this.$slots
    var reverseProxy = slotScope ? "" : ",proxy:true";
    return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
  }

  /**
   * 查找其子节点,生成子节点的字符串
   * @param {AST树} el 
   * @param {CodegenState 实例} state 
   * @param {*} checkSkip 
   * @param {*} altGenElement 
   * @param {*} altGenNode 
   */
  function genChildren (
    el,
    state,
    checkSkip,
    altGenElement,
    altGenNode
  ) {
    // 获取子节点 AST 树
    var children = el.children;
    if (children.length) {
      // 获取第一个子节点 AST 树
      var el$1 = children[0];
      // optimize single v-for
      // 对v-for进行简单优化
      if (children.length === 1 &&
        el$1.for &&
        el$1.tag !== 'template' &&
        el$1.tag !== 'slot'
      ) {
        // 判断 checkSkip，
        // 如果为 false，normalizationType = '', 
        // 如果为 true，在判断是不是组件，如果是则 normalizationType = ',1', 否则 normalizationType = ',0'
        var normalizationType = checkSkip
          ? state.maybeComponent(el$1) ? ",1" : ",0"
          : "";
        // 通过调用 genElement 处理子节点
        return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
      }
      // 判断 checkSkip，确定子数组所需的规范化
      // 如果为 false，normalizationType = 0, 
      // 如果为 true，调用 getNormalizationType
      var normalizationType$1 = checkSkip
        ? getNormalizationType(children, state.maybeComponent)
        : 0;
      var gen = altGenNode || genNode;
      // 遍历子节点，调用 genNode 函数
      return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
  }

  // determine the normalization needed for the children array.
  // 0: no normalization needed
  // 1: simple normalization needed (possible 1-level deep nested array)
  // 2: full normalization needed
  /**
   * 确定子数组所需的规范化
   * 0:不需要规范化
   * 1:需要简单的规范化（可能是1级深嵌套数组）
   * 2:需要完全规范化
   * @param {AST树的子节点} children 
   * @param {是否是组件} maybeComponent 
   */
  function getNormalizationType (
    children,
    maybeComponent
  ) {
    var res = 0;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.type !== 1) {
        continue
      }
      // el上有 v-for 或标签名是 template 或 slot
      // 或者el是if块，但块内元素有内容符合上述三个条件的
      if (needsNormalization(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
        res = 2;
        break
      }

      // el是自定义组件
      // 或el是if块，但块内元素有自定义组件的
      if (maybeComponent(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
        res = 1;
      }
    }
    return res
  }

  /**
   * 是否需要规范化
   * @param {节点AST树} el 
   */
  function needsNormalization (el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
  }

  /**
   * 
   * @param {*} node 
   * @param {*} state 
   */
  function genNode (node, state) {
    if (node.type === 1) {
      return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
      return genComment(node)
    } else {
      return genText(node)
    }
  }

  /**
   * 
   * @param {*} text 
   */
  function genText (text) {
    return ("_v(" + (text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
  }

  function genComment (comment) {
    return ("_e(" + (JSON.stringify(comment.text)) + ")")
  }

  function genSlot (el, state) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el, state);
    var res = "_t(" + slotName + (children ? ("," + children) : '');
    var attrs = el.attrs || el.dynamicAttrs
      ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
          // slot props are camelized
          name: camelize(attr.name),
          value: attr.value,
          dynamic: attr.dynamic
        }); }))
      : null;
    var bind = el.attrsMap['v-bind'];
    if ((attrs || bind) && !children) {
      res += ",null";
    }
    if (attrs) {
      res += "," + attrs;
    }
    if (bind) {
      res += (attrs ? '' : ',null') + "," + bind;
    }
    return res + ')'
  }

  // componentName is el.component, take it as argument to shun flow's pessimistic refinement
  function genComponent (
    componentName,
    el,
    state
  ) {
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
  }

  function genProps (props) {
    var staticProps = "";
    var dynamicProps = "";
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var value =  transformSpecialNewlines(prop.value);
      if (prop.dynamic) {
        dynamicProps += (prop.name) + "," + value + ",";
      } else {
        staticProps += "\"" + (prop.name) + "\":" + value + ",";
      }
    }
    staticProps = "{" + (staticProps.slice(0, -1)) + "}";
    if (dynamicProps) {
      return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
    } else {
      return staticProps
    }
  }

  // #3895, #4268
  function transformSpecialNewlines (text) {
    return text
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  }

  /*  */



  // these keywords should not appear inside expressions, but operators like
  // typeof, instanceof and in are allowed
  var prohibitedKeywordRE = new RegExp('\\b' + (
    'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
    'super,throw,while,yield,delete,export,import,return,switch,default,' +
    'extends,finally,continue,debugger,function,arguments'
  ).split(',').join('\\b|\\b') + '\\b');

  // these unary operators should not be used as property/method names
  var unaryOperatorsRE = new RegExp('\\b' + (
    'delete,typeof,void'
  ).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

  // strip strings in expressions
  var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

  // detect problematic expressions in a template
  function detectErrors (ast, warn) {
    if (ast) {
      checkNode(ast, warn);
    }
  }

  function checkNode (node, warn) {
    if (node.type === 1) {
      for (var name in node.attrsMap) {
        if (dirRE.test(name)) {
          var value = node.attrsMap[name];
          if (value) {
            var range = node.rawAttrsMap[name];
            if (name === 'v-for') {
              checkFor(node, ("v-for=\"" + value + "\""), warn, range);
            } else if (name === 'v-slot' || name[0] === '#') {
              checkFunctionParameterExpression(value, (name + "=\"" + value + "\""), warn, range);
            } else if (onRE.test(name)) {
              checkEvent(value, (name + "=\"" + value + "\""), warn, range);
            } else {
              checkExpression(value, (name + "=\"" + value + "\""), warn, range);
            }
          }
        }
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          checkNode(node.children[i], warn);
        }
      }
    } else if (node.type === 2) {
      checkExpression(node.expression, node.text, warn, node);
    }
  }

  function checkEvent (exp, text, warn, range) {
    var stripped = exp.replace(stripStringRE, '');
    var keywordMatch = stripped.match(unaryOperatorsRE);
    if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
      warn(
        "avoid using JavaScript unary operator as property name: " +
        "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
        range
      );
    }
    checkExpression(exp, text, warn, range);
  }

  function checkFor (node, text, warn, range) {
    checkExpression(node.for || '', text, warn, range);
    checkIdentifier(node.alias, 'v-for alias', text, warn, range);
    checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
    checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
  }

  function checkIdentifier (
    ident,
    type,
    text,
    warn,
    range
  ) {
    if (typeof ident === 'string') {
      try {
        new Function(("var " + ident + "=_"));
      } catch (e) {
        warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
      }
    }
  }

  function checkExpression (exp, text, warn, range) {
    try {
      new Function(("return " + exp));
    } catch (e) {
      var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
      if (keywordMatch) {
        warn(
          "avoid using JavaScript keyword as property name: " +
          "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
          range
        );
      } else {
        warn(
          "invalid expression: " + (e.message) + " in\n\n" +
          "    " + exp + "\n\n" +
          "  Raw expression: " + (text.trim()) + "\n",
          range
        );
      }
    }
  }

  function checkFunctionParameterExpression (exp, text, warn, range) {
    try {
      new Function(exp, '');
    } catch (e) {
      warn(
        "invalid function parameter expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n",
        range
      );
    }
  }

  /*  */

  var range = 2;

  function generateCodeFrame (
    source,
    start,
    end
  ) {
    if ( start === void 0 ) start = 0;
    if ( end === void 0 ) end = source.length;

    var lines = source.split(/\r?\n/);
    var count = 0;
    var res = [];
    for (var i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count >= start) {
        for (var j = i - range; j <= i + range || end > count; j++) {
          if (j < 0 || j >= lines.length) { continue }
          res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
          var lineLength = lines[j].length;
          if (j === i) {
            // push underline
            var pad = start - (count - lineLength) + 1;
            var length = end > count ? lineLength - pad : end - start;
            res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
          } else if (j > i) {
            if (end > count) {
              var length$1 = Math.min(end - count, lineLength);
              res.push("   |  " + repeat$1("^", length$1));
            }
            count += lineLength + 1;
          }
        }
        break
      }
    }
    return res.join('\n')
  }

  function repeat$1 (str, n) {
    var result = '';
    if (n > 0) {
      while (true) { // eslint-disable-line
        if (n & 1) { result += str; }
        n >>>= 1;
        if (n <= 0) { break }
        str += str;
      }
    }
    return result
  }

  /*  */



  /**
   * 创建函数
   * @param {字符串形式的函数体} code 
   * @param {数组，作用是当采用 new Function(code) 创建函数发生错误时用来收集错误} errors 
   */
  function createFunction (code, errors) {
    try {
      // 创建函数
      return new Function(code)
    } catch (err) {
      errors.push({ err: err, code: code });
      return noop
    }
  }

  /**
   * 创建compileToFunctions函数
   * @param {compile函数} compile 
   */
  function createCompileToFunctionFn (compile) {
    var cache = Object.create(null);

    return function compileToFunctions (
      template,
      options,
      vm
    ) {
      // 使用 extend 函数将 options 的属性混合到新的对象中并重新赋值 options
      options = extend({}, options);
      // 检查选项参数中是否包含 warn，如果没有则使用 baseWarn
      var warn$1 = options.warn || warn;
      // 将 options.warn 属性删除
      delete options.warn;

      /* istanbul ignore if */
      // 检测 new Function() 是否可用
      // 1、放宽你的CSP策略(内容安全策略)
      // 2、预编译
      {
        // detect possible CSP restriction
        try {
          new Function('return 1');
        } catch (e) {
          if (e.toString().match(/unsafe-eval|CSP/)) {
            warn$1(
              'It seems you are using the standalone build of Vue.js in an ' +
              'environment with Content Security Policy that prohibits unsafe-eval. ' +
              'The template compiler cannot work in this environment. Consider ' +
              'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
              'templates into render functions.'
            );
          }
        }
      }

      // check cache
      // 如果 options.delimiters 存在，则使用 String 方法将其转换成字符串并与 template 拼接作为 key 的值，否则直接使用 template 字符串作为 key
      var key = options.delimiters
        ? String(options.delimiters) + template
        : template;
      // 判断 cache[key] 是否存在，如果存在直接返回 cache[key]
      if (cache[key]) {
        return cache[key]
      }

      // compile
      // 编译模板
      var compiled = compile(template, options);

      // check compilation errors/tips
      // 检查使用 compile 对模板进行编译的过程中是否存在错误和提示
      {
        if (compiled.errors && compiled.errors.length) {
          if (options.outputSourceRange) {
            compiled.errors.forEach(function (e) {
              warn$1(
                "Error compiling template:\n\n" + (e.msg) + "\n\n" +
                generateCodeFrame(template, e.start, e.end),
                vm
              );
            });
          } else {
            warn$1(
              "Error compiling template:\n\n" + template + "\n\n" +
              compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
              vm
            );
          }
        }
        if (compiled.tips && compiled.tips.length) {
          if (options.outputSourceRange) {
            compiled.tips.forEach(function (e) { return tip(e.msg, vm); });
          } else {
            compiled.tips.forEach(function (msg) { return tip(msg, vm); });
          }
        }
      }

      // turn code into functions
      var res = {};
      // 错误收集数组
      var fnGenErrors = [];
      // 创建render
      res.render = createFunction(compiled.render, fnGenErrors);
      // 创建 staticRender
      res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
        return createFunction(code, fnGenErrors)
      });

      // check function generation errors.
      // this should only happen if there is a bug in the compiler itself.
      // mostly for codegen development use
      /* istanbul ignore if */
      // 如果在生成渲染函数过程中有错误，则报警告
      {
        if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
          warn$1(
            "Failed to generate render function:\n\n" +
            fnGenErrors.map(function (ref) {
              var err = ref.err;
              var code = ref.code;

              return ((err.toString()) + " in\n\n" + code + "\n");
          }).join('\n'),
            vm
          );
        }
      }

      // 返回结果并将结果缓存
      return (cache[key] = res)
    }
  }

  /*  */

  /**
   * 创建createCompiler函数
   * @param {baseCompile函数} baseCompile 
   */
  function createCompilerCreator (baseCompile) {
    return function createCompiler (baseOptions) {
      /**
       * 板编模译
       * @param {模板字符串} template 
       * @param {选项，参考 src/platforms/web/entry-runtime-with-compiler.js } options 
       */
      function compile (
        template,
        options
      ) {
        // 通过 Object.create 函数以 baseOptions 为原型创建 finalOptions
        var finalOptions = Object.create(baseOptions);
        var errors = [];
        var tips = [];

        // 定义 warn 函数
        var warn = function (msg, range, tip) {
          (tip ? tips : errors).push(msg);
        };

        if (options) {
          // 开发环境覆盖warn函数
          if ( options.outputSourceRange) {
            // $flow-disable-line
            var leadingSpaceLength = template.match(/^\s*/)[0].length;

            warn = function (msg, range, tip) {
              var data = { msg: msg };
              if (range) {
                if (range.start != null) {
                  data.start = range.start + leadingSpaceLength;
                }
                if (range.end != null) {
                  data.end = range.end + leadingSpaceLength;
                }
              }
              (tip ? tips : errors).push(data);
            };
          }
          // merge custom modules
          // 合并自定义模块
          if (options.modules) {
            finalOptions.modules =
              (baseOptions.modules || []).concat(options.modules);
          }
          // merge custom directives
          // 合并自定义指令
          if (options.directives) {
            finalOptions.directives = extend(
              Object.create(baseOptions.directives || null),
              options.directives
            );
          }
          // copy other options
          // 给finalOptions上添加其他属性
          for (var key in options) {
            if (key !== 'modules' && key !== 'directives') {
              finalOptions[key] = options[key];
            }
          }
        }

        // 给finalOptions上添加warn方法
        finalOptions.warn = warn;

        // 调用baseCompile，编译模板。baseCompile定义在 src/compiler/index.js 中
        var compiled = baseCompile(template.trim(), finalOptions);
        {
          // 通过抽象语法树来检查模板中是否存在错误表达式
          detectErrors(compiled.ast, warn);
        }
        // 将收集到的错误(errors)和提示(tips)添加到 compiled 上并返回 compiled
        compiled.errors = errors;
        compiled.tips = tips;
        return compiled
      }

      return {
        compile: compile,
        compileToFunctions: createCompileToFunctionFn(compile)
      }
    }
  }

  /*  */

  // `createCompilerCreator` allows creating compilers that use alternative
  // parser/optimizer/codegen, e.g the SSR optimizing compiler.
  // Here we just export a default compiler using the default parts.
  var createCompiler = createCompilerCreator(function baseCompile (
    template,
    options
  ) {
    // 使用 parse 函数将模板解析为 AST
    var ast = parse(template.trim(), options);
    if (options.optimize !== false) {
      // 优化 AST 树
      optimize(ast, options);
    }
    // 根据给定的AST生成目标平台的代码
    var code = generate(ast, options);
    return {
      ast: ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns
    }
  });

  /*  */

  var ref$1 = createCompiler(baseOptions);
  var compileToFunctions = ref$1.compileToFunctions;

  /*  */

  // check whether current browser encodes a char inside attribute values
  var div;
  function getShouldDecode (href) {
    div = div || document.createElement('div');
    div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
    return div.innerHTML.indexOf('&#10;') > 0
  }

  // #3663: IE encodes newlines inside attribute values while other browsers don't
  var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
  // #6828: chrome encodes content in a[href]
  var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

  /*  */

  /** 
    *  函数会多次调用，里面就能体现了
    *  用对象去缓存记录函数
    *  idToTemplate 是一个函数，根据key值来取值，如果第二次的key还是一样则从对象中取值，而不是重新在执行一次函数
    * */
  var idToTemplate = cached(function (id) {
    var el = query(id);
    return el && el.innerHTML
  });

  var mount = Vue.prototype.$mount; // 缓存 runtime 中的 $mount 方法
  Vue.prototype.$mount = function ( // 重写 $mount 方法
    el,
    hydrating
  ) {
    el = el && query(el); // 获取dom

    /* istanbul ignore if */
    // 如果是 body 或者是 html 文档时报下面警告
    if (el === document.body || el === document.documentElement) {
       warn(
        "Do not mount Vue to <html> or <body> - mount to normal elements instead."
      );
      return this
    }

    var options = this.$options; // 获取Vue实例化的配置参数options和Vue上的options属性合并后的参数
    // resolve template/el and convert to render function
    if (!options.render) { // 没有render函数的情况
      var template = options.template; // 获取模板配置项
      if (template) { // 有模板的情况
        if (typeof template === 'string') { // 模板是字符串的情况
          if (template.charAt(0) === '#') { // 模版以 # 号开始
            template = idToTemplate(template);
            /* istanbul ignore if */
            if ( !template) {
              warn(
                ("Template element not found or is empty: " + (options.template)),
                this
              );
            }
          }
        } else if (template.nodeType) { // 模板是dom节点的情况
          template = template.innerHTML; // 获取dom节点的innerHTML
        } else { // 如果不上上面两种则报警告
          {
            warn('invalid template option:' + template, this);
          }
          return this
        }
      } else if (el) { // 如果templtate不存在但是el存在，则获取调用getOuterHTML()函数获取el的outerHTML属性，获取DOM的outerHTML
        template = getOuterHTML(el); // 获取dom节点的outerHTML
      }
      if (template) {
        /* istanbul ignore if */
        // 性能监测
        if ( config.performance && mark) {
          mark('compile');
        }
        
        /**
         * 模板编译成render函数
         * @param {模板字符串} template 
         * @param {生产环境还是开发环境} outputSourceRange
         * @param {默认flase，IE在属性值中编码换行，而其他浏览器则不会} shouldDecodeNewlines
         * @param {默认true，chrome在a[href]中编码内容} shouldDecodeNewlinesForHref
         * @param {改变纯文本插入分隔符。修改指令的书写风格，比如默认是{{mgs}}  delimiters: ['${', '}']之后变成这样 ${mgs}} delimiters
         * @param {当设为 true 时，将会保留且渲染模板中的 HTML 注释，默认行为是舍弃它们} comments
         */
        var ref = compileToFunctions(template, { // TODO: (重点分析:编译)compileToFunctions
          outputSourceRange: "development" !== 'production',
          shouldDecodeNewlines: shouldDecodeNewlines, 
          shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments
        }, this);
        var render = ref.render;
        var staticRenderFns = ref.staticRenderFns;
        options.render = render;
        options.staticRenderFns = staticRenderFns;

        /* istanbul ignore if */
        // 性能监测
        if ( config.performance && mark) {
          mark('compile end');
          measure(("vue " + (this._name) + " compile"), 'compile', 'compile end');
        }
      }
    }
    /**
     * el：真实的dom
     * hydrating：undefined
     * mount：定义在 src/platforms/web/runtime/index.js 中
     */
    return mount.call(this, el, hydrating)
  };

  /**
   * Get outerHTML of elements, taking care
   * of SVG elements in IE as well.
   */
  /**
   * 获取dom节点的 outerHTML
   * @param {dom元素} el 
   */
  function getOuterHTML (el) {
    if (el.outerHTML) { // dom节点的outerHTML有值的情况
      return el.outerHTML
    } else {
      //创建一个div节点，并且包裹着el的克隆
      var container = document.createElement('div');
      container.appendChild(el.cloneNode(true));
      return container.innerHTML
    }
  }

  Vue.compile = compileToFunctions;

  return Vue;

})));
