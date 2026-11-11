/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - TASKS SERVICE & MANAGER (js/tasks.js)
 * Full CRUD, search, filter, sort, bulk actions with Undo & Kanban drag-and-drop
 * ============================================================================
 */

const TaskManager = (() => {
  let tasks = [];
  let selectedTaskIds = new Set();

  let activeNavigation = 'all'; // 'dashboard' | 'all' | 'today' | 'upcoming' | 'important' | 'completed' | 'overdue' | 'category-*'
  let currentCategoryId = null;

  let searchQuery = '';
  let priorityFilter = 'all'; // 'all' | 'high' | 'medium' | 'low'
  let statusFilter = 'all';   // 'all' | 'todo' | 'in-progress' | 'completed'
  let sortBy = 'newest';      // 'newest' | 'oldest' | 'dueDate-asc' | 'dueDate-desc' | 'priority-desc' | 'priority-asc' | 'alpha-asc'
  let viewMode = 'list';      // 'list' | 'grid' | 'kanban'

  // Initialize
  const init = () => {
    tasks = StorageService.getTasks();
    const settings = StorageService.getSettings();
    if (settings.defaultView) viewMode = settings.defaultView;

    setupToolbarListeners();
    setupKanbanDragDrop();
    updateSidebarCounters();
  };

  const getAllTasks = () => tasks;

  const getTaskById = (id) => tasks.find(t => t.id === id) || null;

  // --- CRUD Operations ---
  const createTask = (taskData) => {
    if (!taskData.title || !taskData.title.trim()) {
      return { success: false, error: 'Task title is required' };
    }

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : '',
      startDate: taskData.startDate || null,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || 'medium',
      categoryId: taskData.categoryId || null,
      status: taskData.status || 'todo',
      isImportant: Boolean(taskData.isImportant),
      recurrence: taskData.recurrence || { type: 'none', interval: 1 },
      seriesId: taskData.seriesId || null,
      occurrenceCount: 1,
      reminder: taskData.reminder || { enabled: false },
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    tasks.unshift(newTask);
    StorageService.saveTasks(tasks);

    NotificationManager.addNotification({
      title: 'Task Created',
      message: `"${newTask.title}" was added.`,
      type: 'info',
      taskId: newTask.id
    });

    NotificationManager.showToast(`Task "${newTask.title}" created`, 'success');

    onDataChanged();
    return { success: true, task: newTask };
  };

  const createQuickTask = (title) => {
    if (!title || !title.trim()) return false;
    const settings = StorageService.getSettings();
    return createTask({
      title: title.trim(),
      description: '',
      priority: settings.defaultPriority || 'medium',
      status: 'todo',
      categoryId: currentCategoryId || null,
      dueDate: activeNavigation === 'today' ? new Date().toISOString().split('T')[0] : null
    });
  };

  const updateTask = (id, updatedFields) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return { success: false, error: 'Task not found' };

    const oldTask = tasks[index];
    const wasCompleted = oldTask.status === 'completed';
    const isNowCompleted = updatedFields.status === 'completed';

    // Merge updates
    tasks[index] = {
      ...oldTask,
      ...updatedFields,
      title: updatedFields.title ? updatedFields.title.trim() : oldTask.title,
      description: updatedFields.description !== undefined ? updatedFields.description.trim() : oldTask.description
    };

    // If status changed to completed, handle recurrence
    if (!wasCompleted && isNowCompleted) {
      tasks[index].completedAt = new Date().toISOString();
      const nextTask = RecurringEngine.handleTaskCompletion(tasks[index], tasks);
      if (nextTask) {
        tasks.unshift(nextTask);
        NotificationManager.showToast(`Recurring task completed! Next occurrence scheduled for ${nextTask.dueDate}`, 'success');
      }
    } else if (wasCompleted && !isNowCompleted) {
      tasks[index].completedAt = null;
    }

    StorageService.saveTasks(tasks);
    NotificationManager.showToast(`Task "${tasks[index].title}" updated`, 'info');
    onDataChanged();
    return { success: true, task: tasks[index] };
  };

  const deleteTask = (id) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const [deletedTask] = tasks.splice(index, 1);
    StorageService.saveTasks(tasks);

    // Save to Undo stack
    const undoStack = StorageService.getUndoStack();
    undoStack.push({
      action: 'delete_single',
      tasks: [deletedTask],
      timestamp: Date.now()
    });
    StorageService.saveUndoStack(undoStack);

    // Toast with Undo button
    NotificationManager.showToast(
      `Task "${deletedTask.title}" deleted`,
      'info',
      'Undo',
      () => undoLastAction()
    );

    NotificationManager.addNotification({
      title: 'Task Deleted',
      message: `"${deletedTask.title}" was deleted.`,
      type: 'warning'
    });

    selectedTaskIds.delete(id);
    onDataChanged();
    return true;
  };

  const toggleComplete = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.status === 'completed') {
      task.status = 'todo';
      task.completedAt = null;
      NotificationManager.showToast(`Task marked as incomplete`, 'info');
    } else {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      NotificationManager.playCompletionSound();

      // Recurrence check
      const nextTask = RecurringEngine.handleTaskCompletion(task, tasks);
      if (nextTask) {
        tasks.unshift(nextTask);
        NotificationManager.showToast(`Task completed! Next occurrence scheduled for ${nextTask.dueDate}`, 'success');
      } else {
        NotificationManager.showToast(`Task completed! Great job!`, 'success');
      }

      NotificationManager.addNotification({
        title: 'Task Completed',
        message: `"${task.title}" was marked as completed.`,
        type: 'success',
        taskId: task.id
      });
    }

    StorageService.saveTasks(tasks);
    onDataChanged();
  };

  const toggleImportant = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.isImportant = !task.isImportant;
    StorageService.saveTasks(tasks);
    onDataChanged();
  };

  const updateStatus = (id, newStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    task.status = newStatus;

    if (newStatus === 'completed' && oldStatus !== 'completed') {
      task.completedAt = new Date().toISOString();
      NotificationManager.playCompletionSound();
      const nextTask = RecurringEngine.handleTaskCompletion(task, tasks);
      if (nextTask) {
        tasks.unshift(nextTask);
        NotificationManager.showToast(`Task moved to Completed! Next occurrence created for ${nextTask.dueDate}`, 'success');
      } else {
        NotificationManager.showToast(`Task moved to Completed`, 'success');
      }
    } else if (newStatus !== 'completed' && oldStatus === 'completed') {
      task.completedAt = null;
    }

    StorageService.saveTasks(tasks);
    onDataChanged();
  };

  // --- Bulk Actions & Undo System ---
  const toggleSelectTask = (id) => {
    if (selectedTaskIds.has(id)) {
      selectedTaskIds.delete(id);
    } else {
      selectedTaskIds.add(id);
    }
    updateBulkBar();
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredAndSortedTasks();
    if (selectedTaskIds.size === filtered.length) {
      selectedTaskIds.clear();
    } else {
      filtered.forEach(t => selectedTaskIds.add(t.id));
    }
    renderCurrentView();
    updateBulkBar();
  };

  const clearSelection = () => {
    selectedTaskIds.clear();
    renderCurrentView();
    updateBulkBar();
  };

  const bulkComplete = () => {
    if (selectedTaskIds.size === 0) return;
    let count = 0;
    selectedTaskIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task && task.status !== 'completed') {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        count++;

        const nextTask = RecurringEngine.handleTaskCompletion(task, tasks);
        if (nextTask) {
          tasks.unshift(nextTask);
        }
      }
    });

    StorageService.saveTasks(tasks);
    NotificationManager.playCompletionSound();
    NotificationManager.showToast(`${count} tasks marked as completed`, 'success');
    selectedTaskIds.clear();
    onDataChanged();
  };

  const bulkDelete = () => {
    if (selectedTaskIds.size === 0) return;
    const deletedTasks = [];
    tasks = tasks.filter(task => {
      if (selectedTaskIds.has(task.id)) {
        deletedTasks.push(task);
        return false;
      }
      return true;
    });

    StorageService.saveTasks(tasks);

    // Save batch to Undo stack
    const undoStack = StorageService.getUndoStack();
    undoStack.push({
      action: 'delete_bulk',
      tasks: deletedTasks,
      timestamp: Date.now()
    });
    StorageService.saveUndoStack(undoStack);

    const count = deletedTasks.length;
    selectedTaskIds.clear();

    NotificationManager.showToast(
      `${count} tasks deleted`,
      'info',
      'Undo',
      () => undoLastAction()
    );

    onDataChanged();
  };

  const undoLastAction = () => {
    const undoStack = StorageService.getUndoStack();
    if (undoStack.length === 0) {
      NotificationManager.showToast('Nothing to undo', 'info');
      return;
    }

    const last = undoStack.pop();
    StorageService.saveUndoStack(undoStack);

    if (last.tasks && Array.isArray(last.tasks)) {
      // Re-insert restored tasks
      last.tasks.forEach(t => {
        if (!tasks.some(existing => existing.id === t.id)) {
          tasks.unshift(t);
        }
      });
      StorageService.saveTasks(tasks);
      NotificationManager.showToast(`Restored ${last.tasks.length} task(s)`, 'success');
      onDataChanged();
    }
  };

  const updateBulkBar = () => {
    const bulkBar = document.getElementById('tasks-bulk-bar');
    const bulkCountEl = document.getElementById('bulk-selected-count');
    if (!bulkBar || !bulkCountEl) return;

    if (selectedTaskIds.size > 0) {
      bulkBar.classList.add('visible');
      bulkCountEl.textContent = `${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? 's' : ''} selected`;
    } else {
      bulkBar.classList.remove('visible');
    }
  };

  // --- Filtering & Sorting ---
  const getFilteredAndSortedTasks = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    let result = tasks.filter(task => {
      // 1. Navigation Filter
      if (activeNavigation === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (activeNavigation === 'upcoming') {
        if (!task.dueDate || task.dueDate <= todayStr || task.status === 'completed') return false;
      } else if (activeNavigation === 'important') {
        if (!task.isImportant) return false;
      } else if (activeNavigation === 'completed') {
        if (task.status !== 'completed') return false;
      } else if (activeNavigation === 'overdue') {
        if (!task.dueDate || task.dueDate >= todayStr || task.status === 'completed') return false;
      } else if (activeNavigation.startsWith('category-')) {
        const catId = activeNavigation.replace('category-', '');
        if (task.categoryId !== catId) return false;
      }

      // 2. Toolbar Priority Filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // 3. Toolbar Status Filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // 4. Global Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(q);
        const descMatch = (task.description || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });

    // Sort Result
    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate-asc': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        case 'dueDate-desc': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return b.dueDate.localeCompare(a.dueDate);
        }
        case 'priority-desc': {
          const map = { high: 3, medium: 2, low: 1 };
          return map[b.priority] - map[a.priority];
        }
        case 'priority-asc': {
          const map = { high: 3, medium: 2, low: 1 };
          return map[a.priority] - map[b.priority];
        }
        case 'oldest': {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        case 'alpha-asc': {
          return a.title.localeCompare(b.title);
        }
        case 'newest':
        default: {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
      }
    });

    return result;
  };

  // --- Rendering Functions ---
  const renderCurrentView = () => {
    const listContainer = document.getElementById('tasks-list-container');
    const gridContainer = document.getElementById('tasks-grid-container');
    const kanbanContainer = document.getElementById('tasks-kanban-container');

    if (!listContainer || !gridContainer || !kanbanContainer) return;

    // Toggle container visibilities according to viewMode
    listContainer.style.display = viewMode === 'list' ? 'flex' : 'none';
    gridContainer.style.display = viewMode === 'grid' ? 'grid' : 'none';
    kanbanContainer.style.display = viewMode === 'kanban' ? 'grid' : 'none';

    const filteredTasks = getFilteredAndSortedTasks();

    if (viewMode === 'list') {
      renderListView(filteredTasks, listContainer);
    } else if (viewMode === 'grid') {
      renderGridView(filteredTasks, gridContainer);
    } else if (viewMode === 'kanban') {
      renderKanbanView(filteredTasks, kanbanContainer);
    }

    if (window.lucide) window.lucide.createIcons();
    attachTaskItemListeners();
  };

  // 1. LIST VIEW RENDERER
  const renderListView = (taskList, container) => {
    if (taskList.length === 0) {
      container.innerHTML = getEmptyStateHtml();
      return;
    }

    container.innerHTML = taskList.map(task => {
      const isChecked = task.status === 'completed';
      const isSelected = selectedTaskIds.has(task.id);
      const category = task.categoryId ? CategoryManager.getById(task.categoryId) : null;
      const dueDateInfo = formatDueDateBadge(task.dueDate);
      const recurrenceLabel = RecurringEngine.getRecurrenceLabel(task.recurrence);

      return `
        <div class="task-list-row ${isChecked ? 'completed' : ''}" data-id="${task.id}">
          <input type="checkbox" class="task-select-checkbox" data-select-id="${task.id}" ${isSelected ? 'checked' : ''} title="Select task" />
          
          <button type="button" class="task-checkbox-custom ${isChecked ? 'checked' : ''}" data-complete-id="${task.id}" title="Toggle Complete">
            <i data-lucide="check" style="width:13px; height:13px;"></i>
          </button>

          <div class="task-content-wrapper" data-edit-id="${task.id}">
            <div class="task-title-line">
              <span class="task-main-title">${NotificationManager.escapeHtml(task.title)}</span>
              ${task.isImportant ? '<i data-lucide="star" style="width:14px; height:14px; fill:#fbbf24; color:#fbbf24;"></i>' : ''}
              ${recurrenceLabel ? `<span class="recurrence-badge" title="Recurring: ${recurrenceLabel}"><i data-lucide="repeat" style="width:11px; height:11px;"></i> ${recurrenceLabel}</span>` : ''}
            </div>

            ${task.description ? `<div class="task-desc-preview">${NotificationManager.escapeHtml(task.description)}</div>` : ''}

            <div class="task-meta-line">
              <span class="priority-badge ${task.priority}">${task.priority}</span>
              ${category ? `
                <span class="category-pill">
                  <span class="category-pill-dot" style="background-color: ${category.color};"></span>
                  ${NotificationManager.escapeHtml(category.name)}
                </span>
              ` : ''}
              ${dueDateInfo ? `<span class="date-badge ${dueDateInfo.className}"><i data-lucide="calendar" style="width:12px; height:12px;"></i> ${dueDateInfo.label}</span>` : ''}
            </div>
          </div>

          <div class="task-row-actions">
            <button type="button" class="task-action-btn star-btn ${task.isImportant ? 'starred' : ''}" data-star-id="${task.id}" title="Mark Important">
              <i data-lucide="star" style="width:15px; height:15px; ${task.isImportant ? 'fill:#fbbf24;' : ''}"></i>
            </button>
            <button type="button" class="task-action-btn edit-task-btn" data-edit-id="${task.id}" title="Edit Task">
              <i data-lucide="edit-3" style="width:15px; height:15px;"></i>
            </button>
            <button type="button" class="task-action-btn delete-btn delete-task-btn" data-delete-id="${task.id}" title="Delete Task">
              <i data-lucide="trash-2" style="width:15px; height:15px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  // 2. GRID VIEW RENDERER
  const renderGridView = (taskList, container) => {
    if (taskList.length === 0) {
      container.innerHTML = getEmptyStateHtml();
      return;
    }

    container.innerHTML = taskList.map(task => {
      const isChecked = task.status === 'completed';
      const isSelected = selectedTaskIds.has(task.id);
      const category = task.categoryId ? CategoryManager.getById(task.categoryId) : null;
      const dueDateInfo = formatDueDateBadge(task.dueDate);
      const recurrenceLabel = RecurringEngine.getRecurrenceLabel(task.recurrence);

      return `
        <div class="task-grid-card ${isChecked ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-card-top">
            <div class="task-card-header-left">
              <input type="checkbox" class="task-select-checkbox" data-select-id="${task.id}" ${isSelected ? 'checked' : ''} />
              <button type="button" class="task-checkbox-custom ${isChecked ? 'checked' : ''}" data-complete-id="${task.id}">
                <i data-lucide="check" style="width:13px; height:13px;"></i>
              </button>
              <span class="priority-badge ${task.priority}">${task.priority}</span>
            </div>

            <button type="button" class="task-action-btn star-btn ${task.isImportant ? 'starred' : ''}" data-star-id="${task.id}" title="Important">
              <i data-lucide="star" style="width:15px; height:15px; ${task.isImportant ? 'fill:#fbbf24;' : ''}"></i>
            </button>
          </div>

          <div class="task-card-title" data-edit-id="${task.id}">${NotificationManager.escapeHtml(task.title)}</div>

          ${task.description ? `<div class="task-card-desc">${NotificationManager.escapeHtml(task.description)}</div>` : ''}

          <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.25rem;">
            ${category ? `
              <span class="category-pill">
                <span class="category-pill-dot" style="background-color: ${category.color};"></span>
                ${NotificationManager.escapeHtml(category.name)}
              </span>
            ` : ''}
            ${recurrenceLabel ? `<span class="recurrence-badge"><i data-lucide="repeat" style="width:11px; height:11px;"></i> ${recurrenceLabel}</span>` : ''}
          </div>

          <div class="task-card-footer">
            ${dueDateInfo ? `<span class="date-badge ${dueDateInfo.className}"><i data-lucide="calendar" style="width:12px; height:12px;"></i> ${dueDateInfo.label}</span>` : '<span></span>'}
            
            <div style="display:flex; gap:0.25rem;">
              <button type="button" class="task-action-btn edit-task-btn" data-edit-id="${task.id}" title="Edit">
                <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
              </button>
              <button type="button" class="task-action-btn delete-btn delete-task-btn" data-delete-id="${task.id}" title="Delete">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  // 3. KANBAN VIEW RENDERER
  const renderKanbanView = (taskList, container) => {
    const todoCards = taskList.filter(t => t.status === 'todo');
    const inProgressCards = taskList.filter(t => t.status === 'in-progress');
    const completedCards = taskList.filter(t => t.status === 'completed');

    const renderColumnHtml = (columnStatus, title, cards) => `
      <div class="kanban-column" data-status="${columnStatus}">
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <span class="kanban-status-dot ${columnStatus}"></span>
            ${title}
          </div>
          <span class="kanban-count-badge">${cards.length}</span>
        </div>

        <div class="kanban-cards-wrapper" data-column-status="${columnStatus}">
          ${cards.length === 0 ? `
            <div style="text-align: center; color: var(--text-tertiary); font-size: 0.82rem; padding: 3rem 1rem;">
              <i data-lucide="inbox" style="width: 24px; height: 24px; margin: 0 auto 0.4rem; display: block; opacity: 0.4;"></i>
              No ${title} tasks
            </div>
          ` : cards.map(task => {
            const category = task.categoryId ? CategoryManager.getById(task.categoryId) : null;
            const dueDateInfo = formatDueDateBadge(task.dueDate);
            const recurrenceLabel = RecurringEngine.getRecurrenceLabel(task.recurrence);

            return `
              <div class="kanban-card" draggable="true" data-id="${task.id}">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <span class="priority-badge ${task.priority}">${task.priority}</span>
                  <div style="display:flex; align-items:center; gap:0.25rem;">
                    ${task.isImportant ? '<i data-lucide="star" style="width:13px; height:13px; fill:#fbbf24; color:#fbbf24;"></i>' : ''}
                    <button type="button" class="task-action-btn edit-task-btn" data-edit-id="${task.id}" style="width:20px; height:20px;">
                      <i data-lucide="more-horizontal" style="width:14px; height:14px;"></i>
                    </button>
                  </div>
                </div>

                <div class="kanban-card-title" data-edit-id="${task.id}">${NotificationManager.escapeHtml(task.title)}</div>

                ${task.description ? `<div class="kanban-card-desc">${NotificationManager.escapeHtml(task.description)}</div>` : ''}

                <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.35rem; font-size:0.75rem;">
                  ${category ? `
                    <span class="category-pill" style="font-size:0.68rem; padding:0.1rem 0.4rem;">
                      <span class="category-pill-dot" style="background-color: ${category.color};"></span>
                      ${NotificationManager.escapeHtml(category.name)}
                    </span>
                  ` : '<span></span>'}

                  ${dueDateInfo ? `<span class="date-badge ${dueDateInfo.className}" style="font-size:0.7rem;"><i data-lucide="calendar" style="width:11px; height:11px;"></i> ${dueDateInfo.label}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = `
      ${renderColumnHtml('todo', 'To Do', todoCards)}
      ${renderColumnHtml('in-progress', 'In Progress', inProgressCards)}
      ${renderColumnHtml('completed', 'Completed', completedCards)}
    `;
  };

  // --- Attach Event Listeners to rendered tasks ---
  const attachTaskItemListeners = () => {
    // 1. Complete toggle
    document.querySelectorAll('[data-complete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleComplete(btn.dataset.completeId);
      });
    });

    // 2. Select checkbox
    document.querySelectorAll('[data-select-id]').forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSelectTask(cb.dataset.selectId);
      });
    });

    // 3. Star toggle
    document.querySelectorAll('[data-star-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleImportant(btn.dataset.starId);
      });
    });

    // 4. Edit Task trigger
    document.querySelectorAll('[data-edit-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.editId;
        if (window.App && typeof window.App.openTaskModal === 'function') {
          window.App.openTaskModal(id);
        }
      });
    });

    // 5. Delete Task trigger
    document.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        const task = getTaskById(id);
        if (!task) return;

        if (window.App && typeof window.App.showConfirmModal === 'function') {
          window.App.showConfirmModal({
            title: 'Delete Task',
            description: `Are you sure you want to delete "${task.title}"? You can restore it immediately using Undo.`,
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: () => deleteTask(id)
          });
        } else {
          deleteTask(id);
        }
      });
    });
  };

  // --- Kanban Drag and Drop Logic ---
  const setupKanbanDragDrop = () => {
    document.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.kanban-card');
      if (card) {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    document.addEventListener('dragend', (e) => {
      const card = e.target.closest('.kanban-card');
      if (card) {
        card.classList.remove('dragging');
      }
      document.querySelectorAll('.kanban-cards-wrapper').forEach(w => w.classList.remove('drag-over'));
    });

    document.addEventListener('dragover', (e) => {
      const wrapper = e.target.closest('.kanban-cards-wrapper');
      if (wrapper) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        wrapper.classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      const wrapper = e.target.closest('.kanban-cards-wrapper');
      if (wrapper && !wrapper.contains(e.relatedTarget)) {
        wrapper.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      const wrapper = e.target.closest('.kanban-cards-wrapper');
      if (wrapper) {
        e.preventDefault();
        wrapper.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = wrapper.dataset.columnStatus;
        if (taskId && newStatus) {
          updateStatus(taskId, newStatus);
        }
      }
    });
  };

  // --- Toolbar Filter & View Switcher Listeners ---
  const setupToolbarListeners = () => {
    // 1. View Switchers (List, Grid, Kanban)
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');
    const kanbanBtn = document.getElementById('view-kanban-btn');

    const updateViewButtons = (mode) => {
      [listBtn, gridBtn, kanbanBtn].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (mode === 'list' && listBtn) listBtn.classList.add('active');
      if (mode === 'grid' && gridBtn) gridBtn.classList.add('active');
      if (mode === 'kanban' && kanbanBtn) kanbanBtn.classList.add('active');
    };

    if (listBtn) listBtn.addEventListener('click', () => setViewMode('list'));
    if (gridBtn) gridBtn.addEventListener('click', () => setViewMode('grid'));
    if (kanbanBtn) kanbanBtn.addEventListener('click', () => setViewMode('kanban'));

    // 2. Priority Filter Select
    const prioritySelect = document.getElementById('filter-priority-select');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        priorityFilter = e.target.value;
        renderCurrentView();
      });
    }

    // 3. Status Filter Select
    const statusSelect = document.getElementById('filter-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        statusFilter = e.target.value;
        renderCurrentView();
      });
    }

    // 4. Sort By Select
    const sortSelect = document.getElementById('sort-tasks-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        renderCurrentView();
      });
    }

    // 5. Bulk action buttons
    const bulkCompleteBtn = document.getElementById('bulk-complete-btn');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const bulkClearBtn = document.getElementById('bulk-clear-btn');

    if (bulkCompleteBtn) bulkCompleteBtn.addEventListener('click', bulkComplete);
    if (bulkDeleteBtn) {
      bulkDeleteBtn.addEventListener('click', () => {
        if (window.App && typeof window.App.showConfirmModal === 'function') {
          window.App.showConfirmModal({
            title: 'Delete Selected Tasks',
            description: `Are you sure you want to delete ${selectedTaskIds.size} selected tasks? You can restore them with Undo.`,
            confirmText: 'Delete All Selected',
            isDanger: true,
            onConfirm: () => bulkDelete()
          });
        } else {
          bulkDelete();
        }
      });
    }
    if (bulkClearBtn) bulkClearBtn.addEventListener('click', clearSelection);
  };

  const setViewMode = (mode) => {
    viewMode = mode;
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');
    const kanbanBtn = document.getElementById('view-kanban-btn');
    [listBtn, gridBtn, kanbanBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    if (mode === 'list' && listBtn) listBtn.classList.add('active');
    if (mode === 'grid' && gridBtn) gridBtn.classList.add('active');
    if (mode === 'kanban' && kanbanBtn) kanbanBtn.classList.add('active');

    renderCurrentView();
  };

  const setSearchQuery = (q) => {
    searchQuery = q.trim();
    renderCurrentView();
  };

  const setNavigation = (nav, categoryId = null) => {
    activeNavigation = nav;
    currentCategoryId = categoryId;
    selectedTaskIds.clear();
    updateBulkBar();
    renderCurrentView();
  };

  // Update counters on sidebar items
  const updateSidebarCounters = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const allCount = tasks.filter(t => t.status !== 'completed').length;
    const todayCount = tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed').length;
    const upcomingCount = tasks.filter(t => t.dueDate && t.dueDate > todayStr && t.status !== 'completed').length;
    const importantCount = tasks.filter(t => t.isImportant && t.status !== 'completed').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const overdueCount = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };

    setBadge('badge-all-tasks', allCount);
    setBadge('badge-my-day', todayCount);
    setBadge('badge-upcoming', upcomingCount);
    setBadge('badge-important', importantCount);
    setBadge('badge-completed', completedCount);
    setBadge('badge-overdue', overdueCount);
  };

  // Called whenever tasks are modified
  const onDataChanged = () => {
    updateSidebarCounters();
    CategoryManager.renderSidebarCategories();
    renderCurrentView();

    // Notify Dashboard & Calendar if initialized
    if (window.DashboardView && typeof window.DashboardView.updateDashboard === 'function') {
      window.DashboardView.updateDashboard();
    }
    if (window.CalendarView && typeof window.CalendarView.render === 'function') {
      window.CalendarView.render();
    }
  };

  // Helper: Friendly Due Date Badge
  const formatDueDateBadge = (dueDateStr) => {
    if (!dueDateStr) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const dueObj = new Date(dueDateStr + 'T00:00:00');
    const todayObj = new Date(todayStr + 'T00:00:00');

    const diffDays = Math.round((dueObj - todayObj) / 86400000);

    if (diffDays < 0) {
      return { label: `Overdue (${Math.abs(diffDays)}d ago)`, className: 'overdue' };
    } else if (diffDays === 0) {
      return { label: 'Today', className: 'today' };
    } else if (diffDays === 1) {
      return { label: 'Tomorrow', className: '' };
    } else {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return {
        label: `${monthNames[dueObj.getMonth()]} ${dueObj.getDate()}`,
        className: ''
      };
    }
  };

  // Helper: Empty State HTML
  const getEmptyStateHtml = () => `
    <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
      <div class="empty-state-icon">
        <i data-lucide="check-circle-2" style="width:36px; height:36px; color:var(--primary);"></i>
      </div>
      <div class="empty-state-title">You're all caught up!</div>
      <div class="empty-state-desc">
        ${searchQuery ? `No tasks matched your search query "${NotificationManager.escapeHtml(searchQuery)}".` : "You're all caught up! Create your first task to get started."}
      </div>
      ${!searchQuery ? `
        <button type="button" class="btn-primary" onclick="App.openTaskModal()" style="margin-top:0.75rem;">
          <i data-lucide="plus" style="width:16px; height:16px;"></i> Create Your First Task
        </button>
      ` : ''}
    </div>
  `;

  return {
    init,
    getAllTasks,
    getTaskById,
    createTask,
    createQuickTask,
    updateTask,
    deleteTask,
    toggleComplete,
    toggleImportant,
    updateStatus,
    toggleSelectTask,
    selectAllFiltered,
    clearSelection,
    bulkComplete,
    bulkDelete,
    undoLastAction,
    setNavigation,
    setSearchQuery,
    setViewMode,
    renderCurrentView,
    updateSidebarCounters,
    onDataChanged
  };
})();

