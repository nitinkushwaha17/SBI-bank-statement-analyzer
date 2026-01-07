import { useState, useCallback } from 'react';
import { parseTSV, readFileAsText } from '../utils/tsvParser';
import './FileUpload.css';

function FileUpload({ onTransactionsLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      setError('Please upload a TSV file (.tsv or .txt)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content = await readFileAsText(file);
      const transactions = parseTSV(content);

      if (transactions.length === 0) {
        setError('No valid transactions found in the file');
        return;
      }

      onTransactionsLoaded(transactions);
    } catch (err) {
      setError(err.message || 'Failed to parse the file');
    } finally {
      setLoading(false);
    }
  }, [onTransactionsLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  return (
    <div className="file-upload-container">
      {/* Animated Stars Background */}
      <div className="stars-container">
        <div className="stars stars-1"></div>
        <div className="stars stars-2"></div>
        <div className="stars stars-3"></div>
      </div>
      
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Processing file...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📁</div>
            <h3>Upload Bank Statement</h3>
            <p>Drag and drop your SBI bank statement (TSV format) here</p>
            <p className="or-text">or</p>
            <label className="file-input-label">
              <input
                type="file"
                accept=".tsv,.txt"
                onChange={handleInputChange}
                className="file-input"
              />
              Browse Files
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="upload-help">
        <h4>How to get your SBI bank statement in TSV format:</h4>
        <ol>
          <li>Log in to SBI Internet Banking</li>
          <li>Go to Account Statement</li>
          <li>Select the date range</li>
          <li>Download as Excel/CSV and save as TSV, or copy-paste into a text file with tab-separated values</li>
        </ol>
        <p className="expected-format">
          <strong>Expected columns:</strong> Txn Date, Value Date, Description, Ref No./Cheque No., Debit, Credit, Balance
        </p>
      </div>
    </div>
  );
}

export default FileUpload;
