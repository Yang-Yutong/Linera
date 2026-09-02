import React, { createContext, FunctionComponent, useContext, useState } from 'react'
// 定义上下文环境中必须要包含的属性，类型约束
interface TempStateContextInterface {
  addingTempCategory: boolean
  setAddingTempCategory(adding: boolean): void
}

const initialContextValue = {
  addingTempCategory: false,
  setAddingTempCategory: (adding: boolean) => undefined,
}
// 创建临时状态上下文对象
// react提供的createContext，必须传入一个context的默认值，返回的context会包含provider和consumer两个属性，但推荐用useContext来代替consumer
const TempStateContext = createContext<TempStateContextInterface>(initialContextValue)

// useTempState封装了对临时状态上下文的访问
const useTempState = () => {
  // 获取上下文，useContext是react提供的hook，用于消费上下文
  const context = useContext(TempStateContext)
  // 如果上下文不存在，抛出错误
  if (!context) {
    // 临时状态只在临时上下文环境中使用
    throw new Error('useTempState must be used within a TempStateContext')
  }
  // 返回上下文，实际上为了调用者能获取 { addingTempCategory, setAddingTempCategory }
  return context
}
// 定义上下文提供者组件，自动包含children属性，作为最外层的provider内层一定很多children
const TempStateProvider: FunctionComponent = ({ children }) => {
  //真正的状态在这里设置，初始值为false表示不是添加笔记的状态
  const [addingTempCategory, setAddingTempCategory] = useState(false)
  // 构造 value 对象，包含当前状态和更新函数。这个对象会作为 Context 的值传递给所有子组件
  const value: TempStateContextInterface = {
    addingTempCategory,
    setAddingTempCategory,
  }
  // 返回上下文的提供者组件，包裹住所有子组件，把value传递给所有子组件,子组件能用useTempState来访问value
  // 提供的是什么？TempStateContext和value对象，组件渲染时，React 在构建虚拟 DOM（Fiber 树）时，会在 TempStateProvider 这个组件节点的内存里存这两个值，value是附着在节点上的
  return <TempStateContext.Provider value={value}>{children}</TempStateContext.Provider>
  // 为什么子组件能用useTempState来访问value？？
  // 子组件调用useTempState时在内部执行useContext(TempStateContext)时，React会拿着context沿着当前节点的父组件遍历，在Fiber 树中挂载维护此context的provider,再把它身上的value传递给子组件
}

export { TempStateProvider, useTempState }
