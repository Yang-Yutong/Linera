import { Request, Response } from 'express'
import axios from 'axios'
import * as dotenv from 'dotenv'

import { welcomeNote } from '../utils/data/welcomeNote'
import { scratchpadNote } from '../utils/data/scratchpadNote'
import { thirtyDayCookie } from '../utils/constants'
import { SDK } from '../utils/helpers'
import { Method } from '../utils/enums'

dotenv.config()

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

export default {
  /**
   * GitHub 认证流程
   * @url https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/
   *
   * 1. 当用户打开Github的 `/authorize` 端口，跳转至授权页面
   * 用户同意授权后，重定向 `/callback` 端口并携带code
   *
   * 2. code会被用于交换在 `/access_token`API服务下的access_token
   * 交换成功后页面会重定向回app.
   *
   * 客户端持久化
   * @url https://www.taniarascia.com/full-stack-cookies-localstorage-react-express/
   *
   * 在应用上将设置一个为期三十天、安全的、仅限 HTTP 和同站点的 Cookie
   * 包含用于访问任意 GitHub 数据的 repo 权限访问令牌，并用来确定登录状态
   *
   * 刷新token
   * @url https://developer.github.com/apps/migrating-oauth-apps-to-github-apps/
   *
   * 依据 GitHub 文档:
   * > OAuth token 不会过期，除非用户关闭了oAth应用，或者用户撤销了应用访问权限。
   * > 应用撤销了令牌.
   *
   * 因此一开始就没有刷新token一说，你的唯一选择就是再次登录
   */
  // 处理授权后的回调函数
  callback: async (request: Request, response: Response) => {
    // 获取授权码
    const { code } = request.query

    try {
      // 获取access_token
      const { data } = await axios({
        method: 'post',
        url: 'https://github.com/login/oauth/access_token',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          client_id: `${clientId}`,
          client_secret: `${clientSecret}`,
          code: `${code}`,
        }),
        // proxy: {
        //   // 让后端node服务器走代理，，从指定端口出去访问github
        //   host: '127.0.0.1',
        //   port: 7890, // 代理的端口
        //   protocol: 'http',
        // },
      })
      const accessToken = data.access_token
      // 设置cookie-express的cookie方法在服务器端执行
      // 服务器端可以访问和处理敏感数据后再设置cookie
      response.cookie('githubAccessToken', accessToken, thirtyDayCookie)

      // 重定向到应用
      response.redirect('/app')
    } catch (error) {
      console.log(error) // eslint-disable-line
      // 当遇到错误时，重定向到主页（着陆页）
      response.redirect('/')
    }
  },

  /**
   * 身份验证
   *
   * 如果存在访问令牌，尝试确定当前登录的用户
   * 如果访问令牌不正确或过期则抛出异常
   *
   * 登录成功后，检查用户是否是第一次登录可以查看repo中是否创建了一个名叫Linera-data的仓库，如果没有则创建它
   */
  login: async (request: Request, response: Response) => {
    const { accessToken } = response.locals // 获取存储在response.locals中的accessToken，之前在callback中通过cookie塞进去的

    try {
      // 访问Github User API，获取用户信息
      const { data } = await SDK(Method.GET, '/user', accessToken)
      const username = data.login
      // 检查用户是否是第一次登录
      const isFirstTimeLoggingIn = await firstTimeLoginCheck(username, accessToken)

      if (isFirstTimeLoggingIn) {
        // 如果用户是第一次登录，则创建一个私有仓库并进行一次初始化提交
        await createLineraDataRepo(username, accessToken)
        await createInitialCommit(username, accessToken)
      }
      // 将用户信息返回给客户端
      // .send(data)会根据参数类型自动推类型
      // .json(data)会强制将content-type设置为json格式并将参数转为json格式
      response.status(200).send(data)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'something went wrong'
      response.status(400).send({ message: errorMsg })
    }
  },
  // 退出登录
  logout: async (request: Request, response: Response) => {
    // 清除cookie
    response.clearCookie('githubAccessToken')
    // 告诉客户端退出成功
    response.status(200).send({ message: 'Logged out' })
  },
}
// 检查用户是否是第一次登录
async function firstTimeLoginCheck(username: string, accessToken: string): Promise<boolean> {
  try {
    await SDK(Method.GET, `/repos/${username}/takenote-data`, accessToken)

    // 如果仓库存在, 返回false
    return false
  } catch (error) {
    // 如果仓库不存在，我们返回true,表示第一次登录区创建仓库
    return true
  }
}
// 在Github仓库中创建一个私有仓库，用于存储笔记应用的数据
async function createLineraDataRepo(username: string, accessToken: string): Promise<void> {
  // 构建仓库格式和基础配置
  const takenoteDataRepo = {
    name: 'linera-data', //仓库名称
    description: 'Database of notes for Linera', //仓库描述
    private: true, // 是否私有
    visibility: 'private', // 可见性：仅自己可见
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    is_template: false,
    auto_init: false,
    allow_squash_merge: false,
    allow_rebase_merge: false,
  }
  try {
    // 创建仓库
    await SDK(Method.POST, `/user/repos`, accessToken, takenoteDataRepo)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(errorMsg)
  }
}
// 在Github仓库中创建一个初始提交，用于初始化一个笔记应用的数据存储
async function createInitialCommit(username: string, accessToken: string): Promise<void> {
  const noteCommit = {
    message: 'Initial commit',
    // 将两个js笔记对象转为JSON格式存储,2表示两个空格，每一层使用两个空格缩进
    //根据JSON字符串创建一个Buffer对象，然后将其转换为Base64编码的字符串
    content: Buffer.from(JSON.stringify([scratchpadNote, welcomeNote], null, 2)).toString('base64'),
    branch: 'master', // 提交到master分支
  }
  try {
    // 发起PUT请求，将数据commit到仓库中
    await SDK(
      Method.PUT,
      `/repos/${username}/linera-data/contents/notes.json`,
      accessToken,
      noteCommit
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(errorMsg)
  }
}
