/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - STORAGE SERVICE (js/storage.js)
 * LocalStorage wrapper, schema validation, backup export/import & default seeds
 * ============================================================================
 */

const StorageService = (() => {
  const KEYS = {
    TASKS: 'iterative_tasks_v1',
    CATEGORIES: 'iterative_categories_v1',
    SETTINGS: 'iterative_settings_v1',
    NOTIFICATIONS: 'iterative_notifications_v1',
    UNDO_STACK: 'iterative_undo_stack_v1'
  };

  // Initial Categories (clean starter categories)
  const DEFAULT_CATEGORIES = [
    { id: 'cat-work', name: 'Work', color: '#8b5cf6' },
    { id: 'cat-education', name: 'Education', color: '#10b981' },
    { id: 'cat-programming', name: 'Programming', color: '#6366f1' },
    { id: 'cat-projects', name: 'Projects', color: '#f59e0b' },
    { id: 'cat-personal', name: 'Personal', color: '#3b82f6' }
  ];

  // Empty initial tasks (no demo, sample, or predefined tasks)
  const DEFAULT_TASKS = [];

  // Default Settings
  const DEFAULT_SETTINGS = {
    theme: 'light', // 'light' | 'dark' | 'system'
    defaultPriority: 'medium',
    defaultView: 'list', // 'list' | 'grid' | 'kanban'
    browserNotifications: false,
    soundEnabled: true
  };

  // Safe JSON parse wrapper
  const safeParse = (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item);
    } catch (err) {
      console.warn(`[StorageService] Failed to parse key ${key}, using fallback:`, err);
      return fallback;
    }
  };

  // Initialize data if not present
  const init = () => {
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      saveCategories(DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem(KEYS.TASKS)) {
      saveTasks([]);
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      saveSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      saveNotifications([
        {
          id: 'notif-welcome',
          title: 'Welcome to Iterative To-Do List!',
          message: "You're all caught up! Create your first task to get started.",
          time: new Date().toISOString(),
          read: false,
          type: 'info'
        }
      ]);
    }
  };

  // --- Task Methods ---
  const getTasks = () => {
    const raw = safeParse(KEYS.TASKS, []);
    // Ensure any pre-existing demo or sample tasks from prior sessions are purged
    const clean = raw.filter(t => !['task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8'].includes(t.id));
    if (clean.length !== raw.length) {
      saveTasks(clean);
    }
    return clean;
  };
  const saveTasks = (tasks) => {
    try {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (err) {
      console.error('[StorageService] Error saving tasks:', err);
      return false;
    }
  };

  // --- Category Methods ---
  const getCategories = () => safeParse(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  const saveCategories = (categories) => {
    try {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
      return true;
    } catch (err) {
      console.error('[StorageService] Error saving categories:', err);
      return false;
    }
  };

  // --- Settings Methods ---
  const getSettings = () => safeParse(KEYS.SETTINGS, DEFAULT_SETTINGS);
  const saveSettings = (settings) => {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('[StorageService] Error saving settings:', err);
      return false;
    }
  };

  // --- Notification Methods ---
  const getNotifications = () => safeParse(KEYS.NOTIFICATIONS, []);
  const saveNotifications = (notifications) => {
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      return true;
    } catch (err) {
      console.error('[StorageService] Error saving notifications:', err);
      return false;
    }
  };

  // --- Undo History Stack ---
  const getUndoStack = () => safeParse(KEYS.UNDO_STACK, []);
  const saveUndoStack = (stack) => {
    try {
      // Limit undo stack to 20 items to preserve memory
      const trimmed = stack.slice(-20);
      localStorage.setItem(KEYS.UNDO_STACK, JSON.stringify(trimmed));
      return true;
    } catch (err) {
      console.error('[StorageService] Error saving undo stack:', err);
      return false;
    }
  };

  // --- Export JSON Backup ---
  const exportData = () => {
    const payload = {
      app: 'Iterative To-Do List',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks: getTasks(),
      categories: getCategories(),
      settings: getSettings()
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `iterative-todo-backup-${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- Import JSON Backup ---
  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.categories)) {
        return { success: false, error: 'Invalid file format. Backup must contain tasks and categories arrays.' };
      }

      saveTasks(data.tasks);
      saveCategories(data.categories);
      if (data.settings && typeof data.settings === 'object') {
        saveSettings(data.settings);
      }

      return {
        success: true,
        taskCount: data.tasks.length,
        categoryCount: data.categories.length
      };
    } catch (err) {
      return { success: false, error: 'Failed to parse JSON file: ' + err.message };
    }
  };

  // --- Clear / Reset All Data ---
  const clearAllData = () => {
    localStorage.removeItem(KEYS.TASKS);
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.UNDO_STACK);
    init();
  };

  return {
    init,
    getTasks,
    saveTasks,
    getCategories,
    saveCategories,
    getSettings,
    saveSettings,
    getNotifications,
    saveNotifications,
    getUndoStack,
    saveUndoStack,
    exportData,
    importData,
    clearAllData
  };
})();

