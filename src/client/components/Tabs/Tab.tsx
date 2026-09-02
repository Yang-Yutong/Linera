import React from 'react'
import { Icon } from 'react-feather'

export interface TabProps {
  label: string
  activeTab: string
  onClick: (label: string) => void
  icon: Icon
}

// 该组件用于确认图标是否激活，激活则添加active类名
export const Tab: React.FC<TabProps> = ({ activeTab, label, icon: IconCmp, onClick }) => {
  const className = activeTab === label ? 'tab active' : 'tab'

  return (
    <div role="button" key={label} className={className} onClick={() => onClick(label)}>
      <IconCmp size={18} className="mr-1" aria-hidden="true" focusable="false" /> {label}
    </div>
  )
}
