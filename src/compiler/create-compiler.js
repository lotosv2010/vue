/* @flow */

import { extend } from 'shared/util'
import { detectErrors } from './error-detector'
import { createCompileToFunctionFn } from './to-function'

/**
 * 创建createCompiler函数
 * @param {baseCompile函数} baseCompile 
 */
export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {
    /**
     * 板编模译
     * @param {模板字符串} template 
     * @param {选项，参考 src/platforms/web/entry-runtime-with-compiler.js } options 
     */
    function compile (
      template: string,
      options?: CompilerOptions
    ): CompiledResult {
      // 通过 Object.create 函数以 baseOptions 为原型创建 finalOptions
      const finalOptions = Object.create(baseOptions)
      const errors = []
      const tips = []

      // 定义 warn 函数
      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg)
      }

      if (options) {
        // 开发环境覆盖warn函数
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length

          warn = (msg, range, tip) => {
            const data: WarningMessage = { msg }
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : errors).push(data)
          }
        }
        // merge custom modules
        // 合并自定义模块
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        // 合并自定义指令
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // copy other options
        // 给finalOptions上添加其他属性
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }

      // 给finalOptions上添加warn方法
      finalOptions.warn = warn

      // 调用baseCompile，编译模板。baseCompile定义在 src/compiler/index.js 中
      const compiled = baseCompile(template.trim(), finalOptions)
      if (process.env.NODE_ENV !== 'production') {
        // 通过抽象语法树来检查模板中是否存在错误表达式
        detectErrors(compiled.ast, warn)
      }
      // 将收集到的错误(errors)和提示(tips)添加到 compiled 上并返回 compiled
      compiled.errors = errors
      compiled.tips = tips
      return compiled
    }

    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
