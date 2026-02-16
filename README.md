# iSpell 爱拼词

> 用科学方法高效、愉快地征服新词汇。

**iSpell** 是基于 **Next.js** 与 **TypeScript** 的现代多语言词汇学习平台，致力于提供简洁、高效、沉浸式的拼写与记忆体验。

---

## ✨ 功能概览

| 能力 | 说明 |
|------|------|
| **拼写练习** | 听音/看义拼写、即时反馈、空格朗读、左右键切换单词 |
| **学习计划** | 选书、定每日数量、查看方案，支持多语言词书与社区/自定义词表 |
| **错题集** | 自动收集拼错词，支持专项复习与错题回顾 |
| **配置云同步** | 主题、发音口音等设置云端保存，跨设备一致体验 |
| **游客体验** | 未登录可浏览词书并试用拼写，一键试用体验 |
| **新人引导** | 首次进入拼写界面多步骤引导，单词列表可拖动吸边 |
| **国际化** | 中/英/日等界面与多语言词书支持 |
| **爱心捐赠** | 捐赠入口与说明，收益用于乡村儿童健康与学习 |

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Next.js](https://nextjs.org/) 16 (App Router) |
| 语言 | [TypeScript](https://www.typescriptlang.org/) |
| UI / 样式 | [Tailwind CSS](https://tailwindcss.com/) v4、[Lucide React](https://lucide.dev/) |
| 动效 | [Framer Motion](https://www.framer.com/motion/) |
| 国际化 | [next-intl](https://next-intl-docs.vercel.app/) |
| 校验与表单 | [Zod](https://zod.dev/) |
| 反馈 | [react-hot-toast](https://react-hot-toast.com/) |

---

## 📦 环境要求

- **Node.js** ≥ 18.x  
- **npm**（或 pnpm / yarn）

---

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/ispell-net/ispell-web.git
cd ispell-web
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local`，按需配置：

```env
# 后端 API 根地址（不配置则使用默认线上地址）
NEXT_PUBLIC_API_BASE_URL=https://api.ispell.net/api
```

### 4. 启动开发服务

```bash
npm run dev
```

浏览器访问 **http://localhost:3000**。

---

## 📜 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（默认 3000 端口） |
| `npm run build` | 生产环境构建 |
| `npm run start` | 启动生产服务（端口 3002） |
| `npm run lint` | 运行 ESLint 检查 |

---

## 📁 项目结构（简要）

```
ispell-web/
├── app/
│   └── [locale]/           # 国际化路由：首页、设置、个人、捐赠、更新日志等
├── components/             # 通用与业务组件（拼写、书架、学习启动等）
├── contexts/               # React 上下文（应用状态、拼写状态等）
├── services/               # API 请求与业务服务
├── types/                  # TypeScript 类型定义
├── utils/                  # 工具函数（API 封装、认证等）
├── messages/               # next-intl 文案（zh-CN、en、ja 等）
└── public/                 # 静态资源
```

---

## 🌐 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 否 | 后端 API 根 URL，默认 `https://api.ispell.net/api` |

本地开发可不配置，直接使用默认 API；自建后端时在此填写你的 API 地址。

---

## 🤝 参与贡献

欢迎通过 Issue、PR、文档与翻译等方式参与，请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

我们特别期待在以下方向的贡献：

1. **复习算法**：SM-2 或其它 SRS 算法的优化与实现  
2. **前端性能**：拼写页加载与交互性能优化  
3. **动效与体验**：使用 Framer Motion 等提升动效与可访问性  
4. **国际化**：新增语言或完善现有翻译  

提交 PR 前请确保通过 TypeScript 与 ESLint 检查。

---

## 📄 许可证

本项目采用 [Apache License](LICENSE)。
