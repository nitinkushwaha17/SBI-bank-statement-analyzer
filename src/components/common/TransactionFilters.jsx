import { useMemo } from 'react';
import Dropdown from './Dropdown';
import './TransactionFilters.css';

function TransactionFilters({ 
  filter, 
  onFilterChange, 
  onClearFilters, 
  categories, 
  transactions,
  showSearch = true,
  showTypeFilter = true,
  showCategoryFilter = true,
  showDateFilter = true,
  compact = false
}) {
  // Get available financial years from transactions
  const availableFYs = useMemo(() => {
    const fys = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const date = new Date(t.date);
        const year = date.getFullYear();
        const month = date.getMonth();
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

  const formatMonthLabel = (monthStr) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const formatQuarterLabel = (quarterStr) => {
    const [year, q] = quarterStr.split('-');
    return `${q} ${year}`;
  };

  const handleChange = (key, value) => {
    onFilterChange({ ...filter, [key]: value });
  };

  const handleDatePresetChange = (preset) => {
    handleChange('datePreset', preset);
    
    // Clear individual date filters when changing preset
    if (preset !== 'custom') {
      onFilterChange({ 
        ...filter, 
        datePreset: preset,
        dateFrom: '',
        dateTo: ''
      });
    }
  };

  const hasActiveFilters = 
    filter.search || 
    filter.type !== 'all' || 
    filter.category !== 'all' ||
    filter.datePreset !== 'all' ||
    filter.dateFrom ||
    filter.dateTo ||
    filter.fy ||
    filter.month ||
    filter.quarter;

  return (
    <div className={`transaction-filters ${compact ? 'compact' : ''}`}>
      {/* Date Preset Tabs */}
      {showDateFilter && (
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter.datePreset === 'all' ? 'active' : ''}`}
            onClick={() => handleDatePresetChange('all')}
          >
            All Time
          </button>
          <button 
            className={`filter-tab ${filter.datePreset === 'fy' ? 'active' : ''}`}
            onClick={() => handleDatePresetChange('fy')}
          >
            FY
          </button>
          <button 
            className={`filter-tab ${filter.datePreset === 'quarter' ? 'active' : ''}`}
            onClick={() => handleDatePresetChange('quarter')}
          >
            Quarter
          </button>
          <button 
            className={`filter-tab ${filter.datePreset === 'month' ? 'active' : ''}`}
            onClick={() => handleDatePresetChange('month')}
          >
            Month
          </button>
          <button 
            className={`filter-tab ${filter.datePreset === 'custom' ? 'active' : ''}`}
            onClick={() => handleDatePresetChange('custom')}
          >
            Custom
          </button>
        </div>
      )}

      {/* Date Preset Controls */}
      {showDateFilter && filter.datePreset !== 'all' && (
        <div className="filter-date-controls">
          {filter.datePreset === 'fy' && (
            <Dropdown
              value={filter.fy || ''}
              onChange={(value) => handleChange('fy', value)}
              options={availableFYs.map(fy => ({ value: fy, label: `FY ${fy}` }))}
              placeholder="Select FY"
              size="small"
            />
          )}

          {filter.datePreset === 'month' && (
            <Dropdown
              value={filter.month || ''}
              onChange={(value) => handleChange('month', value)}
              options={availableMonths.map(m => ({ value: m, label: formatMonthLabel(m) }))}
              placeholder="Select Month"
              size="small"
            />
          )}

          {filter.datePreset === 'quarter' && (
            <Dropdown
              value={filter.quarter || ''}
              onChange={(value) => handleChange('quarter', value)}
              options={availableQuarters.map(q => ({ value: q, label: formatQuarterLabel(q) }))}
              placeholder="Select Quarter"
              size="small"
            />
          )}

          {filter.datePreset === 'custom' && (
            <div className="custom-date-inputs">
              <div className="date-input-group">
                <label>From</label>
                <input 
                  type="date" 
                  value={filter.dateFrom || ''}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                  className="filter-date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To</label>
                <input 
                  type="date" 
                  value={filter.dateTo || ''}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                  className="filter-date-input"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Filters Row */}
      <div className="filter-row">
        {showSearch && (
          <input
            type="text"
            placeholder="Search transactions..."
            value={filter.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="search-input"
          />
        )}

        {showTypeFilter && (
          <Dropdown
            value={filter.type || 'all'}
            onChange={(value) => handleChange('type', value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'debit', label: 'Debits Only' },
              { value: 'credit', label: 'Credits Only' }
            ]}
            placeholder=""
            size="small"
          />
        )}

        {showCategoryFilter && (
          <Dropdown
            value={filter.category || 'all'}
            onChange={(value) => handleChange('category', value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'uncategorized', label: 'Uncategorized' },
              ...categories.map(cat => ({ value: cat.id, label: cat.name }))
            ]}
            placeholder=""
            size="small"
          />
        )}

        {hasActiveFilters && (
          <button onClick={onClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export default TransactionFilters;
