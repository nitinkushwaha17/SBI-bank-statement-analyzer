import { useState } from 'react';
import Dropdown from './common/Dropdown';
import './AutoLabelManager.css';

const INITIAL_VISIBLE_RULES = 5;

function AutoLabelManager({ rules, categories, onUpdateRules, onApplyRules }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    keyword: '',
    category: '',
    subcategory: ''
  });
  const [editingRule, setEditingRule] = useState(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const visibleRules = rulesExpanded 
    ? rules 
    : rules.slice(0, INITIAL_VISIBLE_RULES);
  const hasMoreRules = rules.length > INITIAL_VISIBLE_RULES;

  const selectedCategory = categories.find(c => c.id === newRule.category);
  const subcategories = selectedCategory?.subcategories || [];

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

  const handleEditRule = (rule) => {
    setEditingRule(rule.id);
    setNewRule({
      keyword: rule.keyword,
      category: rule.category,
      subcategory: rule.subcategory || ''
    });
  };

  const handleSaveEdit = (ruleId) => {
    if (!newRule.keyword.trim() || !newRule.category) return;

    onUpdateRules(rules.map(r => 
      r.id === ruleId 
        ? { ...r, keyword: newRule.keyword.trim(), category: newRule.category, subcategory: newRule.subcategory }
        : r
    ));
    setEditingRule(null);
    setNewRule({ keyword: '', category: '', subcategory: '' });
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
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
          visibleRules.map(rule => (
            <div key={rule.id} className="rule-item">
              {editingRule === rule.id ? (
                <div className="rule-edit-form">
                  <input
                    type="text"
                    value={newRule.keyword}
                    onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
                    className="keyword-input"
                  />
                  <Dropdown
                    value={newRule.category}
                    onChange={(value) => setNewRule({ ...newRule, category: value, subcategory: '' })}
                    options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                    placeholder="Select Category"
                    size="small"
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleSaveEdit(rule.id)} className="save-btn">Save</button>
                    <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rule-content">
                    <span className="rule-keyword">"{rule.keyword}"</span>
                    <span className="rule-arrow">→</span>
                    <span 
                      className="rule-category"
                      style={{ backgroundColor: getCategoryColor(rule.category) }}
                    >
                      {getCategoryName(rule.category)}
                      {rule.subcategory && ` › ${rule.subcategory}`}
                    </span>
                  </div>
                  <div className="rule-actions">
                    <button 
                      onClick={() => handleEditRule(rule)}
                      className="edit-btn"
                      title="Edit rule"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="delete-btn"
                      title="Delete rule"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {hasMoreRules && (
        <button 
          className="show-more-btn"
          onClick={() => setRulesExpanded(!rulesExpanded)}
        >
          {rulesExpanded 
            ? `Show less ↑` 
            : `Show ${rules.length - INITIAL_VISIBLE_RULES} more rules ↓`}
        </button>
      )}
    </div>
  );
}

export default AutoLabelManager;
