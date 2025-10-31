This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

```bash
.
├── README.md
├── components.json
├── ecosystem.config.js
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public
│   ├── avatars
│   │   ├── avatar-1.png
│   │   ├── avatar-2.png
│   │   └── avatar-3.png
│   ├── file.svg
│   ├── globe.svg
│   ├── images
│   │   ├── auth
│   │   │   ├── login-background.jpg
│   │   │   └── signup-background.jpg
│   │   └── features
│   │       ├── analytics-dashboard.jpg
│   │       ├── exam-creation.jpg
│   │       └── grading-system.jpg
│   ├── logo.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src
│   ├── app
│   │   ├── app.css
│   │   ├── auth
│   │   │   ├── layout.tsx
│   │   │   ├── login
│   │   │   │   └── page.tsx
│   │   │   └── signup
│   │   │       └── page.tsx
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── editor
│   │   │   └── [documentId]
│   │   │       └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── auth
│   │   │   ├── login-form
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── helpers.ts
│   │   │   │   └── interface.ts
│   │   │   └── sign-up-form
│   │   │       ├── SignUpForm.tsx
│   │   │       ├── helpers.ts
│   │   │       ├── index.ts
│   │   │       └── interface.ts
│   │   ├── dashboard
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── content
│   │   │   │   ├── Content.tsx
│   │   │   │   ├── ExamContent
│   │   │   │   │   ├── ExamContent.tsx
│   │   │   │   │   ├── ExamTable.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ExamTable
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── index.ts
│   │   │   ├── navigation
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── sidebar
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   └── user-profile
│   │   │       ├── UserProfile.tsx
│   │   │       └── index.ts
│   │   ├── editor
│   │   │   ├── A4ExamPaper
│   │   │   │   ├── A4ExamPaper.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── BankSelectionPanel
│   │   │   │   ├── BankSelectionPanel.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── Canvas
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── ClickDragContainer
│   │   │   │   ├── ClickDragContainer.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── ConfigEditPanel
│   │   │   │   ├── ConfigEditPanel.tsx
│   │   │   │   ├── ConfigForm
│   │   │   │   │   ├── ExamConfigForm
│   │   │   │   │   │   ├── ExamConfigForm.tsx
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── interface.ts
│   │   │   │   │   ├── FillInBlankConfigForm
│   │   │   │   │   │   ├── FillInBlankConfigForm.tsx
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── interface.ts
│   │   │   │   │   ├── MCQConfigForm
│   │   │   │   │   │   ├── MCQConfigForm.tsx
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── interface.ts
│   │   │   │   │   └── OpenQuestionConfigForm
│   │   │   │   │       ├── OpenQuestionConfigForm.tsx
│   │   │   │   │       ├── index.ts
│   │   │   │   │       └── interface.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── Editor
│   │   │   │   ├── Editor.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── EditorNavbar
│   │   │   │   ├── EditorNavbar.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── ExamPaper
│   │   │   │   ├── ExamPaper.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── QuestionSelectionPanel
│   │   │   │   ├── QuestionSelectionPanel.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── SectionSelection
│   │   │   │   ├── SectionSelection.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   └── TemplateSelectionPanel
│   │   │       ├── TemplateSelectionPanel.tsx
│   │   │       ├── index.ts
│   │   │       └── interface.ts
│   │   ├── exam-header-templates
│   │   │   ├── DefaultHeader.tsx
│   │   │   ├── index.ts
│   │   │   └── interface.ts
│   │   ├── landing-page
│   │   │   ├── CTASection
│   │   │   │   └── index.tsx
│   │   │   ├── FeaturesSection
│   │   │   │   └── index.tsx
│   │   │   ├── HeroSection
│   │   │   │   └── index.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Navbar
│   │   │   │   └── index.tsx
│   │   │   ├── TechnicalHighlightsSection
│   │   │   │   └── index.tsx
│   │   │   ├── TestimonialsSection
│   │   │   │   └── index.tsx
│   │   │   ├── UserNav
│   │   │   │   ├── UserNav.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── helpers.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── layout-components
│   │   │   ├── Blank
│   │   │   │   ├── Blank.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   └── Divider
│   │   │       ├── Divider.tsx
│   │   │       └── index.ts
│   │   ├── questions-type
│   │   │   ├── fill-in-blank-question
│   │   │   │   ├── FillInBlankQuestion.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   ├── multiple-choice-question
│   │   │   │   ├── MultipleChoiceQuestion.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── interface.ts
│   │   │   └── open-question
│   │   │       ├── OpenQuestion.tsx
│   │   │       ├── index.ts
│   │   │       └── interface.ts
│   │   ├── rich-editor
│   │   │   ├── BaseEditor.jsx
│   │   │   ├── ResizeModuleConfig.ts
│   │   │   ├── RichInput.jsx
│   │   │   ├── index.ts
│   │   │   ├── interface.ts
│   │   │   └── quill.css
│   │   └── ui
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── multiple-selector
│   │       │   └── index.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── skeleton.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── theme-provider.tsx
│   │       ├── theme-toggle.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── tooltip.tsx
│   ├── context
│   │   └── Auth.tsx
│   ├── hooks
│   │   └── use-toast.ts
│   ├── lib
│   │   ├── api.ts
│   │   ├── axios.ts
│   │   ├── host.ts
│   │   └── utils.ts
│   ├── middleware.ts
│   ├── mock
│   │   ├── default-exam-data.ts
│   │   └── exam-data.ts
│   └── types
│       ├── exam.d.ts
│       └── types.d.ts
├── tailwind.config.ts
└── tsconfig.json

66 directories, 176 files
```