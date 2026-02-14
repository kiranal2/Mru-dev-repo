"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import React from "react";
import { FinancialAGUIClient, AGUIEventUnion, TaskStartedEvent, TaskStepStartedEvent, TaskStepFinishedEvent, TaskStepProgressEvent, TaskFinishedEvent, TaskErrorEvent, InterruptRequestEvent } from "@/lib/financial-agui-client";
import { TaskProgressTracker, TaskStep } from "@/components/ui/task-progress-tracker";
import { AgentStatusIndicator, AgentStatus } from "@/components/ui/agent-status-indicator";
import { InterruptModal, InterruptEvent } from "@/components/ui/interrupt-modal";
import { FinancialWorkflow, FinancialWorkflow as FinancialWorkflowType } from "@/components/ui/financial-workflow";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Clock, AlertCircle, Loader2, Play, Pause, RotateCcw, Bot, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import PrivateRoute from "@/components/private-route";

interface FinancialTaskState {
  steps: {
    id: string;
    title: string;
    description: string;
    status: "pending" | "running" | "completed" | "error";
    progress?: number;
    agent?: string;
    timestamp?: string;
  }[];
  currentStep?: string;
  overallProgress: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
}

interface FinancialTasksProps {
  params: {
    integrationId: string;
  };
}

const FinancialTasks: React.FC<FinancialTasksProps> = ({ params }) => {
  const { integrationId } = params;
  const [taskState, setTaskState] = useState<FinancialTaskState>({
    steps: [],
    currentStep: undefined,
    overallProgress: 0,
    status: 'idle',
    error: undefined
  });
  
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: 'supervisor', name: 'Financial Supervisor', status: 'idle' },
    { id: 'ap_agent', name: 'AP Analysis Agent', status: 'idle' },
    { id: 'ar_agent', name: 'AR Analysis Agent', status: 'idle' }
  ]);
  
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const clientRef = useRef<FinancialAGUIClient | null>(null);

  // Initialize Financial AG-UI Client
  useEffect(() => {
    const client = new FinancialAGUIClient({
      serverUrl: 'http://localhost:8002',
      onTaskStarted: (event: TaskStartedEvent) => {
        console.log('🚀 Task started:', event);
        setTaskState(prev => ({
          ...prev,
          steps: event.steps.map((step: any) => ({
            id: step.id,
            title: step.title,
            description: step.description,
            status: step.status as 'pending' | 'running' | 'completed' | 'error',
            progress: 0,
            agent: 'supervisor',
            timestamp: new Date().toISOString()
          })),
          status: 'running',
          currentStep: event.steps[0]?.id,
          overallProgress: 0
        }));
      },
      onTaskStepStarted: (event: TaskStepStartedEvent) => {
        console.log('👣 Step started:', event);
        setTaskState(prev => ({
          ...prev,
          currentStep: event.stepId,
          steps: prev.steps.map(step => 
            step.id === event.stepId 
              ? { ...step, status: 'running', agent: event.agent, timestamp: new Date().toISOString() }
              : step
          )
        }));
        
        // Update agent status
        setAgents(prev => prev.map(agent => 
          agent.name.toLowerCase().includes(event.agent?.toLowerCase() || '') 
            ? { ...agent, status: 'active', currentTask: event.stepTitle }
            : agent.status === 'active' ? { ...agent, status: 'idle' } : agent
        ));
      },
      onTaskStepProgress: (event: TaskStepProgressEvent) => {
        console.log('📊 Step progress:', event);
        setTaskState(prev => ({
          ...prev,
          steps: prev.steps.map(step => 
            step.id === event.stepId 
              ? { ...step, progress: event.progress }
              : step
          ),
          overallProgress: Math.round(
            prev.steps.reduce((acc, step) => acc + (step.progress || 0), 0) / prev.steps.length
          )
        }));
      },
      onTaskStepFinished: (event: TaskStepFinishedEvent) => {
        console.log('✅ Step finished:', event);
        setTaskState(prev => ({
          ...prev,
          steps: prev.steps.map(step => 
            step.id === event.stepId 
              ? { ...step, status: 'completed', progress: 100, timestamp: new Date().toISOString() }
              : step
          ),
          overallProgress: Math.round(
            prev.steps.reduce((acc, step) => 
              acc + (step.id === event.stepId ? 100 : step.progress || 0), 0
            ) / prev.steps.length
          )
        }));
        
        // Update agent status
        setAgents(prev => prev.map(agent => 
          agent.status === 'active' 
            ? { ...agent, status: 'completed' }
            : agent
        ));
      },
      onTaskFinished: (event: TaskFinishedEvent) => {
        console.log('🎉 Task finished:', event);
        setTaskState(prev => ({
          ...prev,
          status: 'completed',
          overallProgress: 100
        }));
        
        setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle' })));
      },
      onTaskError: (event: TaskErrorEvent) => {
        console.log('❌ Task error:', event);
        setTaskState(prev => ({
          ...prev,
          status: 'error',
          error: event.error,
          steps: prev.steps.map(step => 
            step.id === event.stepId 
              ? { ...step, status: 'error' }
              : step
          )
        }));
        
        setAgents(prev => prev.map(agent => 
          agent.status === 'active' 
            ? { ...agent, status: 'error' }
            : agent
        ));
      },
      onInterruptRequest: (event: InterruptRequestEvent) => {
        console.log('🛑 Interrupt request:', event);
        setCurrentInterrupt({
          interruptId: event.interruptId,
          message: event.message,
          options: event.options,
          agent: event.agent,
          context: event.context,
          timestamp: event.timestamp
        });
        setShowInterrupt(true);
      },
      onConnect: () => {
        setIsConnected(true);
        console.log('Connected to Financial Task Server');
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('Disconnected from Financial Task Server');
      }
    });

    clientRef.current = client;
    
    const connectTimer = setTimeout(() => {
      client.connect().catch(console.error);
    }, 100);

    return () => {
      clearTimeout(connectTimer);
      client.disconnect();
    };
  }, []);

  const handleStartTask = async () => {
    if (!clientRef.current || isLoading) return;
    
    setIsLoading(true);
    try {
      await clientRef.current.sendPrompt("Start comprehensive financial analysis workflow");
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseTask = () => {
    setTaskState(prev => ({ ...prev, status: 'paused' }));
  };

  const handleResumeTask = () => {
    setTaskState(prev => ({ ...prev, status: 'running' }));
  };

  const handleResetTask = () => {
    setTaskState({
      steps: [],
      currentStep: undefined,
      overallProgress: 0,
      status: 'idle',
      error: undefined
    });
    setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle' })));
  };

  const handleInterruptSelect = async (option: any) => {
    if (!clientRef.current || !currentInterrupt) return;
    
    try {
      await clientRef.current.sendInterruptResponse(currentInterrupt.interruptId, option.value);
      setShowInterrupt(false);
      setCurrentInterrupt(null);
    } catch (error) {
      console.error('Error sending interrupt response:', error);
    }
  };

  const workflow: FinancialWorkflow = {
    id: 'financial_analysis',
    name: 'Comprehensive Financial Analysis',
    description: 'Multi-agent workflow for AP/AR analysis with real-time progress tracking',
    status: taskState.status,
    progress: taskState.overallProgress,
    steps: taskState.steps.map(step => ({
      id: step.id,
      name: step.title,
      status: step.status,
      agent: step.agent
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-white font-[Inter,system-ui,sans-serif]">
      {/* Top border line */}
      <div 
        className="h-px w-full" 
        style={{ backgroundColor: 'rgba(14, 42, 82, 0.16)' }}
      />
      
      {/* Top App Bar */}
      <header className="h-14 bg-transparent border-b border-[rgba(14,42,82,0.16)] flex items-center justify-between px-6">
        <div className="flex items-center">
          <img
            src="/meeru-logo.png"
            alt="Meeru AI Logo"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#DCEAF6]">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-xs text-[#334155] font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-4">
              Financial Analysis Workflow
            </h1>
            <p className="text-lg text-[#7C8A9A] max-w-2xl mx-auto">
              Experience AI-powered financial analysis with real-time progress tracking, 
              multi-agent coordination, and human-in-the-loop decision making.
            </p>
          </div>

          {/* Workflow Component */}
          <FinancialWorkflow
            workflow={workflow}
            onStart={handleStartTask}
            onPause={handlePauseTask}
            onResume={handleResumeTask}
            onReset={handleResetTask}
          />

          {/* Quick Actions */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => clientRef.current?.sendPrompt("Analyze Apple's AP aging report")}
              disabled={!isConnected || isLoading}
              className="px-6 py-3 bg-[#0A3B77] text-white rounded-lg hover:bg-[#0A3B77]/90 transition-colors duration-200 disabled:opacity-50"
            >
              AP Analysis Example
            </button>
            <button
              onClick={() => clientRef.current?.sendPrompt("Get Microsoft's AR aging details")}
              disabled={!isConnected || isLoading}
              className="px-6 py-3 bg-[#0A3B77] text-white rounded-lg hover:bg-[#0A3B77]/90 transition-colors duration-200 disabled:opacity-50"
            >
              AR Analysis Example
            </button>
            <button
              onClick={() => clientRef.current?.sendPrompt("Run comprehensive financial analysis")}
              disabled={!isConnected || isLoading}
              className="px-6 py-3 bg-[#0A3B77] text-white rounded-lg hover:bg-[#0A3B77]/90 transition-colors duration-200 disabled:opacity-50"
            >
              Combined Analysis
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-[#EEF8FF] border border-[#DCEAF6] rounded-lg">
            <h3 className="text-lg font-semibold text-[#334155] mb-3">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#7C8A9A]">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#6B7EF3] text-white flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <strong className="text-[#334155]">Start Analysis:</strong> Click any example button to begin a financial analysis workflow
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#6B7EF3] text-white flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <strong className="text-[#334155]">Watch Progress:</strong> See real-time updates as agents work through each step
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#6B7EF3] text-white flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <strong className="text-[#334155]">Make Decisions:</strong> Provide input when the system needs human guidance
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Interrupt Modal */}
      {currentInterrupt && (
        <InterruptModal
          interrupt={currentInterrupt}
          onRespond={handleInterruptSelect}
          onClose={() => setShowInterrupt(false)}
          isOpen={showInterrupt}
        />
      )}
      </div>
    </PrivateRoute>
  );
};

export default FinancialTasks;
