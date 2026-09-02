import React, { useState } from 'react'
import { Book, Star, Trash2 } from 'react-feather'

import { Folder } from '@/utils/enums'
import { iconColor } from '@/utils/constants'
import { ReactDragEvent } from '@/types'

// 定义文件夹选项组件的属性接口
export interface FolderOptionProps {
  text: string // 文件夹名称
  active: boolean // 是否为当前选中的文件夹
  dataTestID: string // 用于测试的ID
  folder: Folder // 文件夹类型
  swapFolder: (folder: Folder) => void // 切换文件夹
  addNoteType: (noteId: string) => void // 添加笔记到某文件夹
}

//定义受控组件，数据来源于父组件
export const FolderOption: React.FC<FolderOptionProps> = ({
  // props传来的参数
  text, // 文件夹名称
  active, // 是否为当前选中的文件夹
  dataTestID, // 用于测试的ID
  folder, // 文件夹类型
  swapFolder, // 切换文件夹
  addNoteType, // 添加笔记到某文件夹
}) => {
  // ===========================================================================
  // useState是React提供给组件内部管理状态的Hook函数，接收一个初始化值，返回一个数组，第一个元素是当前状态值，第二个元素是更新状态的函数
  // ===========================================================================
  const [mainSectionDragState, setMainSectionDragState] = useState({
    // 管理了该组件的拖拽状态
    [Folder.ALL]: false,
    [Folder.FAVORITES]: false,
    [Folder.SCRATCHPAD]: false,
    [Folder.TRASH]: false,
    [Folder.CATEGORY]: false,
  })
  const dragEnterHandler = () => {
    // 针对当前文件夹，当拖拽进入时，设置mainSectionDragState的[currentFloder]为true
    setMainSectionDragState({ ...mainSectionDragState, [folder]: true })
  }
  const dragLeaveHandler = () => {
    // 针对当前文件夹，当拖拽离开时，设置mainSectionDragState的[currentFloder]为false
    setMainSectionDragState({ ...mainSectionDragState, [folder]: false })
  }
  // 笔记拖拽事件的处理函数
  const noteHandler = (event: ReactDragEvent) => {
    event.preventDefault() // 阻止默认行为
    // 获取拖拽的数据，即笔记的NoteID
    addNoteType(event.dataTransfer.getData('text'))
    //拖拽结束，设置mainSectionDragState的[currentFloder]为false
    dragLeaveHandler()
  }
  // 根据传过来的active决定当前文件夹是否为选中的激活状态
  const determineClass = () => {
    if (active) {
      return 'app-sidebar-link active'
    } else if (mainSectionDragState[folder]) {
      // 当拖拽进入当前文件夹 显示拖拽样式-鼠标没有松开
      return 'app-sidebar-link dragged-over'
    } else {
      // 否则展示默认样式
      return 'app-sidebar-link'
    }
  }
  // 根据传来的文件夹类型决定展示的图标
  const renderIcon = () => {
    if (folder === 'FAVORITES') {
      return <Star size={15} className="app-sidebar-icon" color={iconColor} />
    } else if (folder === 'ALL') {
      return <Book size={15} className="app-sidebar-icon" color={iconColor} />
    } else {
      return <Trash2 size={15} className="app-sidebar-icon" color={iconColor} />
    }
  }

  return (
    <button
      onClick={() => {
        swapFolder(folder)
      }}
      className="app-sidebar-wrapper"
    >
      <div
        data-testid={dataTestID}
        className={determineClass()}
        onDrop={noteHandler}
        onDragOver={(event: ReactDragEvent) => {
          event.preventDefault()
        }}
        onDragEnter={dragEnterHandler}
        onDragLeave={dragLeaveHandler}
      >
        {renderIcon()}
        {text}
      </div>
    </button>
  )
}
