/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - RECURRING ENGINE (js/recurring.js)
 * Complete-based recurrence, next due date computation & series tracking
 * ============================================================================
 */

const RecurringEngine = (() => {
  /**
   * Calculate next due date based on recurrence rule and current due date
   * @param {string} currentDueDateStr - Current due date 'YYYY-MM-DD'
   * @param {object} recurrence - { type: 'daily'|'weekly'|'monthly'|'custom', interval: number, unit?: 'days'|'weeks'|'months' }
   * @returns {string} - Next due date 'YYYY-MM-DD'
   */
  const computeNextDueDate = (currentDueDateStr, recurrence) => {
    if (!recurrence || recurrence.type === 'none') return null;

    const baseDate = currentDueDateStr ? new Date(currentDueDateStr + 'T00:00:00') : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If the base date was far in the past, advance from today to avoid scheduling in the past
    const startingDate = baseDate < today ? new Date(today) : new Date(baseDate);

    const type = recurrence.type;
    const interval = Math.max(1, parseInt(recurrence.interval, 10) || 1);

    const nextDate = new Date(startingDate);

    switch (type) {
      case 'daily':
        nextDate.setDate(startingDate.getDate() + interval);
        break;

      case 'weekly':
        nextDate.setDate(startingDate.getDate() + (interval * 7));
        break;

      case 'monthly': {
        const targetMonth = startingDate.getMonth() + interval;
        const originalDay = startingDate.getDate();
        
        nextDate.setDate(1); // avoid rollover
        nextDate.setMonth(targetMonth);
        
        // Handle varying days per month (e.g., Jan 31 -> Feb 28)
        const daysInTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(originalDay, daysInTargetMonth));
        break;
      }

      case 'custom': {
        const unit = recurrence.unit || 'days';
        if (unit === 'days') {
          nextDate.setDate(startingDate.getDate() + interval);
        } else if (unit === 'weeks') {
          nextDate.setDate(startingDate.getDate() + (interval * 7));
        } else if (unit === 'months') {
          const targetMonth = startingDate.getMonth() + interval;
          const originalDay = startingDate.getDate();
          nextDate.setDate(1);
          nextDate.setMonth(targetMonth);
          const daysInTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(originalDay, daysInTargetMonth));
        }
        break;
      }

      default:
        return null;
    }

    return formatDate(nextDate);
  };

  /**
   * Helper to format Date to 'YYYY-MM-DD'
   */
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Handle complete-based recurrence generation
   * @param {object} completedTask - The task being marked as completed
   * @param {Array} allTasks - All tasks collection
   * @returns {object|null} - The newly created next occurrence, or null
   */
  const handleTaskCompletion = (completedTask, allTasks) => {
    if (!completedTask.recurrence || completedTask.recurrence.type === 'none') {
      return null;
    }

    // Series ID identifier
    const seriesId = completedTask.seriesId || completedTask.id;

    // Check if an active uncompleted occurrence in this series already exists to prevent duplicates
    const existingActive = allTasks.find(t => 
      t.id !== completedTask.id && 
      (t.seriesId === seriesId || t.id === seriesId) && 
      t.status !== 'completed'
    );

    if (existingActive) {
      console.log(`[RecurringEngine] Active occurrence already exists for series ${seriesId}: ${existingActive.id}`);
      return null;
    }

    const nextDueDate = computeNextDueDate(completedTask.dueDate, completedTask.recurrence);
    if (!nextDueDate) return null;

    // Compute next start date if original task had one
    let nextStartDate = null;
    if (completedTask.startDate && completedTask.dueDate) {
      const origStart = new Date(completedTask.startDate + 'T00:00:00');
      const origDue = new Date(completedTask.dueDate + 'T00:00:00');
      const durationMs = origDue - origStart;
      const nextDueObj = new Date(nextDueDate + 'T00:00:00');
      const calculatedStart = new Date(nextDueObj.getTime() - durationMs);
      nextStartDate = formatDate(calculatedStart);
    }

    // Clone task with new instance properties
    const nextTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: completedTask.title,
      description: completedTask.description || '',
      startDate: nextStartDate,
      dueDate: nextDueDate,
      priority: completedTask.priority,
      categoryId: completedTask.categoryId,
      status: 'todo',
      isImportant: completedTask.isImportant || false,
      recurrence: { ...completedTask.recurrence },
      seriesId: seriesId,
      occurrenceCount: (completedTask.occurrenceCount || 1) + 1,
      reminder: completedTask.reminder ? { ...completedTask.reminder, notified: false } : { enabled: false },
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    return nextTask;
  };

  /**
   * Format recurrence rule for display pill
   */
  const getRecurrenceLabel = (recurrence) => {
    if (!recurrence || recurrence.type === 'none') return '';
    const interval = recurrence.interval || 1;
    switch (recurrence.type) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly':
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case 'custom':
        return `Every ${interval} ${recurrence.unit || 'days'}`;
      default:
        return '';
    }
  };

  return {
    computeNextDueDate,
    handleTaskCompletion,
    getRecurrenceLabel
  };
})();

