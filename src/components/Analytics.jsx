import { useMemo, useState } from 'react';
import Dropdown from './common/Dropdown';
import './Analytics.css';

function Analytics({ transactions, categories, onViewMonth, onViewCategory }) {
  const [recalcKey, setRecalcKey] = useState(0);
  const [filterType, setFilterType] = useState('all'); // all, fy, custom, month, quarter
  const [selectedFY, setSelectedFY] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleRecalculate = () => {
    setRecalcKey(prev => prev + 1);
  };

  // Get available financial years from transactions
  const availableFYs = useMemo(() => {
    const fys = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const date = new Date(t.date);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        // FY starts in April (month 3)
        const fy = month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        fys.add(fy);
      }
    });
    return [...fys].sort().reverse();
  }, [transactions]);

  // Get available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        const month = t.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(month)) {
          months.add(month);
        }
      }
    });
    return [...months].sort().reverse();
  }, [transactions]);

  // Get available quarters
  const availableQuarters = useMemo(() => {
    const quarters = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const date = new Date(t.date);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        quarters.add(`${year}-Q${quarter}`);
      }
    });
    return [...quarters].sort().reverse();
  }, [transactions]);

  // Filter transactions based on selected filter
  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;

    return transactions.filter(t => {
      if (!t.date) return false;
      const date = new Date(t.date);
      
      if (filterType === 'fy' && selectedFY) {
        const [startYear] = selectedFY.split('-').map(Number);
        const fyStart = new Date(startYear, 3, 1); // April 1
        const fyEnd = new Date(startYear + 1, 2, 31); // March 31
        return date >= fyStart && date <= fyEnd;
      }
      
      if (filterType === 'month' && selectedMonth) {
        const txMonth = t.date.substring(0, 7);
        return txMonth === selectedMonth;
      }
      
      if (filterType === 'quarter' && selectedQuarter) {
        const [year, q] = selectedQuarter.split('-Q');
        const quarterNum = parseInt(q);
        const startMonth = (quarterNum - 1) * 3;
        const qStart = new Date(parseInt(year), startMonth, 1);
        const qEnd = new Date(parseInt(year), startMonth + 3, 0);
        return date >= qStart && date <= qEnd;
      }
      
      if (filterType === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      }
      
      return true;
    });
  }, [transactions, filterType, selectedFY, selectedMonth, selectedQuarter, customStartDate, customEndDate]);

  const analytics = useMemo(() => {
    // Category-wise spending
    const categorySpending = {};
    const subcategorySpending = {};
    const monthlySpending = {};
    const monthlyIncome = {};

    filteredTransactions.forEach(t => {
      // Monthly breakdown - use the date to extract month
      // Date should be in ISO format YYYY-MM-DD
      let month = 'Unknown';
      if (t.date && typeof t.date === 'string' && t.date.length >= 7) {
        const extracted = t.date.substring(0, 7);
        // Validate it looks like YYYY-MM
        if (/^\d{4}-\d{2}$/.test(extracted)) {
          month = extracted;
        }
      }

      // Skip SWEEP transactions - these are automatic transfers between accounts, not real expenses/income
      const upperDesc = t.description?.toUpperCase() || '';
      const isSweep = upperDesc.includes('SWEEP');
      // Skip TRANSFER CREDIT - these are transfers between accounts, not income
      const isTransferCredit = upperDesc.includes('TRANSFER CREDIT') || upperDesc.includes('TRF CREDT');
      const isTransfer = isSweep || isTransferCredit;
      
      if (t.type === 'debit' && t.debit > 0 && !isTransfer) {
        monthlySpending[month] = (monthlySpending[month] || 0) + t.debit;
        
        if (t.category) {
          categorySpending[t.category] = (categorySpending[t.category] || 0) + t.debit;
          
          if (t.subcategory) {
            const key = `${t.category}:${t.subcategory}`;
            subcategorySpending[key] = (subcategorySpending[key] || 0) + t.debit;
          }
        }
      } else if (t.type === 'credit' && t.credit > 0 && !isTransfer) {
        monthlyIncome[month] = (monthlyIncome[month] || 0) + t.credit;
      }
    });

    // Sort months (newest first for better UX)
    const sortedMonths = [...new Set([
      ...Object.keys(monthlySpending),
      ...Object.keys(monthlyIncome)
    ])].sort().reverse();

    // Get top spending categories
    const topCategories = Object.entries(categorySpending)
      .map(([id, amount]) => {
        const category = categories.find(c => c.id === id);
        return {
          id,
          name: category?.name || id,
          color: category?.color || '#ccc',
          amount
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Calculate totals from monthly data (includes all transactions)
    const totalSpending = Object.values(monthlySpending).reduce((a, b) => a + b, 0);
    const totalIncome = Object.values(monthlyIncome).reduce((a, b) => a + b, 0);
    const categorizedSpending = Object.values(categorySpending).reduce((a, b) => a + b, 0);

    return {
      categorySpending: topCategories,
      subcategorySpending,
      monthlySpending,
      monthlyIncome,
      sortedMonths,
      totalSpending,
      totalIncome,
      categorizedSpending
    };
  }, [filteredTransactions, categories, recalcKey]);

  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  const formatMonth = (monthStr) => {
    if (!monthStr || monthStr === 'Unknown' || monthStr === 'null') return 'Unknown';
    try {
      const [year, month] = monthStr.split('-');
      if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        return 'Unknown';
      }
      const date = new Date(parseInt(year), parseInt(month) - 1);
      if (isNaN(date.getTime())) return 'Unknown';
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const getPercentage = (amount, total) => {
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(1);
  };

  // Build current date filter for passing to transactions
  const getCurrentDateFilter = () => {
    const filter = { datePreset: filterType };
    
    if (filterType === 'fy' && selectedFY) {
      filter.fy = selectedFY;
    } else if (filterType === 'month' && selectedMonth) {
      filter.month = selectedMonth;
    } else if (filterType === 'quarter' && selectedQuarter) {
      filter.quarter = selectedQuarter;
    } else if (filterType === 'custom' && customStartDate && customEndDate) {
      filter.dateFrom = customStartDate;
      filter.dateTo = customEndDate;
    }
    
    return filter;
  };

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    if (onViewCategory) {
      onViewCategory(categoryId, getCurrentDateFilter());
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Spending Analytics</h2>
        <button className="recalculate-btn" onClick={handleRecalculate}>
          <span className="recalc-icon">↻</span>
          Recalculate
        </button>
      </div>

      {/* Date Range Filters */}
      <div className="analytics-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Time
          </button>
          <button 
            className={`filter-tab ${filterType === 'fy' ? 'active' : ''}`}
            onClick={() => setFilterType('fy')}
          >
            Financial Year
          </button>
          <button 
            className={`filter-tab ${filterType === 'quarter' ? 'active' : ''}`}
            onClick={() => setFilterType('quarter')}
          >
            Quarter
          </button>
          <button 
            className={`filter-tab ${filterType === 'month' ? 'active' : ''}`}
            onClick={() => setFilterType('month')}
          >
            Month
          </button>
          <button 
            className={`filter-tab ${filterType === 'custom' ? 'active' : ''}`}
            onClick={() => setFilterType('custom')}
          >
            Custom Range
          </button>
        </div>

        <div className="filter-controls">
          {filterType === 'fy' && (
            <Dropdown
              value={selectedFY}
              onChange={setSelectedFY}
              options={availableFYs.map(fy => ({ value: fy, label: `FY ${fy}` }))}
              placeholder="Select Financial Year"
              className="filter-dropdown"
            />
          )}

          {filterType === 'month' && (
            <Dropdown
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={availableMonths.map(month => ({ value: month, label: formatMonth(month) }))}
              placeholder="Select Month"
              className="filter-dropdown"
            />
          )}

          {filterType === 'quarter' && (
            <Dropdown
              value={selectedQuarter}
              onChange={setSelectedQuarter}
              options={availableQuarters.map(q => ({ value: q, label: q }))}
              placeholder="Select Quarter"
              className="filter-dropdown"
            />
          )}

          {filterType === 'custom' && (
            <div className="custom-date-range">
              <div className="date-input-group">
                <label>From</label>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To</label>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="filter-date-input"
                />
              </div>
            </div>
          )}
        </div>

        {filterType !== 'all' && (
          <div className="filter-summary">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="overview-card">
          <h3>Total Income</h3>
          <span className="amount income">{formatAmount(analytics.totalIncome)}</span>
        </div>
        <div className="overview-card">
          <h3>Total Spending</h3>
          <span className="amount expense">{formatAmount(analytics.totalSpending)}</span>
        </div>
        <div className="overview-card">
          <h3>Savings</h3>
          <span className={`amount ${analytics.totalIncome - analytics.totalSpending >= 0 ? 'income' : 'expense'}`}>
            {formatAmount(analytics.totalIncome - analytics.totalSpending)}
          </span>
        </div>
        <div className="overview-card">
          <h3>Savings Rate</h3>
          <span className="amount">
            {analytics.totalIncome > 0 
              ? `${getPercentage(analytics.totalIncome - analytics.totalSpending, analytics.totalIncome)}%`
              : '0%'
            }
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="analytics-section">
        <h3>Spending by Category</h3>
        <div className="category-breakdown">
          {analytics.categorySpending.length > 0 ? (
            analytics.categorySpending.map(cat => (
              <div 
                key={cat.id} 
                className="category-bar-item clickable"
                onClick={() => handleCategoryClick(cat.id)}
                title="Click to view transactions"
              >
                <div className="category-bar-header">
                  <div className="category-info">
                    <span 
                      className="category-dot" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="category-label">{cat.name}</span>
                    <span className="view-hint">→</span>
                  </div>
                  <div className="category-amount">
                    <span>{formatAmount(cat.amount)}</span>
                    <span className="percentage">
                      ({getPercentage(cat.amount, analytics.totalSpending)}%)
                    </span>
                  </div>
                </div>
                <div className="category-bar-track">
                  <div 
                    className="category-bar-fill"
                    style={{ 
                      width: `${getPercentage(cat.amount, analytics.totalSpending)}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No categorized spending data available</p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="analytics-section">
        <h3>Monthly Trend</h3>
        <div className="monthly-trend">
          {analytics.sortedMonths.length > 0 ? (
            <table className="trend-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Spending</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {analytics.sortedMonths.map(month => {
                  const income = analytics.monthlyIncome[month] || 0;
                  const spending = analytics.monthlySpending[month] || 0;
                  const net = income - spending;
                  
                  return (
                    <tr 
                      key={month} 
                      className="clickable-row"
                      onClick={() => onViewMonth?.(month)}
                      title="Click to view transactions for this month"
                    >
                      <td className="month-cell">{formatMonth(month)}</td>
                      <td className="income">{formatAmount(income)}</td>
                      <td className="expense">{formatAmount(spending)}</td>
                      <td className={net >= 0 ? 'income' : 'expense'}>
                        {net >= 0 ? '+' : ''}{formatAmount(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>Total</strong></td>
                  <td className="income"><strong>{formatAmount(analytics.totalIncome)}</strong></td>
                  <td className="expense"><strong>{formatAmount(analytics.totalSpending)}</strong></td>
                  <td className={analytics.totalIncome - analytics.totalSpending >= 0 ? 'income' : 'expense'}>
                    <strong>{analytics.totalIncome - analytics.totalSpending >= 0 ? '+' : ''}{formatAmount(analytics.totalIncome - analytics.totalSpending)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="no-data">No monthly data available</p>
          )}
        </div>
      </div>

      {/* Uncategorized Warning */}
      {transactions.filter(t => !t.category && t.type === 'debit').length > 0 && (
        <div className="uncategorized-warning">
          <span className="warning-icon">⚠️</span>
          <span>
            {transactions.filter(t => !t.category && t.type === 'debit').length} transactions 
            are uncategorized. Categorize them for accurate analytics.
          </span>
        </div>
      )}
    </div>
  );
}

export default Analytics;
