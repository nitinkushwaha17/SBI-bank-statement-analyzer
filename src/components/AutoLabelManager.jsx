import { useState, useMemo, useRef } from 'react';
import Dropdown from './common/Dropdown';
import './AutoLabelManager.css';

const INITIAL_VISIBLE_GROUPS = 4;

function AutoLabelManager({ rules, categories, onUpdateRules, onApplyRules }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null); // { category, subcategory }
  const [newRule, setNewRule] = useState({
    keyword: '',
    category: '',
    subcategory: ''
  });
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const importInputRef = useRef(null);

  const selectedCategory = categories.find(c => c.id === newRule.category);
  const subcategories = selectedCategory?.subcategories || [];

  // Group rules by category
  const groupedRules = useMemo(() => {
    const groups = {};
    rules.forEach(rule => {
      const key = `${rule.category}:${rule.subcategory || ''}`;
      if (!groups[key]) {
        groups[key] = {
          category: rule.category,
          subcategory: rule.subcategory || '',
          keywords: []
        };
      }
      groups[key].keywords.push({ id: rule.id, keyword: rule.keyword });
    });
    return Object.values(groups);
  }, [rules]);

  const visibleGroups = groupsExpanded 
    ? groupedRules 
    : groupedRules.slice(0, INITIAL_VISIBLE_GROUPS);
  const hasMoreGroups = groupedRules.length > INITIAL_VISIBLE_GROUPS;

  const handleAddRule = () => {
    if (!newRule.keyword.trim() || !newRule.category) return;

    // Split by comma to support multiple keywords at once
    const keywords = newRule.keyword
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) return;

    const newRules = keywords.map((keyword, index) => ({
      id: `rule_${Date.now()}_${index}`,
      keyword: keyword,
      category: newRule.category,
      subcategory: newRule.subcategory || ''
    }));

    onUpdateRules([...rules, ...newRules]);
    setNewRule({ keyword: '', category: '', subcategory: '' });
    setShowAddForm(false);
  };

  const handleDeleteRule = (ruleId) => {
    onUpdateRules(rules.filter(r => r.id !== ruleId));
  };

  const handleDeleteGroup = (category, subcategory) => {
    if (window.confirm('Delete all keywords in this category?')) {
      onUpdateRules(rules.filter(r => !(r.category === category && (r.subcategory || '') === subcategory)));
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup({ category: group.category, subcategory: group.subcategory });
    setNewRule({
      keyword: group.keywords.map(k => k.keyword).join(', '),
      category: group.category,
      subcategory: group.subcategory
    });
  };

  const handleSaveGroupEdit = () => {
    if (!newRule.keyword.trim() || !newRule.category) return;

    // Remove old rules for this group
    const filteredRules = rules.filter(r => 
      !(r.category === editingGroup.category && (r.subcategory || '') === editingGroup.subcategory)
    );

    // Add new rules
    const keywords = newRule.keyword
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const newRules = keywords.map((keyword, index) => ({
      id: `rule_${Date.now()}_${index}`,
      keyword: keyword,
      category: newRule.category,
      subcategory: newRule.subcategory || ''
    }));

    onUpdateRules([...filteredRules, ...newRules]);
    setEditingGroup(null);
    setNewRule({ keyword: '', category: '', subcategory: '' });
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setNewRule({ keyword: '', category: '', subcategory: '' });
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  };

  const getCategoryColor = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || '#ccc';
  };

  // Export rules to JSON file
  const handleExportRules = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      rules: rules
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auto-label-rules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import rules from JSON file
  const handleImportRules = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.rules || !Array.isArray(data.rules)) {
          alert('Invalid rules file format');
          return;
        }

        // Validate and assign new IDs to avoid conflicts
        const importedRules = data.rules.map((rule, index) => ({
          id: `rule_${Date.now()}_${index}`,
          keyword: rule.keyword || '',
          category: rule.category || '',
          subcategory: rule.subcategory || ''
        })).filter(r => r.keyword && r.category);

        if (importedRules.length === 0) {
          alert('No valid rules found in file');
          return;
        }

        const action = window.confirm(
          `Import ${importedRules.length} rules?\n\nClick OK to add to existing rules, or Cancel to abort.`
        );
        
        if (action) {
          onUpdateRules([...rules, ...importedRules]);
        }
      } catch (err) {
        alert('Failed to parse rules file');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be imported again
    event.target.value = '';
  };

  return (
    <div className="auto-label-manager">
      <div className="auto-label-header">
        <div className="header-text">
          <h3>Auto-Label Rules</h3>
          <p className="header-description">
            Automatically categorize transactions based on keywords in the description
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={onApplyRules}
            className="apply-rules-btn"
            disabled={rules.length === 0}
          >
            🏷️ Apply Rules
          </button>
          <button 
            onClick={handleExportRules}
            className="export-rules-btn"
            disabled={rules.length === 0}
            title="Export rules to JSON"
          >
            📤 Export
          </button>
          <label className="import-rules-btn" title="Import rules from JSON">
            📥 Import
            <input 
              ref={importInputRef}
              type="file" 
              accept=".json" 
              onChange={handleImportRules} 
              style={{ display: 'none' }} 
            />
          </label>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-rule-btn"
          >
            {showAddForm ? 'Cancel' : '+ Add Rule'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-rule-form">
          <input
            type="text"
            placeholder="Keywords (comma-separated, e.g., AMAZON, FLIPKART, MYNTRA)"
            value={newRule.keyword}
            onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
            className="keyword-input"
          />
          <Dropdown
            value={newRule.category}
            onChange={(value) => setNewRule({ ...newRule, category: value, subcategory: '' })}
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            placeholder="Select Category"
          />
          {newRule.category && subcategories.length > 0 && (
            <Dropdown
              value={newRule.subcategory}
              onChange={(value) => setNewRule({ ...newRule, subcategory: value })}
              options={subcategories.map(sub => ({ value: sub, label: sub }))}
              placeholder="Subcategory (optional)"
            />
          )}
          <button onClick={handleAddRule} className="save-rule-btn">
            Add Rule
          </button>
        </div>
      )}

      <div className="rules-list">
        {rules.length === 0 ? (
          <div className="no-rules">
            <span className="no-rules-icon">🏷️</span>
            <p>No auto-label rules defined yet</p>
            <p className="hint">Add rules to automatically categorize transactions</p>
          </div>
        ) : (
          visibleGroups.map((group, index) => {
            const isEditing = editingGroup && 
              editingGroup.category === group.category && 
              editingGroup.subcategory === group.subcategory;
            
            return (
              <div key={index} className={`rule-group ${isEditing ? 'editing' : ''}`}>
                {isEditing ? (
                  <div className="group-edit-form">
                    <div className="edit-row">
                      <Dropdown
                        value={newRule.category}
                        onChange={(value) => setNewRule({ ...newRule, category: value, subcategory: '' })}
                        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                        placeholder="Category"
                        size="small"
                      />
                      {newRule.category && (categories.find(c => c.id === newRule.category)?.subcategories?.length > 0) && (
                        <Dropdown
                          value={newRule.subcategory}
                          onChange={(value) => setNewRule({ ...newRule, subcategory: value })}
                          options={(categories.find(c => c.id === newRule.category)?.subcategories || []).map(sub => ({ value: sub, label: sub }))}
                          placeholder="Subcategory"
                          size="small"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      value={newRule.keyword}
                      onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
                      className="keyword-input"
                      placeholder="Keywords (comma-separated)"
                    />
                    <div className="edit-actions">
                      <button onClick={handleSaveGroupEdit} className="save-btn">Save</button>
                      <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rule-group-header">
                      <span 
                        className="rule-category-badge"
                        style={{ backgroundColor: getCategoryColor(group.category) }}
                      >
                        {getCategoryName(group.category)}
                        {group.subcategory && ` › ${group.subcategory}`}
                      </span>
                      <div className="group-actions">
                        <button 
                          onClick={() => handleEditGroup(group)}
                          className="group-edit-btn"
                          title="Edit group"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteGroup(group.category, group.subcategory)}
                          className="group-delete-btn"
                          title="Delete all keywords"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="keywords-chips">
                      {group.keywords.map(({ id, keyword }) => (
                        <span key={id} className="keyword-chip">
                          {keyword}
                          <button 
                            onClick={() => handleDeleteRule(id)}
                            className="chip-delete"
                            title="Remove keyword"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {hasMoreGroups && (
        <button 
          className="show-more-btn"
          onClick={() => setGroupsExpanded(!groupsExpanded)}
        >
          {groupsExpanded 
            ? `Show less ↑` 
            : `Show ${groupedRules.length - INITIAL_VISIBLE_GROUPS} more categories ↓`}
        </button>
      )}
    </div>
  );
}

export default AutoLabelManager;
