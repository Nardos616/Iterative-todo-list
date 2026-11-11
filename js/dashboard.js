/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - DASHBOARD VIEW & CHARTS (js/dashboard.js)
 * Metric cards, animated completion progress, Chart.js instances & recent widgets
 * ============================================================================
 */

const DashboardView = (() => {
  let weeklyChartInstance = null;
  let distributionChartInstance = null;

  const init = () => {
    updateDashboard();
  };

  const updateDashboard = () => {
    const tasks = TaskManager.getAllTasks();
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute metrics
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const pendingCount = tasks.filter(t => t.status !== 'completed').length;
    const overdueCount = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;

    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Update Stats Card Numbers
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('stat-total-tasks', totalCount);
    setVal('stat-completed-tasks', completedCount);
    setVal('stat-pending-tasks', pendingCount);
    setVal('stat-overdue-tasks', overdueCount);

    // Update Progress Bar & Percentage
    const pctEl = document.getElementById('dashboard-completion-pct');
    const barFill = document.getElementById('dashboard-progress-fill');
    if (pctEl) pctEl.textContent = `${completionRate}%`;
    if (barFill) barFill.style.width = `${completionRate}%`;

    // Render Recent Tasks Widget
    renderRecentTasksWidget(tasks);

    // Render Upcoming Deadlines Widget
    renderUpcomingDeadlinesWidget(tasks, todayStr);

    // Render Charts
    renderWeeklyProductivityChart(tasks);
    renderTaskDistributionChart(tasks);
  };

  // --- Widget: Recent Tasks ---
  const renderRecentTasksWidget = (tasks) => {
    const container = document.getElementById('dashboard-recent-tasks-list');
    if (!container) return;

    // Sort by createdAt descending, take 5
    const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 0.35rem;">
            <i data-lucide="check-circle-2" style="width: 20px; height: 20px; color: var(--color-completed);"></i>
          </div>
          <div class="empty-state-title" style="font-size: 0.95rem;">You're all caught up!</div>
          <div class="empty-state-desc" style="font-size: 0.8rem;">Create your first task to get started.</div>
          <button type="button" class="btn-primary" onclick="App.openTaskModal()" style="margin-top: 0.5rem; font-size: 0.8rem; height: 32px; padding: 0 0.85rem;">
            <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create First Task
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = recent.map(task => {
      const isDone = task.status === 'completed';
      const category = task.categoryId ? CategoryManager.getById(task.categoryId) : null;

      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background-color:var(--bg-surface-hover); border-radius:var(--radius-md); gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.6rem; min-width:0;">
            <span class="priority-badge ${task.priority}" style="padding:0.1rem 0.4rem; font-size:0.68rem;">${task.priority}</span>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-primary); text-decoration:${isDone ? 'line-through' : 'none'}; opacity:${isDone ? '0.7' : '1'}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${NotificationManager.escapeHtml(task.title)}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:0.4rem; flex-shrink:0;">
            ${category ? `
              <span class="category-pill" style="font-size:0.68rem; padding:0.1rem 0.4rem;">
                <span class="category-pill-dot" style="background-color: ${category.color};"></span>
                ${NotificationManager.escapeHtml(category.name)}
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  };

  // --- Widget: Upcoming Deadlines ---
  const renderUpcomingDeadlinesWidget = (tasks, todayStr) => {
    const container = document.getElementById('dashboard-upcoming-deadlines-list');
    if (!container) return;

    // Filter uncompleted tasks that have a dueDate >= today, sorted ascending
    const upcoming = tasks
      .filter(t => t.status !== 'completed' && t.dueDate && t.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 0.35rem;">
            <i data-lucide="calendar" style="width: 20px; height: 20px; color: var(--priority-medium);"></i>
          </div>
          <div class="empty-state-title" style="font-size: 0.95rem;">No upcoming deadlines</div>
          <div class="empty-state-desc" style="font-size: 0.8rem;">You have no scheduled deadlines pending.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = upcoming.map(task => {
      const isToday = task.dueDate === todayStr;
      const category = task.categoryId ? CategoryManager.getById(task.categoryId) : null;

      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background-color:var(--bg-surface-hover); border-radius:var(--radius-md); gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.6rem; min-width:0;">
            <i data-lucide="calendar" style="width:14px; height:14px; color:${isToday ? 'var(--priority-medium)' : 'var(--text-tertiary)'}; flex-shrink:0;"></i>
            <span style="font-size:0.85rem; font-weight:500; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${NotificationManager.escapeHtml(task.title)}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
            <span class="date-badge ${isToday ? 'today' : ''}" style="font-size:0.72rem;">
              ${isToday ? 'Due Today' : task.dueDate}
            </span>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  };

  // --- Chart 1: Weekly Productivity Chart ---
  const renderWeeklyProductivityChart = (tasks) => {
    const canvas = document.getElementById('weeklyProductivityChart');
    if (!canvas || !window.Chart) return;
    const wrapper = canvas.parentElement;

    if (tasks.length === 0) {
      if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
        weeklyChartInstance = null;
      }
      canvas.style.display = 'none';
      let emptyEl = wrapper.querySelector('.chart-empty-state');
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state chart-empty-state';
        emptyEl.style.padding = '1.5rem 1rem';
        wrapper.appendChild(emptyEl);
      }
      emptyEl.style.display = 'flex';
      emptyEl.innerHTML = `
        <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 0.35rem;">
          <i data-lucide="bar-chart-3" style="width: 22px; height: 22px; color: var(--primary);"></i>
        </div>
        <div class="empty-state-title" style="font-size: 0.95rem;">No activity recorded yet</div>
        <div class="empty-state-desc" style="font-size: 0.8rem;">Weekly completion and creation trends will appear once you add tasks.</div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const emptyEl = wrapper.querySelector('.chart-empty-state');
    if (emptyEl) emptyEl.style.display = 'none';
    canvas.style.display = 'block';

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#94A3B8' : '#64748B';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

    // Build last 7 days labels & data
    const dayLabels = [];
    const completedCounts = [];
    const createdCounts = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dayLabels.push(`${dayNames[d.getDay()]} (${d.getMonth() + 1}/${d.getDate()})`);

      // Count tasks completed on this date
      const comp = tasks.filter(t => {
        if (!t.completedAt) return false;
        return t.completedAt.startsWith(dateStr);
      }).length;
      completedCounts.push(comp);

      // Count tasks created on this date
      const creat = tasks.filter(t => {
        if (!t.createdAt) return false;
        return t.createdAt.startsWith(dateStr);
      }).length;
      createdCounts.push(creat);
    }

    if (weeklyChartInstance) {
      weeklyChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    weeklyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: 'Completed Tasks',
            data: completedCounts,
            backgroundColor: '#4F46E5',
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 28
          },
          {
            label: 'Created Tasks',
            data: createdCounts,
            backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 12, weight: 500 },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: isDarkMode ? '#1F2937' : '#0F172A',
            titleColor: '#FFFFFF',
            bodyColor: '#E2E8F0',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 11 },
              stepSize: 1,
              precision: 0
            },
            beginAtZero: true
          }
        }
      }
    });
  };

  // --- Chart 2: Task Distribution Doughnut Chart ---
  const renderTaskDistributionChart = (tasks) => {
    const canvas = document.getElementById('taskDistributionChart');
    if (!canvas || !window.Chart) return;
    const wrapper = canvas.parentElement;

    if (tasks.length === 0) {
      if (distributionChartInstance) {
        distributionChartInstance.destroy();
        distributionChartInstance = null;
      }
      canvas.style.display = 'none';
      let emptyEl = wrapper.querySelector('.chart-empty-state');
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state chart-empty-state';
        emptyEl.style.padding = '1.5rem 1rem';
        wrapper.appendChild(emptyEl);
      }
      emptyEl.style.display = 'flex';
      emptyEl.innerHTML = `
        <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 0.35rem;">
          <i data-lucide="pie-chart" style="width: 22px; height: 22px; color: var(--primary);"></i>
        </div>
        <div class="empty-state-title" style="font-size: 0.95rem;">No task distribution</div>
        <div class="empty-state-desc" style="font-size: 0.8rem;">Task breakdown by category will appear once you create tasks.</div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const emptyEl = wrapper.querySelector('.chart-empty-state');
    if (emptyEl) emptyEl.style.display = 'none';
    canvas.style.display = 'block';

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#94A3B8' : '#64748B';

    const categories = CategoryManager.getAll();

    // Calculate count per category + uncategorized
    const labels = [];
    const data = [];
    const colors = [];

    categories.forEach(cat => {
      const count = tasks.filter(t => t.categoryId === cat.id).length;
      if (count > 0 || tasks.length === 0) {
        labels.push(cat.name);
        data.push(count);
        colors.push(cat.color);
      }
    });

    const uncatCount = tasks.filter(t => !t.categoryId).length;
    if (uncatCount > 0) {
      labels.push('Uncategorized');
      data.push(uncatCount);
      colors.push('#94A3B8');
    }

    if (data.length === 0 || data.every(v => v === 0)) {
      labels.push('No Tasks');
      data.push(1);
      colors.push(isDarkMode ? '#1E293B' : '#E2E8F0');
    }

    if (distributionChartInstance) {
      distributionChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    distributionChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: isDarkMode ? '#111827' : '#FFFFFF'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 12, weight: 500 },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: isDarkMode ? '#1F2937' : '#0F172A',
            titleColor: '#FFFFFF',
            bodyColor: '#E2E8F0',
            padding: 10,
            cornerRadius: 8
          }
        },
        cutout: '68%'
      }
    });
  };

  return {
    init,
    updateDashboard,
    renderWeeklyProductivityChart,
    renderTaskDistributionChart
  };
})();

