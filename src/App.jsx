import { useState, useEffect, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import TransactionList from './components/TransactionList';
import CategoryManager from './components/CategoryManager';
import Analytics from './components/Analytics';
import Logo from './components/Logo';
import BackgroundEffects from './components/BackgroundEffects';
import { storageService } from './services/storageService';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [autoLabelRules, setAutoLabelRules] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [notification, setNotification] = useState(null);
  const [transactionFilter, setTransactionFilter] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadedTransactions = storageService.getTransactions();
    const loadedCategories = storageService.getCategories();
    const loadedRules = storageService.getAutoLabelRules();
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
    setAutoLabelRules(loadedRules);
    
    // If no transactions, start on upload page
    if (loadedTransactions.length === 0) {
      setActiveTab('upload');
    }
  }, []);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle new transactions from file upload
  const handleTransactionsLoaded = useCallback((newTransactions) => {
    const result = storageService.addTransactions(newTransactions);
    setTransactions(storageService.getTransactions());
    showNotification(`Added ${result.added} new transactions (${result.total} total)`);
    setActiveTab('transactions');
  }, [showNotification]);

  // Update a transaction
  const handleUpdateTransaction = useCallback((id, updates) => {
    storageService.updateTransaction(id, updates);
    setTransactions(storageService.getTransactions());
    showNotification('Transaction updated');
  }, [showNotification]);

  // Delete a transaction
  const handleDeleteTransaction = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      storageService.deleteTransaction(id);
      setTransactions(storageService.getTransactions());
      showNotification('Transaction deleted');
    }
  }, [showNotification]);

  // Update categories
  const handleUpdateCategories = useCallback((newCategories) => {
    storageService.saveCategories(newCategories);
    setCategories(newCategories);
    showNotification('Categories updated');
  }, [showNotification]);

  // Update auto-label rules
  const handleUpdateAutoLabelRules = useCallback((newRules) => {
    storageService.saveAutoLabelRules(newRules);
    setAutoLabelRules(newRules);
    showNotification('Auto-label rules updated');
  }, [showNotification]);

  // Apply auto-label rules to transactions
  const handleApplyAutoLabelRules = useCallback(() => {
    const rules = storageService.getAutoLabelRules();
    const currentTransactions = storageService.getTransactions();
    const { updated, labelsApplied } = storageService.applyAutoLabelRules(currentTransactions, rules);
    setTransactions(updated);
    showNotification(`Applied labels to ${labelsApplied} transactions`);
  }, [showNotification]);

  // Clear all data
  const handleClearData = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all transactions? This cannot be undone.')) {
      storageService.clearTransactions();
      setTransactions([]);
      showNotification('All transactions cleared');
    }
  }, [showNotification]);

  // Navigate to transactions with month filter
  const handleViewMonth = useCallback((month) => {
    setTransactionFilter({ month });
    setActiveTab('transactions');
  }, []);

  // Navigate to transactions with category filter
  const handleViewCategory = useCallback((categoryId, dateFilter) => {
    setTransactionFilter({ category: categoryId, ...dateFilter });
    setActiveTab('transactions');
  }, []);

  // Clear transaction filter
  const handleClearTransactionFilter = useCallback(() => {
    setTransactionFilter(null);
  }, []);

  // Export data
  const handleExportData = useCallback(() => {
    const data = storageService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-statement-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully');
  }, [showNotification]);

  // Clean up transaction descriptions
  const handleCleanDescriptions = useCallback(() => {
    const result = storageService.cleanAllDescriptions();
    setTransactions(storageService.getTransactions());
    showNotification(`Cleaned ${result.cleaned} of ${result.total} transaction descriptions`);
  }, [showNotification]);

  // Import data from JSON file
  const handleImportData = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.transactions && !data.categories) {
          showNotification('Invalid backup file format', 'error');
          return;
        }

        if (window.confirm(`Import ${data.transactions?.length || 0} transactions and ${data.categories?.length || 0} categories? This will replace existing data.`)) {
          storageService.importData(data);
          setTransactions(storageService.getTransactions());
          setCategories(storageService.getCategories());
          setAutoLabelRules(storageService.getAutoLabelRules());
          showNotification('Data imported successfully');
        }
      } catch (err) {
        showNotification('Failed to parse backup file', 'error');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be imported again
    event.target.value = '';
  }, [showNotification]);

  return (
    <div className="app">
      {/* Background Effects - show on all pages except upload */}
      {activeTab !== 'upload' && <BackgroundEffects />}
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Logo size={36} />
            <h1>SBI Statement Analyser</h1>
          </div>
          <div className="header-actions">
            <button onClick={handleCleanDescriptions} className="header-btn" title="Clean up UPI noise from descriptions">
              🧹 Clean
            </button>
            <label className="header-btn" title="Import backup JSON">
              📥 Import
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportData} 
                style={{ display: 'none' }} 
              />
            </label>
            <button onClick={handleExportData} className="header-btn">
              📤 Export
            </button>
            <button onClick={handleClearData} className="header-btn danger">
              🗑️ Clear All
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📁 Upload
        </button>
        <button
          className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📋 Transactions
          {transactions.length > 0 && (
            <span className="badge">{transactions.length}</span>
          )}
        </button>
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button
          className={`nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories
        </button>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'upload' && (
          <FileUpload onTransactionsLoaded={handleTransactionsLoaded} />
        )}

        {activeTab === 'transactions' && (
          transactions.length > 0 ? (
            <TransactionList
              transactions={transactions}
              categories={categories}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              initialFilter={transactionFilter}
              onClearFilter={handleClearTransactionFilter}
            />
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <h2>No Transactions Yet</h2>
              <p>Upload your SBI bank statement to get started</p>
              <button 
                onClick={() => setActiveTab('upload')} 
                className="primary-btn"
              >
                Upload Statement
              </button>
            </div>
          )
        )}

        {activeTab === 'analytics' && (
          <Analytics 
            transactions={transactions} 
            categories={categories}
            onViewMonth={handleViewMonth}
            onViewCategory={handleViewCategory}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onUpdateCategories={handleUpdateCategories}
            autoLabelRules={autoLabelRules}
            onUpdateAutoLabelRules={handleUpdateAutoLabelRules}
            onApplyAutoLabelRules={handleApplyAutoLabelRules}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        Made with <span className="heart">❤️</span> by Nitin
      </footer>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
