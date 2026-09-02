import { v4 as uuid } from 'uuid' //更新uuid版本至9.x.x对es module支持很好
import dayjs from 'dayjs'

import { NoteItem, SyncPayload, SettingsState } from '@/types'

const scratchpadNote = {
  id: uuid(),
  text: `# Scratchpad

The easiest note to find.`,
  category: '',
  scratchpad: true,
  favorite: false,
  created: dayjs().format(),
  lastUpdated: dayjs().format(),
}

const markdown = `# 欢迎使用 Linera-文字纪元!

Linera 是一个免费、开源的笔记应用. 这仅仅是个demo项目, 并没有内置任何数据库和云存储的功能。您的笔记会保存在 localStorage中，并不支持持久化存储, 但支持文件下载。


## 特点

- **纯文本笔记** -支持在无预设、类IDE环境下使用 Markdown 语法进行笔记记录
- **Markdown预览** - 查看渲染后的HTML效果
- **关联笔记** - 使用 \`{{uuid}}\` 语法在笔记间相互链接
- **语法高亮** - 提供浅色与深色模式 (基于精美的 [New Moon](https://taniarascia.github.io/new-moon/) 主题)
- **键盘快捷键** - 所有常用操作均可通过键盘完成 - 新建笔记与分类, 切换设置以及其他选项
- **拖拽操作** - 将单条或多条笔记拖入分类、收藏夹或回收站
- **多光标编辑** - 支持多光标及其他 [Codemirror](https://codemirror.net/) 相关功能
- **搜索笔记** - 快速搜索全部笔记，或仅在分类内搜索
- **笔记格式化** - 实时使用 Prettier 美化 Markdown 内容
- **非所见即所得** - 由开发者打造，专为开发者设计
- **无数据库依赖** - 笔记仅存储在浏览器本地存储中，仅你本人可下载、导出
- **无追踪、无数据分析** - 无需多言
- **GitHu b集成** - 自托管版本支持自动同步至 github 仓库
`

const welcomeNote = {
  id: uuid(),
  text: markdown,
  category: '',
  favorite: false,
  created: dayjs().format(),
  lastUpdated: dayjs().format(),
}

type PromiseCallback = (value?: any) => void
type GetLocalStorage = (
  key: string,
  errorMessage?: string
) => (resolve: PromiseCallback, reject: PromiseCallback) => void

const getLocalStorage: GetLocalStorage =
  (key, errorMessage = 'Something went wrong') =>
  (resolve, reject) => {
    const data = localStorage.getItem(key)

    if (data) {
      resolve(JSON.parse(data))
    } else {
      reject({
        message: errorMessage,
      })
    }
  }

const getUserNotes = () => (resolve: PromiseCallback, reject: PromiseCallback) => {
  const notes: any = localStorage.getItem('notes')

  // check if there is any data in localstorage
  if (!notes) {
    // if there is none (i.e. new user), create the welcomeNote and scratchpadNote
    resolve([scratchpadNote, welcomeNote])
  } else if (Array.isArray(JSON.parse(notes))) {
    // if there is (existing user), show the user's notes
    resolve(
      // find does not work if the array is empty.
      JSON.parse(notes).length === 0 || !JSON.parse(notes).find((note: NoteItem) => note.scratchpad)
        ? [scratchpadNote, ...JSON.parse(notes)]
        : JSON.parse(notes)
    )
  } else {
    reject({
      message: 'Something went wrong',
    })
  }
}

export const saveState = ({ categories, notes }: SyncPayload) =>
  new Promise((resolve) => {
    localStorage.setItem('categories', JSON.stringify(categories))
    localStorage.setItem('notes', JSON.stringify(notes))

    resolve({
      categories: JSON.parse(localStorage.getItem('categories') || '[]'),
      notes: JSON.parse(localStorage.getItem('notes') || '[]'),
    })
  })

export const saveSettings = ({ isOpen, ...settings }: SettingsState) =>
  Promise.resolve(localStorage.setItem('settings', JSON.stringify(settings)))

export const requestNotes = () => new Promise(getUserNotes())
export const requestCategories = () => new Promise(getLocalStorage('categories'))
export const requestSettings = () => new Promise(getLocalStorage('settings'))
