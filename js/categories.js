/**
 * ============================================================================
 * ITERATIVE TO-DO LIST - CATEGORIES SERVICE (js/categories.js)
 * Category CRUD, color swatch management, sidebar category rendering & select populator
 * ============================================================================
 */

const CategoryManager = (() => {
  // Preset vibrant and modern category colors
  const PRESET_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#6366f1', // Indigo
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#e11d48'  // Rose
  ];

  const getAll = () => StorageService.getCategories();

  const getById = (id) => {
    const categories = getAll();
    return categories.find(c => c.id === id) || null;
  };

  const add = (name, color) => {
    if (!name || !name.trim()) return { success: false, error: 'Category name is required' };
    const categories = getAll();
    const trimmed = name.trim();

    // Check duplicate name
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'A category with this name already exists' };
    }

    const newCategory = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: trimmed,
      color: color || PRESET_COLORS[0]
    };

    categories.push(newCategory);
    StorageService.saveCategories(categories);
    updateUI();
    return { success: true, category: newCategory };
  };

  const update = (id, newName, newColor) => {
    if (!newName || !newName.trim()) return { success: false, error: 'Category name is required' };
    const categories = getAll();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Category not found' };

    const trimmed = newName.trim();
    if (categories.some((c, i) => i !== index && c.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'A category with this name already exists' };
    }

    categories[index].name = trimmed;
    if (newColor) categories[index].color = newColor;

    StorageService.saveCategories(categories);
    updateUI();
    return { success: true, category: categories[index] };
  };

  const remove = (id) => {
    const categories = getAll();
    const filtered = categories.filter(c => c.id !== id);
    if (filtered.length === categories.length) return false;

    // Safety: dissociate any tasks with this category so they are NOT deleted
    const tasks = StorageService.getTasks();
    let tasksUpdated = false;
    tasks.forEach(task => {
      if (task.categoryId === id) {
        task.categoryId = null;
        tasksUpdated = true;
      }
    });

    if (tasksUpdated) {
      StorageService.saveTasks(tasks);
    }

    StorageService.saveCategories(filtered);
    updateUI();
    return true;
  };

  // Render Category Items in Sidebar
  const renderSidebarCategories = (activeCategoryId = null) => {
    const container = document.getElementById('sidebar-categories-list');
    if (!container) return;

    const categories = getAll();
    const tasks = StorageService.getTasks();

    container.innerHTML = categories.map(cat => {
      // Calculate pending tasks count for this category
      const count = tasks.filter(t => t.categoryId === cat.id && t.status !== 'completed').length;
      const isActive = activeCategoryId === cat.id ? 'active' : '';

      return `
        <li class="category-item ${isActive}" data-category-id="${cat.id}">
          <span class="category-dot" style="background-color: ${cat.color};"></span>
          <span class="category-name">${NotificationManager.escapeHtml(cat.name)}</span>
          <span class="nav-badge category-count">${count}</span>
          <div class="category-actions">
            <button type="button" class="cat-action-btn edit-cat-btn" title="Edit Category" data-id="${cat.id}">
              <i data-lucide="edit-2" style="width:12px; height:12px;"></i>
            </button>
            <button type="button" class="cat-action-btn delete-cat-btn" title="Delete Category" data-id="${cat.id}">
              <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
            </button>
          </div>
        </li>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    attachCategoryEvents();
  };

  const attachCategoryEvents = () => {
    const container = document.getElementById('sidebar-categories-list');
    if (!container) return;

    // Click category to view tasks
    container.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Ignore if clicked on edit or delete button
        if (e.target.closest('.cat-action-btn')) return;
        const catId = item.dataset.categoryId;
        if (window.App && typeof window.App.navigateToCategory === 'function') {
          window.App.navigateToCategory(catId);
        }
      });
    });

    // Edit button click
    container.querySelectorAll('.edit-cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        openCategoryModal(id);
      });
    });

    // Delete button click
    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const cat = getById(id);
        if (!cat) return;

        if (window.App && typeof window.App.showConfirmModal === 'function') {
          window.App.showConfirmModal({
            title: 'Delete Category',
            description: `Are you sure you want to delete the "${cat.name}" category? Tasks belonging to it will become uncategorized and will not be lost.`,
            confirmText: 'Delete Category',
            isDanger: true,
            onConfirm: () => {
              remove(id);
              NotificationManager.showToast(`Category "${cat.name}" removed`, 'info');
              if (window.App && typeof window.App.refreshCurrentView === 'function') {
                window.App.refreshCurrentView();
              }
            }
          });
        } else {
          remove(id);
        }
      });
    });
  };

  // Populate <select> tags across the app (Task Modal, Filter bar, etc.)
  const populateCategorySelects = (selectedId = null) => {
    const categories = getAll();

    // 1. Task Modal Select
    const taskCatSelect = document.getElementById('task-form-category');
    if (taskCatSelect) {
      taskCatSelect.innerHTML = '<option value="">No Category (Uncategorized)</option>' +
        categories.map(c => `
          <option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>
            ${NotificationManager.escapeHtml(c.name)}
          </option>
        `).join('');
    }

    // 2. Toolbar Filter Category Select
    const filterCatSelect = document.getElementById('filter-category-select');
    if (filterCatSelect) {
      const currentVal = filterCatSelect.value;
      filterCatSelect.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(c => `
          <option value="${c.id}" ${currentVal === c.id ? 'selected' : ''}>
            ${NotificationManager.escapeHtml(c.name)}
          </option>
        `).join('');
    }
  };

  // Open Category Create / Edit Modal
  const openCategoryModal = (categoryId = null) => {
    const modal = document.getElementById('category-modal');
    const titleEl = document.getElementById('category-modal-title');
    const nameInput = document.getElementById('category-name-input');
    const idInput = document.getElementById('category-id-hidden');
    const swatchesContainer = document.getElementById('category-color-swatches');
    const customColorInput = document.getElementById('category-custom-color');
    const errorEl = document.getElementById('category-form-error');

    if (!modal) return;
    if (errorEl) errorEl.classList.remove('visible');

    let activeColor = PRESET_COLORS[0];

    if (categoryId) {
      const cat = getById(categoryId);
      if (cat) {
        titleEl.textContent = 'Edit Category';
        nameInput.value = cat.name;
        idInput.value = cat.id;
        activeColor = cat.color;
      }
    } else {
      titleEl.textContent = 'Create New Category';
      nameInput.value = '';
      idInput.value = '';
      activeColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    }

    if (customColorInput) customColorInput.value = activeColor;

    // Render Color Swatches
    if (swatchesContainer) {
      swatchesContainer.innerHTML = PRESET_COLORS.map(color => `
        <button type="button" class="color-swatch-btn ${color.toLowerCase() === activeColor.toLowerCase() ? 'active' : ''}" 
          data-color="${color}" 
          style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2px solid ${color.toLowerCase() === activeColor.toLowerCase() ? 'var(--text-primary)' : 'transparent'};">
        </button>
      `).join('');

      swatchesContainer.querySelectorAll('.color-swatch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          swatchesContainer.querySelectorAll('.color-swatch-btn').forEach(b => {
            b.classList.remove('active');
            b.style.borderColor = 'transparent';
          });
          btn.classList.add('active');
          btn.style.borderColor = 'var(--text-primary)';
          activeColor = btn.dataset.color;
          if (customColorInput) customColorInput.value = activeColor;
        });
      });
    }

    modal.classList.add('active');
    setTimeout(() => nameInput.focus(), 100);
  };

  const updateUI = () => {
    renderSidebarCategories();
    populateCategorySelects();
  };

  return {
    PRESET_COLORS,
    getAll,
    getById,
    add,
    update,
    remove,
    renderSidebarCategories,
    populateCategorySelects,
    openCategoryModal,
    updateUI
  };
})();

