import React, { useEffect } from 'react' // 导入React核心库和useEffect钩子
import { useDispatch, useSelector } from 'react-redux' // useDispatch用于派发action，useSelector用于获取state
import { Helmet, HelmetProvider } from 'react-helmet-async' // HelmetProvider为Helmet提供上下文,该库用于管理文档头部
import { DragDropContext, DropResult } from 'react-beautiful-dnd' // 支持拖拽，DropResult为拖拽后的回调函数
import SplitPane from 'react-split-pane' //创建分割面板
import dayjs from 'dayjs' // 时间库
import localizedFormat from 'dayjs/plugin/localizedFormat' //dayjs的插件localizedFormat，用于本地格式化时间

import { AppSidebar } from '@/containers/AppSidebar' //应用侧边栏
import { KeyboardShortcuts } from '@/containers/KeyboardShortcuts' //键盘快捷键
import { NoteEditor } from '@/containers/NoteEditor' //笔记编辑器
import { NoteList } from '@/containers/NoteList' //笔记列表
import { SettingsModal } from '@/containers/SettingsModal' //设置模态框
import { TempStateProvider } from '@/contexts/TempStateContext' //临时状态上下文
import { useInterval, useBeforeUnload } from '@/utils/hooks' //自定义hook
import {
  getWebsiteTitle, // 获取网站标题
  determineAppClass, //确定应用类名
  getActiveCategory, // 获取活动分类
  getDayJsLocale, // 获取dayjs的语言
  getNoteBarConf, // 获取笔记栏配置
} from '@/utils/helpers'
import { loadCategories, swapCategories } from '@/slices/category' // 导入loadCategories和swapCategories action
import { sync } from '@/slices/sync' //导入sync action
import { NoteItem, CategoryItem } from '@/types' //导入NoteItem和CategoryItem类型
import { loadNotes } from '@/slices/note' // 导入loadNotes action
import { loadSettings } from '@/slices/settings' //导入loadSettings action
import { getSettings, getNotes, getCategories, getSync } from '@/selectors' //导入getSettings、getNotes、getCategories和getSync获取各种状态

dayjs.extend(localizedFormat) // 为dayjs注册localizedFormat插件
dayjs.locale(getDayJsLocale(navigator.language)) //根据浏览器语言动态设置dayjs的语言，从而让日期显示符合用户的习惯

//导出主页面组件
export const TakeNoteApp: React.FC = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { darkTheme, sidebarVisible } = useSelector(getSettings) // 获取设置状态里的darkTheme和sidebarVisible
  const { activeFolder, activeCategoryId, notes } = useSelector(getNotes) //获取笔记状态里的activeFolder、activeCategoryId和notes
  const { categories } = useSelector(getCategories) // 从分类状态中拿到categories，分类状态中的数据从store中拿取
  const { pendingSync } = useSelector(getSync) // 获取同步状态里的pendingSync

  const activeCategory = getActiveCategory(categories, activeCategoryId) //借助helpers里的getActiveCategory函数,传入分类的数组和激活的分类id，返回激活的分类

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch() // 返回store.dispatch函数，用于派发action

  const _loadNotes = () => dispatch(loadNotes()) // 派发loadNotes action，用于加载笔记
  const _loadCategories = () => dispatch(loadCategories()) // 派发loadCategories action，用于加载分类
  const _loadSettings = () => dispatch(loadSettings()) // 派发loadSettings action，用于加载设置
  const _swapCategories = (categoryId: number, destinationId: number) =>
    dispatch(swapCategories({ categoryId, destinationId })) // 派发swapCategories action，用于交换分类
  const _sync = (notes: NoteItem[], categories: CategoryItem[]) =>
    dispatch(sync({ notes, categories })) // 接收notes和categories参数，派发sync action，用于同步

  // ===========================================================================
  // Handlers
  // ===========================================================================

  /**
   * 拖拽结束事件处理函数
   * @param {DropResult} result - 拖拽操作的结果对象，包含源位置和目标位置信息
   */
  const onDragEnd = (result: DropResult) => {
    // 从结果对象中解构出目标位置和源位置
    const { destination, source } = result

    // 如果没有目标位置（如拖拽到可放置区域外），则直接返回
    if (!destination) return

    // 如果目标位置和源位置相同（即没有移动），则直接返回
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // 如果拖拽类型是'CATEGORY'，则调用交换分类位置的函数
    if (result.type === 'CATEGORY') {
      _swapCategories(source.index, destination.index)
    }
  }

  // ===========================================================================
  // Hooks
  // ===========================================================================

  // 使用 useEffect 钩子组件在组件挂载时执行初始化操作
  useEffect(() => {
    // 调用加载笔记列表的函数
    _loadNotes()
    // 调用加载分类列表的函数
    _loadCategories()
    // 调用加载设置信息的函数
    _loadSettings()
  }, []) // 空依赖数组表示此 useEffect 只在组件首次渲染时执行一次

  // 使用自定义的useInterval钩子，设置一个定时器
  // 每隔50000毫秒（即50秒）执行一次_sync函数
  // _sync函数接收notes和categories两个参数，用于同步数据
  useInterval(() => {
    _sync(notes, categories)
  }, 50000)
  // 自定义Hook，用于在页面卸载前执行一些操作，如果pendingSync为true，表示有数据没同步，则阻止页面卸载
  useBeforeUnload((event: BeforeUnloadEvent) => (pendingSync ? event.preventDefault() : null))

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{getWebsiteTitle(activeFolder, activeCategory)}</title>
        <link rel="canonical" href="https://takenote.dev" />
      </Helmet>

      <TempStateProvider>
        <div className={determineAppClass(darkTheme, sidebarVisible, activeFolder)}>
          <DragDropContext onDragEnd={onDragEnd}>
            <SplitPane split="vertical" minSize={150} maxSize={500} defaultSize={240}>
              <AppSidebar />
              <SplitPane split="vertical" {...getNoteBarConf(activeFolder)}>
                <NoteList />
                <NoteEditor />
              </SplitPane>
            </SplitPane>
          </DragDropContext>
          <KeyboardShortcuts />
          <SettingsModal />
        </div>
      </TempStateProvider>
    </HelmetProvider>
  )
}
