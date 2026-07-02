import React, { useState, useEffect } from 'react';
import { Play, Search, Filter, Shield, Activity, Terminal, AlertCircle, Layers, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToolModule, NodeStatus, EventPriority, Workflow } from '../../types';
import { ToolRunner } from '../../lib/toolRunner';
import { useNodeStore } from '../../store/useNodeStore';
import { WorkflowEngine } from '../../lib/core/workflowEngine';

interface ToolbeltPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const ToolbeltPanel = ({ isOpen = true, onToggle }: ToolbeltPanelProps) => {
  const [tools, setTools] = useState<ToolModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<any[]>([]);
  const [confirming, setConfirming] = useState<ToolModule | Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'tools' | 'workflows'>('tools');
  const [selectedToolInputs, setSelectedToolInputs] = useState<Record<string, Record<string, string>>>({});
  
  const emitEvent = useNodeStore(state => state.emitEvent);
  const workflows = useNodeStore(state => state.workflows);
  const userRole = 'operator'; // This would come from auth context in a real app

  useEffect(() => {
    fetch('/api/toolbelt/list')
      .then((res) => res.json())
      .then((data) => {
        setTools(data);
        
        // Initialize default inputs from schemas
        const defaults: Record<string, Record<string, string>> = {};
        data.forEach((tool: ToolModule) => {
          if (tool.inputSchema?.properties) {
            defaults[tool.id] = {};
            Object.keys(tool.inputSchema.properties).forEach((key) => {
              defaults[tool.id][key] = tool.inputSchema.properties[key].default || '';
            });
          }
        });
        setSelectedToolInputs(defaults);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch tools (server may be starting):', err);
        setLoading(false);
      });
  }, []);

  const handleExecute = async (item: ToolModule | Workflow) => {
    // Confirmation gate for risky tools or workflows
    const isWorkflow = 'steps' in item;
    if (isWorkflow || (item as ToolModule).category === 'system' || (item as ToolModule).category === 'automation' || (item as ToolModule).id === 'bounded_blast_radius') {
      setConfirming(item);
      return;
    }
    await executeTool(item as ToolModule);
  };

  const executeTool = async (tool: ToolModule) => {
    setExecuting(tool.id);
    setError(null);
    setConfirming(null);
    const input = selectedToolInputs[tool.id] || {};
    emitEvent('T1', NodeStatus.ACTIVE, EventPriority.NORMAL, { tool: tool.name, params: input });

    try {
      const runner = ToolRunner.getInstance();
      const result = await runner.execute(tool, input, userRole);
      setTrace(prev => [{ type: 'tool', name: tool.name, result, timestamp: Date.now() }, ...prev].slice(0, 5));
      emitEvent('T1', NodeStatus.RESPONDING, EventPriority.NORMAL, result);
    } catch (err: any) {
      console.error('Tool execution error:', err);
      setError(err.message || 'Execution failed');
      emitEvent('T1', NodeStatus.ERROR, EventPriority.NORMAL, { error: 'Tool Execution Failed', details: err });
    } finally {
      setExecuting(null);
    }
  };

  const executeWorkflow = async (workflow: Workflow) => {
    setExecuting(workflow.id);
    setError(null);
    setConfirming(null);
    
    try {
      const engine = WorkflowEngine.getInstance();
      await engine.execute(workflow, { serverStatus: 'online', latency: 50 });
      setTrace(prev => [{ type: 'workflow', name: workflow.name, result: 'Success', timestamp: Date.now() }, ...prev].slice(0, 5));
    } catch (err: any) {
      console.error('Workflow execution error:', err);
      setError(err.message || 'Workflow failed');
    } finally {
      setExecuting(null);
    }
  };

  const filteredTools = tools.filter((t) => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWorkflows = workflows.filter((w) => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/10 w-80">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-mono text-sm tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            TOOLBELT
          </h2>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-[10px] text-white/50 font-mono mr-1">SECURE</span>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors flex items-center justify-center border border-white/5"
                title="Collapse Toolbelt"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search tools..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 mt-4 p-1 bg-white/5 rounded-lg">
          <button 
            onClick={() => setActiveTab('tools')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold tracking-widest transition-all ${activeTab === 'tools' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Box className="w-3 h-3" />
            TOOLS
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold tracking-widest transition-all ${activeTab === 'workflows' ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Layers className="w-3 h-3" />
            WORKFLOWS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {confirming && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-xl mb-4"
          >
            <h4 className="text-amber-500 text-xs font-bold mb-2 uppercase tracking-widest">Confirm Execution</h4>
            <p className="text-[10px] text-white/70 mb-4 leading-relaxed">
              {'steps' in confirming ? 'Workflow' : 'Tool'} <span className="text-amber-400 font-bold">"{confirming.name}"</span> requires confirmation. Confirm execution?
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => 'steps' in confirming ? executeWorkflow(confirming) : executeTool(confirming)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold py-2 rounded-lg transition-colors"
              >
                CONFIRM
              </button>
              <button 
                onClick={() => setConfirming(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-lg transition-colors"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-400 font-mono leading-relaxed">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activeTab === 'tools' ? (
              filteredTools.map((tool) => (
                <motion.div
                  key={`tool-module-${tool.id}-${tool.category}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white text-sm font-medium">{tool.name}</h3>
                      <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{tool.category}</span>
                    </div>
                    <button 
                      onClick={() => handleExecute(tool)}
                      disabled={executing === tool.id}
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors disabled:opacity-50"
                    >
                      {executing === tool.id ? (
                        <Activity className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2 mb-3 leading-relaxed">
                    {tool.description}
                  </p>

                  {tool.inputSchema?.properties && (
                    <div className="mb-4 space-y-2.5 border-t border-white/5 pt-3" onClick={(e) => e.stopPropagation()}>
                      {Object.keys(tool.inputSchema.properties).map((key) => {
                        const prop = tool.inputSchema.properties[key];
                        return (
                          <div key={`${tool.id}-param-${key}`} className="space-y-1">
                            <label className="text-[8px] text-white/40 font-mono uppercase tracking-wider block">{prop.label}</label>
                            {prop.type === 'textarea' ? (
                              <textarea
                                value={selectedToolInputs[tool.id]?.[key] || ''}
                                onChange={(e) => setSelectedToolInputs(prev => ({
                                  ...prev,
                                  [tool.id]: {
                                    ...(prev[tool.id] || {}),
                                    [key]: e.target.value
                                  }
                                }))}
                                placeholder={prop.placeholder}
                                className="w-full h-16 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-mono focus:border-blue-500 focus:outline-none resize-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={selectedToolInputs[tool.id]?.[key] || ''}
                                onChange={(e) => setSelectedToolInputs(prev => ({
                                  ...prev,
                                  [tool.id]: {
                                    ...(prev[tool.id] || {}),
                                    [key]: e.target.value
                                  }
                                }))}
                                placeholder={prop.placeholder}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-mono focus:border-blue-500 focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {(tool.permissions || []).map((p) => (
                      <span key={`tool-${tool.id}-permission-${p}`} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40 font-mono">
                        {p}
                      </span>
                    ))}
                    <span className="ml-auto text-[9px] text-white/30 font-mono">v{tool.version || '1.0.0'}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              filteredWorkflows.length > 0 ? (
                filteredWorkflows.map((workflow) => (
                  <motion.div
                    key={`workflow-module-${workflow.id}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white text-sm font-medium">{workflow.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Workflow</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                            workflow.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            workflow.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                            workflow.status === 'running' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                            'bg-white/5 text-white/40'
                          }`}>
                            {workflow.status}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleExecute(workflow)}
                        disabled={executing === workflow.id}
                        className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 transition-colors disabled:opacity-50"
                      >
                        {executing === workflow.id ? (
                          <Activity className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2 mb-3 leading-relaxed">
                      {workflow.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">
                        {workflow.steps.length} STEPS
                      </span>
                      {workflow.lastRun && (
                        <span className="ml-auto text-[9px] text-white/30 font-mono">
                          LAST RUN: {new Date(workflow.lastRun).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center p-6 border border-dashed border-white/10 rounded-xl">
                  <Layers className="w-8 h-8 text-white/10 mb-4" />
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">No workflows defined</p>
                  <p className="text-[9px] text-white/20 mt-2">Sync with FiveM to unlock automation chains</p>
                </div>
              )
            )}
          </AnimatePresence>
        )}

        {trace.length > 0 && (
          <div className="mt-8 space-y-2">
            <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">EXECUTION TRACE</h3>
            {trace.map((t, i) => (
              <div key={`trace-${t.type}-${t.name}-${t.timestamp}-${i}`} className="p-2 bg-white/2 border border-white/5 rounded-lg font-mono text-[9px] text-white/40">
                <div className="flex justify-between mb-1">
                  <span className={t.type === 'workflow' ? 'text-purple-500' : 'text-blue-500'}>{t.name}</span>
                  <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="truncate text-white/20">{JSON.stringify(t.result)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
