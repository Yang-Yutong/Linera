import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import createSagaMiddleware from 'redux-saga'
import { configureStore } from '@reduxjs/toolkit'

import { App } from '@/containers/App'
import rootSaga from '@/sagas'
import rootReducer from '@/slices'
import history from '@/utils/history'

// index.tsx是 React 的入口文件，负责渲染整个应用
// 全局样式文件
import '@/styles/index.scss'
// redux-saga中间件
const sagaMiddleware = createSagaMiddleware()
// 创建 全局store
const store = configureStore({
  reducer: rootReducer, // 注册根reducer,reducer是一个函数，它接收state和action，然后返回一个新的state
  middleware: [sagaMiddleware], //中间件拦截并处理action
  devTools: process.env.NODE_ENV !== 'production',
})

sagaMiddleware.run(rootSaga)

render(
  <Provider store={store}>
    <Router history={history}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root')
)
