import React, { useState, useEffect } from 'react';
import { TransactionData, ProcessedEvent } from './types';
import { processEvents } from './utils/eventProcessor';
import { TransactionSelector } from './components/TransactionSelector';
import { CallStackView } from './components/CallStackView';
import { TimelineView } from './components/TimelineView';
import { ContractView } from './components/ContractView';
import './App.css';

type ViewType = 'timeline' | 'callstack' | 'contract';

function App() {
  const [selectedFile, setSelectedFile] = useState<string>('response-1.json');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('timeline');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransaction(selectedFile);
  }, [selectedFile]);

  const loadTransaction = async (filename: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }
      
      const data: TransactionData = await response.json();
      setTransactionData(data);
      
      const events = data.result.resultMetaJson.v4.diagnostic_events || [];
      const processed = processEvents(events);
      setProcessedEvents(processed);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderActiveView = () => {
    if (loading) return <div className="loading">Loading transaction data...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (processedEvents.length === 0) return <div className="no-data">No diagnostic events found</div>;

    switch (activeView) {
      case 'timeline':
        return <TimelineView events={processedEvents} />;
      case 'callstack':
        return <CallStackView events={processedEvents} />;
      case 'contract':
        return <ContractView events={processedEvents} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Stellar Diagnostic Events Viewer</h1>
        <TransactionSelector 
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
        />
      </header>

      {transactionData && (
        <div className="transaction-info">
          <div className="tx-details">
            <span><strong>Hash:</strong> {transactionData.result.txHash}</span>
            <span><strong>Status:</strong> {transactionData.result.status}</span>
            <span><strong>Fee:</strong> {(parseInt(transactionData.result.resultJson.fee_charged) / 10000000).toFixed(7)} XLM</span>
            <span><strong>Events:</strong> {processedEvents.length}</span>
          </div>
        </div>
      )}

      <nav className="view-tabs">
        <button 
          className={`tab ${activeView === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveView('timeline')}
        >
          Timeline View
        </button>
        <button 
          className={`tab ${activeView === 'callstack' ? 'active' : ''}`}
          onClick={() => setActiveView('callstack')}
        >
          Call Stack Trace
        </button>
        <button 
          className={`tab ${activeView === 'contract' ? 'active' : ''}`}
          onClick={() => setActiveView('contract')}
        >
          Contract Dashboard
        </button>
      </nav>

      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;