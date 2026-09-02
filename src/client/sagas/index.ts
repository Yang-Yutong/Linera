import { all, put, takeLatest, select, call } from 'redux-saga/effects'
import dayjs from 'dayjs'
import axios, { AxiosResponse } from 'axios'
// 为什么redux的import顺序必须在api前？
import { SagaIterator } from 'redux-saga'

import { requestCategories, requestNotes, requestSettings, saveState, saveSettings } from '@/api'
import { loadCategories, loadCategoriesError, loadCategoriesSuccess } from '@/slices/category'
import { loadNotes, loadNotesError, loadNotesSuccess } from '@/slices/note'
import { sync, syncError, syncSuccess } from '@/slices/sync'
import { login, loginSuccess, loginError, logout, logoutSuccess } from '@/slices/auth'
import {
  updateCodeMirrorOption,
  loadSettingsSuccess,
  loadSettingsError,
  loadSettings,
  toggleDarkTheme,
  togglePreviewMarkdown,
  toggleSettingsModal,
  updateNotesSortStrategy,
} from '@/slices/settings'
import { SyncAction } from '@/types'
import { getSettings } from '@/selectors'

const isDemo = process.env.DEMO

// 访问express的登录接口，获取cookie中的Github账户
function* loginUser(): SagaIterator {
  try {
    if (isDemo) {
      yield put(loginSuccess({ name: 'Demo User' }))
    } else {
      const result = yield call(axios, '/api/auth/login')
      const { data } = result

      yield put(loginSuccess(data))
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      yield put(loginError(error.response?.data.message))
    } else {
      yield put(loginError((error as Error).message))
    }
  }
}

// 调用express接口移除cookie中的访问token ->退出登录
function* logoutUser() {
  try {
    if (isDemo) {
      yield put(logoutSuccess())
    } else {
      yield axios('/api/auth/logout') // 如果不是demo则调用真实的axios接口
    }
    yield put(logoutSuccess()) // redux的store中清空用户信息
  } catch (error) {
    yield put(logoutSuccess())
  }
}

// 从api接口获取笔记
function* fetchNotes(): SagaIterator {
  let data
  try {
    if (isDemo) {
      data = yield call(requestNotes) //传入函数引用，让redux在合适时间执行，而不是函数的结果
    } else {
      data = (yield call(axios, '/api/sync/notes')).data
    }
    const { notesSortKey } = yield select(getSettings)

    yield put(loadNotesSuccess({ notes: data, sortOrderKey: notesSortKey }))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      yield put(error.response?.data.message)
    } else {
      yield put(loadNotesError((error as Error).message))
    }
  }
}

// 获取目录
function* fetchCategories(): SagaIterator {
  let data
  try {
    if (isDemo) {
      data = yield call(requestCategories)
    } else {
      data = (yield call(axios, '/api/sync/categories')).data
    }
    yield put(loadCategoriesSuccess(data))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      yield put(loadCategoriesError(error.response?.data.message))
    } else {
      yield put(loadCategoriesError((error as Error).message))
    }
  }
}

// 获取用户的设置
function* fetchSettings(): SagaIterator {
  let data
  try {
    data = yield call(requestSettings)

    yield put(loadSettingsSuccess(data))
  } catch (error) {
    yield put(loadSettingsError())
  }
}

// 同步数据
function* syncData({ payload }: SyncAction) {
  try {
    if (isDemo) {
      yield saveState(payload)
    } else {
      yield axios.post('/api/sync', payload)
    }
    yield put(syncSuccess(dayjs().format()))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      yield put(syncError(error.response?.data.message))
    } else {
      yield put(syncError((error as Error).message))
    }
  }
}

// 同步设置
function* syncSettings(): SagaIterator {
  try {
    const settings = yield select(getSettings)
    yield call(saveSettings, settings) // call(obj,transfer what)
  } catch (error) {}
}

// 如果发起了这些函数中的任何一个，就调用相应的 saga
function* rootSaga() {
  yield all([
    takeLatest(login.type, loginUser),
    takeLatest(logout.type, logoutUser),
    takeLatest(loadNotes.type, fetchNotes),
    takeLatest(loadCategories.type, fetchCategories),
    takeLatest(loadSettings.type, fetchSettings),
    takeLatest(sync.type, syncData),
    takeLatest(
      [
        toggleDarkTheme.type,
        togglePreviewMarkdown.type,
        updateCodeMirrorOption.type,
        toggleSettingsModal.type,
        updateNotesSortStrategy.type,
      ],
      syncSettings
    ),
  ])
}

export default rootSaga
