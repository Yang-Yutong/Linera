import ReactDOM from 'react-dom'
import React, { useEffect, useState, createContext, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { SelectCategory } from '@/components/NoteList/SelectCategory'
import { ContextMenuOptions } from '@/containers/ContextMenuOptions'
import { addCategoryToNote, updateActiveCategoryId, updateActiveNote } from '@/slices/note'
import { NoteItem, CategoryItem } from '@/types'
import { getNotes, getCategories, getSettings } from '@/selectors'
import { ContextMenuEnum } from '@/utils/enums'
import { isDraftNote } from '@/utils/helpers'

// 定义上下文对象context便于组件间共享状态，用于在组件间传递选项的id,可空值菜单项高亮等交互行为
export const MenuUtilitiesContext = createContext({
  setOptionsId: (id: string) => {},
})

//该Position接口可用于定位菜单项的位置
interface Position {
  x: number
  y: number
}
//定义上下文菜单的参数泛型
export interface ContextMenuProps {
  item: NoteItem | CategoryItem
  optionsPosition: Position
  contextMenuRef: React.RefObject<HTMLDivElement> | null
  setOptionsId: (id: string) => void
  type: ContextMenuEnum
}
//定义上下文菜单组件
export const ContextMenu: React.FC<ContextMenuProps> = ({
  item,
  optionsPosition,
  contextMenuRef,
  setOptionsId,
  type,
}) => {
  // ===========================================================================
  // Selectors
  // ===========================================================================
  // 获取设置状态中的darkTheme，系统的主题模式
  const { darkTheme } = useSelector(getSettings)

  // ===========================================================================
  // State
  // ===========================================================================
  // 定义一个状态变量elementDimensions，用于存储菜单项的尺寸
  const [elementDimensions, setElementDimensions] = useState<{
    offsetHeight: number | null //泛型约束变量中属性的类型
    offsetWidth: number | null
  }>({ offsetHeight: null, offsetWidth: null }) //初始尺寸为null

  // ===========================================================================
  // Hooks
  // ===========================================================================
  // 当contextMenuRef发生变化时，更新elementDimensions即元素的尺寸
  useEffect(() => {
    //如果contextMenuRef存在并且有current属性有值-->绑定上了dom元素
    if (contextMenuRef?.current) {
      const { offsetHeight, offsetWidth } = contextMenuRef.current //获取元素的尺寸
      setElementDimensions({ offsetHeight, offsetWidth }) //更新菜单面板元素的位置
    }
  }, [contextMenuRef])

  // ===========================================================================
  // Other
  // ===========================================================================

  const contextValues = useMemo(() => ({ setOptionsId }), [setOptionsId])
  // 碰撞检测
  const getOptionsYPosition = (): Number => {
    //// 1. 检查菜单元素是否已经测量出尺寸（如果还没渲染出来，宽高为 null，直接返回 0）
    if (elementDimensions.offsetHeight || elementDimensions.offsetWidth) {
      // 2. 获取窗口的高度
      const MaxY = window.innerHeight
      // 3. 获取菜单面板元素的位置
      const optionsSize = elementDimensions.offsetHeight as number

      //如果窗口高度-鼠标点击处y坐标>菜单元素高度
      return MaxY - optionsPosition.y > optionsSize
        ? optionsPosition.y //返回鼠标点击处y坐标（够放，以鼠标的y坐标向下展开）
        : optionsPosition.y - optionsSize //鼠标点击处y坐标-菜单高度（不够放，向上展开）
    }

    return 0
  }
  // ===========================================================================
  // react-dom库提供的 API createPortal(待渲染的组件,目标节点)
  // 作用：将一个组件渲染到DOM节点的任意位置，用于传送类组件
  // 方法返回一个React元素即jsx,该元素可渲染到DOM的任意节点
  // 应用场景：弹窗、下拉或右键菜单、模态框modal、全局提示、全局遮罩、全局Loading
  // 用Html+css手搓弹窗时，弹窗位置依赖外层的position：relative,外层没该属性，弹框位置相对Body而言而非外层盒子，故此弹窗不稳定
  // 或者弹窗内部使用positon:fixed也可稳定弹窗位置，但fixed默认是相对于浏览器窗口
  // 但如果父级设置了transform、perspective、filter属性非 none 时，就会相对于父级进行定位，这样就会导致Modal组件定位不准确
  // 总之更推荐使用createPortal，更加稳定和灵活
  // ===========================================================================
  return ReactDOM.createPortal(
    <div className={type === ContextMenuEnum.CATEGORY || darkTheme ? 'dark' : ''}>
      <div
        ref={contextMenuRef}
        className="options-context-menu"
        style={{
          visibility: getOptionsYPosition() ? 'visible' : 'hidden',
          position: 'absolute',
          top: getOptionsYPosition() + 'px',
          left: optionsPosition.x + 'px',
        }}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        {/* contextProvider提供context和value供所有子组件向上搜索着使用避免逐层传递props */}
        <MenuUtilitiesContext.Provider value={contextValues}>
          {type === ContextMenuEnum.CATEGORY ? (
            <CategoryMenu category={item as CategoryItem} />
          ) : (
            // 虽然这里setOptionsId是直接拿的，但provider里维护的vlaue(setOptionsId)可在任意子组件中拿到
            <NotesMenu note={item as NoteItem} setOptionsId={setOptionsId} />
          )}
        </MenuUtilitiesContext.Provider>
      </div>
    </div>,
    document.getElementById('context-menu') as HTMLElement
  )
}
//定义CategoryMenu面板的参数泛型
interface CategoryMenuProps {
  category: CategoryItem
}
//定义CategoryMenu面板组件
const CategoryMenu: React.FC<CategoryMenuProps> = ({ category }) => {
  return <ContextMenuOptions clickedItem={category} type={ContextMenuEnum.CATEGORY} />
}
//定义NotesMenu面板的参数泛型
interface NotesMenuProps {
  note: NoteItem
  setOptionsId: (id: string) => void
}
//定义NotesMenu面板组件
const NotesMenu: React.FC<NotesMenuProps> = ({ note, setOptionsId }) => {
  // ===========================================================================
  // Selectors
  // ===========================================================================
  // 获取分类状态中的categories，获取笔记状态中的activeCategoryId
  const { categories } = useSelector(getCategories)
  const { activeCategoryId } = useSelector(getNotes)

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()
  //把笔记移动到分类
  const _addCategoryToNote = (categoryId: string, noteId: string) =>
    dispatch(addCategoryToNote({ categoryId, noteId }))
  //更新激活的笔记？？
  const _updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))
  // 更新激活的分类
  const _updateActiveCategoryId = (categoryId: string) =>
    dispatch(updateActiveCategoryId(categoryId))

  return !isDraftNote(note) ? ( //如果笔记不是草稿状态
    <>
      {!note.scratchpad && ( //如果笔记不是草稿则渲染右边的组件，否则不渲染移动到分类的组件
        <SelectCategory //Moving to category的组件
          //鼠标点击并失去焦点触发OnChange事件
          onChange={(event) => {
            _addCategoryToNote(event.target.value, note.id) //为笔记添加上分类
            //如果选中的分类id和激活的分类id不同
            if (event.target.value !== activeCategoryId) {
              //更新激活分类的id
              _updateActiveCategoryId(event.target.value)
              //更新激活的笔记
              _updateActiveNote(note.id, false)
            }
            //清空选中的选项id
            setOptionsId('')
          }}
          //传递分类列表给组件方便渲染items
          categories={categories}
          activeCategoryId={activeCategoryId} //传递激活的分类id
          note={note} //传递当前笔记
        />
      )}
      {/* 无论有没有moving tocategory，始终渲染其他菜单项组件 */}
      <ContextMenuOptions type={ContextMenuEnum.NOTE} clickedItem={note} />
    </>
  ) : null //如果笔记是草稿状态则不渲染任何组件
}
