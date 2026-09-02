import mousetrap from 'mousetrap'
import { useEffect, useRef } from 'react'

import 'mousetrap-global-bind'

/**
 * 一个空的函数实现，常用于需要函数参数但不需要执行任何操作的场景
 * 这种模式在JavaScript/TypeScript中被称为"noop"（no operation，无操作）
 */
const noop = () => {}

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(noop)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    const tick = () => savedCallback.current()
    if (delay) {
      const id = setInterval(tick, delay)

      return () => clearInterval(id)
    }
  }, [delay])
}

export function useKey(key: string, action: () => void) {
  const actionRef = useRef(noop) //
  actionRef.current = action //让actionRef.current指向action函数

  // 绑定全局键盘事件
  useEffect(() => {
    //用mousrtrap库的bindGlobal方法绑定全局键盘事件
    //当用户按下指定的键时，会触发事件，从而阻止默认事件执行回调函数
    mousetrap.bindGlobal(key, (event: Event) => {
      event.preventDefault()
      if (actionRef.current) {
        actionRef.current()
      }
    })
    // 组件卸载，解绑全局键盘事件
    return () => mousetrap.unbind(key)
  }, [key]) // 当 key 改变时，重新执行副作用函数
}

export function useBeforeUnload(handler: Function = () => {}) {
  if (process.env.NODE_ENV !== 'production' && typeof handler !== 'function') {
    throw new TypeError(`Expected "handler" to be a function, not ${typeof handler}.`)
  }

  const handlerRef = useRef(handler)

  // Remember the latest callback
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  // Set up the before unload event
  useEffect(() => {
    const handleBeforeunload = (event: BeforeUnloadEvent) => {
      let returnValue

      if (typeof handlerRef.current === 'function') {
        returnValue = handlerRef.current(event)
      }

      if (event.defaultPrevented) {
        event.returnValue = ''
      }

      if (typeof returnValue === 'string') {
        event.returnValue = returnValue

        return returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeunload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeunload)
    }
  }, [])
}
