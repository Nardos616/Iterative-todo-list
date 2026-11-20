<div align="center">

<img src="assets/images/hero-banner.svg" alt="Iterative To-Do List Banner" width="100%"/>

# Iterative To-Do List

**A professional, feature-rich task management web application built with vanilla web technologies.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Lucide](https://img.shields.io/badge/Lucide_Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)
[![LocalStorage](https://img.shields.io/badge/LocalStorage-Persistent_Data-4CAF50?style=for-the-badge&logo=databricks&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![No Frameworks](https://img.shields.io/badge/No_Frameworks-Pure_Vanilla-orange?style=flat-square)]()

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Keyboard Shortcuts](#️-keyboard-shortcuts)
- [Screenshots](#-screenshots)
- [Roadmap](#️-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🌟 Overview

**Iterative To-Do List** is a productivity-focused task management application designed to demonstrate modern frontend engineering without relying on any JavaScript frameworks. It was built as a portfolio project inspired by the design quality and UX of tools like **Todoist**, **Notion**, and **Linear**.

The app runs entirely in the browser — no backend, no database, no build step. All data persists locally via the **Web Storage API (LocalStorage)**.

> Built to showcase real-world frontend skills: component architecture, state management, event-driven programming, and responsive design — all in vanilla HTML, CSS, and JavaScript.

---

## ✨ Features

### 🎨 UI / UX
- **Light & Dark mode** with instant toggle and persistent preference
- **Fully responsive** layout across desktop, tablet, and mobile
- **Collapsible sidebar** that transforms into an off-canvas drawer on mobile
- Smooth transitions, micro-interactions, and animated progress indicators
- Consistent design system with CSS custom properties (design tokens)

### ✅ Task Management
- **Full CRUD** — create, read, update, and delete tasks
- Rich task fields: title, description, start date, due date, priority, category, status, and importance flag
- Priority levels: **High**, **Medium**, **Low** with color-coded visual indicators
- Task statuses: **To Do**, **In Progress**, **Completed**
- Mark tasks as **Important** for quick filtering

### 🔁 Recurring Tasks
- Schedule tasks to repeat **Daily**, **Weekly**, **Monthly**, or on a **Custom** interval
- **Completion-based recurrence**: completing a recurring task automatically generates the next occurrence with the correct due date
- Handles edge cases: month-end dates, leap years, and duplicate prevention
- Pause or stop a recurring series at any time

### 📅 Calendar
- Three views: **Monthly**, **Weekly**, and **Daily**
- Tasks rendered on their due dates with priority color coding
- Navigate between periods with **Previous / Next** controls and a **Today** button
- Click any calendar date to create a task with that due date pre-filled
- Click any task on the calendar to open its full details

### 📊 Dashboard & Analytics
- Summary stat cards: **Total**, **Completed**, **Pending**, and **Overdue** tasks
- Animated completion progress bar
- **Weekly productivity chart** (Chart.js bar chart)
- **Task distribution chart** (Chart.js doughnut chart)
- Stat cards are clickable and navigate to the relevant filtered task view
- All charts and stats update in real-time as tasks change

### 🗂️ Task Views
| View | Description |
|------|-------------|
| **List** | Compact, scannable row layout |
| **Grid** | Card-based layout for a broader overview |
| **Kanban** | Three-column board (To Do / In Progress / Completed) with **drag-and-drop** |

### 🔍 Search, Filter & Sort
- **Full-text search** across task titles and descriptions
- Filter by: All, Completed, Pending, Overdue, Important, High / Medium / Low priority, or any Category
- Sort by: Newest, Oldest, Due Date, Priority, or Alphabetical order
- All three controls work together simultaneously

### 📂 Category Management
- Create, rename, color-pick, and delete custom categories
- Assign tasks to categories and filter by them
- Deleting a category does not delete its tasks (they become Uncategorized)
- Pre-loaded default categories: Personal, Education, Work, Programming, Projects

### ☑️ Bulk Operations
- Multi-select tasks with checkboxes
- Bulk-mark as completed or bulk-delete
- **Undo deletion** via toast action (restores within a short window)

### 🔔 Notifications & Reminders
- In-app **toast notification** system (success, error, warning, info)
- **Notification center** with an unread badge counter
- **Browser push notifications** via the Web Notification API (permission requested once)
- Task reminder alerts and overdue warnings
- Optional **sound effects** for task completion (Web Audio API)

### 💾 Data Management
- **Export** all tasks and categories as a timestamped `.json` file
- **Import** a previously exported file with structure validation and duplicate-safe merging
- **Clear all data** with a confirmation dialog to prevent accidental loss
- LocalStorage gracefully handles missing or corrupted data on startup

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic markup and application shell |
| **CSS3** | Design system, layout (Flexbox + CSS Grid), animations |
| **Vanilla JavaScript (ES6+)** | Application logic, state management, DOM manipulation |
| **[Chart.js](https://www.chartjs.org/) (CDN)** | Dashboard analytics charts |
| **[Lucide Icons](https://lucide.dev/) (CDN)** | Icon set |
| **Web Storage API (LocalStorage)** | Client-side persistent data storage |
| **Web Notification API** | Browser push notifications |
| **Web Audio API** | Completion sound effects |
| **Drag and Drop API** | Kanban board drag-and-drop |

---

## 📁 Project Structure

```
iterative-todo-list/
│
├── index.html              # Application shell — all views and modals
│
├── css/
│   ├── style.css           # Design tokens (CSS custom properties), base reset, layout
│   ├── components.css      # All UI component styles (cards, modals, forms, badges, etc.)
│   └── responsive.css      # Media queries and mobile-specific overrides
│
├── js/
│   ├── storage.js          # LocalStorage CRUD abstraction layer
│   ├── notifications.js    # Toast system, notification center, browser Notification API
│   ├── categories.js       # Category CRUD and sidebar rendering
│   ├── recurring.js        # Recurrence engine — next-occurrence calculation
│   ├── tasks.js            # Task CRUD, List/Grid/Kanban renderers, drag-and-drop, bulk ops
│   ├── dashboard.js        # Stat cards, Chart.js charts, progress bar
│   ├── calendar.js         # Month/Week/Day calendar views
│   ├── settings.js         # Theme management, settings form, data import/export
│   └── app.js              # Application coordinator — navigation, keyboard shortcuts, init
│
├── assets/
│   └── images/
│       └── hero-banner.svg # Application banner
│
└── README.md
```

> **Architecture note:** Every JavaScript file is an **IIFE (Immediately Invoked Function Expression)** that exposes a minimal public API on the `window` object. This provides encapsulation without a build tool or module bundler, keeping the project framework-free and directly runnable in any browser.

---

## 🚀 Getting Started

No installation, build step, or server required.

### Option 1 — Open directly (simplest)

```bash
# Clone the repository
git clone https://github.com/your-username/iterative-todo-list.git

# Navigate into the directory
cd iterative-todo-list

# Open index.html in your browser
# Windows:
start index.html
# macOS:
open index.html
# Linux:
xdg-open index.html
```

### Option 2 — Live Server (recommended for development)

If you use **VS Code**, install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `index.html`, and select **"Open with Live Server"**.

> **Note:** Browser notifications require a served context (`http://` or `https://`). Opening the file directly via `file://` will disable that feature; all other features work normally.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Open "New Task" modal |
| `Escape` | Close any open modal or dialog |
| `Ctrl + F` | Focus the search bar |
| `D` | Navigate to Dashboard |
| `T` | Navigate to All Tasks |
| `C` | Navigate to Calendar |
| `Enter` | Submit Quick Add task |

---

## 📸 Screenshots

> _Screenshots coming soon. Run the app locally to see it in action!_

| Dashboard | Task Board | Calendar |
|-----------|-----------|----------|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

---

## 🗺️ Roadmap

Planned enhancements for future iterations:

- [ ] **Pomodoro Timer** — integrated focus sessions linked to tasks
- [ ] **Subtasks** — hierarchical task breakdown with individual completion tracking
- [ ] **Tags** — freeform, multi-value tagging alongside categories
- [ ] **PWA support** — offline capability and "Add to Home Screen" on mobile
- [ ] **Cloud sync** — optional sync via a lightweight backend (e.g., Firebase)
- [ ] **Shareable task links** — export a read-only task view as a URL
- [ ] **Accessibility (WCAG 2.1 AA)** — full keyboard navigation and screen reader support
- [ ] **Internationalization (i18n)** — multi-language support

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature-name`)
3. **Commit** your changes (`git commit -m 'feat: add your feature'`)
4. **Push** to your branch (`git push origin feature/your-feature-name`)
5. **Open a Pull Request** describing your changes

Please follow the existing code style — vanilla JS IIFEs, meaningful variable names, and no external frameworks.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Developed by [Your Name]**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-profile)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=todoist&logoColor=white)](https://your-portfolio.dev)

_Built as part of a Software Engineering portfolio — demonstrating modern frontend architecture with zero dependencies._

</div>
