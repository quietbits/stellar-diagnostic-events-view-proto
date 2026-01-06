export interface DiagnosticEvent {
  in_successful_contract_call: boolean;
  event: {
    ext: string;
    contract_id: string | null;
    type_: 'diagnostic' | 'contract';
    body: {
      v0: {
        topics: Array<{
          symbol?: string;
          bytes?: string;
          address?: string;
          u32?: number;
          u64?: number;
          i128?: string;
          string?: string;
          bool?: boolean;
          error?: any;
          vec?: any[];
        }>;
        data: any;
      };
    };
  };
}

export interface TransactionData {
  jsonrpc: string;
  id: number;
  result: {
    latestLedger: number;
    latestLedgerCloseTime: string;
    oldestLedger: number;
    oldestLedgerCloseTime: string;
    status: string;
    txHash: string;
    applicationOrder: number;
    feeBump: boolean;
    envelopeJson: any;
    resultJson: {
      fee_charged: string;
      result: any;
      ext: string;
    };
    resultMetaJson: {
      v4: {
        ext: string;
        tx_changes_before: any[];
        operations: any[];
        diagnostic_events: DiagnosticEvent[];
      };
    };
  };
}

export interface ProcessedEvent {
  id: number;
  type: 'fn_call' | 'fn_return' | 'contract' | 'core_metrics';
  contractId: string | null;
  functionName?: string;
  topics: string[];
  data: any;
  level: number;
  originalEvent: DiagnosticEvent;
}