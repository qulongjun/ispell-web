# iSpell - 爱拼词

免费的语言学习平台，专注于词汇记忆与复习，助你高效掌握新单词。

## 快速开始

### 环境准备
- Node.js 18+
- npm/yarn/pnpm 任一包管理器

### 安装步骤
1. **克隆项目**
   ```bash
   git clone https://github.com/ispell-net/ispell-web.git
   cd ispell-web
   ```

2.  **安装依赖**
   ```bash
   # 使用npm
   npm install
   # 或使用yarn
   yarn install
   # 或使用pnpm
   pnpm install
   ```

3.  **配置环境变量**
   在项目根目录创建 `.env.local` 文件，配置必要环境变量：
   ```env
   # 后端API基础地址
   NEXT_PUBLIC_API_BASE_URL=https://api.ispell.net/api
   ```

4.  **启动开发环境**
   ```bash
   npm run dev
   # 或 yarn dev / pnpm dev
   ```

5.  **访问项目**
   浏览器打开 `http://localhost:3000` 即可进入应用开发调试页面

## 项目目录结构
```
root/
├── app/            # 页面路由
├── contexts/       # 全局状态管理上下文
├── hooks/          # 全局钩子方法
├── i18n/           # 国际化的一些配置
├── messages/       # 国际化 JSON 文件
├── public/         # 公共资源库
├── schema/         # 表单校验规则
├── services/       # API请求服务封装
├── mocks/          # 前端 MOCK 数据
├── types/          # 全局类型定义
├── utils/          # 通用工具函数
└── components/     # 业务UI组件
```

## 许可证
本项目采用 **Apache 许可证** 开源。