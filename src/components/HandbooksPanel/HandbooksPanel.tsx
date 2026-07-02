/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Book, Plus, History, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Handbook } from '../../types';
import { useNodeStore } from '../../store/useNodeStore';

interface HandbooksPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const HandbooksPanel = ({ isOpen = true, onToggle }: HandbooksPanelProps) => {
  const [handbooks, setHandbooks] = useState<Handbook[]>([
    {
      id: 'h1',
      topic: 'NPC Spawn Failures',
      slug: 'npc-spawn-failures',
      content: '# NPC Spawn Failures\n\nWhen spawning NPCs in FiveM, ensure the resource state is `started`.',
      tags: ['fivem', 'spawn', 'debug'],
      version: 4,
      status: 'active',
      authorUid: 'system',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now()
    },
    {
      id: 'h2',
      topic: 'Memory Buffer Overflows',
      slug: 'memory-buffer-overflows',
      content: '# Memory Buffer Overflows\n\nFlush short-term memory every 1000 cycles.',
      tags: ['memory', 'system', 'optimization'],
      version: 1,
      status: 'draft',
      authorUid: 'system',
      createdAt: Date.now() - 43200000,
      updatedAt: Date.now() - 3600000
    }
  ]);

  const [selected, setSelected] = useState<string | null>(null);
  const detectPatterns = useNodeStore(state => state.detectPatterns);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const pattern = detectPatterns();
      if (pattern) setSuggestion(pattern);
    }, 5000);
    return () => clearInterval(interval);
  }, [detectPatterns]);

  const approveSuggestion = () => {
    if (!suggestion) return;
    const newHb: Handbook = {
      id: `h${Date.now()}`,
      topic: `${suggestion.charAt(0).toUpperCase() + suggestion.slice(1)} Pattern`,
      slug: `${suggestion}-pattern`,
      content: `# ${suggestion} Pattern Analysis\n\nDetected repeated occurrence of "${suggestion}" in cognitive streams.`,
      tags: [suggestion, 'auto-generated'],
      version: 1,
      status: 'draft',
      authorUid: 'system',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setHandbooks(prev => [newHb, ...prev]);
    setSuggestion(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-white/10 w-96">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-mono text-sm tracking-widest flex items-center gap-2">
            <Book className="w-4 h-4 text-purple-500" />
            HANDBOOKS
          </h2>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors flex items-center justify-center border border-white/5"
                title="Collapse Handbooks"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-purple-500" />
          </div>
          <span className="text-[10px] text-white/40 font-mono">67% SYNCED</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="space-y-2">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">SUGGESTIONS</h3>
          <AnimatePresence mode="popLayout">
            {suggestion ? (
              <motion.div 
                key="suggestion-card"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white text-xs font-medium">Pattern Detected: "{suggestion}"</h4>
                  <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
                    SCORE: 0.92
                  </span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed mb-3">
                  Repeated occurrence of "{suggestion}" detected in cognitive streams. Suggest formalizing into a handbook entry.
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={approveSuggestion}
                    className="text-[9px] bg-purple-500 text-white px-2 py-1 rounded font-medium hover:bg-purple-600 transition-colors"
                  >
                    APPROVE
                  </button>
                  <button 
                    onClick={() => setSuggestion(null)}
                    className="text-[9px] bg-white/5 text-white/60 px-2 py-1 rounded font-medium hover:bg-white/10 transition-colors"
                  >
                    REJECT
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 bg-white/2 border border-white/5 rounded-xl text-center">
                <p className="text-[10px] text-white/20 font-mono italic">NO NEW PATTERNS DETECTED</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">ACTIVE HANDBOOKS</h3>
          <div className="space-y-2">
            {handbooks.map((hb) => (
              <motion.div
                key={`handbook-entry-${hb.id}-${hb.slug}`}
                onClick={() => setSelected(hb.id)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                  selected === hb.id 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${hb.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`} />
                    <h4 className="text-white text-xs font-medium">{hb.topic}</h4>
                  </div>
                  <span className="text-[9px] text-white/30 font-mono">v{hb.version}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {hb.tags.map((tag) => (
                    <span key={`handbook-${hb.id}-tag-${tag}`} className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-white/40 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[9px] text-white/30 font-mono">
                  <span>Updated {new Date(hb.updatedAt).toLocaleDateString()}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-white/2">
        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
          <div className="flex items-center gap-2">
            <History className="w-3 h-3" />
            <span>VERSION HISTORY</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>SYNCED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
