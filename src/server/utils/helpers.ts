import axios from 'axios'

import { Method } from './enums'
// Github API的工具包
export function SDK(method: Method, path: string, accessToken: string, data?: Object) {
  const apiHost = 'https://api.github.com' //github api地址

  return axios({
    method,
    url: `${apiHost}${path}`,
    data,
    proxy: {
      // 告诉aixos不要直连github,而是通过代理端口转发
      host: '127.0.0.1',
      port: 7890, //clash的端口
      protocol: 'http',
    },
    headers: {
      Authorization: `token ${accessToken}`,
      'X-GitHub-Api-Version': '2026-03-10',
    },
  })
}
