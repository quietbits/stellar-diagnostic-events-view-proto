import React, { useState } from 'react';
import { ProcessedEvent } from '../types';
import { formatValueWithTypes, getContractName } from '../utils/eventProcessor';

interface CallStackViewProps {
  events: ProcessedEvent[];
}

interface CallStackNode {
  event: ProcessedEvent;
  children: CallStackNode[];
  isExpanded: boolean;
  returnEvent?: ProcessedEvent; // Paired return event for function calls
}

export const CallStackView: React.FC<CallStackViewProps> = ({ events }) => {
  // Initialize with all function calls expanded by default
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(() => {
    return new Set(events.filter(e => e.type === 'fn_call').map(e => e.id));
  });

  // Build hierarchical structure from flat events
  const buildCallStack = (events: ProcessedEvent[]): CallStackNode[] => {
    const stack: CallStackNode[] = [];
    const callStack: CallStackNode[] = [];

    events.forEach(event => {
      if (event.type === 'fn_call') {
        const node: CallStackNode = {
          event,
          children: [],
          isExpanded: expandedNodes.has(event.id)
        };

        // Add to current level
        if (callStack.length === 0) {
          stack.push(node);
        } else {
          callStack[callStack.length - 1].children.push(node);
        }
        callStack.push(node);
      } else if (event.type === 'fn_return') {
        // Find the matching function call and pair it with this return
        if (callStack.length > 0) {
          const currentCall = callStack[callStack.length - 1];
          // Only pair if the function names match
          if (currentCall.event.functionName === event.functionName) {
            currentCall.returnEvent = event;
          }
          callStack.pop();
        }
      } else {
        // Contract events and metrics go to current level
        const node: CallStackNode = {
          event,
          children: [],
          isExpanded: expandedNodes.has(event.id)
        };

        if (callStack.length === 0) {
          stack.push(node);
        } else {
          callStack[callStack.length - 1].children.push(node);
        }
      }
    });

    return stack;
  };

  const toggleExpanded = (eventId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderStackNode = (node: CallStackNode, depth: number = 0): React.ReactNode => {
    const { event } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(event.id);
    const indentLevel = depth * 24;

    return (
      <div key={event.id} className="stack-node">
        <div 
          className={`stack-frame ${event.type}`}
          style={{ paddingLeft: `${indentLevel + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpanded(event.id)}
              style={{ left: `${indentLevel}px` }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}

          {/* Stack Frame Content */}
          <div className="frame-content">
            <div className="frame-header">
              {event.type === 'fn_call' && (
                <>
                  <span className="frame-type">FN_CALL</span>
                  <span className="frame-function">{event.functionName || 'unknown'} ({formatValueWithTypes(event.data)})</span>
                </>
              )}
              
              {event.type === 'contract' && (
                <>
                  <span className="frame-type">contract event</span>
                  <span className="frame-function">[{event.topics.join(', ')}]</span>
                </>
              )}
              
              {event.type === 'fn_return' && (
                <>
                  <span className="frame-type">FN_RETURN</span>
                  <span className="frame-function">{event.functionName || 'unknown'}</span>
                </>
              )}
              
              {event.type === 'core_metrics' && (
                <>
                  <span className="frame-type">CORE_METRICS</span>
                  <span className="frame-function">{event.functionName || 'unknown'}</span>
                </>
              )}
              
              <span className="frame-contract">
                at {getContractName(event.contractId)}
              </span>
            </div>

            {/* Additional details */}
            <div className="frame-details">
              {event.type === 'fn_call' && node.returnEvent && (
                <div className="frame-return-inline">
                  <span className="return-label">returns:</span>
                  <span className="return-arrow">→</span>
                  <span className="return-value">{formatValueWithTypes(node.returnEvent.data)}</span>
                </div>
              )}
              
              {event.type === 'fn_return' && (
                <span className="frame-return">
                  → {formatValueWithTypes(event.data)}
                </span>
              )}
              
              {event.type === 'contract' && (
                <div className="frame-event">
                  <div className="event-data">
                    data: {formatValueWithTypes(event.data)}
                  </div>
                </div>
              )}
              
              {event.type === 'core_metrics' && (
                <span className="frame-metric">
                  {formatValueWithTypes(event.data)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="stack-children">
            {node.children.map(child => renderStackNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const callStack = buildCallStack(events);

  return (
    <div className="call-stack-view">
      <div className="stack-header">
        <h3>Call Stack Trace</h3>
        <div className="stack-controls">
          <button 
            className="control-button"
            onClick={() => setExpandedNodes(new Set(events.filter(e => e.type === 'fn_call').map(e => e.id)))}
          >
            Expand All
          </button>
          <button 
            className="control-button"
            onClick={() => setExpandedNodes(new Set())}
          >
            Collapse All
          </button>
        </div>
      </div>
      
      <div className="stack-container">
        {callStack.map(node => renderStackNode(node))}
      </div>
    </div>
  );
};