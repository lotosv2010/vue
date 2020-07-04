/* @flow */

// 匹配 ) 或 . 或 + 或 - 或 _ 或 $ 或 ]
const validDivisionCharRE = /[\w).+\-_$\]]/

/**
 * 解析成正确的value，
 * 把过滤器转换成vue虚拟dom的解析方法函数
 * 比如把过滤器 'message | filterA | filterB('arg1', arg2)' 转换成 _f("filterB")(_f("filterA")(message),arg1,arg2)
 * @param {表达式} exp 
 */
export function parseFilters (exp: string): string {
  // 是否在 ''中
  let inSingle = false
  // 是否在 "" 中
  let inDouble = false
  // 是否在 ``
  let inTemplateString = false
  // 是否在 正则 \\ 中
  let inRegex = false
  // 是否在 `{` 中发现一个 culy加1,然后发现一个 `}` culy减1,直到culy为0,说明 { .. }闭合
  let curly = 0
  // 跟 `{` 一样有一个 `[` 加1, 有一个 `]` 减1
  let square = 0
  // 跟 `{` 一样有一个 `(` 加1, 有一个 `)` 减1
  let paren = 0
  // 属性值字符串中字符的索引，将会被用来确定过滤器的位置
  let lastFilterIndex = 0
  // c: 当前读入字符所对应的 ASCII 码
  // prev: 当前字符的前一个字符所对应的 ASCII 码
  // i: 当前读入字符的位置索引
  // expression: 是 parseFilters 函数的返回值
  // filters: 是一个数组，它保存着所有过滤器函数名
  let c, prev, i, expression, filters

  // 将属性值字符串作为字符流读入，从第一个字符开始一直读到字符串的末尾
  for (i = 0; i < exp.length; i++) {
    prev = c // 将上一次读取的字符所对应的 ASCII 码赋值给 prev 变量
    c = exp.charCodeAt(i) // 设置为当前读取字符所对应的 ASCII 码
    if (inSingle) { // 如果当前读取的字符存在于由单引号包裹的字符串内，则会执行这里的代码
      // c === `'` && pre !== `\`，当前字符是单引号(')，并且当前字符的前一个字符不是反斜杠(\)
      if (c === 0x27 && prev !== 0x5C) inSingle = false
    } else if (inDouble) { // 如果当前读取的字符存在于由双引号包裹的字符串内，则会执行这里的代码
      // c === `"` && pre !== `\`，当前字符是双引号(')，并且当前字符的前一个字符不是反斜杠(\)
      if (c === 0x22 && prev !== 0x5C) inDouble = false
    } else if (inTemplateString) { // 如果当前读取的字符存在于模板字符串内，则会执行这里的代码
      // c === ``` && pre !== `\`，当前字符是(`)，并且当前字符的前一个字符不是反斜杠(\)
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false
    } else if (inRegex) { // 如果当前读取的字符存在于正则表达式内，则会执行这里的代码
      // c === `/` && pre !== `\`，当前字符是斜杠(/)，并且当前字符的前一个字符不是反斜杠(\)
      if (c === 0x2f && prev !== 0x5C) inRegex = false
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
        lastFilterIndex = i + 1
        // 存储过滤器的表达式
        // 例如:这里匹配如果字符串是 'ab|c' 则把ab匹配出来
        expression = exp.slice(0, i).trim()
      } else { // 当不满足以上条件时，执行这里的代码
        pushFilter()
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
        let j = i - 1 // 变量 j 是 / 字符的前一个字符的索引
        let p
        // find first non-whitespace prev char
        // 是找到 / 字符之前第一个不为空的字符
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        // 如果字符 / 之前没有非空的字符，或该字符不满足正则 validDivisionCharRE 的情况下，才会认为字符 / 为正则的开始
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    pushFilter()
  }

  /**
   * 获取当前过滤器的,并将其存储在filters 数组中
   * filters = [ 'filterA' , 'filterB']
   */
  function pushFilter () {
    // 检查变量 filters 是否存在，如果不存在则将其初始化为空数组
    // 接着使用 slice 方法对字符串 exp 进行截取，截取的开始和结束位置恰好是 lastFilterIndex(指的是管道符后面的第一个字符) 和 i
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      // 把过滤器封装成函数,虚拟dom需要渲染的函数
      expression = wrapFilter(expression, filters[i])
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
function wrapFilter (exp: string, filter: string): string {
  // 返回字符串第一次出现'('索引的位置
  const i = filter.indexOf('(')
  if (i < 0) {
    // _f: resolveFilter
    return `_f("${filter}")(${exp})`
  } else {
    // name 是从字符串开始到 `(` 结束的字符串,不包含 `(`
    const name = filter.slice(0, i)
    // args是从 `(` 开始匹配，到字符串末端，不包含`(`
    const args = filter.slice(i + 1)
    return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
  }
}
