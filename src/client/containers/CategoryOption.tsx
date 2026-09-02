import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Draggable } from 'react-beautiful-dnd'
import { Folder as FolderIcon, MoreHorizontal } from 'react-feather'

import { TestID } from '@resources/TestID'
import { CategoryItem, ReactDragEvent, ReactMouseEvent, ReactSubmitEvent } from '@/types'
import { determineCategoryClass } from '@/utils/helpers'
import { getNotes, getCategories, getSettings } from '@/selectors'
import {
  updateActiveCategoryId,
  updateActiveNote,
  updateSelectedNotes,
  addCategoryToNote,
} from '@/slices/note'
import { setCategoryEdit, categoryDragLeave, categoryDragEnter } from '@/slices/category'
import { iconColor } from '@/utils/constants'
import { ContextMenuEnum } from '@/utils/enums'
import { getNotesSorter } from '@/utils/notesSortStrategies'
import { ContextMenu } from '@/containers/ContextMenu'

interface CategoryOptionProps {
  category: CategoryItem
  index: number
  contextMenuRef: React.RefObject<HTMLDivElement>
  handleCategoryMenuClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId?: string
  ) => void
  handleCategoryRightClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId?: string
  ) => void
  onSubmitUpdateCategory: (event: ReactSubmitEvent) => void
  optionsPosition: { x: number; y: number }
  optionsId: string
  setOptionsId: React.Dispatch<React.SetStateAction<string>>
}

export const CategoryOption: React.FC<CategoryOptionProps> = ({
  category,
  index,
  contextMenuRef,
  handleCategoryMenuClick,
  handleCategoryRightClick,
  onSubmitUpdateCategory,
  optionsPosition,
  optionsId,
  setOptionsId,
}) => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { activeCategoryId, notes } = useSelector(getNotes)
  const {
    editingCategory: { id: editingCategoryId, tempName: tempCategoryName },
  } = useSelector(getCategories)
  const { notesSortKey } = useSelector(getSettings)

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _updateActiveCategoryId = (categoryId: string) =>
    dispatch(updateActiveCategoryId(categoryId))
  const _updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))
  const _updateSelectedNotes = (noteId: string, multiSelect: boolean) =>
    dispatch(updateSelectedNotes({ noteId, multiSelect }))
  const _setCategoryEdit = (categoryId: string, tempName: string) =>
    dispatch(setCategoryEdit({ id: categoryId, tempName }))
  const _addCategoryToNote = (categoryId: string, noteId: string) =>
    dispatch(addCategoryToNote({ categoryId, noteId }))
  const _categoryDragEnter = (category: CategoryItem) => dispatch(categoryDragEnter(category))
  const _categoryDragLeave = (category: CategoryItem) => dispatch(categoryDragLeave(category))

  return (
    <Draggable draggableId={category.id} index={index}>
      {(draggableProvided, snapshot) => (
        <div
          {...draggableProvided.dragHandleProps}
          {...draggableProvided.draggableProps}
          ref={draggableProvided.innerRef}
          data-testid={TestID.CATEGORY_LIST_DIV}
          className={determineCategoryClass(category, snapshot.isDragging, activeCategoryId)}
          //点击分类item时
          onClick={() => {
            const notesForNewCategory = notes
              .filter((note) => !note.trash && note.category === category.id)
              .sort(getNotesSorter(notesSortKey))
            //设置默认激活笔记的Id,如果新分类下的笔记数量大于0，则默认激活的是分类下的第一个笔记，否则默认激活为空
            const defaultActiveNoteId =
              notesForNewCategory.length > 0 ? notesForNewCategory[0].id : ''
            // 当前点击的分类与激活的分类Id不同，更新激活的分类
            if (category.id !== activeCategoryId) {
              _updateActiveCategoryId(category.id) //更新激活分类的id
              _updateActiveNote(defaultActiveNoteId, false) //更新激活的笔记（传入默认的笔记id）
              _updateSelectedNotes(defaultActiveNoteId, false) //更新选中的笔记（传入默认的笔记id）
            }
          }}
          //双击分类item时，调用常量函数触发dispatch编辑分类名
          onDoubleClick={() => {
            _setCategoryEdit(category.id, category.name)
          }}
          //失焦时（鼠标从监听的元素上移开）重置笔记编辑状态
          onBlur={() => {
            _setCategoryEdit('', '')
          }}
          // 元素放置过来时，添加过来的笔记到当前分类
          onDrop={(event) => {
            event.preventDefault() //阻止默认事件

            _addCategoryToNote(category.id, event.dataTransfer.getData('text'))
            //触发分类拖拽着离开的dispatch
            _categoryDragLeave(category)
          }}
          onDragOver={(event: ReactDragEvent) => event.preventDefault()}
          onDragEnter={() => _categoryDragEnter(category)}
          onDragLeave={() => _categoryDragLeave(category)}
          onContextMenu={(event) => handleCategoryRightClick(event, category.id)}
        >
          <form
            className="category-list-name"
            onSubmit={(event) => {
              event.preventDefault()
              _setCategoryEdit('', '')
              onSubmitUpdateCategory(event)

              if (optionsId) setOptionsId('')
            }}
          >
            <FolderIcon size={15} className="app-sidebar-icon" color={iconColor} />
            {editingCategoryId === category.id ? (
              <input
                data-testid={TestID.CATEGORY_EDIT}
                className="category-edit"
                type="text"
                autoFocus
                maxLength={20}
                value={tempCategoryName}
                onChange={(event) => {
                  _setCategoryEdit(editingCategoryId, event.target.value)
                }}
                onBlur={(event) => onSubmitUpdateCategory(event)}
              />
            ) : (
              category.name
            )}
          </form>
          <div
            data-testid={TestID.MOVE_CATEGORY}
            className={optionsId === category.id ? 'category-options active' : 'category-options'}
            onClick={(event) => handleCategoryMenuClick(event, category.id)}
          >
            <MoreHorizontal size={15} className="context-menu-action" />
          </div>
          {optionsId === category.id && (
            //自定义容器组件ContextMenu菜单面板，传入分类item，菜单位置，设置菜单id，菜单类型
            <ContextMenu
              contextMenuRef={contextMenuRef}
              item={category}
              optionsPosition={optionsPosition}
              setOptionsId={setOptionsId}
              type={ContextMenuEnum.CATEGORY}
            />
          )}
        </div>
      )}
    </Draggable>
  )
}
