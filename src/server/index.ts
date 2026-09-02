import initializeServer from './initializeServer'
import router from './router'

const app =
  initializeServer(
    router
  ) /** * 使用initializeServer函数并传入router来创建应用实例 * 这将初始化Express应用并设置所有路由 */

app.listen(5001, () => console.log('Listening on port 5001')) // eslint-disable-line
