/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson (MPL-1.1 OR Apache-2.0 OR GPL-2.0-or-later)
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag } from 'web/compiler/util'
import { unicodeRegExp } from 'core/util/lang'

// Regular Expressions for parsing tags and attributes
// 匹配标签的属性(attributes),例如 a="xx" @a="xx" @click='xxx' v-on:click="xx" filterable 等属性定义字符
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// 正则匹配动态的属性写法  @[x]="handle1"    v-on[x]=""  :[x]="" 
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// 不包含前缀的 XML 标签名称
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
// 捕获的内容就是整个 qname 名称，即整个标签的名称
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 用来匹配开始标签的一部分，这部分包括：< 以及后面的标签名称
const startTagOpen = new RegExp(`^<${qnameCapture}`)
// 用来匹配开始标签的 < 以及标签的名字，但是并不包括开始标签的闭合部分，即：> 或者 />，由于标签可能是一元标签，所以开始标签的闭合部分有可能是 />，比如：<br />，如果不是一元标签，此时就应该是：>
const startTagClose = /^\s*(\/?)>/
// 匹配结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
// 匹配文档的 DOCTYPE 标签
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being passed as HTML comment when inlined in page
// 来匹配注释节点
const comment = /^<!\--/
// 匹配条件注释节点
const conditionalComment = /^<!\[/

// Special Elements (can contain anything)
// 检测给定的标签名字是不是纯文本标签（包括：`script`、`style`、`textarea`）
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}
// 一个字面量对象， `key` 是一些特殊的 `html` 实体，值则是这些实体对应的字符
const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
}
// 匹配 '<', '>', '"', '&', "'"
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
// 匹配 '<', '>', '"', '&', "'", '\n', '\t'
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

// #5992
// 检测给定的标签是否是 <pre> 标签或者 <textarea> 标签
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
// 判断是否应该忽略标签内容的第一个换行符的，如果满足：标签是 pre 或者 textarea 且 标签内容的第一个字符是换行符，则返回 true，否则为 false
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

// 将 html 实体转为对应的字符
function decodeAttr (value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, match => decodingMap[match])
}

/**
 * 解析HTML
 * @param {html} html 
 * @param {配置} options
 */
export function parseHTML (html, options) {
  // 一个空数组，在 while 循环中处理 html 字符流的时候每当遇到一个 非一元标签，都会将该开始标签 push 到该数组
  const stack = []
  const expectHTML = options.expectHTML
  // 检测一个标签是否是一元标签
  const isUnaryTag = options.isUnaryTag || no
  // 检测一个标签是否是可以省略闭合标签的非一元标签
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  // 当前字符串的读入位置
  let index = 0
  // last：存储剩余还未 parse 的 html 字符串
  // lastTag：终存储着位于 stack 栈顶的元素
  let last, lastTag
  // 开启一个 while 循环，循环结束的条件是 html 为空，即 html 被 parse 完毕
  while (html) {
    last = html
    // Make sure we're not in a plaintext content element like script/style
    // 确保即将 parse 的内容不是在纯文本标签里 (script,style,textarea)
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // 获取 < 的位置
      let textEnd = html.indexOf('<')
      // 模板里面是以 < 开始，即索引值为0，执行 if 语句
      if (textEnd === 0) {
        // Comment:
        // 匹配注释节点开始位置 <!--
        if (comment.test(html)) {
          // 获取注释节点的结束位置 --> 的索引值
          const commentEnd = html.indexOf('-->')
          // 存在注释节点结束位置标记 -->
          if (commentEnd >= 0) {
            // 是否保留注释节点
            if (options.shouldKeepComment) {
              // 调用 comment，参数说明：例如'<!-- ccc -->'
              // html.substring(4, commentEnd) : 此处的 commentEnd 为9，截取的结果为：" ccc "
              // index： 0
              // index + commentEnd + 3 ===> 0+9+3 = 12即字符串的长度
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
            }
            // 将解析完的注释节点从模板中移除
            advance(commentEnd + 3)
            // 继续循环解析模板
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        // 匹配条件注释节点开始位置 <![
        if (conditionalComment.test(html)) {
          // 获取条件注释节点的结束位置 ]> 的索引值
          const conditionalEnd = html.indexOf(']>')
          // 存在条件注释节点结束位置标记 ]>
          if (conditionalEnd >= 0) {
            // 直接从模板中移除条件注释节点，继续循环解析
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        // 如果匹配成功 doctypeMatch 的值是一个数组，数组的第一项保存着整个匹配项的字符串，即整个 Doctype 标签的字符串，否则 doctypeMatch 的值为 null
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          // 直接从模板中移除Doctype释节点，继续循环解析
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        // 匹配结束标签
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index // 获取当前位置
          advance(endTagMatch[0].length) // 更新index位置索引
          parseEndTag(endTagMatch[1], curIndex, index) // 解析结束标签
          continue
        }

        // Start tag:
        // 获取开始标签
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          // 处理开始标签
          handleStartTag(startTagMatch)
          // 检测是否应该忽略元素内容的第一个换行符
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }

      let text, rest, next
      // 例如html='x<xx<xxx',textEnd的值应该为1
      if (textEnd >= 0) {
        // rest='<xx<xxx'
        rest = html.slice(textEnd)
        while (
          !endTag.test(rest) && // 不存在结束标签
          !startTagOpen.test(rest) && // 不存在开始标签
          !comment.test(rest) && // 不存在注释标签
          !conditionalComment.test(rest) // 不存在条件注释标签
        ) {
          // < in plain text, be forgiving and treat it as text
          // next=3
          next = rest.indexOf('<', 1)
          if (next < 0) break
          // textEnd=4
          textEnd += next
          // rest='<xxx',此时textEnd的值应该为4，继续循环
          rest = html.slice(textEnd)
        }
        // text='x<xx',此时textEnd的值应该为4
        text = html.substring(0, textEnd)
      }

      // 此案例循环结束textEnd的值应该为4
      if (textEnd < 0) {
        text = html
      }

      // text='x<xx'
      if (text) {
        // 更新html，html='<xxx'
        advance(text.length)
      }

      if (options.chars && text) {
        options.chars(text, index - text.length, index)
      }
      // 第一次循环结束，html='<xxx'不为空，继续下一个循环，此时textEnd为0，还是执行到textEnd >= 0，所以执行text = html.substring(0, textEnd)，即text = html.substring(0, 0)此时text为空，所以直接执行到最后 if (html === last) 
    } else {
      //  即将 parse 的内容是在纯文本标签里 (script,style,textarea)
      let endTagLength = 0
      const stackedTag = lastTag.toLowerCase()
      // 这里我们只处理textarea元素, 其他的两种Vue 会警告，不提倡这么写
      // 缓存匹配 textarea 的正则表达式
      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      // 清除匹配项，处理text，以 <textarea>xxx</textarea> 为例，其中all 为 xxx</textarea>, text 为 xxx, endTag 为 </textarea>
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        // 要匹配的html字符串的长度
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            // 匹配<!--xxx--> 
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            // 匹配<!CDATAxxx>
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        // 忽略 <pre> 标签和 <textarea> 标签的内容中的第一个换行符
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        // 处理文本内容，并使用 options.char 方法
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      // 更新index
      index += html.length - rest.length
      // 更新html
      html = rest
      // 解析结束tag
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    // 如果两者相等，则说明字符串 html 在经历循环体的代码之后没有任何改变，此时会把 html 字符串作为纯文本对待
    if (html === last) {
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`, { start: index + html.length })
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag()

  /**
   * 截取字符串
   * @param {开始位置} n 
   */
  function advance (n) {
    index += n
    html = html.substring(n)
  }

  /**
   * 解析开始标签
   */
  function parseStartTag () {
    // 匹配开始标签，例如： <p><p> ，匹配的结果是 ['<p', 'p']
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1], // 标签的名称
        attrs: [], // 属性列表
        start: index // 当前字符流读入位置在整个 html 字符串中的相对位置
      }
      // 从模板中移除匹配的开始标签即 <标签名
      advance(start[0].length)
      let end, attr
      // 1.没有匹配到开始标签的结束部分(/> 或 >)
      // 2.匹配到了开始标签中的动态属性
      // 3.匹配到了开始标签中的属性
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        attr.start = index // 开始位置
        advance(attr[0].length) // 移除匹配到的属性，例如 ` v-for="item in list"`
        attr.end = index // 获取属性的结束位置
        match.attrs.push(attr) // 缓存匹配到的属性
      }
      if (end) {
        match.unarySlash = end[1] // 一元斜杠
        advance(end[0].length) // 更新index
        match.end = index // 给match添加end属性等于结束位置的索引
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
    const tagName = match.tagName
    // 获取一元斜杠
    const unarySlash = match.unarySlash

    if (expectHTML) {
      // isNonPhrasingTag：标签是段落式内容
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      // 当前正在解析的标签是一个可以省略结束标签的标签，并且与上一次解析到的开始标签相同
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    // isUnaryTag 判断是否是一元原生标签，!!unarySlash 判断自定义标签和组件
    const unary = isUnaryTag(tagName) || !!unarySlash
    // 获取属性长度
    const l = match.attrs.length
    // 新建一个数组
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      // 获取每一个属性
      const args = match.attrs[i]
      // 获取属性值 ，例如 'item in list'
      const value = args[3] || args[4] || args[5] || ''
      // 获取解码函数
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      attrs[i] = {
        name: args[1],
        // 对属性值进行 html 实体的解码
        value: decodeAttr(value, shouldDecodeNewlines)
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length
        attrs[i].end = args.end
      }
    }

    if (!unary) {
      // 如果开始标签是非一元标签，则将该开始标签的信息入栈，即 push 到 stack 数组中
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      // 并将 lastTag 的值设置为该标签名
      lastTag = tagName
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
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
    let pos, lowerCasedTagName
    // start 和 end 不存在时，将这两个变量的值设置为当前字符流的读入位置，即 index
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    if (tagName) {
      // 将标签名转为小写格式
      lowerCasedTagName = tagName.toLowerCase()
      // 寻找当前解析的结束标签所对应的开始标签在 stack 栈中的位置
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        // 如果发现 stack 数组中存在索引大于 pos 的元素，那么该元素一定是缺少闭合标签的
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`,
            { start: stack[i].start, end: stack[i].end }
          )
        }
        // 闭合标签，为了保证解析结果的正确性
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      // 匹配后把栈到 pos 位置的都弹出，并从 stack 尾部拿到 lastTag
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') { // 处理 </br>
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') { // 处理</p>
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
