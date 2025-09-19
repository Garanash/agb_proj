export interface WorkflowNodeData {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'webhook' | 'email' | 'telegram' | 'database' | 'delay';
  name: string;
  x: number;
  y: number;
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  color?: string;
}

export interface WorkflowConnectionData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string;
  toInput: string;
}

export interface WorkflowData {
  nodes: WorkflowNodeData[];
  connections: WorkflowConnectionData[];
  name?: string;
  id?: string;
  createdAt?: string;
}
