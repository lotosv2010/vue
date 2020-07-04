import directives from './directives'
import ref from './ref'

export default [
  ref, // ref创建，创建/更新/销毁 函数
  directives // 自定义指令，创建/更新/销毁 函数
]
