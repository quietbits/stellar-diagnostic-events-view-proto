import React from 'react';
import { ProcessedEvent } from '../types';
import { formatValueWithTypes, getContractName } from '../utils/eventProcessor';

interface TimelineViewProps {
  events: ProcessedEvent[];
}

interface TimelineNode {
  event: ProcessedEvent;
  children: (ProcessedEvent | TimelineNode)[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  // Build hierarchical structure with proper nesting for all levels
  const buildTimelineNodes = (events: ProcessedEvent[]): (ProcessedEvent | TimelineNode)[] => {
    const result: (ProcessedEvent | TimelineNode)[] = [];
    const callStack: TimelineNode[] = [];

    events.forEach(event => {
      if (event.type === 'fn_call') {
        const node: TimelineNode = {
          event,
          children: []
        };
        
        // Add to appropriate level
        if (callStack.length === 0) {
          result.push(node);
        } else {
          callStack[callStack.length - 1].children.push(node);
        }
        callStack.push(node);
      } else if (event.type === 'fn_return') {
        // Add return event to current function's children
        if (callStack.length > 0) {
          callStack[callStack.length - 1].children.push(event);
          callStack.pop();
        } else {
          // Orphaned return - add as top level
          result.push(event);
        }
      } else {
        // Contract events and metrics go to current function's children
        if (callStack.length > 0) {
          callStack[callStack.length - 1].children.push(event);
        } else {
          // Top-level contract event
          result.push(event);
        }
      }
    });

    return result;
  };

  const renderEvent = (event: ProcessedEvent, nestingLevel: number = 0) => {
    const isCallEvent = event.type === 'fn_call';
    const isReturnEvent = event.type === 'fn_return';
    const isContractEvent = event.type === 'contract';
    const isFailedCall = !event.originalEvent.in_successful_contract_call;
    
    return (
      <div 
        key={`event-${event.id}`} 
        className={`timeline-item ${nestingLevel > 0 ? 'nested' : ''} ${isFailedCall ? 'failed' : ''}`}
        style={{ marginLeft: `${nestingLevel * 2}rem` }}
      >
        <div className="timeline-marker">
          <div className="marker-dot"></div>
          {nestingLevel === 0 && <div className="timeline-line"></div>}
        </div>
        
        <div className={`timeline-content ${event.type}`}>
          <div className="timeline-header">
            <span className="event-index">#{event.id}</span>
            {isFailedCall && <span className="failure-indicator">✗</span>}
            <span className={`event-type-badge ${event.type}`}>
              {event.type === 'contract' ? 'contract event' : event.type}
            </span>
            <span className="function-name">
              {isContractEvent 
                ? `[${event.topics.join(', ')}]`
                : (event.functionName || '')
              }
            </span>
          </div>
          
          <div className="timeline-body">
            <div className="contract-info">
              <strong>Contract:</strong> {getContractName(event.contractId)}
            </div>
            
            {(isCallEvent || isReturnEvent) && (
              <div className="function-info">
                <strong>{isCallEvent ? 'Parameters' : 'Return Value'}:</strong>
                <div className="data-display">{formatValueWithTypes(event.data)}</div>
              </div>
            )}
            
            {isContractEvent && (
              <div className="contract-event-info">
                <strong>Event Data:</strong>
                <div className="data-display">{formatValueWithTypes(event.data)}</div>
              </div>
            )}
            
            {event.type === 'core_metrics' && (
              <div className="metrics-info">
                <strong>Metric:</strong> {event.functionName}
                <div className="data-display">{formatValueWithTypes(event.data)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineItem = (item: ProcessedEvent | TimelineNode, nestingLevel: number = 0): React.ReactNode => {
    if ('children' in item) {
      // This is a TimelineNode (function call with children)
      return (
        <div key={`node-${item.event.id}`} className="timeline-node">
          {/* Render the function call */}
          {renderEvent(item.event, nestingLevel)}
          
          {/* Render all children recursively */}
          {item.children.map(child => 
            renderTimelineItem(child, nestingLevel + 1)
          )}
        </div>
      );
    } else {
      // This is a simple ProcessedEvent
      return renderEvent(item, nestingLevel);
    }
  };

  const timelineStructure = buildTimelineNodes(events);

  return (
    <div className="timeline-view">
      <h3>Execution Timeline</h3>
      <div className="timeline-container">
        {timelineStructure.map(item => renderTimelineItem(item))}
      </div>
    </div>
  );
};