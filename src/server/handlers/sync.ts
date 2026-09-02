import { Request, Response } from 'express'
import dayjs from 'dayjs'

import { SDK } from '../utils/helpers'
import { Method } from '../utils/enums'

export default {
  sync: async (request: Request, response: Response) => {
    const { accessToken, userData } = response.locals // 获取通行token和用户信息
    const {
      body: { notes, categories }, //解构获取notes和categories
    } = request
    const username = userData.login
    const repo = 'takenote-data'

    try {
      // 获取master分支的引用 通过 GitHub REST API 获取指定仓库中 master 分支的 Git 引用
      const ref = await SDK(
        Method.GET, // 请求方式
        `/repos/${username}/${repo}/git/refs/heads/master`, // 请求路径
        accessToken //请求头中的token
      )

      // 并发地向 GitHub）的 API发送请求，创建两个 Git Blob 对象，分别用于存储笔记和分类的 JSON 数据
      const [noteBlob, categoryBlob] = await Promise.all([
        // Promise.all()并发编程方法用于将多个 Promise 对象包装成一个 Promise 对象，当所有的 Promise 对象都成功时，返回一个包含所有成功结果的数组
        // 消费时间time：promise1+promise2 ->使用promise.all后 max(promise1,promise2)
        SDK(Method.POST, `/repos/${username}/${repo}/git/blobs`, accessToken, {
          content: JSON.stringify(notes, null, 2),
        }),
        SDK(Method.POST, `/repos/${username}/${repo}/git/blobs`, accessToken, {
          content: JSON.stringify(categories, null, 2),
        }),
      ])

      // 定义tree对象格式，方便后续提交commit treeItme = blobObj+sha
      const treeItems = [
        {
          path: 'notes.json',
          sha: noteBlob.data.sha,
          mode: '100644',
          type: 'blob',
        },
        {
          path: 'categories.json',
          sha: categoryBlob.data.sha,
          mode: '100644',
          type: 'blob',
        },
      ]

      // 创建tree对象
      const tree = await SDK(Method.POST, `/repos/${username}/${repo}/git/trees`, accessToken, {
        tree: treeItems,
        base_tree: ref.data.object.sha,
      })

      // 创建commit对象
      const commit = await SDK(Method.POST, `/repos/${username}/${repo}/git/commits`, accessToken, {
        message: 'TakeNote update ' + dayjs(Date.now()).format('h:mm A M/D/YYYY'),
        tree: tree.data.sha,
        parents: [ref.data.object.sha],
      })

      // 更新master分支的引用强制指向给定的commit提交
      await SDK(Method.POST, `/repos/${username}/${repo}/git/refs/heads/master`, accessToken, {
        sha: commit.data.sha,
        force: true,
      })

      response.status(200).send({ message: 'Successly commited to takenote-data' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      response
        .status(400)
        .send({ message: errorMessage || 'Something went wrong while syncing data' })
    }
  },
  // 获取notes
  getNotes: async (request: Request, response: Response) => {
    const { accessToken, userData } = response.locals // 获取通行token和用户信息
    const username = userData.login //获取用户名
    const repo = 'takenote-data' //仓库名

    try {
      const { data } = await SDK(
        // 获取笔记内容
        Method.GET,
        `/repos/${username}/${repo}/contents/notes.json`,
        accessToken
      )
      // 将base64编码的笔记内容解码为字符串
      const notes = Buffer.from(data.content, 'base64').toString()

      try {
        JSON.parse(notes)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        response.status(400).send({ message: errorMessage || 'Must be valid JSON.' })
      }

      response.status(200).send(notes)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      response
        .status(400)
        .send({ message: errorMessage || 'Something went wrong while fetching note data' })
    }
  },
  // 获取categories
  getCategories: async (request: Request, response: Response) => {
    const { accessToken, userData } = response.locals
    const username = userData.login
    const repo = 'takenote-data'

    try {
      const { data } = await SDK(
        // 发请求获取分类内容
        Method.GET,
        `/repos/${username}/${repo}/contents/categories.json`,
        accessToken
      )
      // 将base64编码的分类内容解码为字符串
      const categories = Buffer.from(data.content, 'base64').toString()

      try {
        JSON.parse(categories)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        response.status(400).send({ message: errorMessage || 'Must be valid JSON.' })
      }

      response.status(200).send(categories)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      response
        .status(400)
        .send({ message: errorMessage || 'Something went wrong while fetching category data' })
    }
  },
}
