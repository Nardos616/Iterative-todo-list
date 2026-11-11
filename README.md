<p align="center">
  <img src="assets/images/hero-banner.svg" alt="Iterative To-Do List Banner" width="100%" />
</p>

# ⚡ Iterative To-Do List

A modern, professional, and fully responsive productivity and task management web application built with **HTML5, CSS3, and Vanilla JavaScript (ES6+)**. Inspired by the streamlined UX of **Todoist**, **Notion**, and **Linear**, Iterative was designed for high efficiency, complete data privacy, and a seamless workflow.

> **Note:** Iterative is a **100% frontend-only** web application that persists all state locally in the user's browser using the **Web Storage API (LocalStorage)**. No backend server, database, or external account is required.

---

## 🌟 Key Features

### 1. 🔄 Complete-Based Recurring Tasks (Core Engine)
- **Automatic Recurrence Calculation:** When a recurring task is marked as completed, the current occurrence is archived and the next occurrence is automatically scheduled.
- **Smart Date Algorithms:** Supports **Daily**, **Weekly**, and **Monthly** schedules (gracefully handling varying month lengths and leap years), as well as custom intervals.
- **Duplicate Prevention:** Tracks persistent series IDs to eliminate duplicate task generation.

### 2. 📊 Interactive Productivity Dashboard
- **Live Metric Cards:** Real-time counters for Total Tasks, Completed Tasks, Pending Tasks, and Overdue Tasks.
- **Visual Completion Meter:** Animated progress indicator displaying overall progress percentage.
- **Weekly Productivity Chart:** Rendered with [Chart.js](https://www.chartjs.org/) to track completed vs. created tasks across the past 7 days.
- **Category Distribution Chart:** Doughnut chart breaking down task allocation across custom categories.
- **Upcoming Deadlines & Recent Activity:** Quick-access widgets for near-term milestones.

### 3. 🎯 Versatile Display Modes
- **List View:** Dense, structured row format with inline status checkboxes, priority badges, category pills, and quick actions.
- **Grid View:** Card layout highlighting descriptions, tags, and due dates.
- **Kanban Board:** Three workflow stages (**To Do**, **In Progress**, **Completed**) featuring native HTML5 drag-and-drop to update statuses instantly.

### 4. 📅 Multi-View Task Calendar
- **Three Views:** Monthly grid, Weekly columns, and Daily schedule.
- **Date Navigation:** Jump seamlessly between months/weeks or quickly return to **Today**.
- **Click-to-Create:** Click any calendar date to open the task creation dialog pre-filled with that date.
- **Priority-Coded Pills:** Tasks are color-coded by priority (High, Medium, Low) directly on calendar cells.

### 5. 🏷️ Custom Category Management
- Pre-seeded with common project categories: *Work*, *Education*, *Programming*, *Projects*, and *Personal*.
- Create, edit, and delete categories with a custom color picker and preset swatches.
- Safe deletion ensures associated tasks revert to uncategorized without data loss.

### 6. 🔍 Search, Filter, and Sort
- **Real-Time Search:** Search dynamically across task titles and descriptions.
- **Multi-Factor Filtering:** Filter by Priority, Status, Category, or smart views (*My Day*, *Upcoming*, *Important*, *Completed*, *Overdue*).
- **Sorting Options:** Sort by Newest, Oldest, Due Date (Earliest/Latest), Priority (High to Low), or Alphabetically.

### 7. ⚡ Bulk Operations & Undo System
- Select individual tasks or multi-select entire filtered views.
- Bulk complete and bulk delete with one click.
- **Instant Undo:** Non-destructive deletion with an interactive toast notification allowing instant restoration of removed tasks.

### 8. 🔔 Notification Center & Reminders
- In-app notification center with an unread badge counter.
- Background ticker scans for approaching deadlines and reminders every 40 seconds.
- Optional browser desktop notifications via the native **Web Notification API** (requests permission gracefully).

### 9. 🌓 Light & Dark Theme Support
- Designed with CSS custom properties for instant theme switching.
- Auto-adapts Chart.js grid and text contrast for dark mode.
- System preference detection (`prefers-color-scheme`).

### 10. 💾 Backup & Data Portability
- **Export Backup:** Download an export of tasks, categories, and settings as a clean JSON file (`iterative-todo-backup-YYYY-MM-DD.json`).
- **Import Backup:** Restore data from any valid backup file with schema verification and confirmation prompts.
- **Reset:** Wipe all local data and restore defaults.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>N</kbd> | Open New Task modal |
| <kbd>Q</kbd> | Focus Quick Add task bar |
| <kbd>/</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> | Focus global search bar |
| <kbd>Esc</kbd> | Close any open modal or dropdown |
| <kbd>1</kbd> | Navigate to Dashboard |
| <kbd>2</kbd> | Navigate to All Tasks |
| <kbd>3</kbd> | Navigate to Calendar |
| <kbd>4</kbd> | Navigate to Settings |
| <kbd>?</kbd> | Open Keyboard Shortcuts guide |

---

## 🛠️ Technology Stack

- **HTML5:** Semantic markup, dialogs, form elements, and accessible ARIA attributes.
- **CSS3:** Modern CSS variables, Flexbox, CSS Grid layouts, glassmorphism backdrops, and responsive media queries.
- **Vanilla JavaScript (ES6+):** Pure modular JavaScript, object-oriented service pattern, custom event dispatching, and zero frontend framework dependencies.
- **Chart.js (v4 via CDN):** Responsive canvas rendering for analytical graphs.
- **Lucide Icons (via CDN):** Clean and consistent vector iconography.
- **LocalStorage API:** Client-side persistence and JSON data serialization.

---

## 📁 Project Structure

```text
To-Do-list/
├── index.html              # Main HTML entry point and application shell
├── css/
│   ├── style.css           # Design tokens, color system, global reset & layout architecture
│   ├── components.css      # Component styles: modals, cards, kanban, calendar, toasts
│   └── responsive.css      # Breakpoints and mobile drawer navigation
├── js/
│   ├── storage.js          # LocalStorage CRUD, data persistence, JSON export & import
│   ├── notifications.js    # In-app notification center, toast system & web alerts
│   ├── categories.js       # Category service, color swatches & select population
│   ├── recurring.js        # Complete-based recurrence calculation engine
│   ├── tasks.js            # Task CRUD, filters, sorting, bulk actions & kanban drag-and-drop
│   ├── dashboard.js        # Statistics calculation and Chart.js instances
│   ├── calendar.js         # Month, week, and day calendar renderers
│   ├── settings.js         # Preferences, theme toggles, and data controls
│   └── app.js             # Application coordinator, navigation routing & keyboard shortcuts
├── assets/
│   └── images/             # Project assets and screenshot storage
└── README.md               # Portfolio documentation
```

---

## 🚀 Getting Started

Because **Iterative** is built exclusively with standard Web standards (HTML5, CSS3, and ES6+ JavaScript), no package manager, compiler, or build step is required!

### Method 1: Direct File Launch
1. Download or clone this repository:
   ```bash
   git clone https://github.com/your-username/iterative-todo-list.git
   ```
2. Navigate into the project folder:
   ```bash
   cd iterative-todo-list
   ```
3. Double-click `index.html` to open it in your browser (Chrome, Firefox, Safari, Edge, or Brave).

### Method 2: Local Static Server (Recommended)
You can also serve the project with any local HTTP server:

Using Python:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

Using Node.js:
```bash
npx serve .
```

---

## 📸 Screenshots

*(Add screenshots of your application here before uploading to your GitHub portfolio)*

| Light Mode Dashboard | Dark Mode Kanban Board |
| :---: | :---: |
| ![Light Mode Dashboard](assets/images/screenshot-dashboard-light.png) | ![Dark Mode Kanban](assets/images/screenshot-kanban-dark.png) |

| Interactive Calendar | Task Creation Modal |
| :---: | :---: |
| ![Calendar View](assets/images/screenshot-calendar.png) | ![Task Modal](assets/images/screenshot-modal.png) |

---

## 🔮 Future Enhancements

- [ ] Subtasks and hierarchical task trees.
- [ ] Tagging system for multi-dimensional filtering.
- [ ] Markdown and rich-text support inside task descriptions.
- [ ] Export tasks directly to CSV / Excel spreadsheet formats.
- [ ] Web Share API integration to export individual task summaries.

---

## 👨‍💻 Author

Developed as an advanced Software Engineering portfolio project showcasing modern frontend architectural principles, clean UI/UX design, and modular Vanilla JavaScript.

