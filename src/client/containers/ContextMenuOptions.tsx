import React, { useContext } from 'react'
import { ArrowUp, Download, Star, Trash, X, Edit2, Clipboard } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { ContextMenuOption } from '@/components/NoteList/ContextMenuOption'
import { downloadNotes, isDraftNote, getShortUuid, copyToClipboard } from '@/utils/helpers'
import {
  deleteNotes,
  toggleFavoriteNotes,
  toggleTrashNotes,
  addCategoryToNote,
  updateActiveNote,
  swapFolder,
  removeCategoryFromNotes,
} from '@/slices/note'
import { getCategories, getNotes } from '@/selectors'
import { Folder, ContextMenuEnum } from '@/utils/enums'
import { CategoryItem, NoteItem } from '@/types'
import category, { setCategoryEdit, deleteCategory } from '@/slices/category'
import { MenuUtilitiesContext } from '@/containers/ContextMenu'

export interface ContextMenuOptionsProps {
  clickedItem: NoteItem | CategoryItem
  type: ContextMenuEnum
}
//创建ContextMenuOptions组件,根据传来的type不同，选择性展示CategoryOptions或NotesOptions
export const ContextMenuOptions: React.FC<ContextMenuOptionsProps> = ({ clickedItem, type }) => {
  if (type === 'CATEGORY') {
    return <CategoryOptions clickedCategory={clickedItem as CategoryItem} />
  } else {
    return <NotesOptions clickedNote={clickedItem as NoteItem} />
  }
}

interface CategoryOptionsProps {
  clickedCategory: CategoryItem
}

const CategoryOptions: React.FC<CategoryOptionsProps> = ({ clickedCategory }) => {
  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _deleteCategory = (categoryId: string) => dispatch(deleteCategory(categoryId))
  const _removeCategoryFromNotes = (categoryId: string) =>
    dispatch(removeCategoryFromNotes(categoryId))
  const _swapFolder = (folder: Folder) => dispatch(swapFolder({ folder }))
  const _setCategoryEdit = (categoryId: string, tempName: string) =>
    dispatch(setCategoryEdit({ id: categoryId, tempName }))

  // ===========================================================================
  // Context
  // ===========================================================================
  // 消费自定义的context(内部维护了一个setOptionsId函数)
  const { setOptionsId } = useContext(MenuUtilitiesContext)

  // ===========================================================================
  // Handlers
  // ===========================================================================
  // 处理重命名的函数
  const startRenameHandler = () => {
    // 设置状态的editingCategory的值为{clickedCategory.id, clickedCategory.name}
    _setCategoryEdit(clickedCategory.id, clickedCategory.name)
    // 重置optionId为空字符，不选中任何一个option
    setOptionsId('')
  }
  // 处理删除分类的函数
  const removeCategoryHandler = () => {
    // 提供一个id供action删除用
    _deleteCategory(clickedCategory.id)
    // 删除分类后，拿着id连带删除所有分类下的笔记
    _removeCategoryFromNotes(clickedCategory.id)
    // 切换文件夹，删除当前的，默认打开all并选中第一条笔记
    _swapFolder(Folder.ALL)
  }

  return (
    <nav className="options-nav" data-testid={TestID.CATEGORY_OPTIONS_NAV}>
      {/* 重命名option组件 */}
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_RENAME}
        handler={startRenameHandler}
        icon={Edit2}
        text={LabelText.RENAME}
      />
      {/* 删除option组件 */}
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_DELETE_PERMANENTLY}
        handler={removeCategoryHandler}
        icon={X}
        text={LabelText.DELETE_PERMANENTLY}
        optionType="delete"
      />
    </nav>
  )
}

interface NotesOptionsProps {
  clickedNote: NoteItem
}
//定义一个NotesOptions组件，传入一个clickedNote参数
const NotesOptions: React.FC<NotesOptionsProps> = ({ clickedNote }) => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { selectedNotesIds, notes } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  const selectedNotes = notes.filter((note) => selectedNotesIds.includes(note.id)) //返回的是新的笔记
  const isSelectedNotesDiffFavor = Boolean(
    selectedNotes.find((note) => note.favorite) && selectedNotes.find((note) => !note.favorite)
  )

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _deleteNotes = (noteIds: string[]) => dispatch(deleteNotes(noteIds))
  const _toggleTrashNotes = (noteId: string) => dispatch(toggleTrashNotes(noteId))
  const _toggleFavoriteNotes = (noteId: string) => dispatch(toggleFavoriteNotes(noteId))
  const _addCategoryToNote = (categoryId: string, noteId: string) =>
    dispatch(addCategoryToNote({ categoryId, noteId }))
  const _updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))

  // ===========================================================================
  // Handlers
  // ===========================================================================
  // 普遍封装了一下dispatch方便调用
  const deleteNotesHandler = () => _deleteNotes(selectedNotesIds)
  const downloadNotesHandler = () =>
    downloadNotes(
      selectedNotesIds.includes(clickedNote.id) ? selectedNotes : [clickedNote],
      categories
    )
  const favoriteNoteHandler = () => _toggleFavoriteNotes(clickedNote.id)
  const trashNoteHandler = () => _toggleTrashNotes(clickedNote.id)
  const removeCategoryFromNoteHandler = () => {
    _addCategoryToNote('', clickedNote.id)
    _updateActiveNote(clickedNote.id, false)
  }
  const copyLinkedNoteMarkdownHandler = (e: React.SyntheticEvent, note: NoteItem) => {
    e.preventDefault() //React的SyntheticEvent合成事件对象，用于阻止默认行为（浏览器对链接点击）

    const shortNoteUuid = getShortUuid(note.id) //获取笔记的简短版本
    copyToClipboard(`{{${shortNoteUuid}}}`) //使用模板字符串将简短版本包装后用copyToClipboard格式化后复制到剪贴板
    // 此{{uiid}}字符串是个引用点击可以打开笔记
  }

  return !isDraftNote(clickedNote) ? (
    <nav className="options-nav" data-testid={TestID.NOTE_OPTIONS_NAV}>
      {/* 如果打开的是垃圾箱中的笔记的... */}
      {clickedNote.trash && (
        <>
          <ContextMenuOption //展示删除option组件
            dataTestID={TestID.NOTE_OPTION_DELETE_PERMANENTLY}
            handler={deleteNotesHandler}
            icon={X}
            text={LabelText.DELETE_PERMANENTLY}
            optionType="delete"
          />
          <ContextMenuOption //展示恢复option组件
            dataTestID={TestID.NOTE_OPTION_RESTORE_FROM_TRASH}
            handler={trashNoteHandler}
            icon={ArrowUp}
            text={LabelText.RESTORE_FROM_TRASH}
          />
        </>
      )}
      {/* 如果不是属于草稿也不是垃圾箱的笔记 */}
      {!clickedNote.scratchpad && !clickedNote.trash && (
        <>
          <ContextMenuOption //展示下载、复制、移到垃圾箱option组件、按笔记状态展示取消、加入收藏夹的option组件
            dataTestID={TestID.NOTE_OPTION_FAVORITE}
            handler={favoriteNoteHandler}
            icon={Star}
            text={
              isSelectedNotesDiffFavor
                ? LabelText.TOGGLE_FAVORITE
                : clickedNote.favorite
                ? LabelText.REMOVE_FAVORITE
                : LabelText.MARK_AS_FAVORITE
            }
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_TRASH}
            handler={trashNoteHandler}
            icon={Trash}
            text={LabelText.MOVE_TO_TRASH}
            optionType="delete"
          />
        </>
      )}
      {clickedNote.category && !clickedNote.trash && (
        <ContextMenuOption
          dataTestID={TestID.NOTE_OPTION_REMOVE_CATEGORY}
          handler={removeCategoryFromNoteHandler}
          icon={X}
          text={LabelText.REMOVE_CATEGORY}
        />
      )}
      <ContextMenuOption
        dataTestID={TestID.NOTE_OPTION_DOWNLOAD}
        handler={downloadNotesHandler}
        icon={Download}
        text={LabelText.DOWNLOAD}
      />
      <ContextMenuOption
        dataTestID={TestID.COPY_REFERENCE_TO_NOTE}
        handler={(e: React.SyntheticEvent) => copyLinkedNoteMarkdownHandler(e, clickedNote)}
        icon={Clipboard}
        text={LabelText.COPY_REFERENCE_TO_NOTE}
      />
    </nav>
  ) : null
}
