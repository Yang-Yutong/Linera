import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'

import { LandingPage } from '@/components/LandingPage'
import { TakeNoteApp } from '@/containers/TakeNoteApp'
import { PublicRoute } from '@/router/PublicRoute'
import { PrivateRoute } from '@/router/PrivateRoute'
import { getAuth } from '@/selectors'
import { login } from '@/slices/auth'

// 根据环境变量判断是否为演示模式
const isDemo = process.env.DEMO
// 导出App组件
export const App: React.FC = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { loading } = useSelector(getAuth) // 获取用户认证状态，从中解构出loading属性

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch() //useDispatch hook用于向仓库发送动作，返回store.dispatch方法的引用
  const _login = () => dispatch(login()) // 调用dispatch(action)， action会同步或通过中间件异步传递给Reducer
  // _login为这个函数的变量名，代表着这个动作

  // ===========================================================================
  // Hooks
  // ===========================================================================
  // useEffect hook用于在组件挂载和更新时执行副作用操作，副作用操作包括数据获取、订阅或手动更改React组件中的DOM等
  useEffect(() => {
    // 第一个参数为回调函数
    _login()
    // 当组件挂载时，调用_login函数
  }, []) // []作为第二个参数，是useEffect函数的依赖数组，为空表示这个副作用操作只在组件挂载时执行一次

  if (loading) {
    // 如果loading为true，则渲染加载动画
    return (
      <div className="loading">
        <div className="la-ball-beat">
          <div />
          <div />
          <div />
        </div>
      </div>
    )
  }
  // 如果loading为false，则渲染App组件
  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Linera</title>
        <link rel="canonical" href="https://takenote.dev" />
      </Helmet>

      <Switch>
        {isDemo ? (
          // 如果是演示模式，则渲染LandingPage和TakeNoteApp组件
          <>
            <Route exact path="/" component={LandingPage} />
            <Route path="/app" component={TakeNoteApp} />
          </>
        ) : (
          // 如果不是演示模式，则渲染PublicRoute和PrivateRoute组件
          <>
            <PublicRoute exact path="/" component={LandingPage} />
            <PrivateRoute path="/app" component={TakeNoteApp} />
          </>
        )}
        <Redirect to="/" />
      </Switch>
    </HelmetProvider>
  )
}
