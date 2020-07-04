/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

/** 
  *  函数会多次调用，里面就能体现了
  *  用对象去缓存记录函数
  *  idToTemplate 是一个函数，根据key值来取值，如果第二次的key还是一样则从对象中取值，而不是重新在执行一次函数
  * */
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

const mount = Vue.prototype.$mount // 缓存 runtime 中的 $mount 方法
Vue.prototype.$mount = function ( // 重写 $mount 方法
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el) // 获取dom

  /* istanbul ignore if */
  // 如果是 body 或者是 html 文档时报下面警告
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options // 获取Vue实例化的配置参数options和Vue上的options属性合并后的参数
  // resolve template/el and convert to render function
  if (!options.render) { // 没有render函数的情况
    let template = options.template // 获取模板配置项
    if (template) { // 有模板的情况
      if (typeof template === 'string') { // 模板是字符串的情况
        if (template.charAt(0) === '#') { // 模版以 # 号开始
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) { // 模板是dom节点的情况
        template = template.innerHTML // 获取dom节点的innerHTML
      } else { // 如果不上上面两种则报警告
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) { // 如果templtate不存在但是el存在，则获取调用getOuterHTML()函数获取el的outerHTML属性，获取DOM的outerHTML
      template = getOuterHTML(el) // 获取dom节点的outerHTML
    }
    if (template) {
      /* istanbul ignore if */
      // 性能监测
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
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
      const { render, staticRenderFns } = compileToFunctions(template, { // TODO: (重点分析:编译)compileToFunctions
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines, 
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      // 性能监测
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  /**
   * el：真实的dom
   * hydrating：undefined
   * mount：定义在 src/platforms/web/runtime/index.js 中
   */
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
/**
 * 获取dom节点的 outerHTML
 * @param {dom元素} el 
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) { // dom节点的outerHTML有值的情况
    return el.outerHTML
  } else {
    //创建一个div节点，并且包裹着el的克隆
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
