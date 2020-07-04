import attrs from './attrs'
import klass from './class'
import events from './events'
import domProps from './dom-props'
import style from './style'
import transition from './transition'

export default [
  attrs, // attrs包含两个方法create和update都是更新设置真实dom属性值 {create: updateAttrs,  update: updateAttrs   }
  klass, // klass包含类包含两个方法create和update都是更新calss，其实就是updateClass方法。，设置真实dom的class
  events, // 更新真实dom的事件，create/update
  domProps, //更新真实dom的props属性值，create/update
  style, // 更新真实dom的style属性，create/和update。方法create和update函数都是updateStyle更新真实dom的style属性值，将vonde虚拟dom的css转义成并且渲染到真实dom的css中
  transition // 过度动画，create/activate/remove
]
