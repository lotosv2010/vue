/* @flow */

import { noop, extend } from 'shared/util'
import { warn as baseWarn, tip } from 'core/util/debug'
import { generateCodeFrame } from './codeframe'

type CompiledFunctionResult = {
  render: Function;
  staticRenderFns: Array<Function>;
};

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
    errors.push({ err, code })
    return noop
  }
}

/**
 * 创建compileToFunctions函数
 * @param {compile函数} compile 
 */
export function createCompileToFunctionFn (compile: Function): Function {
  const cache = Object.create(null)

  return function compileToFunctions (
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    // 使用 extend 函数将 options 的属性混合到新的对象中并重新赋值 options
    options = extend({}, options)
    // 检查选项参数中是否包含 warn，如果没有则使用 baseWarn
    const warn = options.warn || baseWarn
    // 将 options.warn 属性删除
    delete options.warn

    /* istanbul ignore if */
    // 检测 new Function() 是否可用
    // 1、放宽你的CSP策略(内容安全策略)
    // 2、预编译
    if (process.env.NODE_ENV !== 'production') {
      // detect possible CSP restriction
      try {
        new Function('return 1')
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          )
        }
      }
    }

    // check cache
    // 如果 options.delimiters 存在，则使用 String 方法将其转换成字符串并与 template 拼接作为 key 的值，否则直接使用 template 字符串作为 key
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    // 判断 cache[key] 是否存在，如果存在直接返回 cache[key]
    if (cache[key]) {
      return cache[key]
    }

    // compile
    // 编译模板
    const compiled = compile(template, options)

    // check compilation errors/tips
    // 检查使用 compile 对模板进行编译的过程中是否存在错误和提示
    if (process.env.NODE_ENV !== 'production') {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          compiled.errors.forEach(e => {
            warn(
              `Error compiling template:\n\n${e.msg}\n\n` +
              generateCodeFrame(template, e.start, e.end),
              vm
            )
          })
        } else {
          warn(
            `Error compiling template:\n\n${template}\n\n` +
            compiled.errors.map(e => `- ${e}`).join('\n') + '\n',
            vm
          )
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          compiled.tips.forEach(e => tip(e.msg, vm))
        } else {
          compiled.tips.forEach(msg => tip(msg, vm))
        }
      }
    }

    // turn code into functions
    const res = {}
    // 错误收集数组
    const fnGenErrors = []
    // 创建render
    res.render = createFunction(compiled.render, fnGenErrors)
    // 创建 staticRender
    res.staticRenderFns = compiled.staticRenderFns.map(code => {
      return createFunction(code, fnGenErrors)
    })

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    // 如果在生成渲染函数过程中有错误，则报警告
    if (process.env.NODE_ENV !== 'production') {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
          fnGenErrors.map(({ err, code }) => `${err.toString()} in\n\n${code}\n`).join('\n'),
          vm
        )
      }
    }

    // 返回结果并将结果缓存
    return (cache[key] = res)
  }
}
