export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface TaskStartedEvent {
  taskId: string;
  steps: TaskStep[];
  timestamp: string;
}

export interface TaskStepStartedEvent {
  taskId: string;
  stepId: string;
  stepTitle: string;
  agent: string;
  timestamp: string;
}

export interface TaskStepProgressEvent {
  taskId: string;
  stepId: string;
  progress: number;
  timestamp: string;
}

export interface TaskStepFinishedEvent {
  taskId: string;
  stepId: string;
  result?: any;
  timestamp: string;
}

export interface TaskFinishedEvent {
  taskId: string;
  result?: any;
  timestamp: string;
}

export interface TaskErrorEvent {
  taskId: string;
  stepId?: string;
  error: string;
  timestamp: string;
}

export interface InterruptRequestEvent {
  interruptId: string;
  message: string;
  options: Array<{ value: string; label: string }>;
  agent: string;
  context?: any;
  timestamp: string;
}

export type AGUIEventUnion = 
  | TaskStartedEvent
  | TaskStepStartedEvent
  | TaskStepProgressEvent
  | TaskStepFinishedEvent
  | TaskFinishedEvent
  | TaskErrorEvent
  | InterruptRequestEvent;

export interface FinancialAGUIClientConfig {
  serverUrl: string;
  onTaskStarted?: (event: TaskStartedEvent) => void;
  onTaskStepStarted?: (event: TaskStepStartedEvent) => void;
  onTaskStepProgress?: (event: TaskStepProgressEvent) => void;
  onTaskStepFinished?: (event: TaskStepFinishedEvent) => void;
  onTaskFinished?: (event: TaskFinishedEvent) => void;
  onTaskError?: (event: TaskErrorEvent) => void;
  onInterruptRequest?: (event: InterruptRequestEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class FinancialAGUIClient {
  private config: FinancialAGUIClientConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(config: FinancialAGUIClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Don't connect if already disposed
    if (this.disposed) {
      return;
    }

    try {
      this.ws = new WebSocket(this.config.serverUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to Financial Task Server');
        this.reconnectAttempts = 0;
        this.config.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Financial Task Server');
        this.config.onDisconnect?.();
        // Only attempt reconnect if not intentionally disposed
        if (!this.disposed) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error connecting to server:', error);
      throw error;
    }
  }

  disconnect(): void {
    // Mark as disposed to prevent any further reconnection attempts
    this.disposed = true;

    // Clear any pending reconnect timer
    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'task_started':
        this.config.onTaskStarted?.(data);
        break;
      case 'task_step_started':
        this.config.onTaskStepStarted?.(data);
        break;
      case 'task_step_progress':
        this.config.onTaskStepProgress?.(data);
        break;
      case 'task_step_finished':
        this.config.onTaskStepFinished?.(data);
        break;
      case 'task_finished':
        this.config.onTaskFinished?.(data);
        break;
      case 'task_error':
        this.config.onTaskError?.(data);
        break;
      case 'interrupt_request':
        this.config.onInterruptRequest?.(data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private attemptReconnect(): void {
    if (this.disposed) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimerId = setTimeout(() => {
        this.reconnectTimerId = null;
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  async sendPrompt(prompt: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'start_task',
      prompt,
      timestamp: new Date().toISOString()
    }));
  }

  async sendInterruptResponse(interruptId: string, value: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'interrupt_response',
      interruptId,
      value,
      timestamp: new Date().toISOString()
    }));
  }
}
