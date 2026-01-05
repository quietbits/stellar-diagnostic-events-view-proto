import React from 'react';
import { ProcessedEvent } from '../types';
import { formatValue, getContractName, groupEventsByContract } from '../utils/eventProcessor';

interface ContractViewProps {
  events: ProcessedEvent[];
}

export const ContractView: React.FC<ContractViewProps> = ({ events }) => {
  const contractGroups = groupEventsByContract(events);
  
  const getContractStats = (contractEvents: ProcessedEvent[]) => {
    const stats = {
      totalEvents: contractEvents.length,
      functionCalls: contractEvents.filter(e => e.type === 'fn_call').length,
      contractEvents: contractEvents.filter(e => e.type === 'contract').length,
      metrics: contractEvents.filter(e => e.type === 'core_metrics').length,
    };
    return stats;
  };
  
  const renderContractPanel = (contractId: string, contractEvents: ProcessedEvent[]) => {
    const stats = getContractStats(contractEvents);
    const contractName = getContractName(contractId);
    
    return (
      <div key={contractId} className="contract-panel">
        <div className="contract-header">
          <h4>{contractName}</h4>
          <div className="contract-id">{contractId !== 'System' ? contractId : 'System Events'}</div>
        </div>
        
        <div className="contract-stats">
          <div className="stat-item">
            <span className="stat-label">Total Events:</span>
            <span className="stat-value">{stats.totalEvents}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Function Calls:</span>
            <span className="stat-value">{stats.functionCalls}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Contract Events:</span>
            <span className="stat-value">{stats.contractEvents}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Metrics:</span>
            <span className="stat-value">{stats.metrics}</span>
          </div>
        </div>
        
        <div className="contract-events">
          <h5>Events:</h5>
          {contractEvents.map(event => (
            <div key={event.id} className={`contract-event-item ${event.type}`}>
              <div className="event-summary">
                <span className="event-type-tag">{event.type}</span>
                <span className="event-function">{event.functionName}</span>
              </div>
              
              <div className="event-data-summary">
                {formatValue(event.data)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="contract-view">
      <h3>Contract Dashboard</h3>
      <div className="contracts-grid">
        {Object.entries(contractGroups).map(([contractId, contractEvents]) =>
          renderContractPanel(contractId, contractEvents)
        )}
      </div>
    </div>
  );
};