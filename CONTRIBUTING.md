# 🤝 Contributing to iSpell (爱拼词)

Thank you for your interest in contributing to the **iSpell** project\! We believe that community collaboration is key to making iSpell the most effective and scientifically-backed language learning tool available. Your contributions—whether code, documentation, design, or feedback—are highly valued and appreciated.

Before you start contributing, please take a moment to read through this guide.

## Table of Contents

1.  [Code of Conduct](https://www.google.com/search?q=%231-code-of-conduct)
2.  [How to Contribute](https://www.google.com/search?q=%232-how-to-contribute)
      * [Reporting Bugs](https://www.google.com/search?q=%23reporting-bugs)
      * [Suggesting New Features](https://www.google.com/search?q=%23suggesting-new-features)
      * [Code Contribution Workflow](https://www.google.com/search?q=%23code-contribution-workflow)
3.  [Setting Up Your Local Environment](https://www.google.com/search?q=%233-setting-up-your-local-environment)
4.  [Coding Standards and Guidelines](https://www.google.com/search?q=%234-coding-standards-and-guidelines)
      * [Code Style](https://www.google.com/search?q=%23code-style)
      * [Component Principles](https://www.google.com/search?q=%23component-principles)
      * [Typing and Validation](https://www.google.com/search?q=%23typing-and-validation)
      * [Internationalization and Accessibility](https://www.google.com/search?q=%23internationalization-and-accessibility)
5.  [Areas Where We Need Your Expertise](https://www.google.com/search?q=%235-areas-where-we-need-your-expertise)

-----

## 1\. Code of Conduct

We are committed to fostering a welcoming, open, and inclusive environment for everyone in the community. Please adhere to the following principles at all times:

  * **Be Respectful:** Focus on the work and avoid personal attacks, harassment, or any form of discrimination.
  * **Communicate Clearly:** Express your ideas with clarity and conciseness, and be open to listening and considering feedback from others.
  * **Be Professional and Kind:** Maintain a professional and friendly demeanor, whether you are raising an issue or reviewing a Pull Request.

Any violation of this code will be addressed by the project maintainers.

## 2\. How to Contribute

### Reporting Bugs

If you encounter a bug during use, please submit a detailed report through [GitHub Issues]. A high-quality bug report should include:

  * **Environment:** Your operating system, browser version, and Node.js version.
  * **Steps to Reproduce:** A clear, minimal, and precise description of how to recreate the issue.
  * **Expected Result:** A description of what you expected to happen.
  * **Actual Result:** A description of what actually happened (screenshots or error logs are highly encouraged).
  * **Relevant File:** If you suspect the issue resides in a specific module (e.g., in the authentication flow like `components/auth/LoginModal.tsx`), please mention it.

### Suggesting New Features

For new features or enhancements to existing functionality, please use [GitHub Issues] for discussion. Clearly explain your use case, how the feature will benefit iSpell users, and any potential implementation thoughts.

### Code Contribution Workflow

1.  **Fork:** Fork the repository to your own GitHub account.
2.  **Clone:** Clone your forked repository to your local machine.
3.  **Create a Branch:** Create a new feature branch based on the `main` branch:
    ```bash
    git checkout -b feature/your-feature-name 
    # or 
    git checkout -b bugfix/issue-number
    ```
4.  **Code:** Implement your changes. Ensure you adhere to the [Coding Standards and Guidelines](https://www.google.com/search?q=%234-coding-standards-and-guidelines).
5.  **Test:** Verify that your changes do not break existing features.
6.  **Commit:** Write clear and concise commit messages. We encourage using the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat: add social login feature` or `fix: resolve crash in WordListDrawer`).
7.  **Push:** Push your local branch to your remote repository.
    ```bash
    git push origin feature/your-feature-name
    ```
8.  **Pull Request (PR):** Submit a Pull Request to the project's `main` branch. Clearly describe your changes in the PR description and link to any related issues.

## 3\. Setting Up Your Local Environment

This project is built with Next.js App Router and TypeScript.

1.  **Install Node.js and pnpm:** Ensure you have Node.js (\>=18.x) and pnpm installed.
2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
3.  **Configure Environment:** Create a `.env.local` file and fill in necessary variables for API endpoints and OAuth keys.
4.  **Start Development Server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:3000`.

## 4\. Coding Standards and Guidelines

We prioritize readability, maintainability, and a high standard of user experience.

### Code Style

  * **TypeScript Only:** All code must be written in TypeScript and pass type checking.
  * **ESLint/Prettier:** Code must pass ESLint checks and be auto-formatted using Prettier before submission.
  * **Tailwind CSS:** Styling should primarily use Tailwind CSS utilities.

### Component Principles

  * **Single Responsibility:** Components should have a clear, singular purpose. For instance, common UI wrappers like `SectionCard` should only handle layout and styling, while business components like `ProfileInfoSection` handle state and API calls.
  * **High Reusability:** Abstract common patterns into reusable components, such as `ConfirmationModal` for critical actions or `DefinitionDisplay` for word meanings.
  * **Framer Motion:** Use `framer-motion` (e.g., in `PlanWordsModal`) for all major UI transitions (modals, drawers, etc.) to maintain a fluid user experience.

### Typing and Validation

  * **Zod for Validation:** Use **Zod** for schema validation on all incoming data and form inputs (e.g., `registerSchema` in `components/auth/RegisterModal.tsx`).
  * **Strict Typing:** Maintain strict TypeScript typing across all components, hooks, and services.

### Internationalization and Accessibility

  * **`next-intl`:** All user-facing strings must be retrieved using the `useTranslations` Hook (see `components/common/Footer.tsx` for an example). Do not hardcode visible text.
  * **Accessibility (A11y):** New interactive elements must include clear ARIA attributes (`aria-label`, `aria-checked`, `role`, etc.) to support screen reader users (e.g., in `components/word-list/WordListDrawer.tsx` or `components/common/PronunciationDisplay.tsx`).

## 5\. Areas Where We Need Your Expertise

Your skills can make a significant impact on the following modules:

| Area | Example Component/File | Contribution Focus |
| :--- | :--- | :--- |
| **Scientific Review (SRS)** | `components/book-selection/PlanSetupView.tsx`, `services/planService.ts` | Optimizing the performance and accuracy of the core spaced repetition algorithms (SM-2, Ebbinghaus). |
| **Spelling Engine** | `components/spelling/WordDisplay.tsx`, `components/settings/index.tsx` | Refining the logic for letter hiding (`displayMode`) and improving input handling responsiveness. |
| **User Onboarding/Auth** | `components/auth/*.tsx`, `components/profile/*.tsx` | Enhancing the robustness of OAuth flows (e.g., `handleOAuthClick`), improving error handling, and implementing "Forgot Password" functionality. |
| **Component Refinement** | `components/common/*.tsx` | Introducing new, highly abstract, and well-tested common components for complex UI patterns. |

-----

Thank you once again for your interest\! We look forward to your first contribution.