/* @flow */

import { cached } from 'shared/util'
import { parseFilters } from './filter-parser'

// 匹配viwe 视图中的{{指令}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
// 匹配特殊符号  - 或者. 或者* 或者+ 或者? 或者^ 或者$ 或者{ 或者} 或者( 或者) 或者| 或者[ 或者] 或者/ 或者\
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

const buildRegex = cached(delimiters => {
  //$&与 regexp 相匹配的子串，这里的意思是遇到了特殊符号的时候在正则里面需要替换加多一个/斜杠
  const open = delimiters[0].replace(regexEscapeRE, '\\$&')
  const close = delimiters[1].replace(regexEscapeRE, '\\$&')
  // 匹配开始的open +任意字符或者换行符+ close 全局匹配
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

type TextParseResult = {
  expression: string,
  tokens: Array<string | { '@binding': string }>
}

/**
 * 解析文本
 * @param {文本} text 
 * @param {被修改默认的标签匹配} delimiters 
 */
export function parseText (
  text: string,
  delimiters?: [string, string]
): TextParseResult | void {
  // 如果delimiters不存在则用默认指令 {{}}，如果修改成其他指令则用其他指令
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE
  // 匹配是否有表达式,比如:{{message}}  如果没有，则表示是纯文本节点,则直接返回不做处理
  if (!tagRE.test(text)) {
    return
  }
  const tokens = []
  const rawTokens = []
  let lastIndex = tagRE.lastIndex = 0
  let match, index, tokenValue
  // 用正则tagRE去匹配text,此时match就是text里的每个值，
  // 对于:{{item}}:{{index}}来说,
  // match等于
  // Array["{{item}}","item"] 、 
  // Array["{{index}}","index"]
  while ((match = tagRE.exec(text))) {
    // 匹配的字符串在整个字符串中的位置
    index = match.index
    // push text token
    // 如果index大于lastIndex，
    // 表明中间还有一段文本，比如:{{item}}:{{index}}，
    // 中间的:就是文本
    if (index > lastIndex) {
      // 截取匹配到字符串指令前面的字符串，并添加到rawTokens
      rawTokens.push(tokenValue = text.slice(lastIndex, index))
      // 添加匹配到字符串指令前面的字符串
      tokens.push(JSON.stringify(tokenValue))
    }
    // tag token
    // 调用parseFilters对match[1做解析];
    // 例如{{no | a(100) | b }}，
    // 解析后的格式为:_f("b")(_f("a")(no,100))
    const exp = parseFilters(match[1].trim())
    // 把指令转义成函数，便于vonde 虚拟dom 渲染 
    // 比如指令{{name}} 转换成 _s(name)
    tokens.push(`_s(${exp})`)
    // 绑定指令{{name}} 指令转换成  [{@binding: "name"}]
    rawTokens.push({ '@binding': exp })
    // 设置下一次开始匹配的位置
    lastIndex = index + match[0].length
  }
  // 截取剩余的普通文本并将其添加到 rawTokens 和 tokens 数组中
  if (lastIndex < text.length) {
    // 截取字符串到最后一位
    rawTokens.push(tokenValue = text.slice(lastIndex))
    // 拼接最后一位字符串
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    // 拼凑成一个表达式，例如:"_s(item)+":"+_s(index)"
    expression: tokens.join('+'),
    // 模板信息，例如[{@binding: "item"},":",{@binding: "index"}]
    tokens: rawTokens
  }
}
