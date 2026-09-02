import React, { useRef, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { v4 as uuid } from 'uuid'
import { Droppable } from 'react-beautiful-dnd'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { CategoryOption } from '@/containers/CategoryOption'
import { getCategories } from '@/selectors'
import { shouldOpenContextMenu } from '@/utils/helpers'
import { ReactMouseEvent, ReactSubmitEvent, CategoryItem } from '@/types'
import { useTempState } from '@/contexts/TempStateContext' //自定义钩子函数，用于管理UI临时状态-新建分类是否打开新的分类表单
import { setCategoryEdit, updateCategory, addCategory } from '@/slices/category'
import { AddCategoryForm } from '@/components/AppSidebar/AddCategoryForm'
import { AddCategoryButton } from '@/components/AppSidebar/AddCategoryButton'
import { CollapseCategoryListButton } from '@/components/AppSidebar/CollapseCategoryButton'

export const CategoryList: React.FC = () => {
  // ===========================================================================
  // Selectors 获取store中的数据
  // ===========================================================================

  const {
    categories, // 分类数组
    editingCategory: { id: editingCategoryId, tempName: tempCategoryName }, // 正在编辑的分类
  } = useSelector(getCategories)

  // ===========================================================================
  // Dispatch 派发actions
  // ===========================================================================

  const dispatch = useDispatch()

  const _setCategoryEdit = (categoryId: string, tempName: string) =>
    dispatch(setCategoryEdit({ id: categoryId, tempName }))
  const _updateCategory = (category: CategoryItem) => dispatch(updateCategory(category))
  const _addCategory = (category: CategoryItem) => dispatch(addCategory(category))

  // ===========================================================================
  // Refs
  // useRef与useState的搭配使用！！！！
  // useRef使用场景：处理DOM元素或需要在组件渲染之间保持持久性数据时
  // 创建一个ref对象，用于获取contextMenu的DOM元素
  // 访问ref的值：contextMenuRef.current，在React中ref是非响应式的，Vue中ref是响应时的且获取值用.value
  // 定义时传入useRef（）的是ref对象current属性的初始值，但首次渲染后，初始值会被丢弃
  // 因为此ref对象非响应时，修改contextMenuRef.current的值不会触发重新组件渲染，可看作普通JS对象。所以需要手动调用forceUpdate()强制更新
  // ===========================================================================
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // ===========================================================================
  // State 管理组件内部的临时状态
  // ===========================================================================
  // 管理选中的分类
  const [optionsId, setOptionsId] = useState('')
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })
  // 管理分类列表的展开和收起
  const [isCategoryListOpen, setCategoryListOpen] = useState(true)

  // ===========================================================================
  // Context 从自定义Hook useTempState中获取临时状态
  // ===========================================================================
  // 获取TempStateContext中的临时状态addingTempCategory和修改其值的函数setAddingTempCategory
  const { addingTempCategory, setAddingTempCategory } = useTempState()

  // ===========================================================================
  // Handlers
  // ===========================================================================
  // 创建新分类
  const onAddCategory = (adding: boolean) => {
    setCategoryListOpen(true) //分类列表打开
    setAddingTempCategory(adding) // 设置添加临时分类
  }
  // 处理分类列表的菜单面板（删除或重名命）的弹开和收起
  const handleCategoryMenuClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId: string = ''
  ) => {
    const clicked = event.target //获取事件绑定的目标元素
    // 确保我们没有得到空值，即没有元素
    if (!clicked) return //没有元素被点击直接返回
    if (shouldOpenContextMenu(clicked as Element)) {
      //当前事件如何含有clientX和clientY属性，说明用户在屏幕上有效区点击了鼠标
      if ('clientX' in event && 'clientY' in event) {
        //设置位置
        setOptionsPosition({ x: event.clientX, y: event.clientY })
      }
    }
    // 阻止事件冒泡
    event.stopPropagation()
    // 如果菜单面板区dom不包含点击事件发生的dom节点，说明没选中菜单面板，这时候应该关闭菜单面板（如果开着的话）
    if (!contextMenuRef?.current?.contains(clicked as HTMLDivElement)) {
      // 使用更新optionsId的函数更新optionsId的值:
      // !optionsId表示当前没有任何菜单被打开 optionsId !== categoryId表示：当前有打开的菜单但不是当前点击的分类是categoryId则返回true
      // A||B有一个为true则返回categoryId，否则返回空字符串
      setOptionsId(!optionsId || optionsId !== categoryId ? categoryId : '')
    }
  }
  //列表中分类右边的三点被点击事件的处理
  const handleCategoryRightClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId: string = ''
  ) => {
    event.preventDefault() // 阻止默认事件
    handleCategoryMenuClick(event, categoryId) //处理菜单点击事件
  }
  // 重置临时分类
  const resetTempCategory = () => {
    // 更新addingTempCategory的值为false，表示没有临时分类
    setAddingTempCategory(false)
    // 调用_setCategoryEdit常量函数触发dispatch，从而将临时分类的id和名称都重置为空字符串
    _setCategoryEdit('', '')
  }
  //提交更新分类的处理函数 rename??
  const onSubmitUpdateCategory = (event: ReactSubmitEvent): void => {
    event.preventDefault() // 阻止默认事件
    //定义正在编辑的分类对象category
    const category = { id: editingCategoryId, name: tempCategoryName.trim(), draggedOver: false }
    // 如果当前分类在分类列表中存在或者分类名称为空
    if (categories.find((cat) => cat.name === category.name) || category.name === '') {
      // 重置临时分类
      resetTempCategory()
    } else {
      //调用常量函数触发dispatch更新category更新
      _updateCategory(category)
      //重置临时分类
      resetTempCategory()
    }
  }
  // 提交新分类的处理函数
  const onSubmitNewCategory = (event: ReactSubmitEvent): void => {
    event.preventDefault() // 阻止默认事件
    //定义新分类对象category
    const category = { id: uuid(), name: tempCategoryName.trim(), draggedOver: false }
    // 如果当前分类在分类列表中存在或者分类名称为空
    if (categories.find((cat) => cat.name === category.name) || category.name === '') {
      resetTempCategory() // 重置临时分类
    } else {
      _addCategory(category) //调用常量函数触发dispatch添加新分类
      resetTempCategory() //重置临时分类
    }
  }

  // ===========================================================================
  // Hooks
  // useEffect(setup,dependencies) denpendencies为数组，存setup中依赖的响应式变量prop或state
  // 组件挂载时执行setup,当依赖项denpendencies中的值发生变化时，会先去执行cleanup再setup
  // 依赖项为空数组则每次组件reRender时都会执行一次副作用
  // useEffect：当组件挂载和卸载时执行
  // ===========================================================================

  useEffect(() => {
    //监听分类菜单栏的点击事件
    document.addEventListener('mousedown', handleCategoryMenuClick)
    // 返回一个cleanup函数，当组件卸载时执行，移除监听事件
    return () => {
      document.removeEventListener('mousedown', handleCategoryMenuClick)
    }
  })

  return (
    <>
      <div className="category-title">
        <CollapseCategoryListButton
          dataTestID={TestID.CATEGORY_COLLAPSE_BUTTON}
          handler={() => setCategoryListOpen(!isCategoryListOpen)}
          label={LabelText.COLLAPSE_CATEGORY}
          isCategoryListOpen={isCategoryListOpen}
          showIcon={categories.length > 0}
        />
        <AddCategoryButton
          dataTestID={TestID.ADD_CATEGORY_BUTTON}
          handler={onAddCategory}
          label={LabelText.ADD_CATEGORY}
        />
      </div>
      {isCategoryListOpen && (
        <>
          <Droppable type="CATEGORY" droppableId="Category list">
            {(droppableProvided) => (
              <div
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
                className="category-list"
                aria-label="Category list"
              >
                {categories.map((category, index) => (
                  <CategoryOption
                    key={category.id}
                    index={index}
                    category={category}
                    contextMenuRef={contextMenuRef}
                    handleCategoryMenuClick={handleCategoryMenuClick}
                    handleCategoryRightClick={handleCategoryRightClick}
                    onSubmitUpdateCategory={onSubmitUpdateCategory}
                    optionsId={optionsId}
                    setOptionsId={setOptionsId}
                    optionsPosition={optionsPosition}
                  />
                ))}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
          {addingTempCategory && (
            <AddCategoryForm
              dataTestID={TestID.NEW_CATEGORY_FORM}
              submitHandler={onSubmitNewCategory}
              changeHandler={_setCategoryEdit}
              resetHandler={resetTempCategory}
              editingCategoryId={editingCategoryId}
              tempCategoryName={tempCategoryName}
            />
          )}
        </>
      )}
    </>
  )
}
