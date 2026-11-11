/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - CALENDAR VIEW (js/calendar.js)
 * Monthly, Weekly, and Daily interactive calendars with priority color coding
 * ============================================================================
 */

const CalendarView = (() => {
  let currentDate = new Date();
  let currentCalendarMode = 'month'; // 'month' | 'week' | 'day'

  const init = () => {
    setupEventListeners();
    render();
  };

  const setupEventListeners = () => {
    const prevBtn = document.getElementById('calendar-prev-btn');
    const nextBtn = document.getElementById('calendar-next-btn');
    const todayBtn = document.getElementById('calendar-today-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));
    if (todayBtn) todayBtn.addEventListener('click', () => {
      currentDate = new Date();
      render();
    });

    // Calendar Mode Buttons
    const monthModeBtn = document.getElementById('cal-mode-month');
    const weekModeBtn = document.getElementById('cal-mode-week');
    const dayModeBtn = document.getElementById('cal-mode-day');

    const setCalMode = (mode) => {
      currentCalendarMode = mode;
      [monthModeBtn, weekModeBtn, dayModeBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
      if (mode === 'month' && monthModeBtn) monthModeBtn.classList.add('active');
      if (mode === 'week' && weekModeBtn) weekModeBtn.classList.add('active');
      if (mode === 'day' && dayModeBtn) dayModeBtn.classList.add('active');
      render();
    };

    if (monthModeBtn) monthModeBtn.addEventListener('click', () => setCalMode('month'));
    if (weekModeBtn) weekModeBtn.addEventListener('click', () => setCalMode('week'));
    if (dayModeBtn) dayModeBtn.addEventListener('click', () => setCalMode('day'));
  };

  const navigate = (direction) => {
    if (currentCalendarMode === 'month') {
      currentDate.setMonth(currentDate.getMonth() + direction);
    } else if (currentCalendarMode === 'week') {
      currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (currentCalendarMode === 'day') {
      currentDate.setDate(currentDate.getDate() + direction);
    }
    render();
  };

  const render = () => {
    const titleEl = document.getElementById('calendar-current-title');
    const container = document.getElementById('calendar-render-target');
    if (!container) return;

    if (currentCalendarMode === 'month') {
      renderMonthView(container, titleEl);
    } else if (currentCalendarMode === 'week') {
      renderWeekView(container, titleEl);
    } else if (currentCalendarMode === 'day') {
      renderDayView(container, titleEl);
    }

    if (window.lucide) window.lucide.createIcons();
    attachCalendarClickEvents();
  };

  // --- 1. Month View Renderer ---
  const renderMonthView = (container, titleEl) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    // Days in current, prev and next months
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const tasks = TaskManager.getAllTasks();
    const todayStr = formatDateStr(new Date());

    let cellsHtml = '';

    // Day Headers (Sun - Sat)
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headerRowHtml = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const prevDateStr = formatDateStr(prevDate);
      cellsHtml += renderDayCell(dayNum, prevDateStr, true, tasks, todayStr);
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const curDate = new Date(year, month, dayNum);
      const curDateStr = formatDateStr(curDate);
      cellsHtml += renderDayCell(dayNum, curDateStr, false, tasks, todayStr);
    }

    // Next month filler days (fill remaining of 35 or 42 grid cells)
    const totalCellsSoFar = firstDayIndex + daysInCurrentMonth;
    const totalGridCells = totalCellsSoFar > 35 ? 42 : 35;
    const remainingCells = totalGridCells - totalCellsSoFar;

    for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
      const nextDate = new Date(year, month + 1, nextDay);
      const nextDateStr = formatDateStr(nextDate);
      cellsHtml += renderDayCell(nextDay, nextDateStr, true, tasks, todayStr);
    }

    container.innerHTML = `
      <div class="calendar-month-grid">
        ${headerRowHtml}
        ${cellsHtml}
      </div>
    `;
  };

  const renderDayCell = (dayNum, dateStr, isOtherMonth, tasks, todayStr) => {
    const isToday = dateStr === todayStr;
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);

    const taskPillsHtml = dayTasks.map(t => {
      const isCompleted = t.status === 'completed';
      return `
        <div class="calendar-task-pill ${t.priority}" data-task-id="${t.id}" title="${NotificationManager.escapeHtml(t.title)} (${t.priority})" style="${isCompleted ? 'text-decoration:line-through; opacity:0.6;' : ''}">
          ${NotificationManager.escapeHtml(t.title)}
        </div>
      `;
    }).join('');

    return `
      <div class="calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="calendar-day-number">${dayNum}</span>
          ${dayTasks.length > 0 ? `<span style="font-size:0.68rem; color:var(--text-tertiary); font-weight:600;">${dayTasks.length}</span>` : ''}
        </div>
        <div style="display:flex; flex-direction:column; gap:0.25rem; overflow-y:auto; max-height:85px;">
          ${taskPillsHtml}
        </div>
      </div>
    `;
  };

  // --- 2. Week View Renderer ---
  const renderWeekView = (container, titleEl) => {
    const curr = new Date(currentDate);
    const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay())); // Sunday
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const next = new Date(firstDay);
      next.setDate(firstDay.getDate() + i);
      weekDays.push(next);
    }

    const firstStr = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastStr = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (titleEl) {
      titleEl.textContent = `${firstStr} – ${lastStr}`;
    }

    const tasks = TaskManager.getAllTasks();
    const todayStr = formatDateStr(new Date());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const columnsHtml = weekDays.map((d, index) => {
      const dateStr = formatDateStr(d);
      const isToday = dateStr === todayStr;
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);

      return `
        <div class="calendar-week-col ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <div class="calendar-week-col-header">
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-tertiary); font-weight:600;">${dayNames[index]}</div>
            <div style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin-top:0.2rem;">${d.getDate()}</div>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.5rem; flex:1; padding-top:0.5rem; overflow-y:auto;">
            ${dayTasks.length === 0 ? `
              <div style="color:var(--text-tertiary); font-size:0.78rem; text-align:center; padding:1.5rem 0.25rem;">
                No tasks
              </div>
            ` : dayTasks.map(t => `
              <div class="calendar-task-pill ${t.priority}" data-task-id="${t.id}" style="padding:0.4rem 0.5rem; border-radius:var(--radius-sm); font-size:0.8rem;">
                <div style="font-weight:600; ${t.status === 'completed' ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                  ${NotificationManager.escapeHtml(t.title)}
                </div>
                ${t.description ? `<div style="font-size:0.72rem; opacity:0.8; margin-top:0.2rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${NotificationManager.escapeHtml(t.description)}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <button type="button" class="btn-secondary add-task-date-btn" data-date="${dateStr}" style="margin-top:auto; width:100%; font-size:0.75rem; padding:0.3rem;">
            <i data-lucide="plus" style="width:12px; height:12px;"></i> Add
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="calendar-week-grid">
        ${columnsHtml}
      </div>
    `;
  };

  // --- 3. Day View Renderer ---
  const renderDayView = (container, titleEl) => {
    const dateStr = formatDateStr(currentDate);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatted = currentDate.toLocaleDateString('en-US', options);

    if (titleEl) {
      titleEl.textContent = formatted;
    }

    const tasks = TaskManager.getAllTasks();
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const todayStr = formatDateStr(new Date());
    const isToday = dateStr === todayStr;

    container.innerHTML = `
      <div class="calendar-day-view">
        <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:1rem; border-bottom:1px solid var(--border-subtle);">
          <div>
            <h3 style="font-size:1.25rem; font-weight:700; color:var(--text-primary);">${isToday ? 'Today' : formatted}</h3>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.2rem;">${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'} scheduled</p>
          </div>
          <button type="button" class="btn-primary add-task-date-btn" data-date="${dateStr}">
            <i data-lucide="plus" style="width:15px; height:15px;"></i> Add Task for this Day
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.75rem; padding-top:0.5rem;">
          ${dayTasks.length === 0 ? `
            <div class="empty-state" style="padding:2.5rem 1rem;">
              <div class="empty-state-icon">
                <i data-lucide="calendar-check" style="width:32px; height:32px;"></i>
              </div>
              <div class="empty-state-title">You're all caught up!</div>
              <div class="empty-state-desc">No tasks are due on this day. Create your first task to get started.</div>
            </div>
          ` : dayTasks.map(t => {
            const category = t.categoryId ? CategoryManager.getById(t.categoryId) : null;
            const isCompleted = t.status === 'completed';

            return `
              <div class="task-list-row ${isCompleted ? 'completed' : ''}" data-task-id="${t.id}" style="cursor:pointer;">
                <span class="priority-badge ${t.priority}">${t.priority}</span>
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:600; font-size:0.95rem; color:var(--text-primary); ${isCompleted ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                    ${NotificationManager.escapeHtml(t.title)}
                  </div>
                  ${t.description ? `<div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;">${NotificationManager.escapeHtml(t.description)}</div>` : ''}
                </div>
                ${category ? `
                  <span class="category-pill">
                    <span class="category-pill-dot" style="background-color: ${category.color};"></span>
                    ${NotificationManager.escapeHtml(category.name)}
                  </span>
                ` : ''}
                <button type="button" class="task-action-btn" data-task-id="${t.id}">
                  <i data-lucide="edit-3" style="width:15px; height:15px;"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  // Attach Click Events (task click opens modal, date click creates task with that date prefilled)
  const attachCalendarClickEvents = () => {
    // Click task pill -> open task edit modal
    document.querySelectorAll('[data-task-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = el.dataset.taskId;
        if (window.App && typeof window.App.openTaskModal === 'function') {
          window.App.openTaskModal(taskId);
        }
      });
    });

    // Click day cell -> open task modal with date prefilled
    document.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        if (e.target.closest('[data-task-id]')) return;
        const dateStr = cell.dataset.date;
        if (window.App && typeof window.App.openTaskModal === 'function') {
          window.App.openTaskModal(null, { dueDate: dateStr });
        }
      });
    });

    // Add task date button in week and day view
    document.querySelectorAll('.add-task-date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateStr = btn.dataset.date;
        if (window.App && typeof window.App.openTaskModal === 'function') {
          window.App.openTaskModal(null, { dueDate: dateStr });
        }
      });
    });
  };

  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return {
    init,
    render,
    navigate
  };
})();

