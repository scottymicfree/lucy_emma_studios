/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Activity, 
  Database, 
  Shield, 
  Cpu, 
  Zap, 
  Clock, 
  Network, 
  Terminal,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';
import { CognitiveNode, NodeStatus, EventPriority } from '../../types';
import { useNodeStore } from '../../store/useNodeStore';
import { LTM } from '../../lib/core/Memory/LTM';

interface NodeDetailPanelProps {
  node: CognitiveNode | null;
  onClose: () => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  const nodes = useNodeStore((state) => state.nodes);
  const insightStream = useNodeStore((state) => state.insightStream);
  const metaState = useNodeStore((state) => state.metaState);
  const [ltmStats, setLtmStats] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (node?.lastDecision) {
      LTM.queryPatterns(node.lastDecision).then(patterns => {
        if (patterns && patterns.length > 0) {
          setLtmStats(patterns[0]);
        } else {
          setLtmStats(null);
        }
      });
    } else {
      setLtmStats(null);
    }
  }, [node?.lastDecision]);

  if (!node) return null;

  const connectedNodes = node.connections.map(id => nodes.find(n => n.id === id)).filter(Boolean) as CognitiveNode[];
  const nodeInsights = insightStream.filter(insight => insight.sourceNodeId === node.id);
  const isWinner = metaState.winningNodes.includes(node.id);
  const winningProposal = metaState.winningProposals.find(p => p.nodeId === node.id);
  
  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case NodeStatus.ACTIVE: return 'text-green-400';
      case NodeStatus.ERROR: return 'text-red-400';
      case NodeStatus.THINKING: return 'text-blue-400';
      case NodeStatus.IDLE: return 'text-white/40';
      default: return 'text-amber-400';
    }
  };

  const getPriorityColor = (priority: EventPriority) => {
    switch (priority) {
      case EventPriority.CRITICAL: return 'text-red-500';
      case EventPriority.HIGH: return 'text-amber-500';
      case EventPriority.NORMAL: return 'text-blue-500';
      default: return 'text-white/20';
    }
  };

  const getSubsystemColor = (subsystem: string) => {
    switch (subsystem) {
      case 'core': return 'text-white';
      case 'orchestration': return 'text-blue-400';
      case 'reasoning': return 'text-purple-400';
      case 'memory': return 'text-emerald-400';
      case 'execution': return 'text-cyan-400';
      case 'telemetry': return 'text-amber-400';
      case 'security': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 h-full w-80 bg-[#0a0a0a]/90 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center ${getSubsystemColor(node.subsystem).replace('text-', 'border-').replace('400', '500/20')}`}>
            <Cpu className={`w-5 h-5 ${getSubsystemColor(node.subsystem)}`} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm tracking-tight">{node.id}</h2>
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest leading-none">{node.type}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {isWinner && winningProposal && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-widest">Winning Proposal</h3>
                <p className="text-[10px] text-green-400/70 font-mono mt-0.5">ID: {winningProposal.id}</p>
              </div>
            </div>
            <div className="text-[10px] text-green-400/80 font-mono bg-green-500/10 p-2 rounded">
              Action: {winningProposal.actionChain ? winningProposal.actionChain.join(' → ') : winningProposal.action}
              <br/>
              Domain: <span className="uppercase">{winningProposal.domain || 'system'}</span>
              <br/>
              Score: {winningProposal.score?.toFixed(2)} | Confidence: {(winningProposal.confidence * 100).toFixed(0)}%
            </div>
            {winningProposal.reasoning && (
              <div className="text-[9px] text-green-400/60 font-mono italic bg-black/20 p-2 rounded border border-green-500/10">
                "{winningProposal.reasoning}"
              </div>
            )}
          </div>
        )}

        {/* Decision Lineage */}
        {node.decisionHistory && node.decisionHistory.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">
              <Network className="w-3 h-3" />
              <span>Decision Lineage</span>
            </div>
            <div className="space-y-2">
              {node.decisionHistory.slice().reverse().map((record, idx) => (
                <div key={idx} className="p-2 bg-white/5 rounded border border-white/10 text-[10px] font-mono">
                  <div className="flex justify-between text-white/60 mb-1">
                    <span className="truncate max-w-[120px]" title={record.action}>{record.action}</span>
                    <span className={record.outcome === 'success' ? 'text-green-400' : record.outcome === 'partial_failure' ? 'text-amber-400' : 'text-red-400'}>{record.outcome}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Conf: {(record.confidence * 100).toFixed(0)}%</span>
                    {record.latencyMs !== undefined && <span>{record.latencyMs}ms</span>}
                    <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {record.impact !== undefined && (
                    <div className="text-[8px] text-white/30 mt-1">
                      Impact Score: {record.impact.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LTM Stats */}
        {ltmStats && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">
              <Database className="w-3 h-3" />
              <span>Long-Term Memory</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-white/40">Action Chain:</span>
                <span className="text-white/80 truncate max-w-[150px]" title={ltmStats.actionChain?.join(' → ')}>
                  {ltmStats.actionChain?.join(' → ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Success Rate:</span>
                <span className="text-white/80">{(ltmStats.successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Avg Impact:</span>
                <span className="text-white/80">{ltmStats.avgImpact?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Occurrences:</span>
                <span className="text-white/80">{ltmStats.occurrences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Last Used:</span>
                <span className="text-white/80">
                  {ltmStats.lastUsed?.toDate ? ltmStats.lastUsed.toDate().toLocaleTimeString() : new Date(ltmStats.lastUsed).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Metadata Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">
            <Info className="w-3 h-3" />
            <span>Node Metadata</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Status', value: node.status, color: getStatusColor(node.status), icon: Activity },
              { label: 'Subsystem', value: node.subsystem, color: getSubsystemColor(node.subsystem), icon: Network },
              { label: 'Priority', value: node.priority, color: getPriorityColor(node.priority), icon: Zap },
              { label: 'Position', value: `[${node.position.map(p => p.toFixed(1)).join(', ')}]`, color: 'text-white/40', icon: Database },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-white/20" />
                  <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{item.label}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Connections Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">
            <Zap className="w-3 h-3" />
            <span>Synaptic Connections ({connectedNodes.length})</span>
          </div>
          <div className="space-y-2">
            {connectedNodes.length > 0 ? connectedNodes.map((conn, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] text-white/60 font-mono font-bold">{conn.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/20 font-mono uppercase">{conn.type}</span>
                  <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-white/40 transition-colors" />
                </div>
              </div>
            )) : (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center gap-2 opacity-40">
                <Zap className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase tracking-widest">No active connections</span>
              </div>
            )}
          </div>
        </section>

        {/* Insights Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Node Insights</span>
          </div>
          <div className="space-y-3">
            {nodeInsights.length > 0 ? nodeInsights.map((insight, i) => (
              <div key={insight.id} className="relative pl-4 border-l border-white/10 space-y-1">
                <div className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full border border-[#0a0a0a] ${
                  insight.type === 'critical' ? 'bg-red-500' : 
                  insight.type === 'anomaly' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold uppercase ${
                      insight.type === 'critical' ? 'text-red-400' : 
                      insight.type === 'anomaly' ? 'text-amber-400' : 'text-blue-400'
                    }`}>{insight.type}</span>
                    <span className="text-[8px] text-white/20 font-mono">{new Date(insight.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <span className="text-[8px] text-white/30 font-mono">Score: {insight.score.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed font-mono">
                  {insight.message}
                </p>
              </div>
            )) : (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center gap-2 opacity-40">
                <Sparkles className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase tracking-widest">No recent insights</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2 text-[9px] text-white/20 font-mono uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          <span>Last Updated: {new Date(node.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </motion.div>
  );
};
