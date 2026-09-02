import React from 'react'
import { ChevronDown, ChevronRight, Layers } from 'react-feather'
// 定义CollapseCategoryListButton组件的props类型
export interface CollapseCategoryListButton {
  dataTestID: string
  handler: () => void
  label: string
  isCategoryListOpen: boolean
  showIcon: boolean
}
// 定义CollapseCategoryListButton组件，泛型T为props的类型为了约束传过来的参数符不符合接口规范
export const CollapseCategoryListButton: React.FC<CollapseCategoryListButton> = ({
  dataTestID, //测试ID
  handler, //点击事件处理函数
  label, //按钮标签
  isCategoryListOpen, //分类列表是否展开
  showIcon, //是否显示图标
}) => {
  return (
    <button
      data-testid={dataTestID}
      className="collapse-button"
      onClick={handler}
      aria-label={label}
    >
      {showIcon ? (
        isCategoryListOpen ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )
      ) : (
        <Layers size={16} />
      )}
      <h2>分类</h2>
    </button>
  )
}
