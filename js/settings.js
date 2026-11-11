/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - SETTINGS SERVICE (js/settings.js)
 * Theme management, user preferences, JSON backup export/import & data reset
 * ============================================================================
 */

const SettingsManager = (() => {
  let settings = {};

  const init = () => {
    settings = StorageService.getSettings();
    applyTheme(settings.theme || 'light');
    setupEventListeners();
    populateSettingsForm();
  };

  const getSettings = () => settings;

  const applyTheme = (theme) => {
    let activeTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    settings.theme = theme;
    StorageService.saveSettings(settings);

    // Update Theme Toggle Button Icon in Sidebar
    const themeIcon = document.getElementById('theme-toggle-icon');
    const themeLabel = document.getElementById('theme-toggle-label');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', activeTheme === 'dark' ? 'sun' : 'moon');
    }
    if (themeLabel) {
      themeLabel.textContent = activeTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    if (window.lucide) window.lucide.createIcons();

    // Re-render charts so their text/grid colors update for dark/light mode
    if (window.DashboardView && typeof window.DashboardView.updateDashboard === 'function') {
      window.DashboardView.updateDashboard();
    }
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    NotificationManager.showToast(`Switched to ${newTheme} mode`, 'info');
  };

  const setupEventListeners = () => {
    // 1. Sidebar Theme Toggle Button
    const sidebarThemeBtn = document.getElementById('sidebar-theme-toggle-btn');
    if (sidebarThemeBtn) {
      sidebarThemeBtn.addEventListener('click', toggleTheme);
    }

    // 2. Settings View: Theme Select
    const themeSelect = document.getElementById('settings-theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        NotificationManager.showToast(`Theme updated to ${e.target.value}`, 'success');
      });
    }

    // 3. Settings View: Default Priority
    const prioritySelect = document.getElementById('settings-default-priority');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        settings.defaultPriority = e.target.value;
        StorageService.saveSettings(settings);
        NotificationManager.showToast('Default priority updated', 'success');
      });
    }

    // 4. Settings View: Default View Mode
    const viewSelect = document.getElementById('settings-default-view');
    if (viewSelect) {
      viewSelect.addEventListener('change', (e) => {
        settings.defaultView = e.target.value;
        StorageService.saveSettings(settings);
        if (window.TaskManager && typeof window.TaskManager.setViewMode === 'function') {
          window.TaskManager.setViewMode(e.target.value);
        }
        NotificationManager.showToast('Default view mode updated', 'success');
      });
    }

    // 5. Settings View: Browser Notifications Toggle
    const browserNotifToggle = document.getElementById('settings-browser-notifs');
    if (browserNotifToggle) {
      browserNotifToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const granted = await NotificationManager.requestBrowserPermission();
          if (!granted) {
            e.target.checked = false;
          }
        } else {
          settings.browserNotifications = false;
          StorageService.saveSettings(settings);
          NotificationManager.showToast('Browser notifications disabled', 'info');
        }
      });
    }

    // 5b. Settings View: Sound Effects Toggle
    const soundToggle = document.getElementById('settings-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        StorageService.saveSettings(settings);
        NotificationManager.showToast(`Sound effects ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
      });
    }

    // 6. Data Export Button
    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        StorageService.exportData();
        NotificationManager.showToast('Backup JSON downloaded successfully!', 'success');
      });
    }

    // 7. Data Import Button & File Input
    const importBtn = document.getElementById('btn-import-data');
    const importFileInput = document.getElementById('settings-import-file-input');

    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => {
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          
          if (window.App && typeof window.App.showConfirmModal === 'function') {
            window.App.showConfirmModal({
              title: 'Confirm Data Import',
              description: 'Importing will replace your current tasks and categories with the data from this backup file. Do you wish to continue?',
              confirmText: 'Import & Overwrite',
              isDanger: true,
              onConfirm: () => {
                const res = StorageService.importData(content);
                if (res.success) {
                  NotificationManager.showToast(`Imported ${res.taskCount} tasks and ${res.categoryCount} categories!`, 'success');
                  setTimeout(() => window.location.reload(), 1200);
                } else {
                  NotificationManager.showToast(res.error, 'danger');
                }
              }
            });
          }
          // Reset file input
          importFileInput.value = '';
        };

        reader.readAsText(file);
      });
    }

    // 8. Clear All Data Button
    const clearBtn = document.getElementById('btn-clear-all-data');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (window.App && typeof window.App.showConfirmModal === 'function') {
          window.App.showConfirmModal({
            title: 'Clear All Application Data',
            description: 'Are you sure you want to reset all tasks, categories, and settings? This action cannot be undone.',
            confirmText: 'Reset Everything',
            isDanger: true,
            onConfirm: () => {
              StorageService.clearAllData();
              NotificationManager.showToast('Application reset to initial state', 'info');
              setTimeout(() => window.location.reload(), 1000);
            }
          });
        }
      });
    }
  };

  const populateSettingsForm = () => {
    const themeSelect = document.getElementById('settings-theme-select');
    const prioritySelect = document.getElementById('settings-default-priority');
    const viewSelect = document.getElementById('settings-default-view');
    const browserNotifToggle = document.getElementById('settings-browser-notifs');
    const soundToggle = document.getElementById('settings-sound-toggle');

    if (themeSelect) themeSelect.value = settings.theme || 'light';
    if (prioritySelect) prioritySelect.value = settings.defaultPriority || 'medium';
    if (viewSelect) viewSelect.value = settings.defaultView || 'list';
    if (browserNotifToggle) {
      browserNotifToggle.checked = Boolean(settings.browserNotifications) && (window.Notification && Notification.permission === 'granted');
    }
    if (soundToggle) {
      soundToggle.checked = settings.soundEnabled !== false;
    }
  };

  return {
    init,
    getSettings,
    applyTheme,
    toggleTheme,
    populateSettingsForm
  };
})();

