# 📖 iSpell - Immersive Multi-Language Vocabulary Platform

> 🎯 **Conquer new vocabulary efficiently and enjoyably using scientific methods.**

-----

## 🚀 Project Overview

**iSpell** is a modern, high-performance language learning platform built with **Next.js** and **TypeScript**. We are dedicated to providing the most elegant and effective vocabulary learning experience on the market.

## 🛠️ Technology Stack

  * **Framework:** [**Next.js**](https://nextjs.org/)
  * **Language:** [**TypeScript**](https://www.typescriptlang.org/)
  * **Styling:** [**Tailwind CSS**](https://tailwindcss.com/)
  * **Animation:** [**Framer Motion**](https://www.framer.com/motion/)
  * **Data Validation:** [**Zod**](https://zod.dev/)
  * **Internationalization:** [**next-intl**](https://next-intl-docs.vercel.app/)
  * **Icons:** [**Lucide React**](https://lucide.dev/)

## ⚙️ Deployment and Local Development

To start the iSpell project, please ensure you have **Node.js (\>=18.x)** and **npm** installed.

### 1\. Clone the Repository

```bash
git clone https://github.com/ispell-net/ispell-web.git
cd ispell
```

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Configure Environment Variables

Create a `.env.local` file and fill in the necessary variables for your backend service and OAuth configuration:

```env
# Base Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.ispell.net/api
```

### 4\. Start the Project

```bash
npm run dev
```

The project will start at `http://localhost:3000`.

## 🤝 Contribution Guide

We welcome contributions in all forms\! Whether you want to fix a bug, add a new feature, or improve documentation or translations, please refer to our [Contribution Guide][CONTRIBUTING.md] file.

We are particularly interested in contributions in the following areas:

1.  **Scientific Review Algorithm Optimization:** Improve the SM-2 algorithm or introduce a new SRS variant.
2.  **Frontend Performance Tuning:** Enhance the loading speed and interaction responsiveness of the core spelling pages.
3.  **UI/UX Improvement:** Use `framer-motion` to enhance the animation effects of existing or new interfaces.
4.  **Internationalization Expansion:** Add support for more languages (e.g., Korean, French).

Before submitting a Pull Request, please ensure your code passes TypeScript type checks and is properly formatted.

-----

> **License:** This project is licensed under the Apache License. See [LICENSE][LICENSE] for details.

[CONTRIBUTING.md]: CONTRIBUTING.md
[LICENSE]: LICENSE