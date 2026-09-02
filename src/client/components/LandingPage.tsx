import React from 'react'
import { isMobile } from 'react-device-detect' //  该库是react用于检测设备是否为移动设备

import lightScreen from '@resources/assets/screenshot-light.png'
import darkScreen from '@resources/assets/screenshot-dark.png'
// import squareLogo from '@resources/assets/logo-square-white.svg'
import logo from '@resources/assets/linera.png'
import githubLogo from '@resources/assets/github-logo.png'

const clientId = process.env.CLIENT_ID // 读取环境变量，获取 GitHub 客户ID
const isDemo = process.env.DEMO // 读取环境变量，判断是否为演示模式

const loginButton = (text: string) => (
  <a
    className="button github-button"
    href={`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=http://localhost:3005/api/auth/callback`} // GitHub 登录按钮，跳转到到 GitHub OAuth API 进行授权
  >
    <img src={githubLogo} />
    {text}
  </a>
)

export const LandingPage: React.FC = () => {
  return (
    <section className="landing-page">
      <section className="content">
        <div className="container-small">
          <div className="lead">
            <img src={logo} height="200" width="200" alt="Linera" />
            <h1>
              笔记和小众阅读应用
              <br /> 为开发者而生
            </h1>
            <p className="subtitle">一个基于网站的笔记和阅读应用，仅为开发者而生</p>
            {isMobile ? (
              <p className="p-mobile">Linera 不支持平板或移动设备.</p>
            ) : isDemo ? (
              <div className="new-signup">
                <div>
                  <p>
                    Linera 仅仅作为一个 demo 使用。 你的笔记会被保存在浏览器的 localStorage 中，
                    并且 <b>不会</b> 持久化到数据库或云端中。
                  </p>
                  <a className="button" href="/app">
                    查看演示
                  </a>
                </div>
              </div>
            ) : (
              <div className="new-signup">
                <div>
                  <p>
                    Linera 并没有数据库或任何用户。 它只是用您的 GitHub
                    账户进行身份验证，并将数据存储在私人 <code>linera-data</code> 仓库
                  </p>
                  <div className="cta">{loginButton('使用 GitHub 注册')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="container">
          <img src={lightScreen} alt="Linera App" className="screenshot" />
        </div>
      </section>

      <section className="content">
        <div className="container-small">
          <div className="features">
            <h2 className="text-center">特征</h2>
            <ul>
              <li>
                <strong>纯文本笔记</strong> - 在无预设、类 IDE 环境中记录笔记
              </li>
              <li>
                <strong>电子阅读</strong> - 导入喜欢的书籍pdf文件,享受在线翻页阅读
              </li>
              <li>
                <strong>Markdown 预览</strong> - 查看渲染后的 HTML 效果
              </li>
              <li>
                <strong>关联笔记 </strong> - 使用 <code>{`{{uuid}}`}</code> 语法在笔记间相互链接
              </li>
              <li>
                <strong>语法高亮</strong> - 提供浅色与深色模式 (基于精美的{' '}
                <a href="https://taniarascia.github.io/new-moon/">New Moon theme</a>)
              </li>
              <li>
                <strong>键盘快捷键 </strong> -
                所有常用操作均可通过键盘完成：新建笔记与分类、切换设置及其他选项
              </li>
              <li>
                <strong>拖放操作</strong> - 将单条或多条笔记拖入分类、收藏夹或回收站
              </li>
              <li>
                <strong>多光标编辑</strong> - 支持多光标及其他{' '}
                <a href="https://codemirror.net/">Codemirror</a> 相关功能
              </li>
              <li>
                <strong>搜索笔记</strong> - 快速搜索全部笔记，或仅在指定分类内搜索
              </li>
              <li>
                <strong>笔记格式化</strong> - 实时使用 Prettier 美化 Markdown 内容
              </li>
              <li>
                <strong>非所见即所得 </strong> - 由开发者打造，专为开发者设计
              </li>
              <li>
                <strong>无数据库依赖</strong> - 笔记仅存储在浏览器本地存储中，仅你本人可下载、导出
              </li>
              <li>
                <strong>无追踪、无数据分析</strong> - &#39;无需多言
              </li>
              <li>
                <strong>GitHub 集成</strong> -自托管版本支持自动同步至 GitHub 仓库
              </li>
            </ul>
          </div>
        </div>
        <div className="container">
          <img src={darkScreen} alt="Linera App" className="screenshot" />
        </div>
      </section>

      <footer className="footer">
        <div className="container-small">
          <img src={logo} alt="Linera App" className="logo" />
          <p>
            <strong>Linera</strong>
          </p>
          <nav>
            <a href="https://github.com/rainruby/linera" target="_blank" rel="noopener noreferrer">
              Source
            </a>
            <a
              href="https://github.com/rainruby/linera/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Issues
            </a>
            <a
              href="https://github.com/rainruby/linera/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contributors
            </a>
          </nav>
        </div>
      </footer>
    </section>
  )
}
