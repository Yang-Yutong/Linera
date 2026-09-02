import { createSlice, PayloadAction } from '@reduxjs/toolkit' //导入createSlice和PayloadAction

import { AuthState } from '@/types'
// 初始化认证状态
export const initialState: AuthState = {
  currentUser: {},
  isAuthenticated: false,
  error: '',
  loading: true,
}
//创建关于认证的状态切片 createSlice()接收name、initialState和reducers三个参数
const authSlice = createSlice({
  name: 'auth', //切片名称
  initialState, //初始状态
  reducers: {
    //定义处理状态变更的各种reducer函数
    login: (state) => {
      //用户登录开始的动作,loading状态设为true表示登录请求已经开始
      state.loading = true
    },
    // 用户登录成功的动作
    loginSuccess: (state, { payload }: PayloadAction<any>) => {
      state.currentUser = payload // 将用户信息存储到state.currentUser中
      state.isAuthenticated = true // isAuthenticated状态设为true表示用户已登录,
      state.loading = false // loading状态设为false表示登录请求已完成
    },
    // 用户登录失败的动作
    loginError: (state, { payload }: PayloadAction<string>) => {
      state.error = payload //将错误信息存储到state.error中
      state.isAuthenticated = false //isAuthenticated状态设为false表示用户未登录，认证失败
      state.loading = false //loading状态设为false表示登录请求已完成
    },
    // 用户登出开始的动作
    logout: (state) => {
      state.loading = true //loading状态设为true表示登出请求已经开始
    },
    // 用户登出成功的动作
    logoutSuccess: (state) => {
      state.isAuthenticated = false //isAuthenticated状态设为false表示用户已登出
      state.currentUser = {} //清空currentUser对象
      state.error = ''
      state.loading = false //loading状态设为false表示登出请求已完成
    },
  },
})
// 导出切片的reducer和action
export const { login, loginSuccess, loginError, logout, logoutSuccess } = authSlice.actions

export default authSlice.reducer
