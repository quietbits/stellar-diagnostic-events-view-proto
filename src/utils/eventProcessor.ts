import { DiagnosticEvent, ProcessedEvent } from '../types';

export function processEvents(events: DiagnosticEvent[]): ProcessedEvent[] {
  const processed: ProcessedEvent[] = [];
  let callStack: number[] = [];

  events.forEach((event, index) => {
    const topics = event.event.body.v0.topics;
    const firstTopic = topics[0]?.symbol;
    
    let type: ProcessedEvent['type'] = 'contract';
    let functionName: string | undefined;
    let level = callStack.length;

    if (firstTopic === 'fn_call') {
      type = 'fn_call';
      functionName = topics[2]?.symbol;
      callStack.push(index);
    } else if (firstTopic === 'fn_return') {
      type = 'fn_return';
      functionName = topics[1]?.symbol;
      if (callStack.length > 0) {
        callStack.pop();
      }
      level = callStack.length;
    } else if (firstTopic === 'core_metrics') {
      type = 'core_metrics';
      functionName = topics[1]?.symbol;
    } else {
      // Contract event (mint, transfer, etc.)
      type = 'contract';
      // For contract events, don't assume any topic is a function name
      functionName = undefined;
    }

    processed.push({
      id: index,
      type,
      contractId: event.event.contract_id,
      functionName,
      topics: topics.map(t => {
        if (t.symbol) return t.symbol;
        if (t.bytes) return t.bytes;
        if (t.address) return t.address;
        if (t.u32) return t.u32.toString();
        if (t.u64) return t.u64.toString();
        if (t.i128) return t.i128;
        if (t.string) return t.string;
        if (t.bool !== undefined) return t.bool.toString();
        if (t.error) {
          // Handle error objects like {contract: 1}
          if (typeof t.error === 'object') {
            const entries = Object.entries(t.error);
            return `error(${entries.map(([k, v]) => `${k}:${v}`).join(',')})`;
          }
          return `error(${t.error})`;
        }
        if (t.vec) {
          // Handle vector/array topics
          return `[${t.vec.length} items]`;
        }
        return 'unknown';
      }),
      data: event.event.body.v0.data,
      level,
      originalEvent: event
    });
  });

  return processed;
}

export function formatValue(value: any, maxDepth: number = 2, currentDepth: number = 0): string {
  if (value === null || value === undefined) return 'null';
  if (value === 'void') return 'void';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  // Handle Stellar-specific value types
  if (value.address) {
    const addr = value.address;
    if (addr.startsWith('G') || addr.startsWith('C')) {
      // Shorten Stellar addresses and contract IDs
      return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
    }
    return addr;
  }
  if (value.i128) return value.i128;
  if (value.u32) return value.u32.toString();
  if (value.u64) return value.u64.toString();
  if (value.bytes) return `0x${value.bytes.substring(0, 8)}...`;
  if (value.symbol) return value.symbol;
  if (value.string) return `"${value.string}"`;
  if (value.bool !== undefined) return value.bool.toString();
  if (value.error) {
    // Handle error objects like {contract: 1}
    if (typeof value.error === 'object') {
      const entries = Object.entries(value.error);
      return `error(${entries.map(([k, v]) => `${k}:${v}`).join(',')})`;
    }
    return `error(${value.error})`;
  }
  
  // Handle Stellar map structures (key-value pairs)
  if (value.map && Array.isArray(value.map)) {
    if (currentDepth >= maxDepth) return `{${value.map.length} entries}`;
    
    const entries = value.map.map((item: any) => {
      const key = formatValue(item.key, maxDepth, currentDepth + 1);
      const val = formatValue(item.val, maxDepth, currentDepth + 1);
      return `${key}: ${val}`;
    });
    
    return `{${entries.join(', ')}}`;
  }
  
  // Handle arrays (vec)
  if (value.vec) {
    if (currentDepth >= maxDepth) return `[${value.vec.length} items]`;
    const items = value.vec.map((item: any) => formatValue(item, maxDepth, currentDepth + 1));
    return `[${items.join(', ')}]`;
  }
  
  // Handle objects
  if (typeof value === 'object' && value !== null) {
    if (currentDepth >= maxDepth) return '{...}';
    
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    
    const formattedEntries = entries.map(([key, val]) => 
      `${key}: ${formatValue(val, maxDepth, currentDepth + 1)}`
    );
    
    return `{${formattedEntries.join(', ')}}`;
  }
  
  return JSON.stringify(value);
}

export function formatValueWithTypes(value: any, maxDepth: number = 2, currentDepth: number = 0): string {
  if (value === null || value === undefined) return 'null';
  if (value === 'void') return 'void';
  if (typeof value === 'string') return `"${value}" (string)`;
  if (typeof value === 'number') return `${value} (number)`;
  if (typeof value === 'boolean') return `${value} (bool)`;
  
  // Handle Stellar-specific value types with type suffixes
  if (value.address) {
    const addr = value.address;
    if (addr.startsWith('G') || addr.startsWith('C')) {
      // Shorten Stellar addresses and contract IDs
      const shortened = `${addr.substring(0, 4)}…${addr.substring(addr.length - 4)}`;
      return `${shortened} (address)`;
    }
    return `${addr} (address)`;
  }
  if (value.i128) return `${value.i128} (i128)`;
  if (value.u32) return `${value.u32} (u32)`;
  if (value.u64) return `${value.u64} (u64)`;
  if (value.bytes) return `0x${value.bytes.substring(0, 8)}... (bytes)`;
  if (value.symbol) return `${value.symbol} (symbol)`;
  if (value.string) return `"${value.string}" (string)`;
  if (value.bool !== undefined) return `${value.bool} (bool)`;
  if (value.error) {
    // Handle error objects like {contract: 1}
    if (typeof value.error === 'object') {
      const entries = Object.entries(value.error);
      return `error(${entries.map(([k, v]) => `${k}:${v}`).join(',')}) (error)`;
    }
    return `error(${value.error}) (error)`;
  }
  
  // Handle Stellar map structures (key-value pairs)
  if (value.map && Array.isArray(value.map)) {
    if (currentDepth >= maxDepth) return `{${value.map.length} entries} (map)`;
    
    const entries = value.map.map((item: any) => {
      const key = formatValueWithTypes(item.key, maxDepth, currentDepth + 1);
      const val = formatValueWithTypes(item.val, maxDepth, currentDepth + 1);
      return `${key}: ${val}`;
    });
    
    return `{${entries.join(', ')}} (map)`;
  }
  
  // Handle arrays (vec) with type suffix
  if (value.vec) {
    if (currentDepth >= maxDepth) return `[${value.vec.length} items] (vec)`;
    const items = value.vec.map((item: any) => formatValueWithTypes(item, maxDepth, currentDepth + 1));
    return `[${items.join(', ')}] (vec)`;
  }
  
  // Handle objects with type suffix
  if (typeof value === 'object' && value !== null) {
    if (currentDepth >= maxDepth) return '{...} (object)';
    
    const entries = Object.entries(value);
    if (entries.length === 0) return '{} (object)';
    
    const formattedEntries = entries.map(([key, val]) => 
      `${key}: ${formatValueWithTypes(val, maxDepth, currentDepth + 1)}`
    );
    
    return `{${formattedEntries.join(', ')}} (object)`;
  }
  
  return `${JSON.stringify(value)} (unknown)`;
}

export function getContractName(contractId: string | null): string {
  if (!contractId) return 'System';
  return `${contractId.substring(0, 4)}...${contractId.substring(contractId.length - 4)}`;
}

export function groupEventsByContract(events: ProcessedEvent[]): Record<string, ProcessedEvent[]> {
  const groups: Record<string, ProcessedEvent[]> = {};
  
  events.forEach(event => {
    const key = event.contractId || 'System';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
  });
  
  return groups;
}