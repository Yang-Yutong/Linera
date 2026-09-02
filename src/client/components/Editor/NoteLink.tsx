import React from 'react'

import { NoteItem } from '@/types'
import { Errors } from '@/utils/enums'
import { TestID } from '@resources/TestID'

import { getNoteTitle, getActiveNoteFromShortUuid } from '../../utils/helpers'

export interface NoteLinkProps {
  uuid: string
  notes: NoteItem[]
  handleNoteLinkClick: (e: React.SyntheticEvent, note: NoteItem) => void
}

const NoteLink: React.FC<NoteLinkProps> = ({ notes, uuid, handleNoteLinkClick }) => {
  //根据简短uuid确定要跳转的笔记Item
  const note = getActiveNoteFromShortUuid(notes, uuid)
  // 根据笔记内容获取笔记标题
  const title = note !== undefined ? getNoteTitle(note.text) : null
  //笔记存在且标题不空
  if (note && title)
    return (
      // 展示链接
      <a data-testid={TestID.NOTE_LINK_SUCCESS} onClick={(e) => handleNoteLinkClick(e, note)}>
        {title}
      </a>
    )

  return (
    // 展示错误信息
    <span data-testid={TestID.NOTE_LINK_ERROR} className="error">
      {Errors.INVALID_LINKED_NOTE_ID}
    </span>
  )
}

export default NoteLink
