import React from 'react';

interface TransactionSelectorProps {
  selectedFile: string;
  onFileChange: (file: string) => void;
}

export const TransactionSelector: React.FC<TransactionSelectorProps> = ({ 
  selectedFile, 
  onFileChange 
}) => {
  const transactions = [
    { file: 'response-1.json', label: 'Transaction 1 (KALE)' },
    { file: 'response-2.json', label: 'Transaction 2 (SoroSwap)' },
    { file: 'response-3-failed.json', label: 'Transaction 3 (Failed)' },
    { file: 'response-5-mixed.json', label: 'Transaction 4 (Mixed)' }
  ];

  return (
    <div className="transaction-selector">
      <h3>Select Transaction:</h3>
      <div className="transaction-buttons">
        {transactions.map(tx => (
          <button
            key={tx.file}
            className={`tx-button ${selectedFile === tx.file ? 'active' : ''}`}
            onClick={() => onFileChange(tx.file)}
          >
            {tx.label}
          </button>
        ))}
      </div>
    </div>
  );
};