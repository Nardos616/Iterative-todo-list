/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - NOTIFICATIONS SERVICE (js/notifications.js)
 * Toast system, notification center dropdown, Browser Notifications API & reminder engine
 * ============================================================================
 */

const NotificationManager = (() => {
  let tickerInterval = null;

  // Initialize
  const init = () => {
    renderNotificationCenter();
    startReminderTicker();
    setupEventListeners();
  };

  const setupEventListeners = () => {
    const bellBtn = document.getElementById('notification-bell-btn');
    const dropdown = document.getElementById('notification-dropdown');
    const markReadBtn = document.getElementById('mark-all-read-btn');
    const clearNotifsBtn = document.getElementById('clear-notifications-btn');

    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
          markAllAsRead();
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });
    }

    if (markReadBtn) {
      markReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markAllAsRead();
      });
    }

    if (clearNotifsBtn) {
      clearNotifsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearAllNotifications();
      });
    }
  };

  // --- Toast Notification System ---
  const showToast = (message, type = 'info', actionText = null, actionCallback = null, duration = 4000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'danger') iconName = 'alert-circle';

    let actionBtnHtml = '';
    if (actionText && typeof actionCallback === 'function') {
      actionBtnHtml = `<button type="button" class="toast-action-btn">${escapeHtml(actionText)}</button>`;
    }

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon"></i>
      <span class="toast-message">${escapeHtml(message)}</span>
      ${actionBtnHtml}
      <button type="button" class="toast-close-btn" aria-label="Close notification">
        <i data-lucide="x" style="width:14px; height:14px;"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Attach Action Callback
    if (actionText && typeof actionCallback === 'function') {
      const actBtn = toast.querySelector('.toast-action-btn');
      if (actBtn) {
        actBtn.addEventListener('click', () => {
          actionCallback();
          dismissToast(toast);
        });
      }
    }

    // Attach Close Click
    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => dismissToast(toast));
    }

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(toast);
      }, duration);
    }
  };

  const dismissToast = (toast) => {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 250);
  };

  // --- In-App Notification Center ---
  const addNotification = ({ title, message, type = 'info', taskId = null }) => {
    const notifications = StorageService.getNotifications();
    const newNotif = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title,
      message,
      type,
      taskId,
      time: new Date().toISOString(),
      read: false
    };

    notifications.unshift(newNotif);
    // Keep max 50 notifications
    if (notifications.length > 50) notifications.pop();
    StorageService.saveNotifications(notifications);
    renderNotificationCenter();

    // Try browser notification if permitted
    sendBrowserNotification(title, { body: message });
  };

  const markAllAsRead = () => {
    const notifications = StorageService.getNotifications();
    notifications.forEach(n => n.read = true);
    StorageService.saveNotifications(notifications);
    renderNotificationCenter();
  };

  const clearAllNotifications = () => {
    StorageService.saveNotifications([]);
    renderNotificationCenter();
    showToast('Notification center cleared', 'info');
  };

  const renderNotificationCenter = () => {
    const notifications = StorageService.getNotifications();
    const listEl = document.getElementById('notification-list');
    const badgeEl = document.getElementById('notification-badge');

    const unreadCount = notifications.filter(n => !n.read).length;

    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.style.display = 'block';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    if (!listEl) return;

    if (notifications.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
          <i data-lucide="bell-off" style="width:32px; height:32px; margin: 0 auto 0.5rem; display:block; opacity:0.5;"></i>
          No notifications yet
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    listEl.innerHTML = notifications.map(n => {
      let icon = 'info';
      let iconColor = 'var(--primary)';
      let bgColor = 'var(--primary-light)';

      if (n.type === 'success') {
        icon = 'check-circle';
        iconColor = 'var(--color-completed)';
        bgColor = 'var(--color-completed-bg)';
      } else if (n.type === 'warning') {
        icon = 'alert-triangle';
        iconColor = 'var(--priority-medium)';
        bgColor = 'var(--priority-medium-bg)';
      } else if (n.type === 'danger') {
        icon = 'alert-octagon';
        iconColor = 'var(--priority-high)';
        bgColor = 'var(--priority-high-bg)';
      }

      return `
        <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
          <div class="notification-icon-pill" style="background-color: ${bgColor}; color: ${iconColor};">
            <i data-lucide="${icon}" style="width:14px; height:14px;"></i>
          </div>
          <div class="notification-text">
            <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(n.title)}</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.1rem;">${escapeHtml(n.message)}</div>
            <div class="notification-time">${timeAgo(new Date(n.time))}</div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  // --- Browser Notification API ---
  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser.', 'warning');
      return false;
    }

    if (Notification.permission === 'granted') {
      showToast('Browser notifications are already enabled.', 'success');
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showToast('Browser notifications enabled successfully!', 'success');
          const settings = StorageService.getSettings();
          settings.browserNotifications = true;
          StorageService.saveSettings(settings);
          return true;
        } else {
          showToast('Notification permission was dismissed or denied.', 'info');
          return false;
        }
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
        return false;
      }
    } else {
      showToast('Notifications are blocked in your browser settings. Please unblock them to enable.', 'warning');
      return false;
    }
  };

  const sendBrowserNotification = (title, options = {}) => {
    const settings = StorageService.getSettings();
    if (!settings.browserNotifications) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
          ...options
        });
      } catch (e) {
        console.warn('Could not fire browser notification:', e);
      }
    }
  };

  // --- Reminder & Approaching Deadline Ticker ---
  const startReminderTicker = () => {
    if (tickerInterval) clearInterval(tickerInterval);

    const checkReminders = () => {
      const tasks = StorageService.getTasks();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let updated = false;

      tasks.forEach(task => {
        if (task.status === 'completed') return;

        // Check explicit reminder settings
        if (task.reminder && task.reminder.enabled && !task.reminder.notified) {
          if (task.dueDate === todayStr && task.reminder.time) {
            if (currentTimeStr >= task.reminder.time) {
              task.reminder.notified = true;
              updated = true;

              addNotification({
                title: 'Task Reminder',
                message: `"${task.title}" is scheduled for today at ${task.reminder.time}!`,
                type: 'warning',
                taskId: task.id
              });

              showToast(`Reminder: "${task.title}" is due now!`, 'warning');
            }
          }
        }

        // Check if task became overdue today
        if (task.dueDate && task.dueDate < todayStr && !task.overdueNotified) {
          task.overdueNotified = true;
          updated = true;

          addNotification({
            title: 'Task Overdue',
            message: `"${task.title}" was due on ${task.dueDate} and is now overdue.`,
            type: 'danger',
            taskId: task.id
          });
        }
      });

      if (updated) {
        StorageService.saveTasks(tasks);
      }
    };

    // Run check immediately and then every 40 seconds
    checkReminders();
    tickerInterval = setInterval(checkReminders, 40000);
  };

  // --- Audio Feedback (Web Audio API) ---
  const playCompletionSound = () => {
    const settings = StorageService.getSettings();
    if (settings.soundEnabled === false) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const now = ctx.currentTime;
      [587.33, 739.99, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.06, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + i * 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + 0.4 + i * 0.04);
      });
    } catch (e) {
      // Gracefully handle browser autoplay restriction
    }
  };

  // Helper: Friendly Relative Time
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Helper: HTML escaping to prevent XSS
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  return {
    init,
    showToast,
    addNotification,
    markAllAsRead,
    clearAllNotifications,
    renderNotificationCenter,
    requestBrowserPermission,
    sendBrowserNotification,
    playCompletionSound,
    escapeHtml
  };
})();

