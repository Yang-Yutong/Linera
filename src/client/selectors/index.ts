import { RootState } from '@/types' //导入根状态类型

export const getSettings = (state: RootState) => state.settingsState //获取跟状态下的设置状态
export const getCategories = (state: RootState) => state.categoryState //获取跟状态下的分类状态
export const getNotes = (state: RootState) => state.noteState //获取跟状态下的笔记状态
export const getSync = (state: RootState) => state.syncState //获取跟状态下的同步状态
export const getAuth = (state: RootState) => state.authState //获取跟状态下的认证状态
