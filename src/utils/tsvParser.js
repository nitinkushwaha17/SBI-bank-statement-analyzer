/**
 * Parse TSV content from SBI bank statement
 * Supports two formats:
 * 1. Standard: Txn Date, Value Date, Description, Ref No./Cheque No., Debit, Credit, Balance
 * 2. Extended: Date, Details, Ref No/Cheque No, Debit, Credit, Balance (with header info to skip)
 */
export function parseTSV(content) {
  // First, handle multi-line quoted fields by normalizing them
  const normalizedContent = normalizeMultiLineFields(content);
  const lines = normalizedContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('Invalid TSV file: No data rows found');
  }

  // Find the header row - it should contain transaction column names
  const { headerIndex, headers } = findHeaderRow(lines);
  
  if (headerIndex === -1) {
    throw new Error('Could not find header row with transaction columns (Date, Description/Details, Debit, Credit, Balance)');
  }

  const transactions = [];

  // Log headers with their indices for debugging
  console.log('Found header row at line:', headerIndex);
  console.log('Parsed headers:', headers);
  console.log('Header count:', headers.length);
  headers.forEach((h, i) => console.log(`  Header[${i}]: "${h}"`));

  for (let i = headerIndex + 1; i < lines.length; i++) {
    // Split by tab but preserve the raw values first
    const rawValues = parseTabSeparatedLine(lines[i]);
    const values = rawValues.map(v => v.trim());
    
    // Skip empty lines
    if (values.every(v => !v)) {
      continue;
    }
    
    // Log first few transactions for debugging
    if (transactions.length < 3) {
      console.log(`\n--- Row ${i} ---`);
      console.log('Values count:', values.length);
      values.forEach((v, idx) => console.log(`  Value[${idx}]: "${v.substring(0, 50)}${v.length > 50 ? '...' : ''}"`));
    }

    // Allow rows with fewer values (pad with empty strings)
    while (values.length < headers.length) {
      values.push('');
    }

    const transaction = {};
    headers.forEach((header, index) => {
      transaction[header] = values[index] || '';
    });

    // Normalize common SBI statement fields
    const normalizedTransaction = normalizeTransaction(transaction, headers, transactions.length < 3);
    if (normalizedTransaction) {
      transactions.push(normalizedTransaction);
    }
  }

  return transactions;
}

/**
 * Find the header row in the content
 * Skips info lines and finds the row with transaction column headers
 */
function findHeaderRow(lines) {
  const requiredColumns = ['date', 'debit', 'credit', 'balance'];
  const descriptionColumns = ['description', 'details', 'particulars', 'narration'];
  
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i];
    const columns = parseTabSeparatedLine(line).map(h => h.trim().toLowerCase());
    
    // Check if this line has the required columns
    const hasDate = columns.some(c => c.includes('date') && !c.includes('statement') && !c.includes('open'));
    const hasDebit = columns.some(c => requiredColumns.slice(1).some(req => c.includes(req)));
    const hasDescription = columns.some(c => descriptionColumns.some(desc => c.includes(desc)));
    
    if (hasDate && hasDebit && hasDescription) {
      // Found the header row
      const headers = parseTabSeparatedLine(line).map(h => h.trim());
      return { headerIndex: i, headers };
    }
  }
  
  // Fallback: assume first line is header (old behavior)
  return { 
    headerIndex: 0, 
    headers: parseTabSeparatedLine(lines[0]).map(h => h.trim()) 
  };
}

/**
 * Handle multi-line fields that are wrapped in quotes
 * SBI statements sometimes have descriptions that span multiple lines
 */
function normalizeMultiLineFields(content) {
  let result = '';
  let inQuote = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuote = !inQuote;
      result += char;
    } else if (char === '\n' && inQuote) {
      // Replace newline inside quotes with a space
      result += ' ';
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Parse a tab-separated line, handling quoted fields
 */
function parseTabSeparatedLine(line) {
  const result = [];
  let current = '';
  let inQuote = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuote = !inQuote;
      // Don't include the quote in the value
    } else if (char === '\t' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Push the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Normalize transaction to a standard format
 */
function normalizeTransaction(raw, headers, shouldLog = false) {
  // Try to identify columns by common names
  const dateKey = findKey(headers, ['txn date', 'transaction date', 'date', 'txn_date']);
  const valueDateKey = findKey(headers, ['value date', 'value_date', 'valdate']);
  const descKey = findKey(headers, ['description', 'particulars', 'narration', 'desc', 'details']);
  const refKey = findKey(headers, ['ref no', 'ref no.', 'cheque no', 'cheque no.', 'ref no./cheque no.', 'ref no/cheque no', 'reference']);
  const debitKey = findKey(headers, ['debit', 'withdrawal', 'dr', 'debit amount']);
  const creditKey = findKey(headers, ['credit', 'deposit', 'cr', 'credit amount']);
  const balanceKey = findKey(headers, ['balance', 'closing balance', 'available balance']);

  // Debug logging
  if (shouldLog) {
    console.log('Keys found:', { dateKey, valueDateKey, descKey, refKey, debitKey, creditKey, balanceKey });
    console.log('Key indices:', {
      dateKey: headers.indexOf(dateKey),
      descKey: headers.indexOf(descKey),
      debitKey: headers.indexOf(debitKey),
      creditKey: headers.indexOf(creditKey),
      balanceKey: headers.indexOf(balanceKey)
    });
    console.log('Raw values for debit/credit/balance:', { 
      debit: raw[debitKey], 
      credit: raw[creditKey], 
      balance: raw[balanceKey] 
    });
  }

  const date = raw[dateKey] || '';
  const description = raw[descKey] || '';
  
  // Skip if no date or description
  if (!date || !description) {
    return null;
  }

  const debitRaw = raw[debitKey];
  const creditRaw = raw[creditKey];
  
  const debit = parseAmount(debitRaw);
  const credit = parseAmount(creditRaw);
  const balance = parseAmount(raw[balanceKey]);

  if (shouldLog) {
    console.log('Parsed amounts:', { debitRaw, creditRaw, debit, credit, balance });
  }

  return {
    id: generateId(),
    date: parseDate(date),
    valueDate: raw[valueDateKey] ? parseDate(raw[valueDateKey]) : null,
    description: cleanDescription(description),
    reference: raw[refKey] || '',
    debit: debit,
    credit: credit,
    balance: balance,
    amount: credit > 0 ? credit : -debit,
    type: credit > 0 ? 'credit' : 'debit',
    category: null,
    subcategory: null,
    notes: ''
  };
}

/**
 * Clean up description by removing unnecessary patterns
 */
function cleanDescription(description) {
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

/**
 * Find matching header key (case-insensitive)
 * Uses exact match or word-boundary matching to avoid false positives
 * (e.g., 'cr' should not match 'Description')
 */
function findKey(headers, possibleNames) {
  // First pass: try exact match
  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    for (const name of possibleNames) {
      if (lowerHeader === name.toLowerCase()) {
        return header;
      }
    }
  }
  
  // Second pass: try word-boundary match for multi-word headers
  // e.g., "Ref No./Cheque No." should match "ref no"
  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    for (const name of possibleNames) {
      const lowerName = name.toLowerCase();
      // Only match if the name appears as a complete word or phrase
      // Use word boundary check - name must be at start/end or surrounded by non-alphanumeric chars
      const regex = new RegExp(`(^|[^a-z])${escapeRegex(lowerName)}([^a-z]|$)`);
      if (regex.test(lowerHeader)) {
        return header;
      }
    }
  }
  
  return null;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse amount string to number
 * Handles formats like: "1,131.19", "2,83,295.35", 940.36, 219, empty strings
 */
function parseAmount(value) {
  if (!value || typeof value !== 'string') return 0;
  
  // Trim whitespace
  let cleaned = value.trim();
  
  // Return 0 for empty values
  if (!cleaned) return 0;
  
  // Remove surrounding quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  
  // Return 0 if still empty after removing quotes
  if (!cleaned) return 0;
  
  // Remove all commas (handles Indian format like 2,83,295.35)
  cleaned = cleaned.replace(/,/g, '');
  
  // Remove currency symbols
  cleaned = cleaned.replace(/[₹$]/g, '').trim();
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse date string to ISO format (YYYY-MM-DD)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Clean the date string - remove quotes and trim
  let cleaned = dateStr.trim().replace(/^["']|["']$/g, '').trim();
  if (!cleaned) return null;

  const months = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try DD/MM/YY or DD-MM-YY
  match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try DD MMM YYYY (e.g., "01 Jan 2024")
  match = cleaned.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/);
  if (match) {
    const [, day, monthStr, year] = match;
    const month = months[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Try DD-MMM-YYYY or DD/MMM/YYYY (e.g., "01-Jan-2024")
  match = cleaned.match(/^(\d{1,2})[\/\-](\w{3})[\/\-](\d{4})$/);
  if (match) {
    const [, day, monthStr, year] = match;
    const month = months[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Try DD-MMM-YY or DD/MMM/YY (e.g., "01-Jan-24")
  match = cleaned.match(/^(\d{1,2})[\/\-](\w{3})[\/\-](\d{2})$/);
  if (match) {
    const [, day, monthStr, year] = match;
    const month = months[monthStr.toLowerCase()];
    if (month) {
      const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      return `${fullYear}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Try YYYY-MM-DD (already ISO format)
  match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return cleaned;
  }

  console.warn('Unable to parse date:', dateStr);
  return null; // Return null if parsing fails instead of original string
}

/**
 * Generate unique ID
 */
function generateId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Read file as text
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
