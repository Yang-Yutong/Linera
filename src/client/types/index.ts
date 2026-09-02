import React from 'react'

import { Folder, NotesSortKey } from '@/utils/enums'
import { sync } from '@/slices/sync'

//==============================================================================
// Items 笔记和分类的结构
//==============================================================================
// 定义笔记实体
export interface NoteItem {
  id: string // 笔记id
  text: string // 笔记内容
  created: string // 创建时间
  lastUpdated: string // 最后更新时间
  /**
   * Refers to the category UUID and not the actual name.
   */
  category?: string // 分类id
  scratchpad?: boolean // 是否为草稿
  trash?: boolean // 是否放进垃圾箱
  favorite?: boolean // 是否为收藏
}
// 定义分类实体
export interface CategoryItem {
  id: string // 分类id
  name: string // 分类名称
  draggedOver: boolean // 是否被拖拽
}
// 定义用户实体
export interface GithubUser {
  [anyProp: string]: any // 用户信息任意
}

//==============================================================================
// State
//==============================================================================
// 定义认证状态
export interface AuthState {
  loading: boolean // 是否正在加载
  currentUser: GithubUser //上一次用户
  isAuthenticated: boolean // 是否认证
  error?: string // 错误信息
}
// 定义分类状态
export interface CategoryState {
  categories: CategoryItem[] // 分类列表
  error: string // 错误信息
  loading: boolean // 是否正在加载
  editingCategory: {
    // 编辑中的分类-待被创建出来
    id: string // 分类id
    tempName: string // 临时名称
  }
}
// 定义笔记状态
export interface NoteState {
  notes: NoteItem[] // 笔记列表
  activeFolder: Folder // 当前激活的文件夹
  activeNoteId: string // 当前激活的笔记id
  selectedNotesIds: string[] // 当前选中的笔记id
  activeCategoryId: string // 当前激活的分类id
  error: string // 错误信息
  loading: boolean // 是否正在加载
  searchValue: string // 搜索值 ？？？？
}
// 定义设置状态
export interface SettingsState {
  isOpen: boolean // 是否设置的模态框打开
  previewMarkdown: boolean // 是否预览markdown模式打开啊
  loading: boolean // 是否正在加载
  darkTheme: boolean // 是否为暗黑模式
  sidebarVisible: boolean // 是否显示侧边栏
  notesSortKey: NotesSortKey // 笔记排序键，按照什么顺序排序
  codeMirrorOptions: { [key: string]: any } // CodeMirror配置？？？
}

// 定义同步状态
export interface SyncState {
  syncing: boolean // 是否正在同步
  lastSynced: string // 上一次同步时间
  error: string // 错误信息
  pendingSync: boolean //正在等待同步
}
// 定义根状态
export interface RootState {
  authState: AuthState // 认证状态
  categoryState: CategoryState // 分类状态
  noteState: NoteState // 笔记状态
  settingsState: SettingsState // 设置状态
  syncState: SyncState // 同步状态
}

//==============================================================================
// API
//==============================================================================
// 定义同步payload接口，是数据传输对象接口，需要同步的数据是分类和笔记列表
export interface SyncPayload {
  categories: CategoryItem[] // 分类列表
  notes: NoteItem[] // 笔记列表
}
// 定义同步action接口 动作类型+要使用的数据信息
export interface SyncAction {
  type: typeof sync.type // 动作类型：同步
  payload: SyncPayload // 要使用的数据信息
}

//==============================================================================
// Events
//==============================================================================
// 定义拖拽事件
export type ReactDragEvent = React.DragEvent<HTMLDivElement>
// 定义鼠标事件的联合类型
export type ReactMouseEvent =
  | MouseEvent //浏览器的原生事件，不绑定任何HTML元素，直接绑定在window对象上
  | React.MouseEvent<HTMLDivElement> //React的鼠标事件，代表在<div>上发生的鼠标事件
  | React.ChangeEvent<HTMLSelectElement> // React的事件类型，代表在<select>上发生的变更事件例如：选择一个选项、打开下拉框
//定义提交事件的联合类型 ，代表在<form>上发生的提交事件或是在<input>上发生的聚焦事件
export type ReactSubmitEvent = React.FormEvent<HTMLFormElement> | React.FocusEvent<HTMLInputElement>

//==============================================================================
// Default Types
//==============================================================================
//用来定义T+payload的action类型，T是泛型，payload是数据传输对象
// Taken from TypeScript private declared type within Actions
export type WithPayload<P, T> = T & {
  payload: P
}
