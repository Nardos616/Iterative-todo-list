/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - MAIN APPLICATION CONTROLLER (js/app.js)
 * Router, navigation coordinator, modal handlers, search bar & keyboard shortcuts
 * ============================================================================
 */

window.App = (() => {
  let currentNav = 'dashboard';
  let activeEditingTaskId = null;
  let confirmCallback = null;

  // Initialize Application
  const init = () => {
    // 1. Initialize Subsystems in order
    StorageService.init();
    SettingsManager.init();
    CategoryManager.updateUI();
    NotificationManager.init();
    TaskManager.init();
    DashboardView.init();
    CalendarView.init();

    // 2. Setup App Events
    setupCurrentDate();
    setupNavigation();
    setupSidebarToggle();
    setupQuickAdd();
    setupSearch();
    setupTaskModal();
    setupCategoryModal();
    setupConfirmModal();
    setupShortcuts();

    // 3. Render icons
    if (window.lucide) window.lucide.createIcons();

    // 4. Default view
    navigateTo('dashboard');
  };

  // --- Display formatted current date in header ---
  const setupCurrentDate = () => {
    const dateEl = document.getElementById('header-current-date');
    if (!dateEl) return;
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  };

  // --- Navigation & View Switching ---
  const setupNavigation = () => {
    const navItems = document.querySelectorAll('#app-sidebar [data-nav]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetNav = item.dataset.nav;
        navigateTo(targetNav);
        closeMobileSidebar();
      });
    });
  };

  const navigateTo = (navName, categoryId = null) => {
    currentNav = navName;

    // Remove active from all sidebar navs & categories
    document.querySelectorAll('#app-sidebar .nav-item, .category-item').forEach(el => {
      el.classList.remove('active');
    });

    // Mark current active in sidebar
    if (categoryId) {
      const catEl = document.querySelector(`.category-item[data-category-id="${categoryId}"]`);
      if (catEl) catEl.classList.add('active');
    } else {
      const navEl = document.querySelector(`#app-sidebar [data-nav="${navName}"]`);
      if (navEl) navEl.classList.add('active');
    }

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    const titleEl = document.getElementById('header-view-title');
    const quickAddBar = document.getElementById('tasks-quick-add');

    // Branch to view
    if (navName === 'dashboard') {
      const viewDashboard = document.getElementById('view-dashboard');
      if (viewDashboard) viewDashboard.classList.add('active');
      if (titleEl) titleEl.textContent = 'Dashboard Overview';
      if (quickAddBar) quickAddBar.style.display = 'flex';
      DashboardView.updateDashboard();
    } else if (navName === 'calendar') {
      const viewCalendar = document.getElementById('view-calendar');
      if (viewCalendar) viewCalendar.classList.add('active');
      if (titleEl) titleEl.textContent = 'Task Calendar';
      if (quickAddBar) quickAddBar.style.display = 'none';
      CalendarView.render();
    } else if (navName === 'settings') {
      const viewSettings = document.getElementById('view-settings');
      if (viewSettings) viewSettings.classList.add('active');
      if (titleEl) titleEl.textContent = 'Application Settings';
      if (quickAddBar) quickAddBar.style.display = 'none';
      SettingsManager.populateSettingsForm();
    } else {
      // General Task View (All, Today, Upcoming, Important, Completed, Overdue, or Category)
      const viewTasks = document.getElementById('view-tasks');
      if (viewTasks) viewTasks.classList.add('active');
      if (quickAddBar) quickAddBar.style.display = 'flex';

      let displayTitle = 'All Tasks';
      if (navName === 'today') displayTitle = 'My Day';
      if (navName === 'upcoming') displayTitle = 'Upcoming Tasks';
      if (navName === 'important') displayTitle = 'Important Tasks';
      if (navName === 'completed') displayTitle = 'Completed Tasks';
      if (navName === 'overdue') displayTitle = 'Overdue Tasks';
      if (categoryId) {
        const cat = CategoryManager.getById(categoryId);
        displayTitle = cat ? cat.name : 'Category Tasks';
      }

      if (titleEl) titleEl.textContent = displayTitle;

      TaskManager.setNavigation(categoryId ? `category-${categoryId}` : navName, categoryId);
    }

    if (window.lucide) window.lucide.createIcons();
  };

  const navigateToCategory = (categoryId) => {
    navigateTo('category', categoryId);
  };

  const refreshCurrentView = () => {
    if (currentNav === 'dashboard') {
      DashboardView.updateDashboard();
    } else if (currentNav === 'calendar') {
      CalendarView.render();
    } else if (currentNav === 'settings') {
      SettingsManager.populateSettingsForm();
    } else {
      TaskManager.renderCurrentView();
    }
    TaskManager.updateSidebarCounters();
    CategoryManager.renderSidebarCategories();
  };

  // --- Sidebar Collapse & Mobile Menu ---
  const setupSidebarToggle = () => {
    const sidebar = document.getElementById('app-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    if (mobileBtn && sidebar && backdrop) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        backdrop.classList.add('active');
      });

      backdrop.addEventListener('click', () => {
        closeMobileSidebar();
      });
    }
  };

  const closeMobileSidebar = () => {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  };

  // --- Quick Add Input ---
  const setupQuickAdd = () => {
    const inputs = document.querySelectorAll('.quick-add-input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value.trim();
          if (val) {
            TaskManager.createQuickTask(val);
            input.value = '';
          }
        }
      });
    });
  };

  // --- Search Bar ---
  const setupSearch = () => {
    const searchInput = document.getElementById('global-search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value;
        if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

        // Auto navigate to Tasks view if user searches while in dashboard/calendar
        if (q && (currentNav === 'dashboard' || currentNav === 'calendar' || currentNav === 'settings')) {
          navigateTo('all');
        }

        TaskManager.setSearchQuery(q);
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearBtn.style.display = 'none';
          TaskManager.setSearchQuery('');
          searchInput.focus();
        });
      }
    }
  };

  // --- Task Modal (Create & Edit) ---
  const setupTaskModal = () => {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const closeBtn = document.getElementById('task-modal-close');
    const cancelBtn = document.getElementById('task-modal-cancel');
    const openAddBtn = document.getElementById('btn-header-add-task');
    const addCatInlineBtn = document.getElementById('btn-add-category-inline');

    // Open from Header Add Task button
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => openTaskModal());
    }

    // Open Category Modal from inline + button
    if (addCatInlineBtn) {
      addCatInlineBtn.addEventListener('click', () => {
        CategoryManager.openCategoryModal();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeTaskModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeTaskModal);

    // Close on backdrop click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTaskModal();
      });
    }

    // Priority button selectors inside form
    const priorityBtns = document.querySelectorAll('.priority-toggle-btn');
    priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        priorityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('task-form-priority-input').value = btn.dataset.priority;
      });
    });

    // Recurrence select toggle custom options
    const recurSelect = document.getElementById('task-form-recurrence-type');
    const recurIntervalRow = document.getElementById('recurrence-interval-row');
    if (recurSelect && recurIntervalRow) {
      recurSelect.addEventListener('change', () => {
        const val = recurSelect.value;
        recurIntervalRow.style.display = val === 'none' ? 'none' : 'grid';
      });
    }

    // Form Submit Handler
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTaskFromForm();
      });
    }
  };

  const openTaskModal = (taskId = null, prefillData = {}) => {
    const modal = document.getElementById('task-modal');
    const titleEl = document.getElementById('task-modal-title');
    const form = document.getElementById('task-form');
    const errorEl = document.getElementById('task-form-title-error');

    if (!modal || !form) return;
    if (errorEl) errorEl.classList.remove('visible');

    activeEditingTaskId = taskId;
    CategoryManager.populateCategorySelects();

    const titleInput = document.getElementById('task-form-title');
    const descInput = document.getElementById('task-form-desc');
    const startInput = document.getElementById('task-form-start-date');
    const dueInput = document.getElementById('task-form-due-date');
    const priorityHidden = document.getElementById('task-form-priority-input');
    const categorySelect = document.getElementById('task-form-category');
    const statusSelect = document.getElementById('task-form-status');
    const importantCheckbox = document.getElementById('task-form-important');
    const recurTypeSelect = document.getElementById('task-form-recurrence-type');
    const recurIntervalInput = document.getElementById('task-form-recurrence-interval');
    const recurIntervalRow = document.getElementById('recurrence-interval-row');
    const reminderToggle = document.getElementById('task-form-reminder-toggle');
    const reminderTimeInput = document.getElementById('task-form-reminder-time');
    const reminderBox = document.getElementById('reminder-time-box');

    if (taskId) {
      const task = TaskManager.getTaskById(taskId);
      if (!task) return;

      titleEl.textContent = 'Edit Task';
      titleInput.value = task.title;
      descInput.value = task.description || '';
      startInput.value = task.startDate || '';
      dueInput.value = task.dueDate || '';
      priorityHidden.value = task.priority || 'medium';
      categorySelect.value = task.categoryId || '';
      statusSelect.value = task.status || 'todo';
      importantCheckbox.checked = Boolean(task.isImportant);

      // Recurrence
      const rec = task.recurrence || { type: 'none', interval: 1 };
      recurTypeSelect.value = rec.type || 'none';
      recurIntervalInput.value = rec.interval || 1;
      recurIntervalRow.style.display = rec.type === 'none' ? 'none' : 'grid';

      // Reminder
      const rem = task.reminder || { enabled: false };
      reminderToggle.checked = Boolean(rem.enabled);
      reminderTimeInput.value = rem.time || '09:00';
      if (reminderBox) reminderBox.style.display = rem.enabled ? 'block' : 'none';

      // Priority toggle buttons
      document.querySelectorAll('.priority-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === task.priority);
      });
    } else {
      // New Task
      const settings = StorageService.getSettings();
      titleEl.textContent = 'Create New Task';
      titleInput.value = '';
      descInput.value = '';
      startInput.value = prefillData.startDate || '';
      dueInput.value = prefillData.dueDate || '';
      priorityHidden.value = settings.defaultPriority || 'medium';
      categorySelect.value = prefillData.categoryId || '';
      statusSelect.value = 'todo';
      importantCheckbox.checked = false;

      recurTypeSelect.value = 'none';
      recurIntervalInput.value = 1;
      recurIntervalRow.style.display = 'none';

      reminderToggle.checked = false;
      reminderTimeInput.value = '09:00';
      if (reminderBox) reminderBox.style.display = 'none';

      document.querySelectorAll('.priority-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === priorityHidden.value);
      });
    }

    // Toggle reminder time visibility
    if (reminderToggle && reminderBox) {
      reminderToggle.onchange = () => {
        reminderBox.style.display = reminderToggle.checked ? 'block' : 'none';
      };
    }

    modal.classList.add('active');
    setTimeout(() => titleInput.focus(), 100);
  };

  const closeTaskModal = () => {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.remove('active');
    activeEditingTaskId = null;
  };

  const saveTaskFromForm = () => {
    const titleInput = document.getElementById('task-form-title');
    const errorEl = document.getElementById('task-form-title-error');
    const title = titleInput.value.trim();

    if (!title) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a task title.';
        errorEl.classList.add('visible');
      }
      titleInput.focus();
      return;
    }

    const desc = document.getElementById('task-form-desc').value.trim();
    const startDate = document.getElementById('task-form-start-date').value || null;
    const dueDate = document.getElementById('task-form-due-date').value || null;
    const priority = document.getElementById('task-form-priority-input').value || 'medium';
    const categoryId = document.getElementById('task-form-category').value || null;
    const status = document.getElementById('task-form-status').value || 'todo';
    const isImportant = document.getElementById('task-form-important').checked;

    const recurType = document.getElementById('task-form-recurrence-type').value;
    const recurInterval = parseInt(document.getElementById('task-form-recurrence-interval').value, 10) || 1;
    const recurrence = {
      type: recurType,
      interval: recurInterval
    };

    const reminderEnabled = document.getElementById('task-form-reminder-toggle').checked;
    const reminderTime = document.getElementById('task-form-reminder-time').value || '09:00';
    const reminder = {
      enabled: reminderEnabled,
      time: reminderTime,
      notified: false
    };

    if (activeEditingTaskId) {
      TaskManager.updateTask(activeEditingTaskId, {
        title,
        description: desc,
        startDate,
        dueDate,
        priority,
        categoryId,
        status,
        isImportant,
        recurrence,
        reminder
      });
    } else {
      TaskManager.createTask({
        title,
        description: desc,
        startDate,
        dueDate,
        priority,
        categoryId,
        status,
        isImportant,
        recurrence,
        reminder
      });
    }

    closeTaskModal();
  };

  // --- Category Modal (Create & Edit) ---
  const setupCategoryModal = () => {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const closeBtn = document.getElementById('category-modal-close');
    const cancelBtn = document.getElementById('category-modal-cancel');

    if (closeBtn) closeBtn.addEventListener('click', closeCategoryModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCategoryModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCategoryModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCategoryFromForm();
      });
    }
  };

  const closeCategoryModal = () => {
    const modal = document.getElementById('category-modal');
    if (modal) modal.classList.remove('active');
  };

  const saveCategoryFromForm = () => {
    const nameInput = document.getElementById('category-name-input');
    const idInput = document.getElementById('category-id-hidden');
    const colorInput = document.getElementById('category-custom-color');
    const errorEl = document.getElementById('category-form-error');

    const name = nameInput.value.trim();
    const id = idInput.value;
    const color = colorInput.value;

    if (!name) {
      if (errorEl) {
        errorEl.textContent = 'Category name cannot be empty.';
        errorEl.classList.add('visible');
      }
      nameInput.focus();
      return;
    }

    let result;
    if (id) {
      result = CategoryManager.update(id, name, color);
    } else {
      result = CategoryManager.add(name, color);
    }

    if (result.success) {
      NotificationManager.showToast(`Category "${name}" saved!`, 'success');
      closeCategoryModal();
      refreshCurrentView();
    } else {
      if (errorEl) {
        errorEl.textContent = result.error;
        errorEl.classList.add('visible');
      }
    }
  };

  // --- Reusable Confirmation Modal ---
  const setupConfirmModal = () => {
    const modal = document.getElementById('confirm-modal');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const confirmBtn = document.getElementById('confirm-modal-ok');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        confirmCallback = null;
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (typeof confirmCallback === 'function') {
          confirmCallback();
        }
        confirmCallback = null;
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          confirmCallback = null;
        }
      });
    }
  };

  const showConfirmModal = ({ title, description, confirmText = 'Confirm', isDanger = false, onConfirm }) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const descEl = document.getElementById('confirm-modal-desc');
    const okBtn = document.getElementById('confirm-modal-ok');

    if (!modal) return;

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
    if (okBtn) {
      okBtn.textContent = confirmText;
      if (isDanger) {
        okBtn.className = 'btn-primary';
        okBtn.style.backgroundColor = 'var(--priority-high)';
      } else {
        okBtn.className = 'btn-primary';
        okBtn.style.backgroundColor = 'var(--primary)';
      }
    }

    confirmCallback = onConfirm;
    modal.classList.add('active');
  };

  // --- Keyboard Shortcuts ---
  const setupShortcuts = () => {
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const shortcutsClose = document.getElementById('shortcuts-modal-close');
    const openShortcutsBtn = document.getElementById('sidebar-shortcuts-btn');

    if (shortcutsClose) {
      shortcutsClose.addEventListener('click', () => shortcutsModal.classList.remove('active'));
    }

    if (openShortcutsBtn) {
      openShortcutsBtn.addEventListener('click', () => shortcutsModal.classList.add('active'));
    }

    if (shortcutsModal) {
      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) shortcutsModal.classList.remove('active');
      });
    }

    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT';

      // 1. Escape key closes all modals & dropdowns
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
        const notifDropdown = document.getElementById('notification-dropdown');
        if (notifDropdown) notifDropdown.classList.remove('active');
        return;
      }

      // If user is currently typing in an input, do not trigger single-letter shortcuts
      if (isInput) return;

      // 'N' or 'n': New Task
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openTaskModal();
      }

      // 'Q' or 'q': Focus Quick Add
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        const qi = document.querySelector('.quick-add-input');
        if (qi) qi.focus();
      }

      // '/' or 'Ctrl+K': Focus Search
      if (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }

      // '?' : Show keyboard shortcuts cheat sheet
      if (e.key === '?') {
        e.preventDefault();
        if (shortcutsModal) shortcutsModal.classList.add('active');
      }

      // '1' - Dashboard, '2' - All Tasks, '3' - Calendar, '4' - Settings
      if (e.key === '1') navigateTo('dashboard');
      if (e.key === '2') navigateTo('all');
      if (e.key === '3') navigateTo('calendar');
      if (e.key === '4') navigateTo('settings');
    });
  };

  return {
    init,
    navigateTo,
    navigateToCategory,
    openTaskModal,
    closeTaskModal,
    showConfirmModal,
    refreshCurrentView
  };
})();

// Bootstrap App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});

