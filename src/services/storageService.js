const STORAGE_KEYS = {
  TRANSACTIONS: 'sbi_transactions',
  CATEGORIES: 'sbi_categories',
  SETTINGS: 'sbi_settings',
  AUTO_LABEL_RULES: 'sbi_auto_label_rules'
};

/**
 * Default categories and subcategories
 */
const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    name: 'Food & Dining',
    color: '#FF6B6B',
    subcategories: ['Restaurants', 'Groceries', 'Food Delivery', 'Coffee & Tea', 'Fast Food']
  },
  {
    id: 'transport',
    name: 'Transportation',
    color: '#4ECDC4',
    subcategories: ['Fuel', 'Public Transport', 'Cab/Taxi', 'Parking', 'Vehicle Maintenance']
  },
  {
    id: 'shopping',
    name: 'Shopping',
    color: '#45B7D1',
    subcategories: ['Clothing', 'Electronics', 'Home & Garden', 'Personal Care', 'Online Shopping']
  },
  {
    id: 'utilities',
    name: 'Utilities & Bills',
    color: '#96CEB4',
    subcategories: ['Electricity', 'Water', 'Gas', 'Internet', 'Mobile', 'DTH/Cable']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    color: '#DDA0DD',
    subcategories: ['Movies', 'Streaming Services', 'Games', 'Events', 'Subscriptions']
  },
  {
    id: 'health',
    name: 'Health & Medical',
    color: '#98D8C8',
    subcategories: ['Doctor', 'Pharmacy', 'Insurance', 'Gym/Fitness', 'Medical Tests']
  },
  {
    id: 'education',
    name: 'Education',
    color: '#F7DC6F',
    subcategories: ['Courses', 'Books', 'Tuition', 'School/College Fees', 'Stationery']
  },
  {
    id: 'transfer',
    name: 'Transfers',
    color: '#BB8FCE',
    subcategories: ['Bank Transfer', 'UPI Transfer', 'NEFT/RTGS', 'IMPS', 'Self Transfer']
  },
  {
    id: 'income',
    name: 'Income',
    color: '#58D68D',
    subcategories: ['Salary', 'Freelance', 'Interest', 'Refund', 'Gift', 'Cashback']
  },
  {
    id: 'investment',
    name: 'Investments',
    color: '#5DADE2',
    subcategories: ['Mutual Funds', 'Stocks', 'Fixed Deposit', 'PPF', 'Insurance Premium']
  },
  {
    id: 'emi',
    name: 'EMI & Loans',
    color: '#E74C3C',
    subcategories: ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan']
  },
  {
    id: 'atm',
    name: 'ATM & Cash',
    color: '#F39C12',
    subcategories: ['ATM Withdrawal', 'Cash Deposit', 'Bank Charges']
  },
  {
    id: 'other',
    name: 'Other',
    color: '#95A5A6',
    subcategories: ['Miscellaneous', 'Unknown', 'Uncategorized']
  }
];

/**
 * Storage Service - handles all local storage operations
 */
class StorageService {
  /**
   * Get all transactions
   */
  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading transactions:', error);
      return [];
    }
  }

  /**
   * Save transactions
   */
  saveTransactions(transactions) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error('Error saving transactions:', error);
      return false;
    }
  }

  /**
   * Add new transactions (merge with existing, avoid duplicates)
   */
  addTransactions(newTransactions) {
    const existing = this.getTransactions();
    const existingIds = new Set(existing.map(t => t.id));
    
    // Create a signature for each existing transaction to detect duplicates
    const existingSignatures = new Set(
      existing.map(t => `${t.date}_${t.description}_${t.amount}`)
    );

    const uniqueNew = newTransactions.filter(t => {
      const signature = `${t.date}_${t.description}_${t.amount}`;
      return !existingIds.has(t.id) && !existingSignatures.has(signature);
    });

    const merged = [...existing, ...uniqueNew];
    // Sort by date (newest first)
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.saveTransactions(merged);
    return { added: uniqueNew.length, total: merged.length };
  }

  /**
   * Update a single transaction
   */
  updateTransaction(id, updates) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      return false;
    }

    transactions[index] = { ...transactions[index], ...updates };
    this.saveTransactions(transactions);
    return true;
  }

  /**
   * Delete a transaction
   */
  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    this.saveTransactions(filtered);
    return filtered.length < transactions.length;
  }

  /**
   * Clear all transactions
   */
  clearTransactions() {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  }

  /**
   * Get categories
   */
  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (error) {
      console.error('Error reading categories:', error);
      return DEFAULT_CATEGORIES;
    }
  }

  /**
   * Save categories
   */
  saveCategories(categories) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      return true;
    } catch (error) {
      console.error('Error saving categories:', error);
      return false;
    }
  }

  /**
   * Add a new category
   */
  addCategory(category) {
    const categories = this.getCategories();
    categories.push(category);
    this.saveCategories(categories);
    return category;
  }

  /**
   * Update a category
   */
  updateCategory(id, updates) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) {
      return false;
    }

    categories[index] = { ...categories[index], ...updates };
    this.saveCategories(categories);
    return true;
  }

  /**
   * Add subcategory to a category
   */
  addSubcategory(categoryId, subcategory) {
    const categories = this.getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
      return false;
    }

    if (!category.subcategories.includes(subcategory)) {
      category.subcategories.push(subcategory);
      this.saveCategories(categories);
    }
    return true;
  }

  /**
   * Get settings
   */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { theme: 'light', currency: '₹' };
    } catch (error) {
      return { theme: 'light', currency: '₹' };
    }
  }

  /**
   * Save settings
   */
  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * Get auto-label rules
   */
  getAutoLabelRules() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTO_LABEL_RULES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading auto-label rules:', error);
      return [];
    }
  }

  /**
   * Save auto-label rules
   */
  saveAutoLabelRules(rules) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_LABEL_RULES, JSON.stringify(rules));
      return true;
    } catch (error) {
      console.error('Error saving auto-label rules:', error);
      return false;
    }
  }

  /**
   * Apply auto-label rules to transactions
   */
  applyAutoLabelRules(transactions, rules) {
    let labelsApplied = 0;
    
    const updated = transactions.map(t => {
      // Skip already categorized transactions
      if (t.category) return t;
      
      const description = t.description?.toUpperCase() || '';
      
      for (const rule of rules) {
        const keyword = rule.keyword?.toUpperCase() || '';
        if (keyword && description.includes(keyword)) {
          labelsApplied++;
          return {
            ...t,
            category: rule.category,
            subcategory: rule.subcategory || ''
          };
        }
      }
      
      return t;
    });
    
    if (labelsApplied > 0) {
      this.saveTransactions(updated);
    }
    
    return { updated, labelsApplied };
  }

  /**
   * Export all data
   */
  exportData() {
    return {
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      autoLabelRules: this.getAutoLabelRules(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import data
   */
  importData(data) {
    if (data.transactions) {
      this.saveTransactions(data.transactions);
    }
    if (data.categories) {
      this.saveCategories(data.categories);
    }
    if (data.autoLabelRules) {
      this.saveAutoLabelRules(data.autoLabelRules);
    }
    if (data.settings) {
      this.saveSettings(data.settings);
    }
  }

  /**
   * Clean up all transaction descriptions by removing UPI noise patterns
   */
  cleanAllDescriptions() {
    const transactions = this.getTransactions();
    let cleaned = 0;

    const updatedTransactions = transactions.map(t => {
      const originalDesc = t.description || '';
      const cleanedDesc = this.cleanDescription(originalDesc);
      
      if (cleanedDesc !== originalDesc) {
        cleaned++;
        return { ...t, description: cleanedDesc };
      }
      return t;
    });

    if (cleaned > 0) {
      this.saveTransactions(updatedTransactions);
    }

    return { cleaned, total: transactions.length };
  }

  /**
   * Clean up description by removing unnecessary patterns
   */
  cleanDescription(description) {
    if (!description) return '';
    
    let cleaned = description;
    
    // Remove UPI transfer patterns like "TO TRANSFER-UPI/DR/50991133328/"
    cleaned = cleaned.replace(/TO TRANSFER-UPI\/[A-Z]+\/\d+\//gi, '');
    cleaned = cleaned.replace(/BY TRANSFER-UPI\/[A-Z]+\/\d+\//gi, '');
    
    // Remove common SBI noise patterns
    cleaned = cleaned.replace(/UPI\/DR\/\d+\//gi, '');
    cleaned = cleaned.replace(/UPI\/CR\/\d+\//gi, '');
    cleaned = cleaned.replace(/\/DR\/\d+\//gi, '');
    cleaned = cleaned.replace(/\/CR\/\d+\//gi, '');
    
    // Clean up multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }
}

export const storageService = new StorageService();
export { DEFAULT_CATEGORIES };
