import { useState } from 'react';
import Dropdown from './common/Dropdown';
import './TransactionRow.css';

function TransactionRow({ transaction, categories, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    category: transaction.category || '',
    subcategory: transaction.subcategory || '',
    notes: transaction.notes || ''
  });

  const category = categories.find(c => c.id === transaction.category);
  
  // Get subcategories for the currently selected category in edit mode
  const editCategory = categories.find(c => c.id === editData.category);
  const editSubcategories = editCategory?.subcategories || [];
  
  // Check if this is a SWEEP transaction (excluded from expenses/income - internal transfers)
  const upperDesc = transaction.description?.toUpperCase() || '';
  const isSweep = upperDesc.includes('SWEEP');
  // Check if this is a TRANSFER CREDIT (excluded from income)
  const isTransferCredit = upperDesc.includes('TRANSFER CREDIT') || upperDesc.includes('TRF CREDT');
  const isTransfer = isSweep || isTransferCredit;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount, type) => {
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return type === 'credit' ? `+₹${formatted}` : `-₹${formatted}`;
  };

  const handleSave = () => {
    onUpdate(transaction.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      category: transaction.category || '',
      subcategory: transaction.subcategory || '',
      notes: transaction.notes || ''
    });
    setIsEditing(false);
  };

  const handleCategoryChange = (categoryId) => {
    setEditData({
      ...editData,
      category: categoryId,
      subcategory: '' // Reset subcategory when category changes
    });
  };

  const handleQuickCategory = (categoryId, subcategory = '') => {
    onUpdate(transaction.id, { category: categoryId, subcategory });
  };

  return (
    <tr className={`transaction-row ${transaction.type}${isTransfer ? ' sweep-transfer' : ''}`}>
      <td className="date-cell" title={formatDate(transaction.date)}>{formatDate(transaction.date)}</td>
      <td className="description-cell" title={transaction.description}>
        <div className="description-content">
          <span className="description-text">{transaction.description}</span>
          {isTransfer && (
            <span className="transfer-tag">Transfer</span>
          )}
          {transaction.notes && (
            <span className="notes-indicator" title={transaction.notes}>📝</span>
          )}
        </div>
      </td>
      <td className={`amount-cell ${transaction.type}`} title={formatAmount(transaction.amount, transaction.type)}>
        {formatAmount(transaction.amount, transaction.type)}
      </td>
      <td className="category-cell">
        {isEditing ? (
          <div className="category-edit">
            <Dropdown
              value={editData.category}
              onChange={handleCategoryChange}
              options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              placeholder="Select Category"
              size="small"
            />
            
            {editData.category && editSubcategories.length > 0 && (
              <Dropdown
                value={editData.subcategory}
                onChange={(value) => setEditData({ ...editData, subcategory: value })}
                options={editSubcategories.map(sub => ({ value: sub, label: sub }))}
                placeholder="Select Subcategory"
                size="small"
              />
            )}

            <input
              type="text"
              placeholder="Add notes..."
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="notes-input"
            />

            <div className="edit-actions">
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={handleCancel} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="category-display">
            {category ? (
              <span 
                className="category-badge"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
                {transaction.subcategory && ` › ${transaction.subcategory}`}
              </span>
            ) : (
              <div className="quick-category">
                <span className="uncategorized">Uncategorized</span>
                <div className="quick-category-dropdown">
                  {categories.slice(0, 6).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleQuickCategory(cat.id)}
                      style={{ borderColor: cat.color }}
                      className="quick-cat-btn"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </td>
      <td className="actions-cell">
        {!isEditing && (
          <div className="action-buttons">
            <button 
              onClick={() => setIsEditing(true)} 
              className="edit-btn"
              title="Edit"
            >
              ✏️
            </button>
            <button 
              onClick={() => onDelete(transaction.id)} 
              className="delete-btn"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default TransactionRow;
