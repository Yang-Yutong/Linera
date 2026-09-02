# Contribution Guidelines

TakeNote is an open source project, and contributions of any kind are welcome and appreciated. Open issues, bugs, and enhancements are all listed on the [issues](https://github.com/taniarascia/takenote/issues) tab and labeled accordingly. Feel free to open bug tickets and make feature requests. Easy bugs and features will be tagged with the `good first issue` label.

## Issues

If you encounter a bug, please file a bug report. If you have a feature to request, please open a feature request. If you would like to work on an issue or feature, there is no need to request permission. Please add tests to any new features.

## Pull Requests

In order to create a pull request for TakeNote, follow the GitHub instructions for [Creating a pull request from a fork](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork). Please link your pull request to an existing issue.

## Folder Structure

Description of the project files and directories.

```bash
├── config/                    # 配置
│   ├── cypress.config.js      # Cypress 端到端测试配置
│   ├── jest.config.js         # Jest 单元/组件 测试配置
│   ├── nodemon.config.json    # Nodemon 配置
│   ├── webpack.common.js      # Webpack 共享配置
│   ├── webpack.dev.js         # Webpack 开发配置 (dev server)
│   └── webpack.prod.js        # Webpack 产品配置 (dist output)
├── assets/                    # Supplemental assets
├── public/                    # 在构建中将会写到 dist中的文件
├── src/                       # 所有 Linera 应用源码文件
│   ├── resources/             # 公共 resources
│   ├── client/                # React 客户方代码
│   │   ├── api/               # 用于模拟 API 调用的临时占位符
│   │   ├── components/        # 未使用到 Redux 的 React 组件
│   │   ├── containers/        # React Redux 连接的容器
│   │   ├── contexts/          # 在不使用 Redux 的情况下使用 React 上下文全局状态
│   │   ├── router/            # React 私有和公共路由
│   │   ├── sagas/             # Redux sagas
│   │   ├── selectors/         # Redux 工具包选择器
│   │   ├── slices/            # Redux 工具包切片
│   │   ├── styles/            # Sass 样式文件
│   │   ├── types/             # TypeScript 类型
│   │   ├── utils/             # Utility functions 工具函数
│   │   └── index.tsx          # 客户端入口点 Client entrypoint
│   └── server/                # Node/Express 服务器端代码
│       ├── handlers/          # 用于 API 端点的函数 Functions for API endpoints
│       ├── middleware/        # API端点的中间件 Middleware for API endpoints
│       ├── router/            # 路由 API 端点 Route API endpoints
│       ├── utils/             # 后端工具包 Backend utilities
│       └── index.ts           # 服务端入口点 Server entrypoint
├── tests/                     # 测试套件 Test suites
│   ├── e2e/                   # Cypress 端到端测试 Cypress end-to-end tests
│   └── unit/                  # React 测试库和 Jest 测试 React Testing Library and Jest tests
├── .dockerignore              # Files ignored by Docker
├── .editorconfig              # Configures editor rules
├── .gitignore                 # Files ignored by git
├── .prettierrc                # 由 Prettier 强制执行的代码规范 Code convention enforced by Prettier
├── .travis.yml                # 持续集成和部署配置 Continuous integration and deployment config
├── CHANGELOG.md               # List of significant changes
├── deploy.sh                  # 用于生产环境的Docker部署脚本 Deployment script for Docker in production
├── Dockerfile                 # Docker 构建说明 Docker build instructions
├── LICENSE                    # 此开源项目的许可证 License for this open source project
├── package-lock.json          # Package lockfile
├── package.json               # Dependencies and additional information
├── README.md
├── seed.js                    # 为应用程序填充测试数据 Seed the app with data for testing
└── tsconfig.json              # Typescript 配置
```

## Scripts

An explanation of the `package.json` scripts.

| Command         | Description                                 |
| --------------- | ------------------------------------------- |
| `dev`           | Run TakeNote in a development environment   |
| `dev:test`      | Run TakeNote in a testing environment       |
| `client`        | Start a webpack dev server for the frontend |
| `server`        | Start a nodemon dev server for the backend  |
| `build`         | Create a production build of TakeNote       |
| `start`         | Start a production server for TakeNote      |
| `test`          | Run unit and component tests                |
| `test:e2e`      | Run end-to-end tests in the command line    |
| `test:e2e:open` | Open end-to-end tests in a browser          |
| `test:coverage` | Get test coverage                           |

## Technologies

This project is possible thanks to all these open source languages, libraries, and frameworks.

| Tech                                          | Description                               |
| --------------------------------------------- | ----------------------------------------- |
| [Codemirror](https://codemirror.net/)         | Browser-based text editor                 |
| [TypeScript](https://www.typescriptlang.org/) | Static type-checking programming language |
| [Node.js](https://nodejs.org/en/)             | JavaScript runtime for the backend        |
| [Express](https://expressjs.com/)             | Server framework                          |
| [React](https://reactjs.org/)                 | Front end user interface                  |
| [Redux](https://redux.js.org/)                | Global state management                   |
| [Webpack](https://webpack.js.org/)            | Asset bundler                             |
| [Sass](https://sass-lang.com/)                | Style preprocessor                        |
| [OAuth](https://oauth.net/)                   | Protocol for secure authorization         |
| [ESLint](https://eslint.org/)                 | TypeScript linting                        |
| [Jest](https://jestjs.io/)                    | Unit testing framework                    |
| [Cypress](https://www.cypress.io/)            | End-to-end testing framework              |

## Styleguide

Coding conventions are enforced by [ESLint](.eslintrc.js) and [Prettier](.prettierrc).

- No semicolons
- Single quotes
- Two space indentation
- Trailing commas in arrays and objects
- [Non-default exports](https://humanwhocodes.com/blog/2019/01/stop-using-default-exports-javascript-module/) are preferred for components
- Module imports are ordered and separated: **built-in** -> **external** -> **internal** -> **css/assets/other**
- TypeScript: strict mode, with no implicitly any
- React: functional style with Hooks (no classes)
- `const` preferred over `let`
