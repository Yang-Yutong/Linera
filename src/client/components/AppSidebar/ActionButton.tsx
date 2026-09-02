import React, { MouseEventHandler } from 'react'
import { Icon } from 'react-feather'

import { iconColor } from '@/utils/constants'

export interface ActionButtonProps {
  dataTestID: string
  disabled?: boolean
  handler: MouseEventHandler
  icon: Icon // icon属性的类型为feather来的图标组件，类型名为Icon
  label: string
  text: string
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  dataTestID,
  disabled = false, // 设置为false
  handler,
  icon: IconCmp, // 重名命属性icon
  label,
  text,
}) => {
  return (
    <button
      data-testid={dataTestID}
      className="action-button"
      aria-label={label}
      onClick={handler}
      disabled={disabled}
      title={label}
    >
      <IconCmp
        size={18}
        className="action-button-icon"
        color={iconColor}
        aria-hidden="true"
        focusable="false"
      />
      <span>{text}</span>
    </button>
  )
}
