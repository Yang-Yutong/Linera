import path from 'path' //  导入Node.js的path模块，用于处理文件路径

import express, { Router } from 'express' //  导入express框架和Router类型
import cookieParser from 'cookie-parser' //  导入cookie-parser中间件，用于解析Cookie
import cors from 'cors' //  导入cors中间件，用于处理跨域请求
import helmet from 'helmet' //  导入helmet中间件，用于设置安全HTTP头
import compression from 'compression' //  导入compression中间件，用于响应压缩

export default function initializeServer(router: Router) {
  const app = express() //  创建Express应用程序实例
  const isProduction = process.env.NODE_ENV === 'production' //  判断是否为生产环境
  const origin = { origin: isProduction ? false : '*' } //  配置跨域来源，生产环境禁止跨域，开发环境允许所有来源

  app.set('trust proxy', 1) //  设置信任代理，允许Express信任代理服务器设置的X-Forwarded-*等头信息
  app.use(express.json()) //  使用内置中间件解析JSON格式的请求体
  app.use(cookieParser()) //  使用cookie-parser中间件解析Cookie
  app.use(cors(origin)) //  使用CORS中间件处理跨域请求，根据环境配置不同的跨域策略
  app.use(helmet()) //  使用 helmet 中间件来增强安全性，设置各种 HTTP 头
  app.use(compression()) //  使用 compression 中间件来压缩响应体，减少传输数据大小

  app.use((request, response, next) => {
    //  自定义中间件，设置内容安全策略(CSP)头部 这里只允许加载来自 'self' 和 *.githubusercontent.com 的图片资源
    response.header('Content-Security-Policy', "img-src 'self' *.githubusercontent.com")

    return next()
  })

  app.use(express.static(path.join(__dirname, '../../dist/'))) //  提供静态文件服务，从项目根目录下的 dist 文件夹提供服务
  app.use('/api', router) //  为 /api 路径注册路由处理器
  app.get('*', (request, response) => {
    //  处理所有其他路由，返回 index.html（用于前端路由）
    response.sendFile(path.join(__dirname, '../../dist/index.html'))
  })

  return app //  返回配置好的 Express 应用实例
}
