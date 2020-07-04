import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
// Vue 构造函数
function Vue (options) {
  // 生产环境下，没有使用 new 创建实例会报下面警告
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) // 初始化Vue
stateMixin(Vue) // 数据绑定，$watch方法
eventsMixin(Vue) // 初始化事件绑定方法
lifecycleMixin(Vue) // 初始化vue 生命周期： 更新 销毁 
renderMixin(Vue) // 初始化渲染的函数

export default Vue
