import { useState } from 'react';
import AutoLabelManager from './AutoLabelManager';
import './CategoryManager.css';

const INITIAL_VISIBLE_COUNT = 3;

function CategoryManager({ categories, onUpdateCategories, autoLabelRules, onUpdateAutoLabelRules, onApplyAutoLabelRules }) {
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [activeSubcategoryInput, setActiveSubcategoryInput] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#6366f1' });
  const [newSubcategory, setNewSubcategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const visibleCategories = categoriesExpanded 
    ? categories 
    : categories.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMoreCategories = categories.length > INITIAL_VISIBLE_COUNT;

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const id = newCategory.name.toLowerCase().replace(/\s+/g, '-');
    const category = {
      id,
      name: newCategory.name.trim(),
      color: newCategory.color,
      subcategories: []
    };

    onUpdateCategories([...categories, category]);
    setNewCategory({ name: '', color: '#6366f1' });
    setShowAddForm(false);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      onUpdateCategories(categories.filter(c => c.id !== categoryId));
    }
  };

  const handleUpdateCategory = (categoryId, updates) => {
    onUpdateCategories(
      categories.map(c => c.id === categoryId ? { ...c, ...updates } : c)
    );
  };

  const handleAddSubcategory = (categoryId) => {
    if (!newSubcategory.trim()) return;

    const category = categories.find(c => c.id === categoryId);
    if (!category.subcategories.includes(newSubcategory.trim())) {
      handleUpdateCategory(categoryId, {
        subcategories: [...category.subcategories, newSubcategory.trim()]
      });
    }
    setNewSubcategory('');
  };

  const handleDeleteSubcategory = (categoryId, subcategory) => {
    const category = categories.find(c => c.id === categoryId);
    handleUpdateCategory(categoryId, {
      subcategories: category.subcategories.filter(s => s !== subcategory)
    });
  };

  return (
    <div className="category-manager">
      <div className="category-header">
        <h2>Categories & Subcategories</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="add-category-btn"
        >
          {showAddForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-category-form">
          <input
            type="text"
            placeholder="Category name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="category-name-input"
          />
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            className="color-picker"
          />
          <button onClick={handleAddCategory} className="save-category-btn">
            Add Category
          </button>
        </div>
      )}

      <div className="categories-grid">
        {visibleCategories.map(category => (
          <div 
            key={category.id} 
            className="category-card"
            style={{ borderTopColor: category.color }}
          >
            <div className="category-card-header">
              <div 
                className="category-color-dot"
                style={{ backgroundColor: category.color }}
              />
              {editingCategoryName === category.id ? (
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                  onBlur={() => setEditingCategoryName(null)}
                  autoFocus
                  className="category-name-edit"
                />
              ) : (
                <h3 
                  className="category-name"
                  onClick={() => setEditingCategoryName(category.id)}
                >
                  {category.name}
                </h3>
              )}
              <button 
                onClick={() => handleDeleteCategory(category.id)}
                className="delete-category-btn"
                title="Delete category"
              >
                ×
              </button>
            </div>

            <div className="subcategories-list">
              {category.subcategories.map(sub => (
                <span key={sub} className="subcategory-tag">
                  {sub}
                  <button
                    onClick={() => handleDeleteSubcategory(category.id, sub)}
                    className="remove-subcategory"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="add-subcategory">
              <input
                type="text"
                placeholder="Add subcategory..."
                value={activeSubcategoryInput === category.id ? newSubcategory : ''}
                onFocus={() => setActiveSubcategoryInput(category.id)}
                onChange={(e) => setNewSubcategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSubcategory(category.id);
                  }
                }}
                className="subcategory-input"
              />
              <button
                onClick={() => handleAddSubcategory(category.id)}
                className="add-subcategory-btn"
                disabled={!newSubcategory.trim() || activeSubcategoryInput !== category.id}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMoreCategories && (
        <button 
          className="show-more-btn"
          onClick={() => setCategoriesExpanded(!categoriesExpanded)}
        >
          {categoriesExpanded 
            ? `Show less ↑` 
            : `Show ${categories.length - INITIAL_VISIBLE_COUNT} more categories ↓`}
        </button>
      )}

      {/* Auto-Label Rules */}
      <AutoLabelManager
        rules={autoLabelRules || []}
        categories={categories}
        onUpdateRules={onUpdateAutoLabelRules}
        onApplyRules={onApplyAutoLabelRules}
      />
    </div>
  );
}

export default CategoryManager;
