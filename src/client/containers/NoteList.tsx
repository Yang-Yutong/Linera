import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MoreHorizontal, Book, Star, Folder as FolderIcon } from 'react-feather'

import { TestID } from '@resources/TestID'
import { Folder, Shortcuts, ContextMenuEnum } from '@/utils/enums'
import { NoteListButton } from '@/components/NoteList/NoteListButton'
import { SearchBar } from '@/components/NoteList/SearchBar'
import { ContextMenu } from '@/containers/ContextMenu'
import { getNoteTitle, shouldOpenContextMenu, debounceEvent, isDraftNote } from '@/utils/helpers'
import { useKey } from '@/utils/hooks'
import {
  permanentlyEmptyTrash,
  pruneNotes,
  updateActiveNote,
  searchNotes,
  updateSelectedNotes,
} from '@/slices/note'
import { NoteItem, ReactDragEvent, ReactMouseEvent } from '@/types'
import { getNotes, getSettings, getCategories } from '@/selectors'
import { getNotesSorter } from '@/utils/notesSortStrategies'

export const NoteList: React.FC = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { notesSortKey } = useSelector(getSettings)
  const { activeCategoryId, activeFolder, selectedNotesIds, notes, searchValue } =
    useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _updateSelectedNotes = (noteId: string, multiSelect: boolean) =>
    dispatch(updateSelectedNotes({ noteId, multiSelect }))
  const _permanentlyEmptyTrash = () => dispatch(permanentlyEmptyTrash())
  const _pruneNotes = () => dispatch(pruneNotes())
  const _updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))
  const _searchNotes = debounceEvent(
    (searchValue: string) => dispatch(searchNotes(searchValue)),
    100
  )

  // ===========================================================================
  // Refs
  // ===========================================================================

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // ===========================================================================
  // State
  // ===========================================================================

  const [optionsId, setOptionsId] = useState('')
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })
  // 创建正则表达式，对搜索的字符转义为空格，i:忽略大小写
  const re = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  //创建函数，判断笔记的标题是否匹配搜索的字符
  const isMatch = (result: NoteItem) => re.test(result.text) //返回过滤/格式化后的serachValue

  const filter: Record<Folder, (note: NoteItem) => boolean> = {
    //根据不同的文件夹类型提供不同的过滤函数，每个函数返回一个布尔值，决定笔记是否属于该文件夹
    [Folder.CATEGORY]: (note) => !note.trash && note.category === activeCategoryId,
    [Folder.SCRATCHPAD]: (note) => !!note.scratchpad,
    [Folder.FAVORITES]: (note) => !note.trash && !!note.favorite,
    [Folder.TRASH]: (note) => !!note.trash,
    [Folder.ALL]: (note) => !note.trash && !note.scratchpad,
  }

  const filteredNotes: NoteItem[] = notes
    .filter(filter[activeFolder]) //根据当前活动文件夹过滤笔记
    .filter(isMatch) //根据搜索条件进一步过滤
    .sort(getNotesSorter(notesSortKey)) //根据指定的排序键对结果排序

  // ===========================================================================
  // Handlers
  // ===========================================================================
  //处理聚焦搜索框的函数
  const focusSearchHandler = () => searchRef.current?.focus() //聚焦到搜索框
  //处理拖拽的函数
  const handleDragStart = (event: ReactDragEvent, noteId: string = '') => {
    event.stopPropagation() //阻止事件冒泡
    event.dataTransfer.setData('text/plain', noteId) //设置拖拽传递的数据nodeId以及数据类型（text/plain）
  }
  // 处理笔记选项点击事件的函数
  const handleNoteOptionsClick = (event: ReactMouseEvent, noteId: string = '') => {
    const clicked = event.target //获取被点击的元素

    // 如果元素不存在直接返回
    if (!clicked) return

    // 确保该元素是否应该打开contextmenu组件
    if (shouldOpenContextMenu(clicked as Element)) {
      // 如果事件对象包含pageX和pageY属性，则设置右键菜单的位置
      if ('pageX' in event && 'pageY' in event) {
        setOptionsPosition({ x: event.pageX, y: event.pageY })
      }
    }

    event.stopPropagation() //阻止事件冒泡
    // 如果菜单面板不存在或被点击的元素在面板外部
    if (!contextMenuRef.current || !contextMenuRef.current.contains(clicked as HTMLDivElement)) {
      //如果当前没有激活的菜单则激活当前笔记的菜单
      //如果当前有激活的菜单但不是当前笔记的，则切换到当前笔记的菜单
      //如果当前激活的菜单是当前笔记的，就关闭菜单
      setOptionsId(!optionsId || optionsId !== noteId ? noteId : '')
    }
  }
  // 处理笔记菜单面板右击的函数
  const handleNoteRightClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    noteId: string = ''
  ) => {
    event.preventDefault() // 阻止浏览器的默认右键菜单弹出
    const clicked = event.target // 获取被点击的元素
    const RIGHT_CLICK = 2 // 右键点击的鼠标按钮值为2

    // 如果点击事件没绑定任何元素就直接返回
    if (!clicked) return

    // 选中一个选项了且又右击点击了的时候直接返回0避免重复触发
    if (optionsId && event.button == RIGHT_CLICK) return
    //如果事件包含clientX和clientY属性，则将右键菜单的位置设置为点击的坐标
    if ('clientX' in event && 'clientY' in event) {
      setOptionsPosition({ x: event.clientX, y: event.clientY })
    }

    event.stopPropagation() // 阻止事件冒泡-避免触发父元素的事件处理
    // 如果菜单面板不存在或点击的是菜单内部元素
    if (!contextMenuRef.current || contextMenuRef.current.contains(clicked as HTMLDivElement)) {
      // 无论是没选中任何选项或当前选中的选项不是当前点击的笔记，设置当前笔记IDw为选中状态
      // 如果已经选中了当前笔记且选中它的菜单选项则清空选中状态，菜单关闭
      setOptionsId(!optionsId || optionsId !== noteId ? noteId : '')
    }
  }
  // 当当前激活的文件夹是垃圾箱时且垃圾箱中有笔记时显示清空垃圾箱的按钮 Empty
  const showEmptyTrash = activeFolder === Folder.TRASH && filteredNotes.length > 0

  // ===========================================================================
  // Hooks
  // ===========================================================================

  useEffect(() => {
    //监听鼠标点击事件，一旦发生点击，就调用处理笔记选项点击的函数
    document.addEventListener('mousedown', handleNoteOptionsClick)
    // 在组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('mousedown', handleNoteOptionsClick)
    }
  })
  // 自定义钩子函数useKey，用于监听快捷键 ctrl+alt+f 第二个参数为监听的事件发生执行的回调
  useKey(Shortcuts.SEARCH, () => focusSearchHandler())

  return (
    <aside className="note-sidebar">
      <div className="note-sidebar-header">
        {/* 搜索框组件 */}
        <SearchBar searchRef={searchRef} searchNotes={_searchNotes} />
        {showEmptyTrash && (
          // 展示清空回收箱的empty按钮
          <NoteListButton
            dataTestID={TestID.EMPTY_TRASH_BUTTON}
            label="Empty"
            handler={() => _permanentlyEmptyTrash()}
          >
            Empty Trash
          </NoteListButton>
        )}
      </div>
      <div data-testid={TestID.NOTE_LIST} className="note-list">
        {filteredNotes.map((note: NoteItem, index: number) => {
          // 获取笔记标题
          let noteTitle: string | React.ReactElement = getNoteTitle(note.text)
          // 获取笔记分类 note.id =category.id
          const noteCategory = categories.find((category) => category.id === note.category)
          //如果搜索框有值 -会获取一个带高亮的noteTitle
          if (searchValue) {
            //使用String.prototype.search()方法查找与正则表达式re匹配的第一个位置位置
            const highlightStart = noteTitle.search(re)
            //如果有匹配项，存在一个开始位置索引
            if (highlightStart !== -1) {
              // 计算匹配的结束位置 开始位置+搜索项的长度=结束位置
              const highlightEnd = highlightStart + searchValue.length

              noteTitle = (
                <>
                  {/* 未匹配上的标题部分正常显示 */}
                  {noteTitle.slice(0, highlightStart)}
                  {/* 标题和搜索匹配上的字符部分高亮显示 */}
                  <strong className="highlighted">
                    {noteTitle.slice(highlightStart, highlightEnd)}
                  </strong>
                  {noteTitle.slice(highlightEnd)}
                </>
              )
            }
          }

          return (
            <div
              data-testid={TestID.NOTE_LIST_ITEM + index}
              className={
                // 判断过滤后的笔记item是不是选中状态，如是保留选中时样式（蓝底）
                selectedNotesIds.includes(note.id) ? 'note-list-each selected' : 'note-list-each'
              }
              key={note.id}
              onClick={(event) => {
                event.stopPropagation() // 阻止事件冒泡
                _updateSelectedNotes(note.id, event.metaKey)
                _updateActiveNote(note.id, event.metaKey)
                _pruneNotes()
              }}
              onContextMenu={(event) => handleNoteRightClick(event, note.id)}
              // 如果笔记内容不为空，则允许拖动
              draggable={note.text !== ''}
              onDragStart={(event) => handleDragStart(event, note.id)}
            >
              <div className="note-list-outer">
                <div data-testid={'note-title-' + index} className="note-title">
                  {/* 若该笔记被收藏，展示收藏图标 */}
                  {note.favorite ? (
                    <>
                      <div className="icon">
                        <Star aria-hidden="true" className="note-favorite" size={12} />
                        <span className="sr-only">Favorite note</span>
                      </div>
                      <div className="truncate-text">{noteTitle}</div>
                    </>
                  ) : (
                    <>
                      {/* 没被收藏 */}
                      <div className="icon" />
                      <div className="truncate-text"> {noteTitle}</div>
                    </>
                  )}
                </div>
                {/* 若笔记不是草稿 */}
                {!isDraftNote(note) ? (
                  <div
                    // 把它添加到 NoteItem 对象时，根据索引生成 testID
                    data-testid={TestID.NOTE_OPTIONS_DIV + index}
                    className={optionsId === note.id ? 'note-options selected' : 'note-options'}
                    onClick={(event) => handleNoteOptionsClick(event, note.id)}
                  >
                    {/* 三点图标展示 */}
                    <MoreHorizontal aria-hidden="true" size={15} className="context-menu-action" />
                    <span className="sr-only">Note options</span>
                  </div>
                ) : (
                  // 若是草稿显示空格即可
                  <div className="note-options">&nbsp;</div>
                )}
              </div>
              {/* 激活的文件夹是笔记夹还是收藏夹 */}
              {(activeFolder === Folder.ALL || activeFolder === Folder.FAVORITES) && (
                <div className="note-category">
                  {/* 如果笔记非空字符串、空对象、非空数字等结果为true !true=false !!true=true
                  目的是为了把noteCategory变成布尔值 */}
                  {!!noteCategory ? (
                    <>
                      {/* 展示文件夹图标 */}
                      <FolderIcon size={12} className="context-menu-action" />
                      {/* 展示笔记的分类名 */}
                      {noteCategory?.name}
                    </>
                  ) : (
                    <>
                      {/* null或undefined，笔记的分类不存在，则显示默认的 "Notes" 文本和书图标 */}
                      <Book size={12} className="context-menu-action" />
                      Notes
                    </>
                  )}
                </div>
              )}
              {/* 如果激活的面板和当前笔记的id相等并且笔记不是草稿，则显示context-menu组件并传入参数 */}
              {optionsId === note.id && !isDraftNote(note) && (
                <ContextMenu
                  contextMenuRef={contextMenuRef}
                  item={note}
                  optionsPosition={optionsPosition}
                  setOptionsId={setOptionsId}
                  type={ContextMenuEnum.NOTE}
                />
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
