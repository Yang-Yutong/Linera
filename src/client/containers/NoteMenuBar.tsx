import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Eye,
  Edit,
  Star,
  Trash2,
  Download,
  RefreshCw,
  Loader,
  Settings,
  Sun,
  Moon,
  Clipboard as ClipboardCmp,
} from 'react-feather'

import { TestID } from '@resources/TestID'
import { LastSyncedNotification } from '@/components/LastSyncedNotification'
import { NoteItem, CategoryItem } from '@/types'
import {
  toggleSettingsModal,
  togglePreviewMarkdown,
  toggleDarkTheme,
  updateCodeMirrorOption,
} from '@/slices/settings'
import { toggleFavoriteNotes, toggleTrashNotes } from '@/slices/note'
import { getCategories, getNotes, getSync, getSettings } from '@/selectors'
import { downloadNotes, isDraftNote, getShortUuid, copyToClipboard } from '@/utils/helpers'
import { sync } from '@/slices/sync'

export const NoteMenuBar = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { notes, activeNoteId } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)
  const { syncing, lastSynced, pendingSync } = useSelector(getSync)
  const { darkTheme } = useSelector(getSettings)

  // ===========================================================================
  // Other
  // ===========================================================================
  // 粘贴图标
  const copyNoteIcon = <ClipboardCmp size={18} aria-hidden="true" focusable="false" />
  //粘贴成功的提示文本
  const successfulCopyMessage = 'Note copied!'
  const activeNote = notes.find((note) => note.id === activeNoteId)!
  //获取截短的[0,5]的六位uuid
  const shortNoteUuid = getShortUuid(activeNoteId)

  // ===========================================================================
  // State
  // ===========================================================================

  const [uuidCopiedText, setUuidCopiedText] = useState<string>('')
  const [isToggled, togglePreviewIcon] = useState<boolean>(false)

  // ===========================================================================
  // Hooks
  // ===========================================================================

  useEffect(() => {
    // 粘贴成功后显示提示文本并把提示文本显示三秒后重置该变量
    if (uuidCopiedText === successfulCopyMessage) {
      const timer = setTimeout(() => {
        //重置
        setUuidCopiedText('')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [uuidCopiedText])

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _togglePreviewMarkdown = () => dispatch(togglePreviewMarkdown())
  const _toggleTrashNotes = (noteId: string) => dispatch(toggleTrashNotes(noteId))
  const _toggleFavoriteNotes = (noteId: string) => dispatch(toggleFavoriteNotes(noteId))
  const _sync = (notes: NoteItem[], categories: CategoryItem[]) =>
    dispatch(sync({ notes, categories }))
  const _toggleSettingsModal = () => dispatch(toggleSettingsModal())
  const _toggleDarkTheme = () => dispatch(toggleDarkTheme())
  const _updateCodeMirrorOption = (key: string, value: any) =>
    dispatch(updateCodeMirrorOption({ key, value }))

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const downloadNotesHandler = () => downloadNotes([activeNote], categories)
  const favoriteNoteHandler = () => _toggleFavoriteNotes(activeNoteId)
  const trashNoteHandler = () => _toggleTrashNotes(activeNoteId)
  const syncNotesHandler = () => _sync(notes, categories)
  const settingsHandler = () => _toggleSettingsModal()
  const toggleDarkThemeHandler = () => {
    _toggleDarkTheme()
    _updateCodeMirrorOption('theme', darkTheme ? 'base16-light' : 'new-moon') //更新编辑区主题名和主题样式为new-moon
  }
  const togglePreviewHandler = () => {
    //切换图标
    togglePreviewIcon(!isToggled)
    //切换预览模式
    _togglePreviewMarkdown()
  }

  return (
    <section className="note-menu-bar">
      {activeNote && !isDraftNote(activeNote) ? (
        <nav>
          <button
            className="note-menu-bar-button"
            onClick={togglePreviewHandler}
            data-testid={TestID.PREVIEW_MODE}
          >
            {isToggled ? (
              // 显示编辑图标
              <Edit aria-hidden="true" size={18} />
            ) : (
              // 显示预览图标
              <Eye aria-hidden="true" size={18} />
            )}
            <span className="sr-only">{isToggled ? 'Edit note' : 'Preview note'}</span>
          </button>
          {/* 当前激活笔记不是草稿，展示收藏、垃圾箱图标 */}
          {!activeNote.scratchpad && (
            <>
              <button className="note-menu-bar-button" onClick={favoriteNoteHandler}>
                <Star aria-hidden="true" size={18} />
                <span className="sr-only">Add note to favorites</span>
              </button>
              <button className="note-menu-bar-button trash" onClick={trashNoteHandler}>
                <Trash2 aria-hidden="true" size={18} />
                {/* sr-only意味只在源码中显示，不显示在页面上 */}
                <span className="sr-only">Delete note</span>
              </button>
            </>
          )}
          {/* 下载和粘贴图标以及处理函数绑定 */}
          <button className="note-menu-bar-button">
            <Download aria-hidden="true" size={18} onClick={downloadNotesHandler} />
            <span className="sr-only">Download note</span>
          </button>
          <button
            className="note-menu-bar-button uuid"
            onClick={() => {
              copyToClipboard(`{{${shortNoteUuid}}}`)
              setUuidCopiedText(successfulCopyMessage)
            }}
            data-testid={TestID.UUID_MENU_BAR_COPY_ICON}
          >
            {copyNoteIcon}
            {uuidCopiedText && <span className="uuid-copied-text">{uuidCopiedText}</span>}
            <span className="sr-only">Copy note</span>
          </button>
        </nav>
      ) : (
        // 激活且是草稿，不展示菜单栏
        <div />
      )}
      <nav>
        <LastSyncedNotification datetime={lastSynced} pending={pendingSync} syncing={syncing} />
        <button
          className="note-menu-bar-button"
          onClick={syncNotesHandler}
          data-testid={TestID.TOPBAR_ACTION_SYNC_NOTES}
        >
          {syncing ? (
            // 正在同步展示加载图标，否则展示刷新图标
            <Loader aria-hidden="true" size={18} className="rotating-svg" />
          ) : (
            <RefreshCw aria-hidden="true" size={18} />
          )}
          <span className="sr-only">Sync notes</span>
        </button>
        <button className="note-menu-bar-button" onClick={toggleDarkThemeHandler}>
          {/* 暗色主题开了吗，开了展示太阳图标否则展示月亮图标 */}
          {darkTheme ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
          <span className="sr-only">Themes</span>
        </button>
        {/* 展示设置图标 */}
        <button className="note-menu-bar-button" onClick={settingsHandler}>
          <Settings aria-hidden="true" size={18} />
          <span className="sr-only">Settings</span>
        </button>
      </nav>
    </section>
  )
}
