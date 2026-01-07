import { useState, useMemo, useEffect } from 'react';
import TransactionRow from './TransactionRow';
import TransactionFilters from './common/TransactionFilters';
import './TransactionList.css';

function TransactionList({ transactions, categories, onUpdateTransaction, onDeleteTransaction, initialFilter, onClearFilter }) {
  const getDefaultFilter = () => ({
    search: '',
    type: 'all',
    category: 'all',
    datePreset: 'all',
    fy: '',
    month: '',
    quarter: '',
    dateFrom: '',
    dateTo: ''
  });

  const [filter, setFilter] = useState(() => {
    if (initialFilter) {
      return { ...getDefaultFilter(), ...initialFilter, datePreset: initialFilter.datePreset || (initialFilter.month ? 'month' : 'all') };
    }
    return getDefaultFilter();
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Update filter when initialFilter changes from parent
  useEffect(() => {
    if (initialFilter) {
      setFilter({
        ...getDefaultFilter(),
        ...initialFilter,
        datePreset: initialFilter.datePreset || (initialFilter.month ? 'month' : 'all')
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialFilter)]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filter.type !== 'all') {
      result = result.filter(t => t.type === filter.type);
    }

    // Apply category filter
    if (filter.category !== 'all') {
      if (filter.category === 'uncategorized') {
        result = result.filter(t => !t.category);
      } else {
        result = result.filter(t => t.category === filter.category);
      }
    }

    // Apply date preset filters
    result = result.filter(t => {
      if (!t.date) return true;
      const date = new Date(t.date);
      
      if (filter.datePreset === 'fy' && filter.fy) {
        const [startYear] = filter.fy.split('-').map(Number);
        const fyStart = new Date(startYear, 3, 1);
        const fyEnd = new Date(startYear + 1, 2, 31);
        return date >= fyStart && date <= fyEnd;
      }
      
      if (filter.datePreset === 'month' && filter.month) {
        const txMonth = t.date.substring(0, 7);
        return txMonth === filter.month;
      }
      
      if (filter.datePreset === 'quarter' && filter.quarter) {
        const [year, q] = filter.quarter.split('-Q');
        const quarterNum = parseInt(q);
        const startMonth = (quarterNum - 1) * 3;
        const qStart = new Date(parseInt(year), startMonth, 1);
        const qEnd = new Date(parseInt(year), startMonth + 3, 0);
        return date >= qStart && date <= qEnd;
      }
      
      if (filter.datePreset === 'custom') {
        if (filter.dateFrom && date < new Date(filter.dateFrom)) return false;
        if (filter.dateTo) {
          const endDate = new Date(filter.dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (date > endDate) return false;
        }
      }
      
      return true;
    });

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, filter, sortBy, sortOrder]);

  const summary = useMemo(() => {
    const totalCredit = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.credit, 0);
    
    const totalDebit = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.debit, 0);

    const uncategorized = filteredTransactions.filter(t => !t.category).length;

    return { totalCredit, totalDebit, net: totalCredit - totalDebit, uncategorized };
  }, [filteredTransactions]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilter(getDefaultFilter());
    onClearFilter?.();
  };

  // Get filter description for badge
  const getFilterDescription = () => {
    const parts = [];
    
    if (filter.category && filter.category !== 'all') {
      const cat = categories.find(c => c.id === filter.category);
      parts.push(cat?.name || filter.category);
    }
    
    if (filter.datePreset === 'fy' && filter.fy) {
      parts.push(`FY ${filter.fy}`);
    } else if (filter.datePreset === 'month' && filter.month) {
      try {
        const [year, month] = filter.month.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        parts.push(date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
      } catch {
        parts.push(filter.month);
      }
    } else if (filter.datePreset === 'quarter' && filter.quarter) {
      parts.push(filter.quarter.replace('-', ' '));
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const filterDescription = getFilterDescription();

  return (
    <div className="transaction-list-container">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <span className="summary-label">Total Income</span>
          <span className="summary-value">₹{summary.totalCredit.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-card expense">
          <span className="summary-label">Total Expense</span>
          <span className="summary-value">₹{summary.totalDebit.toLocaleString('en-IN')}</span>
        </div>
        <div className={`summary-card ${summary.net >= 0 ? 'positive' : 'negative'}`}>
          <span className="summary-label">Net</span>
          <span className="summary-value">₹{summary.net.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-card neutral">
          <span className="summary-label">Uncategorized</span>
          <span className="summary-value">{summary.uncategorized}</span>
        </div>
      </div>

      {/* Filter Badge */}
      {filterDescription && (
        <div className="filter-badge">
          <span className="badge-icon">🔍</span>
          <span className="badge-text">Filtered: <strong>{filterDescription}</strong></span>
          <button className="badge-clear" onClick={clearFilters}>
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <TransactionFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        categories={categories}
        transactions={transactions}
      />

      {/* Transaction Count */}
      <div className="transaction-count">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>

      {/* Transaction Table */}
      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('description')} className="sortable">
                Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amount')} className="sortable">
                Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(transaction => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                onUpdate={onUpdateTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="no-transactions">
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionList;
